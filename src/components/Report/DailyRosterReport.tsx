import React, { useState, useEffect } from 'react';
import { Printer, Calendar, ArrowLeft, RefreshCw, Filter, Download, FileSpreadsheet } from 'lucide-react';
import { Booking, CLINIC_STAFF, Staff } from '../../types/clinic';
import { ClinicApi } from '../../services/api';
import { isBookingOccupyingSlot, isWeekend } from '../../utils/capacityLogic';

interface DailyRosterReportProps {
  onBack?: () => void;
  initialDate?: string;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

// Time slots for Regular Hours as shown in the official hospital form
const REGULAR_REPORT_SLOTS = [
  { time: '09:00', label: '9.00 - 10.00 น.', period: 'morning' },
  { time: '10:00', label: '10.00 - 11.00 น.', period: 'morning' },
  { time: '11:00', label: '11.00 - 12.00 น.', period: 'morning' },
  { time: '13:00', label: '13.00 - 14.00 น.', period: 'afternoon' },
  { time: '14:00', label: '14.00 - 15.00 น.', period: 'afternoon' },
  { time: '15:00', label: '15.00 - 16.00 น.', period: 'afternoon' },
];

const OVERTIME_REPORT_SLOTS = [
  { time: '16:30', label: '16.30 - 17.30 น.', period: 'evening' },
  { time: '17:30', label: '17.30 - 18.30 น.', period: 'evening' },
  { time: '18:30', label: '18.30 - 19.30 น.', period: 'evening' },
];

export const DailyRosterReport: React.FC<DailyRosterReportProps> = ({ onBack, initialDate }) => {
  // Find initial open weekday
  const getInitialWeekday = () => {
    if (initialDate && !isWeekend(initialDate)) return initialDate;
    const d = new Date();
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [reportDate, setReportDate] = useState<string>(getInitialWeekday());
  const [shiftType, setShiftType] = useState<'regular' | 'overtime' | 'all'>('regular');
  const [displayMode, setDisplayMode] = useState<'card' | 'table'>('card');
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // By default, show a subset of staff (or all 9 assistants)
  // In the image provided: ภัทรจิต, สุภาพร, ชลธิชา are shown + ตู้ 1, ตู้ 2
  // We can let the user pick which staff to display or show all 9 assistants!
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([
    'staff_6', // ภัทรจิต (as in image)
    'staff_8', // สุภาพร (as in image)
    'staff_7', // ชลธิชา (as in image)
    'staff_3', // กัลยาณี
    'staff_1', // พัชรา
  ]);

  const [showAllStaff, setShowAllStaff] = useState<boolean>(false);

  const activeStaffList: Staff[] = showAllStaff
    ? CLINIC_STAFF
    : CLINIC_STAFF.filter((s) => selectedStaffIds.includes(s.id));

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const all = await ClinicApi.getBookings();
      const filtered = all.filter((b) => b.date === reportDate && b.status !== 'cancelled');
      setDayBookings(filtered);
    } catch (err) {
      console.error('Error loading report bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [reportDate]);

  // Format Date for Header
  const [year, month, day] = reportDate.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const thaiDayName = dateObj.toLocaleDateString('th-TH', { weekday: 'long' });
  const thaiMonthName = THAI_MONTHS[month - 1];
  const thaiYear = year + 543;

  const currentSlots =
    shiftType === 'regular'
      ? REGULAR_REPORT_SLOTS
      : shiftType === 'overtime'
      ? OVERTIME_REPORT_SLOTS
      : [...REGULAR_REPORT_SLOTS, ...OVERTIME_REPORT_SLOTS];

  // Helper to find booking for a staff member at a specific time (including 2-hour occupancies)
  const getBookingForCell = (time: string, staffId: string) => {
    return dayBookings.find(
      (b) =>
        isBookingOccupyingSlot(b, time) &&
        (b.assignedStaffId === staffId ||
          b.assignedStaffName === CLINIC_STAFF.find((s) => s.id === staffId)?.name)
    );
  };

  // Helper to find Sauna booking for Cabinet 1 & Cabinet 2
  const getSaunaBookingsForSlot = (time: string) => {
    return dayBookings.filter((b) => b.timeSlot === time && b.serviceId === 'herbal_sauna');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Control Bar (Hidden when Printing) */}
      <div className="print:hidden bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
              ระบบออกรายงานตารางคิวประจำวัน (Daily Roster Report)
            </span>
            <h2 className="text-lg font-bold text-stone-900">
              ตารางนัดผู้รับบริการคลินิกแพทย์แผนไทย
            </h2>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-xs">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-transparent text-stone-800 font-mono focus:outline-hidden"
            />
          </div>

          {/* Shift Filter */}
          <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs font-medium">
            <button
              onClick={() => setShiftType('regular')}
              className={`px-3 py-1 rounded-md transition-colors ${
                shiftType === 'regular'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ในเวลาราชการ (09:00 - 16:00)
            </button>
            <button
              onClick={() => setShiftType('overtime')}
              className={`px-3 py-1 rounded-md transition-colors ${
                shiftType === 'overtime'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              นอกเวลา (16:30 - 18:30)
            </button>
            <button
              onClick={() => setShiftType('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                shiftType === 'all'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ทุกรอบเวลา
            </button>
          </div>

          {/* Staff columns toggle */}
          <button
            onClick={() => setShowAllStaff(!showAllStaff)}
            className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 transition-colors whitespace-nowrap"
          >
            {showAllStaff ? 'แสดง 5 ผู้ช่วย' : 'แสดงครบ 9 ผู้ช่วย'}
          </button>

          {/* View Mode Toggle: Mobile Cards vs A4 Table */}
          <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs font-semibold print:hidden">
            <button
              onClick={() => setDisplayMode('card')}
              className={`px-3 py-1 rounded-md transition-colors ${
                displayMode === 'card'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              📱 การ์ดมือถือ
            </button>
            <button
              onClick={() => setDisplayMode('table')}
              className={`px-3 py-1 rounded-md transition-colors ${
                displayMode === 'table'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              📄 ตารางพิมพ์ A4
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>พิมพ์รายงาน (Print Form)</span>
          </button>
        </div>
      </div>

      {/* Notice if Weekend selected */}
      {isWeekend(reportDate) && (
        <div className="print:hidden bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-xs flex items-center justify-between">
          <span>วันที่เลือกตรงกับวันเสาร์/อาทิตย์ (คลินิกหยุดทำการ) แนะนำให้เลือกวันจันทร์ถึงวันศุกร์</span>
          <button
            onClick={() => {
              const d = new Date(reportDate);
              while (d.getDay() === 0 || d.getDay() === 6) {
                d.setDate(d.getDate() + 1);
              }
              const ny = d.getFullYear();
              const nm = String(d.getMonth() + 1).padStart(2, '0');
              const nd = String(d.getDate()).padStart(2, '0');
              setReportDate(`${ny}-${nm}-${nd}`);
            }}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            เปลี่ยนเป็นวันจันทร์ถัดไป →
          </button>
        </div>
      )}

      {/* MOBILE CARD VIEW (when displayMode === 'card') */}
      {displayMode === 'card' && (
        <div className="print:hidden space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-800">
                สรุปคิวนัดหมายรายรอบเวลา ({thaiDayName} {day} {thaiMonthName} {thaiYear})
              </span>
              <div className="text-sm font-bold text-stone-900 mt-0.5">
                ยอดนัดหมายทั้งหมด: <span className="text-emerald-700 font-mono">{dayBookings.length}</span> คิว
              </div>
            </div>
            <button
              onClick={() => setDisplayMode('table')}
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200"
            >
              ดูตารางพิมพ์ A4 →
            </button>
          </div>

          <div className="space-y-3">
            {currentSlots.map((slot) => {
              const slotBookings = dayBookings.filter((b) => isBookingOccupyingSlot(b, slot.time));

              return (
                <div key={slot.time} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                      <span className="text-sm font-bold font-mono text-stone-900">
                        {slot.label}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {slotBookings.length} คิว
                    </span>
                  </div>

                  <div className="p-3 sm:p-4 space-y-2.5">
                    {slotBookings.length === 0 ? (
                      <div className="text-center py-3 text-xs text-stone-400">
                        ว่าง · ยังไม่มีผู้รับบริการในรอบเวลานี้
                      </div>
                    ) : (
                      slotBookings.map((b) => (
                        <div key={b.id} className="p-3 bg-stone-50/80 rounded-xl border border-stone-200/80 space-y-1.5 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <strong className="text-sm font-bold text-stone-900 block">{b.patientName}</strong>
                              <span className="text-[11px] font-mono text-stone-500">HN/รหัส: {b.bookingCode}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 shrink-0">
                              {b.durationHours === 2 ? 'นวด 2 ชม.' : b.serviceId === 'postpartum_care' ? 'ทับหม้อเกลือ' : b.serviceId === 'herbal_sauna' ? 'อบสมุนไพร' : 'นวดประคบ 1 ชม.'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] pt-1 border-t border-stone-200 text-stone-600">
                            <div>
                              <span className="text-stone-400">ผู้ดูแล:</span> <strong className="text-stone-800">{b.assignedStaffName || 'เจ้าหน้าที่จัดสรร'}</strong>
                              {b.isStaffRequested && (
                                <span className="ml-1 text-[9px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded font-medium">
                                  ผู้ป่วยเลือกเอง
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-stone-400">โทร:</span> <a href={`tel:${b.patientPhone}`} className="text-emerald-700 font-mono hover:underline">{b.patientPhone}</a>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-stone-400">อาการ:</span> <span className="text-stone-700">{b.symptoms}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* REPORT PAPER CONTAINER (Formatted strictly like the official document in user screenshot) */}
      <div className={`bg-white p-6 sm:p-8 rounded-2xl border border-stone-300 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 print:w-full ${
        displayMode === 'card' ? 'hidden print:block' : 'block'
      }`}>
        {/* Document Header */}
        <div className="text-center space-y-1 mb-5">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-emerald-600 p-0.5 bg-white shrink-0">
              <img
                src="/assets/aistudio/107108_5321bd65.jpg"
                alt="PANTHAI AYHOS"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-stone-900 font-sans tracking-tight">
              ตารางนัดผู้รับบริการคลินิกแพทย์แผนไทย {shiftType === 'overtime' ? '(นอกเวลาราชการ)' : '(ในเวลาราชการ)'} โรงพยาบาลพระนครศรีอยุธยา
            </h1>
          </div>
          <div className="text-[11px] text-stone-500">
            โทรติดต่อ: 063-207-0036 และ 035-211-888 ต่อ 3101
          </div>

          <div className="text-xs sm:text-sm text-stone-700 font-medium pt-1">
            วัน <span className="font-semibold text-stone-900 underline underline-offset-4 decoration-stone-400 px-2">{thaiDayName}</span>
            ที่ <span className="font-semibold text-stone-900 underline underline-offset-4 decoration-stone-400 px-2">{day}</span>
            เดือน <span className="font-semibold text-stone-900 underline underline-offset-4 decoration-stone-400 px-2">{thaiMonthName}</span>
            พ.ศ. <span className="font-semibold text-stone-900 underline underline-offset-4 decoration-stone-400 px-2">{thaiYear}</span>
          </div>
        </div>

        {/* Mobile Swipe Hint */}
        <div className="print:hidden sm:hidden flex items-center justify-between text-xs text-stone-600 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 mb-3">
          <span className="flex items-center gap-1.5 font-medium text-emerald-900">
            <span>👉 ปัดหน้าจอแนวนอนเพื่อดูคอลัมน์ผู้ช่วยและตู้</span>
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold">
            ตรึงเวลาไว้ซ้าย
          </span>
        </div>

        {/* Printable Queue Roster Table */}
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full border-collapse border-2 border-stone-900 text-xs">
            <thead>
              <tr className="bg-stone-100 text-stone-900 font-bold border-b-2 border-stone-900">
                <th className="border border-stone-900 py-2.5 px-2 text-center w-24 shrink-0 bg-stone-100 sticky left-0 z-20 shadow-xs">
                  เวลา
                </th>
                {activeStaffList.map((staff) => (
                  <th
                    key={staff.id}
                    className="border border-stone-900 py-2.5 px-3 text-center min-w-[150px]"
                  >
                    {staff.name}
                  </th>
                ))}
                {/* Cabinets for Herbal Sauna (ตู้ 1, ตู้ 2 as in screenshot) */}
                <th className="border border-stone-900 py-2.5 px-2 text-center w-16 bg-stone-50">
                  ตู้ 1
                </th>
                <th className="border border-stone-900 py-2.5 px-2 text-center w-16 bg-stone-50">
                  ตู้ 2
                </th>
              </tr>
            </thead>
            <tbody>
              {currentSlots.map((slot, sIdx) => {
                const saunaBookings = getSaunaBookingsForSlot(slot.time);
                const isAfternoonBreak = sIdx === 2 && shiftType === 'regular';

                return (
                  <React.Fragment key={slot.time}>
                    <tr className="border-b border-stone-900">
                      {/* Time Slot Column - Sticky on Mobile */}
                      <td className="border border-stone-900 py-3 px-2 text-center font-bold text-stone-900 align-top bg-stone-50/95 sticky left-0 z-10 shadow-xs">
                        <div className="leading-tight">{slot.label}</div>
                      </td>

                      {/* Staff Columns */}
                      {activeStaffList.map((staff) => {
                        const booking = getBookingForCell(slot.time, staff.id);

                        return (
                          <td
                            key={staff.id}
                            className="border border-stone-900 p-2 align-top text-stone-900 text-[11px] leading-relaxed min-w-[150px] bg-white"
                          >
                            {booking ? (
                              <div className="space-y-0.5">
                                {booking.timeSlot !== slot.time && booking.durationHours === 2 ? (
                                  <div className="bg-emerald-50/90 p-1.5 rounded border border-dashed border-emerald-400">
                                    <div className="text-[10px] font-bold text-emerald-900 flex items-center gap-1">
                                      <span>↳ [นวดต่อเนื่อง 2 ชม.]</span>
                                    </div>
                                    <div className="font-bold text-stone-900 leading-tight">
                                      {booking.patientName}
                                    </div>
                                    <div className="text-[10px] font-mono text-stone-600">
                                      {booking.timeSlot} - {booking.endTimeSlot || 'จบตามเวลา'}
                                    </div>
                                    <div className="text-[10px] text-emerald-800">
                                      (ต่อเนื่องจากรอบ {booking.timeSlot} น.)
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div>
                                      <span className="text-stone-500">ชื่อ:</span>{' '}
                                      <strong className="font-bold text-stone-900">{booking.patientName}</strong>
                                      {booking.durationHours === 2 && (
                                        <span className="ml-1 inline-block text-[10px] text-emerald-800 bg-emerald-100 font-bold px-1.5 py-0.2 rounded border border-emerald-300">
                                          [นวด 2 ชม.]
                                        </span>
                                      )}
                                      {booking.serviceId === 'postpartum_care' && (
                                        <span className="block text-[10px] text-amber-800 font-semibold leading-tight">
                                          [มารดาหลังคลอด/ทับหม้อเกลือ]
                                        </span>
                                      )}
                                      {booking.serviceId === 'herbal_medicine' && (
                                        <span className="block text-[10px] text-teal-800 font-semibold leading-tight">
                                          [จ่ายยาสมุนไพร]
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-stone-500">HN/รหัส:</span>{' '}
                                      <span className="font-mono font-medium text-stone-700">{booking.bookingCode}</span>
                                    </div>
                                    <div>
                                      <span className="text-stone-500">โทร:</span>{' '}
                                      <span className="font-mono text-stone-700">{booking.patientPhone}</span>
                                    </div>
                                    <div className="text-stone-800">
                                      <span className="text-stone-500">อาการ:</span>{' '}
                                      <span className="font-medium text-emerald-900">{booking.symptoms}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              /* Empty Form Template with Dotted Lines matching the user's photo */
                              <div className="space-y-1 text-stone-400 font-light select-none">
                                <div>ชื่อ ..........................................</div>
                                <div>HN ..........................................</div>
                                <div>โทร ..........................................</div>
                                <div>อาการ ......................................</div>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* ตู้ 1 (Sauna Cabinet 1) */}
                      <td className="border border-stone-900 p-1.5 align-top text-center text-[10px] bg-stone-50/50">
                        {saunaBookings[0] ? (
                          <div className="font-bold text-orange-900 leading-tight">
                            {saunaBookings[0].patientName}
                            <span className="block text-[9px] text-stone-500 font-mono">
                              {saunaBookings[0].patientPhone}
                            </span>
                          </div>
                        ) : (
                          <span className="text-stone-300">-</span>
                        )}
                      </td>

                      {/* ตู้ 2 (Sauna Cabinet 2) */}
                      <td className="border border-stone-900 p-1.5 align-top text-center text-[10px] bg-stone-50/50">
                        {saunaBookings[1] ? (
                          <div className="font-bold text-orange-900 leading-tight">
                            {saunaBookings[1].patientName}
                            <span className="block text-[9px] text-stone-500 font-mono">
                              {saunaBookings[1].patientPhone}
                            </span>
                          </div>
                        ) : (
                          <span className="text-stone-300">-</span>
                        )}
                      </td>
                    </tr>

                    {/* Blue horizontal break line after 11.00-12.00 (Lunch break) matching the user screenshot */}
                    {isAfternoonBreak && (
                      <tr className="bg-sky-100/80 border-y-2 border-stone-900">
                        <td
                          colSpan={activeStaffList.length + 3}
                          className="py-1 px-4 text-center text-xs font-semibold text-sky-900 tracking-wider"
                        >
                          พักรับประทานอาหารกลางวัน (12.00 - 13.00 น.)
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Notes & Signatures */}
        <div className="mt-6 pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-600 gap-3">
          <div>
            <span>ผู้พิมพ์รายงาน: เจ้าหน้าที่งานธุรการและจัดคิว · ระบบ Clinic Master Calendar</span>
          </div>
          <div className="text-right">
            <span>ลงชื่อ ................................................................ (แพทย์แผนไทยผู้ควบคุมเวร)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
