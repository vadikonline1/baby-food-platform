import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api, getApiBase, checkConnection } from '../api';
import { useAuth } from '../store';
import { isPushEnabled, enablePush, disablePush } from '../push';
import { checkForUpdate } from '../update';
import { SupportBlock } from '../support';
import { LangSelector, ThemeSelector } from '../ui';
import { useLang, t } from '../lang';
import { useTheme } from '../theme';
import { Platform } from 'react-native';

// Profil: push on/off, limba, tema, login/register (optional), editare nume+parola, favorite, sustinere
export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const { user, login, register, logout, refresh } = useAuth();
  const { lang } = useLang();
  const { c } = useTheme();
  const s = sx(c);
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [err, setErr] = useState('');
  const [cur, setCur] = useState('');
  const [npw, setNpw] = useState('');
  const [hasUpdate, setHasUpdate] = useState(false);
  const [apiBase, setApiBase] = useState('');

  useEffect(() => {
    isPushEnabled().then(setPush);
    setApiBase(getApiBase());
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

      <View style={s.row}>
        <Text style={s.t}>{t('theme', lang)}</Text>
        <ThemeSelector />
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
          <TouchableOpacity style={[s.btn, s.ghost]} onPress={async () => { await logout(); }}><Text style={{ color: c.ink }}>{t('logout', lang)}</Text></TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={s.card} onPress={() => nav.navigate('Favorites')}>
        <Text style={s.t}>{t('myFavorites', lang)}</Text>
      </TouchableOpacity>

      {hasUpdate && Platform.OS === 'android' && (
        <TouchableOpacity style={[s.card, { backgroundColor: c.primarySoft }]} onPress={() => checkForUpdate(false)}>
          <Text style={s.t}>{t('updateAvailable', lang)}</Text>
        </TouchableOpacity>
      )}

      <View style={s.card}>
        <Text style={s.t}>{t('apiBase', lang)}</Text>
        <Text style={s.m} selectable>{apiBase || '—'}</Text>
        <TouchableOpacity
          style={s.btn}
          onPress={async () => {
            const ok = await checkConnection();
            setApiBase(getApiBase());
            Alert.alert(t('checkConn', lang), ok ? t('connOk', lang) : t('connFail', lang));
          }}
        >
          <Text style={s.btnT}>{t('checkConn', lang)}</Text>
        </TouchableOpacity>
      </View>

      <SupportBlock />
    </ScrollView>
  );
}

const sx = (c: any) => ({
  wrap: { flex: 1, backgroundColor: c.bg },
  card: { backgroundColor: c.card, margin: 12, padding: 14, borderRadius: 14 },
  row: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, backgroundColor: c.card, margin: 12, marginBottom: 0, padding: 14, borderRadius: 14 },
  t: { fontWeight: '700' as const, fontSize: 15, color: c.ink },
  m: { color: c.muted, fontSize: 12, marginVertical: 6 },
  in: { backgroundColor: c.inputBg, color: c.ink, borderWidth: 1, borderColor: c.lineStrong, borderRadius: 10, padding: 10, marginBottom: 8 },
  btn: { backgroundColor: c.primary, borderRadius: 10, padding: 12, alignItems: 'center' as const, marginBottom: 8 },
  btnT: { color: c.onPrimary, fontWeight: '700' as const },
  ghost: { backgroundColor: c.ghostBg },
  err: { color: c.danger, marginBottom: 8 },
  tab: { fontSize: 15, color: c.tabInactive },
  tabOn: { fontSize: 15, fontWeight: '700' as const, color: c.primary }
});
