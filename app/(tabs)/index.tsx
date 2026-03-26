import { useUser } from '@clerk/clerk-expo';
import { Activity, AlertTriangle, CheckCircle2, Clock, MapPin, PlusCircle } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user } = useUser();
  const firstName = user?.firstName || "Citizen";

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
            <TouchableOpacity style={styles.profileAvatar}>
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
              
              <TouchableOpacity style={styles.primaryBtn}>
                <PlusCircle size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Report New Issue</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* --- QUICK ACTION BUTTONS --- */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                <MapPin size={24} color="#3b82f6" />
              </View>
              <Text style={styles.actionCardTitle}>City Map</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
                <Activity size={24} color="#22c55e" />
              </View>
              <Text style={styles.actionCardTitle}>My Impact</Text>
            </TouchableOpacity>
          </View>

          {/* --- RECENT ACTIVITY SECTION --- */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent in your area</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listContainer}>
            {/* Mock Issue 1 */}
            <TouchableOpacity style={styles.issueCard}>
              <View style={styles.issueIconContainer}>
                <Clock size={20} color="#eab308" />
              </View>
              <View style={styles.issueContent}>
                <Text style={styles.issueTitle}>Deep Pothole on Main St.</Text>
                <Text style={styles.issueLocation}>1.2 miles away • Reported 2h ago</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(234,179,8,0.1)', borderColor: 'rgba(234,179,8,0.3)' }]}>
                <Text style={[styles.statusText, { color: '#eab308' }]}>Pending</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Mock Issue 2 */}
            <TouchableOpacity style={styles.issueCard}>
              <View style={styles.issueIconContainer}>
                <CheckCircle2 size={20} color="#22c55e" />
              </View>
              <View style={styles.issueContent}>
                <Text style={styles.issueTitle}>Broken Streetlight Fixed</Text>
                <Text style={styles.issueLocation}>0.8 miles away • Resolved yesterday</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }]}>
                <Text style={[styles.statusText, { color: '#4ade80' }]}>Resolved</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom Padding for ScrollView */}
          <View style={{ height: 40 }} />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- PURE REACT NATIVE STYLES ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020617' },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingVertical: 20 },
  container: { width: '90%', maxWidth: 450 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 10 },
  greeting: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#94a3b8', fontSize: 16 },
  profileAvatar: { height: 48, width: 48, backgroundColor: 'rgba(249,115,22,0.1)', borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderColor: 'rgba(249,115,22,0.5)', borderWidth: 1 },
  avatarText: { color: '#f97316', fontSize: 20, fontWeight: 'bold' },

  // Hero Card
  heroCard: { position: 'relative', width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 24, marginBottom: 24, borderColor: 'rgba(255,255,255,0.05)', borderWidth: 1, overflow: 'hidden' },
  heroGlow: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, backgroundColor: 'rgba(234,88,12,0.15)', borderRadius: 100, transform: [{ scaleX: 2 }] },
  heroContent: { position: 'relative', zIndex: 1 },
  heroIconBox: { height: 56, width: 56, backgroundColor: 'rgba(234,88,12,0.1)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  heroDescription: { color: '#cbd5e1', fontSize: 15, lineHeight: 22, marginBottom: 24 },
  primaryBtn: { backgroundColor: '#ea580c', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, width: '100%' },
  primaryBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // Action Row
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  actionCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 20, alignItems: 'center', borderColor: 'rgba(255,255,255,0.05)', borderWidth: 1, marginHorizontal: 6 },
  actionIconBox: { height: 48, width: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionCardTitle: { color: 'white', fontSize: 15, fontWeight: '600' },

  // Section Headers
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  seeAllText: { color: '#f97316', fontSize: 14, fontWeight: '600', marginBottom: 2 },

  // List Container
  listContainer: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, borderColor: 'rgba(255,255,255,0.05)', borderWidth: 1, overflow: 'hidden' },
  issueCard: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  issueIconContainer: { height: 40, width: 40, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  issueContent: { flex: 1 },
  issueTitle: { color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  issueLocation: { color: '#64748b', fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 72 },
});