import { Stack } from 'expo-router'
import { useTheme } from '@/presentation/hooks/useTheme'

export default function ChatLayout(): React.JSX.Element {
  const theme = useTheme()
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    />
  )
}
