import { ImageBackground, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { Avatar, BackButton } from '@/presentation/components/ui'
import type { Artisan } from '@/domain/entities/Artisan'

const HERO_H = 160
const AVATAR_SIZE = ds.size.avatar.lg + 16

interface Props {
  artisan: Artisan
}

export function ArtisanProfileHero({ artisan }: Props): React.JSX.Element {
  const theme = useTheme()

  const backBtn = (
    <View style={styles.backBtnWrap}>
      <BackButton bg="rgba(255,255,255,0.2)" iconColor={theme.primaryForeground} />
    </View>
  )

  return (
    <>
      {artisan.bannerUrl ? (
        <ImageBackground
          source={{ uri: artisan.bannerUrl }}
          style={[styles.hero, { backgroundColor: theme.primary }]}
          resizeMode="cover"
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.25)' }]} />
          <SafeAreaView edges={['top']}>{backBtn}</SafeAreaView>
        </ImageBackground>
      ) : (
        <View style={[styles.hero, { backgroundColor: theme.primary }]}>
          <SafeAreaView edges={['top']}>{backBtn}</SafeAreaView>
        </View>
      )}

      <View style={[styles.avatarWrap]}>
        <Avatar
          name={artisan.fullName}
          size="lg"
          {...(artisan.avatarUrl !== undefined && { uri: artisan.avatarUrl })}
        />
      </View>
    </>
  )
}

export const HERO_AVATAR_SIZE = AVATAR_SIZE

const styles = StyleSheet.create({
  hero: { height: HERO_H },
  backBtnWrap: { margin: ds.space[4] },
  avatarWrap: {
    position: 'absolute',
    top: HERO_H - AVATAR_SIZE / 2,
    alignSelf: 'center',
    zIndex: 10,
    borderRadius: ds.radius.avatar,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
})
