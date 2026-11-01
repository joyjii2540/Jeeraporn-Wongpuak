import type {
  Booking,
  SaunaGroupSlot,
  ServiceId,
  SlotAvailability,
  Staff,
  TimeSlot,
} from '../types/clinic.ts';
import {
  CLINIC_SERVICES,
  CLINIC_STAFF,
  CLINIC_TIME_SLOTS,
  HERBAL_SAUNA_ALLOWED_SLOTS,
  HERBAL_SAUNA_FORBIDDEN_SLOTS,
} from '../types/clinic.ts';

/**
 * Mapping of time slots that can support a 2-hour consecutive appointment
 * 09:00 -> 10:00 (ends 11:00)
 * 10:00 -> 11:00 (ends 12:00)
 * 11:00 cannot book 2h (lunch break 12:00-13:00)
 * 13:00 -> 14:00 (ends 15:00)
 * 14:00 -> 15:00 (ends 16:00)
 * 15:00 cannot book 2h (regular hours close at 16:00)
 * 16:30 -> 17:30 (ends 18:30)
 * 17:30 -> 18:30 (ends 19:30)
 * 18:30 cannot book 2h (clinic closes at 19:30)
 */
export const CONSECUTIVE_SLOT_MAP: Record<string, string> = {
  '09:00': '10:00',
  '10:00': '11:00',
  '13:00': '14:00',
  '14:00': '15:00',
  '16:30': '17:30',
  '17:30': '18:30',
};

export function canSlotAccommodateTwoHours(time: string): boolean {
  return Boolean(CONSECUTIVE_SLOT_MAP[time]);
}

export function getConsecutiveSlot(time: string): string | undefined {
  return CONSECUTIVE_SLOT_MAP[time];
}

export function getSlotEndTime(time: string, durationHours: number = 1): string {
  if (durationHours === 2) {
    if (time === '09:00') return '11:00';
    if (time === '10:00') return '12:00';
    if (time === '13:00') return '15:00';
    if (time === '14:00') return '16:00';
    if (time === '16:30') return '18:30';
    if (time === '17:30') return '19:30';
  }
  // 1-hour endings
  if (time === '09:00') return '10:00';
  if (time === '10:00') return '11:00';
  if (time === '11:00') return '12:00';
  if (time === '13:00') return '14:00';
  if (time === '14:00') return '15:00';
  if (time === '15:00') return '16:00';
  if (time === '16:00') return '17:00';
  if (time === '16:30') return '17:30';
  if (time === '17:30') return '18:30';
  if (time === '18:30') return '19:30';
  return '';
}

/**
 * Check if a booking occupies a given time slot (either as start slot or 2nd consecutive hour)
 */
export function isBookingOccupyingSlot(b: Booking, timeSlot: string): boolean {
  if (b.status === 'cancelled') return false;
  if (b.occupiedSlots && b.occupiedSlots.length > 0) {
    return b.occupiedSlots.includes(timeSlot);
  }
  if (b.timeSlot === timeSlot) return true;
  if (b.durationHours === 2) {
    const next = CONSECUTIVE_SLOT_MAP[b.timeSlot];
    if (next === timeSlot) return true;
  }
  return false;
}

/**
 * Check if a given date string (YYYY-MM-DD) falls on a weekend (Saturday or Sunday)
 * Clinic is strictly closed on Saturdays and Sundays.
 */
export function isWeekend(dateStr: string): boolean {
  if (!dateStr) return false;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return false;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Validate whether a time slot is allowed for Herbal Sauna
 */
export function validateHerbalSaunaSlot(time: string): { valid: boolean; reason?: string } {
  if (HERBAL_SAUNA_FORBIDDEN_SLOTS.includes(time)) {
    if (time === '11:00' || time === '16:00') {
      return {
        valid: false,
        reason: `รอบเวลา ${time} น. อยู่ในช่วงเตรียมระบบหม้อต้มและทำความสะอาด จึงงดให้บริการอบสมุนไพร`,
      };
    }
    return {
      valid: false,
      reason: `งดให้บริการอบสมุนไพรในรอบนอกเวลาราชการ (${time} น.) เปิดเฉพาะรอบ 09:00, 10:00, 13:00, 14:00, 15:00 น. เท่านั้น`,
    };
  }

  if (!HERBAL_SAUNA_ALLOWED_SLOTS.includes(time)) {
    return {
      valid: false,
      reason: `บริการอบสมุนไพรเปิดเฉพาะรอบ 09:00, 10:00, 13:00, 14:00, 15:00 น. เท่านั้น`,
    };
  }

  return { valid: true };
}

/**
 * Get count of postpartum care cases for a specific staff member on a specific date
 * (Constraint: มารดาหลังคลอด รับเคสสูงสุด 2 เคสต่อคนต่อวัน)
 */
export function getDailyPostpartumCountForStaff(staffId: string, date: string, allBookings: Booking[]): number {
  return allBookings.filter(
    (b) => b.date === date && b.serviceId === 'postpartum_care' && b.assignedStaffId === staffId && b.status !== 'cancelled'
  ).length;
}

/**
 * Get daily postpartum summary for both certified staff members (กัลยาณี & ภัทรจิต)
 */
export function getDailyPostpartumSummary(date: string, allBookings: Booking[]) {
  const staff3Count = getDailyPostpartumCountForStaff('staff_3', date, allBookings);
  const staff6Count = getDailyPostpartumCountForStaff('staff_6', date, allBookings);
  return {
    staff_3: { id: 'staff_3', name: 'กัลยาณี', count: staff3Count, max: 2, isFull: staff3Count >= 2 },
    staff_6: { id: 'staff_6', name: 'ภัทรจิต', count: staff6Count, max: 2, isFull: staff6Count >= 2 },
    totalCount: staff3Count + staff6Count,
    maxTotal: 4,
    isDayFull: staff3Count >= 2 && staff6Count >= 2,
  };
}

/**
 * Get daily Herbal Sauna summary (Rule: สูงสุด 3 เคสต่อวัน ไม่ใช่ 3 เคส/ชม.)
 */
export function getDailySaunaSummary(date: string, allBookings: Booking[]) {
  const saunaBookings = allBookings.filter(
    (b) => b.date === date && b.serviceId === 'herbal_sauna' && b.status !== 'cancelled'
  );
  const count = saunaBookings.length;
  return {
    count,
    max: 3,
    remaining: Math.max(0, 3 - count),
    isDayFull: count >= 3,
    bookings: saunaBookings,
  };
}

/**
 * Get detailed slot availability for a specific service, taking into account
 * certified staff overlap and existing bookings.
 */
export function calculateSlotAvailability(
  date: string,
  timeSlot: TimeSlot,
  serviceId: ServiceId,
  allBookings: Booking[]
): SlotAvailability {
  const service = CLINIC_SERVICES.find((s) => s.id === serviceId)!;
  const time = timeSlot.time;

  // Active bookings in this specific date and time slot (including 2-hour bookings that occupy this slot)
  const activeBookingsInSlot = allBookings.filter(
    (b) => b.date === date && b.status !== 'cancelled' && isBookingOccupyingSlot(b, time)
  );

  // Total clinic staff = 9
  const totalStaff = CLINIC_STAFF.length;

  // Staff IDs that are already committed to a booking in this slot
  const bookedStaffIds = new Set<string>();
  activeBookingsInSlot.forEach((b) => {
    if (b.assignedStaffId) {
      bookedStaffIds.add(b.assignedStaffId);
    }
  });

  // Calculate generic unassigned demand if any
  const bookingsForService = activeBookingsInSlot.filter((b) => b.serviceId === serviceId);
  const serviceBookedCount = bookingsForService.length;

  // Special rule for Herbal Sauna: 3 cases/day clinic-wide (ไม่ใช่ 3 เคส/ชม.)
  if (serviceId === 'herbal_sauna') {
    const saunaCheck = validateHerbalSaunaSlot(time);
    const dailySauna = getDailySaunaSummary(date, allBookings);

    if (!saunaCheck.valid) {
      return {
        timeSlot,
        totalClinicStaff: totalStaff,
        bookedStaffCount: activeBookingsInSlot.length,
        availableStaffCount: Math.max(0, totalStaff - activeBookingsInSlot.length),
        isAvailableForService: false,
        serviceMaxCapacity: 0,
        serviceBookedCount: 0,
        serviceRemainingCount: 0,
        statusMessage: 'restricted',
        reason: saunaCheck.reason,
        isSaunaRestricted: true,
        saunaDailyCount: dailySauna.count,
        saunaDailyMax: 3,
        isSaunaDailyFull: dailySauna.isDayFull,
        saunaCurrentCount: dailySauna.count,
        saunaTargetQuota: 3,
      };
    }

    if (dailySauna.isDayFull) {
      return {
        timeSlot,
        totalClinicStaff: totalStaff,
        bookedStaffCount: activeBookingsInSlot.length,
        availableStaffCount: Math.max(0, totalStaff - activeBookingsInSlot.length),
        isAvailableForService: false,
        serviceMaxCapacity: 3,
        serviceBookedCount: dailySauna.count,
        serviceRemainingCount: 0,
        statusMessage: 'full',
        reason: 'บริการอบสมุนไพรเต็มโควตาสูงสุด 3 เคสต่อวันแล้วในวันนี้',
        isSaunaRestricted: false,
        saunaDailyCount: dailySauna.count,
        saunaDailyMax: 3,
        isSaunaDailyFull: true,
        saunaCurrentCount: dailySauna.count,
        saunaTargetQuota: 3,
      };
    }

    // Available sauna-qualified staff (กัลยาณี, ภัทรจิต, กัลยรัตน์) free in this slot
    const availableSaunaStaff = service.qualifiedStaffIds.filter((id) => !bookedStaffIds.has(id));
    // Up to 2 cabinets in a slot, capped by remaining daily quota
    const slotRemaining = Math.min(availableSaunaStaff.length, 2, dailySauna.remaining);

    let statusMsg: SlotAvailability['statusMessage'] = 'available';
    if (slotRemaining === 0) {
      statusMsg = 'full';
    } else if (slotRemaining === 1 || dailySauna.remaining === 1) {
      statusMsg = 'low';
    }

    return {
      timeSlot,
      totalClinicStaff: totalStaff,
      bookedStaffCount: activeBookingsInSlot.length,
      availableStaffCount: Math.max(0, totalStaff - activeBookingsInSlot.length),
      isAvailableForService: slotRemaining > 0,
      serviceMaxCapacity: 3,
      serviceBookedCount: dailySauna.count,
      serviceRemainingCount: slotRemaining,
      statusMessage: statusMsg,
      reason: slotRemaining === 0 ? 'ผู้เชี่ยวชาญอบสมุนไพรติดคิวในรอบนี้' : undefined,
      isSaunaRestricted: false,
      saunaDailyCount: dailySauna.count,
      saunaDailyMax: 3,
      isSaunaDailyFull: false,
      saunaCurrentCount: dailySauna.count,
      saunaTargetQuota: 3,
    };
  }

  // Postpartum care: Max 2 qualified staff (กัลยาณี staff_3, ภัทรจิต staff_6)
  // RULE: รับเคสสูงสุด 2 เคสต่อคนต่อวัน (รวมสูงสุด 4 เคสต่อวัน)
  if (serviceId === 'postpartum_care') {
    const qualifiedAvailable = service.qualifiedStaffIds.filter((id) => {
      // Must not be booked in this slot
      if (bookedStaffIds.has(id)) return false;
      // Must not exceed daily limit of 2 postpartum cases per day
      const dailyCount = getDailyPostpartumCountForStaff(id, date, allBookings);
      return dailyCount < 2;
    });

    const remaining = qualifiedAvailable.length;
    const ppSummary = getDailyPostpartumSummary(date, allBookings);

    let statusMsg: SlotAvailability['statusMessage'] = 'available';
    if (remaining === 0) {
      statusMsg = 'full';
    } else if (remaining === 1) {
      statusMsg = 'low';
    }

    let reason: string | undefined;
    if (remaining === 0) {
      if (ppSummary.isDayFull) {
        reason = 'โควตามารดาหลังคลอดเต็มแล้วในวันนี้ (คุณกัลยาณี และ คุณภัทรจิต รับเคสครบโควตาสูงสุด 2 เคส/คน/วันแล้ว)';
      } else {
        reason = 'ผู้ช่วยที่มีความเชี่ยวชาญมารดาหลังคลอดติดคิวในรอบนี้ หรือรับเคสครบ 2 เคส/วันแล้ว';
      }
    }

    return {
      timeSlot,
      totalClinicStaff: totalStaff,
      bookedStaffCount: activeBookingsInSlot.length,
      availableStaffCount: Math.max(0, totalStaff - activeBookingsInSlot.length),
      isAvailableForService: remaining > 0,
      serviceMaxCapacity: 2,
      serviceBookedCount,
      serviceRemainingCount: remaining,
      statusMessage: statusMsg,
      reason,
    };
  }

  // Massage & Herbal Compress: All 9 staff qualified, but limited by whoever is free
  const freeStaffCount = totalStaff - activeBookingsInSlot.length;
  const remaining = Math.max(0, freeStaffCount);

  let statusMsg: SlotAvailability['statusMessage'] = 'available';
  if (remaining === 0) {
    statusMsg = 'full';
  } else if (remaining <= 2) {
    statusMsg = 'low';
  }

  return {
    timeSlot,
    totalClinicStaff: totalStaff,
    bookedStaffCount: activeBookingsInSlot.length,
    availableStaffCount: remaining,
    isAvailableForService: remaining > 0,
    serviceMaxCapacity: totalStaff,
    serviceBookedCount,
    serviceRemainingCount: remaining,
    statusMessage: statusMsg,
    reason: remaining === 0 ? 'คิวผู้ช่วยและเตียงเต็มทุกท่านในรอบเวลานี้' : undefined,
  };
}

/**
 * Get detailed staff availability status for a specific service and time slot
 * (used to display selectable assistants in the booking form)
 */
export interface StaffSlotAvailability {
  staff: Staff;
  isQualified: boolean;
  isAvailable: boolean;
  reason?: string;
  postpartumDailyCount?: number;
}

export function isStaffOnDuty(staff: Staff, date?: string): boolean {
  if (staff.active === false) return false;
  if (staff.isOffDuty) return false;
  if (date && staff.offDutyDates && staff.offDutyDates.includes(date)) return false;
  return true;
}

export function getStaffAvailabilityForSlot(
  serviceId: ServiceId,
  date: string,
  time: string,
  allBookings: Booking[],
  durationHours: number = 1,
  staffList?: Staff[]
): StaffSlotAvailability[] {
  const service = CLINIC_SERVICES.find((s) => s.id === serviceId);
  const nextSlot = durationHours === 2 ? CONSECUTIVE_SLOT_MAP[time] : undefined;
  const currentStaffList = staffList && staffList.length > 0 ? staffList : CLINIC_STAFF;

  const bookedStaffIdsSlot1 = new Set(
    allBookings
      .filter((b) => b.date === date && b.status !== 'cancelled' && isBookingOccupyingSlot(b, time) && b.assignedStaffId)
      .map((b) => b.assignedStaffId as string)
  );

  const bookedStaffIdsSlot2 = nextSlot
    ? new Set(
        allBookings
          .filter((b) => b.date === date && b.status !== 'cancelled' && isBookingOccupyingSlot(b, nextSlot) && b.assignedStaffId)
          .map((b) => b.assignedStaffId as string)
      )
    : new Set<string>();

  return currentStaffList.map((staff) => {
    // Check if staff is off duty (on leave, sick, or personal emergency)
    if (!isStaffOnDuty(staff, date)) {
      return {
        staff,
        isQualified: service ? service.qualifiedStaffIds.includes(staff.id) : false,
        isAvailable: false,
        reason: staff.offDutyReason ? `ปิดไม่รับคิว (${staff.offDutyReason})` : 'ปิดไม่รับคิว (ลาหยุด/ติดธุระ)',
      };
    }

    const isQualified = service ? service.qualifiedStaffIds.includes(staff.id) : false;
    if (!isQualified) {
      return {
        staff,
        isQualified: false,
        isAvailable: false,
        reason: 'ไม่ได้ผ่านการรับรองสำหรับหัตถการนี้',
      };
    }

    if (bookedStaffIdsSlot1.has(staff.id)) {
      return {
        staff,
        isQualified: true,
        isAvailable: false,
        reason: `ติดคิวนัดหมายในรอบ ${time} น.`,
      };
    }

    if (durationHours === 2 && nextSlot && bookedStaffIdsSlot2.has(staff.id)) {
      return {
        staff,
        isQualified: true,
        isAvailable: false,
        reason: `ติดคิวนัดหมายในชั่วโมงที่ 2 (รอบ ${nextSlot} น.)`,
      };
    }

    if (serviceId === 'postpartum_care') {
      const dailyCount = getDailyPostpartumCountForStaff(staff.id, date, allBookings);
      if (dailyCount >= 2) {
        return {
          staff,
          isQualified: true,
          isAvailable: false,
          reason: 'รับเคสมารดาหลังคลอดครบโควตาสูงสุด 2 เคส/วันแล้ว',
          postpartumDailyCount: dailyCount,
        };
      }
      return {
        staff,
        isQualified: true,
        isAvailable: true,
        postpartumDailyCount: dailyCount,
      };
    }

    return {
      staff,
      isQualified: true,
      isAvailable: true,
    };
  });
}

/**
 * Find and assign an available qualified staff member for the requested service.
 * Supports patient-requested assistant (preferredStaffId) or automated fair load balancing.
 */
export function findAvailableStaffForService(
  serviceId: ServiceId,
  date: string,
  time: string,
  allBookings: Booking[],
  durationHours: number = 1,
  preferredStaffId?: string,
  staffList?: Staff[]
): Staff | null {
  const service = CLINIC_SERVICES.find((s) => s.id === serviceId);
  if (!service) return null;

  const nextSlot = durationHours === 2 ? CONSECUTIVE_SLOT_MAP[time] : undefined;
  if (durationHours === 2 && !nextSlot) {
    return null; // Cannot book 2 hours if no valid consecutive slot exists
  }

  const currentStaffList = staffList && staffList.length > 0 ? staffList : CLINIC_STAFF;

  // Active bookings occupying slot 1
  const bookedStaffIdsSlot1 = new Set(
    allBookings
      .filter((b) => b.date === date && b.status !== 'cancelled' && isBookingOccupyingSlot(b, time) && b.assignedStaffId)
      .map((b) => b.assignedStaffId as string)
  );

  // Active bookings occupying slot 2 (if 2 hours)
  const bookedStaffIdsSlot2 = nextSlot
    ? new Set(
        allBookings
          .filter((b) => b.date === date && b.status !== 'cancelled' && isBookingOccupyingSlot(b, nextSlot) && b.assignedStaffId)
          .map((b) => b.assignedStaffId as string)
      )
    : new Set<string>();

  // Eligible staff list for service who are on duty and available in both required slots
  let qualifiedStaff = currentStaffList.filter(
    (s) =>
      isStaffOnDuty(s, date) &&
      service.qualifiedStaffIds.includes(s.id) &&
      !bookedStaffIdsSlot1.has(s.id) &&
      (durationHours !== 2 || !bookedStaffIdsSlot2.has(s.id))
  );

  // Postpartum care constraint: max 2 cases per person per day!
  if (serviceId === 'postpartum_care') {
    qualifiedStaff = qualifiedStaff.filter((s) => {
      const dailyCount = getDailyPostpartumCountForStaff(s.id, date, allBookings);
      return dailyCount < 2;
    });
  }

  if (qualifiedStaff.length === 0) return null;

  // If patient selected a specific preferred assistant, check if they are available
  if (preferredStaffId && preferredStaffId !== 'auto') {
    const specificStaff = qualifiedStaff.find((s) => s.id === preferredStaffId);
    if (specificStaff) {
      return specificStaff;
    }
    // If specifically requested staff is not available, return null so caller can return explicit error
    return null;
  }

  // Automatic load-balancing: pick the qualified staff who has the least bookings on that day
  const dailyBookings = allBookings.filter((b) => b.date === date && b.status !== 'cancelled');
  const staffLoad = qualifiedStaff.map((staff) => {
    const totalDailyCount = dailyBookings.filter((b) => b.assignedStaffId === staff.id).length;
    const postpartumDailyCount = dailyBookings.filter(
      (b) => b.assignedStaffId === staff.id && b.serviceId === 'postpartum_care'
    ).length;
    return { staff, totalDailyCount, postpartumDailyCount };
  });

  // Prioritize staff with fewer postpartum cases, then fewer total cases
  staffLoad.sort((a, b) => {
    if (serviceId === 'postpartum_care' && a.postpartumDailyCount !== b.postpartumDailyCount) {
      return a.postpartumDailyCount - b.postpartumDailyCount;
    }
    return a.totalDailyCount - b.totalDailyCount;
  });

  return staffLoad[0].staff;
}

/**
 * Check if a 2-hour massage appointment can be booked at the specified date and time slot
 */
export function checkTwoHourFeasibility(
  date: string,
  timeSlot: string,
  allBookings: Booking[]
): {
  isFeasible: boolean;
  reason?: string;
  nextSlot?: string;
  availableStaffCount: number;
} {
  const nextSlot = CONSECUTIVE_SLOT_MAP[timeSlot];
  if (!nextSlot) {
    if (timeSlot === '11:00') {
      return {
        isFeasible: false,
        reason: 'รอบ 11:00 น. ติดเวลาพักเที่ยงของคลินิก (12:00-13:00 น.) จึงเปิดรับเฉพาะนัด 1 ชั่วโมง',
        availableStaffCount: 0,
      };
    }
    if (timeSlot === '15:00' || timeSlot === '16:00') {
      return {
        isFeasible: false,
        reason: 'รอบบ่ายนี้ติดเวลาสิ้นสุดเวลาราชการ (16:00 น.) จึงเปิดรับเฉพาะนัด 1 ชั่วโมง',
        availableStaffCount: 0,
      };
    }
    if (timeSlot === '18:30') {
      return {
        isFeasible: false,
        reason: 'รอบ 18:30 น. ติดเวลาปิดทำการคลินิก (19:30 น.) จึงเปิดรับเฉพาะนัด 1 ชั่วโมง',
        availableStaffCount: 0,
      };
    }
    return {
      isFeasible: false,
      reason: 'รอบเวลานี้ไม่สามารถนัด 2 ชั่วโมงต่อเนื่องได้',
      availableStaffCount: 0,
    };
  }

  // Check which staff members are free in BOTH timeSlot and nextSlot
  const bookedStaff1 = new Set(
    allBookings
      .filter((b) => b.date === date && b.status !== 'cancelled' && isBookingOccupyingSlot(b, timeSlot) && b.assignedStaffId)
      .map((b) => b.assignedStaffId as string)
  );
  const bookedStaff2 = new Set(
    allBookings
      .filter((b) => b.date === date && b.status !== 'cancelled' && isBookingOccupyingSlot(b, nextSlot) && b.assignedStaffId)
      .map((b) => b.assignedStaffId as string)
  );

  const availableBoth = CLINIC_STAFF.filter(
    (s) => s.active && !bookedStaff1.has(s.id) && !bookedStaff2.has(s.id)
  );

  if (availableBoth.length === 0) {
    return {
      isFeasible: false,
      reason: `ไม่มีผู้ช่วยแพทย์แผนไทยที่ว่างต่อเนื่อง 2 ชั่วโมง (ในรอบ ${timeSlot} น. และรอบ ${nextSlot} น.)`,
      nextSlot,
      availableStaffCount: 0,
    };
  }

  return {
    isFeasible: true,
    nextSlot,
    availableStaffCount: availableBoth.length,
  };
}

/**
 * Group Sauna Bookings for a specific slot to support minimum capacity logic
 */
export function getSaunaGroupForSlot(date: string, timeSlot: string, allBookings: Booking[]): SaunaGroupSlot {
  const bookings = allBookings.filter(
    (b) => b.date === date && b.timeSlot === timeSlot && b.serviceId === 'herbal_sauna' && b.status !== 'cancelled'
  );

  const count = bookings.length;
  const isReadyToOpen = count >= 3;
  const isUnderCapacity = count > 0 && count < 3;
  const allConfirmed = count > 0 && bookings.every((b) => b.status === 'confirmed');

  return {
    date,
    timeSlot,
    bookings,
    count,
    quotaTarget: 3,
    isReadyToOpen,
    isUnderCapacity,
    allConfirmed,
  };
}
