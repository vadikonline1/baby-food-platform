import React, { useCallback, useLayoutEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../api';
import { useLang, t } from '../lang';
import { useTheme } from '../theme';
import RecipeView from '../components/RecipeView';

// Random Reteta: reteta intreaga afisata direct + buton Alta in header
// (header compact: titlul + butonul 🔀 Alta in navigation header — fara spatii mari)
export default function RandomScreen() {
  const nav = useNavigation<any>();
  const { lang } = useLang();
  const { c } = useTheme();
  const [r, setR] = useState<any>(null);
  const load = useCallback(() => {
    setR(null);
    api.get('/recipes/random').then((res) => setR(res.data)).catch(() => {});
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={load}
          style={{ backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 }}
        >
          <Text style={{ color: '#1486b7', fontWeight: '700', fontSize: 13 }}>🔀 {t('anotherShort', lang)}</Text>
        </TouchableOpacity>
      )
    });
  }, [nav, lang, load]);

  if (!r) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, padding: 16 }}>
        <Text style={{ color: c.ink }}>{t('loading', lang)}</Text>
      </View>
    );
  }
  return <RecipeView recipe={r} />;
}
