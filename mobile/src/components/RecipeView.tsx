import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, localized, deviceId, imgUrl } from '../api';
import { bannerUnitId } from '../ads';
import { useAuth } from '../store';
import { Stars } from '../ui';
import { useLang, t } from '../lang';

// Vedere completa reteta (ca la deschidere): folosita de Detail + Random
export default function RecipeView({ recipe: initial }: { recipe: any }) {
  const { user } = useAuth();
  const { lang } = useLang();
  const [r, setR] = useState<any>(initial);
  const [myVote, setMyVote] = useState(initial?.myRating || 0);
  const [fav, setFav] = useState(Boolean(initial?.isFavorite));
  const unit = bannerUnitId();

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

  if (!r) return <View style={s.wrap}><Text>{t('loading', lang)}</Text></View>;
  const steps: string[] = String(localized(r, 'steps', lang) || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const det = r.ingredientsDetailed || [];
  const img = imgUrl(r.imageUrl);

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
      )) : <Text>{localized(r, 'ingredients', lang)}</Text>}
      <Text style={s.h2}>{t('prep', lang)}</Text>
      {steps.map((x, i) => <Text key={i} style={s.li}>{i + 1}. {x}</Text>)}
      <Text style={s.h2}>{t('vote', lang)}{myVote ? ` (${myVote}/5)` : ''}</Text>
      <Stars value={myVote} onPick={vote} />
      <TouchableOpacity style={[s.saveBtn, fav && s.saveBtnOn]} onPress={toggleFav}>
        <Text style={[s.saveBtnText, fav && s.saveBtnTextOn]}>{fav ? `♥ ${t('saved', lang)}` : `♡ ${t('save', lang)}`}</Text>
      </TouchableOpacity>
      {!!unit && (
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <BannerAd unitId={unit} size={BannerAdSize.BANNER} />
        </View>
      )}
    </ScrollView>
  );
}

const s = {
  wrap: { flex: 1, backgroundColor: '#fbf9f7', padding: 16 },
  cover: { width: '100%' as const, height: 220, borderRadius: 14 },
  coverMeta: {
    position: 'absolute' as const, left: 10, right: 10, bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10,
  },
  metaOnImg: { color: '#fff', fontSize: 13, fontWeight: '600' as const },
  h1: { fontSize: 22, fontWeight: '700' as const, marginTop: 12, marginBottom: 8, flex: 1, paddingRight: 8 },
  titleRow: { flexDirection: 'row' as const, alignItems: 'flex-start' as const },
  favSmall: {
    marginTop: 14, width: 44, height: 40, borderRadius: 10, alignItems: 'center' as const,
    justifyContent: 'center' as const, borderWidth: 1.5, borderColor: '#e11d48',
  },
  favSmallOn: { backgroundColor: '#e11d48' },
  favSmallTxt: { fontSize: 20, color: '#e11d48' },
  favSmallTxtOn: { color: '#fff' },
  meta: { color: '#5f7a70', marginBottom: 8 },
  sum: { fontSize: 15, marginBottom: 8 },
  h2: { fontSize: 18, fontWeight: '700' as const, marginTop: 14, marginBottom: 6 },
  li: { fontSize: 14, marginBottom: 5 },
  saveBtn: { marginTop: 18, padding: 14, borderRadius: 12, alignItems: 'center' as const, backgroundColor: '#e11d48' },
  saveBtnOn: { backgroundColor: '#15803d' },
  saveBtnText: { fontSize: 17, fontWeight: '700' as const, color: '#fff' },
  saveBtnTextOn: { color: '#fff' },
} as any;
