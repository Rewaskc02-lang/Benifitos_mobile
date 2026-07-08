import React, {
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '@/constants/theme';
import { citizenService, GraphNodeData, PredictionData } from '@/lib/api/services/citizenService';
import { useAuthStore } from '@/store/authStore';

interface Props { onBack: () => void; }

export function GraphVisualizer({ onBack }: Props) {
  const { user } = useAuthStore();
  const [graphData, setGraphData] = useState<GraphNodeData | null>(null);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'graph' | 'pathways'>('graph');

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

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [gData, pData] = await Promise.all([
        citizenService.getGraphVisual(user.id),
        citizenService.getPredictiveEligibility(user.id)
      ]);
      setGraphData(gData);
      setPredictions(pData.predictions);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', 'Failed to retrieve graph data layers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchData();
    });
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <ActivityIndicator color={Palette.primary} size="large" />
          <Text style={s.loadingText}>Retrieving Neo4j auraDB active model...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>My Welfare Network</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, viewMode === 'graph' && s.tabActive]}
          onPress={() => setViewMode('graph')}
        >
          <Text style={[s.tabText, viewMode === 'graph' && s.tabTextActive]}>Graph Schema</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, viewMode === 'pathways' && s.tabActive]}
          onPress={() => setViewMode('pathways')}
        >
          <Text style={[s.tabText, viewMode === 'pathways' && s.tabTextActive]}>Predictive Pathways</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scrollBody}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />}
      >
        {viewMode === 'graph' ? (
          <>
            {/* Source Node */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Source Entity Node</Text>
              <Text style={s.relationshipLabel}>ROOT :Citizen</Text>
            </View>

            <View style={[s.card, s.citizenCard]}>
              <View style={s.citizenHeader}>
                <Text style={s.nodeTitle}>{graphData?.citizenName || user?.name}</Text>
                <Text style={s.nodeId}>ID: {graphData?.citizenId || user?.id}</Text>
              </View>
              <View style={s.properties}>
                <Text style={s.propertyText}>• Age: {user?.age ?? 'N/A'}</Text>
                <Text style={s.propertyText}>• Annual Income: ₹{user?.income ?? 'N/A'}</Text>
                <Text style={s.propertyText}>• State: {user?.state || 'N/A'}</Text>
                <Text style={s.propertyText}>• Stage: {user?.lifeStage || 'N/A'}</Text>
              </View>
            </View>

            {/* Relationships Traversal */}
            <Text style={s.sectionTitle}>Active Graph Traversed Edges</Text>

            {/* Family Node */}
            {graphData?.familyName && (
              <View style={s.linkItem}>
                <View style={s.edgeLine}>
                  <Text style={s.edgeLabel}>-[:BELONGS_TO]-&gt;</Text>
                </View>
                <View style={[s.card, s.nodeCard, { borderColor: '#a78bfa' }]}>
                  <Text style={[s.nodeBadge, { backgroundColor: '#7c3aed' }]}>Family Node</Text>
                  <Text style={s.nodeName}>{graphData.familyName}</Text>
                  <Text style={s.nodeMeta}>ID: {graphData.familyId}</Text>
                </View>
              </View>
            )}

            {/* LifeStage Node */}
            {graphData?.stageName && (
              <View style={s.linkItem}>
                <View style={s.edgeLine}>
                  <Text style={s.edgeLabel}>-[:CURRENT_STAGE]-&gt;</Text>
                </View>
                <View style={[s.card, s.nodeCard, { borderColor: '#60a5fa' }]}>
                  <Text style={[s.nodeBadge, { backgroundColor: '#2563eb' }]}>LifeStage Node</Text>
                  <Text style={s.nodeName}>{graphData.stageName}</Text>
                  <Text style={s.nodeMeta}>ID: {graphData.stageId}</Text>
                </View>
              </View>
            )}

            {/* State Node */}
            {graphData?.stateName && (
              <View style={s.linkItem}>
                <View style={s.edgeLine}>
                  <Text style={s.edgeLabel}>-[:RESIDES_IN]-&gt;</Text>
                </View>
                <View style={[s.card, s.nodeCard, { borderColor: '#34d399' }]}>
                  <Text style={[s.nodeBadge, { backgroundColor: '#059669' }]}>State Node</Text>
                  <Text style={s.nodeName}>{graphData.stateName}</Text>
                  <Text style={s.nodeMeta}>ID: {graphData.stateId}</Text>
                </View>
              </View>
            )}

            {/* Connected Documents Nodes */}
            <View style={s.linkItem}>
              <View style={s.edgeLine}>
                <Text style={s.edgeLabel}>-[:HAS_DOCUMENT]-&gt;</Text>
              </View>
              <View style={[s.card, s.nodeCard, { borderColor: '#fb7185' }]}>
                <Text style={[s.nodeBadge, { backgroundColor: '#e11d48' }]}>Documents Layer ({graphData?.documents.length ?? 0})</Text>
                {graphData?.documents && graphData.documents.length > 0 ? (
                  graphData.documents.map((doc, idx) => (
                    <View key={doc.id || idx} style={s.childNodeRow}>
                      <Text style={s.childNodeName}>• {doc.name}</Text>
                      <Text style={[s.statusBadge, doc.verified ? s.badgeSuccess : s.badgeWarning]}>
                        {doc.verified ? 'Verified ✓' : 'Pending ✗'}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={s.nodeMeta}>No verified documents in graph.</Text>
                )}
              </View>
            </View>

            {/* Connected Scheme Nodes */}
            <View style={s.linkItem}>
              <View style={s.edgeLine}>
                <Text style={s.edgeLabel}>-[:BENEFITS]-&gt;</Text>
              </View>
              <View style={[s.card, s.nodeCard, { borderColor: '#fbbf24' }]}>
                <Text style={[s.nodeBadge, { backgroundColor: '#d97706' }]}>Schemes Layer ({graphData?.schemes.length ?? 0})</Text>
                {graphData?.schemes && graphData.schemes.length > 0 ? (
                  graphData.schemes.map((sch, idx) => (
                    <View key={sch.id || idx} style={s.childNodeRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.childNodeName}>• {sch.name}</Text>
                        <Text style={s.nodeMeta}>Benefit: ₹{sch.benefit.toLocaleString()}</Text>
                      </View>
                      <Text style={[s.statusBadge, sch.type === 'BENEFITTING_FROM' ? s.badgeSuccess : s.badgeInfo]}>
                        {sch.type === 'BENEFITTING_FROM' ? 'Enrolled' : 'Eligible'}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={s.nodeMeta}>No connected schemes found.</Text>
                )}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Predictive Eligibility Pathways */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Graph Predictions Engine</Text>
              <Text style={s.relationshipLabel}>TRAVERSAL: Future Paths</Text>
            </View>

            {predictions && predictions.length > 0 ? (
              predictions.map((p, idx) => (
                <View key={idx} style={s.pathwayCard}>
                  <View style={s.pathwayHeader}>
                    <Text style={s.pathwayTitle}>{p.schemeName}</Text>
                    <Text style={s.pathwayBenefit}>+₹{p.benefitAmount.toLocaleString()}</Text>
                  </View>

                  <View style={s.pathwaySteps}>
                    <Text style={s.stepHeader}>Path to Unlock:</Text>
                    
                    {p.missingDocuments.map((doc, dIdx) => (
                      <View key={dIdx} style={s.stepRow}>
                        <Text style={s.stepBullet}>→</Text>
                        <Text style={s.stepText}>Upload & Verify document node: <Text style={{fontWeight: '700'}}>{doc}</Text></Text>
                      </View>
                    ))}

                    {p.requiredLifestage && (
                      <View style={s.stepRow}>
                        <Text style={s.stepBullet}>→</Text>
                        <Text style={s.stepText}>Transition life stage property to: <Text style={{fontWeight: '700'}}>{p.requiredLifestage}</Text></Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={s.centerCard}>
                <Text style={s.emptyText}>No predictive scheme pathways found. Your profile matches all immediate opportunities.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { color: Palette.textSecondary, marginTop: 12, fontSize: 15 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Palette.border,
  },
  backBtn: { width: 40, paddingVertical: 4 },
  backIcon: { color: Palette.textSecondary, fontSize: 22 },
  title: { flex: 1, textAlign: 'center', color: Palette.textPrimary, fontSize: 17, fontWeight: '700' },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Palette.surface,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  tabActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  tabText: { color: Palette.textSecondary, fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: Palette.white },
  scrollBody: { padding: 20, paddingBottom: 60 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', color: Palette.textMuted, letterSpacing: 0.8, marginBottom: 12 },
  relationshipLabel: { fontSize: 12, fontWeight: '600', color: Palette.primary },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    marginBottom: 20,
  },
  citizenCard: {
    borderColor: Palette.primary,
    borderLeftWidth: 5,
  },
  citizenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    paddingBottom: 10,
    marginBottom: 10,
  },
  nodeTitle: { fontSize: 18, fontWeight: '700', color: Palette.textPrimary },
  nodeId: { fontSize: 12, color: Palette.textMuted },
  properties: { gap: 6 },
  propertyText: { fontSize: 14, color: Palette.textSecondary },
  linkItem: {
    marginBottom: 20,
  },
  edgeLine: {
    alignItems: 'center',
    marginVertical: 4,
  },
  edgeLabel: { fontSize: 11, fontWeight: '700', color: Palette.primary, backgroundColor: Palette.background, paddingHorizontal: 10 },
  nodeCard: {
    borderLeftWidth: 4,
  },
  nodeBadge: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '700',
    color: Palette.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  nodeName: { fontSize: 16, fontWeight: '700', color: Palette.textPrimary },
  nodeMeta: { fontSize: 12, color: Palette.textMuted, marginTop: 4 },
  childNodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  childNodeName: { fontSize: 14, color: Palette.textPrimary, fontWeight: '600' },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeSuccess: { backgroundColor: '#d1fae5', color: '#065f46' },
  badgeWarning: { backgroundColor: '#fee2e2', color: '#991b1b' },
  badgeInfo: { backgroundColor: '#e0f2fe', color: '#075985' },
  pathwayCard: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  pathwayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    paddingBottom: 10,
    marginBottom: 12,
  },
  pathwayTitle: { fontSize: 16, fontWeight: '700', color: Palette.textPrimary, flex: 1, marginRight: 12 },
  pathwayBenefit: { fontSize: 16, fontWeight: '700', color: '#059669' },
  pathwaySteps: { gap: 8 },
  stepHeader: { fontSize: 12, fontWeight: '600', color: Palette.textMuted },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 6 },
  stepBullet: { color: Palette.primary, marginRight: 8, fontSize: 14 },
  stepText: { fontSize: 14, color: Palette.textSecondary, flex: 1, lineHeight: 18 },
  centerCard: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: { color: Palette.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 20 },
});
