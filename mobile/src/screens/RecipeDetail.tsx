import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { api } from '../api';
import { useLang, t } from '../lang';
import { useTheme } from '../theme';
import RecipeView from '../components/RecipeView';

export default function RecipeDetail({ route }: any) {
  const { id } = route.params;
  const { lang } = useLang();
  const { c } = useTheme();
  const [r, setR] = useState<any>(null);

  useEffect(() => {
    api.get(`/recipes/${id}-${route.params.slug || ''}`).then((res) => setR(res.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!r) return <View style={{ flex: 1, backgroundColor: c.bg, padding: 16 }}><Text style={{ color: c.ink }}>{t('loading', lang)}</Text></View>;
  return <RecipeView recipe={r} />;
}
