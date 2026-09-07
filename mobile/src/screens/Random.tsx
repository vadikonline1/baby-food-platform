import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api, localized } from '../api';
import { useLang, LangRow } from '../ui';

// Random Reteta: o reteta aleatorie + buton Alta
export default function RandomScreen() {
  const nav = useNavigation<any>();
  const { lang, setLang } = useLang();
  const [r, setR] = useState<any>(null);
  const load = useCallback(() => {
    api.get('/recipes/random').then((res) => setR(res.data)).catch(() => {});
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return (
    <View style={s.wrap}>
      <View style={{ padding: 12 }}><LangRow lang={lang} setLang={setLang} /></View>
      {!r && <Text>Se încarcă...</Text>}
      {!!r && (
        <TouchableOpacity style={s.card} onPress={() => nav.navigate('Detail', { id: r.id, slug: r.slug })}>
          {r.imageUrl ? <Image source={{ uri: r.imageUrl }} style={s.img} /> : null}
          <Text style={s.t}>{localized(r, 'title', lang)}</Text>
          <Text style={s.m}>⭐ {Number(r.avgRating || 0).toFixed(1)} · {r.ratingsCount || 0} — deschide →</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={s.btn} onPress={load}>
        <Text style={s.btnT}>🔀 Alta rețetă</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fbf9f7', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  img: { width: '100%', height: 220 },
  t: { fontWeight: '700', fontSize: 18, padding: 14 },
  m: { color: '#5f7a70', paddingHorizontal: 14, paddingBottom: 14 },
  btn: { backgroundColor: '#1486b7', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnT: { color: '#fff', fontWeight: '700', fontSize: 16 }
});
