import { useEffect, useState } from 'react'
import { Dimensions, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native'
import type { ArtisanPhoto } from '@/domain/entities/Artisan'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

interface PhotoViewerProps {
  photos: ArtisanPhoto[]
  initialIndex: number
  visible: boolean
  onClose: () => void
}

export function PhotoViewer({ photos, initialIndex, visible, onClose }: PhotoViewerProps): React.JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    if (visible) setCurrentIndex(initialIndex)
  }, [visible, initialIndex])

  const photo = photos[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < photos.length - 1

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Fermer */}
        <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
          <X size={24} color="#fff" />
        </Pressable>

        {/* Compteur */}
        {photos.length > 1 && (
          <Text style={styles.counter}>{currentIndex + 1} / {photos.length}</Text>
        )}

        {/* Image principale */}
        {photo ? (
          <Image source={{ uri: photo.url }} style={styles.image} resizeMode="contain" />
        ) : null}

        {/* Caption */}
        {photo?.caption ? (
          <View style={styles.captionBar}>
            <Text style={styles.captionText} numberOfLines={2}>{photo.caption}</Text>
          </View>
        ) : null}

        {/* Navigation précédent */}
        {hasPrev && (
          <Pressable
            onPress={() => setCurrentIndex((i) => i - 1)}
            style={[styles.navBtn, styles.navLeft]}
            accessibilityRole="button"
            hitSlop={16}
          >
            <ChevronLeft size={32} color="#fff" />
          </Pressable>
        )}

        {/* Navigation suivant */}
        {hasNext && (
          <Pressable
            onPress={() => setCurrentIndex((i) => i + 1)}
            style={[styles.navBtn, styles.navRight]}
            accessibilityRole="button"
            hitSlop={16}
          >
            <ChevronRight size={32} color="#fff" />
          </Pressable>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  counter: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H * 0.75,
  },
  captionBar: {
    position: 'absolute',
    bottom: 80,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  captionText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    textAlign: 'center',
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    padding: 12,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  navLeft: { left: 12 },
  navRight: { right: 12 },
})
