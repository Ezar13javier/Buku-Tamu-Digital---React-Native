import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Image, Alert, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Text, Searchbar, ActivityIndicator, IconButton, Divider, Avatar, Portal, Modal, TextInput, Button } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// GUEST LIST SCREEN
export default function GuestListScreen() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();

  // === STATE EDIT ===
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingGuest, setEditingGuest] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // === FETCH DATA ===
  const fetchGuests = async () => {
    setLoading(true);
    let query = supabase.from('guests').select('*').order('created_at', { ascending: false });
    if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);
    const { data } = await query;
    setGuests(data || []);
    setLoading(false);
  };

  // Fetch data saat komponen mount & saat searchQuery berubah (dengan debounce)
  useEffect(() => { const t = setTimeout(fetchGuests, 500); return () => clearTimeout(t); }, [searchQuery]);
  const onRefresh = useCallback(() => { fetchGuests(); }, []);

  // === LOGIC HAPUS & EDIT ===
  const handleDelete = (id: string) => {
    Alert.alert("Hapus Data", "Yakin ingin menghapus?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
          await supabase.from('guests').delete().eq('id', id);
          fetchGuests();
      }}
    ]);
  };

  // === LOGIC EDIT ===
  const openEditModal = (item: any) => {
    setEditingGuest(item);
    setEditName(item.name); setEditPhone(item.phone || ''); setEditAddress(item.address || ''); setEditPurpose(item.purpose || '');
    setEditModalVisible(true);
  };

  // Simpan Edit
  const handleSaveEdit = async () => {
    setEditLoading(true);
    await supabase.from('guests').update({ name: editName, phone: editPhone, address: editAddress, purpose: editPurpose }).eq('id', editingGuest.id);
    setEditLoading(false); setEditModalVisible(false); fetchGuests();
  };

  // === FUNGSI BUKA WHATSAPP ===
  const openWA = (phone: string) => {
    if (phone) Linking.openURL(`https://wa.me/${phone.replace(/^0/, '62').replace(/\D/g, '')}`);
  };

  // === RENDER ITEM ===
  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>// HEADER KARTU
        {item.photo_url ? <Image source={{ uri: item.photo_url }} style={styles.avatar} /> : 
        <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{item.name[0]}</Text></View>}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.date}>{format(new Date(item.created_at), 'dd MMM • HH:mm', { locale: id })}</Text>
        </View>
        <View style={{flexDirection:'row'}}>// TOMBOL EDIT & HAPUS
          <IconButton icon="pencil-outline" size={20} iconColor="#F59E0B" onPress={() => openEditModal(item)} style={{margin:0}} />
          <IconButton icon="trash-can-outline" size={20} iconColor="#EF4444" onPress={() => handleDelete(item.id)} style={{margin:0}} />
        </View>
      </View>
      <Divider style={{ marginVertical: 10, backgroundColor: '#F3F4F6' }} />// PEMBATAS
      <View style={{ gap: 10 }}>
        <View style={styles.infoRow}>// KEPERLUAN
          <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
            <Avatar.Icon size={18} icon="briefcase-outline" color="#0284C7" style={{backgroundColor:'transparent'}} />
          </View>
          <View style={{flex: 1}}><Text style={styles.label}>Keperluan</Text><Text style={styles.value}>{item.purpose}</Text></View>
        </View>
        {item.phone && (// WHATSAPP
          <TouchableOpacity onPress={() => openWA(item.phone)} style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
              <Avatar.Icon size={18} icon="whatsapp" color="#16A34A" style={{backgroundColor:'transparent'}} />
            </View>
            <View style={{flex: 1}}><Text style={styles.label}>WhatsApp</Text><Text style={[styles.value, {color:'#16A34A', fontWeight:'bold'}]}>{item.phone}</Text></View>
          </TouchableOpacity>
        )}
        {item.address && (// ALAMAT
          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
              <Avatar.Icon size={18} icon="map-marker-outline" color="#4B5563" style={{backgroundColor:'transparent'}} />
            </View>
            <View style={{flex: 1}}><Text style={styles.label}>Alamat</Text><Text style={styles.value}>{item.address}</Text></View>
          </View>
        )}
      </View>
    </View>
  );

  // === RENDER ===
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Data Tamu</Text>
      </View>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Searchbar placeholder="Cari nama tamu..." onChangeText={setSearchQuery} value={searchQuery} style={styles.searchBar} inputStyle={{ fontSize: 14 }} />
      </View>
      <FlatList data={guests} keyExtractor={i => i.id} renderItem={renderItem} contentContainerStyle={{ padding: 16, paddingBottom: 80 }} refreshing={loading} onRefresh={onRefresh} ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30, color: '#9CA3AF' }}>Tidak ada data.</Text>} />
      
      // MODAL EDIT DATA
      <Portal>
        <Modal visible={editModalVisible} onDismiss={() => setEditModalVisible(false)} contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>Edit Data</Text>
          <ScrollView>// FORM EDIT
            <TextInput label="Nama" value={editName} onChangeText={setEditName} mode="outlined" style={styles.input} />
            <TextInput label="HP" value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" mode="outlined" style={styles.input} />
            <TextInput label="Alamat" value={editAddress} onChangeText={setEditAddress} mode="outlined" style={styles.input} />
            <TextInput label="Keperluan" value={editPurpose} onChangeText={setEditPurpose} mode="outlined" multiline style={styles.input} />
          </ScrollView>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
            <Button onPress={() => setEditModalVisible(false)} textColor="gray">Batal</Button>
            <Button mode="contained" onPress={handleSaveEdit} loading={editLoading} buttonColor="#10B981">Simpan</Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

// === 4. STYLESHEET ===
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  pageHeader: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  searchBar: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', elevation: 0 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarPlaceholder: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  name: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  date: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  label: { fontSize: 11, color: '#6B7280', marginBottom: 1 },
  value: { fontSize: 14, color: '#374151', flexWrap: 'wrap', flex: 1 },
  modalContainer: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#10B981' },
  input: { marginBottom: 10, backgroundColor: '#fff', fontSize: 14 }
});