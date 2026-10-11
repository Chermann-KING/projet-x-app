import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import {Check, Crown, Shield, Star} from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { IconBox, BackButton} from '@/presentation/components/ui'
import type { SubscriptionPlan } from '@/domain/entities/Artisan'

// ---------------------------------------------------------------------------
// Config par plan
// ---------------------------------------------------------------------------

type PlanCardProps = {
  planKey: SubscriptionPlan
  currentPlan: SubscriptionPlan
}

function PlanCard({ planKey, currentPlan }: PlanCardProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const isCurrent = planKey === currentPlan

  type PlanConfig = {
    Icon: typeof Shield
    iconColor: string
    iconBg: string
    priceColor: string
    checkColor: string
    features: string[]
  }

  const configs: Record<SubscriptionPlan, PlanConfig> = {
    free: {
      Icon: Shield,
      iconColor: theme.mutedForeground,
      iconBg: theme.muted,
      priceColor: theme.foreground,
      checkColor: theme.mutedForeground,
      features: [
        t('artisan.subscription.plans.free.feat1'),
        t('artisan.subscription.plans.free.feat2'),
      ] },
    standard: {
      Icon: Star,
      iconColor: theme.primary,
      iconBg: theme.errorMuted,
      priceColor: theme.primary,
      checkColor: theme.primary,
      features: [
        t('artisan.subscription.plans.standard.feat1'),
        t('artisan.subscription.plans.standard.feat2'),
        t('artisan.subscription.plans.standard.feat3'),
      ] },
    premium: {
      Icon: Crown,
      iconColor: theme.warning,
      iconBg: theme.warningMuted,
      priceColor: theme.warning,
      checkColor: theme.warning,
      features: [
        t('artisan.subscription.plans.premium.feat1'),
        t('artisan.subscription.plans.premium.feat2'),
        t('artisan.subscription.plans.premium.feat3'),
        t('artisan.subscription.plans.premium.feat4'),
      ] } }

  const { Icon, iconColor, iconBg, priceColor, checkColor, features } = configs[planKey]

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: isCurrent ? theme.primary : theme.border,
          borderWidth: isCurrent ? 1.5 : 1 },
      ]}
    >
      {/* ── Bandeau "plan actuel" ─────────────────────────────────── */}
      {isCurrent && (
        <View style={[styles.currentBanner, { backgroundColor: theme.primary }]}>
          <Check size={13} color={theme.primaryForeground} strokeWidth={3} />
          <Text style={[styles.currentBannerText, { color: theme.primaryForeground }]}>
            {t('artisan.subscription.current.badge')}
          </Text>
        </View>
      )}

      {/* ── Ligne icône / nom / prix ─────────────────────────────── */}
      <View style={styles.cardHeader}>
        <IconBox bg={iconBg} size={44}>
          <Icon size={22} color={iconColor} />
        </IconBox>

        <Text style={[styles.planName, { color: theme.foreground }]}>
          {t(`artisan.subscription.plans.${planKey}.name`)}
        </Text>

        <Text style={[styles.priceAmount, { color: priceColor }]}>
          {t(`artisan.subscription.plans.${planKey}.price`)}
          <Text style={[styles.priceUnit, { color: theme.mutedForeground }]}>
            {' '}{t('artisan.subscription.priceUnit')}
          </Text>
        </Text>
      </View>

      {/* ── Features ─────────────────────────────────────────────── */}
      <View style={styles.featureList}>
        {features.map((feat) => (
          <View key={feat} style={styles.featureRow}>
            <Check size={14} color={checkColor} strokeWidth={2.5} />
            <Text style={[styles.featureText, { color: theme.foreground }]}>{feat}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const PLANS: SubscriptionPlan[] = ['free', 'standard', 'premium']

export default function SubscriptionScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const { plan } = useLocalSearchParams<{ plan?: string }>()
  const currentPlan: SubscriptionPlan =
    plan === 'standard' || plan === 'premium' ? plan : 'free'

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <BackButton />
        <Text style={[styles.title, { color: theme.foreground }]}>
          {t('artisan.subscription.title')}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Sous-titre avec "le plan" coloré ────────────────────── */}
        <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
          {t('artisan.subscription.subtitleBefore')}
          <Text style={{ color: theme.primary }}>
            {t('artisan.subscription.subtitleHighlight')}
          </Text>
          {t('artisan.subscription.subtitleAfter')}
        </Text>

        {/* ── Cartes ──────────────────────────────────────────────── */}
        {PLANS.map((key) => (
          <PlanCard key={key} planKey={key} currentPlan={currentPlan} />
        ))}

        {/* ── Footer ──────────────────────────────────────────────── */}
        <Text style={[styles.footer, { color: theme.primary }]}>
          {t('artisan.subscription.footer')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[3],
    borderBottomWidth: 1 },
  title: { ...ds.text.h2 },
  scroll: {
    paddingHorizontal: ds.size.paddingH,
    paddingTop: ds.space[5],
    paddingBottom: ds.space[10],
    gap: ds.space[3] },
  subtitle: {
    ...ds.text.body,
    marginBottom: ds.space[2] },
  // ── Card ──────────────────────────────────────────────────────────
  card: {
    borderRadius: ds.radius.card,
    overflow: 'hidden' },
  currentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[2],
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[2] },
  currentBannerText: {
    ...ds.text.label,
    fontWeight: '700' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingHorizontal: ds.size.paddingH,
    paddingTop: ds.space[4],
    paddingBottom: ds.space[3] },
  planName: {
    ...ds.text.body,
    fontWeight: '700',
    fontSize: 18,
    flex: 1 },
  priceAmount: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26 },
  priceUnit: {
    fontSize: 12,
    fontWeight: '400' },
  // ── Features ──────────────────────────────────────────────────────
  featureList: {
    paddingHorizontal: ds.size.paddingH,
    paddingBottom: ds.space[5],
    gap: ds.space[2] },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[2] },
  featureText: {
    ...ds.text.body },
  // ── Footer ────────────────────────────────────────────────────────
  footer: {
    ...ds.text.caption,
    textAlign: 'center',
    marginTop: ds.space[2] } })
