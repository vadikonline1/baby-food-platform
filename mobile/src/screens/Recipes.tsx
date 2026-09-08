import React, { useCallback, useEffect, useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { api, localized } from '../api';
import { RecipeCard, FilterModal, EMPTY_FILTERS, Filters } from '../ui';
import { useLang, t } from '../lang';
import { SupportBlock } from '../support';

export default function RecipesScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { lang } = useLang();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const [showF, setShowF] = useState(false);
  const [names, setNames] = useState<Record<string, string>>({});

  // categoria venita din ecranul Categorii se aplica in filtru (sursa unica de adevar)
  useEffect(() => {
    const c = route.params?.category;
    if (c && !filters.category.includes(c)) {
      setFilters((f) => ({ ...f, category: [c] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.category]);

  const load = useCallback(() => {
    api.get('/recipes', {
      params: {
        q: q || undefined,
        age: filters.age?.length ? filters.age.join(',') : undefined,
        feeding: filters.feeding?.length ? filters.feeding.join(',') : undefined,
        category: filters.category?.length ? filters.category.join(',') : undefined,
        restriction: filters.restriction?.length ? filters.restriction.join(',') : undefined,
        limit: 30
      }
    }).then((r) => setItems(r.data.items)).catch(() => {});
  }, [q, filters]);

  useEffect(() => {
    // nume afisabile pentru chips-uri (din taxonomii, in limba curenta)
    Promise.all([
      api.get('/taxonomies/ages').catch(() => ({ data: [] })),
      api.get('/taxonomies/feeding-types').catch(() => ({ data: [] })),
      api.get('/taxonomies/categories').catch(() => ({ data: [] })),
      api.get('/taxonomies/restrictions').catch(() => ({ data: [] }))
    ]).then(([a, f, c, r]) => {
      const m: Record<string, string> = {};
      a.data.forEach((x: any) => { m[`age:${x.id}`] = localized(x, 'label', lang); });
      f.data.forEach((x: any) => { m[`feeding:${x.id}`] = localized(x, 'name', lang); });
      c.data.forEach((x: any) => { m[`category:${x.slug}`] = `${x.icon || ''} ${localized(x, 'name', lang)}`.trim(); });
      r.data.forEach((x: any) => { m[`restriction:${x.slug}`] = localized(x, 'name', lang); });
      setNames(m);
    }).catch(() => {});
  }, [lang]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const activeChips: { key: keyof Filters; v: any; label: string }[] = [
    ...filters.age.map((v) => ({ key: 'age' as keyof Filters, v, label: names[`age:${v}`] || String(v) })),
    ...filters.feeding.map((v) => ({ key: 'feeding' as keyof Filters, v, label: names[`feeding:${v}`] || String(v) })),
    ...filters.category.map((v) => ({ key: 'category' as keyof Filters, v, label: names[`category:${v}`] || String(v) })),
    ...filters.restriction.map((v) => ({ key: 'restriction' as keyof Filters, v, label: names[`restriction:${v}`] || String(v) }))
  ];
  const dropChip = (key: keyof Filters, v: any) => {
    const next = { ...filters, [key]: (filters[key] as any[]).filter((x: any) => x !== v) };
    setFilters(next);
  };

  return (
    <View style={s.wrap}>
      <View style={s.bar}>
        <TextInput style={s.input} placeholder={t('search', lang)} value={q} onChangeText={setQ} onSubmitEditing={load} />
        <TouchableOpacity style={s.fbtn} onPress={() => setShowF(true)}><Text>{t('filters', lang)}</Text></TouchableOpacity>
      </View>
      {!!activeChips.length && (
        <View style={s.chips}>
          <Text style={s.chipsTitle}>{t('filterActive', lang)}:</Text>
          {activeChips.map((c, i) => (
            <TouchableOpacity key={`${c.key}-${c.v}-${i}`} style={s.chip} onPress={() => dropChip(c.key, c.v)}>
              <Text style={s.chipT}>{c.label} ✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <FlatList
        data={items}
        numColumns={2}
        keyExtractor={(i) => String(i.id)}
        ListHeaderComponent={<SupportBlock />}
        renderItem={({ item }) => <RecipeCard item={item} lang={lang} onOpen={() => nav.navigate('Detail', { id: item.id, slug: item.slug })} />}
      />
      <FilterModal visible={showF} onClose={() => setShowF(false)} filters={filters} setFilters={setFilters} onSearch={load} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fbf9f7', padding: 8 },
  bar: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 8 },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#cfdfee' },
  fbtn: { backgroundColor: '#e8f3f9', borderRadius: 10, padding: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8 },
  chipsTitle: { fontSize: 12, fontWeight: '700', color: '#1486b7' },
  chip: { backgroundColor: '#e8f3f9', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#bcd9ea' },
  chipT: { fontSize: 12, color: '#0d6488', fontWeight: '600' }
});
