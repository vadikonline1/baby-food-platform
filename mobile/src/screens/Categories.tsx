import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api, localized } from '../api';
import { useLang, t } from '../lang';
import { useTheme } from '../theme';

export default function CategoriesScreen() {
  const nav = useNavigation<any>();
  const { lang } = useLang();
  const { c } = useTheme();
  const s = sx(c);
  const [cats, setCats] = useState<any[]>([]);
  useEffect(() => {
    api.get('/taxonomies/categories?withCounts=1').then((r) => setCats(r.data)).catch(() => {});
  }, []);
  return (
    <View style={s.wrap}>
      <FlatList
        data={cats}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.row} onPress={() => nav.navigate('Acasa', { category: item.slug })}>
            <Text style={{ fontSize: 28 }}>{item.icon || '🍽️'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.t}>{localized(item, 'name', lang)}</Text>
              <Text style={s.m}>{item._count?.recipes ?? ''} {t('recipesCount', lang)}</Text>
            </View>
            <Text style={{ color: c.muted }}>→</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const sx = (c: any) => ({
  wrap: { flex: 1, backgroundColor: c.bg },
  row: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, backgroundColor: c.card, marginHorizontal: 12, marginTop: 8, padding: 14, borderRadius: 14 },
  t: { fontWeight: '700' as const, fontSize: 15, color: c.ink },
  m: { color: c.muted, fontSize: 12 }
});
