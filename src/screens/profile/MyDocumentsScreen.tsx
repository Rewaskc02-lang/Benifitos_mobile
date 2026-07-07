import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Image, RefreshControl, BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { citizenService } from '@/lib/api/services/citizenService';
import { get, post } from '@/lib/api/client';

interface Props { onBack: () => void; }

type ReadinessData = {
  total: number;
  available: string[];
  missing: string[];
};

export function MyDocumentsScreen({ onBack }: Props) {
  const { user } = useAuthStore();
  const [readiness, setReadiness] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanningDoc, setScanningDoc] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  const fetchReadiness = async () => {
    if (!user?.id) return;
    try {
      // Hit /api/readiness/:citizenId
      const data = await get<{ total: number; available: string[]; missing: string[] }>(
        `/api/readiness/${user.id}`
      );
      setReadiness(data);
    } catch (err: any) {
      console.warn('Failed to load document readiness:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReadiness();
  }, [user?.id]);

  useEffect(() => {
    const onBackPress = () => {
      onBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      subscription.remove();
    };
  }, [onBack]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReadiness();
  };

  const handleSimulateOCR = (docName: string) => {
    setScanningDoc(docName);
    setScanProgress(10);

    // Simulate scanning progress ticker
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          completeOCRVerification(docName);
          return 100;
        }
        return prev + 30;
      });
    }, 400);
  };

  const completeOCRVerification = async (docName: string) => {
    if (!user?.id) return;
    try {
      // Trigger profile update mutation verifying domicile on backend database
      await post('/api/profile', {
        citizenId: user.id,
        name: user.name || 'Unknown',
        age: user.age ?? 0,
        income: user.income ?? 0,
        state: user.state || 'Delhi',
        stage: user.stage || 'student',
        verifyDomicile: docName === 'Domicile Certificate',
      });

      Alert.alert(
        'Verification Success 🎉',
        `OCR scan extracted details for "${docName}". Relationship node has been verified inside Neo4j.`
      );
      await fetchReadiness();
    } catch (err: any) {
      Alert.alert('Verification Failed', 'Failed to link document to welfare graph.');
    } finally {
      setScanningDoc(null);
      setScanProgress(0);
    }
  };

  const getPercent = () => {
    if (!readiness || readiness.total === 0) return 0;
    return Math.round((readiness.available.length / readiness.total) * 100);
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>My Documents</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />}
      >
        {loading ? (
          <ActivityIndicator color={Palette.primary} size="large" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Readiness progress card */}
            <View style={s.progressCard}>
              <View style={s.progressTextCol}>
                <Text style={s.progressTitle}>Verification Readiness</Text>
                <Text style={s.progressDesc}>
                  {readiness?.available.length} of {readiness?.total} required documents verified in your profile.
                </Text>
              </View>
              <View style={s.progressCircle}>
                <Text style={s.progressPercent}>{getPercent()}%</Text>
                <Text style={{ fontSize: 9, color: Palette.textMuted, fontWeight: 'bold' }}>READY</Text>
              </View>
            </View>

            {/* OCR scanning panel */}
            {scanningDoc && (
              <View style={s.scanCard}>
                <Text style={s.scanTitle}>🤖 [Demo Mode] OCR SCAN IN PROGRESS...</Text>
                <Text style={s.scanDesc}>Reading verification metadata from Domicile Certificate</Text>
                <View style={s.progressBar}>
                  <View style={[s.progressFill, { width: `${scanProgress}%` }]} />
                </View>
                <Text style={s.scanProgressText}>{scanProgress}% scanned</Text>
              </View>
            )}

            {/* Verified layer */}
            <Text style={s.sectionTitle}>Verified Layer ({readiness?.available.length ?? 0})</Text>
            <View style={s.listCard}>
              {readiness?.available && readiness.available.length > 0 ? (
                readiness.available.map((doc, idx) => (
                  <View
                    key={idx}
                    style={[
                      s.docRow,
                      idx < readiness.available.length - 1 && { borderBottomWidth: 1, borderBottomColor: Palette.border }
                    ]}
                  >
                    <Text style={s.docIcon}>✓</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.docName}>{doc}</Text>
                      <Text style={s.docStatusText}>Status: Link Active & Verified</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={s.emptyRowText}>No verified documents yet.</Text>
              )}
            </View>

            {/* Missing Layer */}
            <Text style={s.sectionTitle}>Pending Uploads ({readiness?.missing.length ?? 0})</Text>
            <View style={s.listCard}>
              {readiness?.missing && readiness.missing.length > 0 ? (
                readiness.missing.map((doc, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => handleSimulateOCR(doc)}
                    disabled={!!scanningDoc}
                    style={[
                      s.docRow,
                      idx < readiness.missing.length - 1 && { borderBottomWidth: 1, borderBottomColor: Palette.border }
                    ]}
                  >
                    <Text style={[s.docIcon, { color: Palette.recordingRed }]}>✗</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.docName}>{doc}</Text>
                      <Text style={[s.docStatusText, { color: '#ef4444' }]}>[Demo Mode] Tap to simulate document upload & AI OCR scan</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={s.emptyRowText}>All required documents are verified! 🎉</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Palette.border,
  },
  backBtn: { width: 40, paddingVertical: 4 },
  backIcon: { color: Palette.textSecondary, fontSize: 22 },
  title: { flex: 1, textAlign: 'center', color: Palette.textPrimary, fontSize: 17, fontWeight: '700' },
  body: { padding: 20, paddingBottom: 60 },
  progressCard: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTextCol: { flex: 1, marginRight: 16 },
  progressTitle: { fontSize: 16, fontWeight: '700', color: Palette.textPrimary, marginBottom: 6 },
  progressDesc: { fontSize: 13, color: Palette.textSecondary, lineHeight: 18 },
  progressCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.border,
  },
  progressPercent: { fontSize: 15, fontWeight: 'bold', color: Palette.textPrimary },
  scanCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  scanTitle: { fontSize: 13, fontWeight: 'bold', color: '#b45309', marginBottom: 4 },
  scanDesc: { fontSize: 12, color: '#78350f', marginBottom: 12 },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Palette.amber,
  },
  scanProgressText: { fontSize: 11, color: '#78350f', textAlign: 'right', fontWeight: '600' },
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: Palette.textMuted, letterSpacing: 0.8, marginBottom: 12 },
  listCard: {
    backgroundColor: Palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  docIcon: { fontSize: 20, fontWeight: 'bold', color: '#22c55e', marginRight: 16 },
  docName: { fontSize: 15, fontWeight: '600', color: Palette.textPrimary, marginBottom: 4 },
  docStatusText: { fontSize: 12, color: Palette.textMuted },
  emptyRowText: { padding: 20, color: Palette.textMuted, fontSize: 13, textAlign: 'center' },
});
