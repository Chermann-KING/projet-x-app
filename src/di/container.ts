import { supabase } from '@/infrastructure/supabase/client'
import { SupabaseAuthRepository } from '@/infrastructure/supabase/SupabaseAuthRepository'
import { SupabaseUserRepository } from '@/infrastructure/supabase/SupabaseUserRepository'
import { SupabaseArtisanRepository } from '@/infrastructure/supabase/SupabaseArtisanRepository'
import { SupabaseQuoteRepository } from '@/infrastructure/supabase/SupabaseQuoteRepository'
import { SupabaseMessageRepository } from '@/infrastructure/supabase/SupabaseMessageRepository'
import { SupabaseReviewRepository } from '@/infrastructure/supabase/SupabaseReviewRepository'
import { SupabaseAppointmentRepository } from '@/infrastructure/supabase/SupabaseAppointmentRepository'
import { SupabaseAvailabilityRepository } from '@/infrastructure/supabase/SupabaseAvailabilityRepository'
import { SupabaseStorageRepository } from '@/infrastructure/supabase/SupabaseStorageRepository'
import { ExpoPushNotificationService } from '@/infrastructure/notifications/ExpoPushNotificationService'
import { LoginUseCase } from '@/application/auth/LoginUseCase'
import { RegisterUseCase } from '@/application/auth/RegisterUseCase'
import { ForgotPasswordUseCase } from '@/application/auth/ForgotPasswordUseCase'
import { VerifyRecoveryOtpUseCase } from '@/application/auth/VerifyRecoveryOtpUseCase'
import { UpdatePasswordUseCase } from '@/application/auth/UpdatePasswordUseCase'
import { LogoutUseCase } from '@/application/auth/LogoutUseCase'
import { GetCurrentUserUseCase } from '@/application/auth/GetCurrentUserUseCase'
import { SearchArtisansUseCase } from '@/application/artisan/SearchArtisansUseCase'
import { GetArtisanProfileUseCase } from '@/application/artisan/GetArtisanProfileUseCase'
import { RequestQuoteUseCase } from '@/application/client/RequestQuoteUseCase'
import { GetClientRequestsUseCase } from '@/application/client/GetClientRequestsUseCase'
import { GetClientRequestByIdUseCase } from '@/application/client/GetClientRequestByIdUseCase'
import { GetClientReviewStatsUseCase } from '@/application/client/GetClientReviewStatsUseCase'
import { AcceptQuoteUseCase } from '@/application/client/AcceptQuoteUseCase'
import { RefuseQuoteUseCase } from '@/application/client/RefuseQuoteUseCase'
import { SendMessageUseCase } from '@/application/client/SendMessageUseCase'
import { GetConversationMessagesUseCase } from '@/application/client/GetConversationMessagesUseCase'
import { SubscribeToConversationUseCase } from '@/application/client/SubscribeToConversationUseCase'
import { LeaveReviewUseCase } from '@/application/client/LeaveReviewUseCase'
import { UpdateUserUseCase } from '@/application/user/UpdateUserUseCase'
import { CheckAvailabilityUseCase } from '@/application/availability/CheckAvailabilityUseCase'
import { UpdateArtisanProfileUseCase } from '@/application/artisan/UpdateArtisanProfileUseCase'
import { AddArtisanPhotoUseCase } from '@/application/artisan/AddArtisanPhotoUseCase'
import { DeleteArtisanPhotoUseCase } from '@/application/artisan/DeleteArtisanPhotoUseCase'
import { UpdateArtisanAvatarUseCase } from '@/application/artisan/UpdateArtisanAvatarUseCase'
import { UpdateArtisanBannerUseCase } from '@/application/artisan/UpdateArtisanBannerUseCase'
import { UpdateUserAvatarUseCase } from '@/application/user/UpdateUserAvatarUseCase'
import { GetPendingArtisansUseCase } from '@/application/admin/GetPendingArtisansUseCase'
import { GetActiveArtisansUseCase } from '@/application/admin/GetActiveArtisansUseCase'
import { ApproveArtisanUseCase } from '@/application/admin/ApproveArtisanUseCase'
import { SuspendArtisanUseCase } from '@/application/admin/SuspendArtisanUseCase'
import { GetArtisanConversationsUseCase } from '@/application/messaging/GetArtisanConversationsUseCase'
import { GetArtisanReviewsUseCase } from '@/application/review/GetArtisanReviewsUseCase'
import { RespondToQuoteUseCase } from '@/application/quote/RespondToQuoteUseCase'
import { MarkQuoteDoneUseCase } from '@/application/quote/MarkQuoteDoneUseCase'
import { SupabaseReportRepository } from '@/infrastructure/supabase/SupabaseReportRepository'
import { GetReportsUseCase } from '@/application/admin/GetReportsUseCase'
import { MarkReportTreatedUseCase } from '@/application/admin/MarkReportTreatedUseCase'
import { GetPendingReportCountUseCase } from '@/application/admin/GetPendingReportCountUseCase'
import { GetNotificationsUseCase } from '@/application/notification/GetNotificationsUseCase'
import { MarkNotificationsReadUseCase } from '@/application/notification/MarkNotificationsReadUseCase'
import { GetUnreadCountUseCase } from '@/application/notification/GetUnreadCountUseCase'
import { GetArtisanDashboardUseCase } from '@/application/artisan/GetArtisanDashboardUseCase'
import { GetArtisanAgendaUseCase } from '@/application/artisan/GetArtisanAgendaUseCase'
import { GetArtisanQuotesUseCase } from '@/application/artisan/GetArtisanQuotesUseCase'
import { GetQuoteWithClientUseCase } from '@/application/artisan/GetQuoteWithClientUseCase'
import { GetArtisanByUserIdUseCase } from '@/application/artisan/GetArtisanByUserIdUseCase'
import { CreateArtisanProfileUseCase } from '@/application/artisan/CreateArtisanProfileUseCase'
import { DeclineQuoteRequestUseCase } from '@/application/artisan/DeclineQuoteRequestUseCase'

// ── Repositories ──────────────────────────────────────────────────────────────
const authRepository = new SupabaseAuthRepository(supabase)
const userRepository = new SupabaseUserRepository(supabase)
const artisanRepository = new SupabaseArtisanRepository(supabase)
const quoteRepository = new SupabaseQuoteRepository(supabase)
const messageRepository = new SupabaseMessageRepository(supabase)
const reviewRepository = new SupabaseReviewRepository(supabase)
const appointmentRepository = new SupabaseAppointmentRepository(supabase)
const availabilityRepository = new SupabaseAvailabilityRepository(supabase)
export const notificationService = new ExpoPushNotificationService(supabase)
const storageRepository = new SupabaseStorageRepository(supabase)
const reportRepository = new SupabaseReportRepository(supabase)

// ── Use Cases — Auth ──────────────────────────────────────────────────────────
export const login = new LoginUseCase(authRepository)
export const register = new RegisterUseCase(authRepository)
export const forgotPassword = new ForgotPasswordUseCase(authRepository)
export const verifyRecoveryOtp = new VerifyRecoveryOtpUseCase(authRepository)
export const updatePassword = new UpdatePasswordUseCase(authRepository)
export const logout = new LogoutUseCase(authRepository)
export const getCurrentUser = new GetCurrentUserUseCase(authRepository)

// ── Use Cases — Artisan ───────────────────────────────────────────────────────
export const searchArtisans = new SearchArtisansUseCase(artisanRepository)
export const getArtisanProfile = new GetArtisanProfileUseCase(artisanRepository)
export const updateArtisanProfile = new UpdateArtisanProfileUseCase(artisanRepository)
export const addArtisanPhoto = new AddArtisanPhotoUseCase(artisanRepository, storageRepository)
export const deleteArtisanPhoto = new DeleteArtisanPhotoUseCase(artisanRepository, storageRepository)
export const updateArtisanAvatar = new UpdateArtisanAvatarUseCase(artisanRepository, storageRepository, authRepository)
export const updateArtisanBanner = new UpdateArtisanBannerUseCase(artisanRepository, storageRepository)
export const updateUserAvatar = new UpdateUserAvatarUseCase(authRepository, storageRepository)

// ── Use Cases — Client ────────────────────────────────────────────────────────
export const requestQuote = new RequestQuoteUseCase(quoteRepository, artisanRepository, notificationService)
export const getClientRequests = new GetClientRequestsUseCase(quoteRepository, artisanRepository)
export const getClientRequestById = new GetClientRequestByIdUseCase(quoteRepository, artisanRepository)
export const getClientReviewStats = new GetClientReviewStatsUseCase(reviewRepository)
export const acceptQuote = new AcceptQuoteUseCase(quoteRepository)
export const refuseQuote = new RefuseQuoteUseCase(quoteRepository)
export const sendMessage = new SendMessageUseCase(messageRepository, notificationService)
export const getConversationMessages = new GetConversationMessagesUseCase(messageRepository)
export const subscribeToConversation = new SubscribeToConversationUseCase(messageRepository)
export const leaveReview = new LeaveReviewUseCase(reviewRepository, appointmentRepository)
export const updateUser = new UpdateUserUseCase(userRepository)
export const checkAvailability = new CheckAvailabilityUseCase(availabilityRepository)

// ── Use Cases — Admin ─────────────────────────────────────────────────────────
export const getPendingArtisans = new GetPendingArtisansUseCase(artisanRepository)
export const getActiveArtisans = new GetActiveArtisansUseCase(artisanRepository)
export const approveArtisan = new ApproveArtisanUseCase(artisanRepository)
export const suspendArtisan = new SuspendArtisanUseCase(artisanRepository)
export const getReports = new GetReportsUseCase(reportRepository)
export const markReportTreated = new MarkReportTreatedUseCase(reportRepository)
export const getPendingReportCount = new GetPendingReportCountUseCase(reportRepository)

// ── Use Cases — Messaging ─────────────────────────────────────────────────────
export const getArtisanConversations = new GetArtisanConversationsUseCase(messageRepository, quoteRepository)

// ── Use Cases — Review ────────────────────────────────────────────────────────
export const getArtisanReviews = new GetArtisanReviewsUseCase(reviewRepository)

// ── Use Cases — Quote (artisan) ───────────────────────────────────────────────
export const respondToQuote = new RespondToQuoteUseCase(quoteRepository, notificationService)
export const markQuoteDone = new MarkQuoteDoneUseCase(quoteRepository, notificationService)

// ── Use Cases — Notifications ─────────────────────────────────────────────────
export const getNotifications = new GetNotificationsUseCase(notificationService)
export const markNotificationsRead = new MarkNotificationsReadUseCase(notificationService)
export const getUnreadCount = new GetUnreadCountUseCase(notificationService)

// ── Use Cases — Artisan (dashboard / agenda / profil) ────────────────────────
export const getArtisanDashboard = new GetArtisanDashboardUseCase(
  artisanRepository,
  quoteRepository,
  appointmentRepository,
  userRepository,
)
export const getArtisanAgenda = new GetArtisanAgendaUseCase(
  artisanRepository,
  quoteRepository,
  appointmentRepository,
  userRepository,
)
export const getArtisanQuotes = new GetArtisanQuotesUseCase(
  artisanRepository,
  quoteRepository,
  userRepository,
)
export const getQuoteWithClient = new GetQuoteWithClientUseCase(quoteRepository, userRepository)
export const getArtisanByUserId = new GetArtisanByUserIdUseCase(artisanRepository)
export const createArtisanProfile = new CreateArtisanProfileUseCase(artisanRepository)
export const declineQuoteRequest = new DeclineQuoteRequestUseCase(quoteRepository)
