import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { Text, RadioButton, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// Screen Laporan dan Export Data ke Excel    
export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [counting, setCounting] = useState(false);
  
  // State Filter
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'range'>('today');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [guestCount, setGuestCount] = useState(0);

  // State Date Picker Visibility
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // === 1. HITUNG ESTIMASI DATA (Realtime Count) ===
  const fetchCount = async () => {
    setCounting(true);
    try {
      let query = supabase.from('guests').select('*', { count: 'exact', head: true });
      const { start, end } = getRange();
      
      query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
      
      const { count, error } = await query;
      if (error) throw error;
      setGuestCount(count || 0);
    } catch (err) {
      console.log(err);
    } finally {
      setCounting(false);
    }
  };

  // Hitung ulang setiap kali filter berubah
  useEffect(() => {
    fetchCount();
  }, [period, startDate, endDate]);

  // Helper: Tentukan Rentang Waktu berdasarkan Pilihan
  const getRange = () => {
    const now = new Date();
    if (period === 'today') return { start: startOfDay(now), end: endOfDay(now) };
    if (period === 'week') return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    if (period === 'month') return { start: startOfMonth(now), end: endOfMonth(now) };
    // Custom Range
    return { start: startOfDay(startDate), end: endOfDay(endDate) };
  };

  // === 2. FUNGSI EXPORT ===
  const handleExport = async () => {
    if (guestCount === 0) return Alert.alert("Data Kosong", "Tidak ada data tamu pada periode yang dipilih.");
    setLoading(true);

    try {
      const { start, end } = getRange();
      
      // Ambil Data dari Supabase
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Siapkan Data untuk Excel
      const excelData = (data || []).map((item, index) => ({
        No: index + 1,
        Tanggal: format(new Date(item.created_at), 'dd/MM/yyyy'),
        Jam: format(new Date(item.created_at), 'HH:mm'),
        Nama: item.name,
        'No HP': item.phone || '-',
        Alamat: item.address || '-',
        Keperluan: item.purpose,
        'Admin': item.admin_email || '-'
      }));

      // Buat Workbook dan Sheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Tamu");
      
      // Tulis ke File dan Bagikan
      const dateStr = period === 'range' 
        ? `${format(start, 'ddMMyy')}-${format(end, 'ddMMyy')}`
        : format(new Date(), 'dd-MM-yyyy');
       
      // Nama file sesuai periode
      const fileName = `Laporan_Tamu_${period}_${dateStr}.xlsx`;
      const fileUri = FileSystem.documentDirectory + fileName;
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

      // Simpan file secara lokal
      await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: 'base64' });
      
      // Bagikan file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      }

      // Selesai
      Alert.alert("Sukses", "File Excel berhasil dibuat dan siap dibagikan.");
    } catch (err: any) {
      Alert.alert("Gagal Export", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Komponen Kartu Pilihan (Radio Custom)
  const SelectionCard = ({ value, label }: { value: string, label: string }) => {
    const isSelected = period === value;
    return (
      <TouchableOpacity 
        style={[styles.optionCard, isSelected && styles.optionCardSelected]} 
        onPress={() => setPeriod(value as any)}
      >
        // Radio Button
        <RadioButton.Android 
          value={value} 
          status={isSelected ? 'checked' : 'unchecked'} 
          onPress={() => setPeriod(value as any)}
          color="#10B981"
        />
        <Text style={[styles.optionLabel, isSelected && { color: '#10B981', fontWeight: 'bold' }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  // Komponen Input Tanggal
  const DateInput = ({ label, date, onPress }: any) => (
    <View style={{ flex: 1 }}>
      <Text style={styles.dateLabel}>{label}</Text>
      <TouchableOpacity style={styles.dateBox} onPress={onPress}>
        <Text style={{ fontSize: 14 }}>{format(date, 'dd MMM yyyy', { locale: id })}</Text>
      </TouchableOpacity>
    </View>
  );

  // Render Screen
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.headerTitle}>Export Data</Text>
          <Text style={styles.headerSubtitle}>Export data tamu ke file Excel (.xlsx)</Text>
        </View>

        {/* Pilihan Periode Grid */}
        <Text style={styles.sectionLabel}>Pilih Periode</Text>
        <View style={styles.grid}>
          <SelectionCard value="today" label="Hari Ini" />
          <SelectionCard value="week" label="Minggu Ini" />
          <SelectionCard value="month" label="Bulan Ini" />
          <SelectionCard value="range" label="Rentang Tanggal" />
        </View>

        {/* Input Rentang Tanggal (Muncul jika 'range' dipilih) */}
        {period === 'range' && (
          <View style={styles.dateRow}>
            <DateInput label="Dari Tanggal" date={startDate} onPress={() => setShowStartPicker(true)} />
            <View style={{ width: 10 }} />
            <DateInput label="Sampai Tanggal" date={endDate} onPress={() => setShowEndPicker(true)} />
          </View>
        )}

        {/* Indikator Jumlah Data (Kotak Abu-abu) */}
        <View style={styles.summaryBox}>
          {counting ? (
            <ActivityIndicator size="small" color="#6B7280" />
          ) : (
            <Text style={styles.summaryText}>
              Data yang akan diexport: <Text style={{ fontWeight: 'bold', color: '#111827' }}>{guestCount} tamu</Text>
            </Text>
          )}
        </View>

        {/* Tombol Export */}
        <Button 
          mode="contained" 
          onPress={handleExport} 
          loading={loading} 
          disabled={loading || guestCount === 0}
          style={styles.exportBtn}
          contentStyle={{ height: 48 }}
          buttonColor="#10B981"
          icon="download"
        >
          Export ke Excel
        </Button>

      </ScrollView>

      {/* Date Picker Modals */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) setStartDate(selectedDate);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) setEndDate(selectedDate);
          }}
        />
      )}
    </View>
  );
}

// Stylesheet
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#141515ff', marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: '#6B7280' },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 10, marginTop: 10 },

  // Grid Styles
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionCard: { 
    width: '48%', flexDirection: 'row', alignItems: 'center', 
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8,
    backgroundColor: '#fff' 
  },
  optionCardSelected: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  optionLabel: { fontSize: 13, color: '#374151' },

  // Date Picker Styles
  dateRow: { flexDirection: 'row', marginTop: 16 },
  dateLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  dateBox: { 
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, 
    padding: 12, backgroundColor: '#F9FAFB', alignItems: 'center' 
  },

  // Summary Box Styles
  summaryBox: { 
    marginTop: 24, padding: 16, backgroundColor: '#F3F4F6', 
    borderRadius: 8, alignItems: 'center' 
  },
  summaryText: { color: '#4B5563', fontSize: 14 },
  exportBtn: { marginTop: 16, borderRadius: 8 }
});