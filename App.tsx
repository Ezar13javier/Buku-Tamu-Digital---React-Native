import React, { useState, useEffect } from 'react';
import { View, StatusBar } from 'react-native';
import { PaperProvider, BottomNavigation, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';

// Import Semua Screen
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import HomeScreen from './src/screens/HomeScreen';
import GuestListScreen from './src/screens/GuestListScreen';
import ReportScreen from './src/screens/ReportScreen'; // <--- Import Baru

// Kustom Tema untuk Paper
const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#059669',
    secondaryContainer: '',
    background: '#F3F4F6',
    surface: '#FFFFFF',
  },
};

// Komponen Utama Aplikasi
function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [index, setIndex] = useState(0);
  const insets = useSafeAreaInsets();

  // === MENU NAVIGASI 4 TOMBOL ===
  const [routes] = useState([
    { key: 'dashboard', title: 'Home', focusedIcon: 'view-grid', unfocusedIcon: 'view-grid-outline' },
    { key: 'input', title: 'Input', focusedIcon: 'pencil-box', unfocusedIcon: 'pencil-box-outline' },
    { key: 'list', title: 'Data', focusedIcon: 'account-group', unfocusedIcon: 'account-group-outline' },
    { key: 'report', title: 'Laporan', focusedIcon: 'file-excel', unfocusedIcon: 'file-excel-outline' }, // <--- Menu Baru
  ]);

  // === RENDER SCENE DENGAN 4 SCREEN ===
  const renderScene = BottomNavigation.SceneMap({
    dashboard: DashboardScreen,
    input: HomeScreen,
    list: GuestListScreen,
    report: ReportScreen, 
  });

  // Cek session saat mounting
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  // Jika tidak ada session, tampilkan layar login
  if (!session || !session.user) {
    return <LoginScreen />;
  }

  // Jika sudah login, tampilkan navigasi bawah
  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      barStyle={{ 
        backgroundColor: '#FFFFFF', 
        borderTopWidth: 1, 
        borderTopColor: '#E5E7EB', 
        height: 80 + insets.bottom, 
        paddingBottom: insets.bottom,
      }}
      activeColor="#059669"
      inactiveColor="#9CA3AF"
    />
  );
}

// Ekspor komponen App utama
export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={customTheme}>
        <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
        <AppContent />
      </PaperProvider>
    </SafeAreaProvider>
  );
}