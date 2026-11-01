/**
 * Telegram Notification Service for Clinic Appointments
 * Sends real-time notifications for new bookings and cancellations.
 */

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  chatId: string;
  notifyOnNewBooking: boolean;
  notifyOnCancellation: boolean;
}

const STORAGE_KEY = 'panthai_ayhos_telegram_config_v1';

export const DEFAULT_TELEGRAM_CONFIG: TelegramConfig = {
  enabled: false,
  botToken: '',
  chatId: '',
  notifyOnNewBooking: true,
  notifyOnCancellation: true,
};

export function getTelegramConfig(): TelegramConfig {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_TELEGRAM_CONFIG;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_TELEGRAM_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Failed to read Telegram config:', err);
  }
  return DEFAULT_TELEGRAM_CONFIG;
}

export function saveTelegramConfig(config: TelegramConfig): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (err) {
      console.warn('Failed to save Telegram config:', err);
    }
  }
}

/**
 * Sends a Telegram message using the official Telegram Bot API
 */
export async function sendTelegramMessage(
  text: string,
  customConfig?: TelegramConfig
): Promise<{ success: boolean; error?: string }> {
  const config = customConfig || getTelegramConfig();

  if (!config.enabled && !customConfig) {
    return { success: false, error: 'Telegram notifications are disabled in settings' };
  }

  if (!config.botToken.trim() || !config.chatId.trim()) {
    return { success: false, error: 'Bot Token or Chat ID is missing' };
  }

  const cleanToken = config.botToken.trim();
  const cleanChatId = config.chatId.trim();
  const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json();
    if (data.ok) {
      return { success: true };
    }
    return {
      success: false,
      error: data.description || 'Failed to send message via Telegram Bot API',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error connecting to Telegram Bot API',
    };
  }
}

/**
 * Sends a notification for a newly created booking
 */
export async function notifyNewBookingTelegram(booking: {
  bookingCode: string;
  patientName: string;
  patientPhone: string;
  serviceName: string;
  date: string;
  timeSlot: string;
  durationHours?: number;
  assignedStaffName?: string;
  symptoms?: string;
  notes?: string;
}): Promise<void> {
  const config = getTelegramConfig();
  if (!config.enabled || !config.notifyOnNewBooking) return;

  const durationText = booking.durationHours === 2 ? '2 ชั่วโมง' : '1 ชั่วโมง';
  const staffText = booking.assignedStaffName || 'รอจัดสรรเจ้าหน้าที่';

  const message = [
    `🌿 <b>มีการจองคิวใหม่! (คลินิกการแพทย์แผนไทย)</b>`,
    `🏥 <i>ตึกแพทย์แผนไทย ศูนย์เวชปฏิบัติครอบครัว รพ.อยุธยา</i>`,
    `━━━━━━━━━━━━━━━━━━`,
    `🔖 <b>รหัสคิว:</b> <code>${booking.bookingCode}</code>`,
    `👤 <b>คนไข้:</b> ${booking.patientName}`,
    `📞 <b>เบอร์โทร:</b> ${booking.patientPhone}`,
    `🩺 <b>บริการ:</b> ${booking.serviceName}`,
    `🗓 <b>วันที่:</b> ${booking.date}`,
    `⏰ <b>รอบเวลา:</b> ${booking.timeSlot} น. (${durationText})`,
    `👩‍⚕️ <b>ผู้ช่วยผู้ดูแล:</b> ${staffText}`,
    booking.symptoms ? `📋 <b>อาการ:</b> ${booking.symptoms}` : '',
    booking.notes ? `📝 <b>หมายเหตุ:</b> ${booking.notes}` : '',
    `━━━━━━━━━━━━━━━━━━`,
    `⚡ <i>ระบบ Master Calendar ตรวจสอบสถานะแล้ว</i>`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await sendTelegramMessage(message, config);
  } catch (e) {
    console.error('Error sending Telegram new booking alert:', e);
  }
}

/**
 * Sends a notification when a booking is cancelled
 */
export async function notifyCancelledBookingTelegram(booking: {
  bookingCode: string;
  patientName: string;
  patientPhone?: string;
  serviceName: string;
  date: string;
  timeSlot: string;
  assignedStaffName?: string;
  reason?: string;
}): Promise<void> {
  const config = getTelegramConfig();
  if (!config.enabled || !config.notifyOnCancellation) return;

  const message = [
    `❌ <b>มีการยกเลิกคิวรับบริการ</b>`,
    `🏥 <i>ตึกแพทย์แผนไทย ศูนย์เวชปฏิบัติครอบครัว รพ.อยุธยา</i>`,
    `━━━━━━━━━━━━━━━━━━`,
    `🔖 <b>รหัสคิว:</b> <code>${booking.bookingCode}</code>`,
    `👤 <b>คนไข้:</b> ${booking.patientName}`,
    `🩺 <b>บริการ:</b> ${booking.serviceName}`,
    `🗓 <b>วันที่:</b> ${booking.date} เวลา ${booking.timeSlot} น.`,
    booking.assignedStaffName ? `👩‍⚕️ <b>ผู้ช่วยเดิม:</b> ${booking.assignedStaffName}` : '',
    booking.reason ? `⚠️ <b>สาเหตุ:</b> ${booking.reason}` : '',
    `━━━━━━━━━━━━━━━━━━`,
    `🟢 <i>คิวว่างในรอบเวลานี้เพิ่มขึ้น 1 คิว พร้อมให้คนไข้อื่นจองได้</i>`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await sendTelegramMessage(message, config);
  } catch (e) {
    console.error('Error sending Telegram cancellation alert:', e);
  }
}
