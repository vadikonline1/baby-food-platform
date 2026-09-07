import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, Linking } from 'react-native';
import { RewardedInterstitialAd, RewardedAd, TestIds } from 'react-native-google-mobile-ads';
import { getConfig } from './config';
import { useLang } from './lang';

// Sustinere: reclama rewarded (AdMob). Folosit de Profil + Home.
export function supportUs() {
  const cfg = getConfig();
  const units = Platform.OS === 'ios' ? cfg?.admob?.ios : cfg?.admob?.android;
  const showRewarded = () => {
    if (!units?.rewarded) {
      Alert.alert('Info', 'Reclamă indisponibilă momentan.');
      return;
    }
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
}

// Card "Susține proiectul" + "Abonare Telegram" — remote config, fără rebuild.
export function SupportBlock() {
  const { lang } = useLang();
  const cfg = getConfig();
  const support = cfg?.support?.enabled ? cfg.support : null;
  const tgUrl = cfg?.telegram?.channelUrl;
  if (!support && !tgUrl) return null;

  const title = support?.title?.[lang] || support?.title?.ro || 'Susține proiectul';
  const text = support?.text?.[lang] || support?.text?.ro;
  return (
    <View style={s.card}>
      {support && (
        <>
          <Text style={s.t}>{title}</Text>
          {!!text && <Text style={s.m}>{text}</Text>}
          <TouchableOpacity style={[s.btn, { backgroundColor: '#065f46' }]} onPress={supportUs}>
            <Text style={s.btnT}>Susține proiectul 🎁</Text>
          </TouchableOpacity>
        </>
      )}
      {!!tgUrl && (
        <TouchableOpacity style={[s.btn, { backgroundColor: '#1c8cd8' }]} onPress={() => Linking.openURL(tgUrl)}>
          <Text style={s.btnT}>📢 Abonare Telegram</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', margin: 12, padding: 14, borderRadius: 14 },
  t: { fontWeight: '700', fontSize: 15 },
  m: { color: '#5f7a70', fontSize: 12, marginVertical: 6 },
  btn: { borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8 },
  btnT: { color: '#fff', fontWeight: '700' }
});