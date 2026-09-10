import React, { useCallback, useEffect, useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { api, localized } from '../api';
import { RecipeCard, FilterModal, EMPTY_FILTERS, Filters } from '../ui';
import { useLang, t } from '../lang';
import { useTheme } from '../theme';
import { SupportBlock } from '../support';
import { BannerAdBlock } from '../ads';

export default function RecipesScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { lang } = useLang();
  const { c } = useTheme();
  const s = sx(c);
  const [q, setQ] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const [showF, setShowF] = useState(false);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loadErr, setLoadErr] = useState(false);

  // categoria venita din ecranul Categorii se aplica in filtru (sursa unica de adevar)
  useEffect(() => {
    const c = route.params?.category;
    if (c && !filters.category.includes(c)) {
      setFilters((f) => ({ ...f, category: [c] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.category]);

  const load = useCallback(() => {
    setLoadErr(false);
    api.get('/recipes', {
      params: {
        q: q || undefined,
        age: filters.age?.length ? filters.age.join(',') : undefined,
        feeding: filters.feeding?.length ? filters.feeding.join(',') : undefined,
        category: filters.category?.length ? filters.category.join(',') : undefined,
        restriction: filters.restriction?.length ? filters.restriction.join(',') : undefined,
        limit: 30
      }
    }).then((r) => setItems(r.data.items)).catch(() => setLoadErr(true));
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
        <TextInput style={s.input} placeholder={t('search', lang)} placeholderTextColor={c.muted} value={q} onChangeText={setQ} onSubmitEditing={load} />
        <TouchableOpacity style={s.fbtn} onPress={() => setShowF(true)}><Text style={{ color: c.primaryDark, fontWeight: '600' }}>{t('filters', lang)}</Text></TouchableOpacity>
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
        ListHeaderComponent={<><SupportBlock /><BannerAdBlock /></>}
        ListEmptyComponent={
          loadErr ? (
            <View style={s.errBox}>
              <Text style={s.errT}>{t('noConnection', lang)}</Text>
              <Text style={s.errM}>{t('noConnectionHint', lang)}</Text>
              <TouchableOpacity style={s.errBtn} onPress={load}>
                <Text style={s.errBtnT}>{t('retry', lang)}</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => <RecipeCard item={item} lang={lang} onOpen={() => nav.navigate('Detail', { id: item.id, slug: item.slug })} />}
      />
      <FilterModal visible={showF} onClose={() => setShowF(false)} filters={filters} setFilters={setFilters} onSearch={load} />
    </View>
  );
}

const sx = (c: any) => ({
  wrap: { flex: 1, backgroundColor: c.bg, padding: 8 },
  bar: { flexDirection: 'row' as const, gap: 8, alignItems: 'center' as const, padding: 8 },
  input: { flex: 1, backgroundColor: c.inputBg, color: c.ink, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: c.lineStrong },
  fbtn: { backgroundColor: c.primarySoft, borderRadius: 10, padding: 10 },
  chips: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6, alignItems: 'center' as const, paddingHorizontal: 8, paddingBottom: 8 },
  chipsTitle: { fontSize: 12, fontWeight: '700' as const, color: c.primary },
  chip: { backgroundColor: c.primarySoft, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: c.chipBorder },
  chipT: { fontSize: 12, color: c.primaryDark, fontWeight: '600' as const },
  errBox: { backgroundColor: c.card, margin: 12, padding: 18, borderRadius: 14, alignItems: 'center' as const },
  errT: { fontWeight: '700' as const, fontSize: 15, color: c.ink, textAlign: 'center' as const },
  errM: { color: c.muted, fontSize: 13, textAlign: 'center' as const, marginTop: 6, marginBottom: 12 },
  errBtn: { backgroundColor: c.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  errBtnT: { color: c.onPrimary, fontWeight: '700' as const }
});
