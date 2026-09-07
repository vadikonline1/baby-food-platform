import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, localized, deviceId } from '../api';
import { bannerUnitId } from '../ads';
import { useAuth } from '../store';
import { Stars, useLang } from '../ui';

export default function RecipeDetail({ route }: any) {
  const { id } = route.params;
  const { user } = useAuth();
  const { lang } = useLang();
  const [r, setR] = useState<any>(null);
  const [myVote, setMyVote] = useState(0);
  const [fav, setFav] = useState(false);
  const unit = bannerUnitId();

  useEffect(() => {
    api.get(`/recipes/${id}-${route.params.slug || ''}`).then((res) => {
      setR(res.data);
      setMyVote(res.data.myRating || 0);
      setFav(Boolean(res.data.isFavorite));
    }).catch(() => {});
    AsyncStorage.getItem(`gb_vote_${id}`).then((v) => { if (v && !myVote) setMyVote(Number(v)); });
    AsyncStorage.getItem('gb_fav').then((raw) => {
      try { setFav((f) => f || Boolean(JSON.parse(raw || '{}')[id])); } catch {}
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const vote = async (v: number) => {
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

  if (!r) return <View style={s.wrap}><Text>Se încarcă...</Text></View>;
  const steps: string[] = String(localized(r, 'steps', lang) || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const det = r.ingredientsDetailed || [];

  return (
    <ScrollView style={s.wrap}>
      <Text style={s.h1}>{localized(r, 'title', lang)}</Text>
      {r.imageUrl ? <Image source={{ uri: r.imageUrl }} style={s.cover} /> : null}
      <Text style={s.meta}>⭐ {Number(r.avgRating || 0).toFixed(1)} ({r.ratingsCount || 0}) · ⏱ {(r.prepMinutes || 0) + (r.cookMinutes || 0)} min · 🍽 {r.servings}</Text>
      {!!localized(r, 'summary', lang) && <Text style={s.sum}>{localized(r, 'summary', lang)}</Text>}
      <Text style={s.h2}>Ingrediente</Text>
      {det.length ? det.map((d: any) => (
        <Text key={d.id} style={s.li}>• <Text style={{ fontWeight: '700' }}>{localized(d.ingredient, 'name', lang)}</Text>{[d.quantity, d.unit].filter(Boolean).length ? ` — ${[d.quantity, d.unit].filter(Boolean).join(' ')}` : ''}</Text>
      )) : <Text>{localized(r, 'ingredients', lang)}</Text>}
      <Text style={s.h2}>Preparare</Text>
      {steps.map((x, i) => <Text key={i} style={s.li}>{i + 1}. {x}</Text>)}
      <Text style={s.h2}>Votează {myVote ? `(${myVote}/5)` : ''}</Text>
      <Stars value={myVote} onPick={vote} />
      <TouchableOpacity style={s.fav} onPress={toggleFav}>
        <Text style={{ fontSize: 22, color: fav ? '#e11d48' : '#888' }}>{fav ? '♥ Salvat' : '♡ Salvează'}</Text>
      </TouchableOpacity>
      {!!unit && (
        <View style={{ alignItems: 'center', marginVertical: 16 }}>
          <BannerAd unitId={unit} size={BannerAdSize.BANNER} />
        </View>
      )}
    </ScrollView>
  );
}

const s = {
  wrap: { flex: 1, backgroundColor: '#fbf9f7', padding: 16 },
  h1: { fontSize: 24, fontWeight: '700' as const, marginBottom: 8 },
  cover: { width: '100%' as const, height: 220, borderRadius: 14, marginBottom: 10 },
  meta: { color: '#5f7a70', marginBottom: 8 },
  sum: { fontSize: 15, marginBottom: 8 },
  h2: { fontSize: 18, fontWeight: '700' as const, marginTop: 14, marginBottom: 6 },
  li: { fontSize: 14, marginBottom: 5 },
  fav: { marginTop: 12, padding: 10 }
} as any;
