import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Share } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, localized, deviceId, imgUrl, apiOrigin } from '../api';
import { BannerAdBlock } from '../ads';
import { useAuth } from '../store';
import { Stars } from '../ui';
import { useLang, t } from '../lang';
import { useTheme } from '../theme';

// Vedere completa reteta (ca la deschidere): folosita de Detail + Random
export default function RecipeView({ recipe: initial }: { recipe: any }) {
  const { user } = useAuth();
  const { lang } = useLang();
  const { c } = useTheme();
  const s = sx(c);
  const [r, setR] = useState<any>(initial);
  const [myVote, setMyVote] = useState(initial?.myRating || 0);
  const [fav, setFav] = useState(Boolean(initial?.isFavorite));

  useEffect(() => {
    setR(initial);
    setMyVote(initial?.myRating || 0);
    setFav(Boolean(initial?.isFavorite));
    AsyncStorage.getItem(`gb_vote_${initial?.id}`).then((v) => {
      if (v && !(initial?.myRating > 0)) setMyVote(Number(v));
    }).catch(() => {});
    AsyncStorage.getItem('gb_fav').then((raw) => {
      try { if (JSON.parse(raw || '{}')[initial?.id]) setFav(true); } catch {}
    }).catch(() => {});
  }, [initial?.id]);

  const vote = async (v: number) => {
    if (!r) return;
    setMyVote(v);
    try {
      if (user) {
        const { data } = await api.post(`/recipes/${r.id}/rate`, { value: v });
        setR({ ...r, avgRating: data.avgRating, ratingsCount: data.ratingsCount });
      } else {
        const did = await deviceId();
        const { data } = await api.post(`/recipes/${r.id}/guest-rate`, { value: v, deviceId: did });
        setR({ ...r, avgRating: data.avgRating, ratingsCount: data.ratingsCount });
        await AsyncStorage.setItem(`gb_vote_${r.id}`, String(v));
      }
    } catch {}
  };

  const toggleFav = async () => {
    if (!r) return;
    try {
      if (user) {
        if (fav) await api.delete(`/recipes/${r.id}/favorite`);
        else await api.post(`/recipes/${r.id}/favorite`);
        setFav(!fav);
      } else {
        const raw = await AsyncStorage.getItem('gb_fav');
        const map = JSON.parse(raw || '{}');
        if (map[r.id]) delete map[r.id];
        else map[r.id] = { id: r.id, slug: r.slug, titleRo: r.titleRo, titleRu: r.titleRu, titleEn: r.titleEn, imageUrl: r.imageUrl, avgRating: r.avgRating, ratingsCount: r.ratingsCount };
        await AsyncStorage.setItem('gb_fav', JSON.stringify(map));
        setFav(!fav);
      }
    } catch {}
  };

  // Distribuie link-ul web al rețetei (același link care se dă și pe Telegram)
  const share = () => {
    if (!r) return;
    const url = `${apiOrigin()}/retete/${r.id}-${r.slug}`;
    Share.share({ message: `${localized(r, 'title', lang)}\n${url}`, url }).catch(() => {});
  };

  if (!r) return <View style={s.wrap}><Text>{t('loading', lang)}</Text></View>;
  const steps: string[] = String(localized(r, 'steps', lang) || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const det = r.ingredientsDetailed || [];
  const img = imgUrl(r.imageUrl);

  const escHtml = (v: any) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const exportPdf = async () => {
    try {
      const titleH = escHtml(localized(r, 'title', lang));
      const metaH = `⭐ ${Number(r.avgRating || 0).toFixed(1)} (${r.ratingsCount || 0}) · ⏱ ${(r.prepMinutes || 0) + (r.cookMinutes || 0)} min · 🍽 ${r.servings || ''}`;
      const sumH = localized(r, 'summary', lang) ? escHtml(localized(r, 'summary', lang)) : '';
      const ingH = det.length
        ? `<ul>${det.map((d: any) => `<li><b>${escHtml(localized(d.ingredient, 'name', lang))}</b>${[d.quantity, d.unit].filter(Boolean).length ? ' — ' + escHtml([d.quantity, d.unit].filter(Boolean).join(' ')) : ''}</li>`).join('')}</ul>`
        : `<p>${escHtml(localized(r, 'ingredients', lang))}</p>`;
      const stepsH = `<ol>${steps.map((x) => `<li>${escHtml(x)}</li>`).join('')}</ol>`;
      const topBlock = img && sumH
        ? `<table width="100%" cellpadding="6"><tr><td width="55%" valign="top">${sumH}</td><td width="45%" valign="top"><img src="${img}" /></td></tr></table>`
        : img
          ? `<p style="text-align:center"><img src="${img}" /></p>`
          : (sumH ? `<p style="text-align:center">${sumH}</p>` : '');
      const html = `<html><head><meta charset="utf-8" />
        <style>body{font-family:sans-serif;color:#1e2f2b;padding:24px}h1{font-size:24px;text-align:center}h2{font-size:18px;margin-top:6px;color:#0d6488}.meta{color:#5f7a70;text-align:center}li{margin-bottom:6px}img{max-width:100%;border-radius:12px}</style>
        </head><body>
        <h1>${titleH}</h1>
        <p class="meta">${metaH}</p>
        ${topBlock}
        <table width="100%" cellpadding="6"><tr>
        <td width="50%" valign="top"><h2>${escHtml(t('ingredients', lang))}</h2>${ingH}</td>
        <td width="50%" valign="top"><h2>${escHtml(t('prep', lang))}</h2>${stepsH}</td>
        </tr></table>
        <p class="meta">GustBebe</p>
        </body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
    } catch {}
  };

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ paddingBottom: 96 }}>
      {img ? (
        <View>
          <Image source={{ uri: img }} style={s.cover} />
          <View style={s.coverMeta}>
            <Text style={s.metaOnImg}>⭐ {Number(r.avgRating || 0).toFixed(1)} ({r.ratingsCount || 0}) · ⏱ {(r.prepMinutes || 0) + (r.cookMinutes || 0)} min · 🍽 {r.servings}</Text>
          </View>
        </View>
      ) : (
        <Text style={s.meta}>⭐ {Number(r.avgRating || 0).toFixed(1)} ({r.ratingsCount || 0}) · ⏱ {(r.prepMinutes || 0) + (r.cookMinutes || 0)} min · 🍽 {r.servings}</Text>
      )}
      <View style={s.titleRow}>
        <Text style={s.h1}>{localized(r, 'title', lang)}</Text>
        <TouchableOpacity style={[s.favSmall, fav && s.favSmallOn]} onPress={toggleFav} hitSlop={8}>
          <Text style={[s.favSmallTxt, fav && s.favSmallTxtOn]}>{fav ? '♥' : '♡'}</Text>
        </TouchableOpacity>
      </View>
      {!!localized(r, 'summary', lang) && <Text style={s.sum}>{localized(r, 'summary', lang)}</Text>}
      <Text style={s.h2}>{t('ingredients', lang)}</Text>
      {det.length ? det.map((d: any) => (
        <Text key={d.id} style={s.li}>• <Text style={{ fontWeight: '700' }}>{localized(d.ingredient, 'name', lang)}</Text>{[d.quantity, d.unit].filter(Boolean).length ? ` — ${[d.quantity, d.unit].filter(Boolean).join(' ')}` : ''}</Text>
      )) : <Text style={{ color: c.ink }}>{localized(r, 'ingredients', lang)}</Text>}
      <Text style={s.h2}>{t('prep', lang)}</Text>
      {steps.map((x, i) => <Text key={i} style={s.li}>{i + 1}. {x}</Text>)}
      <Text style={s.h2}>{t('vote', lang)}{myVote ? ` (${myVote}/5)` : ''}</Text>
      <Stars value={myVote} onPick={vote} />
      <BannerAdBlock />
      <View style={s.actionRow}>
        <TouchableOpacity style={s.shareBtn} onPress={share}>
          <Text style={s.shareBtnText}>↗ {t('share', lang)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.shareBtn} onPress={exportPdf}>
          <Text style={s.shareBtnText}>🖨 PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.saveBtn, fav && s.saveBtnOn]} onPress={toggleFav}>
          <Text style={[s.saveBtnText, fav && s.saveBtnTextOn]}>{fav ? `♥ ${t('saved', lang)}` : `♡ ${t('save', lang)}`}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const sx = (c: any) => ({
  wrap: { flex: 1, backgroundColor: c.bg, padding: 16 },
  cover: { width: '100%' as const, height: 220, borderRadius: 14 },
  coverMeta: {
    position: 'absolute' as const, left: 10, right: 10, bottom: 10,
    backgroundColor: c.overlay, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10,
  },
  metaOnImg: { color: '#fff', fontSize: 13, fontWeight: '600' as const },
  h1: { fontSize: 22, fontWeight: '700' as const, marginTop: 12, marginBottom: 8, flex: 1, paddingRight: 8, color: c.ink },
  titleRow: { flexDirection: 'row' as const, alignItems: 'flex-start' as const },
  favSmall: {
    marginTop: 14, width: 44, height: 40, borderRadius: 10, alignItems: 'center' as const,
    justifyContent: 'center' as const, borderWidth: 1.5, borderColor: c.heart,
  },
  favSmallOn: { backgroundColor: c.heart },
  favSmallTxt: { fontSize: 20, color: c.heart },
  favSmallTxtOn: { color: '#fff' },
  meta: { color: c.muted, marginBottom: 8 },
  sum: { fontSize: 15, marginBottom: 8, color: c.ink },
  h2: { fontSize: 18, fontWeight: '700' as const, marginTop: 14, marginBottom: 6, color: c.ink },
  li: { fontSize: 14, marginBottom: 5, color: c.ink },
  saveBtn: { marginTop: 18, padding: 14, borderRadius: 12, alignItems: 'center' as const, backgroundColor: c.heart, flex: 1 },
  saveBtnOn: { backgroundColor: c.saveOn },
  saveBtnText: { fontSize: 17, fontWeight: '700' as const, color: '#fff' },
  saveBtnTextOn: { color: '#fff' },
  actionRow: { flexDirection: 'row' as const, gap: 10 },
  shareBtn: {
    marginTop: 18, padding: 14, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 1.5, borderColor: c.primary, flex: 1,
  },
  shareBtnText: { fontSize: 17, fontWeight: '700' as const, color: c.primary },
});
