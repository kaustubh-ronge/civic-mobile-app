

import { useAuth, useUser } from '@clerk/clerk-expo';
import * as FileSystem from 'expo-file-system/legacy'; // <-- FIXED DEPRECATION WARNING
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, ChevronDown, Info, MapPin, Plus, Search, ShieldAlert, Video, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api').replace(/\/$/, '');

const PREDEFINED_CATEGORIES = ["Roads & Potholes", "Water Supply", "Electricity / Lights", "Garbage & Sanitation", "Public Transport", "Other"];
const PRIORITIES = [{ label: "Auto-detect", value: "AUTO" }, { label: "Low", value: "LOW" }, { label: "Medium", value: "MEDIUM" }, { label: "High", value: "HIGH" }, { label: "Critical", value: "CRITICAL" }];

export default function ReportScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [cities, setCities] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [priority, setPriority] = useState('AUTO');
  const [description, setDescription] = useState('');

  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'city' | 'dept' | 'cat' | 'pri' | null>(null);

  const parseJsonResponse = async (res: Response) => {
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    try { return JSON.parse(text); } catch (err) { throw new Error("Invalid JSON"); }
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/cities`)
      .then(parseJsonResponse)
      .then(data => { if (data?.success) setCities(data.cities); })
      .catch(err => console.error('Failed to fetch cities:', err));
  }, []);

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId);
    setSelectedDept('');
    fetch(`${API_BASE_URL}/departments?cityId=${cityId}`)
      .then(parseJsonResponse)
      .then(data => { if (data?.success) setDepartments(data.depts); })
      .catch(err => console.error('Failed to fetch departments:', err));
  };

  useEffect(() => {
    if (locationQuery.length < 3) {
      setLocationResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=5`,
          { headers: { 'User-Agent': 'CivicConnect Mobile App/1.0', 'Accept': 'application/json' } }
        );
        if (!res.ok) return;
        const data = await res.json();
        setLocationResults(data);
      } catch (err) { } finally {
        setIsSearching(false);
      }
    }, 600);
    return () => clearTimeout(delay);
  }, [locationQuery]);

  const pickImage = async () => {
    if (images.length >= 5) return Alert.alert("Limit Reached", "Max 5 images allowed.");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.2, // Compressed for Vercel
    });
    if (!result.canceled) {
      setImages([...images, ...result.assets.map(a => a.uri)].slice(0, 5));
    }
  };

  const pickVideo = async () => {
    if (videos.length >= 2) return Alert.alert("Limit Reached", "Max 2 videos allowed.");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsMultipleSelection: true,
      selectionLimit: 2 - videos.length,
    });
    if (!result.canceled) {
      setVideos([...videos, ...result.assets.map(a => a.uri)].slice(0, 2));
    }
  };

  // const handleSubmit = async () => {
  //   if (!selectedCity || !selectedDept || !locationData || !title || !description || !category) {
  //     return Alert.alert("Missing Fields", "Please fill out all required fields marked with *");
  //   }

  //   // Fixed the deprecation warning usage here
  //   const checkFileSizes = async () => {
  //     let totalMB = 0;
  //     const checkUri = async (uri: string, label: string) => {
  //       const info = await FileSystem.getInfoAsync(uri);
  //       if (!info.exists || info.size == null) return;
  //       const mb = info.size / 1024 / 1024;
  //       totalMB += mb;
  //       if (mb > 4.0) throw new Error(`One ${label} is too large (${mb.toFixed(1)}MB). Limit is 4.0MB.`);
  //     };

  //     for (const uri of images) await checkUri(uri, 'image');
  //     for (const uri of videos) await checkUri(uri, 'video');

  //     if (totalMB > 4.2) throw new Error(`Total upload size (${totalMB.toFixed(1)}MB) exceeds 4.5MB limit.`);
  //   };

  //   try { await checkFileSizes(); } catch (sizeErr: any) { return Alert.alert('File Too Large', sizeErr.message); }

  //   setLoading(true);
  //   try {
  //     const token = await getToken();
  //     const formData = new FormData();

  //     // 1. DIRECT UPLOAD TO MUX
  //     const uploadedVideoIds: string[] = [];
  //     for (const videoUri of videos) {
  //       const ticketRes = await fetch(`${API_BASE_URL}/mux-upload`);
  //       if (!ticketRes.ok) throw new Error("Failed to get upload ticket.");
  //       const { uploadUrl, uploadId } = await ticketRes.json();

  //       // Using FileSystem to safely upload large blobs
  //       const uploadResult = await FileSystem.uploadAsync(uploadUrl, videoUri, {
  //         httpMethod: 'PUT',
  //         headers: { 'Content-Type': 'video/mp4' }
  //       });

  //       if (uploadResult.status === 200 || uploadResult.status === 201) {
  //         uploadedVideoIds.push(uploadId);
  //       } else {
  //         throw new Error("Mux upload failed.");
  //       }
  //     }

  //     // 2. BUILD FORM DATA
  //     formData.append("title", title);
  //     formData.append("description", description);
  //     formData.append("cityId", selectedCity);
  //     formData.append("departmentId", selectedDept);
  //     formData.append("lat", String(locationData.lat));
  //     formData.append("lng", String(locationData.lon));
  //     formData.append("address", locationData.address);
  //     formData.append("category", category);
  //     if (category === "Other") formData.append("customCategory", customCategory);
  //     formData.append("priority", priority);
  //     tags.forEach(tag => formData.append("tags", tag));

  //     images.forEach((uri, i) => {
  //       const filename = uri.split('/').pop() || `image${i}.jpg`;
  //       formData.append("images", { uri, name: filename, type: 'image/jpeg' } as any);
  //     });

  //     // Send the Mux IDs to our new dedicated endpoint
  //     uploadedVideoIds.forEach(id => {
  //       formData.append("muxVideoIds", id);
  //     });

  //     // 3. SUBMIT TO THE NEW DEDICATED MOBILE ENDPOINT
  //     const res = await fetch(`${API_BASE_URL}/reports/mobile`, {
  //       method: 'POST',
  //       body: formData,
  //       headers: { 'Authorization': `Bearer ${token}` },
  //     });

  //     const data = await parseJsonResponse(res);

  //     if (data.success) {
  //       Alert.alert("Success!", "Report submitted successfully.", [
  //         { text: "Track Status", onPress: () => router.push(`/status?track=${data.reportId}`) }
  //       ]);
  //       setTitle(''); setDescription(''); setLocationData(null); setLocationQuery(''); setImages([]); setVideos([]); setTags([]);
  //     } else {
  //       Alert.alert("Server Error", data.error || "Failed to submit report.");
  //     }
  //   } catch (err: any) {
  //     Alert.alert("Submission Error", err.message || "Connection failed.");
  //     console.error(err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  const handleSubmit = async () => {
    if (!selectedCity || !selectedDept || !locationData || !title || !description || !category) {
      return Alert.alert("Missing Fields", "Please fill out all required fields marked with *");
    }

    // --- VERCEL LIMIT ENFORCEMENT ---
    const checkFileSizes = async () => {
      let totalMB = 0;
      const checkUri = async (uri: string, label: string) => {
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists || info.size == null) return;
        const mb = info.size / 1024 / 1024;
        totalMB += mb;
        if (mb > 4.0) {
          throw new Error(`One ${label} is too large (${mb.toFixed(1)}MB). Must be under 4.0MB for the server.`);
        }
      };

      for (const uri of images) await checkUri(uri, 'image');
      for (const uri of videos) await checkUri(uri, 'video');

      if (totalMB > 4.2) {
        throw new Error(`Total upload size (${totalMB.toFixed(1)}MB) exceeds the 4.5MB server limit. Please remove a file.`);
      }
    };

    try {
      await checkFileSizes();
    } catch (sizeErr: any) {
      return Alert.alert('File Too Large', sizeErr.message);
    }

    setLoading(true);
    try {
      // 1. Get the token FIRST so we can use it for Mux AND the final submission
      const token = await getToken();
      const formData = new FormData();

      // 2. DIRECT UPLOAD TO MUX
      const uploadedVideoIds: string[] = [];
      for (const videoUri of videos) {

        // --- FIXED: Added the Authorization Header here! ---
        const ticketRes = await fetch(`${API_BASE_URL}/mux-upload`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!ticketRes.ok) {
          const errText = await ticketRes.text();
          throw new Error(`Ticket Error (${ticketRes.status}): ${errText}`);
        }

        const { uploadUrl, uploadId } = await ticketRes.json();

        // Using FileSystem to safely upload large blobs to the URL Mux gave us
        const uploadResult = await FileSystem.uploadAsync(uploadUrl, videoUri, {
          httpMethod: 'PUT',
          headers: { 'Content-Type': 'video/mp4' }
        });

        if (uploadResult.status === 200 || uploadResult.status === 201) {
          uploadedVideoIds.push(uploadId);
        } else {
          throw new Error("Mux upload failed.");
        }
      }

      // 3. BUILD FORM DATA
      formData.append("title", title);
      formData.append("description", description);
      formData.append("cityId", selectedCity);
      formData.append("departmentId", selectedDept);
      formData.append("lat", String(locationData.lat));
      formData.append("lng", String(locationData.lon));
      formData.append("address", locationData.address);
      formData.append("category", category);
      if (category === "Other") formData.append("customCategory", customCategory);
      formData.append("priority", priority);
      tags.forEach(tag => formData.append("tags", tag));

      images.forEach((uri, i) => {
        const filename = uri.split('/').pop() || `image${i}.jpg`;
        formData.append("images", { uri, name: filename, type: 'image/jpeg' } as any);
      });

      // Send the Mux IDs to our new dedicated endpoint
      uploadedVideoIds.forEach(id => {
        formData.append("muxVideoIds", id);
      });

      // 4. SUBMIT TO THE NEW DEDICATED MOBILE ENDPOINT
      const res = await fetch(`${API_BASE_URL}/reports/mobile`, {
        method: 'POST',
        body: formData,
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server error: ${responseText.slice(0, 50)}...`);
      }

      if (res.ok && data.success) {
        Alert.alert("Success!", "Report submitted successfully.", [
          { text: "Track Status", onPress: () => router.push(`/status?track=${data.reportId}`) }
        ]);
        setTitle(''); setDescription(''); setLocationData(null); setLocationQuery(''); setImages([]); setVideos([]); setTags([]);
      } else {
        Alert.alert("Server Error", data.error || "Failed to submit report.");
      }
    } catch (err: any) {
      Alert.alert("Submission Error", err.message || "Connection failed.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const Dropdown = ({ label, value, options, onSelect, type }: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label} <Text style={{ color: '#ef4444' }}>*</Text></Text>
      <TouchableOpacity style={styles.selectBox} onPress={() => setActiveDropdown(type)}>
        <Text style={{ color: value ? 'white' : '#64748b', fontSize: 16 }}>
          {options.find((o: any) => o.id === value || o.value === value)?.name || options.find((o: any) => o.id === value || o.value === value)?.label || `Select ${label}`}
        </Text>
        <ChevronDown size={20} color="#64748b" />
      </TouchableOpacity>
      <Modal visible={activeDropdown === type} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <TouchableOpacity onPress={() => setActiveDropdown(null)}><X size={24} color="#94a3b8" /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {options.map((opt: any) => (
                <TouchableOpacity key={opt.id || opt.value || opt} style={styles.modalOption} onPress={() => { onSelect(opt.id || opt.value || opt); setActiveDropdown(null); }}>
                  <Text style={styles.modalOptionText}>{opt.name || opt.label || opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex1}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <ShieldAlert size={14} color="#fb923c" style={{ marginRight: 6 }} />
              <Text style={styles.headerBadgeText}>SECURE & ANONYMOUS</Text>
            </View>
            <Text style={styles.title}>Report an Issue</Text>
            <Text style={styles.subtitle}>Your voice matters. Report infrastructure issues directly to the administration.</Text>
          </View>

          {/* STEP 1: AUTHORITY */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.stepBadge}><Text style={styles.stepText}>1</Text></View>
              <Text style={styles.cardTitle}>Select Authority</Text>
            </View>
            <Dropdown label="City / Corporation" value={selectedCity} options={cities} onSelect={handleCityChange} type="city" />
            <Dropdown label="Department" value={selectedDept} options={departments} onSelect={setSelectedDept} type="dept" />
          </View>

          {/* STEP 2: LOCATION */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.stepBadge, locationData && { backgroundColor: 'rgba(34,197,94,0.2)', borderColor: '#22c55e' }]}><Text style={[styles.stepText, locationData && { color: '#4ade80' }]}>2</Text></View>
              <Text style={styles.cardTitle}>Location</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Search Area / Landmark <Text style={{ color: '#ef4444' }}>*</Text></Text>
              <View style={styles.searchBox}>
                <Search size={20} color="#64748b" style={{ marginLeft: 12 }} />
                <TextInput value={locationQuery} onChangeText={setLocationQuery} placeholder="Type an address..." placeholderTextColor="#64748b" style={styles.searchInput} />
                {isSearching && <ActivityIndicator size="small" color="#ea580c" style={{ marginRight: 12 }} />}
              </View>
              {locationResults.length > 0 && !locationData && (
                <View style={styles.resultsDropdown}>
                  {locationResults.map((loc: any) => (
                    <TouchableOpacity key={loc.place_id} style={styles.resultItem} onPress={() => { setLocationData({ lat: loc.lat, lon: loc.lon, address: loc.display_name }); setLocationQuery(loc.display_name); setLocationResults([]); }}>
                      <MapPin size={16} color="#ea580c" style={{ marginTop: 2 }} />
                      <Text style={styles.resultText}>{loc.display_name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {locationData && (
                <View style={styles.locationLocked}>
                  <MapPin size={24} color="#4ade80" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: '#4ade80', fontSize: 12, fontWeight: 'bold' }}>LOCATION LOCKED</Text>
                    <Text style={{ color: '#cbd5e1', fontSize: 14 }}>{locationData.address}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setLocationData(null); setLocationQuery(''); }}><X size={20} color="#94a3b8" /></TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* STEP 3: DETAILS */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.stepBadge}><Text style={styles.stepText}>3</Text></View>
              <Text style={styles.cardTitle}>Issue Details</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Issue Title <Text style={{ color: '#ef4444' }}>*</Text></Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Broken Pipe on Main St" placeholderTextColor="#64748b" style={styles.input} />
            </View>

            <Dropdown label="Category" value={category} options={PREDEFINED_CATEGORIES.map(c => ({ id: c, name: c }))} onSelect={setCategory} type="cat" />
            {category === 'Other' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Specify Category <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput value={customCategory} onChangeText={setCustomCategory} placeholder="Custom category..." placeholderTextColor="#64748b" style={[styles.input, { borderColor: '#ea580c' }]} />
              </View>
            )}

            <Dropdown label="Priority (Optional)" value={priority} options={PRIORITIES} onSelect={setPriority} type="pri" />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description <Text style={{ color: '#ef4444' }}>*</Text></Text>
              <TextInput value={description} onChangeText={setDescription} placeholder="Detailed description..." placeholderTextColor="#64748b" multiline numberOfLines={4} style={[styles.input, { height: 120, textAlignVertical: 'top' }]} />
            </View>

            {/* Tags */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags (Optional, Max 5)</Text>
              <View style={styles.tagInputRow}>
                <TextInput value={tagInput} onChangeText={setTagInput} placeholder="Add a tag..." placeholderTextColor="#64748b" style={[styles.input, { flex: 1, marginBottom: 0 }]} />
                <TouchableOpacity style={styles.addTagBtn} onPress={() => { if (tagInput && tags.length < 5) { setTags([...tags, tagInput]); setTagInput(''); } }}><Plus size={20} color="white" /></TouchableOpacity>
              </View>
              <View style={styles.tagRow}>
                {tags.map((t, i) => (
                  <View key={i} style={styles.tagBadge}>
                    <Text style={styles.tagText}>{t}</Text>
                    <TouchableOpacity onPress={() => setTags(tags.filter((_, idx) => idx !== i))}><X size={14} color="#cbd5e1" style={{ marginLeft: 6 }} /></TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Media Uploads */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Media Evidence</Text>
              <View style={styles.infoBox}>
                <Info size={16} color="#3b82f6" style={{ marginRight: 8, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoTitle}>Server Limits Apply (Max 4.5MB Total)</Text>
                  <Text style={styles.infoText}>• Photos: Max 5 (Compressed automatically)</Text>
                  <Text style={styles.infoText}>• Videos: Max 2 (Must be very short, under 4MB)</Text>
                </View>
              </View>

              <View style={styles.mediaRow}>
                <TouchableOpacity style={styles.mediaBtn} onPress={pickImage}>
                  <Camera size={24} color="#ea580c" />
                  <Text style={styles.mediaBtnText}>Photos ({images.length}/5)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaBtn} onPress={pickVideo}>
                  <Video size={24} color="#3b82f6" />
                  <Text style={styles.mediaBtnText}>Videos ({videos.length}/2)</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Media Previews */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
              {images.map((uri, i) => (
                <View key={`img-${i}`} style={styles.previewBox}>
                  <Image source={{ uri }} style={styles.previewImg} />
                  <TouchableOpacity style={styles.removeMedia} onPress={() => setImages(images.filter((_, idx) => idx !== i))}><X size={14} color="white" /></TouchableOpacity>
                </View>
              ))}
              {videos.map((uri, i) => (
                <View key={`vid-${i}`} style={[styles.previewBox, { backgroundColor: '#1e293b' }]}>
                  <Video size={30} color="#94a3b8" />
                  <TouchableOpacity style={styles.removeMedia} onPress={() => setVideos(videos.filter((_, idx) => idx !== i))}><X size={14} color="white" /></TouchableOpacity>
                </View>
              ))}
            </ScrollView>

          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.submitBtn, (loading || !locationData || !selectedDept) && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={loading || !locationData || !selectedDept}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <ShieldAlert size={20} color="white" style={{ marginRight: 10 }} />
                <Text style={styles.submitBtnText}>Submit Secure Report</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020617' },
  flex1: { flex: 1 },
  scrollContent: { padding: 20 },

  header: { marginBottom: 24, marginTop: 10 },
  headerBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(234,88,12,0.1)', borderColor: 'rgba(234,88,12,0.3)', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  headerBadgeText: { color: '#fb923c', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  title: { color: 'white', fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#94a3b8', fontSize: 16, lineHeight: 24 },

  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderRadius: 24, padding: 20, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  stepBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  cardTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  inputGroup: { marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderRadius: 12, height: 50, paddingHorizontal: 16, color: 'white', fontSize: 16 },

  selectBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderRadius: 12, height: 50, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderRadius: 12, height: 50 },
  searchInput: { flex: 1, height: '100%', color: 'white', paddingHorizontal: 12, fontSize: 16 },
  resultsDropdown: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 12, marginTop: 4, overflow: 'hidden' },
  resultItem: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  resultText: { color: '#e2e8f0', marginLeft: 12, flex: 1 },
  locationLocked: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)', borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 12 },

  tagInputRow: { flexDirection: 'row', gap: 10 },
  addTagBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tagBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  tagText: { color: '#cbd5e1', fontSize: 12 },

  infoBox: { flexDirection: 'row', backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)', borderWidth: 1, padding: 12, borderRadius: 12, marginBottom: 12 },
  infoTitle: { color: '#60a5fa', fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  infoText: { color: '#94a3b8', fontSize: 12, marginBottom: 2 },

  mediaRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  mediaBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, height: 60 },
  mediaBtnText: { color: '#e2e8f0', marginLeft: 8, fontWeight: '500' },
  previewScroll: { marginTop: 16 },
  previewBox: { width: 80, height: 80, borderRadius: 12, marginRight: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' },
  previewImg: { width: '100%', height: '100%' },
  removeMedia: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(239,68,68,0.9)', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },

  submitBtn: { backgroundColor: '#ea580c', flexDirection: 'row', height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#ea580c', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  submitBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  modalOption: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  modalOptionText: { color: 'white', fontSize: 16 }
});