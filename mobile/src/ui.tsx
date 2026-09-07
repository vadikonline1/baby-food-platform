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

export function FilterModal({ visible, onClose, onApply }: { visible: boolean; onClose: () => void; onApply: (f: any) => void }) {
  const { lang } = useLang();
  const [ages, setAges] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [selA, setSelA] = useState<number[]>([]);
  const [selC, setSelC] = useState<string[]>([]);
  useEffect(() => {
    if (!visible) return;
    api.get('/taxonomies/ages').then((r: any) => setAges(r.data)).catch(() => {});
    api.get('/taxonomies/categories').then((r: any) => setCats(r.data)).catch(() => {});
  }, [visible]);
  const tg = (arr: any[], v: any, set: any) => set(arr.includes(v) ? arr.filter((x: any) => x !== v) : [...arr, v]);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={{ padding: 20, marginTop: 40 }}>
        <Text style={s.h}>{t('age', lang)}</Text>
        {ages.map((a) => (
          <TouchableOpacity key={a.id} onPress={() => tg(selA, a.id, setSelA)}>
            <Text style={s.opt}>{selA.includes(a.id) ? '☑' : '☐'} {localized(a, 'label', lang)}</Text>
          </TouchableOpacity>
        ))}
        <Text style={s.h}>{t('categories', lang)}</Text>
        {cats.map((c) => (
          <TouchableOpacity key={c.id} onPress={() => tg(selC, c.slug, setSelC)}>
            <Text style={s.opt}>{selC.includes(c.slug) ? '☑' : '☐'} {c.icon} {localized(c, 'name', lang)}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={s.btn} onPress={() => { onApply({ age: selA, category: selC }); onClose(); }}>
          <Text style={s.btnT}>{t('apply', lang)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.ghost]} onPress={() => { setSelA([]); setSelC([]); onApply({ age: [], category: [] }); onClose(); }}>
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
