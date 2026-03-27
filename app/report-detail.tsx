

import { useAuth } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Building2, Clock, MapPin, Tag, VideoIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

const parseJsonResponse = async (res: Response) => {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON from ${res.url}: ${text}`);
  }
};

const timeAgo = (date: string | Date) => {
  if (!date) return "N/A";
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + "y ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + "mo ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + "d ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + "h ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + "m ago";
  return "just now";
};

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams();
  const { getToken } = useAuth();
  const router = useRouter();
  
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/reports/${String(id).trim()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setReport(data.report);
        else Alert.alert("Error", "Report not found");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator color="#ea580c" size="large" /></View>;
  if (!report) return <View style={[styles.container, styles.center]}><Text style={{color: 'white'}}>Report not found.</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Report Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View style={[styles.statusBadge, { borderColor: report.status === 'RESOLVED' ? '#22c55e' : '#ea580c' }]}>
             <Text style={[styles.statusText, { color: report.status === 'RESOLVED' ? '#22c55e' : '#ea580c' }]}>{report.status}</Text>
          </View>
          <Text style={styles.reportIdText}>#{report.reportId}</Text>
        </View>

        <Text style={styles.title}>{report.title}</Text>
        
        {/* CATEGORY & PRIORITY */}
        <View style={styles.badgeRow}>
          <View style={styles.miniBadge}><Text style={styles.miniBadgeText}>{report.category}</Text></View>
          <View style={[styles.miniBadge, {backgroundColor: '#1e293b'}]}><Text style={styles.miniBadgeText}>{report.priority} PRIORITY</Text></View>
        </View>

        <View style={styles.metaRow}>
          <Clock size={14} color="#64748b" />
          <Text style={styles.metaText}>{timeAgo(report.createdAt)}</Text>
          <Building2 size={14} color="#64748b" style={{marginLeft: 15}} />
          <Text style={styles.metaText}>{report.department?.name}</Text>
        </View>

        {/* GALLERY */}
        <Text style={styles.sectionTitle}>Evidence Gallery</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
          {report.images?.map((img: any, i: number) => (
            <TouchableOpacity key={`img-${i}`} onPress={() => Linking.openURL(img.url)}>
              <Image source={{ uri: img.url }} style={styles.galleryImg} />
            </TouchableOpacity>
          ))}

          {((report.videos && report.videos.length > 0) ? report.videos : (report.muxVideoIds || [])).map((vid: any, i: number) => {
            const playbackId = vid.playbackId || vid;
            const videoUrl = vid.url || `https://stream.mux.com/${playbackId}.m3u8`;
            return (
              <TouchableOpacity
                key={`vid-${i}`}
                style={[styles.galleryImg, styles.videoPlaceholder]}
                onPress={() => Linking.openURL(videoUrl)}
              >
                <VideoIcon size={32} color="#ea580c" />
                <Text style={styles.videoLabel}>PLAY VIDEO</Text>
              </TouchableOpacity>
            );
          })}

          {(!report.images?.length && !(report.videos?.length || report.muxVideoIds?.length)) && (
            <View style={[styles.galleryImg, styles.videoPlaceholder]}>
              <VideoIcon size={32} color="#94a3b8" />
              <Text style={styles.videoLabel}>No evidence uploaded yet</Text>
            </View>
          )}
        </ScrollView>

        {/* TAGS */}
        {report.tags?.length > 0 && (
          <View style={styles.tagRow}>
            {report.tags.map((t: any) => (
              <View key={t.id} style={styles.tagBadge}>
                <Tag size={12} color="#94a3b8" />
                <Text style={styles.tagText}>{t.name}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.card}>
          <Text style={styles.description}>{report.description}</Text>
        </View>

        <Text style={styles.sectionTitle}>Location</Text>
        <TouchableOpacity 
          style={styles.locationCard}
          onPress={() => {
            const latLng = `${report.latitude},${report.longitude}`;
            const url = Platform.OS === 'ios' ? `maps:0,0?q=${latLng}` : `geo:0,0?q=${latLng}`;
            Linking.openURL(url);
          }}
        >
          <MapPin size={20} color="#ea580c" />
          <Text style={styles.locationText}>{report.address || report.city?.name}</Text>
          <Text style={styles.openMap}>Open Map</Text>
        </TouchableOpacity>

        {report.adminNote && (
          <View style={styles.adminCard}>
            <Text style={styles.adminTitle}>Official Update</Text>
            <Text style={styles.adminNote}>{report.adminNote}</Text>
          </View>
        )}

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  center: { justifyContent: 'center', alignItems: 'center' },
  nav: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  navTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  scroll: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  reportIdText: { color: '#64748b', fontWeight: 'bold', fontSize: 14 },
  title: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  miniBadge: { backgroundColor: 'rgba(234,88,12,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  miniBadgeText: { color: '#cbd5e1', fontSize: 10, fontWeight: 'bold' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  metaText: { color: '#64748b', fontSize: 14, marginLeft: 5 },
  sectionTitle: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 10 },
  gallery: { marginBottom: 20 },
  galleryImg: { width: 150, height: 150, borderRadius: 16, marginRight: 12, backgroundColor: '#1e293b' },
  videoPlaceholder: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#ea580c' },
  videoLabel: { color: '#ea580c', fontSize: 10, marginTop: 5, fontWeight: 'bold' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tagBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 5 },
  tagText: { color: '#94a3b8', fontSize: 12 },
  card: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16, borderLeftWidth: 3, borderLeftColor: '#ea580c' },
  description: { color: '#cbd5e1', fontSize: 16, lineHeight: 24 },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16, marginTop: 5 },
  locationText: { color: 'white', flex: 1, marginLeft: 10, fontSize: 14 },
  openMap: { color: '#ea580c', fontWeight: 'bold', fontSize: 12 },
  adminCard: { backgroundColor: 'rgba(59,130,246,0.05)', padding: 20, borderRadius: 20, marginTop: 30, borderWidth: 1, borderColor: 'rgba(59,130,246,0.1)' },
  adminTitle: { color: '#60a5fa', fontWeight: 'bold', marginBottom: 10 },
  adminNote: { color: '#e2e8f0', lineHeight: 22 }
});