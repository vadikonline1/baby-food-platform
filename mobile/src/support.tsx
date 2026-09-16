import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { RewardedInterstitialAd, RewardedAd, TestIds } from 'react-native-google-mobile-ads';
import { getConfig, loadConfig } from './config';
import { useLang, t } from './lang';
import { useTheme } from './theme';

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
// Butoanele stau inline (pe un rând).
export function SupportBlock() {
  const { lang } = useLang();
  const { c } = useTheme();
  const s = sx(c);
  // config in state propriu (nu doar cache global): butoanele apar garantat
  // imediat ce config-ul ajunge, chiar daca la pornire a picat reteaua
  const [cfg, setCfg] = useState<any>(() => getConfig());
  const refresh = useCallback(() => {
    loadConfig().then(setCfg).catch(() => setCfg(getConfig()));
  }, []);
  useFocusEffect(refresh);
  useEffect(() => { refresh(); }, [refresh]);
  const support = cfg?.support?.enabled ? cfg.support : null;
  const tgUrl = cfg?.telegram?.channelUrl;
  const donations = [
    cfg?.donations?.bmc ? { label: '☕ Buy Me a Coffee', url: cfg.donations.bmc, bg: '#FFDD00', fg: '#000000' } : null,
    cfg?.donations?.kofi ? { label: '🎨 Ko-fi', url: cfg.donations.kofi, bg: '#FF5E5B', fg: '#ffffff' } : null,
    cfg?.donations?.mia ? { label: '💳 MIA', url: cfg.donations.mia, bg: c.pine, fg: '#ffffff' } : null
  ].filter(Boolean) as { label: string; url: string; bg: string; fg: string }[];
  if (!support && !tgUrl && !donations.length) return null;

  const title = support?.title?.[lang] || support?.title?.ro || t('supportFallback', lang);
  const text = support?.text?.[lang] || support?.text?.ro;
  return (
    <View style={s.card}>
      {!!title && <Text style={s.t}>{support ? title : ''}</Text>}
      {!!text && support && <Text style={s.m}>{text}</Text>}
      <View style={s.row}>
        {support && (
          <TouchableOpacity style={[s.btn, s.flex, { backgroundColor: c.pine }]} onPress={supportUs}>
            <Text style={s.btnT}>{t('supportFallback', lang)}</Text>
          </TouchableOpacity>
        )}
        {!!tgUrl && (
          <TouchableOpacity style={[s.btn, s.flex, { backgroundColor: c.tgBlue }]} onPress={() => Linking.openURL(tgUrl)}>
            <Text style={s.btnT}>{t('tgSubscribe', lang)}</Text>
          </TouchableOpacity>
        )}
      </View>
      {!!donations.length && (
        <View style={s.row}>
          {donations.map((d) => (
            <TouchableOpacity
              key={d.label}
              style={[s.btn, s.flex, { backgroundColor: d.bg }]}
              onPress={() => Linking.openURL(d.url).catch(() => {})}
            >
              <Text style={[s.btnT, { color: d.fg }]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const sx = (c: any) => ({
  card: { backgroundColor: c.card, margin: 12, padding: 14, borderRadius: 14 },
  t: { fontWeight: '700' as const, fontSize: 15, color: c.ink },
  m: { color: c.muted, fontSize: 12, marginVertical: 6 },
  row: { flexDirection: 'row' as const, gap: 8, marginTop: 8 },
  btn: { borderRadius: 10, padding: 12, alignItems: 'center' as const, marginTop: 8 },
  flex: { flex: 1, marginTop: 0 },
  btnT: { color: '#fff', fontWeight: '700' as const }
});