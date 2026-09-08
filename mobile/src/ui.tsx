import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, StyleSheet, Modal, ScrollView } from 'react-native';
import { api, localized, imgUrl } from './api';
import { LANGS, useLang, t } from './lang';

export function Stars({ value, onPick }: { value: number; onPick?: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((v) => (
        <TouchableOpacity key={v} onPress={() => onPick && onPick(v)} disabled={!onPick}>
          <Text style={[s.star, v <= Math.round(value) && s.lit]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function RecipeCard({ item, lang, onOpen }: { item: any; lang: string; onOpen: () => void }) {
  return (
    <TouchableOpacity style={s.card} onPress={onOpen}>
      {item.imageUrl ? (
        <Image source={{ uri: imgUrl(item.imageUrl) }} style={s.img} />
      ) : (
        <View style={[s.img, s.ph]}><Text style={{ fontSize: 36 }}>🥣</Text></View>
      )}
      <View style={{ padding: 10 }}>
        <Text style={s.title} numberOfLines={2}>{localized(item, 'title', lang)}</Text>
        <Text style={s.meta}>⭐ {Number(item.avgRating || 0).toFixed(1)} · {item.ratingsCount || 0}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function LangRow({ lang, setLang }: { lang: string; setLang: (l: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {LANGS.map((l) => (
        <TouchableOpacity key={l} onPress={() => setLang(l)} style={[s.chip, lang === l && s.chipOn]}>
          <Text style={lang === l ? s.chipOnT : s.chipT}>{l.toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// selector limbă folosit în Profil (context global — persistat + default limba telefonului)
export function LangSelector() {
  const { lang, setLang } = useLang();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {LANGS.map((l) => (
        <TouchableOpacity key={l} onPress={() => setLang(l)} style={[s.chip, lang === l && s.chipOn]}>
          <Text style={lang === l ? s.chipOnT : s.chipT}>{l.toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export type Filters = { age: number[]; category: string[]; feeding: number[]; restriction: string[] };
export const EMPTY_FILTERS: Filters = { age: [], category: [], feeding: [], restriction: [] };

export function FilterModal({ visible, onClose, filters, setFilters, onSearch }: {
  visible: boolean; onClose: () => void; filters: Filters; setFilters: (f: Filters) => void; onSearch: () => void;
}) {
  const { lang } = useLang();
  const [ages, setAges] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [feeds, setFeeds] = useState<any[]>([]);
  const [restrs, setRestrs] = useState<any[]>([]);
  useEffect(() => {
    if (!visible) return;
    api.get('/taxonomies/ages').then((r: any) => setAges(r.data)).catch(() => {});
    api.get('/taxonomies/categories').then((r: any) => setCats(r.data)).catch(() => {});
    api.get('/taxonomies/feeding-types').then((r: any) => setFeeds(r.data)).catch(() => {});
    api.get('/taxonomies/restrictions').then((r: any) => setRestrs(r.data)).catch(() => {});
  }, [visible]);
  const tg = (key: keyof Filters, v: any) => {
    const arr = filters[key] as any[];
    setFilters({ ...filters, [key]: arr.includes(v) ? arr.filter((x: any) => x !== v) : [...arr, v] });
  };
  const group = (label: string, list: any[], key: keyof Filters, getKey: (x: any) => any, getName: (x: any) => string) => (
    <View key={label}>
      <Text style={s.h}>{label}</Text>
      {list.map((x) => {
        const k = getKey(x);
        const on = (filters[key] as any[]).includes(k);
        return (
          <TouchableOpacity key={String(k)} onPress={() => tg(key, k)}>
            <Text style={s.opt}>{on ? '☑' : '☐'} {getName(x)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 48, paddingBottom: 64, flexGrow: 1 }}>
        <Text style={{ fontSize: 19, fontWeight: '800', marginBottom: 4 }}>{t('filters', lang)}</Text>
        {group(t('age', lang), ages, 'age', (x) => x.id, (x) => localized(x, 'label', lang))}
        {group(t('feeding', lang), feeds, 'feeding', (x) => x.id, (x) => localized(x, 'name', lang))}
        {group(t('categories', lang), cats, 'category', (x) => x.slug, (x) => `${x.icon || ''} ${localized(x, 'name', lang)}`)}
        {group(t('restrictions', lang), restrs, 'restriction', (x) => x.slug, (x) => localized(x, 'name', lang))}
        <TouchableOpacity style={s.btn} onPress={() => { onSearch(); onClose(); }}>
          <Text style={s.btnT}>{t('apply', lang)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.ghost]} onPress={() => { setFilters({ ...EMPTY_FILTERS }); onSearch(); onClose(); }}>
          <Text>{t('reset', lang)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.ghost]} onPress={onClose}><Text>{t('close', lang)}</Text></TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

const s = StyleSheet.create({
  card: { flex: 1, margin: 6, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 2, maxWidth: '48%' },
  img: { width: '100%', height: 120 },
  ph: { backgroundColor: '#e8f3f9', alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '600', fontSize: 14 },
  meta: { color: '#5f7a70', fontSize: 12, marginTop: 4 },
  star: { fontSize: 26, color: '#d6cfbd' },
  lit: { color: '#f59e0b' },
  chip: { borderWidth: 1, borderColor: '#cfdfee', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  chipOn: { backgroundColor: '#1486b7', borderColor: '#1486b7' },
  chipT: { fontSize: 12, color: '#1486b7' },
  chipOnT: { fontSize: 12, color: '#fff', fontWeight: '700' },
  h: { fontWeight: '700', fontSize: 16, marginTop: 16, marginBottom: 8 },
  opt: { fontSize: 15, paddingVertical: 6 },
  btn: { backgroundColor: '#1486b7', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 16 },
  btnT: { color: '#fff', fontWeight: '700' },
  ghost: { backgroundColor: '#eef4fa', marginTop: 8 }
});
