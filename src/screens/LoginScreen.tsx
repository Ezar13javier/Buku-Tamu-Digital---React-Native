import React, { useState } from 'react'; // Import React dan useState
import { View, StyleSheet, Alert } from 'react-native'; // Import komponen dasar dari React Native
import { TextInput, Button, Text, Title, HelperText } from 'react-native-paper';// Import komponen dari React Native Paper
import { supabase } from '../lib/supabase';// Import instance Supabase

// Komponen LoginScreen
export default function LoginScreen() {
  const [email, setEmail] = useState('');// State untuk email
  const [password, setPassword] = useState('');// State untuk password
  const [loading, setLoading] = useState(false);// State untuk loading
  const [isRegistering, setIsRegistering] = useState(false); // State untuk mode register

  // Fungsi Login
  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert('Login Gagal', error.message);
    setLoading(false);// Set loading ke false setelah proses selesai
  }

  // Fungsi Register (Daftar Admin Baru)
  async function handleRegister() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    // Tampilkan pesan sesuai hasil pendaftaran
    if (error) {
      Alert.alert('Register Gagal', error.message);
    } else {
      Alert.alert('Berhasil!', 'Silakan cek email untuk verifikasi (jika perlu) atau langsung login.');
      setIsRegistering(false); // Kembali ke mode login
    }
    setLoading(false);
  }

  // Render UI
  return (
    <View style={styles.container}>
      <Title style={styles.title}>
        {isRegistering ? 'Daftar Admin Baru' : 'Login Admin Desa'}
      </Title>
      
      // Input Email
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        mode="outlined"
        left={<TextInput.Icon icon="email" />}
      />
      
      // Input Password
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
        left={<TextInput.Icon icon="lock" />}
      />
      
      // Informasi Bantuan
      <HelperText type="info" visible={true}>
        {isRegistering ? 'Password minimal 6 karakter' : 'Masukan akun admin balai desa'}
      </HelperText>

      // Tombol Login atau Daftar
      <Button 
        mode="contained" 
        onPress={isRegistering ? handleRegister : handleLogin} 
        loading={loading}
        style={styles.button}
      >
        {isRegistering ? 'Daftar Sekarang' : 'Masuk'}
      </Button>

      // Tombol untuk beralih antara Login dan Register
      <Button 
        mode="text" 
        onPress={() => setIsRegistering(!isRegistering)}
        style={styles.switchButton}
      >
        {isRegistering ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}
      </Button>
    </View>
  );
}

// Gaya untuk komponen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2E7D32',
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
    paddingVertical: 5,
  },
  switchButton: {
    marginTop: 20,
  }
});