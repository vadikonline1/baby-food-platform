import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, localized } from '../api';
import { useAuth } from '../store';
import { useLang, t } from '../lang';
import { useTheme } from '../theme';

// Favorite: cont (server) + guest (cache local) — fara logare obligatorie
export default function FavoritesScreen() {
  const nav = useNavigation<any>();
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

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={s.wrap}>
      {!items.length && <Text style={s.m}>{t('noFavorites', lang)}</Text>}
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.row} onPress={() => nav.navigate('Detail', { id: item.id, slug: item.slug })}>
            <Text style={s.t}>{localized(item, 'title', lang)}</Text>
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
  row: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, backgroundColor: c.card, marginHorizontal: 12, marginTop: 8, padding: 14, borderRadius: 14 },
  t: { fontWeight: '600' as const, flex: 1, color: c.ink }
});
