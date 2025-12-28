import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image, Alert } from 'react-native';
import { Text, Avatar, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { format, startOfWeek } from 'date-fns';
import { id } from 'date-fns/locale';

export default function DashboardScreen({ jumpTo }: any) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  
  // Update State: Tambah 'week'
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, total: 0 });
  const [recentGuest, setRecentGuest] = useState<any>(null);

  // === 1. FUNGSI LOGOUT ===
  const handleLogout = () => {
    Alert.alert("Konfirmasi Logout", "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Keluar", style: "destructive", onPress: async () => await supabase.auth.signOut() }
    ]);
  };

  // === 2. FETCH DATA STATISTIK (DENGAN MINGGUAN) ===
  const fetchStats = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfWeekDate = startOfWeek(now, { weekStartsOn: 1 }).toISOString(); // Senin
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Hitung Data (Parallel Request agar cepat)
      const [resTotal, resToday, resWeek, resMonth, resLast] = await Promise.all([
        supabase.from('guests').select('*', { count: 'exact', head: true }),
        supabase.from('guests').select('*', { count: 'exact', head: true }).gte('created_at', startOfDay),
        supabase.from('guests').select('*', { count: 'exact', head: true }).gte('created_at', startOfWeekDate),
        supabase.from('guests').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
        supabase.from('guests').select('*').order('created_at', { ascending: false }).limit(1).single()
      ]);

      setStats({
        today: resToday.count || 0,
        week: resWeek.count || 0,
        month: resMonth.count || 0,
        total: resTotal.count || 0
      });
      setRecentGuest(resLast.data);

    } catch (error: any) {
      console.log("Error Dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  // === 3. KOMPONEN KARTU BARU (ICON KIRI, TEXT KANAN) ===
  const StatCard = ({ title, count, icon, color, bgColor }: any) => (
    <View style={styles.statCard}>
      {/* Ikon di Kiri */}
      <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
        <Avatar.Icon size={24} icon={icon} color={color} style={{ backgroundColor: 'transparent' }} />
      </View>
      {/* Teks di Kanan */}
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{loading ? "-" : count}</Text>
        <Text style={styles.statLabel}>{title}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerDate}>{format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}</Text>
        </View>
        <IconButton icon="logout" iconColor="#EF4444" size={24} onPress={handleLogout} />
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStats} colors={['#10B981']} />}
      >
        
        {/* GRID 2x2 KARTU STATISTIK */}
        <View style={styles.gridRow}>
          <StatCard 
            title="Hari Ini" 
            count={stats.today} 
            icon="account-check-outline" // Icon Orang
            color="#10B981" // Hijau
            bgColor="#D1FAE5" 
          />
          <View style={{width: 12}} />
          <StatCard 
            title="Minggu Ini" 
            count={stats.week} 
            icon="calendar-week" // Icon Kalender
            color="#059669" // Hijau Tua
            bgColor="#ECFDF5" 
          />
        </View>

        <View style={styles.gridRow}>
          <StatCard 
            title="Bulan Ini" 
            count={stats.month} 
            icon="chart-line" // Icon Grafik
            color="#F59E0B" // Kuning/Orange
            bgColor="#FEF3C7" 
          />
          <View style={{width: 12}} />
          <StatCard 
            title="Total" 
            count={stats.total} 
            icon="poll" // Icon Bar Chart
            color="#3B82F6" // Biru
            bgColor="#DBEAFE" 
          />
        </View>

        {/* TAMU TERAKHIR */}
        <Text style={styles.sectionTitle}>Tamu Terakhir</Text>
        {loading ? (
            <ActivityIndicator style={{marginTop: 20}} color="#10B981" />
        ) : recentGuest ? (
          <View style={styles.guestCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {recentGuest.photo_url ? (
                <Image source={{ uri: recentGuest.photo_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={{ fontWeight: 'bold', color: '#6B7280', fontSize: 18 }}>
                    {recentGuest.name ? recentGuest.name.substring(0,2).toUpperCase() : "??"}
                  </Text>
                </View>
              )}
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.guestName}>{recentGuest.name}</Text>
                <Text style={styles.guestPurpose}>{recentGuest.purpose}</Text>
              </View>
              <Text style={styles.guestTime}>{format(new Date(recentGuest.created_at), 'HH:mm')}</Text>
            </View>
          </View>
        ) : (
          <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 10 }}>Belum ada data tamu.</Text>
        )}

        <Button mode="contained" onPress={() => jumpTo('input')} style={styles.ctaButton} buttonColor="#10B981">
          + Input Tamu Baru
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  headerDate: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  
  // Style Grid Baru
  gridRow: { flexDirection: 'row', marginBottom: 12 },
  
  // Style Kartu Baru (Icon Kiri, Teks Kanan)
  statCard: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 13, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#E5E7EB',
    // Shadow halus
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
  },
  iconBox: { 
    width: 48, height: 48, borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center', 
    marginRight: 12 
  },
  statContent: { flex: 1 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#111827', lineHeight: 32 },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  // Tamu Terakhir
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 8, marginBottom: 12 },
  guestCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  guestName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  guestPurpose: { fontSize: 14, color: '#6B7280' },
  guestTime: { fontSize: 12, color: '#9CA3AF' },
  ctaButton: { marginTop: 24, borderRadius: 8, height: 48, justifyContent: 'center' }
});