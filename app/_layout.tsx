import '../global.css'
import '@/i18n'
import { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Constants, { AppOwnership } from 'expo-constants'
import bricolageSemiBold from '../assets/fonts/BricolageGrotesque-SemiBold.ttf'
import bricolageBold from '../assets/fonts/BricolageGrotesque-Bold.ttf'
import nunitoSansVariable from '../assets/fonts/NunitoSans-Variable.ttf'
import { registerAppLogger } from '@/presentation/stores/notificationStore'
import { AppLogger } from '@/shared/logger/AppLogger'
import { ToastContainer } from '@/presentation/components/ui'
import { installWebStyleFix } from '@/presentation/web/installWebStyleFix'
import { usePushTokenRegistration } from '@/presentation/hooks/usePushTokenRegistration'

installWebStyleFix()
void SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
    mutations: { retry: 0 },
  },
})

export default function RootLayout(): React.JSX.Element | null {
  usePushTokenRegistration()
  const router = useRouter()

  // Polices locales — docs/fonts → assets/fonts
  // BricolageGrotesque : fichiers statiques (600 et 700)
  // NunitoSans : police variable (fontWeight sélectionne 400/500/700)
  const [fontsLoaded, fontsError] = useFonts({
    'BricolageGrotesque': bricolageSemiBold,
    'BricolageGrotesque-Bold': bricolageBold,
    'NunitoSans': nunitoSansVariable,
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
    if (Constants.appOwnership === AppOwnership.Expo) return

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
