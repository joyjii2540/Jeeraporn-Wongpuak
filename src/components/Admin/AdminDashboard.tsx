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
} from 'lucide-react';
import {
  Booking,
  BookingStatus,
  CLINIC_SERVICES,
  CLINIC_STAFF,
  CLINIC_TIME_SLOTS,
  Staff,
} from '../../types/clinic';
import { ClinicApi } from '../../services/api';
import { getQueueProximity, playHospitalQueueChime } from '../../utils/queueAlertUtils';

interface AdminDashboardProps {
  isAdminLoggedIn: boolean;
  onLoginSuccess: (token: string, user: any) => void;
  onLogout: () => void;
  onRefreshCalendar: () => void;
  onOpenReport?: (date: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isAdminLoggedIn,
  onLoginSuccess,
  onLogout,
  onRefreshCalendar,
  onOpenReport,
}) => {
  const todayStr = new Date().toISOString().substring(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Tab State
  const [activeAdminTab, setActiveAdminTab] = useState<'roster' | 'sauna' | 'staff'>('roster');

  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Data State
  const [dayDetails, setDayDetails] = useState<any>(null);
  const [staffList, setStaffList] = useState<Staff[]>(CLINIC_STAFF);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

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
    }
  }, [isAdminLoggedIn, selectedDate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await ClinicApi.login(username, password);
      if (res.success && res.token) {
        onLoginSuccess(res.token, res.user);
      } else {
        setLoginError(res.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleQuickLogin = async (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await ClinicApi.login(user, pass);
      if (res.success && res.token) {
        onLoginSuccess(res.token, res.user);
      } else {
        setLoginError(res.error || 'ไม่สามารถเข้าสู่ระบบได้');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      const res = await ClinicApi.updateBookingStatus(bookingId, status);
      if (res.success) {
        setActionSuccessMsg(`อัปเดตสถานะคิวเป็น "${status === 'confirmed' ? 'ยืนยันแล้ว' : 'ยกเลิกแล้ว'}" เรียบร้อย`);
        setTimeout(() => setActionSuccessMsg(null), 3000);
        fetchDayData();
        onRefreshCalendar();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleReassignStaff = async (bookingId: string, staffId: string) => {
    try {
      const res = await ClinicApi.updateBookingStatus(bookingId, 'confirmed', staffId);
      if (res.success) {
        setActionSuccessMsg('เปลี่ยนผู้ช่วยผู้ดูแลเรียบร้อยแล้ว');
        setTimeout(() => setActionSuccessMsg(null), 3000);
        fetchDayData();
        onRefreshCalendar();
      }
    } catch (err) {
      console.error('Error reassigning staff:', err);
    }
  };

  const handleConfirmSaunaGroup = async (timeSlot: string) => {
    try {
      const res = await ClinicApi.confirmSaunaGroup(selectedDate, timeSlot);
      if (res.success) {
        setActionSuccessMsg(`ยืนยันเปิดบริการห้องอบสมุนไพรรอบ ${timeSlot} น. เรียบร้อยแล้ว (อัปเดตผู้รับบริการครบ 3 ท่าน)`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
        fetchDayData();
        onRefreshCalendar();
      } else {
        alert(res.error || 'ไม่สามารถยืนยันได้');
      }
    } catch (err) {
      console.error('Error confirming sauna group:', err);
    }
  };

  const handleCallQueue = async (booking: Booking) => {
    try {
      playHospitalQueueChime();
      const res = await ClinicApi.callQueue(booking.id);
      if (res.success) {
        setActionSuccessMsg(`ส่งสัญญาณเรียกคิวคุณ "${booking.patientName}" (รอบ ${booking.timeSlot} น.) พร้อมเสียงสัญญาณเตือนแล้ว`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
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
        setActionSuccessMsg(`เปลี่ยนสถานะคิวเป็น "${labels[queueStatus]}" เรียบร้อย`);
        setTimeout(() => setActionSuccessMsg(null), 3000);
        fetchDayData();
      }
    } catch (err) {
      console.error('Error updating queue status:', err);
    }
  };

  // If not logged in, render Admin Login Card
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white rounded-2xl border border-stone-200 shadow-xl space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500 shadow-xs bg-white p-0.5 mx-auto flex items-center justify-center">
            <img
              src="/assets/aistudio/107108_5321bd65.jpg"
              alt="PANTHAI AYHOS"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">
              ระบบจัดการหลังบ้านสำหรับเจ้าหน้าที่
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              กลุ่มงานการแพทย์แผนไทย และการแพทย์ทางเลือก โรงพยาบาลพระนครศรีอยุธยา
            </p>
          </div>
        </div>

        {loginError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">ชื่อผู้ใช้งาน (Username)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full px-3.5 py-2.5 text-base sm:text-sm min-h-[44px] border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">รหัสผ่าน (Password)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-base sm:text-sm min-h-[44px] border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full min-h-[44px] py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm disabled:bg-stone-300 flex items-center justify-center gap-1.5"
          >
            {isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบเจ้าหน้าที่'}
          </button>
        </form>

        {/* Demo Quick Login buttons */}
        <div className="pt-4 border-t border-stone-100 text-center">
          <span className="text-[11px] text-stone-400 block mb-2">เข้าใช้งานด่วนสำหรับทดสอบระบบ:</span>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => handleQuickLogin('admin', 'admin1234')}
              className="px-3 py-1 text-[11px] font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 rounded border border-stone-200 transition-colors"
            >
              แพทย์หัวหน้าคลินิก (admin)
            </button>
            <button
              onClick={() => handleQuickLogin('staff', 'clinic2026')}
              className="px-3 py-1 text-[11px] font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 rounded border border-stone-200 transition-colors"
            >
              เจ้าหน้าที่จัดคิว (staff)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Admin View
  const slotsWithSauna = dayDetails?.slots?.filter((s: any) => s.saunaGroup && s.saunaGroup.count > 0) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Top Notification */}
      {actionSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            ×
          </button>
        </div>
      )}

      {/* Admin Header with Controls */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-emerald-500 shadow-2xs p-0.5 bg-white shrink-0">
            <img
              src="/assets/aistudio/107108_5321bd65.jpg"
              alt="PANTHAI AYHOS"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Admin Queue Control · รพ.พระนครศรีอยุธยา</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">
              แผงควบคุมเจ้าหน้าที่คลินิกแพทย์แผนไทย
            </h2>
            <p className="text-xs text-stone-500">
              ยืนยันคิวคนไข้ · จัดการกลุ่มห้องอบสมุนไพร 3 ท่าน · มอบหมายงานผู้ช่วยแพทย์แผนไทย 9 คน
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-xs">
            <Calendar className="w-4 h-4 text-stone-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-stone-800 font-mono focus:outline-hidden"
            />
          </div>

          {onOpenReport && (
            <button
              onClick={() => onOpenReport(selectedDate)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ตารางคิว (Report)</span>
            </button>
          )}

          <button
            onClick={() => {
              fetchDayData();
              onRefreshCalendar();
            }}
            aria-label="รีเฟรชข้อมูล"
            className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveAdminTab('roster')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeAdminTab === 'roster'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          1. รายชื่อคิวตามรอบเวลา ({dayDetails?.totalBookings || 0} คน)
        </button>

        <button
          onClick={() => setActiveAdminTab('sauna')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeAdminTab === 'sauna'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span>2. ระบบกลุ่มอบสมุนไพร (เปิดเมื่อครบ 3 ท่าน)</span>
          {dayDetails?.saunaAlerts > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 ml-1" />
          )}
        </button>

        <button
          onClick={() => setActiveAdminTab('staff')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeAdminTab === 'staff'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>3. ผังผู้ช่วย 9 ท่าน & การกระจายงาน</span>
        </button>
      </div>

      {/* TAB 1: ROSTER VIEW */}
      {activeAdminTab === 'roster' && (
        <div className="space-y-6">
          {/* Real-time Imminent & Active Queue Monitor for Staff */}
          {(() => {
            const urgentList = (allBookings || []).filter((b) => {
              if (b.date !== selectedDate || b.status === 'cancelled') return false;
              const prox = getQueueProximity(b.date, b.timeSlot, b.status);
              return prox.isUrgent || b.queueStatus === 'called' || b.queueStatus === 'in_service';
            });

            if (urgentList.length === 0) return null;

            return (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                      <Megaphone className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                        <span>กระดานแจ้งเตือนคิวใกล้ถึงเวลา & เรียกคิวคนไข้ ({urgentList.length} ท่าน)</span>
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      </h4>
                      <p className="text-xs text-stone-500">
                        คิวที่ใกล้ถึงเวลาตรวจ (15-30 นาที), กำลังอยู่ในรอบเวลา, หรือถูกส่งสัญญาณเรียกคิว
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => playHospitalQueueChime()}
                    className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-lg font-medium transition-colors self-start sm:self-auto"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>ทดสอบเสียงสัญญาณเรียก</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {urgentList.map((b) => {
                    const prox = getQueueProximity(b.date, b.timeSlot, b.status);
                    const svc = CLINIC_SERVICES.find((s) => s.id === b.serviceId);
                    return (
                      <div
                        key={b.id}
                        className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-stone-400 block">
                              {b.bookingCode} · รอบ {b.timeSlot} น.
                            </span>
                            <span className="font-bold text-stone-900 text-sm">
                              {b.patientName}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${prox.badgeColor}`}
                          >
                            {b.queueStatus === 'called' ? '📢 เรียกคิวแล้ว' : prox.label}
                          </span>
                        </div>

                        <div className="text-xs text-stone-600">
                          <div>บริการ: <strong className="text-emerald-800">{svc?.shortName || svc?.name}</strong></div>
                          <div>ผู้ช่วย: คุณ{b.assignedStaffName || 'รอจัดสรร'}</div>
                        </div>

                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleCallQueue(b)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs"
                          >
                            <Megaphone className="w-3.5 h-3.5" />
                            <span>{b.queueStatus === 'called' ? 'เรียกซ้ำ' : '📢 กดเรียกคิว'}</span>
                          </button>

                          {b.queueStatus !== 'in_service' ? (
                            <button
                              onClick={() => handleQueueStatusChange(b.id, 'in_service')}
                              className="py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-medium transition-colors"
                            >
                              เข้าตรวจ
                            </button>
                          ) : (
                            <button
                              onClick={() => handleQueueStatusChange(b.id, 'completed')}
                              className="py-1.5 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-lg text-xs font-medium transition-colors"
                            >
                              เสร็จสิ้น
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {isLoading ? (
            <div className="p-8 text-center text-stone-400">กำลังโหลดข้อมูลคิว...</div>
          ) : dayDetails?.slots?.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-stone-200 text-center text-stone-500 text-sm">
              ไม่มีรอบเวลาในวันนี้
            </div>
          ) : (
            dayDetails?.slots?.map((slotItem: any) => {
              const { timeSlot, bookings, totalBookings, isOvertime } = slotItem;
              return (
                <div
                  key={timeSlot.id}
                  className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden"
                >
                  <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold font-mono text-stone-900">
                        {timeSlot.time} น.
                      </span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          isOvertime
                            ? 'bg-amber-100 text-amber-900 font-semibold'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {isOvertime ? 'นอกเวลาราชการ' : 'ในเวลาราชการ'}
                      </span>
                      <span className="text-xs text-stone-500">
                        จำนวนผู้จอง: <strong className="text-stone-900 font-mono tabular-nums">{totalBookings}</strong> ท่าน
                      </span>
                    </div>

                    <div className="text-xs text-stone-500">
                      ผู้ช่วยว่าง: <strong className="text-emerald-700 font-mono tabular-nums">{slotItem.services.massage.availableStaffCount}</strong> ท่าน
                    </div>
                  </div>

                  {bookings.length === 0 ? (
                    <div className="px-4 py-4 text-xs text-stone-400 italic">
                      ยังไม่มีรายการนัดหมายในรอบเวลานี้
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-100">
                      {bookings.map((booking: Booking) => {
                        const service = CLINIC_SERVICES.find((s) => s.id === booking.serviceId);
                        const prox = getQueueProximity(booking.date, booking.timeSlot, booking.status);

                        return (
                          <div
                            key={booking.id}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-mono font-bold text-stone-500">
                                  {booking.bookingCode}
                                </span>
                                <span className="font-bold text-sm text-stone-900">
                                  {booking.patientName}
                                </span>
                                <span className="text-xs text-stone-500 font-mono flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-stone-400" />
                                  {booking.patientPhone}
                                </span>

                                {booking.durationHours === 2 && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    {booking.timeSlot === timeSlot.time
                                      ? `นวด 2 ชม. (${booking.timeSlot}-${booking.endTimeSlot || 'จบตามเวลา'} น.)`
                                      : `↳ ต่อเนื่อง 2 ชม. (เริ่ม ${booking.timeSlot} น.)`}
                                  </span>
                                )}

                                {/* Real-time Proximity Badge */}
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${prox.badgeColor}`}
                                >
                                  {booking.queueStatus === 'called' ? '📢 เรียกคิวแล้ว' : prox.label}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-600">
                                <span className="font-semibold text-emerald-800">
                                  {service?.name}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>อาการ: {booking.symptoms}</span>
                                {booking.notes && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-amber-800 font-medium">หมายเหตุ: {booking.notes}</span>
                                  </>
                                )}
                              </div>

                              {/* Staff Assignment */}
                              <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                                <span className="text-stone-500">ผู้ช่วยผู้ดูแล:</span>
                                <select
                                  value={booking.assignedStaffId || ''}
                                  onChange={(e) => handleReassignStaff(booking.id, e.target.value)}
                                  className="text-xs font-medium text-emerald-900 bg-emerald-50/80 border border-emerald-200 rounded px-2 py-0.5"
                                >
                                  {staffList
                                    .filter((s) => service?.qualifiedStaffIds.includes(s.id))
                                    .map((s) => (
                                      <option key={s.id} value={s.id}>
                                        คุณ{s.name} ({s.code})
                                      </option>
                                    ))}
                                </select>
                                {booking.isStaffRequested ? (
                                  <span className="text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded font-medium">
                                    ✓ ผู้ป่วยระบุเจาะจงเอง
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                                    ⚙ ระบบจัดสรรอัตโนมัติ
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Status and Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                              {/* Call Queue Button */}
                              {booking.status === 'confirmed' && (
                                <button
                                  onClick={() => handleCallQueue(booking)}
                                  className="px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                                >
                                  <Megaphone className="w-3 h-3 text-amber-700" />
                                  <span>{booking.queueStatus === 'called' ? 'เรียกซ้ำ' : 'เรียกคิว'}</span>
                                </button>
                              )}

                              {booking.status === 'confirmed' ? (
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                                  ยืนยันแล้ว
                                </span>
                              ) : booking.status === 'pending' ? (
                                <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full">
                                  รอยืนยัน
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
                                  ยกเลิกแล้ว
                                </span>
                              )}

                              {booking.status !== 'confirmed' && (
                                <button
                                  onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                  className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                                >
                                  ยืนยันคิว
                                </button>
                              )}

                              {booking.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                  className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                                >
                                  ยกเลิก
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: HERBAL SAUNA MANAGER (3 CASES/DAY QUOTA) */}
      {activeAdminTab === 'sauna' && (
        <div className="space-y-6">
          <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-4 text-xs text-orange-900 space-y-1.5">
            <div className="font-bold text-sm flex items-center gap-1.5 text-orange-800">
              <Flame className="w-4 h-4 text-orange-600" />
              <span>กฎการเปิดบริการห้องอบสมุนไพรเพื่อสุขภาพ (โควตาสูงสุด 3 เคสต่อวัน):</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-orange-800">
              <li>
                <strong>จำกัดโควตา 3 เคสต่อวัน:</strong> กำหนดรับผู้รับบริการอบสมุนไพรรวมสูงสุด 3 เคสต่อวันทั่วทั้งคลินิก (ไม่ใช่ 3 เคสต่อชั่วโมง) เพื่อคุณภาพการบำบัดและความปลอดภัย
              </li>
              <li>
                <strong>รอบเวลาที่เปิดให้บริการ:</strong> เฉพาะ 09:00, 10:00, 13:00, 14:00, 15:00 น. เท่านั้น (งดรอบ 11:00, 16:00 น. และรอบนอกเวลาราชการ)
              </li>
              <li>
                <strong>การยืนยันคิว:</strong> ระบบยืนยันคิวนัดหมายทันทีเมื่อผู้ป่วยลงชื่อจองในโควตารายวัน และมอบหมายผู้เชี่ยวชาญ (กัลยาณี, ภัทรจิต, กัลยรัตน์) ดูแลอย่างเป็นระบบ
              </li>
            </ul>
          </div>

          {slotsWithSauna.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-500 text-sm">
              ไม่มีรายการจองบริการอบสมุนไพรในวันที่ {selectedDate}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {slotsWithSauna.map((slotItem: any) => {
                const { timeSlot, saunaGroup } = slotItem;
                const { count, isReadyToOpen, isUnderCapacity, bookings } = saunaGroup;

                return (
                  <div
                    key={timeSlot.id}
                    className={`rounded-2xl border p-5 transition-all ${
                      isReadyToOpen
                        ? 'bg-emerald-50/60 border-emerald-300 shadow-sm'
                        : 'bg-rose-50/60 border-rose-300 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/60">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isReadyToOpen ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                          }`}
                        >
                          <Flame className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-stone-900 font-mono">
                              รอบเวลา {timeSlot.time} น.
                            </span>
                            {isReadyToOpen ? (
                              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                ครบเกณฑ์ 3/3 ท่าน · พร้อมเปิดห้องอบ
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-rose-800 bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>ยอดไม่ครบโควตา ({count}/3 ท่าน) - แจ้งเตือนเลื่อนนัด</span>
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-stone-500">
                            ผู้เชี่ยวชาญอบสมุนไพร: กัลยาณี, ภัทรจิต, กัลยรัตน์
                          </span>
                        </div>
                      </div>

                      {/* Action for Group */}
                      <div>
                        {isReadyToOpen ? (
                          <button
                            onClick={() => handleConfirmSaunaGroup(timeSlot.time)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm whitespace-nowrap"
                          >
                            ✓ ยืนยันเปิดบริการรอบนี้ (Bulk Confirm 3 ท่าน)
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-rose-700 font-medium">
                              ขาดอีก {3 - count} ท่าน
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Patient List in this Sauna Group */}
                    <div className="mt-4 space-y-2">
                      <span className="text-xs font-semibold text-stone-700 block">
                        รายชื่อผู้รับบริการที่ลงชื่อในกลุ่มรอบนี้:
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {bookings.map((b: Booking, index: number) => (
                          <div
                            key={b.id}
                            className="bg-white p-3 rounded-xl border border-stone-200 text-xs space-y-1.5 shadow-2xs"
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-stone-900">
                                ท่านที่ {index + 1}: {b.patientName}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                  b.status === 'confirmed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-orange-100 text-orange-800'
                                }`}
                              >
                                {b.status === 'confirmed' ? 'ยืนยันแล้ว' : 'รอครบกลุ่ม'}
                              </span>
                            </div>
                            <div className="text-stone-500 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-stone-400" />
                              <span>{b.patientPhone}</span>
                            </div>
                            <div className="text-stone-600 text-[11px] truncate">
                              อาการ: {b.symptoms}
                            </div>
                            <div className="text-[11px] text-emerald-800 font-medium pt-1 border-t border-stone-100">
                              ผู้ช่วย: คุณ{b.assignedStaffName || 'รอจัดสรร'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STAFF CAPABILITY MATRIX & WORKLOAD */}
      {activeAdminTab === 'staff' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <h3 className="text-lg font-bold text-stone-900">
                ผังความเชี่ยวชาญและการจัดสรรงาน ผู้ช่วยแพทย์แผนไทยทั้ง 9 ท่าน
              </h3>
              <p className="text-xs text-stone-500">
                ระบบตรวจสอบสิทธิ์หัตถการก่อนตัดคิวว่าง (Staff-Service Capability Mapping)
              </p>
            </div>
            <div className="text-xs text-stone-600 font-mono bg-stone-100 px-3 py-1.5 rounded-lg">
              วันที่: {selectedDate}
            </div>
          </div>

          {/* Postpartum Care Daily Limit Banner */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>เกณฑ์โควตามารดาหลังคลอด:</strong> รับเคสสูงสุด 2 เคสต่อคนต่อวัน (คุณกัลยาณี และ คุณภัทรจิต รวมสูงสุด 4 เคส/วัน)
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="bg-white px-2.5 py-1 rounded-md border border-amber-200">
                กัลยาณี:{' '}
                <strong
                  className={
                    allBookings.filter(
                      (b) =>
                        b.date === selectedDate &&
                        b.assignedStaffId === 'staff_3' &&
                        b.serviceId === 'postpartum_care' &&
                        b.status !== 'cancelled'
                    ).length >= 2
                      ? 'text-rose-600'
                      : 'text-emerald-700'
                  }
                >
                  {
                    allBookings.filter(
                      (b) =>
                        b.date === selectedDate &&
                        b.assignedStaffId === 'staff_3' &&
                        b.serviceId === 'postpartum_care' &&
                        b.status !== 'cancelled'
                    ).length
                  }
                  /2 เคส
                </strong>
              </span>
              <span className="bg-white px-2.5 py-1 rounded-md border border-amber-200">
                ภัทรจิต:{' '}
                <strong
                  className={
                    allBookings.filter(
                      (b) =>
                        b.date === selectedDate &&
                        b.assignedStaffId === 'staff_6' &&
                        b.serviceId === 'postpartum_care' &&
                        b.status !== 'cancelled'
                    ).length >= 2
                      ? 'text-rose-600'
                      : 'text-emerald-700'
                  }
                >
                  {
                    allBookings.filter(
                      (b) =>
                        b.date === selectedDate &&
                        b.assignedStaffId === 'staff_6' &&
                        b.serviceId === 'postpartum_care' &&
                        b.status !== 'cancelled'
                    ).length
                  }
                  /2 เคส
                </strong>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold">
                  <th className="py-3 px-4">ลำดับ & รหัส</th>
                  <th className="py-3 px-4">ชื่อผู้ช่วยแพทย์แผนไทย</th>
                  <th className="py-3 px-4 text-center">นวดประคบ (MC)</th>
                  <th className="py-3 px-4 text-center">มารดาหลังคลอด (PP)</th>
                  <th className="py-3 px-4 text-center">อบสมุนไพร (HS)</th>
                  <th className="py-3 px-4 text-center">คิวงานวันนี้</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {staffList.map((staff, idx) => {
                  const canMassage = true; // All 9 can do massage
                  const canPostpartum = staff.id === 'staff_3' || staff.id === 'staff_6'; // กัลยาณี, ภัทรจิต
                  const canSauna =
                    staff.id === 'staff_3' || staff.id === 'staff_5' || staff.id === 'staff_6'; // กัลยาณี, กัลยรัตน์, ภัทรจิต

                  const bookingsToday = allBookings.filter(
                    (b) => b.date === selectedDate && b.assignedStaffId === staff.id && b.status !== 'cancelled'
                  ).length;

                  const postpartumToday = allBookings.filter(
                    (b) =>
                      b.date === selectedDate &&
                      b.assignedStaffId === staff.id &&
                      b.serviceId === 'postpartum_care' &&
                      b.status !== 'cancelled'
                  ).length;

                  return (
                    <tr key={staff.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-stone-500">
                        {idx + 1}. {staff.code}
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-900">
                        คุณ{staff.name}
                        {staff.role.includes('เชี่ยวชาญ') && (
                          <span className="block text-[10px] text-emerald-700 font-normal">
                            {staff.role}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                          ✓ ได้ (ทุกคน)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {canPostpartum ? (
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                postpartumToday >= 2
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
                                  : 'bg-amber-100 text-amber-900 border border-amber-200'
                              }`}
                            >
                              ✓ {postpartumToday >= 2 ? 'เต็มโควตา' : 'เชี่ยวชาญ'} ({postpartumToday}/2 เคส)
                            </span>
                            <span className="text-[10px] text-stone-400">
                              รับสูงสุด 2 เคส/วัน
                            </span>
                          </div>
                        ) : (
                          <span className="text-stone-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {canSauna ? (
                          <span className="inline-flex items-center text-orange-800 font-semibold bg-orange-100 px-2 py-0.5 rounded">
                            ✓ เชี่ยวชาญ
                          </span>
                        ) : (
                          <span className="text-stone-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-stone-900 text-sm">
                          {bookingsToday}
                        </span>{' '}
                        <span className="text-stone-400">คิว</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
