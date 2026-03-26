import { SignedIn, SignedOut, useAuth, useOAuth, useSignIn, useSignUp, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router'; // <-- IMPORT THE ROUTER
import * as WebBrowser from 'expo-web-browser';
import { Activity, Award, Bell, Calendar, ChevronRight, LogOut, Mail, Phone, ShieldCheck } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter(); // <-- INITIALIZE ROUTER
  
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (Platform.OS === 'android') {
      WebBrowser.warmUpAsync();
      return () => { WebBrowser.coolDownAsync(); };
    }
  }, []);

  // ==========================================
  // AUTHENTICATION LOGIC WITH REDIRECTS
  // ==========================================

  const onPressGoogleSignIn = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/'); // <-- REDIRECT TO HOME
      }
    } catch (err) {
      console.error('OAuth error:', err);
    }
  }, [startOAuthFlow, router]);

  const onSignInPress = async () => {
    if (!isSignInLoaded) return;
    setLoading(true);
    try {
      const completeSignIn = await signIn.create({ identifier: emailAddress, password });
      await setSignInActive({ session: completeSignIn.createdSessionId });
      router.replace('/'); // <-- REDIRECT TO HOME
    } catch (err: any) {
      Alert.alert("Sign In Failed", err.errors[0]?.message || "Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const onSignUpPress = async () => {
    if (!isSignUpLoaded) return;
    setLoading(true);
    try {
      await signUp.create({ firstName, lastName, emailAddress, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert("Sign Up Failed", err.errors[0]?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isSignUpLoaded) return;
    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      if (completeSignUp.status === 'complete') {
        await setSignUpActive({ session: completeSignUp.createdSessionId });
        router.replace('/'); // <-- REDIRECT TO HOME
      } else {
        Alert.alert("Verification Failed", "Please check the code and try again.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.errors[0]?.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  const joinedDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
          
            {/* LOGGED IN VIEW */}
            <SignedIn>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {user?.firstName?.charAt(0) || user?.primaryEmailAddress?.emailAddress.charAt(0) || "U"}
                  </Text>
                </View>
                <Text style={styles.userName}>{user?.fullName || "Citizen"}</Text>
                <View style={styles.badge}>
                  <ShieldCheck size={14} color="#4ade80" style={{marginRight: 4}} />
                  <Text style={styles.badgeText}>Verified Citizen</Text>
                </View>
              </View>

              <View style={styles.statsStrip}>
                <View style={styles.statBox}>
                  <Activity size={24} color="#f97316" style={styles.statIcon} />
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statLabel}>Reports</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Award size={24} color="#eab308" style={styles.statIcon} />
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <ShieldCheck size={24} color="#3b82f6" style={styles.statIcon} />
                  <Text style={styles.statValue}>100%</Text>
                  <Text style={styles.statLabel}>Trust</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Personal Information</Text>
              <View style={styles.listCard}>
                <View style={styles.listRow}>
                  <View style={styles.listIconBox}>
                    <Mail size={18} color="#94a3b8" />
                  </View>
                  <View style={styles.listContent}>
                    <Text style={styles.listLabel}>Email</Text>
                    <Text style={styles.listValue}>{user?.primaryEmailAddress?.emailAddress}</Text>
                  </View>
                </View>
                <View style={styles.listDivider} />
                
                <View style={styles.listRow}>
                  <View style={styles.listIconBox}>
                    <Phone size={18} color="#94a3b8" />
                  </View>
                  <View style={styles.listContent}>
                    <Text style={styles.listLabel}>Phone</Text>
                    <Text style={styles.listValue}>
                      {user?.primaryPhoneNumber?.phoneNumber || "Not provided"}
                    </Text>
                  </View>
                </View>
                <View style={styles.listDivider} />

                <View style={styles.listRow}>
                  <View style={styles.listIconBox}>
                    <Calendar size={18} color="#94a3b8" />
                  </View>
                  <View style={styles.listContent}>
                    <Text style={styles.listLabel}>Member Since</Text>
                    <Text style={styles.listValue}>{joinedDate}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Settings</Text>
              <View style={styles.listCard}>
                <TouchableOpacity style={styles.actionRow}>
                  <View style={[styles.listIconBox, {backgroundColor: 'rgba(249,115,22,0.1)'}]}>
                    <Bell size={18} color="#f97316" />
                  </View>
                  <Text style={styles.actionText}>Notification Preferences</Text>
                  <ChevronRight size={20} color="#475569" />
                </TouchableOpacity>
                <View style={styles.listDivider} />
                
                <TouchableOpacity onPress={() => signOut()} style={styles.actionRow}>
                  <View style={[styles.listIconBox, {backgroundColor: 'rgba(239,68,68,0.1)'}]}>
                    <LogOut size={18} color="#ef4444" />
                  </View>
                  <Text style={[styles.actionText, {color: '#ef4444'}]}>Sign Out</Text>
                  <ChevronRight size={20} color="#475569" />
                </TouchableOpacity>
              </View>
              
              <View style={{height: 40}} />
            </SignedIn>

            {/* LOGGED OUT VIEW (AUTH FORMS) */}
            <SignedOut>
              <View style={styles.authContainer}>
                <View style={styles.iconBox}>
                  <ShieldCheck size={32} color="white" />
                </View>
                <Text style={styles.title}>
                  {pendingVerification ? "Check Email" : (isLoginMode ? "Welcome Back" : "Create Account")}
                </Text>
                <Text style={styles.subtitle}>
                  {pendingVerification 
                    ? "Enter the 6-digit code we sent you." 
                    : "Sign in to report and track civic issues."}
                </Text>

                {pendingVerification ? (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Verification Code</Text>
                    <TextInput 
                      value={code} onChangeText={setCode} placeholder="123456"
                      placeholderTextColor="#475569" keyboardType="number-pad"
                      style={[styles.input, styles.textCenter, styles.textLg]}
                    />
                    <TouchableOpacity onPress={onPressVerify} disabled={loading} style={[styles.primaryBtn, loading && styles.btnDisabled]}>
                      {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryBtnText}>Verify & Login</Text>}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.formGroup}>
                    <TouchableOpacity onPress={onPressGoogleSignIn} style={styles.googleBtn}>
                      <Text style={styles.googleIconText}>
                        <Text style={{color: '#4285F4'}}>G</Text><Text style={{color: '#EA4335'}}>o</Text><Text style={{color: '#FBBC05'}}>o</Text><Text style={{color: '#4285F4'}}>g</Text><Text style={{color: '#34A853'}}>l</Text><Text style={{color: '#EA4335'}}>e</Text>
                      </Text>
                      <Text style={styles.googleBtnText}>Continue with Google</Text>
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>OR EMAIL</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    {!isLoginMode && (
                      <View style={styles.row}>
                        <View style={styles.flex1RightMargin}>
                          <Text style={styles.label}>First Name</Text>
                          <TextInput value={firstName} onChangeText={setFirstName} placeholder="John" placeholderTextColor="#475569" style={styles.input} />
                        </View>
                        <View style={styles.flex1LeftMargin}>
                          <Text style={styles.label}>Last Name</Text>
                          <TextInput value={lastName} onChangeText={setLastName} placeholder="Doe" placeholderTextColor="#475569" style={styles.input} />
                        </View>
                      </View>
                    )}

                    <View style={styles.inputSpacing}>
                      <Text style={styles.label}>Email Address</Text>
                      <TextInput value={emailAddress} onChangeText={setEmailAddress} placeholder="name@example.com" placeholderTextColor="#475569" autoCapitalize="none" keyboardType="email-address" style={styles.input} />
                    </View>

                    <View style={styles.inputSpacing}>
                      <Text style={styles.label}>Password</Text>
                      <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor="#475569" secureTextEntry style={styles.input} />
                    </View>

                    <TouchableOpacity onPress={isLoginMode ? onSignInPress : onSignUpPress} disabled={loading} style={[styles.primaryBtn, loading && styles.btnDisabled, { marginTop: 10 }]}>
                      {loading ? <ActivityIndicator color="white" /> : (
                        <View style={styles.btnContentRow}>
                          <Mail size={20} color="white" style={{ marginRight: 8 }} />
                          <Text style={styles.primaryBtnText}>{isLoginMode ? "Sign In with Email" : "Sign Up with Email"}</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.toggleBtn} onPress={() => { setIsLoginMode(!isLoginMode); setPassword(''); setCode(''); }}>
                      <Text style={styles.toggleText}>
                        {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                        <Text style={styles.toggleTextHighlight}>{isLoginMode ? "Create one" : "Sign in here"}</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </SignedOut>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020617' },
  flex1: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingVertical: 20 },
  container: { width: '90%', maxWidth: 450 },
  profileHeader: { alignItems: 'center', marginTop: 20, marginBottom: 24 },
  avatarContainer: { height: 100, width: 100, backgroundColor: 'rgba(249,115,22,0.1)', borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderColor: 'rgba(249,115,22,0.5)', borderWidth: 2, marginBottom: 16 },
  avatarText: { color: '#f97316', fontSize: 38, fontWeight: 'bold' },
  userName: { color: 'white', fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  badgeText: { color: '#4ade80', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  statsStrip: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, paddingVertical: 20, marginBottom: 32, borderColor: 'rgba(255,255,255,0.05)', borderWidth: 1 },
  statBox: { flex: 1, alignItems: 'center' },
  statIcon: { marginBottom: 8 },
  statValue: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  statLabel: { color: '#64748b', fontSize: 12, fontWeight: '500', textTransform: 'uppercase' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', height: '80%', alignSelf: 'center' },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginLeft: 4 },
  listCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 16, marginBottom: 32, borderColor: 'rgba(255,255,255,0.05)', borderWidth: 1 },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  listIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  listContent: { flex: 1 },
  listLabel: { color: '#64748b', fontSize: 13, marginBottom: 2 },
  listValue: { color: 'white', fontSize: 16, fontWeight: '500' },
  listDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 52 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  actionText: { flex: 1, color: 'white', fontSize: 16, fontWeight: '500' },
  authContainer: { alignItems: 'center', width: '100%', marginTop: 20 },
  iconBox: { height: 64, width: 64, backgroundColor: '#ea580c', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { color: 'white', fontSize: 30, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#94a3b8', textAlign: 'center', marginBottom: 32 },
  formGroup: { width: '100%' },
  label: { color: '#94a3b8', fontSize: 14, fontWeight: '500', marginBottom: 8, marginLeft: 4 },
  input: { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, color: 'white', fontSize: 16 },
  inputSpacing: { marginBottom: 16 },
  textCenter: { textAlign: 'center', letterSpacing: 4 },
  textLg: { fontSize: 24 },
  row: { flexDirection: 'row', marginBottom: 16 },
  flex1RightMargin: { flex: 1, marginRight: 8 },
  flex1LeftMargin: { flex: 1, marginLeft: 8 },
  primaryBtn: { backgroundColor: '#ea580c', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, width: '100%', alignItems: 'center' },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  btnContentRow: { flexDirection: 'row', alignItems: 'center' },
  googleBtn: { backgroundColor: 'white', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  googleIconText: { fontSize: 20, fontWeight: 'bold', marginRight: 12 },
  googleBtnText: { color: '#0f172a', fontWeight: 'bold', fontSize: 18 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: '#64748b', paddingHorizontal: 16, fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  toggleBtn: { marginTop: 24, paddingVertical: 16, alignItems: 'center' },
  toggleText: { color: '#94a3b8' },
  toggleTextHighlight: { color: '#f97316', fontWeight: 'bold', fontSize: 16 }
});