import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'

const MAX_DIMENSION = 1200
const JPEG_QUALITY = 0.82

/**
 * Redimensionne l'image si son grand côté dépasse MAX_DIMENSION,
 * puis applique une compression JPEG. Appelé juste avant l'upload.
 *
 * Préserve le ratio original (portrait ou paysage) sans crop forcé.
 */
export async function compressImageForUpload(
  uri: string,
  originalWidth: number,
  originalHeight: number,
): Promise<string> {
  const longestSide = Math.max(originalWidth, originalHeight)

  let ctx = ImageManipulator.manipulate(uri)

  if (longestSide > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / longestSide
    ctx = ctx.resize({
      width: Math.round(originalWidth * scale),
      height: Math.round(originalHeight * scale),
    })
  }

  const imageRef = await ctx.renderAsync()
  const result = await imageRef.saveAsync({
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
  })

  return result.uri
}
