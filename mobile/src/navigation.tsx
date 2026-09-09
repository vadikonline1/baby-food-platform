import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import HomeScreen from './screens/Home';
import RecipeDetail from './screens/RecipeDetail';
import RandomScreen from './screens/Random';
import ProfileScreen from './screens/Profile';
import FavoritesScreen from './screens/Favorites';
import { useLang, t } from './lang';
import { useTheme } from './theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const icons: Record<string, string> = {
  'Acasa': '🏠',
  'Random': '🎲',
  'Profil': '👤'
};

// mapare nume tab → cheie dicționar
const labelKey: Record<string, string> = {
  'Acasa': 'acasa',
  'Random': 'random',
  'Profil': 'profile'
};

function Tabs() {
  const { lang } = useLang();
  const { c, isDark } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{icons[route.name] || '•'}</Text>,
        tabBarLabel: ({ focused }) => (
          <Text style={{ fontSize: 11, color: focused ? c.primary : c.tabInactive, fontWeight: focused ? '700' : '400' }}>
            {t(labelKey[route.name] || route.name, lang)}
          </Text>
        ),
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.line },
        headerStyle: { backgroundColor: c.primary },
        headerTintColor: c.onPrimary
      })}
    >
      <Tab.Screen name="Acasa" component={HomeScreen} options={{ title: t('acasa', lang) }} />
      <Tab.Screen name="Random" component={RandomScreen} options={{ title: t('random', lang) }} />
      <Tab.Screen name="Profil" component={ProfileScreen} options={{ title: t('profile', lang) }} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { lang } = useLang();
  const { c, isDark } = useTheme();
  return (
    <NavigationContainer theme={(isDark ? DarkTheme : DefaultTheme) as any}>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: c.primary }, headerTintColor: c.onPrimary }}>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="Detail" component={RecipeDetail} options={{ title: t('detailTitle', lang) }} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: t('favTitle', lang) }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
