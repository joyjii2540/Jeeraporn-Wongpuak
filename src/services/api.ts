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
} from '../types/clinic';

const API_BASE = '/api';

export const ClinicApi = {
  // Staff
  async getStaff(): Promise<Staff[]> {
    try {
      const res = await fetch(`${API_BASE}/staff`);
      const data = await res.json();
      return data.success ? data.data : CLINIC_STAFF;
    } catch {
      return CLINIC_STAFF;
    }
  },

  // Services
  async getServices(): Promise<Service[]> {
    try {
      const res = await fetch(`${API_BASE}/services`);
      const data = await res.json();
      return data.success ? data.data : CLINIC_SERVICES;
    } catch {
      return CLINIC_SERVICES;
    }
  },

  // Time Slots
  async getTimeSlots(): Promise<TimeSlot[]> {
    try {
      const res = await fetch(`${API_BASE}/time-slots`);
      const data = await res.json();
      return data.success ? data.data : CLINIC_TIME_SLOTS;
    } catch {
      return CLINIC_TIME_SLOTS;
    }
  },

  // Month overview
  async getMonthAvailability(yearMonth: string, serviceId?: ServiceId): Promise<Record<string, any>> {
    const url = new URL(`${API_BASE}/calendar/month`, window.location.origin);
    url.searchParams.set('month', yearMonth);
    if (serviceId) url.searchParams.set('serviceId', serviceId);

    const res = await fetch(url.toString());
    const data = await res.json();
    return data.data || {};
  },

  // Day details
  async getDayDetails(date: string): Promise<any> {
    const res = await fetch(`${API_BASE}/calendar/day?date=${date}`);
    const data = await res.json();
    return data.data;
  },

  // Daily Postpartum Status (Max 2 cases per person per day)
  async getPostpartumStatus(date: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/postpartum/status?date=${date}`);
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },

  // Daily Herbal Sauna Status (Max 3 cases per day clinic-wide)
  async getSaunaDailyStatus(date: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/sauna/status?date=${date}`);
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },

  // Staff Availability for a specific slot and service
  async getStaffAvailability(
    serviceId: ServiceId,
    date: string,
    time: string,
    durationHours: number = 1
  ): Promise<any[]> {
    try {
      const url = new URL(`${API_BASE}/staff/availability`, window.location.origin);
      url.searchParams.set('serviceId', serviceId);
      url.searchParams.set('date', date);
      url.searchParams.set('time', time);
      url.searchParams.set('durationHours', String(durationHours));
      const res = await fetch(url.toString());
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  // Bookings list
  async getBookings(phone?: string): Promise<Booking[]> {
    const url = new URL(`${API_BASE}/bookings`, window.location.origin);
    if (phone) url.searchParams.set('phone', phone);
    const res = await fetch(url.toString());
    const data = await res.json();
    return data.data || [];
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
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  // Update Status
  async updateBookingStatus(
    id: string,
    status?: BookingStatus,
    assignedStaffId?: string,
    notes?: string,
    queueStatus?: 'waiting' | 'called' | 'in_service' | 'completed'
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, assignedStaffId, notes, queueStatus }),
    });
    return await res.json();
  },

  // Call Patient Queue
  async callQueue(id: string): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const res = await fetch(`${API_BASE}/bookings/${id}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  },

  // Bulk Confirm Sauna Group
  async confirmSaunaGroup(
    date: string,
    timeSlot: string
  ): Promise<{ success: boolean; updatedCount: number; error?: string }> {
    const res = await fetch(`${API_BASE}/bookings/sauna/confirm-group`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, timeSlot }),
    });
    return await res.json();
  },

  // Staff Login
  async login(username: string, password: string): Promise<{ success: boolean; token?: string; user?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return await res.json();
  },
};
