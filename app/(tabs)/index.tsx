import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Activity, AlertTriangle, Bell, CheckCircle2, Clock, PlusCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

// Helper to format the date
const timeAgo = (date: string | Date) => {
  if (!date) return "N/A";
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
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

export default function HomeScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  
  const firstName = user?.firstName || "Citizen";

  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/reports/user`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          // Grab only the 3 most recent reports for the dashboard
          setRecentReports(data.reports.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to fetch recent reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentActivity();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          
          {/* --- HEADER SECTION --- */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
              <Text style={styles.subtitle}>Welcome to CivicConnect</Text>
            </View>
            <TouchableOpacity style={styles.profileAvatar} onPress={() => router.push('/profile')}>
              <Text style={styles.avatarText}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* --- HERO ACTION CARD --- */}
          <View style={styles.heroCard}>
            <View style={styles.heroGlow} />
            <View style={styles.heroContent}>
              <View style={styles.heroIconBox}>
                <AlertTriangle size={32} color="#ea580c" />
              </View>
              <Text style={styles.heroTitle}>See an issue?</Text>
              <Text style={styles.heroDescription}>
                Report potholes, broken streetlights, or illegal dumping instantly.
              </Text>
              
              <TouchableOpacity 
                style={styles.primaryBtn} 
                onPress={() => router.push('/report')}
              >
                <PlusCircle size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Report New Issue</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* --- QUICK ACTION BUTTONS --- */}
          <View style={styles.actionRow}>
            {/* REPLACED: City Map is now Notifications */}
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/notifications')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                <Bell size={24} color="#3b82f6" />
              </View>
              <Text style={styles.actionCardTitle}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/status')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
                <Activity size={24} color="#22c55e" />
              </View>
              <Text style={styles.actionCardTitle}>My Impact</Text>
            </TouchableOpacity>
          </View>

          {/* --- RECENT ACTIVITY SECTION --- */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/status')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listContainer}>
            {loading ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <ActivityIndicator color="#ea580c" />
              </View>
            ) : recentReports.length === 0 ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <Text style={{ color: '#64748b' }}>No recent reports found.</Text>
                <TouchableOpacity onPress={() => router.push('/report')} style={{ marginTop: 10 }}>
                  <Text style={{ color: '#ea580c', fontWeight: 'bold' }}>Create your first report</Text>
                </TouchableOpacity>
              </View>
            ) : (
              recentReports.map((report, index) => {
                const isResolved = report.status === 'RESOLVED';
                return (
                  <View key={report.id}>
                    <TouchableOpacity 
                      style={styles.issueCard}
                      onPress={() => router.push(`/report-detail?id=${report.reportId}`)}
                    >
                      <View style={styles.issueIconContainer}>
                        {isResolved ? (
                          <CheckCircle2 size={20} color="#22c55e" />
                        ) : (
                          <Clock size={20} color="#eab308" />
                        )}
                      </View>
                      
                      <View style={styles.issueContent}>
                        <Text style={styles.issueTitle} numberOfLines={1}>{report.title}</Text>
                        <Text style={styles.issueLocation}>
                          {report.city?.name || 'Unknown City'} • {timeAgo(report.createdAt)}
                        </Text>
                      </View>
                      
                      <View style={[
                        styles.statusBadge, 
                        isResolved 
                          ? { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }
                          : { backgroundColor: 'rgba(234,179,8,0.1)', borderColor: 'rgba(234,179,8,0.3)' }
                      ]}>
                        <Text style={[
                          styles.statusText, 
                          isResolved ? { color: '#4ade80' } : { color: '#eab308' }
                        ]}>
                          {report.status}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    
                    {index < recentReports.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })
            )}
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020617' },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingVertical: 20 },
  container: { width: '90%', maxWidth: 450 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 10 },
  greeting: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#94a3b8', fontSize: 16 },
  profileAvatar: { height: 48, width: 48, backgroundColor: 'rgba(249,115,22,0.1)', borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderColor: 'rgba(249,115,22,0.5)', borderWidth: 1 },
  avatarText: { color: '#f97316', fontSize: 20, fontWeight: 'bold' },

  heroCard: { position: 'relative', width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 24, marginBottom: 24, borderColor: 'rgba(255,255,255,0.05)', borderWidth: 1, overflow: 'hidden' },
  heroGlow: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, backgroundColor: 'rgba(234,88,12,0.15)', borderRadius: 100, transform: [{ scaleX: 2 }] },
  heroContent: { position: 'relative', zIndex: 1 },
  heroIconBox: { height: 56, width: 56, backgroundColor: 'rgba(234,88,12,0.1)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  heroDescription: { color: '#cbd5e1', fontSize: 15, lineHeight: 22, marginBottom: 24 },
  primaryBtn: { backgroundColor: '#ea580c', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, width: '100%' },
  primaryBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  actionCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 20, alignItems: 'center', borderColor: 'rgba(255,255,255,0.05)', borderWidth: 1, marginHorizontal: 6 },
  actionIconBox: { height: 48, width: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionCardTitle: { color: 'white', fontSize: 15, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  seeAllText: { color: '#f97316', fontSize: 14, fontWeight: '600', marginBottom: 2 },

  listContainer: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, borderColor: 'rgba(255,255,255,0.05)', borderWidth: 1, overflow: 'hidden' },
  issueCard: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  issueIconContainer: { height: 40, width: 40, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  issueContent: { flex: 1, paddingRight: 10 },
  issueTitle: { color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  issueLocation: { color: '#64748b', fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 72 },
});