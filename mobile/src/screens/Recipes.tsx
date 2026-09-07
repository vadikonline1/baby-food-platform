import React, { useCallback, useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../api';
import { RecipeCard, FilterModal } from '../ui';
import { useLang, t } from '../lang';
import { SupportBlock } from '../support';

export default function RecipesScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { lang } = useLang();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [showF, setShowF] = useState(false);

  const load = useCallback(() => {
    api.get('/recipes', {
      params: {
        q: q || undefined,
        age: filters.age?.length ? filters.age.join(',') : undefined,
        category: filters.category?.length ? filters.category.join(',') : route.params?.category,
        limit: 30
      }
    }).then((r) => setItems(r.data.items)).catch(() => {});
  }, [q, filters, route.params]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={s.wrap}>
      <View style={s.bar}>
        <TextInput style={s.input} placeholder={t('search', lang)} value={q} onChangeText={setQ} onSubmitEditing={load} />
        <TouchableOpacity style={s.fbtn} onPress={() => setShowF(true)}><Text>{t('filters', lang)}</Text></TouchableOpacity>
      </View>
      <FlatList
        data={items}
        numColumns={2}
        keyExtractor={(i) => String(i.id)}
        ListHeaderComponent={<SupportBlock />}
        renderItem={({ item }) => <RecipeCard item={item} lang={lang} onOpen={() => nav.navigate('Detail', { id: item.id, slug: item.slug })} />}
      />
      <FilterModal visible={showF} onClose={() => setShowF(false)} onApply={setFilters} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fbf9f7', padding: 8 },
  bar: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 8 },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#cfdfee' },
  fbtn: { backgroundColor: '#e8f3f9', borderRadius: 10, padding: 10 }
});
