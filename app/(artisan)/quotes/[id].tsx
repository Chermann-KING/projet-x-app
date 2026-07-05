import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import {AlertCircle, Banknote, CalendarDays, CheckCircle2, Clock, MapPin, XCircle} from 'lucide-react-native'
import { translateDynamic, useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { markQuoteDone, getQuoteWithClient, declineQuoteRequest } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { Avatar, BackButton} from '@/presentation/components/ui'
import { formatCurrency, getCurrencyByIso } from '@/shared/constants/CurrencyConstants'
import { detectCountry } from '@/shared/constants/PhoneConstants'
import type { Quote } from '@/domain/entities/Quote'
import type { User } from '@/domain/entities/User'

function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

function formatRequestDate(date: Date): string {
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  const time = formatTime(date)
  if (diffDays === 0) return translateDynamic('common.date.todayAt', { time })
  if (diffDays === 1) return translateDynamic('common.date.yesterdayAt', { time })
  return `${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} ${time}`
}

export default function QuoteDetailScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const { id } = useLocalSearchParams<{ id: string }>()
  const currency = getCurrencyByIso(detectCountry(user?.phone ?? '').iso)

  const [quote, setQuote] = useState<Quote | null>(null)
  const [clientUser, setClientUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingDone, setIsMarkingDone] = useState(false)

  useEffect(() => {
    void load()
  }, [id])

  async function load(): Promise<void> {
    if (!id) return
    setIsLoading(true)
    try {
      const { quote: found, clientUser: client } = await getQuoteWithClient.execute(id)
      setQuote(found)
      setClientUser(client)
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  function handleDecline(): void {
    Alert.alert(
      t('artisan.requestDetail.declineConfirmTitle'),
      t('artisan.requestDetail.declineConfirmMessage'),
      [
        { text: t('common.button.cancel'), style: 'cancel' },
        {
          text: t('artisan.requestDetail.declineConfirmBtn'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await declineQuoteRequest.execute(quote!.id, quote!.artisanId)
                router.back()
              } catch (err) {
                AppLogger.error(err)
              }
            })()
          } },
      ],
    )
  }

  async function handleMarkDone(): Promise<void> {
    if (!quote) return
    setIsMarkingDone(true)
    try {
      await markQuoteDone.execute({
        quoteId: quote.id,
        artisanId: quote.artisanId,
        notification: {
          title: t('notification.quote.done.title'),
          body: t('notification.quote.done.body') } })
      router.navigate({ pathname: '/(artisan)/quotes/index' as never, params: { tab: 'archived' } })
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setIsMarkingDone(false)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <ActivityIndicator style={styles.loader} color={theme.primary} size="large" />
      </SafeAreaView>
    )
  }

  if (!quote) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.mutedForeground }]}>
          {t('common.error.generic')}
        </Text>
      </SafeAreaView>
    )
  }

  const clientName = clientUser?.fullName ?? `Client ${quote.clientId.slice(0, 6).toUpperCase()}`
  const isPending  = quote.status === 'pending'
  const isSent     = quote.status === 'sent'
  const isAccepted = quote.status === 'accepted'
  const isRefused  = quote.status === 'refused'
  const isDone     = quote.status === 'done'
  const hasQuoteDetails = !isPending && quote.prix != null

  function headerTitle(): string {
    if (isPending)  return t('artisan.requestDetail.title')
    if (isSent)     return t('artisan.requestDetail.sentTitle')
    if (isAccepted) return t('artisan.requestDetail.acceptedTitle')
    if (isRefused)  return t('artisan.requestDetail.refusedTitle')
    return t('artisan.requestDetail.doneTitle')
  }

  type BannerConfig = { text: string; bg: string; color: string; Icon: typeof AlertCircle }
  function banner(): BannerConfig | null {
    if (isPending)  return null
    if (isSent)     return { text: t('artisan.requestDetail.banner.sent'),     bg: theme.warningMuted,  color: theme.warning, Icon: AlertCircle }
    if (isAccepted) return { text: t('artisan.requestDetail.banner.accepted'), bg: theme.successMuted,  color: theme.success, Icon: CheckCircle2 }
    if (isRefused)  return { text: t('artisan.requestDetail.banner.refused'),  bg: theme.errorMuted,   color: theme.error,   Icon: XCircle }
    return           { text: t('artisan.requestDetail.banner.done'),    bg: theme.successMuted,  color: theme.success, Icon: CheckCircle2 }
  }
  const bannerCfg = banner()

  const chatParams = {
    id: quote.id,
    clientUserId: quote.clientId,
    clientName: clientUser?.fullName ?? '',
    clientAvatarUrl: clientUser?.avatarUrl ?? '',
    clientPhone: clientUser?.phone ?? '' }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <BackButton />
        <Text style={[styles.headerTitle, { color: theme.foreground }]}>
          {headerTitle()}
        </Text>
        {isPending ? (
          <View style={[styles.newBadge, { backgroundColor: theme.primary }]}>
            <Text style={styles.newBadgeText}>{t('artisan.requestDetail.newBadge')}</Text>
          </View>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Bannière statut ──────────────────────────────────────────── */}
        {bannerCfg != null ? (
          <View style={[styles.banner, { backgroundColor: bannerCfg.bg }]}>
            <bannerCfg.Icon size={16} color={bannerCfg.color} />
            <Text style={[styles.bannerText, { color: bannerCfg.color }]}>
              {bannerCfg.text}
            </Text>
          </View>
        ) : null}

        {/* ── Bloc client ───────────────────────────────────────────────── */}
        <View style={styles.clientBlock}>
          <Avatar
            name={clientName}
            size="lg"
            {...(clientUser?.avatarUrl ? { uri: clientUser.avatarUrl } : {})}
          />
          <View style={styles.clientInfo}>
            <Text style={[styles.clientName, { color: theme.foreground }]}>{clientName}</Text>
            <Text style={[styles.clientMeta, { color: theme.mutedForeground }]}>
              {t('artisan.requestDetail.clientType')}
            </Text>
            <View style={styles.clientTime}>
              <Clock size={12} color={theme.mutedForeground} />
              <Text style={[styles.clientTimeText, { color: theme.mutedForeground }]}>
                {formatRequestDate(new Date(quote.createdAt))}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* ── Récapitulatif du devis (sent / accepted / refused / done) ── */}
        {hasQuoteDetails ? (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.foreground }]}>
                {t('artisan.requestDetail.quoteSection.label')}
              </Text>

              {/* Montant */}
              <View style={[styles.quoteRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.quoteIcon, { backgroundColor: theme.muted }]}>
                  <Banknote size={16} color={theme.mutedForeground} />
                </View>
                <View style={styles.quoteContent}>
                  <Text style={[styles.quoteLabel, { color: theme.mutedForeground }]}>
                    {t('artisan.requestDetail.quoteSection.price')}
                  </Text>
                  <Text style={[styles.quoteValue, { color: theme.foreground }]}>
                    {formatCurrency(quote.prix ?? 0, currency)}
                  </Text>
                </View>
              </View>

              {/* Délai */}
              {quote.delaiPropose != null ? (
                <View style={[styles.quoteRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={[styles.quoteIcon, { backgroundColor: theme.muted }]}>
                    <CalendarDays size={16} color={theme.mutedForeground} />
                  </View>
                  <View style={styles.quoteContent}>
                    <Text style={[styles.quoteLabel, { color: theme.mutedForeground }]}>
                      {t('artisan.requestDetail.quoteSection.delay')}
                    </Text>
                    <Text style={[styles.quoteValue, { color: theme.foreground }]}>
                      {quote.delaiPropose}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Description des travaux */}
              {quote.description ? (
                <View style={styles.descBlock}>
                  <Text style={[styles.quoteLabel, { color: theme.mutedForeground }]}>
                    {t('artisan.requestDetail.quoteSection.description')}
                  </Text>
                  <Text style={[styles.descText, { color: theme.foreground }]}>
                    {quote.description}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </>
        ) : null}

        {/* ── Description du besoin client (pending uniquement) ─────────── */}
        {isPending ? (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.foreground }]}>
                {t('artisan.requestDetail.description.label')}
              </Text>
              <Text style={[styles.clientDescText, { color: theme.primary }]}>
                {quote.description}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </>
        ) : null}

        {/* ── Adresse ───────────────────────────────────────────────────── */}
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: theme.muted }]}>
            <MapPin size={16} color={theme.mutedForeground} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: theme.mutedForeground }]}>
              {t('artisan.requestDetail.address.label')}
            </Text>
            <Text style={[styles.infoValue, { color: theme.foreground }]}>
              {quote.adresse || '—'}
            </Text>
          </View>
        </View>

        {/* ── Disponibilité ─────────────────────────────────────────────── */}
        {quote.disponibiliteSouhaitee != null ? (
          <>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: theme.muted }]}>
                <CalendarDays size={16} color={theme.mutedForeground} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.mutedForeground }]}>
                  {t('artisan.requestDetail.availability.label')}
                </Text>
                <Text style={[styles.infoValue, { color: theme.foreground }]}>
                  {quote.disponibiliteSouhaitee instanceof Date
                    ? quote.disponibiliteSouhaitee.toLocaleDateString('fr-FR')
                    : String(quote.disponibiliteSouhaitee)}
                </Text>
              </View>
            </View>
          </>
        ) : null}

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <View style={styles.actions}>

          {/* ── PENDING : Créer un devis + Contacter + Décliner ──────── */}
          {isPending ? (
            <>
              <Pressable
                style={[styles.btnPrimary, { backgroundColor: theme.primary }]}
                onPress={() => router.push({ pathname: '/(artisan)/quotes/create' as never, params: { quoteId: quote.id } })}
              >
                <Text style={[styles.btnPrimaryText, { color: theme.primaryForeground }]}>
                  {t('artisan.requestDetail.createQuote')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.btnSecondary, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.push({ pathname: '/(artisan)/chat/[id]' as never, params: chatParams })}
              >
                <Text style={[styles.btnSecondaryText, { color: theme.foreground }]}>
                  {t('artisan.requestDetail.contactClient')}
                </Text>
              </Pressable>
              <Pressable style={styles.btnLink} onPress={handleDecline}>
                <Text style={[styles.btnLinkText, { color: theme.mutedForeground }]}>
                  {t('artisan.requestDetail.decline')}
                </Text>
              </Pressable>
            </>
          ) : null}

          {/* ── SENT : Contacter uniquement ──────────────────────────── */}
          {isSent ? (
            <Pressable
              style={[styles.btnSecondary, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push({ pathname: '/(artisan)/chat/[id]' as never, params: chatParams })}
            >
              <Text style={[styles.btnSecondaryText, { color: theme.foreground }]}>
                {t('artisan.requestDetail.contactClient')}
              </Text>
            </Pressable>
          ) : null}

          {/* ── ACCEPTED : Marquer terminé + Contacter ───────────────── */}
          {isAccepted ? (
            <>
              <Pressable
                style={[styles.btnPrimary, { backgroundColor: theme.primary }]}
                onPress={() => void handleMarkDone()}
                disabled={isMarkingDone}
              >
                {isMarkingDone
                  ? <ActivityIndicator color="#fff" />
                  : (
                    <Text style={[styles.btnPrimaryText, { color: theme.primaryForeground }]}>
                      {t('artisan.requestDetail.markDone')}
                    </Text>
                  )}
              </Pressable>
              <Pressable
                style={[styles.btnSecondary, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.push({ pathname: '/(artisan)/chat/[id]' as never, params: chatParams })}
              >
                <Text style={[styles.btnSecondaryText, { color: theme.foreground }]}>
                  {t('artisan.requestDetail.contactClient')}
                </Text>
              </Pressable>
            </>
          ) : null}

          {/* ── REFUSED / DONE : lecture seule, aucune action ─────────── */}
          {(isRefused || isDone) ? null : null}

        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loader: { flex: 1 },
  errorText: { textAlign: 'center', marginTop: ds.space[10], ...ds.text.body },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[4],
    borderBottomWidth: 1 },
  headerTitle: { ...ds.text.h3, fontWeight: '700', flex: 1 },
  newBadge: {
    paddingHorizontal: ds.space[3],
    paddingVertical: ds.space[1],
    borderRadius: ds.radius.sm },
  newBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  headerSpacer: { width: 60 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: ds.space[10] },
  // Bannière statut
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[2],
    marginHorizontal: ds.size.paddingH,
    marginTop: ds.space[4],
    padding: ds.space[3],
    borderRadius: ds.radius.input },
  bannerText: { ...ds.text.label, fontWeight: '600', flex: 1 },
  // Bloc client
  clientBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.space[4],
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[5] },
  clientInfo: { flex: 1, gap: ds.space[1] },
  clientName: { ...ds.text.h2, fontSize: 22 },
  clientMeta: { ...ds.text.label },
  clientTime: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  clientTimeText: { ...ds.text.caption },
  divider: { height: 1, marginHorizontal: ds.size.paddingH },
  // Section générique
  section: {
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[5],
    gap: ds.space[3] },
  sectionLabel: { ...ds.text.label, fontWeight: '700' },
  // Devis envoyé
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    padding: ds.space[3],
    borderRadius: ds.radius.input,
    borderWidth: 1 },
  quoteIcon: {
    width: 36,
    height: 36,
    borderRadius: ds.radius.sm,
    alignItems: 'center',
    justifyContent: 'center' },
  quoteContent: { flex: 1, gap: 2 },
  quoteLabel: { ...ds.text.caption },
  quoteValue: { ...ds.text.body, fontWeight: '700' },
  descBlock: { gap: ds.space[2] },
  descText: { ...ds.text.body, lineHeight: 22 },
  // Description client (pending)
  clientDescText: { ...ds.text.body, lineHeight: 22 },
  // Adresse / dispo
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.space[3],
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[4] },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: ds.radius.sm,
    alignItems: 'center',
    justifyContent: 'center' },
  infoContent: { flex: 1, gap: 2 },
  infoLabel: { ...ds.text.caption },
  infoValue: { ...ds.text.body, fontWeight: '600' },
  // Actions
  actions: {
    paddingHorizontal: ds.size.paddingH,
    paddingTop: ds.space[6],
    gap: ds.space[3] },
  btnPrimary: {
    height: ds.size.button,
    borderRadius: ds.radius.input,
    alignItems: 'center',
    justifyContent: 'center' },
  btnPrimaryText: { ...ds.text.label, fontWeight: '700', fontSize: 16 },
  btnSecondary: {
    height: ds.size.button,
    borderRadius: ds.radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1 },
  btnSecondaryText: { ...ds.text.label, fontWeight: '600', fontSize: 16 },
  btnLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ds.space[3] },
  btnLinkText: { ...ds.text.label, fontSize: 15 } })
