import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy'; // Tetap pakai legacy
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [purpose, setPurpose] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // === FUNGSI BUKA KAMERA ===
  const openCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        return Alert.alert("Izin Ditolak", "Mohon buka Pengaturan HP > Aplikasi > Expo Go > Izin > Izinkan Kamera.");
      }

      const result = await ImagePicker.launchCameraAsync({
        // KITA KEMBALIKAN KE 'MediaTypeOptions' AGAR TIDAK ERROR
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        allowsEditing: false, 
        quality: 0.5,
      });

      if (!result.canceled) setPhotoUri(result.assets[0].uri);
    } catch (error: any) {
      Alert.alert("Error Kamera", error.message); 
    }
  };

  // === FUNGSI BUKA GALERI ===
  const openGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        return Alert.alert("Izin Ditolak", "Mohon izinkan akses galeri di pengaturan HP.");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        // KITA KEMBALIKAN KE 'MediaTypeOptions' AGAR TIDAK ERROR
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.5,
      });

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
    
    try {
      let publicUrl = null;

      if (photoUri) {
        const fileName = `guest_${Date.now()}.jpg`;
        
        const base64 = await FileSystem.readAsStringAsync(photoUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { error: uploadError } = await supabase.storage
          .from('guest-photos')
          .upload(fileName, decode(base64), {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('guest-photos').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      const { error } = await supabase.from('guests').insert([{
        name, phone, address, purpose, photo_url: publicUrl,
        admin_email: (await supabase.auth.getUser()).data.user?.email
      }]);

      if (error) throw error;

      Alert.alert("Sukses", "Data tamu tersimpan!");
      setName(''); setPhone(''); setAddress(''); setPurpose(''); setPhotoUri(null);

    } catch (err: any) {
      console.log("Error Save:", err);
      Alert.alert("Gagal", err.message);
    } finally {
      setLoading(false);
    }
  };

  const Label = ({ text }: { text: string }) => (
    <Text style={{ marginBottom: 6, fontWeight: '600', color: '#374151', fontSize: 14 }}>{text}</Text>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Input Data Tamu</Text>
        <Text style={styles.headerSubtitle}>Masukkan data pengunjung balai desa</Text>
      </View>
      
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

            <View style={styles.inputGroup}>
              <Label text="Nama Lengkap *" />
              <TextInput value={name} onChangeText={setName} mode="outlined" style={styles.input} outlineColor="#E5E7EB" activeOutlineColor="#10B981" />
            </View>

            <View style={styles.inputGroup}>
              <Label text="Nomor HP *" />
              <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" mode="outlined" style={styles.input} outlineColor="#E5E7EB" activeOutlineColor="#10B981" />
            </View>

            <View style={styles.inputGroup}>
              <Label text="Alamat *" />
              <TextInput value={address} onChangeText={setAddress} mode="outlined" multiline numberOfLines={2} style={[styles.input, {height: 60}]} outlineColor="#E5E7EB" activeOutlineColor="#10B981" />
            </View>

            <View style={styles.inputGroup}>
              <Label text="Keperluan *" />
              <TextInput value={purpose} onChangeText={setPurpose} mode="outlined" multiline numberOfLines={3} style={[styles.input, { height: 80 }]} outlineColor="#E5E7EB" activeOutlineColor="#10B981" />
            </View>

            <Button mode="contained" onPress={handleSubmit} loading={loading} style={styles.submitBtn} buttonColor="#10B981" contentStyle={{ height: 48 }}>
              Simpan Data Tamu
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

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