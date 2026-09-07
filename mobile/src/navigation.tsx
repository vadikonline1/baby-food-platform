import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import RecipesScreen from './screens/Recipes';
import RecipeDetail from './screens/RecipeDetail';
import CategoriesScreen from './screens/Categories';
import PlanScreen from './screens/Plan';
import RandomScreen from './screens/Random';
import ProfileScreen from './screens/Profile';
import FavoritesScreen from './screens/Favorites';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const icons: Record<string, string> = {
  'Rețete': '🍽️',
  'Categorii': '🗂️',
  'Plan': '📅',
  'Random': '🎲',
  'Profil': '👤'
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{icons[route.name] || '•'}</Text>,
        headerStyle: { backgroundColor: '#1486b7' },
        headerTintColor: '#fff'
      })}
    >
      <Tab.Screen name="Rețete" component={RecipesScreen} />
      <Tab.Screen name="Categorii" component={CategoriesScreen} />
      <Tab.Screen name="Plan" component={PlanScreen} />
      <Tab.Screen name="Random" component={RandomScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1486b7' }, headerTintColor: '#fff' }}>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="Detail" component={RecipeDetail} options={{ title: 'Rețeta' }} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favorite' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
