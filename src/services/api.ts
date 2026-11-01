import {
  Booking,
  BookingStatus,
  CLINIC_SERVICES,
  CLINIC_STAFF,
  CLINIC_TIME_SLOTS,
  DayAvailabilitySummary,
  Service,
  ServiceId,
  Staff,
  TimeSlot,
} from '../types/clinic.ts';
import { ClientClinicDB } from '../utils/clientDb.ts';

const API_BASE = '/api';

/**
 * Safely executes a fetch request. If the endpoint responds with HTML (such as
 * static SPA rewrite on Vercel / GitHub Pages) or is unreachable, returns null
 * without throwing JSON parsing exceptions like WebKit's "The string did not match the expected pattern".
 */
async function safeFetchJson<T = any>(
  input: string,
  init?: RequestInit
): Promise<{ ok: boolean; data?: T; error?: string } | null> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get('content-type') || '';

    // If server responded with HTML (e.g. static hosting SPA fallback), don't parse JSON
    if (contentType.includes('text/html')) {
      return null;
    }

    if (!contentType.includes('application/json')) {
      return null;
    }

    const json = await res.json();
    return { ok: res.ok, data: json?.data ?? json, error: json?.error };
  } catch {
    return null;
  }
}

export const ClinicApi = {
  // Staff
  async getStaff(): Promise<Staff[]> {
    const res = await safeFetchJson<Staff[]>(`${API_BASE}/staff`);
    if (res?.ok && Array.isArray(res.data)) {
      return res.data;
    }
    return CLINIC_STAFF;
  },

  // Services
  async getServices(): Promise<Service[]> {
    const res = await safeFetchJson<Service[]>(`${API_BASE}/services`);
    if (res?.ok && Array.isArray(res.data)) {
      return res.data;
    }
    return CLINIC_SERVICES;
  },

  // Time Slots
  async getTimeSlots(): Promise<TimeSlot[]> {
    const res = await safeFetchJson<TimeSlot[]>(`${API_BASE}/time-slots`);
    if (res?.ok && Array.isArray(res.data)) {
      return res.data;
    }
    return CLINIC_TIME_SLOTS;
  },

  // Month overview
  async getMonthAvailability(yearMonth: string, serviceId?: ServiceId): Promise<Record<string, any>> {
    const path = `${API_BASE}/calendar/month?month=${encodeURIComponent(yearMonth)}${
      serviceId ? `&serviceId=${encodeURIComponent(serviceId)}` : ''
    }`;
    const res = await safeFetchJson<Record<string, any>>(path);
    if (res?.ok && res.data && typeof res.data === 'object') {
      return res.data;
    }
    return ClientClinicDB.getMonthAvailability(yearMonth, serviceId);
  },

  // Day details
  async getDayDetails(date: string): Promise<any> {
    const path = `${API_BASE}/calendar/day?date=${encodeURIComponent(date)}`;
    const res = await safeFetchJson<any>(path);
    if (res?.ok && res.data) {
      return res.data;
    }
    return ClientClinicDB.getDayDetails(date);
  },

  // Daily Postpartum Status (Max 2 cases per person per day)
  async getPostpartumStatus(date: string): Promise<any> {
    const path = `${API_BASE}/postpartum/status?date=${encodeURIComponent(date)}`;
    const res = await safeFetchJson<any>(path);
    if (res?.ok && res.data) {
      return res.data;
    }
    return ClientClinicDB.getDailyPostpartumStatus(date);
  },

  // Daily Herbal Sauna Status (Max 3 cases per day clinic-wide)
  async getSaunaDailyStatus(date: string): Promise<any> {
    const path = `${API_BASE}/sauna/status?date=${encodeURIComponent(date)}`;
    const res = await safeFetchJson<any>(path);
    if (res?.ok && res.data) {
      return res.data;
    }
    return ClientClinicDB.getDailySaunaStatus(date);
  },

  // Staff Availability for a specific slot and service
  async getStaffAvailability(
    serviceId: ServiceId,
    date: string,
    time: string,
    durationHours: number = 1
  ): Promise<any[]> {
    const path = `${API_BASE}/staff/availability?serviceId=${encodeURIComponent(
      serviceId
    )}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}&durationHours=${durationHours}`;
    const res = await safeFetchJson<any[]>(path);
    if (res?.ok && Array.isArray(res.data)) {
      return res.data;
    }
    return ClientClinicDB.getStaffAvailability(serviceId, date, time, durationHours);
  },

  // Bookings list
  async getBookings(phone?: string): Promise<Booking[]> {
    const path = phone
      ? `${API_BASE}/bookings?phone=${encodeURIComponent(phone)}`
      : `${API_BASE}/bookings`;
    const res = await safeFetchJson<Booking[]>(path);
    if (res?.ok && Array.isArray(res.data)) {
      return res.data;
    }
    return phone ? ClientClinicDB.findBookingsByPhone(phone) : ClientClinicDB.getAllBookings();
  },

  // Create Booking
  async createBooking(payload: {
    patientName: string;
    patientPhone: string;
    patientIdCard?: string;
    symptoms: string;
    serviceId: ServiceId;
    date: string;
    timeSlot: string;
    durationHours?: number;
    notes?: string;
    requestedStaffId?: string;
  }): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const res = await safeFetchJson<any>(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res !== null) {
      if (res.ok && res.data) {
        // Also save to client DB for offline consistency
        if (res.data.booking) {
          ClientClinicDB.createBooking(payload);
        }
        return res.data;
      }
      return { success: false, error: res.error || 'ไม่สามารถทำการนัดหมายได้' };
    }

    // Fallback to client DB
    return ClientClinicDB.createBooking(payload);
  },

  // Update Status
  async updateBookingStatus(
    id: string,
    status?: BookingStatus,
    assignedStaffId?: string,
    notes?: string,
    queueStatus?: 'waiting' | 'called' | 'in_service' | 'completed'
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const res = await safeFetchJson<any>(`${API_BASE}/bookings/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, assignedStaffId, notes, queueStatus }),
    });

    if (res !== null) {
      if (res.ok && res.data) {
        ClientClinicDB.updateBookingStatus(id, status, assignedStaffId, notes, queueStatus);
        return res.data;
      }
      return { success: false, error: res.error || 'ไม่สามารถอัปเดตสถานะได้' };
    }

    // Fallback to client DB
    return ClientClinicDB.updateBookingStatus(id, status, assignedStaffId, notes, queueStatus);
  },

  // Call Patient Queue
  async callQueue(id: string): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const res = await safeFetchJson<any>(`${API_BASE}/bookings/${id}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res !== null) {
      if (res.ok && res.data) {
        ClientClinicDB.callBookingQueue(id);
        return res.data;
      }
      return { success: false, error: res.error || 'ไม่สามารถเรียกคิวได้' };
    }

    return ClientClinicDB.callBookingQueue(id);
  },

  // Bulk Confirm Sauna Group
  async confirmSaunaGroup(
    date: string,
    timeSlot: string
  ): Promise<{ success: boolean; updatedCount: number; error?: string }> {
    const res = await safeFetchJson<any>(`${API_BASE}/bookings/sauna/confirm-group`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, timeSlot }),
    });

    if (res !== null) {
      if (res.ok && res.data) {
        ClientClinicDB.confirmSaunaGroup(date, timeSlot);
        return res.data;
      }
      return { success: false, updatedCount: 0, error: res.error || 'ไม่สามารถยืนยันรอบอบได้' };
    }

    return ClientClinicDB.confirmSaunaGroup(date, timeSlot);
  },

  // Staff Login
  async login(
    username: string,
    password: string
  ): Promise<{ success: boolean; token?: string; user?: any; error?: string }> {
    const res = await safeFetchJson<any>(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res !== null) {
      if (res.ok && res.data?.success) {
        return res.data;
      }
      if (res.data?.error) {
        return { success: false, error: res.data.error };
      }
    }

    // Fallback directly to client-side auth
    return ClientClinicDB.login(username, password);
  },
};
