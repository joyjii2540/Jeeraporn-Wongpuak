/**
 * Database Schema & Domain Types
 * Clinic Master Calendar & Appointment System for Thai Traditional Medicine
 */

export interface Staff {
  id: string;
  code: string;
  name: string;
  nickname?: string;
  role: string;
  active: boolean;
  phone?: string;
}

export type ServiceId = 'massage_compress' | 'postpartum_care' | 'herbal_sauna' | 'herbal_medicine';

export interface Service {
  id: ServiceId;
  code: string;
  name: string;
  shortName: string;
  category: string;
  description: string;
  durationMinutes: number;
  priceRegular: number;
  priceOvertime: number;
  priceTwoHours?: number; // e.g. 450 for massage + health massage 2 hrs
  priceTwoHoursOvertime?: number;
  priceDisplay?: string; // e.g. 'ราคาตามค่ายา'
  qualifiedStaffIds: string[];
  maxCapacityPerSlot: number;
  minBookingThreshold?: number; // E.g., 3 for herbal sauna
  allowedTimeSlots?: string[]; // E.g. restricted slots for herbal sauna
  forbiddenTimeSlots?: string[]; // 11:00, 16:00, all overtime slots
  allowOvertime: boolean;
  maxDailyCasesPerStaff?: number; // E.g., max 2 cases per person per day for postpartum care
}

export interface TimeSlot {
  id: string;
  time: string; // '09:00', '10:00', etc.
  period: 'morning' | 'afternoon' | 'evening';
  is_overtime: boolean;
  label: string;
  periodLabel: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  bookingCode: string; // e.g. TTM-20261026-001
  patientName: string;
  patientPhone: string;
  patientIdCard?: string;
  symptoms: string;
  serviceId: ServiceId;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm
  durationHours?: number; // 1 or 2 (default 1)
  durationMinutes?: number; // 60 or 120 (default 60)
  endTimeSlot?: string; // e.g. '11:00'
  occupiedSlots?: string[]; // e.g. ['09:00', '10:00']
  assignedStaffId?: string;
  assignedStaffName?: string;
  requestedStaffId?: string; // Optional user-requested staff id ('auto' or specific staff id)
  isStaffRequested?: boolean; // True if patient specifically chose this assistant
  status: BookingStatus;
  isOvertime: boolean;
  notes?: string;
  createdAt: string;
  confirmedAt?: string;
  calledAt?: string;
  queueStatus?: 'waiting' | 'called' | 'in_service' | 'completed';
}

export interface SlotAvailability {
  timeSlot: TimeSlot;
  totalClinicStaff: number; // 9
  bookedStaffCount: number;
  availableStaffCount: number;
  isAvailableForService: boolean;
  serviceMaxCapacity: number;
  serviceBookedCount: number;
  serviceRemainingCount: number;
  statusMessage: 'available' | 'low' | 'full' | 'restricted';
  reason?: string;
  // Specific for herbal sauna (Constraint: 3 cases per day clinic-wide)
  isSaunaRestricted?: boolean;
  saunaDailyCount?: number;
  saunaDailyMax?: number;
  isSaunaDailyFull?: boolean;
  saunaCurrentCount?: number;
  saunaTargetQuota?: number;
}

export interface DayAvailabilitySummary {
  date: string;
  totalSlots: number;
  availableSlotsCount: number;
  totalBookings: number;
  isFull: boolean;
  saunaUnderCapacityAlerts: number;
  slots: Record<string, {
    totalBookings: number;
    remainingCapacity: number;
    isOvertime: boolean;
  }>;
}

export interface SaunaGroupSlot {
  date: string;
  timeSlot: string;
  bookings: Booking[];
  count: number;
  quotaTarget: number; // 3
  isReadyToOpen: boolean; // count === 3
  isUnderCapacity: boolean; // 1 <= count < 3
  allConfirmed: boolean;
}

export interface StaffServiceMapping {
  staffId: string;
  serviceId: ServiceId;
  isCertified: boolean;
}

/**
 * 9 Thai Traditional Medicine Assistants (รายชื่อผู้ช่วยแพทย์แผนไทย 9 คน)
 */
export const CLINIC_STAFF: Staff[] = [
  { id: 'staff_1', code: 'STF-01', name: 'พัชรา', role: 'ผู้ช่วยแพทย์แผนไทย', active: true, phone: '081-234-5601' },
  { id: 'staff_2', code: 'STF-02', name: 'สมศรี', role: 'ผู้ช่วยแพทย์แผนไทย', active: true, phone: '081-234-5602' },
  { id: 'staff_3', code: 'STF-03', name: 'กัลยาณี', role: 'ผู้ช่วยแพทย์แผนไทย (ผู้เชี่ยวชาญมารดา/อบสมุนไพร)', active: true, phone: '081-234-5603' },
  { id: 'staff_4', code: 'STF-04', name: 'นิติกาญจน์', role: 'ผู้ช่วยแพทย์แผนไทย', active: true, phone: '081-234-5604' },
  { id: 'staff_5', code: 'STF-05', name: 'กัลยรัตน์', role: 'ผู้ช่วยแพทย์แผนไทย (ผู้เชี่ยวชาญอบสมุนไพร)', active: true, phone: '081-234-5605' },
  { id: 'staff_6', code: 'STF-06', name: 'ภัทรจิต', role: 'ผู้ช่วยแพทย์แผนไทย (ผู้เชี่ยวชาญมารดา/อบสมุนไพร)', active: true, phone: '081-234-5606' },
  { id: 'staff_7', code: 'STF-07', name: 'ชลธิชา', role: 'ผู้ช่วยแพทย์แผนไทย', active: true, phone: '081-234-5607' },
  { id: 'staff_8', code: 'STF-08', name: 'สุภาพร', role: 'ผู้ช่วยแพทย์แผนไทย', active: true, phone: '081-234-5608' },
  { id: 'staff_9', code: 'STF-09', name: 'วริฐา', role: 'ผู้ช่วยแพทย์แผนไทย', active: true, phone: '081-234-5609' },
];

/**
 * Time Slots: 2 Main Groups (Regular vs Overtime)
 */
export const CLINIC_TIME_SLOTS: TimeSlot[] = [
  // Regular Hours (ในเวลาราชการ) - เช้า
  { id: 'slot_0900', time: '09:00', period: 'morning', is_overtime: false, label: '09:00 น.', periodLabel: 'เช้า (ในเวลา)' },
  { id: 'slot_1000', time: '10:00', period: 'morning', is_overtime: false, label: '10:00 น.', periodLabel: 'เช้า (ในเวลา)' },
  { id: 'slot_1100', time: '11:00', period: 'morning', is_overtime: false, label: '11:00 น.', periodLabel: 'เช้า (ในเวลา)' },
  // Regular Hours (ในเวลาราชการ) - บ่าย
  { id: 'slot_1300', time: '13:00', period: 'afternoon', is_overtime: false, label: '13:00 น.', periodLabel: 'บ่าย (ในเวลา)' },
  { id: 'slot_1400', time: '14:00', period: 'afternoon', is_overtime: false, label: '14:00 น.', periodLabel: 'บ่าย (ในเวลา)' },
  { id: 'slot_1500', time: '15:00', period: 'afternoon', is_overtime: false, label: '15:00 น.', periodLabel: 'บ่าย (ในเวลา)' },
  { id: 'slot_1600', time: '16:00', period: 'afternoon', is_overtime: false, label: '16:00 น.', periodLabel: 'บ่าย (ในเวลา)' },
  // Overtime Hours (นอกเวลาราชการ) - เย็น/ค่ำ
  { id: 'slot_1630', time: '16:30', period: 'evening', is_overtime: true, label: '16:30 น.', periodLabel: 'เย็น (นอกเวลา)' },
  { id: 'slot_1730', time: '17:30', period: 'evening', is_overtime: true, label: '17:30 น.', periodLabel: 'ค่ำ (นอกเวลา)' },
  { id: 'slot_1830', time: '18:30', period: 'evening', is_overtime: true, label: '18:30 น.', periodLabel: 'ค่ำ (นอกเวลา)' },
];

/**
 * Permitted Slots for Herbal Sauna:
 * Forbidden at 11:00, 16:00 and all overtime slots (16:30, 17:30, 18:30).
 * Allowed ONLY: 09:00, 10:00, 13:00, 14:00, 15:00
 */
export const HERBAL_SAUNA_ALLOWED_SLOTS = ['09:00', '10:00', '13:00', '14:00', '15:00'];
export const HERBAL_SAUNA_FORBIDDEN_SLOTS = ['11:00', '16:00', '16:30', '17:30', '18:30'];

/**
 * 4 Services with Capabilities, Rules, and Official Hospital Rates:
 * 1. นวดและประคบสมุนไพร: 250 บาท (นวดประคบสมุนไพร + นวดสุขภาพ 2 ชม. 450 บาท)
 * 2. อบสมุนไพร: 120 บาท (จำกัดสูงสุด 3 เคสต่อวัน)
 * 3. ดูแลมารดาหลังคลอด: 670 บาท (ทับหม้อเกลือ สูงสุด 2 เคส/คน/วัน)
 * 4. จ่ายยาสมุนไพร: ราคาตามค่ายา
 */
export const CLINIC_SERVICES: Service[] = [
  {
    id: 'massage_compress',
    code: 'SVC-MC',
    name: 'บริการนวดและประคบสมุนไพร',
    shortName: 'นวดประคบสมุนไพร',
    category: 'หัตถการพื้นฐาน',
    description: 'นวดรักษาอาการปวดเมื่อยกล้ามเนื้อ ร่วมกับการประคบด้วยลูกประคบสมุนไพรสดสูตรแพทย์แผนไทย (1 ชม. 250 บาท / นวดประคบสมุนไพร + นวดสุขภาพ 2 ชม. 450 บาท)',
    durationMinutes: 60,
    priceRegular: 250,
    priceOvertime: 300,
    priceTwoHours: 450,
    priceTwoHoursOvertime: 500,
    // All 9 staff are certified
    qualifiedStaffIds: ['staff_1', 'staff_2', 'staff_3', 'staff_4', 'staff_5', 'staff_6', 'staff_7', 'staff_8', 'staff_9'],
    maxCapacityPerSlot: 9,
    allowOvertime: true,
  },
  {
    id: 'postpartum_care',
    code: 'SVC-PP',
    name: 'บริการดูแลมารดาหลังคลอด (ทับหม้อเกลือ)',
    shortName: 'ดูแลมารดาหลังคลอด',
    category: 'หัตถการเฉพาะทาง',
    description: 'ดูแลสุขภาพสตรีหลังคลอดด้วยศาสตร์การทับหม้อเกลือ ขับน้ำคาวปลา เข้าตะเกียบ กระชับกล้ามเนื้อ (รับเคสสูงสุด 2 เคสต่อคนต่อวัน)',
    durationMinutes: 60,
    priceRegular: 670,
    priceOvertime: 720,
    // Only กัลยาณี (staff_3) and ภัทรจิต (staff_6)
    qualifiedStaffIds: ['staff_3', 'staff_6'],
    maxCapacityPerSlot: 2,
    maxDailyCasesPerStaff: 2, // รับเคสสูงสุด 2 เคสต่อคนต่อวัน (รวมสูงสุด 4 เคส/วัน)
    allowOvertime: true,
  },
  {
    id: 'herbal_sauna',
    code: 'SVC-HS',
    name: 'บริการอบสมุนไพรเพื่อสุขภาพ',
    shortName: 'อบสมุนไพร',
    category: 'หัตถการอบสมุนไพร',
    description: 'อบไอน้ำสมุนไพรตำรับบำบัดทางเดินหายใจ ขับสารพิษ กระตุ้นการไหลเวียนโลหิต (จำกัดโควตาสูงสุด 3 เคสต่อวัน)',
    durationMinutes: 45,
    priceRegular: 120,
    priceOvertime: 120,
    // Only กัลยาณี (staff_3), ภัทรจิต (staff_6), and กัลยรัตน์ (staff_5)
    qualifiedStaffIds: ['staff_3', 'staff_5', 'staff_6'],
    maxCapacityPerSlot: 2, // Up to 2 cabinets (ตู้ 1, ตู้ 2)
    maxDailyCasesPerStaff: undefined,
    allowedTimeSlots: HERBAL_SAUNA_ALLOWED_SLOTS,
    forbiddenTimeSlots: HERBAL_SAUNA_FORBIDDEN_SLOTS,
    allowOvertime: false, // Forbidden in overtime hours
  },
  {
    id: 'herbal_medicine',
    code: 'SVC-MED',
    name: 'บริการจ่ายยาสมุนไพร / ตรวจสั่งจ่ายยา',
    shortName: 'จ่ายยาสมุนไพร',
    category: 'เวชกรรมและเภสัชกรรมแผนไทย',
    description: 'ตรวจวินิจฉัยโดยแพทย์แผนไทยและสั่งจ่ายยาสมุนไพรตามกลุ่มอาการ อัตราค่าบริการคิดราคาตามค่ายาจริง',
    durationMinutes: 30,
    priceRegular: 0,
    priceOvertime: 0,
    priceDisplay: 'ราคาตามค่ายา',
    qualifiedStaffIds: ['staff_1', 'staff_2', 'staff_3', 'staff_4', 'staff_5', 'staff_6', 'staff_7', 'staff_8', 'staff_9'],
    maxCapacityPerSlot: 6,
    allowOvertime: true,
  },
];
