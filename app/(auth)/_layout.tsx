import { Stack } from 'expo-router'

/** Layout du groupe auth — pas de tab bar, pas de header */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
