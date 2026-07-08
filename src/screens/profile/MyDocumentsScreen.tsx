import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, BackHandler,
  Modal, Dimensions, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Paths, File, UploadType } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Palette } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useNetworkStore } from '@/store/networkStore';
import { get } from '@/lib/api/client';

interface Props { onBack: () => void; }

type ReadinessData = {
  total: number;
  available: { name: string; verified: boolean }[] | string[];
  missing: { name: string; actionRequired?: string }[] | string[];
};

type OfflineQueueItem = {
  citizenId: string;
  documentName: string;
  localUri: string;
  queuedAt: string;
};

const DOCUMENT_DESCS: Record<string, string> = {
  'Aadhaar Card': 'Primary identification card issued by UIDAI containing biometric verification.',
  'PAN Card': 'Permanent Account Number card for financial and tax verification.',
  'Income Certificate': 'Official state document verifying annual household income levels.',
  'Domicile Certificate': 'Proof of permanent residence within the state.',
  'Disability Certificate': 'Official medical certification for handicap or cognitive disability benefits.',
  'Widow Certificate': 'Verification of widowhood status for targeted social welfare pensions.',
  'Farmer Certificate': 'Proof of agricultural land holdings and agricultural class classification.'
};

const QUEUE_STORAGE_KEY = '@benefitos_offline_uploads_queue';

export function MyDocumentsScreen({ onBack }: Props) {
  const { user, token } = useAuthStore();
  const { isOffline } = useNetworkStore();

  const [readiness, setReadiness] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Real Camera & Image State
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');

  // Modal workflows
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'hub' | 'camera' | 'preview' | null>(null);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  
  // Upload and queue progress
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);

  // 1. Fetch live document readiness state
  const fetchReadiness = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await get<ReadinessData>(`/api/readiness/${user.id}`);
      setReadiness(data);
    } catch (err: any) {
      console.warn('Failed to load document readiness:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // 2. Offline Queue Management
  const loadOfflineQueue = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (cached) {
        const parsed: OfflineQueueItem[] = JSON.parse(cached);
        setOfflineQueue(parsed);
      }
    } catch {
      console.warn('Failed to load offline queue');
    }
  }, []);

  const saveOfflineQueue = useCallback(async (queue: OfflineQueueItem[]) => {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      setOfflineQueue(queue);
    } catch {
      console.warn('Failed to save offline queue');
    }
  }, []);

  // Load offline queue & status on mount
  useEffect(() => {
    Promise.resolve().then(() => {
      fetchReadiness();
      loadOfflineQueue();
    });
  }, [fetchReadiness, loadOfflineQueue]);

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
    loadOfflineQueue();
  };

  // Helper properties to parse available & missing items safely
  const getAvailableList = (): string[] => {
    if (!readiness?.available) return [];
    return readiness.available.map((d: any) => typeof d === 'object' ? d.name : d);
  };

  const getMissingList = (): string[] => {
    if (!readiness?.missing) return [];
    const standardDocs = [
      'Aadhaar Card', 'PAN Card', 'Income Certificate',
      'Domicile Certificate', 'Disability Certificate',
      'Widow Certificate', 'Farmer Certificate'
    ];
    const missingRaw = readiness.missing.map((d: any) => typeof d === 'object' ? d.name : d);
    const verified = getAvailableList();
    const union = Array.from(new Set([...missingRaw, ...standardDocs]));
    return union.filter((d) => !verified.includes(d));
  };

  const getPercent = () => {
    if (!readiness || readiness.total === 0) return 0;
    const available = getAvailableList().length;
    return Math.round((available / readiness.total) * 100);
  };

  // 3. Image Capture & Picker Handling
  const handleLaunchCamera = async () => {
    if (!cameraPermission) {
      const status = await requestCameraPermission();
      if (!status.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to capture documents.');
        return;
      }
    } else if (!cameraPermission.granted) {
      const status = await requestCameraPermission();
      if (!status.granted) {
        Alert.alert('Permission Denied', 'Camera permission has been revoked or denied.');
        return;
      }
    }
    setModalMode('camera');
  };

  const handleCapturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1.0,
        skipProcessing: false
      });
      if (photo?.uri) {
        await processCapturedImage(photo.uri);
      }
    } catch {
      Alert.alert('Camera Error', 'Failed to capture image. Please try again.');
    }
  };

  const handleLaunchGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await processCapturedImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Gallery Error', 'Failed to open device gallery.');
    }
  };

  // Image manipulation: resize & compress to reduce upload payloads
  const processCapturedImage = async (uri: string) => {
    try {
      setLoading(true);
      const manipulated = await manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      // Fetch file sizes
      const file = new File(manipulated.uri);
      if (file.exists) {
        const sizeInMb = file.size / (1024 * 1024);
        setFileSizeStr(`${sizeInMb.toFixed(2)} MB`);
      }

      setCapturedImageUri(manipulated.uri);
      setModalMode('preview');
    } catch {
      Alert.alert('Image Processing Error', 'Could not process captured document.');
    } finally {
      setLoading(false);
    }
  };

  // 4. File Upload & Verification Process
  const handleUploadDocument = async () => {
    if (!user?.id || !selectedDoc || !capturedImageUri) return;

    if (isOffline) {
      // Offline mode: Queue the document locally
      await queueUploadLocally(selectedDoc, capturedImageUri);
      return;
    }

    setIsUploading(true);
    setUploadProgress(10); // initial start indicator

    try {
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5001';
      setUploadProgress(40);

      // Perform a real multipart file upload to the Express backend
      const file = new File(capturedImageUri);
      const response = await file.upload(
        `${apiBaseUrl}/api/documents/verify`,
        {
          fieldName: 'file',
          uploadType: UploadType.MULTIPART,
          headers: {
            Authorization: `Bearer ${token}`
          },
          parameters: {
            citizenId: user.id,
            documentName: selectedDoc
          }
        }
      );

      setUploadProgress(90);

      if (response.status === 200) {
        setUploadProgress(100);
        Alert.alert(
          'Verification Success 🎉',
          `"${selectedDoc}" has been uploaded. AI Engine has updated eligibility, welfare scores, and roadmap charts.`
        );
        // Clear local image path
        setCapturedImageUri(null);
        setModalMode(null);
        setSelectedDoc(null);
        await fetchReadiness();
      } else {
        throw new Error(`Upload API returned status ${response.status}`);
      }
    } catch {
      Alert.alert(
        'Upload Failed',
        'Unable to complete verification upload. Would you like to queue it locally to sync later?',
        [
          { text: 'Queue Locally', onPress: () => queueUploadLocally(selectedDoc, capturedImageUri) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const queueUploadLocally = async (docName: string, uri: string) => {
    if (!user?.id) return;
    try {
      // Move image to permanent app documents folder to prevent cache wipes
      const filename = `${docName.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
      const destinationFile = new File(Paths.document, filename);
      const sourceFile = new File(uri);
      await sourceFile.copy(destinationFile);
      const destinationUri = destinationFile.uri;

      const newItem: OfflineQueueItem = {
        citizenId: user.id,
        documentName: docName,
        localUri: destinationUri,
        queuedAt: new Date().toISOString()
      };

      const updated = [...offlineQueue, newItem];
      await saveOfflineQueue(updated);

      Alert.alert(
        'Queued Offline 📁',
        `Internet connectivity is offline. "${docName}" has been safely saved locally and will auto-sync when online.`
      );

      setCapturedImageUri(null);
      setModalMode(null);
      setSelectedDoc(null);
    } catch {
      Alert.alert('Queue Error', 'Failed to save document locally for offline syncing.');
    }
  };

  // Re-verify and drain offline queue when connectivity returns
  const handleSyncQueue = async () => {
    if (offlineQueue.length === 0) return;
    if (isOffline) {
      Alert.alert('Offline Mode Active', 'Cannot sync uploads while internet is offline.');
      return;
    }

    setRefreshing(true);
    let successCount = 0;
    const remaining: OfflineQueueItem[] = [];

    const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5001';

    for (const item of offlineQueue) {
      try {
        const file = new File(item.localUri);
        const response = await file.upload(
          `${apiBaseUrl}/api/documents/verify`,
          {
            fieldName: 'file',
            uploadType: UploadType.MULTIPART,
            headers: {
              Authorization: `Bearer ${token}`
            },
            parameters: {
              citizenId: item.citizenId,
              documentName: item.documentName
            }
          }
        );

        if (response.status === 200) {
          successCount++;
          // Clean up local saved file
          file.delete();
        } else {
          remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }

    await saveOfflineQueue(remaining);
    setRefreshing(false);

    if (successCount > 0) {
      Alert.alert('Sync Complete 🎉', `Successfully uploaded ${successCount} queued documents.`);
      await fetchReadiness();
    } else {
      Alert.alert('Sync Failed', 'Could not sync any queued files. Please check server status.');
    }
  };

  const handleClearQueueItem = async (index: number) => {
    const item = offlineQueue[index];
    try {
      const file = new File(item.localUri);
      if (file.exists) {
        file.delete();
      }
      const updated = offlineQueue.filter((_, idx) => idx !== index);
      await saveOfflineQueue(updated);
    } catch {
      console.warn('Failed to clear queue file');
    }
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
        {/* Connection & Offline Queue Sync Panel */}
        {offlineQueue.length > 0 && (
          <View style={s.queuePanel}>
            <View style={{ flex: 1 }}>
              <Text style={s.queueTitle}>Offline Upload Queue ({offlineQueue.length})</Text>
              <Text style={s.queueDesc}>
                {isOffline ? 'Waiting for internet connection...' : 'Ready to upload local saved images.'}
              </Text>
            </View>
            {!isOffline && (
              <TouchableOpacity onPress={handleSyncQueue} style={s.syncBtn} activeOpacity={0.8}>
                <Text style={s.syncBtnText}>Sync Now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={Palette.primary} size="large" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Readiness progress card */}
            <View style={s.progressCard}>
              <View style={s.progressTextCol}>
                <Text style={s.progressTitle}>Verification Readiness</Text>
                <Text style={s.progressDesc}>
                  {getAvailableList().length} of {readiness?.total} required documents verified in your profile.
                </Text>
              </View>
              <View style={s.progressCircle}>
                <Text style={s.progressPercent}>{getPercent()}%</Text>
                <Text style={{ fontSize: 9, color: Palette.textMuted, fontWeight: 'bold' }}>READY</Text>
              </View>
            </View>

            {/* Verified layer */}
            <Text style={s.sectionTitle}>Verified Layer ({getAvailableList().length})</Text>
            <View style={s.listCard}>
              {getAvailableList().length > 0 ? (
                getAvailableList().map((doc, idx) => (
                  <View
                    key={idx}
                    style={[
                      s.docRow,
                      idx < getAvailableList().length - 1 && { borderBottomWidth: 1, borderBottomColor: Palette.border }
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
            <Text style={s.sectionTitle}>Pending Uploads ({getMissingList().length})</Text>
            <View style={s.listCard}>
              {getMissingList().length > 0 ? (
                getMissingList().map((doc, idx) => {
                  const isQueued = offlineQueue.some(q => q.documentName === doc);
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (isQueued) {
                          const itemIndex = offlineQueue.findIndex(q => q.documentName === doc);
                          Alert.alert(
                            'Document Queued',
                            `"${doc}" is already queued locally for sync when network reconnects.`,
                            [
                              { text: 'Remove from Queue', style: 'destructive', onPress: () => handleClearQueueItem(itemIndex) },
                              { text: 'OK' }
                            ]
                          );
                        } else {
                          setSelectedDoc(doc);
                          setModalMode('hub');
                        }
                      }}
                      style={[
                        s.docRow,
                        idx < getMissingList().length - 1 && { borderBottomWidth: 1, borderBottomColor: Palette.border }
                      ]}
                    >
                      <Text style={[s.docIcon, { color: isQueued ? '#3b82f6' : '#f59e0b' }]}>
                        {isQueued ? '⏳' : '✗'}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.docName}>{doc}</Text>
                        <Text style={[s.docStatusText, { color: isQueued ? '#3b82f6' : '#f59e0b' }]}>
                          {isQueued ? 'Upload Pending in Offline Queue' : 'Missing. Tap to start secure verification.'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={s.emptyRowText}>All required documents are verified! 🎉</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Document Upload Workflow Modal */}
      {selectedDoc && (
        <Modal
          visible={modalMode !== null}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            if (!isUploading) {
              setModalMode(null);
              setSelectedDoc(null);
            }
          }}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              {/* HUB MODE */}
              {modalMode === 'hub' && (
                <View style={{ padding: 20 }}>
                  <Text style={s.modalTitle}>Verify {selectedDoc}</Text>
                  <Text style={s.modalDesc}>
                    {DOCUMENT_DESCS[selectedDoc] || 'Upload official document verification layer to link this node in your welfare path.'}
                  </Text>

                  <View style={{ gap: 12, marginTop: 24 }}>
                    <TouchableOpacity
                      onPress={handleLaunchCamera}
                      style={s.uploadOptionBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 24 }}>📸</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.optionTitle}>Use Device Camera</Text>
                        <Text style={s.optionDesc}>Capture document scan via real device camera preview</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleLaunchGallery}
                      style={s.uploadOptionBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 24 }}>📁</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.optionTitle}>Choose from Gallery</Text>
                        <Text style={s.optionDesc}>Select image document from local photo folders</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => { setModalMode(null); setSelectedDoc(null); }}
                    style={[s.modalCancelBtn, { marginTop: 20 }]}
                  >
                    <Text style={s.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* CAMERA VIEWPORT MODE */}
              {modalMode === 'camera' && (
                <View style={{ height: Dimensions.get('window').height * 0.8, backgroundColor: '#000', borderRadius: 24, overflow: 'hidden' }}>
                  {/* Real CameraView from expo-camera */}
                  <CameraView
                    style={{ flex: 1 }}
                    ref={cameraRef}
                    flash={flashMode}
                  >
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
                      {/* Viewfinder Overlay Guide */}
                      <View style={s.viewfinder}>
                        <View style={[s.viewfinderCorner, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 }]} />
                        <View style={[s.viewfinderCorner, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 }]} />
                        <View style={[s.viewfinderCorner, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
                        <View style={[s.viewfinderCorner, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }]} />
                        <Text style={s.viewfinderText}>ALIGN {selectedDoc.toUpperCase()} HERE</Text>
                      </View>
                    </View>

                    {/* Camera Controls Overlay */}
                    <View style={s.cameraControls}>
                      <TouchableOpacity
                        onPress={() => setFlashMode(prev => prev === 'off' ? 'on' : 'off')}
                        style={s.cameraSubBtn}
                      >
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                          {flashMode === 'on' ? '⚡️ Flash On' : '⚡️ Flash Off'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleCapturePhoto}
                        style={s.shutterBtn}
                        activeOpacity={0.8}
                      >
                        <View style={s.shutterInner} />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => setModalMode('hub')} style={s.cameraSubBtn}>
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </CameraView>
                </View>
              )}

              {/* PREVIEW & VERIFY IMAGE MODE */}
              {modalMode === 'preview' && capturedImageUri && (
                <View style={{ padding: 20 }}>
                  <Text style={s.modalTitle}>Scan Preview</Text>
                  <Text style={s.modalDesc}>Verify clarity of the scan before uploading to the AI OCR core.</Text>

                  {/* Captured Photo Frame */}
                  <View style={s.previewFrameContainer}>
                    <Image source={{ uri: capturedImageUri }} style={s.previewImage} resizeMode="contain" />
                    <View style={s.sizeBadge}>
                      <Text style={s.sizeBadgeText}>Size: {fileSizeStr}</Text>
                    </View>
                  </View>

                  {/* Uploading progress bar */}
                  {isUploading && (
                    <View style={{ width: '100%', marginBottom: 20 }}>
                      <View style={s.progressWrapper}>
                        <View style={[s.progressWrapperFill, { width: `${uploadProgress}%` }]} />
                      </View>
                      <Text style={s.progressLabel}>{isOffline ? 'Syncing to Local Queue...' : 'Uploading & Traversing...'}</Text>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setCapturedImageUri(null);
                        setModalMode(isOffline ? 'hub' : 'camera');
                      }}
                      disabled={isUploading}
                      style={[s.modalCancelBtn, { flex: 1 }]}
                    >
                      <Text style={s.cancelText}>Retake</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleUploadDocument}
                      disabled={isUploading}
                      style={[s.uploadActionBtnSubmit, { flex: 1.5, opacity: isUploading ? 0.6 : 1 }]}
                    >
                      {isUploading ? (
                        <ActivityIndicator color={Palette.white} size="small" />
                      ) : (
                        <Text style={s.uploadSubmitText}>
                          {isOffline ? 'Save Offline' : 'Verify & Upload'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
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
  
  // Queue panel styles
  queuePanel: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12
  },
  queueTitle: { fontSize: 14, fontWeight: '700', color: '#1e40af', marginBottom: 2 },
  queueDesc: { fontSize: 12, color: '#3b82f6' },
  syncBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  syncBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Palette.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Palette.textPrimary, marginBottom: 8 },
  modalDesc: { fontSize: 14, color: Palette.textSecondary, lineHeight: 20 },
  uploadOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    gap: 16,
  },
  optionTitle: { fontSize: 15, fontWeight: '700', color: Palette.textPrimary, marginBottom: 4 },
  optionDesc: { fontSize: 12, color: Palette.textMuted },
  modalCancelBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    backgroundColor: Palette.surface,
    justifyContent: 'center'
  },
  cancelText: { color: Palette.textSecondary, fontWeight: '700', fontSize: 14 },
  
  uploadActionBtnSubmit: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadSubmitText: { color: Palette.white, fontWeight: '700', fontSize: 14 },

  // Camera guides
  viewfinder: {
    width: Dimensions.get('window').width * 0.85,
    height: Dimensions.get('window').width * 0.55,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#fff',
  },
  viewfinderText: { color: '#fff', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, opacity: 0.85 },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  cameraSubBtn: { width: 80, alignItems: 'center' },
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2.5,
    borderColor: '#000',
    backgroundColor: '#fff',
  },

  // Preview styling
  previewFrameContainer: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: '#000',
    overflow: 'hidden',
    marginVertical: 20,
    justifyContent: 'center'
  },
  previewImage: {
    width: '100%',
    height: '100%'
  },
  sizeBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3
  },
  sizeBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  // Progress Bar
  progressWrapper: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.border,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressWrapperFill: {
    height: '100%',
    backgroundColor: Palette.primary,
  },
  progressLabel: { fontSize: 11, color: Palette.textSecondary, fontWeight: 'bold', textAlign: 'right' }
});
