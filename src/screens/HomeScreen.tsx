import React, { useState } from 'react';// Import React dan useState
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';// Import komponen dari React Native Paper
import { useSafeAreaInsets } from 'react-native-safe-area-context';// Import hook untuk safe area
import * as ImagePicker from 'expo-image-picker';// Import modul ImagePicker
import * as FileSystem from 'expo-file-system/legacy'; // Import modul FileSystem
import { decode } from 'base64-arraybuffer';// Import fungsi decode untuk base64
import { supabase } from '../lib/supabase';// Import instance Supabase

// Komponen HomeScreen
export default function HomeScreen() {
  const insets = useSafeAreaInsets();// Dapatkan insets untuk safe area
  const [loading, setLoading] = useState(false);// State untuk loading
  const [name, setName] = useState('');// State untuk nama tamu
  const [phone, setPhone] = useState('');// State untuk nomor HP tamu
  const [address, setAddress] = useState('');// State untuk alamat tamu
  const [purpose, setPurpose] = useState('');// State untuk keperluan tamu
  const [photoUri, setPhotoUri] = useState<string | null>(null);// State untuk URI foto tamu

  // === FUNGSI BUKA KAMERA ===
  const openCamera = async () => {
    try {
      // Minta izin akses kamera
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        return Alert.alert("Izin Ditolak", "Mohon buka Pengaturan HP > Aplikasi > Expo Go > Izin > Izinkan Kamera.");
      }
      
      // Buka kamera untuk ambil foto
      const result = await ImagePicker.launchCameraAsync({
        // KITA KEMBALIKAN KE 'MediaTypeOptions' AGAR TIDAK ERROR
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        allowsEditing: false, 
        quality: 0.5,
      });

      // Jika tidak dibatalkan, simpan URI foto
      if (!result.canceled) setPhotoUri(result.assets[0].uri);
    } catch (error: any) {
      Alert.alert("Error Kamera", error.message); 
    }
  };

  // === FUNGSI BUKA GALERI ===
  const openGallery = async () => {
    try {
      // Minta izin akses galeri
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        return Alert.alert("Izin Ditolak", "Mohon izinkan akses galeri di pengaturan HP.");
      }

      // Buka galeri untuk pilih foto
      const result = await ImagePicker.launchImageLibraryAsync({
        // KITA KEMBALIKAN KE 'MediaTypeOptions' AGAR TIDAK ERROR
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.5,
      });

      // Jika tidak dibatalkan, simpan URI foto
      if (!result.canceled) setPhotoUri(result.assets[0].uri);
    } catch (error: any) {
      Alert.alert("Error Galeri", error.message);
    }
  };

  // === FUNGSI PILIH FOTO ===
  const pickImage = async () => {
    Alert.alert("Pilih Foto", "Ambil foto langsung atau pilih dari galeri?", [
      { text: "Batal", style: "cancel" },
      { text: "Galeri", onPress: openGallery },
      { text: "Kamera", onPress: openCamera }
    ]);
  };

  // === FUNGSI SIMPAN DATA ===
  const handleSubmit = async () => {
    if (!name || !purpose) return Alert.alert('Peringatan', 'Nama dan Keperluan wajib diisi!');
    setLoading(true);
    // Simpan data tamu ke Supabase
    try {
      let publicUrl = null;
      // Jika ada foto, unggah ke storage Supabase
      if (photoUri) {
        const fileName = `guest_${Date.now()}.jpg`;

        // Baca file foto sebagai base64
        const base64 = await FileSystem.readAsStringAsync(photoUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Unggah file ke Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('guest-photos')
          .upload(fileName, decode(base64), {
            contentType: 'image/jpeg',
            upsert: false
          });

        // Tangani error unggahan
        if (uploadError) throw uploadError;

        // Dapatkan URL publik file yang diunggah
        const { data } = supabase.storage.from('guest-photos').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      // Simpan data tamu ke tabel 'guests'
      const { error } = await supabase.from('guests').insert([{
        name, phone, address, purpose, photo_url: publicUrl,
        admin_email: (await supabase.auth.getUser()).data.user?.email
      }]);
      // Tangani error penyimpanan data
      if (error) throw error;

      // Berhasil simpan data
      Alert.alert("Sukses", "Data tamu tersimpan!");
      setName(''); setPhone(''); setAddress(''); setPurpose(''); setPhotoUri(null);

    } catch (err: any) {
      console.log("Error Save:", err);
      Alert.alert("Gagal", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Komponen Label Input
  const Label = ({ text }: { text: string }) => (
    <Text style={{ marginBottom: 6, fontWeight: '600', color: '#374151', fontSize: 14 }}>{text}</Text>
  );

  // Render UI
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Input Data Tamu</Text>
        <Text style={styles.headerSubtitle}>Masukkan data pengunjung balai desa</Text>
      </View>
      
      // Form Input Data Tamu
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
          <View style={styles.formCard}>
            <View style={[styles.inputGroup, { alignItems: 'center', marginBottom: 24 }]}>
              {photoUri ? (
                <View style={{ alignItems: 'center' }}>
                  <Image source={{ uri: photoUri }} style={styles.previewRound} />
                  <Button mode="text" onPress={() => setPhotoUri(null)} textColor="#EF4444" compact>Hapus Foto</Button>
                </View>
              ) : (
                <TouchableOpacity style={styles.cameraCircle} onPress={pickImage}>
                  <Image source={{ uri: 'https://img.icons8.com/ios/50/6B7280/camera--v1.png' }} style={{ width: 32, height: 32, marginBottom: 4 }} />
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Ambil Foto</Text>
                </TouchableOpacity>
              )}
            </View>

            // Input Nama Lengkap
            <View style={styles.inputGroup}>
              <Label text="Nama Lengkap *" />
              <TextInput value={name} onChangeText={setName} mode="outlined" style={styles.input} outlineColor="#E5E7EB" activeOutlineColor="#10B981" />
            </View>
            // Input Nomor HP
            <View style={styles.inputGroup}>
              <Label text="Nomor HP *" />
              <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" mode="outlined" style={styles.input} outlineColor="#E5E7EB" activeOutlineColor="#10B981" />
            </View>
            // Input Alamat
            <View style={styles.inputGroup}>
              <Label text="Alamat *" />
              <TextInput value={address} onChangeText={setAddress} mode="outlined" multiline numberOfLines={2} style={[styles.input, {height: 60}]} outlineColor="#E5E7EB" activeOutlineColor="#10B981" />
            </View>
            // Input Keperluan
            <View style={styles.inputGroup}>
              <Label text="Keperluan *" />
              <TextInput value={purpose} onChangeText={setPurpose} mode="outlined" multiline numberOfLines={3} style={[styles.input, { height: 80 }]} outlineColor="#E5E7EB" activeOutlineColor="#10B981" />
            </View>
            // Tombol Simpan Data Tamu
            <Button mode="contained" onPress={handleSubmit} loading={loading} style={styles.submitBtn} buttonColor="#10B981" contentStyle={{ height: 48 }}>
              Simpan Data Tamu
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Gaya untuk komponen
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, paddingBottom: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  formCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 10 },
  inputGroup: { marginBottom: 16 },
  input: { backgroundColor: '#fff', fontSize: 14 },
  cameraCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  previewRound: { width: 100, height: 100, borderRadius: 50, marginBottom: 8, borderWidth: 2, borderColor: '#10B981' },
  submitBtn: { marginTop: 10, borderRadius: 8 }
});