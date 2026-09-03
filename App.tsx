import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AppDataProvider, useAppData } from './src/store/AppDataProvider';
import { ConfirmProvider } from './src/components/ConfirmSheet';
import { ExitScreen } from './src/screens/ExitScreen';
import { ExitChecklistScreen } from './src/screens/ExitChecklistScreen';
import { EssentialsScreen } from './src/screens/EssentialsScreen';
import { OutingsScreen } from './src/screens/OutingsScreen';
import { OutingDetailScreen } from './src/screens/OutingDetailScreen';
import { ItemFormScreen } from './src/screens/ItemFormScreen';
import { UpdateBanner } from './src/components/UpdateBanner';
import { TabBarIcon } from './src/components/TabBarIcon';
import type { RootStackParamList, TabParamList } from './src/navigation';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const tabIcon: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Salir: 'walk',
  Siempre: 'repeat',
  Salidas: 'navigate',
};

function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size, focused }) => (
          <TabBarIcon
            name={tabIcon[route.name]}
            size={size}
            color={color}
            focused={focused}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Salir"
        component={ExitScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Siempre"
        component={EssentialsScreen}
        options={{ title: 'Llevo siempre' }}
      />
      <Tab.Screen
        name="Salidas"
        component={OutingsScreen}
        options={{ title: 'Mis salidas' }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { loading } = useAppData();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { fontWeight: '800' },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={TabsNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ExitChecklist"
        component={ExitChecklistScreen}
        options={{ title: 'Antes de salir' }}
      />
      <Stack.Screen
        name="OutingDetail"
        component={OutingDetailScreen}
        options={{ title: 'Salida' }}
      />
      <Stack.Screen
        name="ItemForm"
        component={ItemFormScreen}
        options={{ presentation: 'modal', title: 'Editar', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AppDataProvider>
          <ConfirmProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
            <UpdateBanner />
            <StatusBar style="dark" />
          </ConfirmProvider>
        </AppDataProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
