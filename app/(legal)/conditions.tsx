import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ChevronLeft, ExternalLink } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'

export default function ConditionsScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()

  const articles = [
    { key: 'art1', title: t('legal.conditions.art1.title'), body: t('legal.conditions.art1.body') },
    { key: 'art2', title: t('legal.conditions.art2.title'), body: t('legal.conditions.art2.body') },
    { key: 'art3', title: t('legal.conditions.art3.title'), body: t('legal.conditions.art3.body') },
    { key: 'art4', title: t('legal.conditions.art4.title'), body: t('legal.conditions.art4.body') },
    { key: 'art5', title: t('legal.conditions.art5.title'), body: t('legal.conditions.art5.body') },
    { key: 'art6', title: t('legal.conditions.art6.title'), body: t('legal.conditions.art6.body') },
    { key: 'art7', title: t('legal.conditions.art7.title'), body: t('legal.conditions.art7.body') },
    { key: 'art8', title: t('legal.conditions.art8.title'), body: t('legal.conditions.art8.body') },
    { key: 'art9', title: t('legal.conditions.art9.title'), body: t('legal.conditions.art9.body') },
    { key: 'art10', title: t('legal.conditions.art10.title'), body: t('legal.conditions.art10.body') },
    { key: 'art11', title: t('legal.conditions.art11.title'), body: t('legal.conditions.art11.body') },
    { key: 'art12', title: t('legal.conditions.art12.title'), body: t('legal.conditions.art12.body') },
    { key: 'art13', title: t('legal.conditions.art13.title'), body: t('legal.conditions.art13.body') },
    { key: 'art14', title: t('legal.conditions.art14.title'), body: t('legal.conditions.art14.body') },
  ]

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          hitSlop={12}
        >
          <ChevronLeft size={ds.size.icon.md} color={theme.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.foreground }]}>
          {t('legal.conditions.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Meta ────────────────────────────────────────────────── */}
        <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
          {t('legal.conditions.subtitle')}
        </Text>
        <Text style={[styles.updated, { color: theme.mutedForeground }]}>
          {t('legal.conditions.updated')}
        </Text>

        {/* ── Introduction ────────────────────────────────────────── */}
        <Text style={[styles.intro, { color: theme.foreground }]}>
          {t('legal.conditions.intro')}
        </Text>

        {/* ── Articles ────────────────────────────────────────────── */}
        {articles.map(({ key, title, body }) => (
          <View key={key} style={styles.article}>
            <Text style={[styles.articleTitle, { color: theme.foreground }]}>
              {title}
            </Text>
            <Text style={[styles.articleBody, { color: theme.mutedForeground }]}>
              {body}
            </Text>
          </View>
        ))}

        {/* ── Lien vers la politique de confidentialité ─── */}
        <Pressable
          onPress={() => router.push('/(legal)/privacy')}
          style={[styles.crossLink, { borderColor: theme.border }]}
          accessibilityRole="link"
        >
          <Text style={[styles.crossLinkText, { color: theme.primary }]}>
            {t('legal.conditions.seePrivacy')}
          </Text>
          <ExternalLink size={ds.size.icon.sm} color={theme.primary} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...ds.text.label,
    flex: 1,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: { width: 36 },
  scroll: {
    paddingHorizontal: ds.size.paddingH,
    paddingTop: ds.space[6],
    paddingBottom: ds.space[12],
  },
  subtitle: {
    ...ds.text.label,
    fontWeight: '600',
    marginBottom: ds.space[1],
  },
  updated: {
    ...ds.text.caption,
    marginBottom: ds.space[6],
  },
  intro: {
    ...ds.text.body,
    lineHeight: 24,
    marginBottom: ds.space[8],
  },
  article: {
    marginBottom: ds.space[6],
  },
  articleTitle: {
    ...ds.text.label,
    fontWeight: '700',
    marginBottom: ds.space[2],
  },
  articleBody: {
    ...ds.text.body,
    lineHeight: 22,
  },
  crossLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: ds.space[4],
    padding: ds.space[4],
    borderRadius: ds.radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  crossLinkText: {
    ...ds.text.label,
    fontWeight: '600',
    flex: 1,
  },
})
