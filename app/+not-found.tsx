import { Link, Stack } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

export default function NotFoundScreen(): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <>
      <Stack.Screen options={{ title: t('common.notFound.title') }} />
      <View style={styles.container}>
        <Text style={styles.title}>{t('common.notFound.title')}</Text>
        <Link href="/" style={styles.link}>
          {t('common.notFound.backHome')}
        </Link>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  link: { fontSize: 15, color: '#860101' },
})
