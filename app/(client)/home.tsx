import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import WebView from 'react-native-webview'
import {
  Droplets,
  Hammer,
  List,
  LocateFixed,
  MapPin,
  Paintbrush,
  Search,
  SlidersHorizontal,
  X,
  Zap,
} from 'lucide-react-native'
import { translateDynamic, useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { searchArtisans } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { AppHeader, ArtisanCard, Selector } from '@/presentation/components/ui'
import { useUserLocation } from '@/presentation/hooks/useUserLocation'
import { useNotifBadge } from '@/presentation/hooks/useNotifBadge'
import type { ArtisanSearchResult } from '@/application/artisan/SearchArtisansUseCase'
import type { Metier } from '@/shared/constants/metiers'
import type { Artisan } from '@/domain/entities/Artisan'

interface CategoryChip {
  metier: Metier
  Icon: typeof Droplets
}

const CATEGORY_CHIPS: CategoryChip[] = [
  { metier: 'plombier', Icon: Droplets },
  { metier: 'electricien', Icon: Zap },
  { metier: 'peintre', Icon: Paintbrush },
  { metier: 'maçon', Icon: Hammer },
]

function deterministicOffset(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 1_000_000
  return h / 1_000_000
}

function buildMapHtml(
  artisans: Artisan[],
  userLat: number,
  userLng: number,
  primaryColor: string,
): string {
  const markers = artisans.map((a) => ({
    id: a.id,
    initials: a.fullName
      .split(' ')
      .map((n) => n[0] ?? '')
      .slice(0, 2)
      .join('')
      .toUpperCase(),
    avatarUrl: a.avatarUrl ?? null,
    lat: a.lat ?? userLat + (deterministicOffset(a.id) - 0.5) * 0.04,
    lng: a.lng ?? userLng + (deterministicOffset(a.id + 'lng') - 0.5) * 0.04,
  }))

  const primary = primaryColor

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#f0ece8}
    #map{width:100vw;height:100vh}
    .m-wrap{display:flex;flex-direction:column;align-items:center;gap:2px}
    .m-circle{background:${primary};color:#fff;border-radius:50%;width:40px;height:40px;
      display:flex;align-items:center;justify-content:center;font-weight:700;
      font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,.3);font-family:sans-serif;overflow:hidden}
    .m-pin{width:0;height:0;border-left:6px solid transparent;
      border-right:6px solid transparent;border-top:9px solid ${primary}}
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    window.leafletMap = L.map('map',{zoomControl:false,attributionControl:true})
      .setView([${userLat},${userLng}],14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'© OpenStreetMap',maxZoom:19
    }).addTo(window.leafletMap);

    L.circleMarker([${userLat},${userLng}],{
      radius:9,fillColor:'#4A90D9',color:'#fff',weight:3,fillOpacity:1
    }).addTo(window.leafletMap);

    ${JSON.stringify(markers)}.forEach(a=>{
      const ic=L.divIcon({
        className:'',
        html:'<div class="m-wrap"><div class="m-circle">'+(a.avatarUrl?'<img src="'+a.avatarUrl+'" style="width:100%;height:100%;object-fit:cover"/>':a.initials)+'</div><div class="m-pin"></div></div>',
        iconSize:[40,52],iconAnchor:[20,52]
      });
      L.marker([a.lat,a.lng],{icon:ic}).addTo(window.leafletMap).on('click',()=>{
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'artisan',id:a.id}));
      });
    });
  </script>
</body>
</html>`
}

export default function HomeScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const userId = user?.id
  const setAppMode = useAuthStore((s) => s.setAppMode)
  const { location } = useUserLocation()
  const { hasUnread, refresh: refreshNotifBadge } = useNotifBadge()

  useFocusEffect(useCallback(() => { refreshNotifBadge() }, [refreshNotifBadge]))

  const [artisans, setArtisans] = useState<ArtisanSearchResult[]>([])
  const [isRefreshing, setIsRefreshing] = useState(true)
  const [showMap, setShowMap] = useState(true)
  const [selectorVisible, setSelectorVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeMetier, setActiveMetier] = useState<Metier | null>(null)

  // Ref pour lire searchQuery dans les effects sans en faire une dépendance
  const searchQueryRef = useRef('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const webViewRef = useRef<WebView>(null)

  const firstName = user?.fullName?.split(' ')[0] ?? ''

  function handleSwitchToArtisanMode(): void {
    setAppMode('artisan')
    router.replace('/(artisan)/dashboard')
  }

  const selectorOptions = [
    {
      label: t('common.selector.switchToArtisan'),
      icon: <Hammer size={ds.size.icon.sm} color={theme.primary} />,
      onPress: handleSwitchToArtisanMode,
      variant: 'primary' as const,
    },
  ]

  const loadArtisans = useCallback(async (query: string, metier: Metier | null): Promise<void> => {
    setIsRefreshing(true)
    try {
      const data = await searchArtisans.execute({
        ...(metier ? { metier } : {}),
        ...(query.trim() ? { query: query.trim() } : {}),
        lat: location.lat,
        lng: location.lng,
        ...(userId ? { excludeUserId: userId } : {}),
      })
      setArtisans(data)
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setIsRefreshing(false)
    }
  }, [location.lat, location.lng, userId])

  // Rechargement immédiat quand la localisation ou le métier sélectionné change
  useEffect(() => {
    void loadArtisans(searchQueryRef.current, activeMetier)
  }, [loadArtisans, activeMetier])

  function handleSearchChange(text: string): void {
    searchQueryRef.current = text
    setSearchQuery(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const currentMetier = activeMetier
    debounceRef.current = setTimeout(() => void loadArtisans(text, currentMetier), 400)
  }

  function handleChipPress(metier: Metier): void {
    setActiveMetier((prev) => (prev === metier ? null : metier))
  }

  function handleRecenter(): void {
    webViewRef.current?.injectJavaScript(
      `if(window.leafletMap){window.leafletMap.setView([${location.lat},${location.lng}],14);}true;`,
    )
  }

  function handleOpenAdvancedFilters(): void {
    router.push({
      pathname: '/(client)/results',
      params: {
        ...(activeMetier ? { metier: activeMetier } : {}),
        ...(searchQuery.trim() ? { query: searchQuery.trim() } : {}),
      },
    })
  }

  const mapHtml = useMemo(
    () => buildMapHtml(artisans, location.lat, location.lng, theme.primary),
    [artisans, location, theme.primary],
  )

  const count = artisans.length
  const isFiltered = !!activeMetier || searchQuery.trim().length > 0
  const nearbyKey = isFiltered
    ? count === 1 ? 'client.results.count_one' : 'client.results.count_other'
    : count === 1 ? 'client.home.nearbyArtisans.count_one' : 'client.home.nearbyArtisans.count_other'
  const nearbyLabel = translateDynamic(nearbyKey, { count })

  function handleWebViewMessage(event: { nativeEvent: { data: string } }): void {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type: string; id: string }
      if (msg.type === 'artisan') {
        router.push({ pathname: '/(client)/artisan/[id]', params: { id: msg.id } })
      }
    } catch {
      // ignore malformed messages
    }
  }

  return (
    <View style={[styles.safe, { backgroundColor: theme.background }]}>
      <AppHeader
        title={t('client.home.greeting', { name: firstName })}
        subtitle={
          location.city ? (
            <View style={styles.locationRow}>
              <MapPin size={ds.size.icon.xs} color={theme.primary} />
              <Text style={[styles.location, { color: theme.mutedForeground }]}>
                {location.city}
              </Text>
            </View>
          ) : undefined
        }
        showMenu={user?.role === 'artisan'}
        onMenuPress={() => setSelectorVisible(true)}
        showNotifDot={hasUnread}
        onNotifPress={() => router.push('/(client)/notifications')}
      />

      {/* ── Barre de recherche (filtre en place) ──────────────────────── */}
      <View style={styles.searchPad}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Search size={ds.size.icon.md} color={theme.mutedForeground} />
          <TextInput
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder={t('client.home.search.placeholder')}
            placeholderTextColor={theme.mutedForeground}
            style={[styles.searchInput, { color: theme.foreground }]}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 ? (
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

      {/* ── Chips métier (filtre en place) ────────────────────────────── */}
      <ScrollView
        style={styles.chipsScroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {CATEGORY_CHIPS.map(({ metier, Icon }) => {
          const isActive = activeMetier === metier
          return (
            <Pressable
              key={metier}
              onPress={() => handleChipPress(metier)}
              style={[
                styles.chip,
                isActive
                  ? { backgroundColor: theme.primary, borderColor: theme.primary }
                  : { backgroundColor: theme.errorMuted, borderColor: theme.errorMuted },
              ]}
            >
              <Icon size={ds.size.icon.sm} color={isActive ? '#fff' : theme.primary} />
              <Text style={[styles.chipLabel, { color: isActive ? '#fff' : theme.primary }]}>
                {translateDynamic(`metier.${metier}`)}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* ── Ligne titre + filtres avancés + toggle ───────────────────── */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
          {nearbyLabel}
        </Text>
        <View style={styles.sectionActions}>
          <Pressable
            onPress={handleOpenAdvancedFilters}
            style={[styles.filtersBtn, { backgroundColor: theme.muted }]}
            accessibilityRole="button"
            accessibilityLabel={t('client.home.filters.button')}
          >
            <SlidersHorizontal size={ds.size.icon.sm} color={theme.foreground} />
            <Text style={[styles.filtersBtnLabel, { color: theme.foreground }]}>
              {t('client.home.filters.button')}
            </Text>
          </Pressable>
          <View style={[styles.toggleGroup, { backgroundColor: theme.muted }]}>
            <Pressable
              style={[styles.toggleBtn, showMap && { backgroundColor: theme.primary }]}
              onPress={() => setShowMap(true)}
            >
              <MapPin size={ds.size.icon.sm} color={showMap ? '#fff' : theme.mutedForeground} />
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, !showMap && { backgroundColor: theme.primary }]}
              onPress={() => setShowMap(false)}
            >
              <List size={ds.size.icon.sm} color={!showMap ? '#fff' : theme.mutedForeground} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* ── Carte Leaflet ou Liste ────────────────────────────────────── */}
      {showMap ? (
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            style={styles.map}
            source={{ html: mapHtml }}
            originWhitelist={['*']}
            javaScriptEnabled
            onMessage={handleWebViewMessage}
            scrollEnabled={false}
          />
          <Pressable
            onPress={handleRecenter}
            style={[styles.recenterBtn, { backgroundColor: theme.card }]}
            accessibilityRole="button"
            accessibilityLabel={t('client.home.map.recenter')}
          >
            <LocateFixed size={ds.size.icon.md} color={theme.primary} />
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={artisans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ArtisanCard
              artisan={item}
              distanceKm={item.distanceKm}
              onPress={() =>
                router.push({ pathname: '/(client)/artisan/[id]', params: { id: item.id } })
              }
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshing={isRefreshing}
          onRefresh={() => void loadArtisans(searchQueryRef.current, activeMetier)}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}

      {user?.role === 'artisan' ? (
        <Selector
          visible={selectorVisible}
          onClose={() => setSelectorVisible(false)}
          options={selectorOptions}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { ...ds.text.label },
  searchPad: {
    paddingHorizontal: ds.size.paddingH,
    marginTop: ds.space[4],
    marginBottom: ds.space[3],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
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
  chipsScroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 44,
    marginBottom: ds.space[3],
  },
  chips: {
    paddingHorizontal: ds.size.paddingH,
    gap: ds.space[3],
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[2],
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[2],
    borderRadius: ds.radius.avatar,
    borderWidth: 1,
    height: 38,
  },
  chipLabel: { ...ds.text.label, fontWeight: '600' },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ds.size.paddingH,
    marginBottom: ds.space[3],
  },
  sectionTitle: { ...ds.text.h3, fontSize: 17, flex: 1, marginRight: ds.space[2] },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[2],
  },
  filtersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[1],
    height: 36,
    paddingHorizontal: ds.space[3],
    borderRadius: ds.radius.sm,
  },
  filtersBtnLabel: { ...ds.text.label, fontWeight: '600' },
  toggleGroup: {
    flexDirection: 'row',
    borderRadius: ds.radius.sm,
    overflow: 'hidden',
    gap: 2,
    padding: 2,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: ds.radius.sm - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  recenterBtn: {
    position: 'absolute',
    bottom: ds.space[5],
    right: ds.space[4],
    width: 44,
    height: 44,
    borderRadius: ds.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  list: { paddingHorizontal: ds.size.paddingH, paddingBottom: ds.space[6] },
  sep: { height: ds.space[3] },
})
