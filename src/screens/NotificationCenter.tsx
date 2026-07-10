import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';
import { usePalette } from '@/store/themeStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationCategory =
  | 'scheme'
  | 'document'
  | 'application'
  | 'eligibility'
  | 'announcement';

export type AppNotification = {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: Date;
  isRead: boolean;
  actionLabel?: string;
};

const STORAGE_KEY = '@benefitos_notifications_v2';

// ---------------------------------------------------------------------------
// Seed notifications (realistic government-grade content)
// ---------------------------------------------------------------------------

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    category: 'scheme',
    title: 'New Scheme Matched: PM Vishwakarma',
    body: 'A new scheme for artisans and craftsmen has been launched. Based on your profile, you may be eligible for Rs. 3 Lakh in support.',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    isRead: false,
  },
  {
    id: 'n2',
    category: 'eligibility',
    title: 'Welfare Score Updated',
    body: 'Your welfare score has improved from 48% to 61%. You now qualify for 3 additional schemes.',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    isRead: false,
  },
  {
    id: 'n3',
    category: 'document',
    title: 'Income Certificate Expiry Alert',
    body: 'Your Income Certificate is required for NSP scholarship renewal. Please upload an updated copy before the academic year ends.',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    isRead: false,
    actionLabel: 'Upload Document',
  },
  {
    id: 'n4',
    category: 'application',
    title: 'NSP Scholarship Deadline Approaching',
    body: 'The National Scholarship Portal closes on October 31. Complete your application in time to avoid missing the annual cycle.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    isRead: true,
    actionLabel: 'Apply Now',
  },
  {
    id: 'n5',
    category: 'scheme',
    title: 'PM-KISAN 16th Instalment Released',
    body: 'The 16th instalment of Rs. 2,000 under PM-KISAN has been transferred to 10 crore farmers. Check your linked bank account.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isRead: true,
  },
  {
    id: 'n6',
    category: 'announcement',
    title: 'Government Announcement: EWS Quota Expansion',
    body: 'The Ministry of Education has expanded the EWS scholarship quota. Eligible students with family income below Rs. 8 LPA may now apply.',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    isRead: true,
  },
  {
    id: 'n7',
    category: 'document',
    title: 'Aadhaar Linking Reminder',
    body: 'Ensure your Aadhaar is linked to your bank account to receive PM-KISAN and Ayushman Bharat benefits via Direct Benefit Transfer (DBT).',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    isRead: true,
  },
];

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 60) return `${m < 1 ? 1 : m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------

type CategoryConfig = {
  label: string;
  iconColor: (P: ReturnType<typeof usePalette>) => string;
  bg: (P: ReturnType<typeof usePalette>) => string;
  border: (P: ReturnType<typeof usePalette>) => string;
};

const CATEGORY_CONFIG: Record<NotificationCategory, CategoryConfig> = {
  scheme: {
    label: 'Scheme',
    iconColor: (P) => P.primary,
    bg: (P) => P.primaryA10,
    border: (P) => P.primaryA30,
  },
  eligibility: {
    label: 'Eligibility',
    iconColor: (P) => P.success,
    bg: (P) => P.successA15,
    border: (P) => P.successA30,
  },
  document: {
    label: 'Document',
    iconColor: (P) => P.accent,
    bg: (P) => P.accentA15,
    border: (P) => P.accentA40,
  },
  application: {
    label: 'Application',
    iconColor: (P) => P.warning,
    bg: (P) => P.warningA20,
    border: (P) => P.warningA20,
  },
  announcement: {
    label: 'Announcement',
    iconColor: (P) => P.textMuted,
    bg: (P) => P.surfaceAlt,
    border: (P) => P.border,
  },
};

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CategoryIcon({ category, color, size = 16 }: { category: NotificationCategory; color: string; size?: number }) {
  switch (category) {
    case 'scheme':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.8} />
          <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.8} />
          <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.8} />
          <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.8} />
        </Svg>
      );
    case 'eligibility':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
          <Path d="M9 12L11 14L15 10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'document':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M14 2H6C5.46 2 4.94 2.21 4.59 2.59C4.21 2.94 4 3.46 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'application':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={1.8} />
          <Path d="M16 2V6M8 2V6M3 10H21" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M8 14H16M8 17H12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'announcement':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M22 3L3 10L10 13L13 20L22 3Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
  }
}

function CheckIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17L4 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TrashIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6H21M8 6V4H16V6M19 6L18 20C18 21.1 17.1 22 16 22H8C6.9 22 6 21.1 6 20L5 6H19Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Notification row with swipe-to-dismiss animation
// ---------------------------------------------------------------------------

function NotificationRow({
  item,
  onMarkRead,
  onDismiss,
}: {
  item: AppNotification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const P = usePalette();
  const cfg = CATEGORY_CONFIG[item.category];
  const slideX = useRef(new Animated.Value(0)).current;

  const handleSwipeDismiss = () => {
    Animated.timing(slideX, { toValue: -400, duration: 260, useNativeDriver: true }).start(() =>
      onDismiss(item.id)
    );
  };

  return (
    <Animated.View style={{ transform: [{ translateX: slideX }] }}>
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => !item.isRead && onMarkRead(item.id)}
        style={[
          styles.notifRow,
          {
            backgroundColor: P.surface,
            borderColor: item.isRead ? P.border : cfg.border(P),
            borderLeftWidth: item.isRead ? 1 : 3,
            borderLeftColor: item.isRead ? P.border : cfg.iconColor(P),
          },
        ]}
        accessibilityLabel={`${item.title}. ${item.body}`}
        accessibilityRole="button"
      >
        {/* Unread dot */}
        {!item.isRead && (
          <View style={[styles.unreadDot, { backgroundColor: cfg.iconColor(P) }]} />
        )}

        {/* Icon */}
        <View
          style={[
            styles.categoryIconWrap,
            { backgroundColor: cfg.bg(P), borderColor: cfg.border(P) },
          ]}
        >
          <CategoryIcon category={item.category} color={cfg.iconColor(P)} />
        </View>

        {/* Content */}
        <View style={styles.notifContent}>
          <View style={styles.notifTopRow}>
            <Text
              style={[
                styles.notifTitle,
                { color: item.isRead ? P.textSecondary : P.textPrimary },
              ]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <Text style={[styles.notifTime, { color: P.textMuted }]}>
              {relativeTime(item.timestamp)}
            </Text>
          </View>
          <Text
            style={[styles.notifBody, { color: P.textSecondary }]}
            numberOfLines={3}
          >
            {item.body}
          </Text>
          {item.actionLabel && (
            <View style={[styles.actionPill, { backgroundColor: cfg.bg(P), borderColor: cfg.border(P) }]}>
              <Text style={[styles.actionPillText, { color: cfg.iconColor(P) }]}>
                {item.actionLabel}
              </Text>
            </View>
          )}
        </View>

        {/* Dismiss */}
        <TouchableOpacity
          onPress={handleSwipeDismiss}
          style={styles.dismissBtn}
          accessibilityLabel="Dismiss notification"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <TrashIcon color={P.textMuted} size={14} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// NotificationCenter
// ---------------------------------------------------------------------------

const FILTER_TABS: { key: 'all' | NotificationCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'scheme', label: 'Schemes' },
  { key: 'eligibility', label: 'Eligibility' },
  { key: 'document', label: 'Documents' },
  { key: 'application', label: 'Applications' },
  { key: 'announcement', label: 'Announcements' },
];

interface Props {
  onBack: () => void;
}

export function NotificationCenter({ onBack }: Props) {
  const P = usePalette();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | NotificationCategory>('all');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) {
        const parsed = JSON.parse(val) as AppNotification[];
        setNotifications(parsed.map((n) => ({ ...n, timestamp: new Date(n.timestamp) })));
      } else {
        setNotifications(SEED_NOTIFICATIONS);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_NOTIFICATIONS));
      }
    });
  }, []);

  const save = useCallback((updated: AppNotification[]) => {
    setNotifications(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const markRead = useCallback(
    (id: string) => {
      save(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    },
    [notifications, save]
  );

  const dismiss = useCallback(
    (id: string) => {
      save(notifications.filter((n) => n.id !== id));
    },
    [notifications, save]
  );

  const markAllRead = useCallback(() => {
    save(notifications.map((n) => ({ ...n, isRead: true })));
  }, [notifications, save]);

  const clearAll = useCallback(() => {
    save([]);
  }, [save]);

  const filtered = useMemo(
    () =>
      filter === 'all' ? notifications : notifications.filter((n) => n.category === filter),
    [notifications, filter]
  );

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: P.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: P.primary }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5M12 19L5 12L12 5" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead} style={styles.headerAction} activeOpacity={0.8}>
            <CheckIcon color="#FFFFFF" size={15} />
            <Text style={styles.headerActionText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          notifications.length > 0 && (
            <TouchableOpacity onPress={clearAll} style={styles.headerAction} activeOpacity={0.8}>
              <TrashIcon color="rgba(255,255,255,0.7)" size={14} />
              <Text style={[styles.headerActionText, { color: 'rgba(255,255,255,0.7)' }]}>Clear</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* Filter tabs */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTER_TABS}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        style={{ flexGrow: 0 }}
        renderItem={({ item }) => {
          const active = filter === item.key;
          const count =
            item.key === 'all'
              ? notifications.length
              : notifications.filter((n) => n.category === item.key).length;
          return (
            <TouchableOpacity
              onPress={() => setFilter(item.key)}
              style={[
                styles.filterTab,
                active
                  ? { backgroundColor: P.primary, borderColor: P.primary }
                  : { backgroundColor: P.surface, borderColor: P.border },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: active ? P.white : P.textSecondary },
                ]}
              >
                {item.label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.filterCount,
                    { backgroundColor: active ? 'rgba(255,255,255,0.25)' : P.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      { color: active ? P.white : P.textMuted },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <NotificationRow item={item} onMarkRead={markRead} onDismiss={dismiss} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
              <Path d="M18 8C18 6.4 17.4 4.8 16.2 3.6C15 2.4 13.5 2 12 2C10.5 2 9 2.4 7.8 3.6C6.6 4.8 6 6.4 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={P.textMuted} strokeWidth={1.5} />
              <Path d="M13.7 21C13.5 21.3 13.3 21.6 12.9 21.8C12.5 22 12.3 22 12 22C11.7 22 11.5 22 11.1 21.8C10.7 21.6 10.5 21.3 10.3 21" stroke={P.textMuted} strokeWidth={1.5} strokeLinecap="round" />
            </Svg>
            <Text style={[styles.emptyTitle, { color: P.textSecondary }]}>No notifications</Text>
            <Text style={[styles.emptyBody, { color: P.textMuted }]}>
              {filter === 'all'
                ? 'You are all caught up. Notifications about new schemes and deadlines will appear here.'
                : `No ${filter} notifications at this time.`}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterTabText: { fontSize: 13, fontWeight: '600' },
  filterCount: {
    minWidth: 18,
    paddingHorizontal: 5,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: { fontSize: 10, fontWeight: '800' },
  listContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  notifRow: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  categoryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: { flex: 1 },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
    gap: 8,
  },
  notifTitle: { flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  notifTime: { fontSize: 10, flexShrink: 0, marginTop: 2 },
  notifBody: { fontSize: 12, lineHeight: 18 },
  actionPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionPillText: { fontSize: 11, fontWeight: '700' },
  dismissBtn: {
    paddingLeft: 6,
    paddingTop: 2,
    flexShrink: 0,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  emptyBody: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
