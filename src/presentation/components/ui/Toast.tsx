import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { CheckCircle, CircleAlert, Info, X } from 'lucide-react-native'
import Animated, {
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useNotificationStore } from '@/presentation/stores/notificationStore'
import type { AppNotification } from '@/shared/logger/IAppLogger'

function ToastIcon({ level, color }: { level: AppNotification['level']; color: string }) {
  switch (level) {
    case 'success':
      return <CheckCircle size={ds.size.icon.lg} color={color} />
    case 'error':
      return <CircleAlert size={ds.size.icon.lg} color={color} />
    default:
      return <Info size={ds.size.icon.lg} color={color} />
  }
}

interface ToastItemProps {
  notification: AppNotification
  onDismiss: () => void
}

function ToastItem({ notification, onDismiss }: ToastItemProps) {
  const theme = useTheme()
  const opacity = useSharedValue(1)

  const levelColors = {
    success: { border: theme.success, bg: theme.successMuted, icon: theme.success },
    error: { border: theme.error, bg: theme.errorMuted, icon: theme.error },
    warning: { border: theme.warning, bg: theme.warningMuted, icon: theme.warning },
    info: { border: theme.primary, bg: theme.muted, icon: theme.primary },
    debug: { border: theme.mutedForeground, bg: theme.muted, icon: theme.mutedForeground },
  }

  const colors = levelColors[notification.level] ?? levelColors.info

  useEffect(() => {
    const duration = notification.duration ?? 4000
    const FADE_DURATION = 250
    // Lance le fade sur le UI thread et dismiss sur le JS thread après la même durée.
    // Évite runOnJS/scheduleOnRN dont les signatures varient selon la version de Reanimated.
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: FADE_DURATION })
      setTimeout(onDismiss, FADE_DURATION)
    }, duration)
    return () => clearTimeout(timer)
  }, [notification, onDismiss, opacity])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      exiting={FadeOutDown.duration(200)}
      style={[
        styles.toast,
        ds.shadow.toast,
        animatedStyle,
        { backgroundColor: colors.bg, borderLeftColor: colors.border },
      ]}
    >
      <ToastIcon level={notification.level} color={colors.icon} />
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: theme.foreground }]}>
          {notification.title}
        </Text>
        {notification.message ? (
          <Text style={[styles.message, { color: theme.mutedForeground }]}>
            {notification.message}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={onDismiss}
        hitSlop={ds.space[2]}
        accessibilityRole="button"
        accessibilityLabel="Fermer"
      >
        <X size={ds.size.icon.sm} color={theme.mutedForeground} />
      </Pressable>
    </Animated.View>
  )
}

export function ToastContainer() {
  const current = useNotificationStore((s) => s.current)
  const dismiss = useNotificationStore((s) => s.dismiss)

  if (!current || current.display !== 'toast') return null

  return (
    <View style={styles.container} pointerEvents="box-none">
      <ToastItem key={current.code ?? current.title} notification={current} onDismiss={dismiss} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: ds.size.tabBar + ds.space[5],
    left: ds.size.paddingH,
    right: ds.size.paddingH,
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.space[2] + 2, // 10
    padding: ds.space[3] + 2, // 14
    borderRadius: ds.radius.card,
    borderLeftWidth: 4,
  },
  textBlock: {
    flex: 1,
    gap: ds.space[1] / 2, // 2
  },
  title: {
    ...ds.text.label,
    fontWeight: '700',
  },
  message: {
    ...ds.text.label,
  },
})
