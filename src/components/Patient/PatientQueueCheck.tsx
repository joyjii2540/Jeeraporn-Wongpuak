import React, { useState, useEffect } from 'react';
import {
  Search,
  Phone,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Flame,
  Bell,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  MapPin,
  Megaphone,
} from 'lucide-react';
import { Booking, CLINIC_SERVICES } from '../../types/clinic';
import { ClinicApi } from '../../services/api';
import {
  getQueueProximity,
  playHospitalQueueChime,
  QueueProximityInfo,
} from '../../utils/queueAlertUtils';

export const PatientQueueCheck: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchedBookings, setSearchedBookings] = useState<Booking[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Sound chime notification toggle
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasChimedMap, setHasChimedMap] = useState<Record<string, boolean>>({});

  // Clock tick state to update countdown every 10 seconds
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Simulation Time for testing proximity alerts anytime
  const [simulatedTimeStr, setSimulatedTimeStr] = useState<string>('real');

  const effectiveNow = React.useMemo(() => {
    if (simulatedTimeStr === 'real') {
      return currentTime;
    }
    const [h, m] = simulatedTimeStr.split(':').map(Number);
    const d = new Date(currentTime);
    d.setHours(h, m, 0, 0);
    return d;
  }, [currentTime, simulatedTimeStr]);

  // Tick timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const results = await ClinicApi.getBookings(phoneNumber.trim());
      setSearchedBookings(results);
    } catch (err) {
      console.error('Error searching bookings:', err);
      setSearchedBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Sound Alert trigger on imminent or called queue
  useEffect(() => {
    if (!soundEnabled || !searchedBookings || searchedBookings.length === 0) return;

    searchedBookings.forEach((b) => {
      const proximity = getQueueProximity(b.date, b.timeSlot, b.status, effectiveNow);
      const isCalled = b.queueStatus === 'called';

      if ((proximity.isUrgent || isCalled) && !hasChimedMap[b.id]) {
        playHospitalQueueChime();
        setHasChimedMap((prev) => ({ ...prev, [b.id]: true }));
      }
    });
  }, [searchedBookings, effectiveNow, soundEnabled, hasChimedMap]);

  const handleTestChime = () => {
    playHospitalQueueChime();
  };

  // Check if any booking is currently imminent or called
  const urgentBookings = (searchedBookings || []).filter((b) => {
    const prox = getQueueProximity(b.date, b.timeSlot, b.status, effectiveNow);
    return prox.isUrgent || b.queueStatus === 'called';
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-2xs">
          <Search className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
          ตรวจสอบสถานะคิวและการแจ้งเตือนเมื่อใกล้ถึงเวลา
        </h2>
        <p className="text-sm text-stone-600 max-w-lg mx-auto">
          กรอกหมายเลขโทรศัพท์ที่ใช้ลงทะเบียน เพื่อดูสถานะคิวนัดหมาย 
          ระบบจะแจ้งเตือนอัตโนมัติเมื่อใกล้ถึงเวลาตรวจ (15-30 นาทีล่วงหน้า) 
          พร้อมเสียงสัญญาณเตือนเรียกคิว
        </p>
      </div>

      {/* Real-time Alert Controls & Simulation Box */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-stone-700 font-medium">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>สถานะระบบแจ้งเตือนสด:</span>
          </div>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
              soundEnabled
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-stone-200 text-stone-600 border-stone-300'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>เปิดเสียงแจ้งเตือนแล้ว</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-stone-500" />
                <span>ปิดเสียงเตือน</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleTestChime}
            className="text-stone-500 hover:text-stone-900 underline underline-offset-2 transition-colors"
          >
            (ทดสอบเสียงสัญญาณ)
          </button>
        </div>

        {/* Time Simulator for Testing Alert */}
        <div className="flex items-center gap-2">
          <span className="text-stone-500">จำลองเวลาทดสอบ:</span>
          <select
            value={simulatedTimeStr}
            onChange={(e) => setSimulatedTimeStr(e.target.value)}
            className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-stone-800 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
          >
            <option value="real">เวลาจริงตามเครื่อง ({effectiveNow.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.)</option>
            <option value="08:45">08:45 น. (จำลองใกล้ถึงคิวรอบ 09:00 น. - เหลือ 15 นาที)</option>
            <option value="09:05">09:05 น. (จำลองถึงรอบ 09:00 น. กำลังให้บริการ)</option>
            <option value="12:45">12:45 น. (จำลองใกล้ถึงคิวรอบ 13:00 น. - เหลือ 15 นาที)</option>
            <option value="13:50">13:50 น. (จำลองใกล้ถึงคิวรอบ 14:00 น. - เหลือ 10 นาที)</option>
            <option value="16:15">16:15 น. (จำลองใกล้ถึงคิวรอบนอกเวลา 16:30 น.)</option>
          </select>
        </div>
      </div>

      {/* Prominent Imminent / Called Queue Alert Banner (If Any) */}
      {urgentBookings.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white p-5 rounded-2xl shadow-lg space-y-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-xs rounded-xl flex items-center justify-center shrink-0">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-100 block">
                แจ้งเตือนคิวด่วนพิเศษ · กลุ่มงานการแพทย์แผนไทย
              </span>
              <h3 className="text-lg font-bold text-white">
                ใกล้ถึงเวลา / ถึงคิวรับบริการของท่านแล้ว!
              </h3>
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-white/20">
            {urgentBookings.map((ub) => {
              const prox = getQueueProximity(ub.date, ub.timeSlot, ub.status, effectiveNow);
              const svc = CLINIC_SERVICES.find((s) => s.id === ub.serviceId);
              return (
                <div
                  key={ub.id}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-[11px] mr-2">
                      {ub.bookingCode}
                    </span>
                    <strong className="text-sm">{ub.patientName}</strong> · {svc?.name}
                    <div className="text-amber-100 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>รอบเวลา <strong>{ub.timeSlot} น.</strong> ({prox.label})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="bg-white text-stone-900 font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs">
                      {ub.queueStatus === 'called' ? '📢 กำลังเรียกคิว!' : prox.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-black/20 rounded-xl p-3 text-xs flex items-center gap-2 text-amber-50">
            <MapPin className="w-4 h-4 shrink-0 text-amber-200" />
            <span>
              <strong>สถานที่รับบริการ:</strong> ตึกแพทย์แผนไทย ศูนย์เวชปฏิบัติครอบครัว รพ.อยุธยา (โรงพยาบาลพระนครศรีอยุธยา)
            </span>
          </div>
        </div>
      )}

      {/* Search Input Card */}
      <form onSubmit={handleSearch} className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="กรอกเบอร์โทรศัพท์ เช่น 0891112233"
            className="w-full pl-10 pr-4 py-2.5 text-base sm:text-sm min-h-[44px] border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm whitespace-nowrap flex items-center justify-center gap-1.5"
        >
          <span>{isLoading ? 'กำลังค้นหา...' : 'ค้นหาประวัติการจอง'}</span>
        </button>
      </form>

      {/* Quick test numbers */}
      <div className="space-y-2 text-center text-xs text-stone-500">
        <span className="block sm:inline sm:mr-2">กดเลือกเบอร์ทดสอบข้อมูลตัวอย่าง:</span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPhoneNumber('089-111-2233');
            }}
            className="inline-flex items-center px-3 py-1.5 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-emerald-800 rounded-full font-mono text-xs transition-colors border border-stone-200"
          >
            089-111-2233 (รอบ 09:00 น.)
          </button>
          <button
            type="button"
            onClick={() => {
              setPhoneNumber('085-789-0123');
            }}
            className="inline-flex items-center px-3 py-1.5 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-emerald-800 rounded-full font-mono text-xs transition-colors border border-stone-200"
          >
            085-789-0123 (รอบ 13:00 น.)
          </button>
          <button
            type="button"
            onClick={() => {
              setPhoneNumber('082-333-9911');
            }}
            className="inline-flex items-center px-3 py-1.5 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-emerald-800 rounded-full font-mono text-xs transition-colors border border-stone-200"
          >
            082-333-9911 (หลังคลอด)
          </button>
        </div>
      </div>

      {/* Results View */}
      {hasSearched && (
        <div className="space-y-4">
          {searchedBookings && searchedBookings.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                <span>พบรายการนัดหมายทั้งหมด {searchedBookings.length} รายการ:</span>
                <span className="font-mono text-stone-400">
                  อัปเดตสถานะอัตโนมัติทุก 10 วินาที
                </span>
              </div>

              {searchedBookings.map((b) => {
                const service = CLINIC_SERVICES.find((s) => s.id === b.serviceId);
                const proximity = getQueueProximity(b.date, b.timeSlot, b.status, effectiveNow);

                return (
                  <div
                    key={b.id}
                    className={`bg-white rounded-2xl border shadow-sm p-6 space-y-4 transition-all ${
                      proximity.isUrgent
                        ? 'border-amber-400 ring-2 ring-amber-200/60'
                        : 'border-stone-200'
                    }`}
                  >
                    {/* Top Row: Code, Service, and Proximity Alert Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-stone-400">
                            {b.bookingCode}
                          </span>
                          {/* Real-time Proximity Badge */}
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${proximity.badgeColor}`}
                          >
                            <Bell className="w-3 h-3" />
                            <span>{b.queueStatus === 'called' ? '📢 กำลังเรียกคิวแล้ว!' : proximity.label}</span>
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-stone-900 mt-0.5">
                          {service?.name}
                        </h4>
                      </div>

                      {/* Official Booking Status */}
                      <div>
                        {b.status === 'confirmed' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ยืนยันนัดหมายแล้ว</span>
                          </span>
                        ) : b.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-800 bg-orange-100 border border-orange-200 px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            <span>รอยืนยัน / รวมกลุ่มอบสมุนไพร</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>ยกเลิกนัดหมาย</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Proximity Alert Detail Box if approaching or active */}
                    {(proximity.category === 'imminent' ||
                      proximity.category === 'approaching' ||
                      proximity.category === 'now_serving' ||
                      b.queueStatus === 'called') && (
                      <div
                        className={`rounded-xl p-3.5 text-xs flex items-start gap-3 border ${
                          b.queueStatus === 'called' || proximity.category === 'imminent'
                            ? 'bg-rose-50 border-rose-300 text-rose-900'
                            : proximity.category === 'now_serving'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-amber-50 border-amber-300 text-amber-900'
                        }`}
                      >
                        <div className="p-1 rounded-lg bg-white/80 shrink-0">
                          <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold flex items-center gap-2">
                            <span>สถานะการแจ้งเตือนใกล้ถึงคิว:</span>
                            <span className="font-mono text-[11px] underline">
                              {b.queueStatus === 'called'
                                ? 'เจ้าหน้าที่กดเรียกคิวแล้ว'
                                : proximity.subLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-700">
                            {b.queueStatus === 'called'
                              ? 'กรุณาแสดงตนที่หน้าห้องตรวจ กลุ่มงานการแพทย์แผนไทย ชั้น 2 เพื่อเข้ารับบริการทันที'
                              : proximity.category === 'imminent'
                              ? 'เหลือเวลาอีกไม่เกิน 15 นาที ขอความกรุณาเตรียมตัวบริเวณที่นั่งพักรอหน้าห้องตรวจ'
                              : 'ขอแนะนำให้เดินทางมาถึงก่อนเวลานัดหมาย 15 นาที เพื่อตรวจคัดกรองและวัดสัญญาณชีพ'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Patient & Appointment Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-stone-600">
                          <User className="w-4 h-4 text-stone-400" />
                          <span>ผู้รับบริการ: <strong>{b.patientName}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-stone-600">
                          <Phone className="w-4 h-4 text-stone-400" />
                          <span>เบอร์โทร: <strong className="font-mono">{b.patientPhone}</strong></span>
                        </div>
                        <div className="text-stone-600">
                          อาการเบื้องต้น: <span className="text-stone-800">{b.symptoms}</span>
                        </div>
                      </div>

                      <div className="space-y-2 bg-stone-50 p-3 rounded-xl border border-stone-200">
                        <div className="flex items-center gap-2 text-stone-700">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          <span>วันที่นัดหมาย: <strong className="font-mono">{b.date}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-stone-700">
                          <Clock className="w-4 h-4 text-emerald-600" />
                          <span>
                            รอบเวลา: <strong className="font-mono">{b.timeSlot}{b.durationHours === 2 ? ` - ${b.endTimeSlot || 'จบตามกำหนด'}` : ''} น.</strong>
                          </span>
                          {b.durationHours === 2 && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.5 rounded font-semibold">
                              2 ชม.
                            </span>
                          )}
                          {b.isOvertime && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-medium">
                              นอกเวลา
                            </span>
                          )}
                        </div>
                        <div className="text-stone-700">
                          ผู้ช่วยผู้ดูแล: <strong className="text-emerald-800">คุณ{b.assignedStaffName || 'รอจัดสรร'}</strong>
                        </div>
                      </div>
                    </div>

                    {b.serviceId === 'herbal_sauna' && b.status === 'pending' && (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-800 flex items-start gap-2">
                        <Flame className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                        <span>
                          คิวอบสมุนไพรรอบนี้กำลังรวบรวมให้ครบโควตา 3 ท่าน เจ้าหน้าที่จะโทรติดต่อยืนยันก่อนเวลานัดหมาย
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-500 text-sm space-y-2">
              <p>ไม่พบรายการนัดหมายสำหรับหมายเลขโทรศัพท์ดังกล่าว</p>
              <p className="text-xs text-stone-400">
                หากท่านยังไม่เคยจองคิว สามารถกดปุ่ม "จองคิวรับบริการ" ได้ทันที
              </p>
            </div>
          )}
        </div>
      )}

      {/* Official Contact Box */}
      <div className="bg-stone-100/90 rounded-2xl border border-stone-200 p-4 text-center text-xs text-stone-600 space-y-1">
        <p className="font-semibold text-stone-800">
          ต้องการสอบถามข้อมูล หรือประสานงานเลื่อนนัดหมาย:
        </p>
        <p>
          โทรติดต่อกลุ่มงานการแพทย์แผนไทยฯ: <a href="tel:0632070036" className="font-mono font-bold text-emerald-800 hover:underline">063-207-0036</a> หรือ <a href="tel:035211888" className="font-mono font-bold text-stone-800 hover:underline">035-211-888 ต่อ 3101</a> (วันจันทร์ - ศุกร์)
        </p>
      </div>
    </div>
  );
};
