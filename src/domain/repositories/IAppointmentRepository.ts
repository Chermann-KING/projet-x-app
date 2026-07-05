import type { Appointment, AppointmentStatus } from '../entities/Appointment'

export interface IAppointmentRepository {
  findById(id: string): Promise<Appointment | null>
  findByArtisanId(artisanId: string): Promise<Appointment[]>
  findByClientId(clientId: string): Promise<Appointment[]>
  create(data: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment>
  updateStatus(id: string, status: AppointmentStatus): Promise<void>
}
