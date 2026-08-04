import '../global.css'
import '@/i18n'
import { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Constants from 'expo-constants'
import { registerAppLogger } from '@/presentation/stores/notificationStore'
import { AppLogger } from '@/shared/logger/AppLogger'
import { ToastContainer } from '@/presentation/components/ui'
import { usePushTokenRegistration } from '@/presentation/hooks/usePushTokenRegistration'

// Web fix: prevent "Failed to set an indexed property on CSSStyleDeclaration".
//
// Two separate bugs cause this:
//
// 1. Some code passes style={[array]} to native DOM elements (div, a, span…).
//    React DOM's setValueForStyles iterates with for…in, hitting indices '0','1'
//    on CSSStyleDeclaration which has no indexed setter.
//    → Fix: flatten array styles in React.createElement for string types.
//
// 2. @radix-ui/react-slot (used by expo-router's Link asChild) merges the Slot
//    props with the child's style via object spread:
//    { ...slotStyle, ...childArrayStyle }  →  { '0': s0, '1': s1 }
//    This numeric-keyed object reaches React DOM via Pressable → View → styleq
//    and also causes the indexed-property error.
//    → Fix: in React.cloneElement, restore spread-array objects back to real arrays
//      so that RNW's styleq can process them correctly.
if (typeof window !== 'undefined') {
  // Returns true if every own key is a non-negative integer string.
  // This signature indicates the object came from { ...someArray }.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isSpreadArray = (obj: any): boolean => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
    const keys = Object.keys(obj)
    return keys.length > 0 && keys.every(k => /^\d+$/.test(k))
  }

  // Restore { '0': v0, '1': v1, … } back to [v0, v1, …].
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const restoreArray = (obj: Record<string, unknown>): unknown[] => {
    const max = Math.max(...Object.keys(obj).map(Number))
    const arr: unknown[] = []
    for (let i = 0; i <= max; i++) arr.push(obj[String(i)])
    return arr
  }

  // Recursively flatten RN-style arrays/objects into a single plain CSS object.
  const flattenStyle = (style: unknown): Record<string, unknown> => {
    const flat: Record<string, unknown> = {}
    const traverse = (s: unknown): void => {
      if (!s || typeof s !== 'object') return
      if (Array.isArray(s)) { s.forEach(traverse); return }
      Object.assign(flat, s as object)
    }
    traverse(style)
    return flat
  }

  // Remove numeric-indexed keys from a plain style object so React DOM's
  // setValueForStyles never attempts style['0'] = … on CSSStyleDeclaration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dropNumericKeys = (style: Record<string, any>): Record<string, unknown> => {
    const out: Record<string, unknown> = {}
    for (const k in style) {
      if (!/^\d+$/.test(k)) out[k] = style[k]
    }
    return out
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports
  const R = require('react') as any

  // ── Fix 1: createElement ──────────────────────────────────────────────────
  // For native DOM elements (string type), flatten array styles and remove
  // any residual numeric keys that styleq may have passed through.
  const origCreate = R.createElement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  R.createElement = function (type: any, props: any, ...rest: any[]) {
    if (typeof type === 'string' && props?.style != null) {
      const s = props.style
      if (Array.isArray(s)) {
        props = { ...props, style: flattenStyle(s) }
      } else if (typeof s === 'object' && Object.keys(s).some(k => /^\d+$/.test(k))) {
        props = { ...props, style: dropNumericKeys(s) }
      }
    }
    return origCreate(type, props, ...rest)
  }

  // ── Fix 2: cloneElement ───────────────────────────────────────────────────
  // Radix Slot does React.cloneElement(child, mergedProps) where mergedProps.style
  // may be { '0': s0, '1': s1 } (a spread array). Restoring it to [s0, s1] lets
  // RNW's styleq process it correctly rather than leaking numeric keys to React DOM.
  const origClone = R.cloneElement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  R.cloneElement = function (element: any, props: any, ...rest: any[]) {
    if (props?.style != null && isSpreadArray(props.style)) {
      props = { ...props, style: restoreArray(props.style) }
    }
    return origClone(element, props, ...rest)
  }
}

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
    mutations: { retry: 0 },
  },
})

export default function RootLayout() {
  usePushTokenRegistration()
  const router = useRouter()

  // Polices locales — docs/fonts → assets/fonts
  // BricolageGrotesque : fichiers statiques (600 et 700)
  // NunitoSans : police variable (fontWeight sélectionne 400/500/700)
  const [fontsLoaded, fontsError] = useFonts({
    'BricolageGrotesque': require('../assets/fonts/BricolageGrotesque-SemiBold.ttf'),
    'BricolageGrotesque-Bold': require('../assets/fonts/BricolageGrotesque-Bold.ttf'),
    'NunitoSans': require('../assets/fonts/NunitoSans-Variable.ttf'),
  })

  useEffect(() => {
    registerAppLogger()
  }, [])

  useEffect(() => {
    if (fontsError) AppLogger.error(fontsError)
  }, [fontsError])

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  useEffect(() => {
    if (Constants.appOwnership === 'expo') return

    let subscription: { remove: () => void } | null = null

    void import('expo-notifications').then((Notifications) => {
      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<string, string> | undefined
        if (!data) return
        const { type, quoteId, role } = data
        if (!quoteId) return

        if (type === 'quote_request') {
          router.push({ pathname: '/(artisan)/quotes/[id]', params: { id: quoteId } })
        } else if (type === 'quote_response') {
          router.push({ pathname: '/(client)/request/[id]', params: { id: quoteId } })
        } else if (type === 'job_done') {
          router.push({ pathname: '/(client)/request/[id]', params: { id: quoteId } })
        } else if (type === 'message') {
          if (role === 'artisan') {
            router.push({ pathname: '/(artisan)/chat/[id]', params: { id: quoteId } })
          } else {
            router.push({ pathname: '/(client)/chat/[id]', params: { id: quoteId } })
          }
        }
      })
    })

    return () => { subscription?.remove() }
  }, [router])

  if (!fontsLoaded) return null

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(client)" />
          <Stack.Screen name="(artisan)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(legal)" />
        </Stack>
        <ToastContainer />
        <StatusBar style="auto" />
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
