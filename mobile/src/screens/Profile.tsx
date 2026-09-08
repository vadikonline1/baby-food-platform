import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../api';
import { useAuth } from '../store';
import { isPushEnabled, enablePush, disablePush } from '../push';
import { checkForUpdate } from '../update';
import { SupportBlock } from '../support';
import { LangSelector } from '../ui';
import { useLang, t } from '../lang';
import { Platform } from 'react-native';

// Profil: push on/off, limba, login/register (optional), editare nume+parola, favorite, sustinere
export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const { user, login, register, logout, refresh } = useAuth();
  const { lang } = useLang();
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [err, setErr] = useState('');
  const [cur, setCur] = useState('');
  const [npw, setNpw] = useState('');
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    isPushEnabled().then(setPush);
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
        if (!data.token) setErr(t('verifyEmail', lang));
      }
    } catch (e: any) {
      setErr(e.response?.data?.error === 'email_not_verified' ? t('unverified', lang) : t('invalidData', lang));
    }
  };

  const saveName = async () => {
    try { await api.patch('/auth/me', { name }); await refresh(); Alert.alert('OK', t('okSaved', lang)); }
    catch { Alert.alert(t('details', lang), t('errSave', lang)); }
  };
  const savePw = async () => {
    if (npw.length < 6) { Alert.alert(t('details', lang), t('minChars', lang)); return; }
    try { await api.patch('/auth/me/password', { currentPassword: cur, newPassword: npw }); setCur(''); setNpw(''); Alert.alert('OK', t('okPass', lang)); }
    catch { Alert.alert(t('details', lang), t('errPass', lang)); }
  };

  return (
    <ScrollView style={s.wrap}>
      <View style={s.row}>
        <Text style={s.t}>{t('pushNotif', lang)}</Text>
        <Switch value={push} onValueChange={togglePush} />
      </View>

      <View style={s.row}>
        <Text style={s.t}>{t('language', lang)}</Text>
        <LangSelector />
      </View>

      {!user ? (
        <View style={s.card}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <TouchableOpacity onPress={() => setMode('login')}><Text style={mode === 'login' ? s.tabOn : s.tab}>Login</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('register')}><Text style={mode === 'register' ? s.tabOn : s.tab}>Register</Text></TouchableOpacity>
          </View>
          {mode === 'register' && <TextInput style={s.in} placeholder={t('authName', lang)} value={name} onChangeText={setName} />}
          <TextInput style={s.in} placeholder={t('authEmail', lang)} value={email} onChangeText={setEmail} autoCapitalize="none" />
          <TextInput style={s.in} placeholder={t('authPass', lang)} value={password} onChangeText={setPassword} secureTextEntry />
          {!!err && <Text style={s.err}>{err}</Text>}
          <TouchableOpacity style={s.btn} onPress={doAuth}><Text style={s.btnT}>{t('continueOpt', lang)}</Text></TouchableOpacity>
          <Text style={s.m}>{t('optionalNote', lang)}</Text>
        </View>
      ) : (
        <View style={s.card}>
          <Text style={s.t}>{user.name}</Text>
          <Text style={s.m}>{user.email}</Text>
          <TextInput style={s.in} placeholder={t('newName', lang)} value={name} onChangeText={setName} />
          <TouchableOpacity style={s.btn} onPress={saveName}><Text style={s.btnT}>{t('saveName', lang)}</Text></TouchableOpacity>
          <TextInput style={s.in} placeholder={t('curPass', lang)} value={cur} onChangeText={setCur} secureTextEntry />
          <TextInput style={s.in} placeholder={t('newPass', lang)} value={npw} onChangeText={setNpw} secureTextEntry />
          <TouchableOpacity style={s.btn} onPress={savePw}><Text style={s.btnT}>{t('changePass', lang)}</Text></TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.ghost]} onPress={async () => { await logout(); }}><Text>{t('logout', lang)}</Text></TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={s.card} onPress={() => nav.navigate('Favorites')}>
        <Text style={s.t}>{t('myFavorites', lang)}</Text>
      </TouchableOpacity>

      {hasUpdate && Platform.OS === 'android' && (
        <TouchableOpacity style={[s.card, { backgroundColor: '#e8f3f9' }]} onPress={() => checkForUpdate(false)}>
          <Text style={s.t}>{t('updateAvailable', lang)}</Text>
        </TouchableOpacity>
      )}

      <SupportBlock />
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
