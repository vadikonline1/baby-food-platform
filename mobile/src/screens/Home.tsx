import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import PagerView from 'react-native-pager-view';
import RecipesScreen from './Recipes';
import CategoriesScreen from './Categories';
import PlanScreen from './Plan';
import { useLang, t } from '../lang';
import { useTheme } from '../theme';

// Acasa: Rețete / Categorii / Ghid cu swipe orizontal + segmente sus (ca pe web kaart).
export default function HomeScreen() {
  const { lang } = useLang();
  const { c } = useTheme();
  const route = useRoute<any>();
  const ref = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  const s = sx(c);

  // venire din Categorii cu {category}: sare pe pagina Rețete (filtrul se aplică acolo)
  useEffect(() => {
    if (route.params?.category) {
      ref.current?.setPage(0);
      setPage(0);
    }
  }, [route.params?.category]);

  const tabs = [t('home', lang), t('categories', lang), t('plan', lang)];
  return (
    <View style={s.wrap}>
      <View style={s.seg}>
        {tabs.map((label, i) => (
          <TouchableOpacity
            key={label}
            style={[s.segBtn, page === i && s.segOn]}
            onPress={() => { ref.current?.setPage(i); setPage(i); }}
          >
            <Text style={[s.segT, page === i && s.segTOn]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <PagerView
        ref={ref}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
      >
        <View key="0" style={{ flex: 1 }}><RecipesScreen /></View>
        <View key="1" style={{ flex: 1 }}><CategoriesScreen /></View>
        <View key="2" style={{ flex: 1 }}><PlanScreen /></View>
      </PagerView>
    </View>
  );
}

const sx = (c: any) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: c.bg },
  seg: { flexDirection: 'row', backgroundColor: c.primarySoft, borderRadius: 12, padding: 3, marginHorizontal: 12, marginTop: 10 },
  segBtn: { flex: 1, borderRadius: 9, paddingVertical: 8, alignItems: 'center' },
  segOn: { backgroundColor: c.card, elevation: 2 },
  segT: { fontSize: 13.5, fontWeight: '600', color: c.muted },
  segTOn: { color: c.ink, fontWeight: '700' },
});
