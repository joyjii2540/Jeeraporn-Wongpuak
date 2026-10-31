import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Flame,
  HeartHandshake,
  Sparkles,
  Info,
  CalendarCheck,
  CalendarX2,
} from 'lucide-react';
import {
  CLINIC_SERVICES,
  CLINIC_TIME_SLOTS,
  HERBAL_SAUNA_ALLOWED_SLOTS,
  HERBAL_SAUNA_FORBIDDEN_SLOTS,
  ServiceId,
  TimeSlot,
} from '../../types/clinic';
import { ClinicApi } from '../../services/api';
import { isWeekend } from '../../utils/capacityLogic';

interface MasterCalendarProps {
  selectedServiceFilter: ServiceId | 'all';
  onSelectSlotToBook: (date: string, time: string, serviceId?: ServiceId) => void;
  isAdmin: boolean;
  onViewSlotDetails?: (date: string, slotTime: string) => void;
  refreshTrigger?: number;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const THAI_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export const MasterCalendar: React.FC<MasterCalendarProps> = ({
  selectedServiceFilter,
  onSelectSlotToBook,
  isAdmin,
  onViewSlotDetails,
  refreshTrigger = 0,
}) => {
  // Calendar state - default to upcoming open weekday (Mon-Fri)
  const getInitialOpenDate = () => {
    const d = new Date();
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const initialOpenDate = getInitialOpenDate();
  const [initY, initM] = initialOpenDate.split('-').map(Number);
  const [currentYear, setCurrentYear] = useState<number>(initY);
  const [currentMonth, setCurrentMonth] = useState<number>(initM - 1); // 0-11
  const [selectedDate, setSelectedDate] = useState<string>(initialOpenDate);
  const [showMobileMonthPicker, setShowMobileMonthPicker] = useState<boolean>(false);

  const [monthData, setMonthData] = useState<Record<string, any>>({});
  const [dayDetails, setDayDetails] = useState<any>(null);
  const [postpartumDailyQuota, setPostpartumDailyQuota] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleGoToday = () => {
    const nextOpen = getInitialOpenDate();
    const [ny, nm] = nextOpen.split('-').map(Number);
    setCurrentYear(ny);
    setCurrentMonth(nm - 1);
    setSelectedDate(nextOpen);
  };

  const handleJumpToNextWeekday = (fromDateStr: string) => {
    const [y, m, d] = fromDateStr.split('-').map(Number);
    const nextDate = new Date(y, m - 1, d);
    do {
      nextDate.setDate(nextDate.getDate() + 1);
    } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);

    const ny = nextDate.getFullYear();
    const nm = String(nextDate.getMonth() + 1).padStart(2, '0');
    const nd = String(nextDate.getDate()).padStart(2, '0');
    setSelectedDate(`${ny}-${nm}-${nd}`);
    setCurrentYear(ny);
    setCurrentMonth(nextDate.getMonth());
  };

  const handleJumpToPrevWeekday = (fromDateStr: string) => {
    const [y, m, d] = fromDateStr.split('-').map(Number);
    const prevDate = new Date(y, m - 1, d);
    do {
      prevDate.setDate(prevDate.getDate() - 1);
    } while (prevDate.getDay() === 0 || prevDate.getDay() === 6);

    const py = prevDate.getFullYear();
    const pm = String(prevDate.getMonth() + 1).padStart(2, '0');
    const pd = String(prevDate.getDate()).padStart(2, '0');
    setSelectedDate(`${py}-${pm}-${pd}`);
    setCurrentYear(py);
    setCurrentMonth(prevDate.getMonth());
  };

  // Upcoming open weekdays for mobile quick strip
  const upcomingWeekdays = React.useMemo(() => {
    const list: { dateStr: string; dayShort: string; dayNum: number; monthShort: string; isSelected: boolean }[] = [];
    const base = new Date();
    let cursor = new Date(base);
    while (list.length < 8) {
      if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
        const y = cursor.getFullYear();
        const m = String(cursor.getMonth() + 1).padStart(2, '0');
        const d = String(cursor.getDate()).padStart(2, '0');
        const ds = `${y}-${m}-${d}`;
        const dayShorts = ['อา', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส'];
        const monthShorts = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        list.push({
          dateStr: ds,
          dayShort: dayShorts[cursor.getDay()],
          dayNum: cursor.getDate(),
          monthShort: monthShorts[cursor.getMonth()],
          isSelected: ds === selectedDate,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return list;
  }, [selectedDate]);

  const yearMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // Fetch month data
  useEffect(() => {
    const fetchMonth = async () => {
      try {
        const data = await ClinicApi.getMonthAvailability(
          yearMonthStr,
          selectedServiceFilter === 'all' ? undefined : selectedServiceFilter
        );
        setMonthData(data);
      } catch (err) {
        console.error('Error fetching month calendar:', err);
      }
    };
    fetchMonth();
  }, [yearMonthStr, selectedServiceFilter, refreshTrigger]);

  // Fetch day details
  useEffect(() => {
    const fetchDay = async () => {
      setIsLoading(true);
      try {
        const [data, ppQuota] = await Promise.all([
          ClinicApi.getDayDetails(selectedDate),
          ClinicApi.getPostpartumStatus(selectedDate),
        ]);
        setDayDetails(data);
        setPostpartumDailyQuota(ppQuota);
      } catch (err) {
        console.error('Error fetching day details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDay();
  }, [selectedDate, refreshTrigger]);

  // Build calendar matrix
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Format Thai Date string for display
  const formatThaiDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const thaiYear = parseInt(y, 10) + 543;
    const monthName = THAI_MONTHS[parseInt(m, 10) - 1];
    return `วัน${new Date(dateStr).toLocaleDateString('th-TH', { weekday: 'long' })}ที่ ${parseInt(d, 10)} ${monthName} พ.ศ. ${thaiYear}`;
  };

  // Group slots into Regular and Overtime
  const regularSlots = dayDetails?.slots?.filter((s: any) => !s.isOvertime) || [];
  const overtimeSlots = dayDetails?.slots?.filter((s: any) => s.isOvertime) || [];

  return (
    <div id="master-calendar" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            <CalendarCheck className="w-4 h-4" />
            <span>Clinic Master Calendar · ปฏิทินรวมคลินิก</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            ผังคิวและรอบเวลาให้บริการ
          </h2>
          <p className="text-stone-600 text-sm mt-1">
            คลิกเลือกวันที่บนปฏิทินเพื่อดูสถานะคิวรายรอบเวลา (ในเวลาราชการ / นอกเวลาราชการ) 
            และจำนวนคิวว่างแบบเรียลไทม์
          </p>
        </div>

        {/* Legend / Status Indicators */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 bg-stone-100 p-2.5 rounded-lg border border-stone-200">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>ว่างพร้อมจอง</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>ใกล้เต็ม / นอกเวลา</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>เต็มแล้ว</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
            <span>อบสมุนไพร (โควตา 3 เคส/วัน)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-400"></span>
            <span>ปิดเสาร์-อาทิตย์</span>
          </div>
        </div>
      </div>

      {/* Mobile-Only Quick Weekdays Navigation & Calendar Toggle */}
      <div className="lg:hidden bg-white p-3.5 rounded-2xl border border-stone-200 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
            <span>เลือกวันทำการ (จันทร์ - ศุกร์)</span>
          </div>
          <button
            type="button"
            onClick={() => setShowMobileMonthPicker(!showMobileMonthPicker)}
            className="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1"
          >
            <span>{showMobileMonthPicker ? '▲ ซ่อนปฏิทิน' : '📅 ปฏิทินทั้งเดือน'}</span>
          </button>
        </div>

        {/* Horizontal quick weekday strip */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
          {upcomingWeekdays.map((item) => {
            const dayInfo = monthData[item.dateStr];
            const isFull = dayInfo?.isFull;
            const totalBookings = dayInfo?.totalBookings || 0;

            return (
              <button
                key={item.dateStr}
                onClick={() => {
                  setSelectedDate(item.dateStr);
                  const [y, m] = item.dateStr.split('-').map(Number);
                  setCurrentYear(y);
                  setCurrentMonth(m - 1);
                }}
                className={`min-w-[66px] flex-shrink-0 p-2 rounded-xl text-center border transition-all ${
                  item.isSelected
                    ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800'
                }`}
              >
                <span className={`text-[11px] block leading-tight ${item.isSelected ? 'text-emerald-100 font-semibold' : 'text-stone-500 font-medium'}`}>
                  {item.dayShort}
                </span>
                <span className="text-base font-bold font-mono block leading-snug my-0.5">
                  {item.dayNum}
                </span>
                <span className={`text-[9px] block font-mono truncate ${
                  item.isSelected
                    ? 'text-emerald-100'
                    : isFull
                    ? 'text-rose-600 font-bold'
                    : totalBookings > 0
                    ? 'text-stone-600'
                    : 'text-stone-400'
                }`}>
                  {isFull ? 'เต็ม' : totalBookings > 0 ? `${totalBookings} คิว` : 'ว่าง'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Month Calendar Picker (5 cols) */}
        <div className={`lg:col-span-5 bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5 space-y-4 ${
          showMobileMonthPicker ? 'block' : 'hidden lg:block'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <span className="text-lg font-bold text-stone-900">
                {THAI_MONTHS[currentMonth]} {currentYear + 543}
              </span>
              <span className="block text-xs text-stone-500 font-mono">
                {currentYear}-{String(currentMonth + 1).padStart(2, '0')}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleGoToday}
                className="px-2.5 py-1 text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded border border-stone-200 transition-colors mr-1"
              >
                วันทำการล่าสุด
              </button>
              <button
                onClick={handlePrevMonth}
                aria-label="เดือนก่อนหน้า"
                className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors border border-stone-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                aria-label="เดือนถัดไป"
                className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors border border-stone-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-stone-500 py-1">
            {THAI_DAYS.map((d, idx) => (
              <div
                key={d}
                className={idx === 0 || idx === 6 ? 'text-stone-400 font-medium' : 'text-stone-800 font-bold'}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid - Optimized with minimum touch height */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-12 sm:h-14 rounded-lg bg-stone-50/50" />;
              }

              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;
              const isToday =
                new Date().getFullYear() === currentYear &&
                new Date().getMonth() === currentMonth &&
                new Date().getDate() === day;

              const isClosed = isWeekend(dateStr);
              const dayInfo = monthData[dateStr];
              const totalBookings = dayInfo?.totalBookings || 0;
              const saunaAlerts = dayInfo?.saunaAlerts || 0;
              const isFull = dayInfo?.isFull;

              if (isClosed) {
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative min-h-[48px] sm:h-14 p-1 sm:p-1.5 rounded-xl text-left flex flex-col justify-between transition-all border ${
                      isSelected
                        ? 'border-stone-400 bg-stone-200/80 text-stone-900 font-bold ring-2 ring-stone-300'
                        : 'border-stone-100 bg-stone-50/70 hover:bg-stone-100 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-stone-400 font-medium">
                        {day}
                      </span>
                    </div>
                    <div className="text-[9px] text-stone-400 font-medium">
                      ปิด
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative min-h-[48px] sm:h-14 p-1 sm:p-1.5 rounded-xl text-left flex flex-col justify-between transition-all border ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-sm'
                      : isToday
                      ? 'border-emerald-300 bg-white hover:bg-stone-50 text-stone-900 font-semibold'
                      : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs ${isToday ? 'text-emerald-700 underline font-bold' : ''}`}>
                      {day}
                    </span>
                    {saunaAlerts > 0 && (
                      <span
                        title={`มีรอบอบสมุนไพรที่ยังไม่ครบ 3 ท่าน (${saunaAlerts} รอบ)`}
                        className="w-1.5 h-1.5 rounded-full bg-orange-500"
                      />
                    )}
                  </div>

                  <div className="text-[9px] sm:text-[10px] font-mono tabular-nums leading-tight">
                    {totalBookings > 0 ? (
                      <span className={isFull ? 'text-rose-600 font-semibold' : 'text-stone-600'}>
                        {totalBookings} คิว
                      </span>
                    ) : (
                      <span className="text-stone-300">ว่าง</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 text-xs text-stone-500 space-y-1 bg-stone-50 p-3 rounded-lg border border-stone-200">
            <div className="flex items-center gap-1.5 text-stone-700 font-medium">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              <span>คำแนะนำการจองและอัตราค่าบริการ:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-stone-600">
              • <strong>เปิดบริการเฉพาะวันจันทร์ - วันศุกร์ (ปิดทำการวันเสาร์และวันอาทิตย์)</strong>
              <br />
              • <strong>นวดและประคบสมุนไพร</strong>: 250 บาท/ชม. (นวดประคบ + นวดสุขภาพ 2 ชม. 450 บาท)
              <br />
              • <strong>อบสมุนไพร</strong>: 120 บาท (จำกัด 3 เคส/วัน งดรอบ 11:00, 16:00 และนอกเวลา)
              <br />
              • <strong>ดูแลมารดาหลังคลอด (ทับหม้อเกลือ)</strong>: 670 บาท <strong>รับสูงสุด 2 เคส/คน/วัน</strong> (คุณกัลยาณี & คุณภัทรจิต รวม 4 เคส/วัน)
              <br />
              • <strong>จ่ายยาสมุนไพร</strong>: สั่งจ่ายโดยแพทย์แผนไทย ราคาตามค่ายาจริง
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Day Time Slots Detail (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Day Header Card */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <Clock className="w-4 h-4" />
                  <span>รายละเอียดรอบเวลาประจำวัน</span>
                </div>
                {/* Mobile Day Nav Arrows */}
                <div className="flex items-center gap-1 sm:hidden">
                  <button
                    onClick={() => handleJumpToPrevWeekday(selectedDate)}
                    className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 active:bg-stone-200 border border-stone-200 text-xs"
                    aria-label="วันทำการก่อนหน้า"
                    title="วันทำการก่อนหน้า"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleJumpToNextWeekday(selectedDate)}
                    className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 active:bg-stone-200 border border-stone-200 text-xs"
                    aria-label="วันทำการถัดไป"
                    title="วันทำการถัดไป"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-3 mt-1">
                <h3 className="text-lg sm:text-xl font-bold text-stone-900 leading-tight">
                  {formatThaiDisplayDate(selectedDate)}
                </h3>
                {/* Desktop Day Nav Arrows */}
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onClick={() => handleJumpToPrevWeekday(selectedDate)}
                    className="px-2 py-1 rounded-md text-stone-600 hover:bg-stone-100 border border-stone-200 text-xs font-medium flex items-center gap-0.5"
                    title="วันทำการก่อนหน้า"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>ก่อนหน้า</span>
                  </button>
                  <button
                    onClick={() => handleJumpToNextWeekday(selectedDate)}
                    className="px-2 py-1 rounded-md text-stone-600 hover:bg-stone-100 border border-stone-200 text-xs font-medium flex items-center gap-0.5"
                    title="วันทำการถัดไป"
                  >
                    <span>ถัดไป</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {isWeekend(selectedDate) || dayDetails?.isClosedWeekend ? (
                <div className="text-xs text-rose-600 font-semibold mt-1">
                  วันหยุดทำการคลินิก (ปิดบริการเสาร์-อาทิตย์)
                </div>
              ) : (
                <div className="space-y-1.5 mt-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                    <span>ยอดจองรวม: <b className="text-stone-900 tabular-nums">{dayDetails?.totalBookings || 0}</b> คิว</span>
                    <span aria-hidden="true">·</span>
                    <span>ผู้ช่วยปฏิบัติงาน 9 ท่าน</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Herbal Sauna Daily Quota Badge */}
                    {dayDetails?.saunaDailyStatus && (
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-600">
                        <span className="text-orange-800 font-medium flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-orange-600" />
                          <span>อบสมุนไพรวันนี้:</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                          dayDetails.saunaDailyStatus.isDayFull
                            ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
                            : 'bg-orange-50/90 border-orange-200 text-orange-900 font-semibold'
                        }`}>
                          จองแล้ว {dayDetails.saunaDailyStatus.count}/3 เคส {dayDetails.saunaDailyStatus.isDayFull ? '(เต็มโควตา 3 เคส/วัน)' : `(ว่างอีก ${dayDetails.saunaDailyStatus.remaining} เคส)`}
                        </span>
                      </div>
                    )}

                    {/* Postpartum Daily Quota Badge */}
                    {postpartumDailyQuota && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-600">
                        <span className="text-amber-800 font-medium flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>มารดาหลังคลอดวันนี้:</span>
                        </span>
                        <span className="bg-amber-50/80 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-mono">
                          กัลยาณี: <strong className={postpartumDailyQuota.staff_3.isFull ? 'text-rose-600' : 'text-emerald-700'}>{postpartumDailyQuota.staff_3.count}/2</strong>
                        </span>
                        <span className="bg-amber-50/80 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-mono">
                          ภัทรจิต: <strong className={postpartumDailyQuota.staff_6.isFull ? 'text-rose-600' : 'text-emerald-700'}>{postpartumDailyQuota.staff_6.count}/2</strong>
                        </span>
                        <span className={`text-[10px] font-semibold ${postpartumDailyQuota.isDayFull ? 'text-rose-600' : 'text-amber-800'}`}>
                          ({postpartumDailyQuota.totalCount}/4 เคส {postpartumDailyQuota.isDayFull ? 'เต็มโควตาวัน' : `ว่างอีก ${4 - postpartumDailyQuota.totalCount}`})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!(isWeekend(selectedDate) || dayDetails?.isClosedWeekend) && (
              <button
                onClick={() => onSelectSlotToBook(selectedDate, '09:00', selectedServiceFilter === 'all' ? undefined : selectedServiceFilter)}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-5 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm whitespace-nowrap flex items-center justify-center gap-1.5"
              >
                <span>+ จองคิวในวันนี้</span>
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-28 bg-stone-200 rounded-xl" />
              <div className="h-28 bg-stone-200 rounded-xl" />
              <div className="h-28 bg-stone-200 rounded-xl" />
            </div>
          ) : isWeekend(selectedDate) || dayDetails?.isClosedWeekend ? (
            /* Dedicated Weekend Closed Notice */
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-stone-100 border border-stone-200 text-stone-400 flex items-center justify-center mx-auto">
                <CalendarX2 className="w-8 h-8 text-stone-400" />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider block">
                  วันหยุดทำการคลินิก (Closed on Weekends)
                </span>
                <h4 className="text-xl font-bold text-stone-900">
                  {formatThaiDisplayDate(selectedDate)}
                </h4>
                <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                  กลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลพระนครศรีอยุธยา 
                  <strong className="text-stone-900 block font-semibold mt-1">
                    เปิดให้บริการเฉพาะวันจันทร์ - วันศุกร์ (ไม่เปิดบริการเสาร์-อาทิตย์)
                  </strong>
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleJumpToNextWeekday(selectedDate)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm inline-flex items-center gap-2"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>ดูคิวนัดหมายวันทำการถัดไป (วันจันทร์)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 1. REGULAR HOURS GROUP (รอบในเวลาราชการ) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                      รอบในเวลาราชการ (Regular Hours)
                    </h4>
                    <span className="text-xs text-stone-500">
                      09:00 - 16:00 น. (อัตราค่าบริการปกติ)
                    </span>
                  </div>
                  <span className="text-xs text-stone-500 font-mono">7 รอบเวลา</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {regularSlots.map((slotItem: any) => (
                    <SlotCard
                      key={slotItem.timeSlot.id}
                      slotItem={slotItem}
                      selectedDate={selectedDate}
                      selectedServiceFilter={selectedServiceFilter}
                      onSelectSlotToBook={onSelectSlotToBook}
                      isAdmin={isAdmin}
                      onViewSlotDetails={onViewSlotDetails}
                    />
                  ))}
                </div>
              </div>

              {/* 2. OVERTIME HOURS GROUP (รอบนอกเวลาราชการ) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                      รอบนอกเวลาราชการ (Overtime Hours)
                    </h4>
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                      +ค่าธรรมเนียมนอกเวลา
                    </span>
                  </div>
                  <span className="text-xs text-stone-500 font-mono">3 รอบเวลา</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {overtimeSlots.map((slotItem: any) => (
                    <SlotCard
                      key={slotItem.timeSlot.id}
                      slotItem={slotItem}
                      selectedDate={selectedDate}
                      selectedServiceFilter={selectedServiceFilter}
                      onSelectSlotToBook={onSelectSlotToBook}
                      isAdmin={isAdmin}
                      onViewSlotDetails={onViewSlotDetails}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface SlotCardProps {
  slotItem: any;
  selectedDate: string;
  selectedServiceFilter: ServiceId | 'all';
  onSelectSlotToBook: (date: string, time: string, serviceId?: ServiceId) => void;
  isAdmin: boolean;
  onViewSlotDetails?: (date: string, slotTime: string) => void;
}

const SlotCard: React.FC<SlotCardProps> = ({
  slotItem,
  selectedDate,
  selectedServiceFilter,
  onSelectSlotToBook,
  isAdmin,
  onViewSlotDetails,
}) => {
  const { timeSlot, bookings, totalBookings, services, saunaGroup, isOvertime } = slotItem;

  // Determine availability based on filter
  let serviceAvail = services.massage;
  if (selectedServiceFilter === 'postpartum_care') {
    serviceAvail = services.postpartum;
  } else if (selectedServiceFilter === 'herbal_sauna') {
    serviceAvail = services.sauna;
  } else if (selectedServiceFilter === 'herbal_medicine') {
    serviceAvail = (services as any).medicineAvail || services.massage;
  }

  const isSaunaService = selectedServiceFilter === 'herbal_sauna';
  const isSaunaRestricted = isSaunaService && serviceAvail.isSaunaRestricted;

  // General remaining count
  const remainingQueues = serviceAvail.serviceRemainingCount;
  const isSlotFull = serviceAvail.statusMessage === 'full' || (!isSaunaRestricted && remainingQueues <= 0);

  // Status Badge Logic
  let statusBadge = (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span>ว่าง (เหลือ {remainingQueues} คิว)</span>
    </span>
  );

  if (isSaunaRestricted) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
        <XCircle className="w-3.5 h-3.5" />
        <span>งดให้บริการรอบนี้</span>
      </span>
    );
  } else if (isSlotFull) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
        <XCircle className="w-3.5 h-3.5" />
        <span>เต็มแล้ว</span>
      </span>
    );
  } else if (remainingQueues <= 2) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>ใกล้เต็ม (เหลือ {remainingQueues} คิว)</span>
      </span>
    );
  }

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isSaunaRestricted
          ? 'bg-stone-50 border-stone-200 opacity-60'
          : isSlotFull
          ? 'bg-white border-stone-200 hover:border-stone-300'
          : 'bg-white border-stone-200 hover:border-emerald-300 hover:shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Slot Time & Period Info */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-14 text-center">
            <span className="text-base font-bold text-stone-900 font-mono tabular-nums block">
              {timeSlot.time}
            </span>
            <span className="text-[10px] text-stone-500 block">
              {isOvertime ? 'นอกเวลา' : 'ในเวลา'}
            </span>
          </div>

          <div className="h-8 w-px bg-stone-200 hidden sm:block" />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {statusBadge}

              {isOvertime ? (
                <span className="text-[11px] font-medium text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                  รอบนอกเวลาราชการ
                </span>
              ) : (
                <span className="text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                  รอบในเวลาราชการ
                </span>
              )}

              {/* 2-hour massage feasibility pill */}
              {(selectedServiceFilter === 'all' || selectedServiceFilter === 'massage_compress') &&
                slotItem.twoHourFeasibility?.isFeasible && (
                  <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    นัด 2 ชม. ได้
                  </span>
                )}

              {/* Herbal sauna bookings in this slot */}
              {bookings.filter((b: any) => b.serviceId === 'herbal_sauna').length > 0 && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1 bg-orange-100 text-orange-800">
                  <Flame className="w-3 h-3 text-orange-600" />
                  <span>
                    อบสมุนไพร {bookings.filter((b: any) => b.serviceId === 'herbal_sauna').length} เคส
                  </span>
                </span>
              )}
            </div>

            {/* Service & Staff note */}
            <div className="text-xs text-stone-500 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>จองแล้ว: <strong className="text-stone-800 font-mono tabular-nums">{totalBookings}</strong> คิว</span>
              <span aria-hidden="true">·</span>
              {selectedServiceFilter === 'all' ? (
                <span>
                  ผู้ช่วยแพทย์แผนไทยว่าง: <strong className="text-emerald-700 font-mono tabular-nums">{services.massage.availableStaffCount}</strong> / 9 ท่าน
                </span>
              ) : selectedServiceFilter === 'postpartum_care' ? (
                <span>
                  เฉพาะผู้เชี่ยวชาญมารดาหลังคลอด: ว่าง <strong className="text-emerald-700 font-mono tabular-nums">{services.postpartum.serviceRemainingCount}</strong> / 2 ท่าน
                </span>
              ) : selectedServiceFilter === 'herbal_sauna' ? (
                <span>
                  ห้องอบสมุนไพร: ว่างในรอบนี้ <strong className="text-emerald-700 font-mono tabular-nums">{services.sauna.serviceRemainingCount}</strong> เคส (โควตารวม 3 เคส/วัน)
                </span>
              ) : (
                <span>
                  ห้องตรวจจ่ายยาสมุนไพร: สั่งจ่ายโดยแพทย์แผนไทย (ราคาตามค่ายาจริง)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls - full width on mobile for thumb reach */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-stone-100 sm:border-0 justify-end sm:justify-start">
          {isAdmin && (
            <button
              onClick={() => onViewSlotDetails && onViewSlotDetails(selectedDate, timeSlot.time)}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 rounded-lg transition-colors whitespace-nowrap text-center"
            >
              รายชื่อคิว ({totalBookings})
            </button>
          )}

          {isSaunaRestricted ? (
            <span className="text-xs text-stone-400 italic px-2 py-2 text-center sm:text-left">
              {timeSlot.time === '11:00' || timeSlot.time === '16:00' ? 'ช่วงทำความสะอาด' : 'งดรอบนอกเวลา'}
            </span>
          ) : isSlotFull ? (
            <button
              disabled
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 text-xs font-medium text-stone-400 bg-stone-100 rounded-lg cursor-not-allowed whitespace-nowrap text-center"
            >
              คิวเต็มแล้ว
            </button>
          ) : (
            <button
              onClick={() =>
                onSelectSlotToBook(
                  selectedDate,
                  timeSlot.time,
                  selectedServiceFilter === 'all' ? undefined : selectedServiceFilter
                )
              }
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2.5 sm:py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-sm whitespace-nowrap text-center flex items-center justify-center gap-1.5"
            >
              <span>จองคิวรอบ {timeSlot.time} น.</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
