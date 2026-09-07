import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RewardedInterstitialAd, RewardedAd, TestIds } from 'react-native-google-mobile-ads';
import { api } from '../api';
import { getConfig } from '../config';
import { useAuth } from '../store';
import { isPushEnabled, enablePush, disablePush } from '../push';
import { checkForUpdate } from '../update';
import { Platform } from 'react-native';

// Profil: push on/off, login/register (optional), editare nume+parola, favorite, sustinere
export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const { user, login, register, logout, refresh } = useAuth();
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [err, setErr] = useState('');
  const [cur, setCur] = useState('');
  const [npw, setNpw] = useState('');
  const [support, setSupport] = useState<any>(null);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    isPushEnabled().then(setPush);
    const cfg = getConfig();
    if (cfg?.support?.enabled) setSupport(cfg.support);
    if (Platform.OS === 'android') checkForUpdate(true).then(setHasUpdate).catch(() => {});
  }, []);

  const togglePush = async (v: boolean) => {
    setPush(v);
    if (v) await enablePush();
    else await disablePush();
  };

  const doAuth = async () => {
    setErr('');
    try {
      if (mode === 'login') await login(email, password);
      else {
        const data = await register(name, email, password);
        if (!data.token) setErr('Verifică emailul pentru activare.');
      }
    } catch (e: any) {
      setErr(e.response?.data?.error === 'email_not_verified' ? 'Cont neconfirmat — verifică emailul.' : 'Date invalide.');
    }
  };

  const saveName = async () => {
    try { await api.patch('/auth/me', { name }); await refresh(); Alert.alert('OK', 'Nume salvat.'); }
    catch { Alert.alert('Eroare', 'Nu s-a salvat.'); }
  };
  const savePw = async () => {
    if (npw.length < 6) { Alert.alert('Eroare', 'Minim 6 caractere.'); return; }
    try { await api.patch('/auth/me/password', { currentPassword: cur, newPassword: npw }); setCur(''); setNpw(''); Alert.alert('OK', 'Parolă schimbată.'); }
    catch { Alert.alert('Eroare', 'Parola curentă e greșită.'); }
  };

  const supportUs = () => {
    const cfg = getConfig();
    const units = Platform.OS === 'ios' ? cfg?.admob?.ios : cfg?.admob?.android;
    const showRewarded = () => {
      if (!units?.rewarded) { Alert.alert('Info', 'Reclamă indisponibilă momentan.'); return; }
      const ad = RewardedAd.createForAdRequest(units.rewarded);
      ad.load();
    };
    if (units?.rewardedInterstitial) {
      const ad = RewardedInterstitialAd.createForAdRequest(
        __DEV__ ? TestIds.REWARDED_INTERSTITIAL : units.rewardedInterstitial
      );
      ad.load();
      setTimeout(showRewarded, 4000);
      // nota: in productie se foloseste onAdEvent LOADED -> show(); fallback rewarded dupa timeout
    } else showRewarded();
  };

  return (
    <ScrollView style={s.wrap}>
      <View style={s.row}>
        <Text style={s.t}>Notificări push</Text>
        <Switch value={push} onValueChange={togglePush} />
      </View>

      {!user ? (
        <View style={s.card}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <TouchableOpacity onPress={() => setMode('login')}><Text style={mode === 'login' ? s.tabOn : s.tab}>Login</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('register')}><Text style={mode === 'register' ? s.tabOn : s.tab}>Register</Text></TouchableOpacity>
          </View>
          {mode === 'register' && <TextInput style={s.in} placeholder="Nume" value={name} onChangeText={setName} />}
          <TextInput style={s.in} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <TextInput style={s.in} placeholder="Parolă" value={password} onChangeText={setPassword} secureTextEntry />
          {!!err && <Text style={s.err}>{err}</Text>}
          <TouchableOpacity style={s.btn} onPress={doAuth}><Text style={s.btnT}>Continuă (opțional)</Text></TouchableOpacity>
          <Text style={s.m}>Contul e opțional — rețetele, votul și favoritele merg și fără.</Text>
        </View>
      ) : (
        <View style={s.card}>
          <Text style={s.t}>{user.name}</Text>
          <Text style={s.m}>{user.email}</Text>
          <TextInput style={s.in} placeholder="Nume nou" value={name} onChangeText={setName} />
          <TouchableOpacity style={s.btn} onPress={saveName}><Text style={s.btnT}>Salvează numele</Text></TouchableOpacity>
          <TextInput style={s.in} placeholder="Parola curentă" value={cur} onChangeText={setCur} secureTextEntry />
          <TextInput style={s.in} placeholder="Parola nouă" value={npw} onChangeText={setNpw} secureTextEntry />
          <TouchableOpacity style={s.btn} onPress={savePw}><Text style={s.btnT}>Schimbă parola</Text></TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.ghost]} onPress={async () => { await logout(); }}><Text>Deconectare</Text></TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={s.card} onPress={() => nav.navigate('Favorites')}>
        <Text style={s.t}>❤ Favoritele mele →</Text>
      </TouchableOpacity>

      {hasUpdate && Platform.OS === 'android' && (
        <TouchableOpacity style={[s.card, { backgroundColor: '#e8f3f9' }]} onPress={() => checkForUpdate(false)}>
          <Text style={s.t}>⬇️ Actualizare disponibilă — apasă pentru detalii</Text>
        </TouchableOpacity>
      )}

      {!!support && (
        <View style={s.card}>
          <Text style={s.t}>{support.title?.ro || 'Susține proiectul'}</Text>
          <Text style={s.m}>{support.text?.ro}</Text>
          <TouchableOpacity style={[s.btn, { backgroundColor: '#065f46' }]} onPress={supportUs}>
            <Text style={s.btnT}>Susține proiectul 🎁</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const s: any = {
  wrap: { flex: 1, backgroundColor: '#fbf9f7' },
  card: { backgroundColor: '#fff', margin: 12, padding: 14, borderRadius: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', margin: 12, marginBottom: 0, padding: 14, borderRadius: 14 },
  t: { fontWeight: '700', fontSize: 15 },
  m: { color: '#5f7a70', fontSize: 12, marginVertical: 6 },
  in: { backgroundColor: '#fbf9f7', borderWidth: 1, borderColor: '#cfdfee', borderRadius: 10, padding: 10, marginBottom: 8 },
  btn: { backgroundColor: '#1486b7', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 8 },
  btnT: { color: '#fff', fontWeight: '700' },
  ghost: { backgroundColor: '#eef4fa' },
  err: { color: 'red', marginBottom: 8 },
  tab: { fontSize: 15, color: '#888' },
  tabOn: { fontSize: 15, fontWeight: '700', color: '#1486b7' }
};
