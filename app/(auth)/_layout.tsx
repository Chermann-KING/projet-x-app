import { Stack } from 'expo-router'

/** Layout du groupe auth — pas de tab bar, pas de header */
export default function AuthLayout(): React.JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />
}
