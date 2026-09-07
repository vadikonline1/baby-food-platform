import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api, localized } from '../api';
import { RecipeCard } from '../ui';
import { useLang } from '../lang';

// Plan diversificare: pasi din Ghid (gestionat din web) + retete cele mai votate
export default function PlanScreen() {
  const nav = useNavigation<any>();
  const { lang } = useLang();
  const [guide, setGuide] = useState<any[]>([]);
  const [top, setTop] = useState<any[]>([]);
  useEffect(() => {
    api.get('/content/guide').then((r) => setGuide(r.data.slice(0, 8))).catch(() => {});
    api.get('/recipes', { params: { sort: 'popular', limit: 5 } }).then((r) => setTop(r.data.items)).catch(() => {});
  }, []);
  return (
    <ScrollView style={s.wrap}>
      <Text style={s.h}>Plan diversificare</Text>
      {guide.map((g, i) => (
        <View key={g.id || i} style={s.step}>
          <Text style={s.n}>{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.t}>{g.icon} {localized(g, 'title', lang)}</Text>
            <Text style={s.b}>{localized(g, 'body', lang)}</Text>
          </View>
        </View>
      ))}
      <Text style={s.h}>Rețete recomandate</Text>
      {top.map((r) => (
        <TouchableOpacity key={r.id} style={s.row} onPress={() => nav.navigate('Detail', { id: r.id, slug: r.slug })}>
          <Text style={s.t}>⭐ {Number(r.avgRating || 0).toFixed(1)} — {localized(r, 'title', lang)}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fbf9f7' },
  h: { fontSize: 18, fontWeight: '700', padding: 12 },
  step: { flexDirection: 'row', gap: 10, backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 14 },
  n: { fontWeight: '800', fontSize: 18, color: '#1486b7' },
  t: { fontWeight: '700' },
  b: { color: '#444', fontSize: 13, marginTop: 4 },
  row: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 14 }
});
