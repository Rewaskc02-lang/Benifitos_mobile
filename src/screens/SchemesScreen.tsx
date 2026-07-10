import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { usePalette } from '@/store/themeStore';

const { width } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
function SearchIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={1.8} />
      <Path d="M21 21L16.65 16.65" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ChevronRightIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
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

function FileTextIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6C5.46 2 4.94 2.21 4.59 2.59C4.21 2.94 4 3.46 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="10" y1="9" x2="8" y2="9" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M14 2V8H20" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExternalLinkIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 13V19C18 20.1 17.1 21 16 21H5C3.9 21 3 20.1 3 19V8C3 6.9 3.9 6 5 6H11" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 3H21V9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 14L21 3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export type Scheme = {
  id: string;
  name: string;
  category: string;
  ministry: string;
  benefit: string;
  benefitAmount?: number;
  eligibility: string[];
  documents: string[];
  steps: string[];
  deadline?: string;
  website?: string;
  phone?: string;
  aiSummary: string;
  tags: string[];
  scope: 'Central' | 'State';
};

const CATEGORIES = [
  'All', 'Students', 'Farmers', 'Women', 'Employment', 'Healthcare',
  'Housing', 'Insurance', 'Scholarships', 'MSME', 'Senior Citizens',
  'Disabled', 'Central', 'State',
];

const SCHEMES: Scheme[] = [
  {
    id: 'pm-kisan',
    name: 'PM-KISAN',
    category: 'Farmers',
    ministry: 'Ministry of Agriculture',
    benefit: 'Rs. 6,000/year direct income support',
    benefitAmount: 6000,
    eligibility: ['Small & marginal farmers', 'Land holding up to 2 hectares', 'Valid Aadhaar'],
    documents: ['Aadhaar Card', 'Land Records', 'Bank Account (Aadhaar-linked)', 'Mobile Number'],
    steps: ['Register on pmkisan.gov.in', 'Submit Aadhaar and land documents', 'Verification by state government', 'DBT transfer in 3 instalments'],
    website: 'https://pmkisan.gov.in',
    phone: '155261',
    aiSummary: 'PM-KISAN provides Rs. 2,000 directly to farmer bank accounts every 4 months (3 times a year). You must have your Aadhaar linked to your bank account. The entire process is digital and payments are tracked via the PM-KISAN portal.',
    tags: ['DBT', 'Farmer', 'Income Support'],
    scope: 'Central',
  },
  {
    id: 'nsp',
    name: 'National Scholarship Portal (NSP)',
    category: 'Scholarships',
    ministry: 'Ministry of Education',
    benefit: 'Scholarships from Rs. 1,000 to Rs. 50,000/year',
    benefitAmount: 50000,
    eligibility: ['Indian students', 'Annual family income below Rs. 6 LPA', 'Minimum 50% marks in last exam', 'Enrolled in recognized institution'],
    documents: ['Aadhaar Card', 'Income Certificate', 'Marksheet', 'Bank Account', 'Institution Enrollment Proof'],
    steps: ['Register on scholarships.gov.in', 'Select applicable scholarship', 'Upload required documents', 'Institute verification', 'Disbursement to bank account'],
    website: 'https://scholarships.gov.in',
    phone: '0120-6619540',
    aiSummary: 'NSP is a single portal for all central and state government scholarships. It covers Pre-Matric, Post-Matric, and Merit-based scholarships for SC, ST, OBC, Minority, and EWS students. Apply before October 31 each academic year.',
    tags: ['Education', 'Scholarship', 'Students'],
    scope: 'Central',
    deadline: 'October 31',
  },
  {
    id: 'pmay',
    name: 'Pradhan Mantri Awas Yojana (PMAY)',
    category: 'Housing',
    ministry: 'Ministry of Housing & Urban Affairs',
    benefit: 'Housing subsidy up to Rs. 2.67 Lakh',
    benefitAmount: 267000,
    eligibility: ['Annual income below Rs. 18 LPA (varies by category)', 'No pucca house in India', 'EWS/LIG/MIG category', 'No previous housing benefit'],
    documents: ['Aadhaar Card', 'Income Certificate', 'Bank Account', 'Property Documents', 'Affidavit'],
    steps: ['Apply via CSC or PMAY portal', 'Submit documents', 'Income verification', 'Loan processed via bank', 'Subsidy credited to loan account'],
    website: 'https://pmaymis.gov.in',
    phone: '1800-11-6163',
    aiSummary: 'PMAY provides interest subsidy on home loans for first-time homebuyers. EWS category (income below Rs. 3 LPA) can get subsidy up to Rs. 2.67 Lakh. Applications are processed through banks empaneled with NHB/HUDCO.',
    tags: ['Housing', 'Subsidy', 'Home Loan'],
    scope: 'Central',
  },
  {
    id: 'ayushman-bharat',
    name: 'Ayushman Bharat PM-JAY',
    category: 'Healthcare',
    ministry: 'Ministry of Health & Family Welfare',
    benefit: 'Rs. 5 Lakh/year health coverage per family',
    benefitAmount: 500000,
    eligibility: ['SECC database beneficiaries', 'Families in rural areas without permanent employment', 'Urban workers in specified occupational categories'],
    documents: ['Aadhaar Card', 'Ration Card', 'SECC Registration Number'],
    steps: ['Check eligibility on pmjay.gov.in', 'Get Ayushman card from nearest hospital/CSC', 'Visit any empaneled hospital', 'Treatment is cashless'],
    website: 'https://pmjay.gov.in',
    phone: '14555',
    aiSummary: 'PM-JAY covers hospitalization expenses up to Rs. 5 Lakh/year for families. Treatment is cashless at over 25,000 empaneled government and private hospitals across India. The scheme covers 1,929 medical procedures.',
    tags: ['Healthcare', 'Insurance', 'Cashless'],
    scope: 'Central',
  },
  {
    id: 'mudra',
    name: 'PM Mudra Yojana',
    category: 'MSME',
    ministry: 'Ministry of Finance',
    benefit: 'Loans from Rs. 50,000 to Rs. 10 Lakh',
    benefitAmount: 1000000,
    eligibility: ['Indian citizen', 'Non-farm small enterprise', 'Age 18-65', 'No previous default with banks'],
    documents: ['Aadhaar Card', 'PAN Card', 'Business Plan', 'Bank Statement (6 months)', 'Proof of business'],
    steps: ['Approach any bank/NBFC/MFI', 'Submit Mudra loan application', 'Business verification', 'Loan disbursal within 7-10 days'],
    website: 'https://mudra.org.in',
    aiSummary: 'MUDRA loans are available under 3 categories: Shishu (up to Rs. 50K), Kishor (Rs. 50K-5L), Tarun (Rs. 5L-10L). No collateral required for Shishu loans. Apply at any scheduled commercial bank or microfinance institution.',
    tags: ['Loan', 'MSME', 'Business'],
    scope: 'Central',
  },
  {
    id: 'skill-india',
    name: 'Skill India Mission',
    category: 'Employment',
    ministry: 'Ministry of Skill Development',
    benefit: 'Free skill training + placement assistance',
    eligibility: ['Age 15-45', 'Indian citizen', 'Class 8th pass minimum', 'No prior formal skill certification'],
    documents: ['Aadhaar Card', 'Educational Certificates', 'Passport Photo', 'Bank Account'],
    steps: ['Register on skillindiadigital.gov.in', 'Choose a course from 700+ options', 'Attend training (30-300 hours)', 'Assessment & certification', 'Placement support'],
    website: 'https://skillindiadigital.gov.in',
    phone: '1800-123-9626',
    aiSummary: 'Skill India offers free short-term training through NSDC. Courses range from electronics, construction, hospitality to retail. Certified candidates get placement assistance. PMKVY provides financial reward up to Rs. 10,000 on completion.',
    tags: ['Skill', 'Employment', 'Training'],
    scope: 'Central',
  },
  {
    id: 'nps',
    name: 'National Pension System (NPS)',
    category: 'Senior Citizens',
    ministry: 'Ministry of Finance / PFRDA',
    benefit: 'Market-linked pension + tax benefit up to Rs. 2 Lakh',
    eligibility: ['Indian citizen aged 18-70', 'KYC compliant', 'Aadhaar or PAN'],
    documents: ['Aadhaar Card', 'PAN Card', 'Bank Account', 'Passport Photo'],
    steps: ['Open NPS account at any Point of Presence (PoP)', 'Contribute minimum Rs. 500/year', 'At 60: 60% lump sum + 40% annuity'],
    website: 'https://npstrust.org.in',
    aiSummary: 'NPS is a voluntary long-term retirement savings scheme. Additional Rs. 50,000 tax deduction under 80CCD(1B) over the standard Rs. 1.5L limit. Returns depend on asset allocation (E, C, G, A funds). Partial withdrawal allowed after 3 years.',
    tags: ['Pension', 'Retirement', 'Tax'],
    scope: 'Central',
  },
  {
    id: 'pmsby',
    name: 'PM Suraksha Bima Yojana',
    category: 'Insurance',
    ministry: 'Ministry of Finance',
    benefit: 'Rs. 2 Lakh accidental death/disability cover at Rs. 20/year',
    benefitAmount: 200000,
    eligibility: ['Age 18-70', 'Jan Dhan / savings bank account', 'Aadhaar linked to bank'],
    documents: ['Aadhaar Card', 'Bank Account', 'Mobile Number'],
    steps: ['Enroll through bank branch/mobile banking', 'Auto-debit of Rs. 20/year', 'Claim through bank on accident'],
    aiSummary: 'PMSBY offers Rs. 2 Lakh for accidental death, Rs. 2 Lakh for permanent total disability, and Rs. 1 Lakh for permanent partial disability — all for just Rs. 20/year premium auto-debited from your bank account.',
    tags: ['Insurance', 'Accident', 'Low Premium'],
    scope: 'Central',
  },
];

// ---------------------------------------------------------------------------
// Scheme Detail Modal
// ---------------------------------------------------------------------------

function SchemeDetailModal({
  scheme,
  visible,
  onClose,
}: {
  scheme: Scheme | null;
  visible: boolean;
  onClose: () => void;
}) {
  const P = usePalette();
  if (!scheme) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: P.background }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: P.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn} activeOpacity={0.7}>
            <CloseIcon color={P.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: P.textPrimary }]} numberOfLines={1}>
            {scheme.name}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          {/* Ministry tag */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <View style={[styles.tag, { backgroundColor: P.primaryA10, borderColor: P.primaryA30 }]}>
              <Text style={[styles.tagText, { color: P.primary }]}>{scheme.scope}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: P.accentA15, borderColor: P.accentA40 }]}>
              <Text style={[styles.tagText, { color: P.accent }]}>{scheme.category}</Text>
            </View>
          </View>

          <Text style={[styles.modalMinistry, { color: P.textMuted }]}>{scheme.ministry}</Text>

          {/* Benefit highlight */}
          <View style={[styles.benefitHighlight, { backgroundColor: P.successA15, borderColor: P.successA30 }]}>
            <Text style={[styles.benefitHighlightLabel, { color: P.textMuted }]}>BENEFIT</Text>
            <Text style={[styles.benefitHighlightValue, { color: P.success }]}>{scheme.benefit}</Text>
          </View>

          {/* AI Summary */}
          <View style={[styles.detailCard, { backgroundColor: P.surface, borderColor: P.border }]}>
            <Text style={[styles.detailCardTitle, { color: P.textPrimary }]}>AI Summary</Text>
            <Text style={[styles.detailCardBody, { color: P.textSecondary }]}>{scheme.aiSummary}</Text>
          </View>

          {/* Eligibility */}
          <View style={[styles.detailCard, { backgroundColor: P.surface, borderColor: P.border }]}>
            <Text style={[styles.detailCardTitle, { color: P.textPrimary }]}>Eligibility Criteria</Text>
            {scheme.eligibility.map((item, i) => (
              <View key={i} style={styles.checkRow}>
                <CheckCircleIcon color={P.success} />
                <Text style={[styles.checkText, { color: P.textSecondary }]}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Documents */}
          <View style={[styles.detailCard, { backgroundColor: P.surface, borderColor: P.border }]}>
            <Text style={[styles.detailCardTitle, { color: P.textPrimary }]}>Required Documents</Text>
            {scheme.documents.map((doc, i) => (
              <View key={i} style={styles.checkRow}>
                <FileTextIcon color={P.accent} />
                <Text style={[styles.checkText, { color: P.textSecondary }]}>{doc}</Text>
              </View>
            ))}
          </View>

          {/* Application Steps */}
          <View style={[styles.detailCard, { backgroundColor: P.surface, borderColor: P.border }]}>
            <Text style={[styles.detailCardTitle, { color: P.textPrimary }]}>How to Apply</Text>
            {scheme.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: P.primaryA20 }]}>
                  <Text style={[styles.stepNumText, { color: P.primary }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: P.textSecondary }]}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Contacts */}
          {(scheme.website || scheme.phone) && (
            <View style={{ gap: 10, marginTop: 4 }}>
              {scheme.website && (
                <TouchableOpacity
                  style={[styles.contactBtn, { backgroundColor: P.primary }]}
                  onPress={() => Linking.openURL(scheme.website!)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.contactBtnText}>Apply on Official Portal</Text>
                  <ExternalLinkIcon color="#FFFFFF" size={16} />
                </TouchableOpacity>
              )}
              {scheme.phone && (
                <TouchableOpacity
                  style={[styles.contactBtnOutline, { borderColor: P.primary }]}
                  onPress={() => Linking.openURL(`tel:${scheme.phone}`)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.contactBtnOutlineText, { color: P.primary }]}>
                    Helpline: {scheme.phone}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Fraud warning */}
          <View style={[styles.fraudWarning, { backgroundColor: P.errorA15, borderColor: P.errorA30 }]}>
            <Text style={[styles.fraudWarningTitle, { color: P.error }]}>Fraud Warning</Text>
            <Text style={[styles.fraudWarningText, { color: P.textSecondary }]}>
              Government schemes are free. Never pay anyone to apply. Report fraud to the cybercrime portal at cybercrime.gov.in or call 1930.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// SchemesScreen
// ---------------------------------------------------------------------------

export function SchemesScreen() {
  const P = usePalette();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filtered = useMemo(() => {
    return SCHEMES.filter((s) => {
      const matchesCategory =
        activeCategory === 'All' ||
        s.category === activeCategory ||
        s.scope === activeCategory ||
        s.tags.includes(activeCategory);
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.ministry.toLowerCase().includes(q) ||
        s.aiSummary.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  const openScheme = (scheme: Scheme) => {
    setSelectedScheme(scheme);
    setShowModal(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: P.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.screenHeader, { backgroundColor: P.primary }]}>
        <Text style={styles.screenHeaderSub}>Government Scheme Library</Text>
        <Text style={styles.screenHeaderTitle}>All Schemes</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: P.surface, borderColor: P.border }]}>
        <SearchIcon color={P.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: P.textPrimary }]}
          placeholder="Search schemes..."
          placeholderTextColor={P.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        style={{ flexGrow: 0 }}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              activeCategory === cat
                ? { backgroundColor: P.primary, borderColor: P.primary }
                : { backgroundColor: P.surface, borderColor: P.border },
            ]}
            onPress={() => setActiveCategory(cat)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.categoryChipText,
                { color: activeCategory === cat ? P.white : P.textSecondary },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <Text style={[styles.resultsCount, { color: P.textMuted }]}>
          {filtered.length} scheme{filtered.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Scheme list */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((scheme) => (
          <TouchableOpacity
            key={scheme.id}
            style={[styles.schemeCard, { backgroundColor: P.surface, borderColor: P.border }]}
            onPress={() => openScheme(scheme)}
            activeOpacity={0.8}
          >
            <View style={styles.schemeCardTop}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                  <View style={[styles.chipTiny, { backgroundColor: P.primaryA10 }]}>
                    <Text style={[styles.chipTinyText, { color: P.primary }]}>{scheme.scope}</Text>
                  </View>
                  <View style={[styles.chipTiny, { backgroundColor: P.accentA15 }]}>
                    <Text style={[styles.chipTinyText, { color: P.accent }]}>{scheme.category}</Text>
                  </View>
                </View>
                <Text style={[styles.schemeCardName, { color: P.textPrimary }]}>{scheme.name}</Text>
                <Text style={[styles.schemeCardMinistry, { color: P.textMuted }]} numberOfLines={1}>
                  {scheme.ministry}
                </Text>
              </View>
              <ChevronRightIcon color={P.textMuted} />
            </View>
            <View style={[styles.schemeCardDivider, { borderTopColor: P.border }]} />
            <Text style={[styles.schemeCardBenefit, { color: P.success }]}>{scheme.benefit}</Text>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <SearchIcon color={P.textMuted} size={40} />
            <Text style={[{ color: P.textMuted, fontSize: 15, marginTop: 16, textAlign: 'center' }]}>
              No schemes found for "{searchQuery}"
            </Text>
          </View>
        )}
      </ScrollView>

      <SchemeDetailModal
        scheme={selectedScheme}
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenHeader: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  screenHeaderSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  screenHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: -10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#1E3D59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  schemeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  schemeCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  schemeCardName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
    lineHeight: 21,
  },
  schemeCardMinistry: {
    fontSize: 12,
  },
  schemeCardDivider: {
    borderTopWidth: 1,
    marginVertical: 12,
  },
  schemeCardBenefit: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipTiny: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipTinyText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  modalMinistry: {
    fontSize: 12,
    marginBottom: 16,
    fontWeight: '500',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  benefitHighlight: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  benefitHighlightLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  benefitHighlightValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  detailCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  detailCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailCardBody: {
    fontSize: 13,
    lineHeight: 21,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  checkText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  contactBtnOutline: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
  },
  contactBtnOutlineText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fraudWarning: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 20,
  },
  fraudWarningTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  fraudWarningText: {
    fontSize: 12,
    lineHeight: 19,
  },
});
