import { useEffect, useState, useCallback } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import {CheckCircle2, ChevronDown, ChevronUp} from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { getQuoteWithClient, respondToQuote } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { Avatar, BackButton} from '@/presentation/components/ui'
import { getCurrencyByIso } from '@/shared/constants/CurrencyConstants'
import { detectCountry } from '@/shared/constants/PhoneConstants'
import type { Quote } from '@/domain/entities/Quote'
import type { User } from '@/domain/entities/User'

export default function CreateQuoteScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const currency = getCurrencyByIso(detectCountry(user?.phone ?? '').iso)
  const { quoteId } = useLocalSearchParams<{ quoteId: string }>()

  const [quote, setQuote] = useState<Quote | null>(null)
  const [clientUser, setClientUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [summaryExpanded, setSummaryExpanded] = useState(true)

  const [descriptionTravaux, setDescriptionTravaux] = useState('')
  const [prix, setPrix] = useState('')
  const [delai, setDelai] = useState('')

  const load = useCallback(async (): Promise<void> => {
    if (!quoteId) return
    setIsLoading(true)
    try {
      const { quote: found, clientUser: client } = await getQuoteWithClient.execute(quoteId)
      setQuote(found)
      setClientUser(client)
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [quoteId])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSend(): Promise<void> {
    if (!quote || !prix || !descriptionTravaux) return
    setIsSending(true)
    try {
      const prixNum = parseFloat(prix.replace(/\s/g, '').replace(',', '.'))
      await respondToQuote.execute({
        quoteId: quote.id,
        artisanId: quote.artisanId,
        prix: prixNum,
        description: descriptionTravaux,
        ...(delai && { delaiPropose: `${delai} ${t('artisan.quoteCreate.delay.suffix')}` }),
        notification: {
          title: t('notification.quote.responded.title'),
          body: t('notification.quote.responded.body'),
        },
      })
      router.navigate({ pathname: '/(artisan)/quotes/index' as never, params: { tab: 'sent' } })
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setIsSending(false)
    }
  }

  const canSend = !!descriptionTravaux.trim() && !!prix.trim()
  const clientName = clientUser?.fullName ?? (quote ? `Client ${quote.clientId.slice(0, 6).toUpperCase()}` : '…')

  const formattedAvailability = quote?.disponibiliteSouhaitee
    ? t('artisan.quoteCreate.summary.availability', {
        date: new Date(quote.disponibiliteSouhaitee).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      })
    : t('artisan.quoteCreate.summary.noAvailability')

  const summaryText = quote
    ? `${quote.description} — ${quote.adresse ?? ''}. ${formattedAvailability}.`
    : ''

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
          <BackButton />
        <Text style={[styles.headerTitle, { color: theme.foreground }]}>
          {t('artisan.quoteCreate.title')}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} size="large" />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Résumé client ─────────────────────────────────────────── */}
            <Pressable
              style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setSummaryExpanded((v) => !v)}
            >
              <View style={styles.summaryTop}>
                <Avatar
                  name={clientName}
                  size="sm"
                  {...(clientUser?.avatarUrl ? { uri: clientUser.avatarUrl } : {})}
                />
                <View style={styles.summaryMeta}>
                  <Text style={[styles.summaryName, { color: theme.foreground }]}>
                    {clientName}
                  </Text>
                  <Text style={[styles.summaryDesc, { color: theme.mutedForeground }]} numberOfLines={1}>
                    {quote?.description ?? ''}
                  </Text>
                </View>
                {summaryExpanded
                  ? <ChevronUp size={18} color={theme.mutedForeground} />
                  : <ChevronDown size={18} color={theme.mutedForeground} />
                }
              </View>
              {summaryExpanded && (
                <Text style={[styles.summaryFull, { color: theme.mutedForeground }]}>
                  {summaryText}
                </Text>
              )}
            </Pressable>

            {/* ── Description des travaux ───────────────────────────────── */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.foreground }]}>
                {t('artisan.quoteCreate.description.label')} *
              </Text>
              <TextInput
                style={[
                  styles.textarea,
                  { backgroundColor: theme.surface, borderColor: theme.border, color: theme.foreground },
                ]}
                placeholder={t('artisan.quoteCreate.description.placeholder')}
                placeholderTextColor={theme.mutedForeground}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={descriptionTravaux}
                onChangeText={setDescriptionTravaux}
              />
            </View>

            {/* ── Prix ──────────────────────────────────────────────────── */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.foreground }]}>
                {t('artisan.quoteCreate.price.label')} *
              </Text>
              <View
                style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <TextInput
                  style={[styles.inputRowField, { color: theme.foreground }]}
                  placeholder={t('artisan.quoteCreate.price.placeholder')}
                  placeholderTextColor={theme.mutedForeground}
                  keyboardType="numeric"
                  value={prix}
                  onChangeText={setPrix}
                />
                <Text style={[styles.inputRowSuffix, { color: theme.mutedForeground }]}>
                  {currency.symbol}
                </Text>
              </View>
            </View>

            {/* ── Délai estimé ──────────────────────────────────────────── */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.foreground }]}>
                {t('artisan.quoteCreate.delay.label')} *
              </Text>
              <View
                style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <TextInput
                  style={[styles.inputRowField, { color: theme.foreground }]}
                  placeholder={t('artisan.quoteCreate.delay.placeholder')}
                  placeholderTextColor={theme.mutedForeground}
                  keyboardType="numeric"
                  value={delai}
                  onChangeText={setDelai}
                />
                <Text style={[styles.inputRowSuffix, { color: theme.mutedForeground }]}>
                  {t('artisan.quoteCreate.delay.suffix')}
                </Text>
              </View>
            </View>

            {/* ── Info banner ───────────────────────────────────────────── */}
            <View style={[styles.hint, { backgroundColor: theme.successMuted }]}>
              <CheckCircle2 size={18} color={theme.success} />
              <Text style={[styles.hintText, { color: theme.foreground }]}>
                {t('artisan.quoteCreate.hint')}
              </Text>
            </View>

            {/* ── Bouton envoyer ────────────────────────────────────────── */}
            <Pressable
              style={[
                styles.btnSend,
                { backgroundColor: canSend ? theme.primary : theme.muted },
              ]}
              onPress={() => void handleSend()}
              disabled={!canSend || isSending}
            >
              {isSending
                ? <ActivityIndicator color="#fff" />
                : (
                  <Text
                    style={[
                      styles.btnSendText,
                      { color: canSend ? theme.primaryForeground : theme.mutedForeground },
                    ]}
                  >
                    {t('artisan.quoteCreate.button')}
                  </Text>
                )
              }
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  loader: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[4],
    borderBottomWidth: 1,
  },
  headerTitle: { ...ds.text.h3, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: {
    padding: ds.size.paddingH,
    gap: ds.space[5],
    paddingBottom: ds.space[10],
  },
  summaryCard: {
    borderRadius: ds.radius.card,
    borderWidth: 1,
    padding: ds.space[4],
    gap: ds.space[3],
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: ds.space[3] },
  summaryMeta: { flex: 1, gap: 2 },
  summaryName: { ...ds.text.body, fontWeight: '700' },
  summaryDesc: { ...ds.text.caption },
  summaryFull: {
    ...ds.text.label,
    lineHeight: 20,
    paddingTop: ds.space[1],
  },
  fieldGroup: { gap: ds.space[2] },
  fieldLabel: { ...ds.text.label, fontWeight: '700' },
  textarea: {
    borderRadius: ds.radius.input,
    borderWidth: 1,
    padding: ds.space[4],
    minHeight: 120,
    ...ds.text.body,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: ds.radius.input,
    borderWidth: 1,
    height: ds.size.input,
    paddingHorizontal: ds.space[4],
  },
  inputRowField: { flex: 1, ...ds.text.body },
  inputRowSuffix: { ...ds.text.label, fontWeight: '600' },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.space[3],
    padding: ds.space[4],
    borderRadius: ds.radius.card,
  },
  hintText: { ...ds.text.label, flex: 1, lineHeight: 20 },
  btnSend: {
    height: ds.size.button,
    borderRadius: ds.radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSendText: { ...ds.text.label, fontWeight: '700', fontSize: 16 },
})
