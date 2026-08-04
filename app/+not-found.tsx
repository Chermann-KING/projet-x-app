import { Link, Stack } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page introuvable' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Page introuvable</Text>
        <Link href="/" style={styles.link}>
          Retour à l'accueil
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
