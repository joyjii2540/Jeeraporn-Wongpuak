/**
 * Queue Proximity & Notification Utilities
 * For Thai Traditional Medicine Clinic - Phra Nakhon Si Ayutthaya Hospital
 */

export type QueueProximityCategory = 
  | 'now_serving'      // ถึงเวลารับบริการแล้ว (อยู่ในช่วงเวลาของรอบ)
  | 'imminent'         // ใกล้ถึงคิวมาก (เหลือน้อยกว่า 15 นาที)
  | 'approaching'      // ใกล้ถึงเวลา (เหลือ 15 - 30 นาที)
  | 'upcoming_today'   // นัดหมายวันนี้ (เหลือมากกว่า 30 นาที)
  | 'future_date'      // นัดหมายวันถัดไป
  | 'passed'           // ผ่านรอบเวลานัดแล้ว
  | 'cancelled';       // ยกเลิกแล้ว

export interface QueueProximityInfo {
  category: QueueProximityCategory;
  minutesRemaining: number;
  label: string;
  subLabel: string;
  badgeColor: string;
  isUrgent: boolean; // For flashing or high-priority alert
  shouldChime: boolean; // Triggers sound alert if enabled
}

/**
 * Calculate proximity status between current time and booking appointment
 * @param dateStr "YYYY-MM-DD"
 * @param timeSlotStr "09:00", "14:00", etc.
 * @param status "pending" | "confirmed" | "completed" | "cancelled"
 * @param overrideNow Optional date for unit testing or time simulation
 */
export function getQueueProximity(
  dateStr: string,
  timeSlotStr: string,
  status: string,
  overrideNow?: Date
): QueueProximityInfo {
  if (status === 'cancelled') {
    return {
      category: 'cancelled',
      minutesRemaining: 0,
      label: 'ยกเลิกนัดหมาย',
      subLabel: 'รายการนี้ถูกยกเลิกแล้ว',
      badgeColor: 'bg-stone-100 text-stone-500 border-stone-200',
      isUrgent: false,
      shouldChime: false,
    };
  }

  const now = overrideNow || new Date();
  const currentYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Check if booking is today
  const isToday = dateStr === currentYMD;

  if (!isToday) {
    if (dateStr > currentYMD) {
      return {
        category: 'future_date',
        minutesRemaining: 9999,
        label: 'นัดหมายล่วงหน้า',
        subLabel: `นัดหมายวันที่ ${dateStr}`,
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        isUrgent: false,
        shouldChime: false,
      };
    } else {
      return {
        category: 'passed',
        minutesRemaining: -9999,
        label: 'ผ่านรอบแล้ว',
        subLabel: 'ผ่านพ้นวันนัดหมายแล้ว',
        badgeColor: 'bg-stone-100 text-stone-500 border-stone-200',
        isUrgent: false,
        shouldChime: false,
      };
    }
  }

  // Calculate minutes remaining today
  const [slotHours, slotMinutes] = timeSlotStr.split(':').map(Number);
  const slotDate = new Date(now);
  slotDate.setHours(slotHours, slotMinutes, 0, 0);

  const diffMs = slotDate.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  // If slot was within the last 50 minutes, it's currently active / serving
  if (diffMinutes <= 0 && diffMinutes >= -50) {
    return {
      category: 'now_serving',
      minutesRemaining: diffMinutes,
      label: '⚡ ถึงคิวตรวจ/รับบริการแล้ว',
      subLabel: 'รอบเวลากำลังเปิดบริการ กรุณาติดต่อหน้าห้องตรวจทันที',
      badgeColor: 'bg-emerald-600 text-white border-emerald-700 animate-pulse',
      isUrgent: true,
      shouldChime: true,
    };
  }

  // If slot passed more than 50 minutes ago
  if (diffMinutes < -50) {
    return {
      category: 'passed',
      minutesRemaining: diffMinutes,
      label: 'ผ่านรอบแล้ว',
      subLabel: 'รอบเวลานี้สิ้นสุดแล้ว',
      badgeColor: 'bg-stone-100 text-stone-500 border-stone-200',
      isUrgent: false,
      shouldChime: false,
    };
  }

  // Imminent: Less than 15 minutes remaining
  if (diffMinutes <= 15) {
    return {
      category: 'imminent',
      minutesRemaining: diffMinutes,
      label: `🔔 ใกล้ถึงคิวมาก! (อีก ${diffMinutes} นาที)`,
      subLabel: 'กรุณาเตรียมตัวบริเวณหน้าห้องตรวจแพทย์แผนไทย',
      badgeColor: 'bg-rose-500 text-white border-rose-600 ring-2 ring-rose-300 animate-bounce',
      isUrgent: true,
      shouldChime: true,
    };
  }

  // Approaching: 16 to 30 minutes remaining
  if (diffMinutes <= 30) {
    return {
      category: 'approaching',
      minutesRemaining: diffMinutes,
      label: `⏰ ใกล้ถึงเวลา (อีก ${diffMinutes} นาที)`,
      subLabel: 'กรุณาเดินทางมาถึงคลินิก และวัดสัญญาณชีพ/ลงทะเบียน',
      badgeColor: 'bg-amber-500 text-white border-amber-600 shadow-sm',
      isUrgent: true,
      shouldChime: true,
    };
  }

  // Upcoming later today
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  const timeText = hours > 0 ? `${hours} ชม. ${mins} นาที` : `${mins} นาที`;

  return {
    category: 'upcoming_today',
    minutesRemaining: diffMinutes,
    label: `นัดหมายวันนี้ (อีก ${timeText})`,
    subLabel: `รอบเวลา ${timeSlotStr} น.`,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    isUrgent: false,
    shouldChime: false,
  };
}

/**
 * Play a hospital chime sound using Web Audio API (No external file needed)
 */
export function playHospitalQueueChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    const notes = [
      { freq: 523.25, time: 0, duration: 0.35 },    // C5
      { freq: 659.25, time: 0.25, duration: 0.35 }, // E5
      { freq: 783.99, time: 0.5, duration: 0.5 },   // G5
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      // Smooth attack & decay
      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + duration);
    });
  } catch (err) {
    console.warn('Audio playback not permitted or not supported:', err);
  }
}
