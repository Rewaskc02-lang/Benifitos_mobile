import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';
import { usePalette } from '@/store/themeStore';

const STORAGE_KEY = '@benefitos_docvault_v1';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DocStatus = 'valid' | 'expiring' | 'expired' | 'missing';

export type VaultDocument = {
  id: string;
  name: string;
  category: string;
  uploadedAt: string | null;
  expiresAt: string | null;
  status: DocStatus;
  notes: string;
};

// ---------------------------------------------------------------------------
// Default doc templates
// ---------------------------------------------------------------------------

const DEFAULT_DOCS: VaultDocument[] = [
  { id: 'd1', name: 'Aadhaar Card', category: 'Identity', uploadedAt: null, expiresAt: null, status: 'missing', notes: '' },
  { id: 'd2', name: 'PAN Card', category: 'Identity', uploadedAt: null, expiresAt: null, status: 'missing', notes: '' },
  { id: 'd3', name: 'Income Certificate', category: 'Income', uploadedAt: null, expiresAt: null, status: 'missing', notes: '' },
  { id: 'd4', name: 'Caste Certificate', category: 'Identity', uploadedAt: null, expiresAt: null, status: 'missing', notes: '' },
  { id: 'd5', name: 'Domicile Certificate', category: 'Residence', uploadedAt: null, expiresAt: null, status: 'missing', notes: '' },
  { id: 'd6', name: 'Class 10 Marksheet', category: 'Education', uploadedAt: null, expiresAt: null, status: 'missing', notes: '' },
  { id: 'd7', name: 'Class 12 Marksheet', category: 'Education', uploadedAt: null, expiresAt: null, status: 'missing', notes: '' },
  { id: 'd8', name: 'Bank Passbook', category: 'Financial', uploadedAt: null, expiresAt: null, status: 'missing', notes: '' },
  { id: 'd9', name: 'Ration Card', category: 'Household', uploadedAt: null, expiresAt: null, status: 'missing', notes: '' },
  { id: 'd10', name: 'Voter ID Card', category: 'Identity', uploadedAt: null, expiresAt: null, status: 'missing', notes: '' },
  { id: 'd11', name: 'Land Records / Patta', category: 'Property', uploadedAt: null, expiresAt: null, status: 'missing', notes: '' },
  { id: 'd12', name: 'Disability Certificate', category: 'Health', uploadedAt: null, expiresAt: null, status: 'missing', notes: '' },
];

const DOC_CATEGORIES = ['All', 'Identity', 'Income', 'Education', 'Financial', 'Household', 'Residence', 'Property', 'Health'];

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function computeStatus(doc: VaultDocument): DocStatus {
  if (!doc.uploadedAt) return 'missing';
  if (!doc.expiresAt) return 'valid';
  const daysLeft = Math.floor(
    (new Date(doc.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 30) return 'expiring';
  return 'valid';
}

function statusConfig(status: DocStatus, P: ReturnType<typeof usePalette>) {
  switch (status) {
    case 'valid': return { label: 'Uploaded', color: P.success, bg: P.successA15, border: P.successA30 };
    case 'expiring': return { label: 'Expiring Soon', color: P.warning, bg: P.warningA20, border: P.warningA20 };
    case 'expired': return { label: 'Expired', color: P.error, bg: P.errorA15, border: P.errorA30 };
    case 'missing': return { label: 'Not Uploaded', color: P.textMuted, bg: P.surfaceAlt, border: P.border };
  }
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FileIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6C5.46 2 4.94 2.21 4.59 2.59C4.21 2.94 4 3.46 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function PlusIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function AlertIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10.29 3.86L1.82 18C1.64 18.3 1.55 18.65 1.55 19C1.55 19.35 1.64 19.7 1.82 20C2 20.3 2.27 20.55 2.59 20.73C2.91 20.91 3.28 21 3.65 21H20.35C20.72 21 21.09 20.91 21.41 20.73C21.73 20.55 22 20.3 22.18 20C22.36 19.7 22.45 19.35 22.45 19C22.45 18.65 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.26 3.31 12.94 3.13C12.62 2.95 12.25 2.86 11.88 2.86C11.51 2.86 11.14 2.95 10.82 3.13C10.5 3.31 10.23 3.56 10.06 3.86H10.29Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function CheckCircleIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path d="M9 12L11 14L15 10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Upload modal
// ---------------------------------------------------------------------------

function UploadModal({
  doc,
  visible,
  onClose,
  onSave,
}: {
  doc: VaultDocument | null;
  visible: boolean;
  onClose: () => void;
  onSave: (updated: VaultDocument) => void;
}) {
  const P = usePalette();
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (doc) {
      setExpiresAt(doc.expiresAt ?? '');
      setNotes(doc.notes ?? '');
    }
  }, [doc]);

  const handleSave = () => {
    if (!doc) return;
    const cleanExpiry = expiresAt.trim() || null;
    const updated: VaultDocument = {
      ...doc,
      uploadedAt: doc.uploadedAt ?? new Date().toISOString().split('T')[0],
      expiresAt: cleanExpiry,
      notes: notes.trim(),
      status: computeStatus({ ...doc, uploadedAt: 'set', expiresAt: cleanExpiry }),
    };
    onSave(updated);
  };

  const handleRemove = () => {
    if (!doc) return;
    Alert.alert(
      'Remove Document',
      `Remove "${doc.name}" from your vault?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const cleared: VaultDocument = { ...doc, uploadedAt: null, expiresAt: null, notes: '', status: 'missing' };
            onSave(cleared);
          },
        },
      ]
    );
  };

  if (!doc) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[mStyles.container, { backgroundColor: P.background }]} edges={['top']}>
        <View style={[mStyles.header, { borderBottomColor: P.border }]}>
          <TouchableOpacity onPress={onClose} style={mStyles.closeBtn} activeOpacity={0.7}>
            <CloseIcon color={P.textSecondary} />
          </TouchableOpacity>
          <Text style={[mStyles.title, { color: P.textPrimary }]}>{doc.name}</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={{ padding: 24 }}>
          <View style={[mStyles.categoryRow, { backgroundColor: P.primaryA10, borderColor: P.primaryA30 }]}>
            <FileIcon color={P.primary} size={16} />
            <Text style={[mStyles.categoryText, { color: P.primary }]}>{doc.category}</Text>
          </View>

          <Text style={[mStyles.label, { color: P.textMuted }]}>Upload Date</Text>
          <View style={[mStyles.readonlyRow, { backgroundColor: P.surface, borderColor: P.border }]}>
            <Text style={[mStyles.readonlyText, { color: doc.uploadedAt ? P.success : P.textMuted }]}>
              {doc.uploadedAt ? `Uploaded on ${doc.uploadedAt}` : 'Mark as uploaded'}
            </Text>
          </View>

          <Text style={[mStyles.label, { color: P.textMuted }]}>
            Expiry Date <Text style={{ fontWeight: '400' }}>(optional, YYYY-MM-DD)</Text>
          </Text>
          <TextInput
            style={[mStyles.input, { backgroundColor: P.surface, borderColor: P.border, color: P.textPrimary }]}
            value={expiresAt}
            onChangeText={setExpiresAt}
            placeholder="e.g. 2026-03-31"
            placeholderTextColor={P.textMuted}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={[mStyles.label, { color: P.textMuted }]}>Notes</Text>
          <TextInput
            style={[mStyles.input, mStyles.notesInput, { backgroundColor: P.surface, borderColor: P.border, color: P.textPrimary }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Reference number, issuing authority..."
            placeholderTextColor={P.textMuted}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[mStyles.saveBtn, { backgroundColor: P.primary }]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <CheckCircleIcon color={P.white} />
            <Text style={[mStyles.saveBtnText, { color: P.white }]}>
              {doc.uploadedAt ? 'Update Document' : 'Mark as Uploaded'}
            </Text>
          </TouchableOpacity>

          {doc.uploadedAt && (
            <TouchableOpacity
              style={[mStyles.removeBtn, { borderColor: P.errorA30 }]}
              onPress={handleRemove}
              activeOpacity={0.8}
            >
              <Text style={[mStyles.removeBtnText, { color: P.error }]}>Remove from Vault</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, marginBottom: 24,
  },
  categoryText: { fontSize: 12, fontWeight: '700' },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  readonlyRow: {
    borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 20,
  },
  readonlyText: { fontSize: 14 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginBottom: 20 },
  notesInput: { height: 80, textAlignVertical: 'top' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 12, paddingVertical: 15, marginBottom: 12,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700' },
  removeBtn: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, borderWidth: 1, paddingVertical: 13,
  },
  removeBtnText: { fontSize: 14, fontWeight: '600' },
});

// ---------------------------------------------------------------------------
// DocumentVault
// ---------------------------------------------------------------------------

interface Props { onBack: () => void; }

export function DocumentVault({ onBack }: Props) {
  const P = usePalette();
  const [docs, setDocs] = useState<VaultDocument[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedDoc, setSelectedDoc] = useState<VaultDocument | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setDocs(JSON.parse(val));
      else setDocs(DEFAULT_DOCS);
    });
  }, []);

  const persist = useCallback((updated: VaultDocument[]) => {
    setDocs(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const handleSave = useCallback(
    (updated: VaultDocument) => {
      persist(docs.map((d) => (d.id === updated.id ? updated : d)));
      setShowModal(false);
    },
    [docs, persist]
  );

  const filtered = useMemo(
    () =>
      activeCategory === 'All' ? docs : docs.filter((d) => d.category === activeCategory),
    [docs, activeCategory]
  );

  const uploadedCount = useMemo(() => docs.filter((d) => d.status !== 'missing').length, [docs]);
  const alertCount = useMemo(() => docs.filter((d) => d.status === 'expired' || d.status === 'expiring').length, [docs]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: P.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: P.primary }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <BackIcon color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Document Vault</Text>
          <Text style={styles.headerSub}>
            {uploadedCount}/{docs.length} documents uploaded
          </Text>
        </View>
      </View>

      {/* Stats bar */}
      <View style={[styles.statsBar, { backgroundColor: P.surface, borderBottomColor: P.border }]}>
        {[
          { label: 'Uploaded', value: uploadedCount, color: P.success },
          { label: 'Missing', value: docs.filter((d) => d.status === 'missing').length, color: P.textMuted },
          { label: 'Alerts', value: alertCount, color: alertCount > 0 ? P.error : P.textMuted },
        ].map((stat) => (
          <View key={stat.label} style={styles.statItem}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: P.textMuted }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Alert banner */}
      {alertCount > 0 && (
        <View style={[styles.alertBanner, { backgroundColor: P.errorA15, borderColor: P.errorA30 }]}>
          <AlertIcon color={P.error} />
          <Text style={[styles.alertText, { color: P.error }]}>
            {alertCount} document{alertCount > 1 ? 's' : ''} require attention
          </Text>
        </View>
      )}

      {/* Category filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={DOC_CATEGORIES}
        keyExtractor={(item) => item}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        style={{ flexGrow: 0 }}
        renderItem={({ item }) => {
          const active = activeCategory === item;
          return (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                active
                  ? { backgroundColor: P.primary, borderColor: P.primary }
                  : { backgroundColor: P.surface, borderColor: P.border },
              ]}
              onPress={() => setActiveCategory(item)}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryChipText, { color: active ? P.white : P.textSecondary }]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Doc list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const sConf = statusConfig(item.status, P);
          return (
            <TouchableOpacity
              style={[styles.docRow, { backgroundColor: P.surface, borderColor: P.border }]}
              onPress={() => { setSelectedDoc(item); setShowModal(true); }}
              activeOpacity={0.8}
              accessibilityLabel={`${item.name}, status: ${sConf.label}`}
              accessibilityRole="button"
            >
              <View style={[styles.fileIconWrap, { backgroundColor: sConf.bg, borderColor: sConf.border }]}>
                <FileIcon color={sConf.color} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.docName, { color: P.textPrimary }]}>{item.name}</Text>
                {item.notes ? (
                  <Text style={[styles.docNotes, { color: P.textMuted }]} numberOfLines={1}>{item.notes}</Text>
                ) : (
                  <Text style={[styles.docNotes, { color: P.textMuted }]}>{item.category}</Text>
                )}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: sConf.bg, borderColor: sConf.border }]}>
                <Text style={[styles.statusBadgeText, { color: sConf.color }]}>{sConf.label}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <UploadModal
        doc={selectedDoc}
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20, gap: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  statsBar: {
    flexDirection: 'row', borderBottomWidth: 1,
    paddingVertical: 14, paddingHorizontal: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 12, borderRadius: 12, borderWidth: 1, padding: 12,
  },
  alertText: { fontSize: 13, fontWeight: '600' },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  categoryChipText: { fontSize: 13, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  docRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 12,
  },
  fileIconWrap: {
    width: 42, height: 42, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  docName: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  docNotes: { fontSize: 12 },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, flexShrink: 0,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
});
