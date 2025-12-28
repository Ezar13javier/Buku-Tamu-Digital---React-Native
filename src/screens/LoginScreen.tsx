import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Title, HelperText } from 'react-native-paper';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // Mode Login atau Register

  // Fungsi Login
  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert('Login Gagal', error.message);
    setLoading(false);
  }

  // Fungsi Register (Daftar Admin Baru)
  async function handleRegister() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('Register Gagal', error.message);
    } else {
      Alert.alert('Berhasil!', 'Silakan cek email untuk verifikasi (jika perlu) atau langsung login.');
      setIsRegistering(false); // Kembali ke mode login
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Title style={styles.title}>
        {isRegistering ? 'Daftar Admin Baru' : 'Login Admin Desa'}
      </Title>
      
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
      
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
        left={<TextInput.Icon icon="lock" />}
      />
      
      <HelperText type="info" visible={true}>
        {isRegistering ? 'Password minimal 6 karakter' : 'Masukan akun admin balai desa'}
      </HelperText>

      <Button 
        mode="contained" 
        onPress={isRegistering ? handleRegister : handleLogin} 
        loading={loading}
        style={styles.button}
      >
        {isRegistering ? 'Daftar Sekarang' : 'Masuk'}
      </Button>

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