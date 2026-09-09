import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { api, localized, imgUrl } from './api';
import { LANGS, useLang, t } from './lang';
import { THEME_MODES, ThemeMode, useTheme } from './theme';

export function Stars({ value, onPick }: { value: number; onPick?: (v: number) => void }) {
  const { c } = useTheme();
  const s = sx(c);
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
  const { c } = useTheme();
  const s = sx(c);
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
  const { c } = useTheme();
  const s = sx(c);
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
  const { c } = useTheme();
  const s = sx(c);
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

// selector temă folosit în Profil (Sistem / Deschisă / Închisă, persistat local)
export function ThemeSelector() {
  const { c, mode, setMode } = useTheme();
  const s = sx(c);
  const { lang } = useLang();
  const label = (m: ThemeMode) =>
    m === 'light' ? t('themeLight', lang) : m === 'dark' ? t('themeDark', lang) : t('themeSystem', lang);
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {THEME_MODES.map((m) => (
        <TouchableOpacity key={m} onPress={() => setMode(m)} style={[s.chip, mode === m && s.chipOn]}>
          <Text style={mode === m ? s.chipOnT : s.chipT}>{label(m)}</Text>
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
  const { c } = useTheme();
  const s = sx(c);
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
            <Text style={[s.opt, { color: c.ink }]}>{on ? '☑' : '☐'} {getName(x)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 48, paddingBottom: 64, flexGrow: 1, backgroundColor: c.bg }}>
        <Text style={{ fontSize: 19, fontWeight: '800', marginBottom: 4, color: c.ink }}>{t('filters', lang)}</Text>
        {group(t('age', lang), ages, 'age', (x) => x.id, (x) => localized(x, 'label', lang))}
        {group(t('feeding', lang), feeds, 'feeding', (x) => x.id, (x) => localized(x, 'name', lang))}
        {group(t('categories', lang), cats, 'category', (x) => x.slug, (x) => `${x.icon || ''} ${localized(x, 'name', lang)}`)}
        {group(t('restrictions', lang), restrs, 'restriction', (x) => x.slug, (x) => localized(x, 'name', lang))}
        <TouchableOpacity style={s.btn} onPress={() => { onSearch(); onClose(); }}>
          <Text style={s.btnT}>{t('apply', lang)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.ghost]} onPress={() => { setFilters({ ...EMPTY_FILTERS }); onSearch(); onClose(); }}>
          <Text style={{ color: c.ink }}>{t('reset', lang)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.ghost]} onPress={onClose}><Text style={{ color: c.ink }}>{t('close', lang)}</Text></TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

const sx = (c: any) => ({
  card: { flex: 1, margin: 6, backgroundColor: c.card, borderRadius: 14, overflow: 'hidden' as const, elevation: 2, maxWidth: '48%' as const },
  img: { width: '100%' as const, height: 120 },
  ph: { backgroundColor: c.primarySoft, alignItems: 'center' as const, justifyContent: 'center' as const },
  title: { fontWeight: '600' as const, fontSize: 14, color: c.ink },
  meta: { color: c.muted, fontSize: 12, marginTop: 4 },
  star: { fontSize: 26, color: c.starOff },
  lit: { color: '#f59e0b' },
  chip: { borderWidth: 1, borderColor: c.lineStrong, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  chipOn: { backgroundColor: c.primary, borderColor: c.primary },
  chipT: { fontSize: 12, color: c.primary },
  chipOnT: { fontSize: 12, color: c.onPrimary, fontWeight: '700' as const },
  h: { fontWeight: '700' as const, fontSize: 16, marginTop: 16, marginBottom: 8, color: c.ink },
  opt: { fontSize: 15, paddingVertical: 6 },
  btn: { backgroundColor: c.primary, borderRadius: 10, padding: 12, alignItems: 'center' as const, marginTop: 16 },
  btnT: { color: c.onPrimary, fontWeight: '700' as const },
  ghost: { backgroundColor: c.ghostBg, marginTop: 8 }
});
