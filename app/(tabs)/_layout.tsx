import { Tabs } from 'expo-router';
import { Activity, LayoutDashboard, ShieldAlert, User } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  // Grabs the exact pixel height of the phone's hardware navigation area
  const insets = useSafeAreaInsets();

  // Smart calculation: Use the phone's hardware inset. If it's 0 (some Androids), force a 15px minimum gap.
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 15 : 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false, 
        tabBarStyle: {
          backgroundColor: '#020617', // slate-950
          borderTopColor: 'rgba(255,255,255,0.1)',
          // Dynamically set height and padding based on the phone's exact screen dimensions
          height: 60 + safeBottom,
          paddingBottom: safeBottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#f97316', // orange-500
        tabBarInactiveTintColor: '#94a3b8', // slate-400
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarIcon: ({ color }) => <ShieldAlert size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="status"
        options={{
          title: 'Status',
          tabBarIcon: ({ color }) => <Activity size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}