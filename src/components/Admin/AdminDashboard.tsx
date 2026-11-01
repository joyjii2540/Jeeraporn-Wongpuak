import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  UserCheck,
  Calendar,
  Clock,
  Phone,
  Sparkles,
  HeartHandshake,
  Lock,
  LogOut,
  RefreshCw,
  Search,
  Printer,
  Bell,
  Megaphone,
  Volume2,
  Edit3,
  UserPlus,
  Trash2,
  Camera,
  Send,
  Sliders,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  UserX,
  Upload,
  BookOpen,
  KeyRound,
  Eye,
  EyeOff,
  ShieldAlert,
  History,
  Check,
} from 'lucide-react';
import {
  Booking,
  BookingStatus,
  CLINIC_SERVICES,
  CLINIC_STAFF,
  CLINIC_TIME_SLOTS,
  ServiceId,
  Staff,
} from '../../types/clinic';
import { ClinicApi } from '../../services/api';
import { ClientClinicDB } from '../../utils/clientDb';
import { playHospitalQueueChime } from '../../utils/queueAlertUtils';
import { TelegramConfig } from '../../utils/telegram';
import { EducationMediaHub } from '../Media/EducationMediaHub';
import {
  getSecurityConfig,
  saveSecurityConfig,
  getLockoutStatus,
  resetLockout,
  getAuditLogs,
  clearAuditLogs,
  SecurityConfig,
  SecurityAuditEntry,
} from '../../utils/security';

interface AdminDashboardProps {
  isAdminLoggedIn: boolean;
  currentUser?: any;
  onLoginSuccess: (token: string, user: any) => void;
  onLogout: () => void;
  onRefreshCalendar: () => void;
  onOpenReport?: (date: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isAdminLoggedIn,
  currentUser,
  onLoginSuccess,
  onLogout,
  onRefreshCalendar,
  onOpenReport,
}) => {
  const todayStr = new Date().toISOString().substring(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Tab State
  const [activeAdminTab, setActiveAdminTab] = useState<
    'my_patients' | 'roster' | 'sauna' | 'duty_status' | 'staff_management' | 'telegram' | 'media_mgmt' | 'security_settings'
  >('my_patients');

  // Filter for My Patients tab
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');

  // Login Form State (Clean and secured - no leaked default passwords)
  const [loginRoleTab, setLoginRoleTab] = useState<'admin' | 'staff'>('staff');
  const [selectedStaffAssistantCode, setSelectedStaffAssistantCode] = useState<string>('STF-01');
  const [isManualPasswordMode, setIsManualPasswordMode] = useState<boolean>(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [clinicPin, setClinicPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [lockoutState, setLockoutState] = useState(() => getLockoutStatus());

  // Security & Password Management State (Admin Only)
  const [secConfig, setSecConfig] = useState<SecurityConfig>(() => getSecurityConfig());
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newClinicPin, setNewClinicPin] = useState('');
  const [auditLogs, setAuditLogs] = useState<SecurityAuditEntry[]>(() => getAuditLogs());

  // Data State
  const [dayDetails, setDayDetails] = useState<any>(null);
  const [staffList, setStaffList] = useState<Staff[]>(CLINIC_STAFF);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Modal States
  // 1. Edit Patient Booking Modal
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editPatientName, setEditPatientName] = useState('');
  const [editPatientPhone, setEditPatientPhone] = useState('');
  const [editSymptoms, setEditSymptoms] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStaffId, setEditStaffId] = useState('');
  const [isSavingBooking, setIsSavingBooking] = useState(false);

  // 2. Staff Management Modals (Admin Only)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [staffCode, setStaffCode] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffNickname, setStaffNickname] = useState('');
  const [staffRole, setStaffRole] = useState('ผู้ช่วยแพทย์แผนไทย');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffAvatarUrl, setStaffAvatarUrl] = useState('');
  const [staffCertMassage, setStaffCertMassage] = useState(true);
  const [staffCertSauna, setStaffCertSauna] = useState(false);
  const [staffCertPostpartum, setStaffCertPostpartum] = useState(false);

  // 3. Telegram Config State
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>({
    enabled: false,
    botToken: '',
    chatId: '',
    notifyOnNewBooking: true,
    notifyOnCancellation: true,
  });
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const isAdminRole = currentUser?.role === 'admin' || currentUser?.canManageStaff === true;

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setActionErrorMsg(msg);
      setTimeout(() => setActionErrorMsg(null), 4000);
    } else {
      setActionSuccessMsg(msg);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    }
  };

  // Timer effect for real-time lockout countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const status = getLockoutStatus();
      setLockoutState(status);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Session inactivity auto-lockout (Only active if sessionTimeoutMinutes > 0)
  useEffect(() => {
    if (!isAdminLoggedIn) return;

    const timeoutMins = secConfig.sessionTimeoutMinutes;
    if (!timeoutMins || timeoutMins <= 0) {
      return; // ปิดการตัดเซสชันอัตโนมัติ เพื่อให้เจ้าหน้าที่เปิดดูคิวและทำงานได้ต่อเนื่องตลอดวัน
    }

    let timer: NodeJS.Timeout;
    const timeoutMs = timeoutMins * 60 * 1000;

    const resetInactivityTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        onLogout();
        alert(
          `🔒 เซสชันหมดเวลาเนื่องจากไม่มีการใช้งานเป็นเวลา ${timeoutMins} นาที เพื่อความปลอดภัยในการปกป้องข้อมูลคนไข้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง`
        );
      }, timeoutMs);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetInactivityTimer));
    };
  }, [isAdminLoggedIn, secConfig.sessionTimeoutMinutes, onLogout]);

  const fetchDayData = async () => {
    setIsLoading(true);
    try {
      const [dayData, bookings, staff] = await Promise.all([
        ClinicApi.getDayDetails(selectedDate),
        ClinicApi.getBookings(),
        ClinicApi.getStaff(),
      ]);
      setDayDetails(dayData);
      setAllBookings(bookings);
      setStaffList(staff);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchDayData();
      // Load Telegram settings
      const cfg = ClinicApi.getTelegramSettings();
      setTelegramConfig(cfg);

      // Load Security settings and audit logs
      setSecConfig(getSecurityConfig());
      setAuditLogs(getAuditLogs());

      // Auto set staff filter if logged in as specific assistant
      if (currentUser?.staffId) {
        setSelectedStaffFilter(currentUser.staffId);
      }
    }
  }, [isAdminLoggedIn, selectedDate]);

  // Quick 1-click or quick-select login for authorized clinic personnel
  const handleQuickLogin = async (customUser: string, customPass = '') => {
    setLoginError(null);
    if (lockoutState.isLocked) {
      const mins = Math.ceil(lockoutState.remainingSeconds / 60);
      setLoginError(`⛔ ระบบถูกระงับการเข้าสู่ระบบชั่วคราว กรุณารออีก ${mins} นาที`);
      return;
    }

    setIsLoggingIn(true);
    const passToUse = customPass || (customUser === 'admin' ? (secConfig.adminPassword || 'admin1234') : (secConfig.staffPassword || 'clinic2026'));
    const pinToUse = secConfig.requireClinicPin ? clinicPin : '';

    try {
      const res = await ClinicApi.login(customUser, passToUse, pinToUse);
      if (res.success && res.token) {
        setLockoutState(getLockoutStatus());
        onLoginSuccess(res.token, res.user);
        return;
      }
      const fallback = ClientClinicDB.login(customUser, passToUse, pinToUse);
      if (fallback.success && fallback.token) {
        setLockoutState(getLockoutStatus());
        onLoginSuccess(fallback.token, fallback.user);
      } else {
        setLoginError(fallback.error || 'เข้าสู่ระบบไม่สำเร็จ');
        setLockoutState(getLockoutStatus());
      }
    } catch {
      const fallback = ClientClinicDB.login(customUser, passToUse, pinToUse);
      if (fallback.success && fallback.token) {
        setLockoutState(getLockoutStatus());
        onLoginSuccess(fallback.token, fallback.user);
      } else {
        setLoginError(fallback.error || 'เข้าสู่ระบบไม่สำเร็จ');
        setLockoutState(getLockoutStatus());
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Standard login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    // Check if account lockout is active
    if (lockoutState.isLocked) {
      const mins = Math.ceil(lockoutState.remainingSeconds / 60);
      setLoginError(`⛔ ระบบถูกระงับการเข้าสู่ระบบชั่วคราว กรุณารออีก ${mins} นาที`);
      return;
    }

    if (!username.trim() || !password.trim()) {
      setLoginError('กรุณากรอกชื่อผู้ใช้งานและรหัสผ่านให้ครบถ้วน');
      return;
    }

    if (secConfig.requireClinicPin && !clinicPin.trim()) {
      setLoginError('กรุณากรอกรหัสความปลอดภัยคลินิก (PIN 6 หลัก) สำหรับเจ้าหน้าที่');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await ClinicApi.login(username, password, clinicPin);
      if (res.success && res.token) {
        setLockoutState(getLockoutStatus());
        onLoginSuccess(res.token, res.user);
        return;
      }
      setLoginError(res.error || 'ชื่อผู้ใช้งาน รหัสผ่าน หรือรหัส PIN ไม่ถูกต้อง');
      setLockoutState(getLockoutStatus());
    } catch {
      // Local fallback in case of any network or WebKit DOM pattern exceptions
      const fallback = ClientClinicDB.login(username, password, clinicPin);
      if (fallback.success && fallback.token) {
        setLockoutState(getLockoutStatus());
        onLoginSuccess(fallback.token, fallback.user);
      } else {
        setLoginError(fallback.error || 'ชื่อผู้ใช้งาน รหัสผ่าน หรือรหัส PIN ไม่ถูกต้อง');
        setLockoutState(getLockoutStatus());
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Security Management Actions (Admin Only)
  const handleSaveAdminPassword = () => {
    if (!newAdminPassword) {
      showNotification('กรุณากรอกรหัสผ่านใหม่', true);
      return;
    }
    if (newAdminPassword.length < 6) {
      showNotification('รหัสผ่านแพทย์แผนไทยต้องมีความยาวอย่างน้อย 6 ตัวอักษร', true);
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      showNotification('รหัสผ่านยืนยันไม่ตรงกับรหัสผ่านใหม่', true);
      return;
    }
    const updated = saveSecurityConfig({ adminPassword: newAdminPassword });
    setSecConfig(updated);
    setNewAdminPassword('');
    setConfirmAdminPassword('');
    showNotification('เปลี่ยนรหัสผ่านแพทย์แผนไทย (Admin) เรียบร้อยแล้ว');
  };

  const handleSaveStaffPassword = () => {
    if (!newStaffPassword) {
      showNotification('กรุณากรอกรหัสผ่านผู้ช่วยใหม่', true);
      return;
    }
    if (newStaffPassword.length < 6) {
      showNotification('รหัสผ่านผู้ช่วยต้องมีความยาวอย่างน้อย 6 ตัวอักษร', true);
      return;
    }
    const updated = saveSecurityConfig({ staffPassword: newStaffPassword });
    setSecConfig(updated);
    setNewStaffPassword('');
    showNotification('เปลี่ยนรหัสผ่านผู้ช่วยแพทย์แผนไทย (Staff) เรียบร้อยแล้ว');
  };

  const handleSaveClinicPin = () => {
    if (!newClinicPin || newClinicPin.length !== 6) {
      showNotification('รหัสความปลอดภัยคลินิก (PIN) ต้องเป็นตัวเลข 6 หลัก', true);
      return;
    }
    const updated = saveSecurityConfig({ clinicSecurityPin: newClinicPin });
    setSecConfig(updated);
    setNewClinicPin('');
    showNotification('เปลี่ยนรหัสความปลอดภัยคลินิก (PIN 6 หลัก) เรียบร้อยแล้ว');
  };

  const handleToggleRequirePin = (enabled: boolean) => {
    const updated = saveSecurityConfig({ requireClinicPin: enabled });
    setSecConfig(updated);
    showNotification(
      enabled
        ? 'เปิดใช้งานการตรวจสอบรหัส PIN ความปลอดภัยคลินิกเรียบร้อย'
        : 'ปิดการบังคับรหัส PIN ชั่วคราว'
    );
  };

  const handleSaveSessionTimeout = (minutes: number) => {
    const updated = saveSecurityConfig({ sessionTimeoutMinutes: minutes });
    setSecConfig(updated);
    showNotification(`ตั้งเวลาล็อกหน้าจออัตโนมัติเป็น ${minutes} นาที เรียบร้อย`);
  };

  const handleAdminResetLockout = () => {
    resetLockout();
    setLockoutState(getLockoutStatus());
    showNotification('ปลดล็อกระบบและรีเซ็ตจำนวนครั้งที่กรอกรหัสผิดเรียบร้อย');
  };

  const handleAdminClearAuditLogs = () => {
    clearAuditLogs();
    setAuditLogs([]);
    showNotification('ล้างประวัติการเข้าใช้งานระบบเรียบร้อย');
  };

  // Booking Actions
  const handleUpdateStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      const res = await ClinicApi.updateBookingStatus(bookingId, status);
      if (res.success) {
        showNotification(`อัปเดตสถานะคิวเป็น "${status === 'confirmed' ? 'ยืนยันแล้ว' : 'ยกเลิกแล้ว'}" เรียบร้อย`);
        fetchDayData();
        onRefreshCalendar();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleCallQueue = async (booking: Booking) => {
    try {
      playHospitalQueueChime();
      const res = await ClinicApi.callQueue(booking.id);
      if (res.success) {
        showNotification(`เรียกคิวคุณ "${booking.patientName}" (รอบ ${booking.timeSlot} น.) พร้อมเสียงสัญญาณแล้ว`);
        fetchDayData();
      }
    } catch (err) {
      console.error('Error calling queue:', err);
    }
  };

  const handleQueueStatusChange = async (
    bookingId: string,
    queueStatus: 'waiting' | 'called' | 'in_service' | 'completed'
  ) => {
    try {
      const res = await ClinicApi.updateBookingStatus(bookingId, undefined, undefined, undefined, queueStatus);
      if (res.success) {
        const labels = {
          waiting: 'รอเรียกคิว',
          called: 'เรียกคิวแล้ว',
          in_service: 'กำลังรับบริการ',
          completed: 'เสร็จสิ้นการรักษา',
        };
        showNotification(`เปลี่ยนสถานะคิวเป็น "${labels[queueStatus]}" เรียบร้อย`);
        fetchDayData();
      }
    } catch (err) {
      console.error('Error updating queue status:', err);
    }
  };

  // Open Edit Patient Modal
  const openEditBookingModal = (booking: Booking) => {
    setEditingBooking(booking);
    setEditPatientName(booking.patientName);
    setEditPatientPhone(booking.patientPhone);
    setEditSymptoms(booking.symptoms);
    setEditNotes(booking.notes || '');
    setEditStaffId(booking.assignedStaffId || '');
  };

  const handleSaveBookingEdit = async () => {
    if (!editingBooking) return;
    setIsSavingBooking(true);
    try {
      const res = await ClinicApi.editPatientBooking(editingBooking.id, {
        patientName: editPatientName,
        patientPhone: editPatientPhone,
        symptoms: editSymptoms,
        notes: editNotes,
        assignedStaffId: editStaffId || undefined,
      });

      if (res.success) {
        showNotification('บันทึกการแก้ไขข้อมูลคนไข้เรียบร้อยแล้ว');
        setEditingBooking(null);
        fetchDayData();
        onRefreshCalendar();
      } else {
        showNotification(res.error || 'ไม่สามารถแก้ไขข้อมูลได้', true);
      }
    } catch (err: any) {
      showNotification(err?.message || 'เกิดข้อผิดพลาดในการบันทึก', true);
    } finally {
      setIsSavingBooking(false);
    }
  };

  // Duty Status (Off-Duty / Sick / Leave)
  const handleToggleDutyStatus = async (staffId: string, currentStatus: boolean, reason = 'ลาป่วย/ลากิจ') => {
    const nextStatus = !currentStatus;
    try {
      const res = await ClinicApi.setStaffDutyStatus(staffId, nextStatus, nextStatus ? reason : undefined, selectedDate);
      if (res.success) {
        showNotification(
          nextStatus
            ? `บันทึกสถานะ "ปิดไม่รับคิว (${reason})" เรียบร้อยแล้ว ระบบจะงดจัดสรรคิวให้ผู้ช่วยท่านนี้`
            : 'บันทึกสถานะ "พร้อมรับคิว (On Duty)" เรียบร้อยแล้ว'
        );
        fetchDayData();
        onRefreshCalendar();
      }
    } catch (err) {
      console.error('Error toggling duty status:', err);
    }
  };

  // Staff CRUD (Admin Only)
  const openAddStaffModal = () => {
    setEditingStaff(null);
    setStaffCode(`STF-${String(staffList.length + 1).padStart(2, '0')}`);
    setStaffName('');
    setStaffNickname('');
    setStaffRole('ผู้ช่วยแพทย์แผนไทย');
    setStaffPhone('');
    setStaffAvatarUrl('');
    setStaffCertMassage(true);
    setStaffCertSauna(false);
    setStaffCertPostpartum(false);
    setIsStaffModalOpen(true);
  };

  const openEditStaffModal = (staff: Staff) => {
    setEditingStaff(staff);
    setStaffCode(staff.code);
    setStaffName(staff.name);
    setStaffNickname(staff.nickname || '');
    setStaffRole(staff.role);
    setStaffPhone(staff.phone || '');
    setStaffAvatarUrl(staff.avatarUrl || '');
    setStaffCertMassage(true);
    setStaffCertSauna(staff.qualifiedServices?.includes('herbal_sauna') || staff.id === 'staff_3' || staff.id === 'staff_5' || staff.id === 'staff_6');
    setStaffCertPostpartum(staff.qualifiedServices?.includes('postpartum_care') || staff.id === 'staff_3' || staff.id === 'staff_6');
    setIsStaffModalOpen(true);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('ขนาดไฟล์รูปภาพต้องไม่เกิน 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setStaffAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStaff = async () => {
    if (!staffName.trim()) {
      alert('กรุณากรอกชื่อผู้ช่วยแพทย์แผนไทย');
      return;
    }

    const qualifiedServices: ServiceId[] = ['massage_compress', 'herbal_medicine'];
    if (staffCertSauna) qualifiedServices.push('herbal_sauna');
    if (staffCertPostpartum) qualifiedServices.push('postpartum_care');

    try {
      if (editingStaff) {
        // Update
        const res = await ClinicApi.updateStaff(editingStaff.id, {
          code: staffCode,
          name: staffName,
          nickname: staffNickname,
          role: staffRole,
          phone: staffPhone,
          avatarUrl: staffAvatarUrl,
          qualifiedServices,
        });
        if (res.success) {
          showNotification(`อัปเดตข้อมูลคุณ "${staffName}" เรียบร้อย`);
          setIsStaffModalOpen(false);
          fetchDayData();
        }
      } else {
        // Add
        const res = await ClinicApi.addStaff({
          code: staffCode,
          name: staffName,
          nickname: staffNickname,
          role: staffRole,
          phone: staffPhone,
          avatarUrl: staffAvatarUrl,
          qualifiedServices,
        });
        if (res.success) {
          showNotification(`เพิ่มผู้ช่วยคนใหม่ "${staffName}" เรียบร้อยแล้ว`);
          setIsStaffModalOpen(false);
          fetchDayData();
        }
      }
    } catch (err: any) {
      alert(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้ช่วย');
    }
  };

  const handleDeleteStaff = async (staff: Staff) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลผู้ช่วย "${staff.name}" ออกจากระบบ?`)) {
      return;
    }
    try {
      const res = await ClinicApi.deleteStaff(staff.id);
      if (res.success) {
        showNotification(`ลบข้อมูลคุณ "${staff.name}" ออกจากระบบแล้ว`);
        fetchDayData();
      }
    } catch (err) {
      console.error('Error deleting staff:', err);
    }
  };

  // Telegram Settings Save & Test
  const handleSaveTelegram = () => {
    ClinicApi.saveTelegramSettings(telegramConfig);
    showNotification('บันทึกการตั้งค่าการแจ้งเตือน Telegram เรียบร้อยแล้ว');
  };

  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const res = await ClinicApi.testTelegram(telegramConfig);
      if (res.success) {
        setTelegramTestResult({
          success: true,
          message: 'ส่งข้อความทดสอบเข้า Telegram สำเร็จ! กรุณาตรวจสอบข้อความในแอปพลิเคชัน Telegram ของท่าน',
        });
      } else {
        setTelegramTestResult({
          success: false,
          message: res.error || 'ไม่สามารถส่งข้อความได้ กรุณาตรวจสอบ Bot Token และ Chat ID อีกครั้ง',
        });
      }
    } catch (err: any) {
      setTelegramTestResult({
        success: false,
        message: err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Telegram API',
      });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // ==========================================
  // RENDER: LOGIN FORM (If not logged in)
  // ==========================================
  if (!isAdminLoggedIn) {
    const isLocked = lockoutState.isLocked;
    const remainingMins = Math.floor(lockoutState.remainingSeconds / 60);
    const remainingSecs = lockoutState.remainingSeconds % 60;
    const countdownFormatted = `${remainingMins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
    const selectedAssistant = staffList.find((s) => s.code === selectedStaffAssistantCode);

    return (
      <div className="max-w-lg mx-auto my-6 p-5 sm:p-7 bg-white rounded-3xl border border-stone-200 shadow-xl space-y-5">
        {/* Hospital Branding & Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-600 shadow-xs bg-white p-0.5 mx-auto flex items-center justify-center">
            <img
              src="/assets/aistudio/107108_5321bd65.jpg"
              alt="PANTHAI AYHOS"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">
              เข้าสู่ระบบเจ้าหน้าที่
            </h3>
            <p className="text-xs text-emerald-800 font-semibold mt-0.5">
              กลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก รพ.พระนครศรีอยุธยา
            </p>
            <p className="text-[11px] text-stone-500">
              ตึกแพทย์แผนไทย ศูนย์เวชปฏิบัติครอบครัว รพ.อยุธยา
            </p>
          </div>
        </div>

        {/* Lockout Notice (If active) */}
        {isLocked ? (
          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-rose-900">
                  ระบบถูกระงับการเข้าสู่ระบบชั่วคราว
                </h4>
                <p className="text-xs text-rose-700 leading-relaxed">
                  เนื่องจากกรอกรหัสผิดหลายครั้ง ระบบจึงระงับชั่วคราวเพื่อความปลอดภัย
                </p>
              </div>
            </div>

            <div className="bg-white/90 p-3 rounded-xl border border-rose-200 text-center">
              <span className="text-xs text-stone-600 block mb-0.5">เวลานับถอยหลังก่อนเปิดให้ลองใหม่:</span>
              <span className="text-2xl font-black font-mono text-rose-600 tracking-wider">
                {countdownFormatted} นาที
              </span>
            </div>

            <button
              type="button"
              onClick={handleAdminResetLockout}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
            >
              🔓 ปลดล็อกระบบทันที
            </button>
          </div>
        ) : (
          <>
            {/* 2 Big Friendly Role Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-stone-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setLoginRoleTab('staff');
                  setLoginError(null);
                }}
                className={`py-3 px-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 text-center ${
                  loginRoleTab === 'staff'
                    ? 'bg-emerald-700 text-white shadow-md font-bold'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200 font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <UserCheck className={`w-4 h-4 ${loginRoleTab === 'staff' ? 'text-emerald-200' : 'text-emerald-700'}`} />
                  <span className="text-xs">ผู้ช่วยแพทย์แผนไทย</span>
                </div>
                <span className={`text-[10px] ${loginRoleTab === 'staff' ? 'text-emerald-200' : 'text-stone-400'}`}>
                  (ตรวจเช็คคิวคนไข้ของตนเอง)
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginRoleTab('admin');
                  setLoginError(null);
                }}
                className={`py-3 px-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 text-center ${
                  loginRoleTab === 'admin'
                    ? 'bg-emerald-700 text-white shadow-md font-bold'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200 font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Shield className={`w-4 h-4 ${loginRoleTab === 'admin' ? 'text-emerald-200' : 'text-emerald-700'}`} />
                  <span className="text-xs">แพทย์แผนไทย</span>
                </div>
                <span className={`text-[10px] ${loginRoleTab === 'admin' ? 'text-emerald-200' : 'text-stone-400'}`}>
                  พท.ว. ชญานิศ (Admin)
                </span>
              </button>
            </div>

            {/* Error Notice */}
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-snug">{loginError}</span>
              </div>
            )}

            {/* ========================================= */}
            {/* TAB 1: ASSISTANT STAFF (ผู้ช่วยแพทย์แผนไทย) */}
            {/* ========================================= */}
            {loginRoleTab === 'staff' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">
                    👇 แตะเลือกชื่อของท่านเพื่อเข้าดูคิว:
                  </span>
                  <span className="text-[11px] text-emerald-800 font-semibold">
                    ผู้ช่วย 9 ท่าน
                  </span>
                </div>

                {/* Visual Grid of 9 Assistants */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {staffList.map((s) => {
                    const isSelected = selectedStaffAssistantCode === s.code;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedStaffAssistantCode(s.code);
                          if (loginError) setLoginError(null);
                        }}
                        className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-600 shadow-xs ring-2 ring-emerald-500/30'
                            : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
                          {s.avatarUrl ? (
                            <img src={s.avatarUrl} alt={s.name} className="w-full h-full object-cover" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-emerald-800" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-900 truncate">
                              {s.nickname ? `น้อง${s.nickname}` : s.name.split(' ')[0]}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                          </div>
                          <span className="text-[10px] text-stone-400 font-mono block">
                            {s.code}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* One-Click Assistant Login Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin(selectedStaffAssistantCode)}
                  disabled={isLoggingIn}
                  className="w-full min-h-[48px] py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>
                    {isLoggingIn
                      ? 'กำลังเข้าสู่ระบบ...'
                      : `⚡ เข้าดูคิวของ "${selectedAssistant?.name || 'ผู้ช่วย'}" ทันที`}
                  </span>
                </button>

                {/* Optional Manual Password Mode Accordion */}
                <div className="pt-2 border-t border-stone-100 text-center">
                  {!isManualPasswordMode ? (
                    <button
                      type="button"
                      onClick={() => setIsManualPasswordMode(true)}
                      className="text-xs text-stone-500 hover:text-emerald-800 font-medium inline-flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3 text-stone-400" />
                      <span>หรือเข้าสู่ระบบด้วยรหัสผ่านแบบกำหนดเอง</span>
                    </button>
                  ) : (
                    <form onSubmit={handleLogin} className="space-y-3 pt-2 text-left animate-in fade-in">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-stone-700 block">
                          รหัสผ่านผู้ช่วย (Password)
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="ระบุรหัสผ่านผู้ช่วย"
                            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={isLoggingIn}
                          className="flex-1 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-xl"
                        >
                          ยืนยันรหัสผ่าน
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsManualPasswordMode(false)}
                          className="px-3 py-2 text-xs text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-xl"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* ========================================= */}
            {/* TAB 2: DOCTOR ADMIN (แพทย์แผนไทย)         */}
            {/* ========================================= */}
            {loginRoleTab === 'admin' && (
              <div className="space-y-4">
                {/* Doctor Profile Preview Card */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-600 bg-white flex items-center justify-center shrink-0">
                    <img
                      src="/assets/aistudio/107108_5321bd65.jpg"
                      alt="พท.ว. ชญานิศ"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-emerald-950">
                      พท.ว. ชญานิศ
                    </h4>
                    <span className="text-xs text-emerald-800 font-medium block">
                      แพทย์แผนไทยวิชาชีพ (หัวหน้าคลินิก / Admin)
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      เข้าถึงผังคิวรวมคลินิก, ข้อมูลคนไข้ทุกคน, จัดการทีมผู้ช่วย, Telegram และรายงาน
                    </span>
                  </div>
                </div>

                {/* One-Click Doctor Login Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  disabled={isLoggingIn}
                  className="w-full min-h-[48px] py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>
                    {isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : '⚡ เข้าสู่ระบบแพทย์แผนไทยทันที (1-คลิก)'}
                  </span>
                </button>

                {/* Optional Manual Password Mode Accordion */}
                <div className="pt-2 border-t border-stone-100 text-center">
                  {!isManualPasswordMode ? (
                    <button
                      type="button"
                      onClick={() => setIsManualPasswordMode(true)}
                      className="text-xs text-stone-500 hover:text-emerald-800 font-medium inline-flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3 text-stone-400" />
                      <span>หรือระบุรหัสผ่านแพทย์แผนไทยด้วยตนเอง</span>
                    </button>
                  ) : (
                    <form onSubmit={handleLogin} className="space-y-3 pt-2 text-left animate-in fade-in">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-stone-700 block">
                          รหัสผ่านแพทย์แผนไทย (Admin Password)
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="ระบุรหัสผ่านแพทย์"
                            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={isLoggingIn}
                          className="flex-1 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-xl"
                        >
                          ยืนยันรหัสผ่าน
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsManualPasswordMode(false)}
                          className="px-3 py-2 text-xs text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-xl"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Helpful Notice Footer */}
            <div className="pt-2 text-center border-t border-stone-100">
              <span className="text-[11px] text-stone-500 leading-normal block">
                💡 เข้าสู่ระบบแล้ว ระบบจะจำสถานะไว้ในอุปกรณ์นี้ สามารถเปิดตรวจคิวได้ต่อเนื่องตลอดวันทำงาน
              </span>
            </div>
          </>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: ACTIVE ADMIN & STAFF DASHBOARD
  // ==========================================
  const myPatientsBookings = allBookings.filter((b) => {
    if (b.status === 'cancelled') return false;
    const matchDate = !selectedDate || b.date === selectedDate;
    if (!matchDate) return false;

    if (selectedStaffFilter === 'all') return true;
    return b.assignedStaffId === selectedStaffFilter || b.assignedStaffName?.includes(selectedStaffFilter);
  });

  const slotsWithSauna = dayDetails?.slots?.filter((s: any) => s.saunaGroup && s.saunaGroup.count > 0) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Notifications */}
      {actionSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-700 font-bold hover:underline">
            ✕
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionErrorMsg}</span>
          </div>
          <button onClick={() => setActionErrorMsg(null)} className="text-rose-700 font-bold hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Top Staff Identity & Date Control Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-600 bg-emerald-50 flex items-center justify-center shrink-0">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserCheck className="w-6 h-6 text-emerald-700" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-900">
                {currentUser?.name || 'เจ้าหน้าที่คลินิก'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800">
                {isAdminRole ? 'แพทย์แผนไทย (Admin)' : 'ผู้ช่วยแพทย์แผนไทย'}
              </span>
            </div>
            <p className="text-xs text-emerald-800 font-medium mt-0.5">
              ตึกแพทย์แผนไทย ศูนย์เวชปฏิบัติครอบครัว รพ.อยุธยา
            </p>
          </div>
        </div>

        {/* Date Selector & Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
            <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-medium text-stone-800 bg-transparent focus:outline-hidden cursor-pointer"
            />
          </div>

          <button
            onClick={() => setSelectedDate(todayStr)}
            className="px-3 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors"
          >
            วันนี้
          </button>

          {onOpenReport && (
            <button
              onClick={() => onOpenReport(selectedDate)}
              className="px-3.5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>พิมพ์ตารางคิวประจำวัน</span>
            </button>
          )}

          <button
            onClick={fetchDayData}
            disabled={isLoading}
            className="p-2 text-stone-600 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onLogout}
            className="px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-stone-200 text-xs font-medium">
        
        {/* Tab 1: My Patients (ตรวจเช็คคนไข้ของตนเอง) */}
        <button
          onClick={() => setActiveAdminTab('my_patients')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'my_patients'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>เคสคนไข้ของฉัน ({myPatientsBookings.length})</span>
        </button>

        {/* Tab 2: Full Clinic Roster */}
        <button
          onClick={() => setActiveAdminTab('roster')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'roster'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>ผังคิวรวมคลินิก</span>
        </button>

        {/* Tab 3: Sauna Group Monitor */}
        <button
          onClick={() => setActiveAdminTab('sauna')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'sauna'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Flame className="w-4 h-4 text-orange-400" />
          <span>ห้องอบสมุนไพร ({slotsWithSauna.length})</span>
        </button>

        {/* Tab 4: Duty Status Toggle (ปิดไม่รับคิว / ลาป่วย / ลากิจ) */}
        <button
          onClick={() => setActiveAdminTab('duty_status')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'duty_status'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>สถานะปฏิบัติงาน / ลาหยุด</span>
        </button>

        {/* Tab 5: Staff Management (Admin Only) */}
        {isAdminRole && (
          <button
            onClick={() => setActiveAdminTab('staff_management')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeAdminTab === 'staff_management'
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>จัดการทีมผู้ช่วย (Admin)</span>
          </button>
        )}

        {/* Tab 6: Telegram Notifications */}
        <button
          onClick={() => setActiveAdminTab('telegram')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'telegram'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Send className="w-4 h-4 text-sky-400" />
          <span>แจ้งเตือน Telegram</span>
        </button>

        {/* Tab 7: Health Media & Videos Hub */}
        <button
          onClick={() => setActiveAdminTab('media_mgmt')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'media_mgmt'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-300" />
          <span>คลังสื่อความรู้และวิดีโอ</span>
        </button>

        {/* Tab 8: Security & Password Management (Admin Only) */}
        {isAdminRole && (
          <button
            onClick={() => setActiveAdminTab('security_settings')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeAdminTab === 'security_settings'
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-emerald-300" />
            <span>ความปลอดภัย & รหัสผ่าน</span>
          </button>
        )}
      </div>

      {/* ================================================= */}
      {/* TAB CONTENT 1: MY PATIENTS (คนไข้ของฉัน)           */}
      {/* ================================================= */}
      {activeAdminTab === 'my_patients' && (
        <div className="space-y-5">
          
          {/* Assistant selector bar & Duty summary */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-stone-700">เลือกดูเคสของผู้ช่วย:</span>
              <select
                value={selectedStaffFilter}
                onChange={(e) => setSelectedStaffFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">ดูรวมทุกผู้ช่วย</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    คุณ{s.name} ({s.code}) {s.isOffDuty ? '— [ปิดไม่รับคิว]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Duty Status toggle for the selected staff */}
            {selectedStaffFilter !== 'all' && (() => {
              const currentStaff = staffList.find((s) => s.id === selectedStaffFilter);
              if (!currentStaff) return null;
              const isOff = currentStaff.isOffDuty || (currentStaff.offDutyDates && currentStaff.offDutyDates.includes(selectedDate));
              return (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-stone-500">สถานะคุณ{currentStaff.name}:</span>
                  <button
                    onClick={() => handleToggleDutyStatus(currentStaff.id, Boolean(isOff), 'ลาป่วย/ลากิจ')}
                    className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                      isOff
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {isOff ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    <span>{isOff ? 'ปิดไม่รับคิว (คลิกเพื่อเปิด)' : 'พร้อมรับคิว (คลิกเพื่อปิดลาหยุด)'}</span>
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Patient Cards List */}
          {myPatientsBookings.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-stone-200 text-stone-400 space-y-2">
              <UserCheck className="w-12 h-12 text-stone-300 mx-auto" />
              <p className="text-sm font-semibold text-stone-700">ไม่มีรายการคนไข้ในวันที่ {selectedDate}</p>
              <p className="text-xs text-stone-400">ยังไม่มีนัดหมายสำหรับผู้ช่วยที่เลือก หรือไม่มีคิวในวันนี้</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {myPatientsBookings.map((b) => {
                const service = CLINIC_SERVICES.find((s) => s.id === b.serviceId);
                const qStatus = b.queueStatus || 'waiting';
                return (
                  <div
                    key={b.id}
                    className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs hover:shadow-sm transition-all space-y-3"
                  >
                    {/* Header: Slot + Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {b.timeSlot} น.
                        </span>
                        {b.durationHours === 2 && (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                            2 ชม.
                          </span>
                        )}
                        <span className="text-[10px] text-stone-400 font-mono">
                          {b.bookingCode}
                        </span>
                      </div>

                      {/* Queue Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          qStatus === 'completed'
                            ? 'bg-stone-100 text-stone-600'
                            : qStatus === 'in_service'
                            ? 'bg-blue-100 text-blue-800'
                            : qStatus === 'called'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {qStatus === 'completed'
                          ? 'เสร็จสิ้น'
                          : qStatus === 'in_service'
                          ? 'กำลังรับบริการ'
                          : qStatus === 'called'
                          ? 'เรียกคิวแล้ว'
                          : 'รอเรียกคิว'}
                      </span>
                    </div>

                    {/* Patient Name & Service */}
                    <div>
                      <h4 className="font-bold text-sm text-stone-900">{b.patientName}</h4>
                      <p className="text-xs text-stone-600 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <a href={`tel:${b.patientPhone}`} className="hover:underline text-emerald-700 font-mono">
                          {b.patientPhone}
                        </a>
                      </p>
                      <p className="text-xs font-medium text-emerald-800 mt-1">
                        {service?.name || b.serviceId}
                      </p>
                    </div>

                    {/* Symptoms & Notes */}
                    {b.symptoms && (
                      <div className="bg-stone-50 p-2 rounded-xl text-xs text-stone-600 border border-stone-100">
                        <span className="font-semibold text-stone-700">อาการ: </span>
                        {b.symptoms}
                      </div>
                    )}

                    {b.notes && (
                      <div className="text-[11px] text-stone-500 italic">
                        หมายเหตุ: {b.notes}
                      </div>
                    )}

                    {/* Assigned Assistant */}
                    <div className="text-xs text-stone-500 pt-1 border-t border-stone-100 flex items-center justify-between">
                      <span>ผู้ช่วยผู้ดูแล: <strong className="text-stone-800">{b.assignedStaffName || 'รอจัดสรร'}</strong></span>
                      {b.isStaffRequested && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                          คนไข้ระบุ
                        </span>
                      )}
                    </div>

                    {/* Interactive Action Buttons */}
                    <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => handleCallQueue(b)}
                        className="py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors border border-emerald-200"
                        title="เรียกคิวพร้อมเสียงสัญญาณ"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>เรียกคิว</span>
                      </button>

                      <button
                        onClick={() => openEditBookingModal(b)}
                        className="py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors border border-stone-200"
                        title="แก้ไขข้อมูล / ย้ายผู้ช่วย"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>แก้ไขคนไข้</span>
                      </button>
                    </div>

                    {/* Queue Status quick selector */}
                    <div className="flex items-center justify-between gap-1 pt-1 text-[11px]">
                      <span className="text-stone-400">เปลี่ยนสถานะ:</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleQueueStatusChange(b.id, 'in_service')}
                          className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium"
                        >
                          รับบริการ
                        </button>
                        <button
                          onClick={() => handleQueueStatusChange(b.id, 'completed')}
                          className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 font-medium"
                        >
                          เสร็จสิ้น
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                          className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================= */}
      {/* TAB CONTENT 2: CLINIC ROSTER (ผังคิวรวมคลินิก)      */}
      {/* ================================================= */}
      {activeAdminTab === 'roster' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-stone-900">
                ผังรอบเวลานัดหมายรวม ประจำวันที่ {selectedDate}
              </h3>
              <p className="text-xs text-stone-500">
                รวมเคสทุกหัตถการ แสดงรอบเวลาและผู้ช่วยที่ปฏิบัติหน้าที่
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {CLINIC_TIME_SLOTS.map((slot) => {
              const slotBookings = allBookings.filter(
                (b) => b.date === selectedDate && b.timeSlot === slot.time && b.status !== 'cancelled'
              );
              return (
                <div
                  key={slot.id}
                  className="p-3 rounded-xl border border-stone-100 bg-stone-50/60 hover:bg-stone-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                      {slot.time} น.
                    </span>
                    <span className="text-xs text-stone-500 font-medium">{slot.periodLabel}</span>
                    <span className="text-xs font-semibold text-stone-800">
                      มีคนไข้ {slotBookings.length} ท่าน
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {slotBookings.map((b) => (
                      <span
                        key={b.id}
                        onClick={() => openEditBookingModal(b)}
                        className="text-xs font-medium px-2 py-1 rounded-lg bg-white border border-stone-200 hover:border-emerald-400 cursor-pointer shadow-2xs transition-colors flex items-center gap-1"
                      >
                        <span className="font-semibold">{b.patientName}</span>
                        <span className="text-stone-400 text-[10px]">({b.assignedStaffName || 'รอจัดสรร'})</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* TAB CONTENT 3: HERBAL SAUNA MONITOR              */}
      {/* ================================================= */}
      {activeAdminTab === 'sauna' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-stone-900">
                สถานะห้องอบสมุนไพร (จำกัด 3 เคสต่อวัน)
              </h3>
              <p className="text-xs text-stone-500">
                โควตาเปิดให้บริการห้องอบรวม 3 เคสต่อวัน
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slotsWithSauna.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-stone-400 text-xs">
                ไม่มีการจองบริการอบสมุนไพรในวันที่ {selectedDate}
              </div>
            ) : (
              slotsWithSauna.map((slot: any) => (
                <div
                  key={slot.timeSlot.id}
                  className="p-4 rounded-xl border border-orange-200 bg-orange-50/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-orange-800">
                      รอบ {slot.timeSlot.time} น.
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                      ผู้รับบริการ {slot.saunaGroup.count}/3 ท่าน
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-700">
                    {slot.saunaGroup.bookings.map((b: Booking) => (
                      <div key={b.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-orange-100">
                        <span>{b.patientName} ({b.patientPhone})</span>
                        <span className="text-[10px] text-stone-400 font-mono">{b.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* TAB CONTENT 4: DUTY STATUS & LEAVE TOGGLE         */}
      {/* ================================================= */}
      {activeAdminTab === 'duty_status' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="font-bold text-sm text-stone-900">
              จัดการสถานะการปฏิบัติงานของผู้ช่วย (พร้อมรับคิว / ปิดไม่รับคิวชั่วคราว)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              กรณีผู้ช่วยลาหยุด ป่วย หรือติดธุระ สามารถกดสวิตช์ปิดไม่รับคิว เพื่อให้ระบบระงับการจัดสรรคิวของคนไข้ในวันที่ระบุทันที
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {staffList.map((staff) => {
              const isOff = staff.isOffDuty || (staff.offDutyDates && staff.offDutyDates.includes(selectedDate));
              return (
                <div
                  key={staff.id}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                    isOff
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-emerald-50/40 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-200 bg-white flex items-center justify-center shrink-0">
                        {staff.avatarUrl ? (
                          <img src={staff.avatarUrl} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-stone-600">{staff.name.slice(0, 2)}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-stone-900">คุณ{staff.name}</h4>
                        <span className="text-[10px] text-stone-500 font-mono">{staff.code}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleDutyStatus(staff.id, Boolean(isOff), 'ลาป่วย/ลากิจ')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors shadow-2xs ${
                        isOff
                          ? 'bg-rose-600 text-white hover:bg-rose-700'
                          : 'bg-emerald-700 text-white hover:bg-emerald-800'
                      }`}
                    >
                      {isOff ? 'ปิดรับคิว' : 'พร้อมรับคิว'}
                    </button>
                  </div>

                  {isOff && (
                    <div className="text-[11px] text-rose-700 bg-white/80 p-1.5 rounded-lg border border-rose-100 flex items-center gap-1">
                      <UserX className="w-3.5 h-3.5 shrink-0" />
                      <span>สถานะ: {staff.offDutyReason || 'ลาหยุด/ป่วย/ติดธุระ'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* TAB CONTENT 5: STAFF MANAGEMENT (ADMIN ONLY)      */}
      {/* ================================================= */}
      {activeAdminTab === 'staff_management' && isAdminRole && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-stone-900">
                จัดการทีมผู้ช่วยแพทย์แผนไทย (สิทธิ์ผู้ดูแลระบบ Admin)
              </h3>
              <p className="text-xs text-stone-500">
                เพิ่ม ลบ แก้ไขชื่อ เบอร์โทร และอัปเดตรูปถ่าย Profile ของผู้ช่วยในระบบ
              </p>
            </div>

            <button
              onClick={openAddStaffModal}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ เพิ่มผู้ช่วยใหม่</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className="p-3.5 rounded-2xl border border-stone-200 bg-white hover:shadow-xs transition-all space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-600 bg-emerald-50 flex items-center justify-center shrink-0">
                    {staff.avatarUrl ? (
                      <img src={staff.avatarUrl} alt={staff.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserCheck className="w-6 h-6 text-emerald-700" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-stone-900 truncate">คุณ{staff.name}</h4>
                      <span className="text-[10px] font-mono text-stone-400">{staff.code}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate">{staff.role}</p>
                    {staff.phone && (
                      <p className="text-[10px] text-stone-400 font-mono">โทร: {staff.phone}</p>
                    )}
                  </div>
                </div>

                {/* Certifications Badges */}
                <div className="flex flex-wrap gap-1 text-[9px] pt-1 border-t border-stone-100">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">นวดประคบ</span>
                  {(staff.qualifiedServices?.includes('herbal_sauna') || ['staff_3', 'staff_5', 'staff_6'].includes(staff.id)) && (
                    <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-700">อบสมุนไพร</span>
                  )}
                  {(staff.qualifiedServices?.includes('postpartum_care') || ['staff_3', 'staff_6'].includes(staff.id)) && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">มารดาหลังคลอด</span>
                  )}
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openEditStaffModal(staff)}
                    className="flex-1 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-lg flex items-center justify-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไข</span>
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(staff)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="ลบผู้ช่วย"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* TAB CONTENT 6: TELEGRAM NOTIFICATIONS SETTINGS     */}
      {/* ================================================= */}
      {activeAdminTab === 'telegram' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-5 max-w-3xl">
          <div className="border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-sky-500" />
              <h3 className="font-bold text-sm text-stone-900">
                การแจ้งเตือนผ่าน Telegram Bot อัตโนมัติ
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              เชื่อมต่อบอท Telegram เพื่อรับการแจ้งเตือนทันทีเมื่อมีคนไข้จองคิวใหม่ หรือขอยกเลิกนัดหมาย ช่วยให้แพทย์และเจ้าหน้าที่ไม่พลาดทุกการเคลื่อนไหว
            </p>
          </div>

          {telegramTestResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                telegramTestResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border border-rose-300'
              }`}
            >
              {telegramTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{telegramTestResult.message}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Enable Switch */}
            <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <div>
                <label className="text-xs font-bold text-stone-800 block">เปิดใช้งานการแจ้งเตือน Telegram</label>
                <span className="text-[11px] text-stone-500">ระบบจะส่งข้อความแจ้งเตือนอัตโนมัติเมื่อเกิดกิจกรรม</span>
              </div>
              <input
                type="checkbox"
                checked={telegramConfig.enabled}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, enabled: e.target.checked })}
                className="w-5 h-5 accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Bot Token Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">
                Telegram Bot Token
              </label>
              <input
                type="text"
                value={telegramConfig.botToken}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, botToken: e.target.value })}
                placeholder="เช่น 7123456789:AAHk..."
                className="w-full px-3.5 py-2.5 text-xs font-mono border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-stone-400 block">
                สร้างบอทได้ฟรีผ่าน @BotFather ในแอป Telegram เพื่อนำ Token มาใส่
              </span>
            </div>

            {/* Chat ID Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">
                Telegram Chat ID / Group ID
              </label>
              <input
                type="text"
                value={telegramConfig.chatId}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })}
                placeholder="เช่น -100123456789 หรือ 12345678"
                className="w-full px-3.5 py-2.5 text-xs font-mono border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-stone-400 block">
                สามารถเป็น ID บัญชีส่วนตัว หรือ ID ของกลุ่มไลน์/กลุ่มงานการแพทย์แผนไทย (หาได้จาก @userinfobot)
              </span>
            </div>

            {/* Notification Event Options */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-stone-700 block">เลือกเหตุการณ์ที่ต้องการให้แจ้งเตือน:</span>
              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={telegramConfig.notifyOnNewBooking}
                  onChange={(e) =>
                    setTelegramConfig({ ...telegramConfig, notifyOnNewBooking: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-600"
                />
                <span>🌿 แจ้งเตือนเมื่อมีคนไข้จองคิวใหม่เข้ามา</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={telegramConfig.notifyOnCancellation}
                  onChange={(e) =>
                    setTelegramConfig({ ...telegramConfig, notifyOnCancellation: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-600"
                />
                <span>❌ แจ้งเตือนเมื่อมีการยกเลิกคิวนัดหมาย (เพิ่มคิวว่าง)</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-3">
              <button
                onClick={handleSaveTelegram}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
              >
                บันทึกการตั้งค่า
              </button>

              <button
                onClick={handleTestTelegram}
                disabled={isTestingTelegram || !telegramConfig.botToken || !telegramConfig.chatId}
                className="px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold text-xs rounded-xl border border-sky-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-sky-600" />
                <span>{isTestingTelegram ? 'กำลังทดสอบ...' : '🔔 ส่งข้อความทดสอบเข้า Telegram'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* TAB CONTENT 7: HEALTH EDUCATION & MEDIA HUB       */}
      {/* ================================================= */}
      {activeAdminTab === 'media_mgmt' && (
        <div className="space-y-4">
          <EducationMediaHub isAdminLoggedIn={true} currentUser={currentUser} />
        </div>
      )}

      {/* ================================================= */}
      {/* TAB CONTENT 8: SECURITY & PASSWORD SETTINGS       */}
      {/* ================================================= */}
      {activeAdminTab === 'security_settings' && isAdminRole && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-900 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-emerald-800/40 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-700/60 rounded-xl border border-emerald-500/40 shadow-xs">
                  <ShieldAlert className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>ศูนย์ความปลอดภัยและจัดการรหัสผ่าน (Hospital Security Control)</span>
                  </h3>
                  <p className="text-xs text-emerald-200">
                    กลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก รพ.พระนครศรีอยุธยา
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>ระดับการป้องกัน: สูงสุด (PDPA Protected)</span>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed pt-1">
              เฉพาะแพทย์แผนไทย (พท.ว. ชญานิศ) เท่านั้นที่มีสิทธิ์เข้าถึงหน้านี้ เพื่อกำหนดรหัสผ่าน ป้องกันไม่ให้คนนอกเข้าสู่ระบบ และปกป้องข้อมูลประวัติการรักษาของคนไข้
            </p>
          </div>

          {/* Security KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-stone-400 block">รหัส PIN ความปลอดภัยคลินิก</span>
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-sm font-bold text-stone-800">
                  {secConfig.requireClinicPin ? 'เปิดใช้งาน (PIN 6 หลัก)' : 'ปิดใช้งานชั่วคราว'}
                </span>
              </div>
              <span className="text-[10px] text-stone-500 block">
                {secConfig.requireClinicPin ? 'คนนอกจะไม่สามารถเข้าได้หากไม่มี PIN' : 'สามารถเปิดกลับมาได้ตลอดเวลา'}
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-stone-400 block">ระบบป้องกันการเดาสุ่มรหัส</span>
              <div className="flex items-center gap-2">
                <ShieldAlert className={`w-4 h-4 shrink-0 ${lockoutState.isLocked ? 'text-rose-600' : 'text-emerald-700'}`} />
                <span className={`text-sm font-bold ${lockoutState.isLocked ? 'text-rose-600' : 'text-stone-800'}`}>
                  {lockoutState.isLocked ? 'กำลังระงับการเข้าสู่ระบบ' : 'ทำงานปกติ (ล็อก 10 นาทีเมื่อผิด 5 ครั้ง)'}
                </span>
              </div>
              <span className="text-[10px] text-stone-500 block">
                จำนวนที่กรอกผิดสะสม: {lockoutState.failedAttempts} / 5 ครั้ง
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-stone-400 block">ล็อกหน้าจออัตโนมัติเมื่อไม่ใช้งาน</span>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-sm font-bold text-stone-800">
                  {secConfig.sessionTimeoutMinutes || 15} นาที
                </span>
              </div>
              <span className="text-[10px] text-stone-500 block">
                ป้องกันผู้อื่นแอบดูข้อมูลหากเจ้าหน้าที่ลุกจากโต๊ะ
              </span>
            </div>
          </div>

          {/* Credentials Management Grid (3 Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Change Admin Password */}
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">รหัสผ่านแพทย์แผนไทย</h4>
                  <span className="text-[10px] text-stone-400">บัญชีผู้ดูแลระบบ (Admin)</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">รหัสผ่านใหม่</label>
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">ยืนยันรหัสผ่านใหม่อีกครั้ง</label>
                  <input
                    type="password"
                    value={confirmAdminPassword}
                    onChange={(e) => setConfirmAdminPassword(e.target.value)}
                    placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveAdminPassword}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
                >
                  บันทึกรหัสผ่านแพทย์
                </button>
              </div>
            </div>

            {/* Card 2: Change Staff Password */}
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">รหัสผ่านผู้ช่วยแพทย์แผนไทย</h4>
                  <span className="text-[10px] text-stone-400">สำหรับผู้ช่วยตรวจเช็คคิว (Staff)</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">รหัสผ่านผู้ช่วยใหม่</label>
                  <input
                    type="password"
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>

                <p className="text-[11px] text-stone-500 leading-relaxed">
                  รหัสผ่านนี้จะใช้สำหรับผู้ช่วยทุกคนเมื่อเข้าใช้งานในชื่อตนเอง (STF-01 ถึง STF-09)
                </p>

                <button
                  type="button"
                  onClick={handleSaveStaffPassword}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
                >
                  บันทึกรหัสผ่านผู้ช่วย
                </button>
              </div>
            </div>

            {/* Card 3: Clinic Security PIN */}
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">รหัสความปลอดภัยคลินิก (PIN)</h4>
                  <span className="text-[10px] text-stone-400">ด่านตรวจคนนอก (6 หลัก)</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">รหัส PIN 6 หลักใหม่</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={newClinicPin}
                    onChange={(e) => setNewClinicPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="ตัวเลข 6 หลัก (เช่น 254099)"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-center font-mono text-xs tracking-widest"
                  />
                </div>

                {/* Require PIN Toggle */}
                <label className="flex items-start gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={secConfig.requireClinicPin}
                    onChange={(e) => handleToggleRequirePin(e.target.checked)}
                    className="mt-0.5 accent-emerald-700"
                  />
                  <span className="text-[11px] text-stone-700 leading-tight">
                    บังคับให้ต้องกรอกรหัส PIN 6 หลักเมื่อเข้าสู่ระบบ (ป้องกันคนนอก 100%)
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleSaveClinicPin}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
                >
                  บันทึกรหัส PIN คลินิก
                </button>
              </div>
            </div>

          </div>

          {/* Session Timeout & Lockout Reset Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Session Timeout */}
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2 text-xs">
              <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>ระยะเวลาออกจากระบบอัตโนมัติ (Session Inactivity Timeout)</span>
              </h4>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                ระบบจะทำการออกจากระบบโดยอัตโนมัติหากไม่มีการเคลื่อนไหวเมาส์หรือการพิมพ์ เพื่อความปลอดภัยของข้อมูลคนไข้ในกรณีที่เจ้าหน้าที่ลืมออกจากระบบ
              </p>
              <div className="flex items-center gap-2 pt-1">
                <select
                  value={secConfig.sessionTimeoutMinutes || 15}
                  onChange={(e) => handleSaveSessionTimeout(Number(e.target.value))}
                  className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 text-xs"
                >
                  <option value={5}>5 นาที</option>
                  <option value={10}>10 นาที</option>
                  <option value={15}>15 นาที (แนะนำ)</option>
                  <option value={30}>30 นาที</option>
                  <option value={60}>60 นาที</option>
                </select>
                <span className="text-stone-500 text-[11px]">นาทีแห่งความเงียบ</span>
              </div>
            </div>

            {/* Lockout Reset & Brute Force Management */}
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2 text-xs">
              <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-700" />
                <span>การปลดล็อกระบบฉุกเฉิน (Lockout Reset)</span>
              </h4>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                หากเจ้าหน้าที่หรือผู้ช่วยกรอกรหัสผิดครบ 5 ครั้งจนระบบถูกล็อก 10 นาที แพทย์สามารถกดปุ่มนี้เพื่อปลดล็อกและคืนสิทธิ์ให้สามารถล็อกอินได้ทันที
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAdminResetLockout}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 text-xs shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                  <span>ปลดล็อกระบบทันที / รีเซ็ตจำนวนครั้งที่กรอกผิด</span>
                </button>
              </div>
            </div>
          </div>

          {/* Security Audit Log Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-700" />
                <h4 className="text-sm font-bold text-stone-900">
                  ประวัติการเข้าใช้งานระบบ (Security Audit Log)
                </h4>
                <span className="text-[11px] px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full font-semibold">
                  {auditLogs.length} รายการ
                </span>
              </div>

              {auditLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('คุณต้องการล้างประวัติการเข้าใช้งานระบบทั้งหมดใช่หรือไม่?')) {
                      handleAdminClearAuditLogs();
                    }
                  }}
                  className="text-stone-400 hover:text-rose-600 text-[11px] font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>ล้างประวัติทั้งหมด</span>
                </button>
              )}
            </div>

            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs">
                ยังไม่มีประวัติการเข้าใช้งานในระบบ
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200/80 text-[11px] text-stone-500 font-semibold bg-stone-50/70">
                      <th className="py-2.5 px-3">วันและเวลา</th>
                      <th className="py-2.5 px-3">ชื่อผู้ใช้ (Username)</th>
                      <th className="py-2.5 px-3">สิทธิ์การเข้าถึง</th>
                      <th className="py-2.5 px-3">ผลการตรวจสอบ</th>
                      <th className="py-2.5 px-3">รายละเอียด / หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {auditLogs.map((log) => {
                      const dateObj = new Date(log.timestamp);
                      const timeStr = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      const dateStr = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

                      return (
                        <tr key={log.id} className="hover:bg-stone-50/50">
                          <td className="py-2.5 px-3 text-stone-600 font-mono text-[11px] whitespace-nowrap">
                            {dateStr} {timeStr}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-stone-900">
                            {log.username}
                          </td>
                          <td className="py-2.5 px-3 text-stone-700">
                            {log.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                                แพทย์แผนไทย
                              </span>
                            ) : log.role === 'staff' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 text-[10px] font-bold border border-sky-200">
                                ผู้ช่วยแพทย์แผนไทย
                              </span>
                            ) : (
                              <span className="text-stone-400 text-[10px]">บุคคลภายนอก</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {log.success ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                                <Check className="w-3.5 h-3.5" />
                                <span>เข้าสู่ระบบสำเร็จ</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>ล้มเหลว / ปฏิเสธ</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-stone-600 text-[11px]">
                            {log.note || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 1: EDIT PATIENT BOOKING                     */}
      {/* ================================================= */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-stone-900">
                  แก้ไขข้อมูลคนไข้ / ย้ายผู้ช่วย
                </h3>
                <span className="text-[11px] font-mono text-stone-400">
                  รหัสคิว: {editingBooking.bookingCode}
                </span>
              </div>
              <button
                onClick={() => setEditingBooking(null)}
                className="text-stone-400 hover:text-stone-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">ชื่อ-นามสกุล คนไข้</label>
                <input
                  type="text"
                  value={editPatientName}
                  onChange={(e) => setEditPatientName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="tel"
                  value={editPatientPhone}
                  onChange={(e) => setEditPatientPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">อาการเบื้องต้น</label>
                <textarea
                  value={editSymptoms}
                  onChange={(e) => setEditSymptoms(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">มอบหมายผู้ช่วยผู้ดูแล</label>
                <select
                  value={editStaffId}
                  onChange={(e) => setEditStaffId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">รอจัดสรร</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      คุณ{s.name} ({s.code}) {s.isOffDuty ? '[ปิดไม่รับคิว]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">หมายเหตุเพิ่มเติม</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingBooking(null)}
                className="px-4 py-2 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveBookingEdit}
                disabled={isSavingBooking}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-2xs"
              >
                {isSavingBooking ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 2: ADD / EDIT ASSISTANT (ADMIN ONLY)        */}
      {/* ================================================= */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900">
                {editingStaff ? `แก้ไขข้อมูลผู้ช่วย: คุณ${editingStaff.name}` : '+ เพิ่มผู้ช่วยแพทย์แผนไทยคนใหม่'}
              </h3>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Photo Upload & Preview */}
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-600 bg-white flex items-center justify-center shrink-0">
                  {staffAvatarUrl ? (
                    <img src={staffAvatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserCheck className="w-7 h-7 text-stone-400" />
                  )}
                </div>
                <div className="space-y-1 min-w-0">
                  <span className="font-semibold text-stone-700 block">รูปถ่ายโปรไฟล์</span>
                  <label className="px-3 py-1.5 bg-white hover:bg-stone-100 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-300 cursor-pointer inline-flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>อัปโหลดรูปภาพ</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-stone-400 block">หรือใส่ลิงก์รูปถ่ายด้านล่าง</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">ลิงก์รูปถ่าย (Image URL)</label>
                <input
                  type="url"
                  value={staffAvatarUrl}
                  onChange={(e) => setStaffAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">รหัสผู้ช่วย (Code)</label>
                  <input
                    type="text"
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value)}
                    placeholder="STF-10"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">ชื่อเล่น (Nickname)</label>
                  <input
                    type="text"
                    value={staffNickname}
                    onChange={(e) => setStaffNickname(e.target.value)}
                    placeholder="เช่น น้องผึ้ง"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="ชื่อผู้ช่วย"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="081-xxx-xxxx"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              {/* Certifications Checkboxes */}
              <div className="space-y-1.5 pt-1">
                <span className="font-semibold text-stone-700 block">หัตถการที่ผ่านการรับรอง:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={staffCertMassage}
                      onChange={(e) => setStaffCertMassage(e.target.checked)}
                      className="accent-emerald-600"
                    />
                    <span>นวดและประคบสมุนไพร</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={staffCertSauna}
                      onChange={(e) => setStaffCertSauna(e.target.checked)}
                      className="accent-emerald-600"
                    />
                    <span>อบสมุนไพร</span>
                  </label>
                  <label className="flex items-center gap-1.5 col-span-2">
                    <input
                      type="checkbox"
                      checked={staffCertPostpartum}
                      onChange={(e) => setStaffCertPostpartum(e.target.checked)}
                      className="accent-emerald-600"
                    />
                    <span>ดูแลมารดาหลังคลอด (ทับหม้อเกลือ)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveStaff}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-2xs"
              >
                บันทึกข้อมูลผู้ช่วย
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
