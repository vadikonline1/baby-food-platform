import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api, localized } from '../api';
import { RecipeCard } from '../ui';
import { useLang, t } from '../lang';
import { useTheme } from '../theme';

// Plan diversificare: pasi din Ghid (gestionat din web) + retete cele mai votate
export default function PlanScreen() {
  const nav = useNavigation<any>();
  const { lang } = useLang();
  const { c } = useTheme();
  const s = sx(c);
  const [guide, setGuide] = useState<any[]>([]);
  const [top, setTop] = useState<any[]>([]);
  useEffect(() => {
    api.get('/content/guide').then((r) => setGuide(r.data)).catch(() => {});
    api.get('/recipes', { params: { sort: 'popular', limit: 5 } }).then((r) => setTop(r.data.items)).catch(() => {});
  }, []);
  return (
    <ScrollView style={s.wrap}>
      <Text style={s.h}>{t('planTitle', lang)}</Text>
      {guide.map((g, i) => (
        <View key={g.id || i} style={s.step}>
          <Text style={s.n}>{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.t}>{g.icon} {localized(g, 'title', lang)}</Text>
            <Text style={s.b}>{localized(g, 'body', lang)}</Text>
          </View>
        </View>
      ))}
      <Text style={s.h}>{t('recommended', lang)}</Text>
      {top.map((r) => (
        <TouchableOpacity key={r.id} style={s.row} onPress={() => nav.navigate('Detail', { id: r.id, slug: r.slug })}>
          <Text style={s.t}>⭐ {Number(r.avgRating || 0).toFixed(1)} — {localized(r, 'title', lang)}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const sx = (c: any) => ({
  wrap: { flex: 1, backgroundColor: c.bg },
  h: { fontSize: 18, fontWeight: '700' as const, padding: 12, color: c.ink },
  step: { flexDirection: 'row' as const, gap: 10, backgroundColor: c.card, marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 14 },
  n: { fontWeight: '800' as const, fontSize: 18, color: c.primary },
  t: { fontWeight: '700' as const, color: c.ink },
  b: { color: c.muted, fontSize: 13, marginTop: 4 },
  row: { backgroundColor: c.card, marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 14 }
});
