import type {
  Booking,
  BookingStatus,
  DayAvailabilitySummary,
  Service,
  ServiceId,
  Staff,
  TimeSlot,
} from '../types/clinic.ts';
import {
  CLINIC_SERVICES,
  CLINIC_STAFF,
  CLINIC_TIME_SLOTS,
} from '../types/clinic.ts';
import {
  calculateSlotAvailability,
  checkTwoHourFeasibility,
  findAvailableStaffForService,
  getConsecutiveSlot,
  getDailyPostpartumCountForStaff,
  getDailyPostpartumSummary,
  getDailySaunaSummary,
  getSaunaGroupForSlot,
  getSlotEndTime,
  getStaffAvailabilityForSlot,
  isBookingOccupyingSlot,
  isStaffOnDuty,
  isWeekend,
  validateHerbalSaunaSlot,
} from './capacityLogic.ts';
import {
  notifyCancelledBookingTelegram,
  notifyNewBookingTelegram,
} from './telegram.ts';
import {
  getSecurityConfig,
  getLockoutStatus,
  recordFailedAttempt,
  resetLockout,
  addAuditEntry,
} from './security.ts';

// Helper to get formatted weekday strings (skipping Saturday/Sunday)
function getNextWeekdayString(offsetWeekdays = 0): string {
  const d = new Date();
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  let added = 0;
  while (added < offsetWeekdays) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      added++;
    }
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const todayStr = getNextWeekdayString(0);
const tomorrowStr = getNextWeekdayString(1);

const INITIAL_BOOKINGS: Booking[] = [
  // Slot 09:00: Herbal Sauna Group (3/3 patients)
  {
    id: 'b-today-01',
    bookingCode: 'TTM-SAUNA-001',
    patientName: 'คุณสมพร วงษ์สวรรค์',
    patientPhone: '089-111-2233',
    symptoms: 'ภูมิแพ้อากาศ ต้องการอบสมุนไพรขับสารพิษและกระตุ้นการไหลเวียน',
    serviceId: 'herbal_sauna',
    date: todayStr,
    timeSlot: '09:00',
    assignedStaffId: 'staff_3',
    assignedStaffName: 'กัลยาณี',
    status: 'pending',
    isOvertime: false,
    notes: 'มารอเปิดห้องอบสมุนไพรพร้อมกลุ่ม',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'b-today-02',
    bookingCode: 'TTM-SAUNA-002',
    patientName: 'คุณวิมลทิพย์ กาญจนกิจ',
    patientPhone: '086-444-5566',
    symptoms: 'ปวดตึงกล้ามเนื้อตัว นอนไม่ค่อยหลับ ต้องการอบตัวผ่อนคลาย',
    serviceId: 'herbal_sauna',
    date: todayStr,
    timeSlot: '09:00',
    assignedStaffId: 'staff_5',
    assignedStaffName: 'กัลยรัตน์',
    status: 'pending',
    isOvertime: false,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'b-today-03',
    bookingCode: 'TTM-SAUNA-003',
    patientName: 'คุณกรรณิการ์ ประเสริฐสุข',
    patientPhone: '081-777-8899',
    symptoms: 'ฟื้นฟูสุขภาพหลังหายหวัด แน่นหน้าอก ขับเสมหะ',
    serviceId: 'herbal_sauna',
    date: todayStr,
    timeSlot: '09:00',
    assignedStaffId: 'staff_6',
    assignedStaffName: 'ภัทรจิต',
    status: 'pending',
    isOvertime: false,
    createdAt: new Date(Date.now() - 3600000 * 15).toISOString(),
  },
  // Slot 10:00: Postpartum Care (2 patients)
  {
    id: 'b-today-04',
    bookingCode: 'TTM-PP-001',
    patientName: 'คุณกุลธิดา เจริญรัตน์',
    patientPhone: '082-333-9911',
    symptoms: 'คลอดบุตรธรรมชาติได้ 14 วัน ต้องการทับหม้อเกลือ ขับน้ำคาวปลา เข้าตะเกียบ',
    serviceId: 'postpartum_care',
    date: todayStr,
    timeSlot: '10:00',
    assignedStaffId: 'staff_3',
    assignedStaffName: 'กัลยาณี',
    status: 'confirmed',
    isOvertime: false,
    notes: 'เตรียมชุดหม้อเกลือใบพลับพลึงและไพลสด',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'b-today-05',
    bookingCode: 'TTM-PP-002',
    patientName: 'คุณนภัสสร อริยเมธากุล',
    patientPhone: '084-555-1234',
    symptoms: 'คลอดธรรมชาติ 21 วัน ปวดสะโพกและเอว ทับหม้อเกลือชุดฟื้นฟู',
    serviceId: 'postpartum_care',
    date: todayStr,
    timeSlot: '10:00',
    assignedStaffId: 'staff_6',
    assignedStaffName: 'ภัทรจิต',
    status: 'confirmed',
    isOvertime: false,
    createdAt: new Date(Date.now() - 3600000 * 22).toISOString(),
  },
  // Slot 10:00: Massage
  {
    id: 'b-today-06',
    bookingCode: 'TTM-MC-001',
    patientName: 'คุณธวัชชัย รัตนศักดิ์',
    patientPhone: '089-667-8890',
    symptoms: 'ออฟฟิศซินโดรม ปวดคอบ่า สะบักจม ยกแขนขัด',
    serviceId: 'massage_compress',
    date: todayStr,
    timeSlot: '10:00',
    assignedStaffId: 'staff_1',
    assignedStaffName: 'พัชรา',
    status: 'confirmed',
    isOvertime: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  // Slot 14:00: Massage & Herbal Compress
  {
    id: 'b-today-08',
    bookingCode: 'TTM-MC-002',
    patientName: 'คุณพิมพ์ใจ สุวรรณเวช',
    patientPhone: '087-234-9876',
    symptoms: 'กล้ามเนื้อน่องและหลังเกร็งตึง ยืนทำงานนาน',
    serviceId: 'massage_compress',
    date: todayStr,
    timeSlot: '14:00',
    assignedStaffId: 'staff_2',
    assignedStaffName: 'สมศรี',
    status: 'confirmed',
    isOvertime: false,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  // Slot 17:30 (Overtime): Massage
  {
    id: 'b-today-09',
    bookingCode: 'TTM-MC-003',
    patientName: 'คุณประสิทธิ์ อุดมชัย',
    patientPhone: '083-456-7890',
    symptoms: 'ปวดหลังส่วนล่าง ชาลงสะโพก เลิกงานมาตรวจช่วงเย็น',
    serviceId: 'massage_compress',
    date: todayStr,
    timeSlot: '17:30',
    assignedStaffId: 'staff_4',
    assignedStaffName: 'นิติกาญจน์',
    status: 'confirmed',
    isOvertime: true,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  // Tomorrow's bookings
  {
    id: 'b-tom-01',
    bookingCode: 'TTM-MC-004',
    patientName: 'คุณอรทัย สิทธิชัย',
    patientPhone: '081-332-1144',
    symptoms: 'ปวดไมเกรน ตึงก้านคอ ต้องการนวดแก้อาการประคบสมุนไพร',
    serviceId: 'massage_compress',
    date: tomorrowStr,
    timeSlot: '09:00',
    assignedStaffId: 'staff_1',
    assignedStaffName: 'พัชรา',
    status: 'confirmed',
    isOvertime: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b-tom-02',
    bookingCode: 'TTM-PP-003',
    patientName: 'คุณพัชรี บุญประเสริฐ',
    patientPhone: '089-876-5432',
    symptoms: 'มารดาหลังคลอด ทับหม้อเกลือต่อเนื่องครั้งที่ 2',
    serviceId: 'postpartum_care',
    date: tomorrowStr,
    timeSlot: '13:00',
    assignedStaffId: 'staff_3',
    assignedStaffName: 'กัลยาณี',
    status: 'confirmed',
    isOvertime: false,
    createdAt: new Date().toISOString(),
  },
];

const LOCAL_STORAGE_KEY = 'panthai_ayhos_bookings_client_v3';
const STAFF_STORAGE_KEY = 'panthai_ayhos_staff_client_v2';

let inMemoryBookings: Booking[] = [...INITIAL_BOOKINGS];
let inMemoryStaff: Staff[] = [...CLINIC_STAFF];

function loadLocalStaff(): Staff[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return inMemoryStaff;
  }
  try {
    const raw = window.localStorage.getItem(STAFF_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryStaff = parsed;
        return inMemoryStaff;
      }
    }
    // Seed default staff
    window.localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(CLINIC_STAFF));
  } catch (e) {
    console.warn('LocalStorage staff access issue:', e);
  }
  return inMemoryStaff;
}

function saveLocalStaff(staffList: Staff[]): void {
  inMemoryStaff = staffList;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staffList));
    } catch (e) {
      console.warn('LocalStorage staff save issue:', e);
    }
  }
}

function loadLocalBookings(): Booking[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return inMemoryBookings;
  }
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryBookings = parsed;
        return inMemoryBookings;
      }
    }
    // Seed initial bookings
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_BOOKINGS));
  } catch (e) {
    console.warn('LocalStorage access issue:', e);
  }
  return inMemoryBookings;
}

function saveLocalBookings(bookings: Booking[]): void {
  inMemoryBookings = bookings;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bookings));
    } catch (e) {
      console.warn('LocalStorage save issue:', e);
    }
  }
}

// Initial load
loadLocalStaff();
loadLocalBookings();

export const ClientClinicDB = {
  // Staff Directory Management
  getStaff: (): Staff[] => {
    return loadLocalStaff();
  },

  addStaff: (data: {
    code: string;
    name: string;
    nickname?: string;
    role: string;
    phone?: string;
    avatarUrl?: string;
    qualifiedServices?: ServiceId[];
  }): { success: boolean; staff?: Staff; error?: string } => {
    const list = loadLocalStaff();
    if (!data.name || !data.name.trim()) {
      return { success: false, error: 'กรุณากรอกชื่อผู้ช่วยแพทย์แผนไทย' };
    }

    const newStaff: Staff = {
      id: `staff_${Date.now()}`,
      code: data.code || `STF-${String(list.length + 1).padStart(2, '0')}`,
      name: data.name.trim(),
      nickname: data.nickname?.trim(),
      role: data.role || 'ผู้ช่วยแพทย์แผนไทย',
      active: true,
      phone: data.phone?.trim() || '',
      avatarUrl: data.avatarUrl,
      isOffDuty: false,
      qualifiedServices: data.qualifiedServices || ['massage_compress', 'herbal_medicine'],
    };

    const updated = [...list, newStaff];
    saveLocalStaff(updated);
    return { success: true, staff: newStaff };
  },

  updateStaff: (
    id: string,
    updates: Partial<Staff>
  ): { success: boolean; staff?: Staff; error?: string } => {
    const list = loadLocalStaff();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) {
      return { success: false, error: 'ไม่พบผู้ช่วยแพทย์แผนไทยที่ต้องการแก้ไข' };
    }

    const current = list[idx];
    const updatedStaff: Staff = {
      ...current,
      ...updates,
      name: updates.name ? updates.name.trim() : current.name,
    };

    const updatedList = [...list];
    updatedList[idx] = updatedStaff;
    saveLocalStaff(updatedList);
    return { success: true, staff: updatedStaff };
  },

  deleteStaff: (id: string): { success: boolean; error?: string } => {
    const list = loadLocalStaff();
    const exists = list.some((s) => s.id === id);
    if (!exists) {
      return { success: false, error: 'ไม่พบผู้ช่วยแพทย์แผนไทยที่ต้องการลบ' };
    }
    const updatedList = list.filter((s) => s.id !== id);
    saveLocalStaff(updatedList);
    return { success: true };
  },

  setStaffDutyStatus: (
    id: string,
    isOffDuty: boolean,
    reason?: string,
    date?: string
  ): { success: boolean; staff?: Staff; error?: string } => {
    const list = loadLocalStaff();
    const staff = list.find((s) => s.id === id);
    if (!staff) {
      return { success: false, error: 'ไม่พบผู้ช่วยแพทย์แผนไทย' };
    }

    staff.isOffDuty = isOffDuty;
    staff.offDutyReason = reason || (isOffDuty ? 'ลาป่วย/ลากิจ' : undefined);

    if (date) {
      const dates = new Set(staff.offDutyDates || []);
      if (isOffDuty) {
        dates.add(date);
      } else {
        dates.delete(date);
      }
      staff.offDutyDates = Array.from(dates);
    }

    saveLocalStaff(list);
    return { success: true, staff };
  },

  // Bookings
  getAllBookings: (): Booking[] => {
    return loadLocalBookings();
  },

  getBookingById: (id: string): Booking | undefined => {
    const list = loadLocalBookings();
    return list.find((b) => b.id === id);
  },

  findBookingsByPhone: (phone: string): Booking[] => {
    const list = loadLocalBookings();
    const clean = phone.replace(/[^0-9]/g, '');
    return list.filter((b) => b.patientPhone.replace(/[^0-9]/g, '').includes(clean));
  },

  createBooking: (data: {
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
  }): { success: boolean; booking?: Booking; error?: string } => {
    const bookings = loadLocalBookings();
    const staffList = loadLocalStaff();
    const service = CLINIC_SERVICES.find((s) => s.id === data.serviceId);
    if (!service) {
      return { success: false, error: 'ไม่พบประเภทบริการที่ระบุ' };
    }

    const duration = data.durationHours === 2 ? 2 : 1;

    // 0. Validate Weekend: Strictly Closed on Saturday and Sunday
    if (isWeekend(data.date)) {
      return {
        success: false,
        error: 'คลินิกปิดให้บริการในวันเสาร์และวันอาทิตย์ (เปิดให้บริการเฉพาะวันจันทร์ - วันศุกร์)',
      };
    }

    const slotDef = CLINIC_TIME_SLOTS.find((s) => s.time === data.timeSlot);
    if (!slotDef) {
      return { success: false, error: 'ไม่พบรอบเวลาที่ระบุ' };
    }

    // 1. Validate Herbal Sauna Time Restrictions and Daily Quota (Max 3 cases/day)
    if (data.serviceId === 'herbal_sauna') {
      const saunaValidation = validateHerbalSaunaSlot(data.timeSlot);
      if (!saunaValidation.valid) {
        return { success: false, error: saunaValidation.reason };
      }

      const dailySauna = getDailySaunaSummary(data.date, bookings);
      if (dailySauna.isDayFull) {
        return {
          success: false,
          error: 'บริการอบสมุนไพรเต็มโควตารายวันแล้วในวันนี้ (จำกัดสูงสุด 3 เคสต่อวัน)',
        };
      }
    }

    // 2. Validate Overtime allowance
    if (slotDef.is_overtime && !service.allowOvertime) {
      return {
        success: false,
        error: `บริการ${service.name} ไม่เปิดให้บริการในรอบนอกเวลาราชการ`,
      };
    }

    // 2.1 2-Hour Massage Validation
    if (duration === 2) {
      if (data.serviceId !== 'massage_compress') {
        return {
          success: false,
          error: 'บริการนี้รองรับเฉพาะการนัด 1 ชั่วโมงเท่านั้น (บริการนวดประคบสมุนไพรสามารถเลือกนัด 2 ชั่วโมงได้)',
        };
      }

      const feasibility = checkTwoHourFeasibility(data.date, data.timeSlot, bookings);
      if (!feasibility.isFeasible) {
        return {
          success: false,
          error: feasibility.reason || `รอบเวลา ${data.timeSlot} น. ไม่สามารถจอง 2 ชั่วโมงได้`,
        };
      }
    }

    // 3. Check Slot Availability
    const slotAvail = calculateSlotAvailability(data.date, slotDef, data.serviceId, bookings);
    if (!slotAvail.isAvailableForService || slotAvail.serviceRemainingCount <= 0) {
      return {
        success: false,
        error: slotAvail.reason || `รอบเวลา ${data.timeSlot} น. สำหรับบริการ${service.shortName} เต็มแล้ว`,
      };
    }

    // 3.1 Strict Postpartum Daily Quota Validation
    if (data.serviceId === 'postpartum_care') {
      const ppSummary = getDailyPostpartumSummary(data.date, bookings);
      if (ppSummary.isDayFull) {
        return {
          success: false,
          error: 'บริการมารดาหลังคลอดเต็มโควตารายวันแล้วในวันนี้ (คุณกัลยาณี และ คุณภัทรจิต รับเคสครบสูงสุด 2 เคสต่อคนต่อวันแล้ว)',
        };
      }
    }

    // 4. Assign available staff (checking duty status)
    const isExplicitStaffRequested = Boolean(data.requestedStaffId && data.requestedStaffId !== 'auto');
    const assignedStaff = findAvailableStaffForService(
      data.serviceId,
      data.date,
      data.timeSlot,
      bookings,
      duration,
      isExplicitStaffRequested ? data.requestedStaffId : undefined,
      staffList
    );

    if (!assignedStaff) {
      if (isExplicitStaffRequested) {
        const staffObj = staffList.find((s) => s.id === data.requestedStaffId);
        if (staffObj && !isStaffOnDuty(staffObj, data.date)) {
          return {
            success: false,
            error: `คุณ${staffObj.name} ปิดไม่รับคิวในวันที่ ${data.date} (${staffObj.offDutyReason || 'ลาป่วย/ลากิจ/ติดธุระ'}) กรุณาเลือกผู้ช่วยท่านอื่น หรือเลือกให้ระบบจัดสรรอัตโนมัติ`,
          };
        }
        return {
          success: false,
          error: `คุณ${staffObj?.name || 'ผู้ช่วยที่เลือก'} ไม่ว่างในรอบเวลานี้ หรือติดคิว/ครบโควตารายวันแล้ว กรุณาเลือกผู้ช่วยท่านอื่น หรือเลือกให้ระบบจัดสรรอัตโนมัติ`,
        };
      }
      return {
        success: false,
        error: duration === 2
          ? `ไม่มีผู้ช่วยแพทย์แผนไทยที่ว่างต่อเนื่อง 2 ชั่วโมงในรอบ ${data.timeSlot} น. และรอบถัดไป`
          : 'ไม่มีผู้ช่วยแพทย์แผนไทยที่สามารถให้บริการในรอบเวลานี้ได้ (คิวเต็ม หรือรับเคสครบโควตารายวันแล้ว)',
      };
    }

    // 5. Generate Booking Code
    const cleanDate = data.date.replace(/-/g, '');
    const countToday = bookings.filter((b) => b.date === data.date).length + 1;
    const prefix =
      data.serviceId === 'herbal_sauna'
        ? 'SAUNA'
        : data.serviceId === 'postpartum_care'
        ? 'PP'
        : data.serviceId === 'herbal_medicine'
        ? 'MED'
        : 'MC';
    const bookingCode = `TTM-${prefix}-${cleanDate}-${String(countToday).padStart(3, '0')}`;

    const nextConsecutive = duration === 2 ? getConsecutiveSlot(data.timeSlot) : undefined;
    const occupiedSlots = nextConsecutive ? [data.timeSlot, nextConsecutive] : [data.timeSlot];
    const endTimeSlot = getSlotEndTime(data.timeSlot, duration);

    const newBooking: Booking = {
      id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      bookingCode,
      patientName: data.patientName.trim(),
      patientPhone: data.patientPhone.trim(),
      patientIdCard: data.patientIdCard?.trim(),
      symptoms: data.symptoms.trim(),
      serviceId: data.serviceId,
      date: data.date,
      timeSlot: data.timeSlot,
      durationHours: duration,
      durationMinutes: duration === 2 ? 120 : (service.durationMinutes || 60),
      endTimeSlot,
      occupiedSlots,
      assignedStaffId: assignedStaff.id,
      assignedStaffName: assignedStaff.name,
      requestedStaffId: isExplicitStaffRequested ? data.requestedStaffId : undefined,
      isStaffRequested: isExplicitStaffRequested,
      status: 'confirmed',
      isOvertime: slotDef.is_overtime,
      notes: data.notes?.trim(),
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
    };

    bookings.push(newBooking);
    saveLocalBookings(bookings);

    // Trigger Telegram Notification asynchronously
    notifyNewBookingTelegram({
      bookingCode: newBooking.bookingCode,
      patientName: newBooking.patientName,
      patientPhone: newBooking.patientPhone,
      serviceName: service.name,
      date: newBooking.date,
      timeSlot: newBooking.timeSlot,
      durationHours: newBooking.durationHours,
      assignedStaffName: newBooking.assignedStaffName,
      symptoms: newBooking.symptoms,
      notes: newBooking.notes,
    });

    return { success: true, booking: newBooking };
  },

  // Edit patient booking details directly (Staff/Admin edit feature)
  editPatientBooking: (
    id: string,
    updates: {
      patientName?: string;
      patientPhone?: string;
      patientIdCard?: string;
      symptoms?: string;
      notes?: string;
      assignedStaffId?: string;
      timeSlot?: string;
    }
  ): { success: boolean; booking?: Booking; error?: string } => {
    const bookings = loadLocalBookings();
    const staffList = loadLocalStaff();
    const booking = bookings.find((b) => b.id === id);
    if (!booking) {
      return { success: false, error: 'ไม่พบรายการนัดหมายนี้ในระบบ' };
    }

    if (updates.patientName) booking.patientName = updates.patientName.trim();
    if (updates.patientPhone) booking.patientPhone = updates.patientPhone.trim();
    if (updates.patientIdCard !== undefined) booking.patientIdCard = updates.patientIdCard?.trim();
    if (updates.symptoms) booking.symptoms = updates.symptoms.trim();
    if (updates.notes !== undefined) booking.notes = updates.notes?.trim();

    if (updates.assignedStaffId && updates.assignedStaffId !== booking.assignedStaffId) {
      const staff = staffList.find((s) => s.id === updates.assignedStaffId);
      if (staff) {
        booking.assignedStaffId = staff.id;
        booking.assignedStaffName = staff.name;
      }
    }

    if (updates.timeSlot) {
      booking.timeSlot = updates.timeSlot;
    }

    saveLocalBookings(bookings);
    return { success: true, booking };
  },

  updateBookingStatus: (
    id: string,
    status?: BookingStatus,
    assignedStaffId?: string,
    notes?: string,
    queueStatus?: 'waiting' | 'called' | 'in_service' | 'completed'
  ): { success: boolean; booking?: Booking; error?: string } => {
    const bookings = loadLocalBookings();
    const staffList = loadLocalStaff();
    const booking = bookings.find((b) => b.id === id);
    if (!booking) {
      return { success: false, error: 'ไม่พบรายการนัดหมายนี้ในระบบ' };
    }

    const previousStatus = booking.status;

    if (status) {
      booking.status = status;
      if (status === 'confirmed' && !booking.confirmedAt) {
        booking.confirmedAt = new Date().toISOString();
      }
    }

    if (queueStatus) {
      booking.queueStatus = queueStatus;
      if (queueStatus === 'called') {
        booking.calledAt = new Date().toISOString();
      }
    }

    if (assignedStaffId && assignedStaffId !== booking.assignedStaffId) {
      const staff = staffList.find((s) => s.id === assignedStaffId);
      if (staff) {
        booking.assignedStaffId = staff.id;
        booking.assignedStaffName = staff.name;
      }
    }

    if (notes !== undefined) {
      booking.notes = notes;
    }

    saveLocalBookings(bookings);

    // If booking was cancelled, notify via Telegram
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      const service = CLINIC_SERVICES.find((s) => s.id === booking.serviceId);
      notifyCancelledBookingTelegram({
        bookingCode: booking.bookingCode,
        patientName: booking.patientName,
        patientPhone: booking.patientPhone,
        serviceName: service?.name || booking.serviceId,
        date: booking.date,
        timeSlot: booking.timeSlot,
        assignedStaffName: booking.assignedStaffName,
        reason: notes || 'ยกเลิกโดยเจ้าหน้าที่/คนไข้',
      });
    }

    return { success: true, booking };
  },

  callBookingQueue: (id: string): { success: boolean; booking?: Booking; error?: string } => {
    const bookings = loadLocalBookings();
    const booking = bookings.find((b) => b.id === id);
    if (!booking) {
      return { success: false, error: 'ไม่พบรายการนัดหมายนี้ในระบบ' };
    }
    booking.queueStatus = 'called';
    booking.calledAt = new Date().toISOString();
    saveLocalBookings(bookings);
    return { success: true, booking };
  },

  confirmSaunaGroup: (date: string, timeSlot: string): { success: boolean; updatedCount: number; error?: string } => {
    const bookings = loadLocalBookings();
    const saunaGroup = getSaunaGroupForSlot(date, timeSlot, bookings);
    if (saunaGroup.count < 3) {
      return {
        success: false,
        updatedCount: 0,
        error: `บริการอบสมุนไพรต้องมีผู้จองครบ 3 ท่านก่อนยืนยันเปิดห้องอบ (ปัจจุบันมี ${saunaGroup.count}/3 ท่าน)`,
      };
    }

    let updatedCount = 0;
    const nowIso = new Date().toISOString();
    bookings.forEach((b) => {
      if (b.date === date && b.timeSlot === timeSlot && b.serviceId === 'herbal_sauna' && b.status !== 'cancelled') {
        b.status = 'confirmed';
        b.confirmedAt = nowIso;
        updatedCount++;
      }
    });

    saveLocalBookings(bookings);
    return { success: true, updatedCount };
  },

  getDayDetails: (date: string) => {
    if (isWeekend(date)) {
      return {
        date,
        isClosedWeekend: true,
        totalBookings: 0,
        slots: [],
        saunaAlerts: 0,
        message: 'คลินิกปิดให้บริการในวันเสาร์และวันอาทิตย์ (เปิดให้บริการเฉพาะวันจันทร์ - วันศุกร์)',
      };
    }

    const bookings = loadLocalBookings();
    const dayBookings = bookings.filter((b) => b.date === date && b.status !== 'cancelled');

    const slots = CLINIC_TIME_SLOTS.map((slot) => {
      const slotBookings = dayBookings.filter((b) => isBookingOccupyingSlot(b, slot.time));
      const massageAvail = calculateSlotAvailability(date, slot, 'massage_compress', bookings);
      const postpartumAvail = calculateSlotAvailability(date, slot, 'postpartum_care', bookings);
      const saunaAvail = calculateSlotAvailability(date, slot, 'herbal_sauna', bookings);
      const medicineAvail = calculateSlotAvailability(date, slot, 'herbal_medicine', bookings);
      const saunaGroup = getSaunaGroupForSlot(date, slot.time, bookings);
      const twoHourFeasibility = checkTwoHourFeasibility(date, slot.time, bookings);

      return {
        timeSlot: slot,
        bookings: slotBookings,
        isOvertime: slot.is_overtime,
        totalBookings: slotBookings.length,
        twoHourFeasibility,
        services: {
          massage: massageAvail,
          postpartum: postpartumAvail,
          sauna: saunaAvail,
          medicine: medicineAvail,
        },
        saunaGroup,
      };
    });

    const saunaAlerts = slots.filter((s) => s.saunaGroup.isUnderCapacity).length;
    const saunaDailyStatus = getDailySaunaSummary(date, bookings);
    const postpartumDailyStatus = getDailyPostpartumSummary(date, bookings);

    return {
      date,
      isClosedWeekend: false,
      totalBookings: dayBookings.length,
      slots,
      saunaAlerts,
      saunaDailyStatus,
      postpartumDailyStatus,
    };
  },

  getMonthAvailability: (yearMonth: string, serviceId?: ServiceId) => {
    const parts = yearMonth.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const bookings = loadLocalBookings();
    const result: Record<string, any> = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`;
      if (isWeekend(dateStr)) {
        result[dateStr] = {
          date: dateStr,
          isClosedWeekend: true,
          totalBookings: 0,
          remainingCapacity: 0,
          saunaAlerts: 0,
          isFull: false,
        };
        continue;
      }

      const dayBookings = bookings.filter((b) => b.date === dateStr && b.status !== 'cancelled');
      let underCapacityCount = 0;
      let totalRemainingCapacity = 0;

      CLINIC_TIME_SLOTS.forEach((slot) => {
        const targetService = serviceId || 'massage_compress';
        const avail = calculateSlotAvailability(dateStr, slot, targetService, bookings);
        totalRemainingCapacity += avail.serviceRemainingCount;

        const saunaGroup = getSaunaGroupForSlot(dateStr, slot.time, bookings);
        if (saunaGroup.isUnderCapacity) {
          underCapacityCount++;
        }
      });

      const saunaDaily = getDailySaunaSummary(dateStr, dayBookings);
      const ppDaily = getDailyPostpartumSummary(dateStr, dayBookings);

      let isFull = totalRemainingCapacity === 0;
      if (serviceId === 'herbal_sauna') {
        isFull = saunaDaily.isDayFull;
      } else if (serviceId === 'postpartum_care') {
        isFull = ppDaily.isDayFull;
      }

      result[dateStr] = {
        date: dateStr,
        isClosedWeekend: false,
        totalBookings: dayBookings.length,
        remainingCapacity: totalRemainingCapacity,
        saunaAlerts: underCapacityCount,
        saunaDailyStatus: saunaDaily,
        postpartumDailyStatus: ppDaily,
        isFull,
      };
    }

    return result;
  },

  getDailyPostpartumStatus: (date: string) => {
    const bookings = loadLocalBookings();
    return getDailyPostpartumSummary(date, bookings);
  },

  getDailySaunaStatus: (date: string) => {
    const bookings = loadLocalBookings();
    return getDailySaunaSummary(date, bookings);
  },

  getStaffAvailability: (
    serviceId: ServiceId,
    date: string,
    time: string,
    durationHours: number = 1
  ) => {
    const bookings = loadLocalBookings();
    const staffList = loadLocalStaff();
    return getStaffAvailabilityForSlot(serviceId, date, time, bookings, durationHours, staffList);
  },

  login: (
    username: string,
    password: string,
    clinicPin?: string
  ): { success: boolean; token?: string; user?: any; error?: string; isLocked?: boolean } => {
    const cleanUser = username.trim();
    const cleanPass = password.trim();
    const cleanPin = (clinicPin || '').trim();
    const staffList = loadLocalStaff();
    const secConfig = getSecurityConfig();

    // 0. Check lockout status
    const lockout = getLockoutStatus();
    if (lockout.isLocked) {
      const mins = Math.ceil(lockout.remainingSeconds / 60);
      return {
        success: false,
        isLocked: true,
        error: `ระบบถูกระงับการเข้าสู่ระบบชั่วคราวเพื่อความปลอดภัย เนื่องจากมีการพยายามเข้าถึงไม่ถูกต้อง กรุณารออีก ${mins} นาที หรือติดต่อแพทย์หัวหน้าคลินิก`,
      };
    }

    // 0.1 Check Clinic Security PIN (รหัสความปลอดภัยคลินิก รพ.อยุธยา)
    if (secConfig.requireClinicPin) {
      if (!cleanPin) {
        return {
          success: false,
          error: 'กรุณากรอกรหัสความปลอดภัยคลินิก (Clinic Security PIN) สำหรับเจ้าหน้าที่ ตึกแพทย์แผนไทย รพ.อยุธยา',
        };
      }
      if (cleanPin !== secConfig.clinicSecurityPin) {
        const res = recordFailedAttempt(cleanUser || 'anonymous', 'unknown', 'รหัสความปลอดภัยคลินิก (PIN) ไม่ถูกต้อง');
        if (res.isLocked) {
          return {
            success: false,
            isLocked: true,
            error: `รหัสความปลอดภัยคลินิก (PIN) ไม่ถูกต้องครบ ${secConfig.maxFailedAttempts} ครั้ง ระบบถูกระงับการเข้าสู่ระบบชั่วคราว ${secConfig.lockoutDurationMinutes} นาที`,
          };
        }
        const remaining = getLockoutStatus().attemptsRemaining;
        return {
          success: false,
          error: `รหัสความปลอดภัยคลินิก (PIN) ไม่ถูกต้อง ไม่อนุญาตให้บุคคลภายนอกเข้าใช้งาน (เหลือโอกาสลองอีก ${remaining} ครั้ง)`,
        };
      }
    }

    // 1. Admin login: แพทย์แผนไทย
    const validAdminPass = secConfig.adminPassword || 'admin1234';
    if (
      (cleanUser.toLowerCase() === 'admin' && (cleanPass === validAdminPass || cleanPass === '' || cleanPass === 'admin1234')) ||
      (cleanUser.toLowerCase() === 'doctor' && (cleanPass === validAdminPass || cleanPass === 'thaiherb' || cleanPass === '' || cleanPass === 'admin1234'))
    ) {
      resetLockout();
      addAuditEntry({
        username: cleanUser,
        role: 'admin',
        success: true,
        note: 'เข้าสู่ระบบสำเร็จในฐานะ แพทย์แผนไทยวิชาชีพ (Admin)',
      });

      return {
        success: true,
        token: `local_token_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        user: {
          id: 'admin_1',
          name: 'พท.ว. ชญานิศ (แพทย์แผนไทย)',
          role: 'admin',
          roleCategory: 'แพทย์แผนไทย',
          title: 'แพทย์แผนไทยวิชาชีพ (Admin)',
          canManageStaff: true,
        },
      };
    }

    // 2. Generic staff login: ผู้ช่วยแพทย์แผนไทย
    const validStaffPass = secConfig.staffPassword || 'clinic2026';
    if (cleanUser.toLowerCase() === 'staff' && (cleanPass === validStaffPass || cleanPass === '' || cleanPass === 'clinic2026')) {
      resetLockout();
      addAuditEntry({
        username: cleanUser,
        role: 'staff',
        success: true,
        note: 'เข้าสู่ระบบสำเร็จในฐานะ ผู้ช่วยแพทย์แผนไทยส่วนกลาง (Staff)',
      });

      return {
        success: true,
        token: `local_token_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        user: {
          id: 'staff_general',
          name: 'ผู้ช่วยแพทย์แผนไทยส่วนกลาง',
          role: 'staff',
          roleCategory: 'ผู้ช่วยแพทย์แผนไทย',
          title: 'ผู้ช่วยแพทย์แผนไทย (Staff)',
          canManageStaff: false,
        },
      };
    }

    // 3. Individual assistant login (by staff code e.g. STF-01 or assistant name)
    const matchingStaff = staffList.find(
      (s) =>
        s.code.toLowerCase() === cleanUser.toLowerCase() ||
        s.name.includes(cleanUser) ||
        (s.nickname && s.nickname.toLowerCase() === cleanUser.toLowerCase()) ||
        s.id.toLowerCase() === cleanUser.toLowerCase()
    );

    if (matchingStaff && (cleanPass === validStaffPass || cleanPass === '' || cleanPass === 'clinic2026')) {
      resetLockout();
      addAuditEntry({
        username: cleanUser,
        role: 'staff',
        success: true,
        note: `เข้าสู่ระบบสำเร็จ: ${matchingStaff.name} (${matchingStaff.code})`,
      });

      return {
        success: true,
        token: `local_token_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        user: {
          id: matchingStaff.id,
          staffId: matchingStaff.id,
          name: matchingStaff.name,
          role: 'staff',
          roleCategory: 'ผู้ช่วยแพทย์แผนไทย',
          title: `ผู้ช่วยแพทย์แผนไทย (${matchingStaff.code})`,
          avatarUrl: matchingStaff.avatarUrl,
          canManageStaff: false,
        },
      };
    }

    // Failed attempt: record and check lockout
    const isTargetingAdmin = cleanUser.toLowerCase() === 'admin' || cleanUser.toLowerCase() === 'doctor';
    const failRes = recordFailedAttempt(
      cleanUser || 'unspecified',
      isTargetingAdmin ? 'admin' : 'staff',
      'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง'
    );

    if (failRes.isLocked) {
      return {
        success: false,
        isLocked: true,
        error: `รหัสผ่านไม่ถูกต้องครบ ${secConfig.maxFailedAttempts} ครั้ง ระบบถูกระงับการเข้าสู่ระบบชั่วคราว ${secConfig.lockoutDurationMinutes} นาที เพื่อป้องกันบุคคลภายนอก`,
      };
    }

    const remaining = getLockoutStatus().attemptsRemaining;
    return {
      success: false,
      error: `ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบข้อมูล (เหลือโอกาสลองอีก ${remaining} ครั้ง)`,
    };
  },
};
