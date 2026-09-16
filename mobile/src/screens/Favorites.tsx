import React from 'react';
import { useNavigation } from '@react-navigation/native';
import FavoritesView from '../components/FavoritesView';

// Ecran Favorite (din Profil) — reutilizeaza FavoritesView (tab-ul din Home idem).
export default function FavoritesScreen() {
  const nav = useNavigation<any>();
  return <FavoritesView onOpen={(id, slug) => nav.navigate('Detail', { id, slug })} />;
}