import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import {Search, X} from 'lucide-react-native'
import { translateDynamic, useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { checkAvailability, searchArtisans } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { ArtisanCard, EmptyState, BackButton} from '@/presentation/components/ui'
import { useUserLocation } from '@/presentation/hooks/useUserLocation'
import type { Artisan } from '@/domain/entities/Artisan'
import type { ArtisanSearchResult } from '@/application/artisan/SearchArtisansUseCase'

type FilterKey = 'note' | 'distance' | 'available' | 'priceMax'

const FILTERS: FilterKey[] = ['note', 'distance', 'available', 'priceMax']

export default function ResultsScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const { metier, query: initialQuery } = useLocalSearchParams<{ metier?: string; query?: string | string[] }>()
  const { location } = useUserLocation()
  const inputRef = useRef<TextInput>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [searchText, setSearchText] = useState(
    Array.isArray(initialQuery) ? initialQuery[0] ?? '' : initialQuery ?? '',
  )
  const [artisans, setArtisans] = useState<ArtisanSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>('note')
  const [availableArtisanIds, setAvailableArtisanIds] = useState<Set<string> | null>(null)
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false)

  useEffect(() => {
    if (!metier) {
      // Autofocus quand on arrive depuis la barre de recherche (sans filtre métier)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [])

  useEffect(() => {
    void loadResults(searchText)
  }, [metier, location.lat, location.lng])

  // Filtre "Disponible" : interroge la disponibilité pour la fenêtre aujourd'hui + 3 jours
  useEffect(() => {
    if (activeFilter !== 'available') {
      setAvailableArtisanIds(null)
      return
    }
    if (artisans.length === 0) {
      setAvailableArtisanIds(new Set())
      return
    }

    let cancelled = false
    setAvailableArtisanIds(null)
    setIsAvailabilityLoading(true)

    const from = new Date()
    from.setHours(0, 0, 0, 0)

    checkAvailability
      .getAvailableArtisanIds(artisans.map((a) => a.id), from, 3, 120)
      .then((ids) => { if (!cancelled) setAvailableArtisanIds(new Set(ids)) })
      .catch((err) => { AppLogger.error(err) })
      .finally(() => { if (!cancelled) setIsAvailabilityLoading(false) })

    return () => { cancelled = true }
  }, [activeFilter, artisans])

  function handleSearchChange(text: string): void {
    setSearchText(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void loadResults(text), 400)
  }

  async function loadResults(query: string): Promise<void> {
    setIsLoading(true)
    try {
      const data = await searchArtisans.execute({
        ...(metier ? { metier: metier as Artisan['metier'] } : {}),
        ...(query.trim() ? { query: query.trim() } : {}),
        lat: location.lat,
        lng: location.lng,
      })
      setArtisans(data)
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Tri et filtrage côté client selon le filtre actif
  const displayedArtisans = useMemo(() => {
    const list = [...artisans]
    switch (activeFilter) {
      case 'note':
        return list.sort((a, b) => b.averageRating - a.averageRating)
      case 'distance':
        return list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
      case 'priceMax':
        return list.filter((a) => a.tarifIndicatif != null && a.tarifIndicatif <= 15000)
      case 'available':
        // null = en cours de chargement → afficher tous en attendant
        if (availableArtisanIds === null) return list
        return list.filter((a) => availableArtisanIds.has(a.id))
      default:
        return list
    }
  }, [artisans, activeFilter, availableArtisanIds])

  const metierTitle = metier ? translateDynamic(`metier.${metier}`) : null
  const title = metierTitle ?? t('client.results.title')
  const city = location.city ?? 'Libreville'
  const count = displayedArtisans.length
  const subtitleKey = count === 1 ? 'client.results.subtitle_one' : 'client.results.subtitle_other'
  const subtitle = translateDynamic(subtitleKey, { count, city })

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
          <BackButton />
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: theme.foreground }]}>{title}</Text>
          <Text style={[styles.headerSubtitle, { color: theme.mutedForeground }]}>{subtitle}</Text>
        </View>
      </View>

      {/* ── Barre de recherche ────────────────────────────────────────── */}
      <View style={styles.searchPad}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Search size={ds.size.icon.sm} color={theme.mutedForeground} />
          <TextInput
            ref={inputRef}
            value={searchText}
            onChangeText={handleSearchChange}
            placeholder={t('client.results.search.placeholder')}
            placeholderTextColor={theme.mutedForeground}
            style={[styles.searchInput, { color: theme.foreground }]}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 ? (
            <Pressable
              onPress={() => handleSearchChange('')}
              hitSlop={ds.space[2]}
              accessibilityRole="button"
              accessibilityLabel={t('common.button.cancel')}
            >
              <X size={ds.size.icon.sm} color={theme.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* ── Filtres ────────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((key) => {
          const isActive = activeFilter === key
          return (
            <Pressable
              key={key}
              onPress={() => setActiveFilter(isActive ? null : key)}
              style={[
                styles.filterChip,
                isActive
                  ? { backgroundColor: theme.primary, borderColor: theme.primary }
                  : { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text
                style={[
                  styles.filterLabel,
                  { color: isActive ? theme.primaryForeground : theme.foreground },
                ]}
              >
                {translateDynamic(`client.results.filter.${key}`)}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* ── Liste ──────────────────────────────────────────────────────── */}
      <FlatList
        data={displayedArtisans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ArtisanCard
            artisan={item}
            distanceKm={item.distanceKm}
            onPress={() => router.push({ pathname: '/(client)/artisan/[id]', params: { id: item.id } })}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshing={isLoading || isAvailabilityLoading}
        onRefresh={() => void loadResults(searchText)}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={Search}
              title={t('client.results.empty.title')}
              description={t('client.results.empty.description')}
            />
          ) : null
        }
        ListFooterComponent={
          count > 0 ? (
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.mutedForeground }]}>
                {t('client.results.scrollHint', { shown: count, total: artisans.length })}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[3],
    paddingTop: ds.space[4],
  },
  headerTitles: { flex: 1 },
  headerTitle: { ...ds.text.h3, fontSize: 18 },
  headerSubtitle: { ...ds.text.label },
  searchPad: {
    paddingHorizontal: ds.size.paddingH,
    marginBottom: ds.space[3],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[2],
    height: ds.size.input,
    borderRadius: ds.radius.xl,
    borderWidth: 1,
    paddingHorizontal: ds.size.paddingH,
  },
  searchInput: {
    ...ds.text.body,
    flex: 1,
    height: '100%',
  },
  filters: {
    paddingHorizontal: ds.size.paddingH,
    gap: ds.space[2],
    marginBottom: ds.space[3],
    height: 44,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[2],
    borderRadius: ds.radius.avatar,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
  },
  filterLabel: { ...ds.text.label, fontWeight: '600' },
  list: { paddingHorizontal: ds.size.paddingH, paddingTop: ds.space[3], paddingBottom: ds.space[8] },
  sep: { height: ds.space[3] },
  footer: { alignItems: 'center', paddingVertical: ds.space[4] },
  footerText: { ...ds.text.caption },
})
