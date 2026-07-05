import { useEffect } from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { CheckCircle2, Clock, MessageCircle } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { getArtisanByUserId } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'

const WHATSAPP_NUMBER = process.env.EXPO_PUBLIC_WHATSAPP_SUPPORT ?? ''

type StepState = 'done' | 'active' | 'upcoming'

interface TimelineRow {
  state: StepState
  label: string
  badge?: string
}

type Theme = ReturnType<typeof useTheme>

const POLL_INTERVAL_MS = 30_000

export default function OnboardingPendingScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!user?.id) return
    const timer = setInterval(async () => {
      try {
        const profile = await getArtisanByUserId.execute(user.id)
        if (profile?.verificationStatus === 'approved') {
          router.replace('/(artisan)/dashboard')
        }
      } catch (err) {
        AppLogger.error(err)
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [user?.id])

  const timeline: TimelineRow[] = [
    {
      state: 'done',
      label: t('artisan.pending.timeline.submitted'),
    },
    {
      state: 'active',
      label: t('artisan.pending.timeline.verification'),
      badge: t('artisan.pending.timeline.verificationDelay'),
    },
    {
      state: 'upcoming',
      label: t('artisan.pending.timeline.sms'),
    },
    {
      state: 'upcoming',
      label: t('artisan.pending.timeline.active'),
    },
  ]

  function openWhatsApp(): void {
    void Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}`)
  }

  function goToDashboard(): void {
    router.replace('/(artisan)/dashboard')
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* ── Icône horloge ───────────────────────────────────────────── */}
        <View style={[styles.iconWrap, { backgroundColor: theme.warningMuted }]}>
          <Clock size={40} color={theme.warning} strokeWidth={1.5} />
        </View>

        {/* ── Titre ───────────────────────────────────────────────────── */}
        <Text style={[styles.title, { color: theme.foreground }]}>
          {t('artisan.pending.title')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.primary }]}>
          {t('artisan.pending.subtitle')}
        </Text>

        {/* ── Timeline ────────────────────────────────────────────────── */}
        <View
          style={[
            styles.timelineCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {timeline.map((row, index) => (
            <View key={row.label}>
              {index > 0 ? (
                <View style={[styles.separator, { backgroundColor: theme.border }]} />
              ) : null}
              <TimelineRowItem row={row} theme={theme} />
            </View>
          ))}
        </View>

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <Pressable
          onPress={openWhatsApp}
          style={[styles.whatsappBtn, { backgroundColor: theme.success }]}
          accessibilityRole="button"
        >
          <MessageCircle size={ds.size.icon.md} color="#fff" />
          <Text style={styles.whatsappText}>{t('artisan.pending.whatsapp')}</Text>
        </Pressable>

        <Pressable onPress={goToDashboard} accessibilityRole="link">
          <Text style={[styles.dashboardLink, { color: theme.mutedForeground }]}>
            {t('artisan.pending.dashboard')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

function TimelineRowItem({ row, theme }: { row: TimelineRow; theme: Theme }) {
  const { state, label, badge } = row

  const bullet =
    state === 'done' ? (
      <View style={[styles.bullet, { backgroundColor: theme.success }]}>
        <CheckCircle2 size={14} color="#fff" />
      </View>
    ) : state === 'active' ? (
      <View
        style={[
          styles.bullet,
          {
            backgroundColor: theme.warningMuted,
            borderWidth: 3,
            borderColor: theme.warning,
          },
        ]}
      >
        <View style={[styles.bulletInner, { backgroundColor: theme.warning }]} />
      </View>
    ) : (
      <View style={[styles.bullet, { backgroundColor: theme.muted, opacity: 0.5 }]} />
    )

  return (
    <View style={styles.row}>
      {bullet}
      <Text
        style={[
          styles.rowLabel,
          {
            color: state === 'upcoming' ? theme.mutedForeground : theme.foreground,
            fontWeight: state === 'active' ? '700' : '400',
          },
        ]}
      >
        {label}
      </Text>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: theme.muted }]}>
          <Text style={[styles.badgeText, { color: theme.mutedForeground }]}>{badge}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: ds.size.paddingH,
    alignItems: 'center',
    paddingTop: ds.space[10],
    gap: ds.space[5],
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.space[2],
  },
  title: {
    ...ds.text.h1,
    fontSize: 26,
    textAlign: 'center',
    lineHeight: 32,
  },
  subtitle: {
    ...ds.text.body,
    textAlign: 'center',
  },
  timelineCard: {
    alignSelf: 'stretch',
    borderRadius: ds.radius.card,
    borderWidth: 1,
    paddingVertical: ds.space[2],
  },
  separator: {
    height: 1,
    marginHorizontal: ds.size.paddingH,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[3],
  },
  bullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bulletInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowLabel: {
    ...ds.text.body,
    flex: 1,
  },
  badge: {
    paddingHorizontal: ds.space[2],
    paddingVertical: 3,
    borderRadius: ds.radius.sm,
  },
  badgeText: {
    ...ds.text.caption,
    fontWeight: '600',
  },
  whatsappBtn: {
    alignSelf: 'stretch',
    height: ds.size.button,
    borderRadius: ds.radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.space[3],
  },
  whatsappText: {
    ...ds.text.body,
    fontWeight: '700',
    fontSize: 16,
    color: '#fff',
  },
  dashboardLink: {
    ...ds.text.body,
    textDecorationLine: 'underline',
  },
})
