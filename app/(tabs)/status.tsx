// import { useAuth } from '@clerk/clerk-expo';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { ChevronRight, Clock, MapPin, Search } from 'lucide-react-native';
// import React, { useEffect, useState } from 'react';
// import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// export default function StatusScreen() {
//   const { getToken } = useAuth();
//   const router = useRouter();
//   const { track } = useLocalSearchParams(); // Handles auto-fill from redirect

//   const [searchId, setSearchId] = useState((track as string) || "");
//   const [reports, setReports] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searching, setSearching] = useState(false);
//   const [activeTab, setActiveTab] = useState('ALL');

//   const parseJsonResponse = async (res: Response) => {
//     const text = await res.text();
//     if (!res.ok) {
//       throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
//     }
//     try {
//       return JSON.parse(text);
//     } catch (err) {
//       throw new Error(`Invalid JSON response from ${res.url}: ${text}`);
//     }
//   };

//   const fetchUserReports = async () => {
//     try {
//       const token = await getToken();
//       const res = await fetch(`${API_BASE_URL}/reports/user`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       const data = await parseJsonResponse(res);
//       if (data.success) setReports(data.reports);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { fetchUserReports(); }, []);

//   // const handleSearch = async () => {
//   //   if (!searchId.trim()) return;
//   //   setSearching(true);
//   //   try {
//   //     const token = await getToken();
//   //     const res = await fetch(`${API_BASE_URL}/reports/${searchId.trim()}`, {
//   //       headers: { 'Authorization': `Bearer ${token}` }
//   //     });
//   //     const data = await parseJsonResponse(res);
//   //     if (data.success) {
//   //       router.push(`/report-detail?id=${data.report.reportId}`);
//   //     } else {
//   //       alert("Report not found");
//   //     }
//   //   } finally { setSearching(false); }
//   // };


// const [searchedReport, setSearchedReport] = useState<any>(null); // Add this state

//   const handleSearch = async () => {
//     if (!searchId.trim()) return;
//     setSearching(true);
//     setSearchedReport(null); // Reset previous search
    
//     try {
//       const token = await getToken();
//       // Ensure the ID is trimmed and matches the API expectation
//       const res = await fetch(`${API_BASE_URL}/reports/${searchId.trim()}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
      
//       const data = await parseJsonResponse(res);
      
//       if (data.success && data.report) {
//         setSearchedReport(data.report);
//         // We don't necessarily need to redirect, we can show it right here!
//       } else {
//         alert("Not Found")
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Error");
//     } finally { 
//       setSearching(false); 
//     }
//   };

//   const filteredReports = reports.filter(r => 
//     activeTab === 'ALL' ? true : r.status === activeTab
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView 
//         contentContainerStyle={styles.scroll}
//         refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchUserReports} tintColor="#ea580c" />}
//       >
//         <View style={styles.header}>
//           <Text style={styles.title}>Track Your <Text style={{color: '#ea580c'}}>Impact</Text></Text>
//           <Text style={styles.subtitle}>Monitor the real-time status of your reports.</Text>
//         </View>

//         {/* SEARCH BOX */}
//         <View style={styles.searchContainer}>
//           <Search size={20} color="#64748b" style={styles.searchIcon} />
//           <TextInput 
//             style={styles.searchInput}
//             placeholder="Enter Report ID (e.g. RPT-1234)"
//             placeholderTextColor="#64748b"
//             value={searchId}
//             onChangeText={setSearchId}
//             autoCapitalize="characters"
//           />
//           <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
//             {searching ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.searchBtnText}>Track</Text>}
//           </TouchableOpacity>
//         </View>

//         {/* TABS */}
//         <View style={styles.tabs}>
//           {['ALL', 'PENDING', 'RESOLVED'].map(tab => (
//             <TouchableOpacity 
//               key={tab} 
//               style={[styles.tab, activeTab === tab && styles.activeTab]} 
//               onPress={() => setActiveTab(tab)}
//             >
//               <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* REPORT LIST */}
//         <View style={styles.list}>
//           {filteredReports.map((report) => (
//             <TouchableOpacity 
//               key={report.id} 
//               style={styles.card}
//               onPress={() => router.push(`/report-detail?id=${report.reportId}`)}
//             >
//               <View style={styles.cardContent}>
//                 <View style={styles.cardText}>
//                   <View style={styles.cardHeader}>
//                     <Text style={styles.reportId}>#{report.reportId}</Text>
//                     <View style={[styles.badge, report.status === 'RESOLVED' ? styles.badgeResolved : styles.badgePending]}>
//                       <Text style={[styles.badgeText, report.status === 'RESOLVED' ? {color: '#4ade80'} : {color: '#fbbf24'}]}>
//                         {report.status}
//                       </Text>
//                     </View>
//                   </View>
//                   <Text style={styles.reportTitle} numberOfLines={1}>{report.title}</Text>
//                   <View style={styles.cardFooter}>
//                     <MapPin size={12} color="#64748b" />
//                     <Text style={styles.footerText}>{report.city?.name}</Text>
//                     <Clock size={12} color="#64748b" style={{marginLeft: 10}} />
//                     <Text style={styles.footerText}>Active</Text>
//                   </View>
//                 </View>
//                 <ChevronRight size={20} color="#334155" />
//               </View>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#020617' },
//   scroll: { padding: 20 },
//   header: { marginBottom: 24 },
//   title: { color: 'white', fontSize: 32, fontWeight: 'bold' },
//   subtitle: { color: '#94a3b8', fontSize: 16, marginTop: 4 },
//   searchContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 6, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
//   searchIcon: { marginLeft: 12 },
//   searchInput: { flex: 1, color: 'white', paddingHorizontal: 12, height: 45, fontSize: 16 },
//   searchBtn: { backgroundColor: '#ea580c', paddingHorizontal: 20, height: 40, borderRadius: 12, justifyContent: 'center' },
//   searchBtnText: { color: 'white', fontWeight: 'bold' },
//   tabs: { flexDirection: 'row', gap: 10, marginBottom: 20 },
//   tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
//   activeTab: { backgroundColor: '#ea580c' },
//   tabText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
//   activeTabText: { color: 'white' },
//   list: { gap: 12 },
//   card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
//   cardContent: { flexDirection: 'row', alignItems: 'center' },
//   cardText: { flex: 1 },
//   cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
//   reportId: { color: '#64748b', fontSize: 12, fontWeight: 'bold' },
//   badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
//   badgeResolved: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)' },
//   badgePending: { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' },
//   badgeText: { fontSize: 10, fontWeight: 'bold' },
//   reportTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
//   cardFooter: { flexDirection: 'row', alignItems: 'center' },
//   footerText: { color: '#64748b', fontSize: 12, marginLeft: 4 },
// });


import { useAuth } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, Clock, MapPin, Search } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export default function StatusScreen() {
  const { getToken } = useAuth();
  const router = useRouter();
  const { track } = useLocalSearchParams();

  const [searchId, setSearchId] = useState((track as string) || "");
  const [reports, setReports] = useState<any[]>([]);
  const [searchedReport, setSearchedReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');

  const parseJsonResponse = async (res: Response) => {
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error("Invalid JSON response");
    }
  };

  const fetchUserReports = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/reports/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await parseJsonResponse(res);
      if (data.success) setReports(data.reports);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUserReports(); }, []);

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    setSearching(true);
    setSearchedReport(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/reports/${searchId.trim()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await parseJsonResponse(res);
      if (data.success && data.report) {
        setSearchedReport(data.report);
      } else {
        Alert.alert("Not Found", "No report matches that ID.");
      }
    } catch (err) {
      Alert.alert("Error", "Could not fetch report.");
    } finally { setSearching(false); }
  };

  const filteredReports = reports.filter(r => 
    activeTab === 'ALL' ? true : r.status === activeTab
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchUserReports} tintColor="#ea580c" />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Track Your <Text style={{color: '#ea580c'}}>Impact</Text></Text>
          <Text style={styles.subtitle}>Monitor the real-time status of your reports.</Text>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Enter Report ID (e.g. RPT-1234)"
            placeholderTextColor="#64748b"
            value={searchId}
            onChangeText={setSearchId}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            {searching ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.searchBtnText}>Track</Text>}
          </TouchableOpacity>
        </View>

        {/* --- SEARCH RESULT --- */}
        {searchedReport && (
          <View style={styles.searchResultSection}>
            <View style={styles.searchResultHeader}>
              <Text style={styles.sectionLabel}>Search Result</Text>
              <TouchableOpacity onPress={() => setSearchedReport(null)}>
                <Text style={{color: '#ea580c', fontWeight: 'bold'}}>Clear</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={[styles.card, { borderColor: '#ea580c', borderWidth: 1 }]}
              onPress={() => router.push(`/report-detail?id=${searchedReport.reportId}`)}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardText}>
                  <Text style={styles.reportId}>#{searchedReport.reportId}</Text>
                  <Text style={styles.reportTitle}>{searchedReport.title}</Text>
                  <Text style={{color: '#94a3b8'}} numberOfLines={1}>{searchedReport.description}</Text>
                </View>
                <ChevronRight size={20} color="#ea580c" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.tabs}>
          {['ALL', 'PENDING', 'RESOLVED'].map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.activeTab]} 
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.list}>
          {filteredReports.map((report) => (
            <TouchableOpacity 
              key={report.id} 
              style={styles.card}
              onPress={() => router.push(`/report-detail?id=${report.reportId}`)}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardText}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.reportId}>#{report.reportId}</Text>
                    <View style={[styles.badge, report.status === 'RESOLVED' ? styles.badgeResolved : styles.badgePending]}>
                      <Text style={[styles.badgeText, report.status === 'RESOLVED' ? {color: '#4ade80'} : {color: '#fbbf24'}]}>
                        {report.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.reportTitle} numberOfLines={1}>{report.title}</Text>
                  <View style={styles.cardFooter}>
                    <MapPin size={12} color="#64748b" />
                    <Text style={styles.footerText}>{report.city?.name}</Text>
                    <Clock size={12} color="#64748b" style={{marginLeft: 10}} />
                    <Text style={styles.footerText}>Active</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#334155" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { padding: 20 },
  header: { marginBottom: 24 },
  title: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  subtitle: { color: '#94a3b8', fontSize: 16, marginTop: 4 },
  searchContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 6, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchIcon: { marginLeft: 12 },
  searchInput: { flex: 1, color: 'white', paddingHorizontal: 12, height: 45, fontSize: 16 },
  searchBtn: { backgroundColor: '#ea580c', paddingHorizontal: 20, height: 40, borderRadius: 12, justifyContent: 'center' },
  searchBtnText: { color: 'white', fontWeight: 'bold' },
  searchResultSection: { marginBottom: 24 },
  searchResultHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sectionLabel: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  tabs: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
  activeTab: { backgroundColor: '#ea580c' },
  tabText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  activeTabText: { color: 'white' },
  list: { gap: 12 },
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardText: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  reportId: { color: '#64748b', fontSize: 12, fontWeight: 'bold' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeResolved: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)' },
  badgePending: { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  reportTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center' },
  footerText: { color: '#64748b', fontSize: 12, marginLeft: 4 },
});
