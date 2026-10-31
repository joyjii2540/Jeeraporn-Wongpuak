import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { CLINIC_SERVICES, CLINIC_STAFF, CLINIC_TIME_SLOTS } from './src/types/clinic.ts';
import { ClinicDB } from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API: Clinic Staff
app.get('/api/staff', (_req: Request, res: Response) => {
  res.json({ success: true, data: CLINIC_STAFF });
});

// API: Services
app.get('/api/services', (_req: Request, res: Response) => {
  res.json({ success: true, data: CLINIC_SERVICES });
});

// API: Time Slots
app.get('/api/time-slots', (_req: Request, res: Response) => {
  res.json({ success: true, data: CLINIC_TIME_SLOTS });
});

// API: Monthly Calendar Overview
app.get('/api/calendar/month', (req: Request, res: Response) => {
  const yearMonth = (req.query.month as string) || new Date().toISOString().substring(0, 7);
  const serviceId = req.query.serviceId as any;
  const data = ClinicDB.getMonthAvailability(yearMonth, serviceId);
  res.json({ success: true, data });
});

// API: Daily Calendar Details
app.get('/api/calendar/day', (req: Request, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().substring(0, 10);
  const data = ClinicDB.getDayDetails(date);
  res.json({ success: true, data });
});

// API: Daily Postpartum Care Quota Status (Max 2 cases per person per day)
app.get('/api/postpartum/status', (req: Request, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().substring(0, 10);
  const data = ClinicDB.getDailyPostpartumStatus(date);
  res.json({ success: true, data });
});

// API: Daily Herbal Sauna Quota Status (Max 3 cases per day clinic-wide)
app.get('/api/sauna/status', (req: Request, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().substring(0, 10);
  const data = ClinicDB.getDailySaunaStatus(date);
  res.json({ success: true, data });
});

// API: Staff Availability for a specific slot and service (for assistant selection)
app.get('/api/staff/availability', (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as any;
  const date = req.query.date as string;
  const time = req.query.time as string;
  const durationHours = Number(req.query.durationHours) || 1;

  if (!serviceId || !date || !time) {
    return res.status(400).json({ success: false, error: 'กรุณาระบุ serviceId, date และ time' });
  }

  const staffAvail = ClinicDB.getStaffAvailability(serviceId, date, time, durationHours);
  res.json({ success: true, data: staffAvail });
});

// API: Bookings list (with optional phone search)
app.get('/api/bookings', (req: Request, res: Response) => {
  const phone = req.query.phone as string;
  if (phone) {
    const list = ClinicDB.findBookingsByPhone(phone);
    return res.json({ success: true, data: list });
  }
  const all = ClinicDB.getAllBookings();
  res.json({ success: true, data: all });
});

// API: Create Booking (Strict validation + overbooking protection + 2-hour support + requested assistant)
app.post('/api/bookings', (req: Request, res: Response) => {
  const {
    patientName,
    patientPhone,
    patientIdCard,
    symptoms,
    serviceId,
    date,
    timeSlot,
    durationHours,
    notes,
    requestedStaffId,
  } = req.body;

  if (!patientName || !patientPhone || !symptoms || !serviceId || !date || !timeSlot) {
    return res.status(400).json({
      success: false,
      error: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, เบอร์โทรศัพท์, อาการเบื้องต้น, บริการ, วันที่, รอบเวลา)',
    });
  }

  const result = ClinicDB.createBooking({
    patientName,
    patientPhone,
    patientIdCard,
    symptoms,
    serviceId,
    date,
    timeSlot,
    durationHours: Number(durationHours) || 1,
    notes,
    requestedStaffId,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.status(201).json(result);
});

// API: Update Booking Status (Confirm / Cancel / Assign staff)
app.put('/api/bookings/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, assignedStaffId, notes, queueStatus } = req.body;

  if (!status && !queueStatus) {
    return res.status(400).json({ success: false, error: 'กรุณาระบุสถานะที่ต้องการเปลี่ยน' });
  }

  const current = ClinicDB.getBookingById(id);
  const targetStatus = status || current?.status || 'confirmed';

  const result = ClinicDB.updateBookingStatus(id, targetStatus, assignedStaffId, notes, queueStatus);
  if (!result.success) {
    return res.status(404).json(result);
  }

  res.json(result);
});

// API: Call Queue for Booking (Staff calls patient)
app.post('/api/bookings/:id/call', (req: Request, res: Response) => {
  const { id } = req.params;
  const result = ClinicDB.callBookingQueue(id);
  if (!result.success) {
    return res.status(404).json(result);
  }
  res.json(result);
});

// API: Bulk Confirm Sauna Group (3-person quota condition)
app.post('/api/bookings/sauna/confirm-group', (req: Request, res: Response) => {
  const { date, timeSlot } = req.body;
  if (!date || !timeSlot) {
    return res.status(400).json({ success: false, error: 'กรุณาระบุวันที่และรอบเวลาของห้องอบสมุนไพร' });
  }

  const result = ClinicDB.confirmSaunaGroup(date, timeSlot);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// API: Staff Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Demo credentials or any staff member login
  if (
    (username === 'admin' && password === 'admin1234') ||
    (username === 'staff' && password === 'clinic2026') ||
    (username === 'doctor' && password === 'thaiherb')
  ) {
    return res.json({
      success: true,
      token: `token_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      user: {
        id: 'admin_1',
        name: 'พท.ว. ชญานิศ (หัวหน้าคลินิกแพทย์แผนไทย)',
        role: 'admin',
        title: 'แพทย์แผนไทยวิชาชีพ',
      },
    });
  }

  return res.status(401).json({
    success: false,
    error: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง (ทดสอบ: admin / admin1234 หรือ staff / clinic2026)',
  });
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Clinic Master Calendar Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
