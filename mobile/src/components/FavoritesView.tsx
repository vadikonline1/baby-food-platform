import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, localized, imgUrl } from '../api';
import { useAuth } from '../store';
import { useLang, t } from '../lang';
import { useTheme } from '../theme';

// Favorite: cont (server) + guest (cache local) — fara logare obligatorie.
// Folosita de tab-ul „Favorite” din Home + ecranul Favorite (din Profil).
export default function FavoritesView({ onOpen, refreshKey }: { onOpen?: (id: number, slug: string) => void; refreshKey?: number }) {
  const { user } = useAuth();
  const { lang } = useLang();
  const { c } = useTheme();
  const s = sx(c);
  const [items, setItems] = useState<any[]>([]);

  const load = useCallback(() => {
    (async () => {
      const local: any[] = [];
      try {
        const raw = await AsyncStorage.getItem('gb_fav');
        const map = JSON.parse(raw || '{}');
        for (const k of Object.keys(map)) local.push(map[k]);
      } catch {}
      if (user) {
        try {
          const { data } = await api.get('/users/me/favorites');
          const ids = new Set(local.map((x: any) => x.id));
          setItems([...data, ...local.filter((x: any) => !ids.has(x.id))]);
          return;
        } catch {}
      }
      setItems(local);
    })();
  }, [user]);

  // refresh la focus (revenire din Detalii) + la selectarea tab-ului din Home
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { if (refreshKey) load(); }, [refreshKey, load]);

  return (
    <View style={s.wrap}>
      {!items.length && <Text style={s.m}>{t('noFavorites', lang)}</Text>}
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.row}
            onPress={() => onOpen ? onOpen(item.id, item.slug) : undefined}
          >
            {item.imageUrl ? <Image source={{ uri: imgUrl(item.imageUrl) }} style={s.thumb} /> : <View style={[s.thumb, s.ph]}><Text style={{ fontSize: 22 }}>🥣</Text></View>}
            <View style={{ flex: 1 }}>
              <Text style={s.t} numberOfLines={2}>{localized(item, 'title', lang)}</Text>
              <Text style={s.m}>⭐ {Number(item.avgRating || 0).toFixed(1)}</Text>
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
  m: { padding: 20, color: c.muted },
  row: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, backgroundColor: c.card, marginHorizontal: 12, marginTop: 8, padding: 10, borderRadius: 14 },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#e8f3f9' },
  ph: { alignItems: 'center' as const, justifyContent: 'center' as const },
  t: { fontWeight: '600' as const, flex: 1, color: c.ink }
});