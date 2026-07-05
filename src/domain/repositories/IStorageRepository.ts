export interface UploadResult {
  url: string
  path: string
}

export interface IStorageRepository {
  uploadArtisanPhoto(artisanId: string, fileUri: string): Promise<UploadResult>
  uploadArtisanAvatar(artisanId: string, fileUri: string): Promise<UploadResult>
  uploadArtisanBanner(artisanId: string, fileUri: string): Promise<UploadResult>
  deleteArtisanPhoto(path: string): Promise<void>
  uploadUserAvatar(userId: string, fileUri: string): Promise<UploadResult>
}
