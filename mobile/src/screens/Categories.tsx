import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api, localized } from '../api';
import { useLang } from '../lang';

export default function CategoriesScreen() {
  const nav = useNavigation<any>();
  const { lang } = useLang();
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
          <TouchableOpacity style={s.row} onPress={() => nav.navigate('Rețete', { category: item.slug })}>
            <Text style={{ fontSize: 28 }}>{item.icon || '🍽️'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.t}>{localized(item, 'name', lang)}</Text>
              <Text style={s.m}>{item._count?.recipes ?? ''} rețete</Text>
            </View>
            <Text>→</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fbf9f7' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, padding: 14, borderRadius: 14 },
  t: { fontWeight: '700', fontSize: 15 },
  m: { color: '#5f7a70', fontSize: 12 }
});
