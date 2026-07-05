import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Star } from 'lucide-react-native'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'

const STAR_COUNT = 5

interface StarRatingProps {
  rating: number
  reviewCount?: number
  interactive?: boolean
  size?: number
  onRatingChange?: (rating: number) => void
}

export function StarRating({
  rating,
  reviewCount,
  interactive = false,
  size = ds.size.icon.md,
  onRatingChange,
}: StarRatingProps) {
  const theme = useTheme()
  const starFilled = theme.warning
  const starEmpty = theme.muted

  const stars = Array.from({ length: STAR_COUNT }, (_, i) => i + 1)

  return (
    <View style={styles.container}>
      {stars.map((star) => {
        const filled = star <= Math.round(rating)
        const element = (
          <Star
            key={star}
            size={size}
            color={filled ? starFilled : starEmpty}
            fill={filled ? starFilled : 'transparent'}
          />
        )

        return interactive && onRatingChange ? (
          <Pressable
            key={star}
            onPress={() => onRatingChange(star)}
            hitSlop={ds.space[1] + 2}
            accessibilityRole="button"
            accessibilityLabel={`${star} étoile${star > 1 ? 's' : ''}`}
          >
            {element}
          </Pressable>
        ) : (
          element
        )
      })}

      {reviewCount !== undefined ? (
        <>
          <Text style={[styles.count, { color: theme.foreground }]}>
            {rating.toFixed(1)}
          </Text>
          <Text style={[styles.reviewCount, { color: theme.mutedForeground }]}>
            ({reviewCount})
          </Text>
        </>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[1] / 2, // 2
  },
  count: {
    ...ds.text.label,
    fontWeight: '500',
    marginLeft: ds.space[1] / 2,
  },
  reviewCount: {
    ...ds.text.label,
  },
})
