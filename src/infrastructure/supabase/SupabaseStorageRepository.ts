import type { SupabaseClient } from '@supabase/supabase-js'
import type { IStorageRepository, UploadResult } from '@/domain/repositories/IStorageRepository'
import { AppLogger } from '@/shared/logger/AppLogger'
import { NetworkError, StorageUploadError } from '@/shared/errors'

const ARTISAN_PHOTOS_BUCKET = 'artisan-photos'
const USER_AVATARS_BUCKET = 'user-avatars'

export class SupabaseStorageRepository implements IStorageRepository {
  constructor(private readonly client: SupabaseClient) {}

  async uploadArtisanPhoto(artisanId: string, fileUri: string): Promise<UploadResult> {
    const path = `${artisanId}/portfolio/${Date.now()}.jpg`
    return this.upload(path, fileUri, false)
  }

  async uploadArtisanAvatar(artisanId: string, fileUri: string): Promise<UploadResult> {
    const path = `${artisanId}/avatar.jpg`
    return this.upload(path, fileUri, true)
  }

  async uploadArtisanBanner(artisanId: string, fileUri: string): Promise<UploadResult> {
    const path = `${artisanId}/banner.jpg`
    return this.upload(path, fileUri, true)
  }

  async uploadUserAvatar(userId: string, fileUri: string): Promise<UploadResult> {
    const path = `${userId}/avatar.jpg`
    const response = await fetch(fileUri)
    const arrayBuffer = await response.arrayBuffer()

    const { error } = await this.client.storage
      .from(USER_AVATARS_BUCKET)
      .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true })

    if (error) {
      AppLogger.error(error)
      if ('status' in error) throw new StorageUploadError()
      throw new NetworkError()
    }

    const { data: urlData } = this.client.storage
      .from(USER_AVATARS_BUCKET)
      .getPublicUrl(path)

    return { url: urlData.publicUrl, path }
  }

  async deleteArtisanPhoto(path: string): Promise<void> {
    const { error } = await this.client.storage
      .from(ARTISAN_PHOTOS_BUCKET)
      .remove([path])

    if (error) {
      AppLogger.error(error)
      if ('status' in error) throw new StorageUploadError()
      throw new NetworkError()
    }
  }

  private async upload(path: string, fileUri: string, upsert: boolean): Promise<UploadResult> {
    // ArrayBuffer est plus fiable que Blob sur Android/Hermes
    // (les Blobs natifs ne se ré-envoient pas correctement dans le fetch interne de supabase-js)
    const response = await fetch(fileUri)
    const arrayBuffer = await response.arrayBuffer()

    const { error } = await this.client.storage
      .from(ARTISAN_PHOTOS_BUCKET)
      .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert })

    if (error) {
      AppLogger.error(error)
      // StorageApiError (HTTP 4xx) = erreur serveur (RLS, bucket manquant…) ≠ erreur réseau
      if ('status' in error) throw new StorageUploadError()
      throw new NetworkError()
    }

    const { data: urlData } = this.client.storage
      .from(ARTISAN_PHOTOS_BUCKET)
      .getPublicUrl(path)

    return { url: urlData.publicUrl, path }
  }
}
