import fs from 'fs';
import path from 'path';
import type {
  Booking,
  BookingStatus,
  ServiceId,
} from '../types/clinic.ts';
import {
  CLINIC_SERVICES,
  CLINIC_STAFF,
  CLINIC_TIME_SLOTS,
} from '../types/clinic.ts';
import {
  calculateSlotAvailability,
  canSlotAccommodateTwoHours,
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
  isWeekend,
  validateHerbalSaunaSlot,
} from '../utils/capacityLogic.ts';

// Format YYYY-MM-DD on weekdays (skip Saturday & Sunday)
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
const nextDayStr = getNextWeekdayString(2);

// In-memory persistent database for bookings
let bookingsDB: Booking[] = [
  // --- TODAY'S BOOKINGS ---
  // Slot 09:00: Herbal Sauna Group (3/3 patients ready to confirm!)
  {
    id: 'b-today-01',
    bookingCode: 'TTM-SAUNA-001',
    patientName: 'คุณสมพร วงษ์สวรรค์',
    patientPhone: '089-111-2233',
    symptoms: 'ภูมิแพ้อากาศ ต้องการอบสมุนไพรขับสารพิษและกระตุ้นการไหลเวียน',
    serviceId: 'herbal_sauna',
    date: todayStr,
    timeSlot: '09:00',
    assignedStaffId: 'staff_3', // กัลยาณี
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
    assignedStaffId: 'staff_5', // กัลยรัตน์
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
    assignedStaffId: 'staff_6', // ภัทรจิต
    assignedStaffName: 'ภัทรจิต',
    status: 'pending',
    isOvertime: false,
    createdAt: new Date(Date.now() - 3600000 * 15).toISOString(),
  },

  // Slot 10:00: Postpartum Care (2 patients booked - Cap is 2, so Postpartum is FULL!)
  {
    id: 'b-today-04',
    bookingCode: 'TTM-PP-001',
    patientName: 'คุณกุลธิดา เจริญรัตน์',
    patientPhone: '082-333-9911',
    symptoms: 'คลอดบุตรธรรมชาติได้ 14 วัน ต้องการทับหม้อเกลือ ขับน้ำคาวปลา เข้าตะเกียบ',
    serviceId: 'postpartum_care',
    date: todayStr,
    timeSlot: '10:00',
    assignedStaffId: 'staff_3', // กัลยาณี
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
    assignedStaffId: 'staff_6', // ภัทรจิต
    assignedStaffName: 'ภัทรจิต',
    status: 'confirmed',
    isOvertime: false,
    createdAt: new Date(Date.now() - 3600000 * 22).toISOString(),
  },

  // Slot 10:00: Massage bookings
  {
    id: 'b-today-06',
    bookingCode: 'TTM-MC-001',
    patientName: 'คุณธวัชชัย รัตนศักดิ์',
    patientPhone: '089-667-8890',
    symptoms: 'ออฟฟิศซินโดรม ปวดคอบ่า สะบักจม ยกแขนขัด',
    serviceId: 'massage_compress',
    date: todayStr,
    timeSlot: '10:00',
    assignedStaffId: 'staff_1', // พัชรา
    assignedStaffName: 'พัชรา',
    status: 'confirmed',
    isOvertime: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },

  // Slot 13:00: Herbal Sauna Under-capacity (Only 1 booked! Needs alert)
  {
    id: 'b-today-07',
    bookingCode: 'TTM-SAUNA-004',
    patientName: 'คุณชาคริต วัฒนกุล',
    patientPhone: '085-789-0123',
    symptoms: 'ปวดเมื่อยตัว เหงื่อออกยาก ต้องการอบสมุนไพรขับเหงื่อ',
    serviceId: 'herbal_sauna',
    date: todayStr,
    timeSlot: '13:00',
    assignedStaffId: 'staff_5',
    assignedStaffName: 'กัลยรัตน์',
    status: 'pending',
    isOvertime: false,
    notes: 'รอรวมกลุ่ม 3 ท่าน เจ้าหน้าที่ต้องติดต่อหากไม่ครบ',
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
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
    assignedStaffId: 'staff_2', // สมศรี
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
    assignedStaffId: 'staff_4', // นิติกาญจน์
    assignedStaffName: 'นิติกาญจน์',
    status: 'confirmed',
    isOvertime: true,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },

  // --- TOMORROW'S BOOKINGS ---
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
  {
    id: 'b-tom-03',
    bookingCode: 'TTM-SAUNA-005',
    patientName: 'คุณดนัย เกษมสันต์',
    patientPhone: '082-123-4455',
    symptoms: 'ขับสารพิษ ภูมิแพ้',
    serviceId: 'herbal_sauna',
    date: tomorrowStr,
    timeSlot: '14:00',
    assignedStaffId: 'staff_5',
    assignedStaffName: 'กัลยรัตน์',
    status: 'pending',
    isOvertime: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b-tom-04',
    bookingCode: 'TTM-SAUNA-006',
    patientName: 'คุณพงษ์ศักดิ์ รุ่งโรจน์',
    patientPhone: '086-654-3322',
    symptoms: 'อบสมุนไพรบำบัดกล้ามเนื้อ',
    serviceId: 'herbal_sauna',
    date: tomorrowStr,
    timeSlot: '14:00',
    assignedStaffId: 'staff_6',
    assignedStaffName: 'ภัทรจิต',
    status: 'pending',
    isOvertime: false,
    createdAt: new Date().toISOString(),
  },
];

const DB_FILE_PATH = path.resolve(process.cwd(), 'clinic_bookings_store.json');

function saveBookingsToFile() {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(bookingsDB, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save bookings to file:', err);
  }
}

function loadBookingsFromFile() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        bookingsDB = data;
      }
    }
  } catch (err) {
    console.error('Failed to load bookings from file:', err);
  }
}

// Load persisted bookings if available
loadBookingsFromFile();

export const ClinicDB = {
  getAllBookings: (): Booking[] => [...bookingsDB],

  getBookingById: (id: string): Booking | undefined => {
    return bookingsDB.find((b) => b.id === id);
  },

  findBookingsByPhone: (phone: string): Booking[] => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return bookingsDB.filter((b) => b.patientPhone.replace(/[^0-9]/g, '').includes(cleanPhone));
  },

  createBooking: (data: {
    patientName: string;
    patientPhone: string;
    patientIdCard?: string;
    symptoms: string;
    serviceId: ServiceId;
    date: string;
    timeSlot: string;
    durationHours?: number; // 1 or 2
    notes?: string;
    requestedStaffId?: string; // Optional specific assistant or 'auto'
  }): { success: boolean; booking?: Booking; error?: string } => {
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

      const dailySauna = getDailySaunaSummary(data.date, bookingsDB);
      if (dailySauna.isDayFull) {
        return {
          success: false,
          error: 'บริการอบสมุนไพรเต็มโควตารายวันแล้วในวันนี้ (จำกัดสูงสุด 3 เคสต่อวัน)',
        };
      }
    }

    // 2. Validate Overtime allowance for service
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

      const feasibility = checkTwoHourFeasibility(data.date, data.timeSlot, bookingsDB);
      if (!feasibility.isFeasible) {
        return {
          success: false,
          error: feasibility.reason || `รอบเวลา ${data.timeSlot} น. ไม่สามารถจอง 2 ชั่วโมงได้`,
        };
      }
    }

    // 3. Check Slot Availability & Capacity for Slot 1
    const slotAvail = calculateSlotAvailability(data.date, slotDef, data.serviceId, bookingsDB);
    if (!slotAvail.isAvailableForService || slotAvail.serviceRemainingCount <= 0) {
      return {
        success: false,
        error: slotAvail.reason || `รอบเวลา ${data.timeSlot} น. สำหรับบริการ${service.shortName} เต็มแล้ว`,
      };
    }

    // 3.1 Strict Postpartum Daily Quota Validation: Max 2 cases per person per day (4 cases max/day for clinic)
    if (data.serviceId === 'postpartum_care') {
      const ppSummary = getDailyPostpartumSummary(data.date, bookingsDB);
      if (ppSummary.isDayFull) {
        return {
          success: false,
          error: 'บริการมารดาหลังคลอดเต็มโควตารายวันแล้วในวันนี้ (คุณกัลยาณี และ คุณภัทรจิต รับเคสครบสูงสุด 2 เคสต่อคนต่อวันแล้ว)',
        };
      }
    }

    // 4. Assign available qualified staff (handling patient preferred assistant or auto allocation)
    const isExplicitStaffRequested = Boolean(data.requestedStaffId && data.requestedStaffId !== 'auto');
    const assignedStaff = findAvailableStaffForService(
      data.serviceId,
      data.date,
      data.timeSlot,
      bookingsDB,
      duration,
      isExplicitStaffRequested ? data.requestedStaffId : undefined
    );

    if (!assignedStaff) {
      if (isExplicitStaffRequested) {
        const staffObj = CLINIC_STAFF.find((s) => s.id === data.requestedStaffId);
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

    // Double check postpartum staff constraint
    if (data.serviceId === 'postpartum_care') {
      const staffPPDaily = getDailyPostpartumCountForStaff(assignedStaff.id, data.date, bookingsDB);
      if (staffPPDaily >= 2) {
        return {
          success: false,
          error: `คุณ${assignedStaff.name} รับเคสมารดาหลังคลอดครบโควตาสูงสุด 2 เคสต่อคนต่อวันแล้ว`,
        };
      }
    }

    // 5. Generate Booking Code
    const cleanDate = data.date.replace(/-/g, '');
    const countToday = bookingsDB.filter((b) => b.date === data.date).length + 1;
    const prefix =
      data.serviceId === 'herbal_sauna'
        ? 'SAUNA'
        : data.serviceId === 'postpartum_care'
        ? 'PP'
        : data.serviceId === 'herbal_medicine'
        ? 'MED'
        : 'MC';
    const bookingCode = `TTM-${prefix}-${cleanDate}-${String(countToday).padStart(3, '0')}`;

    // Herbal sauna is now 3 cases/day total, confirmed immediately if within quota!
    const initialStatus: BookingStatus = 'confirmed';

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
      status: initialStatus,
      isOvertime: slotDef.is_overtime,
      notes: data.notes?.trim(),
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
    };

    bookingsDB.push(newBooking);
    saveBookingsToFile();

    return { success: true, booking: newBooking };
  },

  updateBookingStatus: (
    id: string,
    status: BookingStatus,
    assignedStaffId?: string,
    notes?: string,
    queueStatus?: 'waiting' | 'called' | 'in_service' | 'completed'
  ): { success: boolean; booking?: Booking; error?: string } => {
    const booking = bookingsDB.find((b) => b.id === id);
    if (!booking) {
      return { success: false, error: 'ไม่พบรายการนัดหมายนี้ในระบบ' };
    }

    booking.status = status;
    if (status === 'confirmed' && !booking.confirmedAt) {
      booking.confirmedAt = new Date().toISOString();
    }
    if (queueStatus) {
      booking.queueStatus = queueStatus;
      if (queueStatus === 'called') {
        booking.calledAt = new Date().toISOString();
      }
    }
    if (assignedStaffId && assignedStaffId !== booking.assignedStaffId) {
      // If reassigning postpartum care, enforce max 2 cases per person per day
      if (booking.serviceId === 'postpartum_care') {
        const otherStaffPPDaily = bookingsDB.filter(
          (b) =>
            b.id !== id &&
            b.date === booking.date &&
            b.serviceId === 'postpartum_care' &&
            b.assignedStaffId === assignedStaffId &&
            b.status !== 'cancelled'
        ).length;
        if (otherStaffPPDaily >= 2) {
          const staffObj = CLINIC_STAFF.find((s) => s.id === assignedStaffId);
          return {
            success: false,
            error: `ไม่สามารถมอบหมายคุณ${staffObj?.name || ''} ได้ เนื่องจากรับเคสมารดาหลังคลอดครบโควตาสูงสุด 2 เคสต่อคนต่อวันแล้ว`,
          };
        }
      }
      const staff = CLINIC_STAFF.find((s) => s.id === assignedStaffId);
      if (staff) {
        booking.assignedStaffId = staff.id;
        booking.assignedStaffName = staff.name;
      }
    }
    if (notes !== undefined) {
      booking.notes = notes;
    }

    saveBookingsToFile();
    return { success: true, booking };
  },

  callBookingQueue: (id: string): { success: boolean; booking?: Booking; error?: string } => {
    const booking = bookingsDB.find((b) => b.id === id);
    if (!booking) {
      return { success: false, error: 'ไม่พบรายการนัดหมายนี้ในระบบ' };
    }
    booking.queueStatus = 'called';
    booking.calledAt = new Date().toISOString();
    saveBookingsToFile();
    return { success: true, booking };
  },

  confirmSaunaGroup: (date: string, timeSlot: string): { success: boolean; updatedCount: number; error?: string } => {
    const saunaGroup = getSaunaGroupForSlot(date, timeSlot, bookingsDB);
    if (saunaGroup.count < 3) {
      return {
        success: false,
        updatedCount: 0,
        error: `บริการอบสมุนไพรต้องมีผู้จองครบ 3 ท่านก่อนยืนยันเปิดห้องอบ (ปัจจุบันมี ${saunaGroup.count}/3 ท่าน)`,
      };
    }

    let updatedCount = 0;
    const nowIso = new Date().toISOString();
    bookingsDB.forEach((b) => {
      if (b.date === date && b.timeSlot === timeSlot && b.serviceId === 'herbal_sauna' && b.status !== 'cancelled') {
        b.status = 'confirmed';
        b.confirmedAt = nowIso;
        updatedCount++;
      }
    });

    saveBookingsToFile();
    return { success: true, updatedCount };
  },

  getDayDetails: (date: string) => {
    // Check if weekend (Saturday or Sunday)
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

    const dayBookings = bookingsDB.filter((b) => b.date === date && b.status !== 'cancelled');

    const slots = CLINIC_TIME_SLOTS.map((slot) => {
      // Find all bookings occupying this slot (both starting in slot or continuing 2nd hour)
      const slotBookings = dayBookings.filter((b) => isBookingOccupyingSlot(b, slot.time));
      const massageAvail = calculateSlotAvailability(date, slot, 'massage_compress', bookingsDB);
      const postpartumAvail = calculateSlotAvailability(date, slot, 'postpartum_care', bookingsDB);
      const saunaAvail = calculateSlotAvailability(date, slot, 'herbal_sauna', bookingsDB);
      const medicineAvail = calculateSlotAvailability(date, slot, 'herbal_medicine', bookingsDB);
      const saunaGroup = getSaunaGroupForSlot(date, slot.time, bookingsDB);
      const twoHourFeasibility = checkTwoHourFeasibility(date, slot.time, bookingsDB);

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

    // Count alert slots (e.g. sauna under capacity)
    const saunaAlerts = slots.filter((s) => s.saunaGroup.isUnderCapacity).length;
    const saunaDailyStatus = getDailySaunaSummary(date, bookingsDB);
    const postpartumDailyStatus = getDailyPostpartumSummary(date, bookingsDB);

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
    // yearMonth = 'YYYY-MM'
    const daysInMonth = new Date(
      parseInt(yearMonth.split('-')[0]),
      parseInt(yearMonth.split('-')[1]),
      0
    ).getDate();

    const result: Record<string, any> = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`;
      
      // If Saturday or Sunday
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

      const dayBookings = bookingsDB.filter((b) => b.date === dateStr && b.status !== 'cancelled');

      let underCapacityCount = 0;
      let totalRemainingCapacity = 0;

      CLINIC_TIME_SLOTS.forEach((slot) => {
        const targetService = serviceId || 'massage_compress';
        const avail = calculateSlotAvailability(dateStr, slot, targetService, bookingsDB);
        totalRemainingCapacity += avail.serviceRemainingCount;

        const saunaGroup = getSaunaGroupForSlot(dateStr, slot.time, bookingsDB);
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
    return getDailyPostpartumSummary(date, bookingsDB);
  },

  getDailySaunaStatus: (date: string) => {
    return getDailySaunaSummary(date, bookingsDB);
  },

  getStaffAvailability: (
    serviceId: ServiceId,
    date: string,
    time: string,
    durationHours: number = 1
  ) => {
    return getStaffAvailabilityForSlot(serviceId, date, time, bookingsDB, durationHours);
  },
};

