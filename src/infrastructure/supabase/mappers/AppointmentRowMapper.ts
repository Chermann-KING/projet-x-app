import type { Appointment, AppointmentStatus } from '@/domain/entities/Appointment'

export interface AppointmentRow {
  id: string
  quote_id: string
  client_id: string
  artisan_id: string
  scheduled_at: string
  duration_minutes?: number | null
  status: AppointmentStatus
  created_at: string
}

export function mapAppointmentRow(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    quoteId: row.quote_id,
    clientId: row.client_id,
    artisanId: row.artisan_id,
    scheduledAt: new Date(row.scheduled_at),
    ...(row.duration_minutes != null ? { durationMinutes: row.duration_minutes } : {}),
    status: row.status,
    createdAt: new Date(row.created_at),
  }
}
