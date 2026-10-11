import { Stack } from 'expo-router'
import { useTheme } from '@/presentation/hooks/useTheme'

export default function QuotesLayout(): React.JSX.Element {
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
