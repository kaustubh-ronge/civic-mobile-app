import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, Bell, CheckCheck, CheckCircle2, ChevronRight, Clock, Info, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

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

export default function NotificationsScreen() {
  const { getToken } = useAuth();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState<any>(null); // Controls the individual popup

  // Fetch real notifications
  const fetchNotifications = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  // Mark single as read
  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      const token = await getToken();
      await fetch(`${API_BASE_URL}/notifications`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      });
    } catch (e) {}
  };

  // Mark ALL as read
  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      const token = await getToken();
      await fetch(`${API_BASE_URL}/notifications`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // empty body triggers mark all
      });
    } catch (e) {}
  };

  const openNotification = (notif: any) => {
    if (!notif.isRead) markAsRead(notif.id);
    setSelectedNotif(notif);
  };

  // Determines icon style based on the title
  const getIconConfig = (title: string = "") => {
    const lower = title.toLowerCase();
    if (lower.includes('resolved') || lower.includes('fixed')) return { Icon: CheckCircle2, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
    if (lower.includes('update') || lower.includes('progress')) return { Icon: Clock, color: '#eab308', bg: 'rgba(234,179,8,0.1)' };
    if (lower.includes('alert') || lower.includes('warning')) return { Icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    return { Icon: Info, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      
      {/* --- NAV BAR --- */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <View style={styles.navTitleContainer}>
          <Text style={styles.navTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={markAllAsRead} style={styles.markReadBtn}>
          <CheckCheck size={20} color="#ea580c" />
        </TouchableOpacity>
      </View>

      {/* --- NOTIFICATIONS LIST --- */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
           <View style={{ marginTop: 100 }}><ActivityIndicator color="#ea580c" size="large" /></View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color="#1e293b" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyStateTitle}>All caught up!</Text>
            <Text style={styles.emptyStateSub}>You have no new notifications.</Text>
          </View>
        ) : (
          notifications.map((notif) => {
            const { Icon, color, bg } = getIconConfig(notif.title);
            
            return (
              <TouchableOpacity 
                key={notif.id} 
                style={[styles.notificationCard, !notif.isRead && styles.unreadCard]}
                onPress={() => openNotification(notif)} // Opens individual modal
              >
                {!notif.isRead && <View style={styles.unreadDot} />}
                <View style={[styles.iconContainer, { backgroundColor: bg }]}><Icon size={24} color={color} /></View>
                <View style={styles.contentContainer}>
                  <View style={styles.headerRow}>
                    <Text style={styles.title} numberOfLines={1}>{notif.title}</Text>
                    <Text style={styles.timeText}>{timeAgo(notif.createdAt)}</Text>
                  </View>
                  <Text style={styles.messageText} numberOfLines={2}>{notif.message}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* --- INDIVIDUAL NOTIFICATION MODAL --- */}
      <Modal visible={!!selectedNotif} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <View style={[styles.iconContainer, { backgroundColor: selectedNotif ? getIconConfig(selectedNotif.title).bg : 'transparent', marginRight: 12 }]}>
                 {selectedNotif && React.createElement(getIconConfig(selectedNotif.title).Icon, { size: 24, color: getIconConfig(selectedNotif.title).color })}
              </View>
              <View style={{ flex: 1 }}>
                 <Text style={styles.modalTitle}>{selectedNotif?.title}</Text>
                 <Text style={styles.modalTime}>{timeAgo(selectedNotif?.createdAt)}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedNotif(null)} style={styles.closeModalBtn}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalMessage}>{selectedNotif?.message}</Text>
            </ScrollView>

            {/* If this notification is linked to a specific report, show a button to go to it! */}
            {selectedNotif?.reportId && (
              <TouchableOpacity 
                style={styles.viewReportBtn}
                onPress={() => {
                  const rId = selectedNotif.reportId;
                  setSelectedNotif(null);
                  router.push(`/report-detail?id=${rId}`);
                }}
              >
                <Text style={styles.viewReportText}>View Related Report</Text>
                <ChevronRight size={18} color="white" />
              </TouchableOpacity>
            )}

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020617' },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  navTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  navTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  badge: { backgroundColor: '#ea580c', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 8 },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  markReadBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyStateTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptyStateSub: { color: '#64748b', fontSize: 14 },
  
  notificationCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 20, marginBottom: 12, borderColor: 'rgba(255,255,255,0.05)', borderWidth: 1 },
  unreadCard: { backgroundColor: 'rgba(234,88,12,0.05)', borderColor: 'rgba(234,88,12,0.2)' },
  unreadDot: { position: 'absolute', top: 12, left: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ea580c', zIndex: 10 },
  iconContainer: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  contentContainer: { flex: 1, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { color: 'white', fontSize: 16, fontWeight: 'bold', flex: 1, paddingRight: 10 },
  timeText: { color: '#64748b', fontSize: 12 },
  messageText: { color: '#cbd5e1', fontSize: 14, lineHeight: 20 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#0f172a', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  modalTime: { color: '#64748b', fontSize: 12, marginTop: 4 },
  closeModalBtn: { padding: 5, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  modalBody: { padding: 20 },
  modalMessage: { color: '#e2e8f0', fontSize: 16, lineHeight: 24 },
  viewReportBtn: { backgroundColor: '#ea580c', margin: 20, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewReportText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});