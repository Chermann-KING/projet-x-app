import { Pressable } from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useTranslation } from '@/i18n'
import { IconBox } from './IconBox'

interface Props {
  onPress?: () => void
  /** Surcharge la couleur d'arrière-plan (ex: overlay semi-transparent sur image) */
  bg?: string
  /** Surcharge la couleur de l'icône */
  iconColor?: string
}

export function BackButton({ onPress, bg, iconColor }: Props): React.JSX.Element {
  const theme = useTheme()
  const { t } = useTranslation()

  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      accessibilityRole="button"
      accessibilityLabel={t('common.button.back')}
      hitSlop={8}
    >
      <IconBox bg={bg ?? theme.muted} size={40}>
        <ArrowLeft size={ds.size.icon.md} color={iconColor ?? theme.foreground} />
      </IconBox>
    </Pressable>
  )
}
