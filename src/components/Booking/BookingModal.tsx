import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Flame,
  HeartHandshake,
  ShieldAlert,
  UserCheck,
  Users,
  Check,
  Pill,
} from 'lucide-react';
import {
  Booking,
  CLINIC_SERVICES,
  CLINIC_TIME_SLOTS,
  HERBAL_SAUNA_ALLOWED_SLOTS,
  HERBAL_SAUNA_FORBIDDEN_SLOTS,
  ServiceId,
  TimeSlot,
} from '../../types/clinic';
import { ClinicApi } from '../../services/api';
import {
  canSlotAccommodateTwoHours,
  CONSECUTIVE_SLOT_MAP,
  getSlotEndTime,
  isWeekend,
} from '../../utils/capacityLogic';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  initialTime?: string;
  initialServiceId?: ServiceId;
  onBookingSuccess: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  initialTime,
  initialServiceId = 'massage_compress',
  onBookingSuccess,
}) => {
  const todayStr = new Date().toISOString().substring(0, 10);

  // Form State
  const [serviceId, setServiceId] = useState<ServiceId>(initialServiceId);
  const [durationHours, setDurationHours] = useState<1 | 2>(1);
  const [date, setDate] = useState<string>(initialDate || todayStr);
  const [timeSlot, setTimeSlot] = useState<string>(initialTime || '09:00');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientIdCard, setPatientIdCard] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');

  // Assistant Selection: 'auto' (system allocates) vs 'custom' (patient chooses)
  const [assistantMode, setAssistantMode] = useState<'auto' | 'custom'>('auto');
  const [requestedStaffId, setRequestedStaffId] = useState<string>('auto');
  const [staffAvailability, setStaffAvailability] = useState<any[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);
  const [dayDetails, setDayDetails] = useState<any>(null);
  const [postpartumQuota, setPostpartumQuota] = useState<any>(null);
  const [saunaDailyQuota, setSaunaDailyQuota] = useState<any>(null);

  // Sync props when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialDate) setDate(initialDate);
      if (initialServiceId) setServiceId(initialServiceId);
      if (initialTime) {
        setTimeSlot(initialTime);
      } else {
        setTimeSlot('09:00');
      }
      setDurationHours(1);
      setAssistantMode('auto');
      setRequestedStaffId('auto');
      setErrorMessage(null);
      setSuccessBooking(null);
    }
  }, [isOpen, initialDate, initialTime, initialServiceId]);

  // Reset duration to 1 when choosing services other than massage
  useEffect(() => {
    if (serviceId !== 'massage_compress') {
      setDurationHours(1);
    }
  }, [serviceId]);

  // If 2 hours is selected on an invalid start slot, switch to valid 09:00
  useEffect(() => {
    if (serviceId === 'massage_compress' && durationHours === 2) {
      if (!canSlotAccommodateTwoHours(timeSlot)) {
        setTimeSlot('09:00');
      }
    }
  }, [durationHours, serviceId, timeSlot]);

  // Load day details to validate slot availability dynamically
  useEffect(() => {
    if (!isOpen || !date) return;
    const fetchDay = async () => {
      try {
        const details = await ClinicApi.getDayDetails(date);
        setDayDetails(details);
      } catch (err) {
        console.error('Error fetching day details for booking modal:', err);
      }
    };
    fetchDay();
  }, [isOpen, date]);

  // Load postpartum quota for selected date
  useEffect(() => {
    if (!isOpen || !date) return;
    const fetchPostpartumQuota = async () => {
      try {
        const quota = await ClinicApi.getPostpartumStatus(date);
        setPostpartumQuota(quota);
      } catch (err) {
        console.error('Error fetching postpartum quota:', err);
      }
    };
    fetchPostpartumQuota();
  }, [isOpen, date, serviceId]);

  // Load herbal sauna daily quota (3 cases/day)
  useEffect(() => {
    if (!isOpen || !date) return;
    const fetchSaunaQuota = async () => {
      try {
        const quota = await ClinicApi.getSaunaDailyStatus(date);
        setSaunaDailyQuota(quota);
      } catch (err) {
        console.error('Error fetching sauna quota:', err);
      }
    };
    fetchSaunaQuota();
  }, [isOpen, date, serviceId]);

  // Load assistant availability for the chosen service, date, time slot, duration
  useEffect(() => {
    if (!isOpen || !date || !timeSlot || !serviceId) return;
    let active = true;
    setIsLoadingStaff(true);
    ClinicApi.getStaffAvailability(serviceId, date, timeSlot, durationHours)
      .then((data) => {
        if (active) {
          setStaffAvailability(data);
          setIsLoadingStaff(false);
          // If the currently selected assistant is now unavailable, reset to 'auto'
          if (requestedStaffId !== 'auto') {
            const currentSelected = data.find((s: any) => s.staff.id === requestedStaffId);
            if (!currentSelected || !currentSelected.isAvailable) {
              setRequestedStaffId('auto');
            }
          }
        }
      })
      .catch(() => {
        if (active) setIsLoadingStaff(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, serviceId, date, timeSlot, durationHours, requestedStaffId]);

  // If herbal sauna is chosen and current time slot is forbidden, auto-switch to 09:00
  useEffect(() => {
    if (serviceId === 'herbal_sauna') {
      if (HERBAL_SAUNA_FORBIDDEN_SLOTS.includes(timeSlot)) {
        setTimeSlot('09:00');
      }
    }
  }, [serviceId, timeSlot]);

  if (!isOpen) return null;

  const currentService = CLINIC_SERVICES.find((s) => s.id === serviceId)!;
  const currentSlotDef = CLINIC_TIME_SLOTS.find((s) => s.time === timeSlot);
  const isOvertime = currentSlotDef?.is_overtime || false;

  const currentSlotDetails = dayDetails?.slots?.find((s: any) => s.timeSlot.time === timeSlot);
  const isTwoHourFeasible = currentSlotDetails?.twoHourFeasibility?.isFeasible ?? true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!patientName.trim()) {
      setErrorMessage('กรุณาระบุชื่อ-นามสกุลผู้รับบริการ');
      return;
    }
    if (!patientPhone.trim() || patientPhone.trim().length < 9) {
      setErrorMessage('กรุณาระบุหมายเลขโทรศัพท์ที่ถูกต้อง (อย่างน้อย 9-10 หลัก)');
      return;
    }
    if (!symptoms.trim()) {
      setErrorMessage('กรุณาระบุอาการเบื้องต้นหรือจุดประสงค์ในการเข้ารับบริการ');
      return;
    }

    // Weekend Check: Closed on Saturday and Sunday
    if (isWeekend(date)) {
      setErrorMessage('คลินิกปิดให้บริการในวันเสาร์และวันอาทิตย์ (เปิดให้บริการเฉพาะวันจันทร์ - วันศุกร์)');
      return;
    }

    // Herbal Sauna strict check: Forbidden slots and 3 cases/day quota
    if (serviceId === 'herbal_sauna') {
      if (HERBAL_SAUNA_FORBIDDEN_SLOTS.includes(timeSlot)) {
        setErrorMessage('บริการอบสมุนไพรงดให้บริการในรอบ 11:00, 16:00 และรอบนอกเวลาราชการ');
        return;
      }
      if (saunaDailyQuota?.isDayFull) {
        setErrorMessage('บริการอบสมุนไพรเต็มโควตารายวันแล้วในวันนี้ (จำกัดสูงสุด 3 เคสต่อวัน) กรุณาเลือกวันอื่น');
        return;
      }
    }

    // 2-Hour Massage check
    if (serviceId === 'massage_compress' && durationHours === 2) {
      if (!canSlotAccommodateTwoHours(timeSlot)) {
        setErrorMessage('รอบเวลาที่เลือกไม่สามารถนัด 2 ชั่วโมงได้ (ติดเวลาพักเที่ยงหรือปิดทำการคลินิก)');
        return;
      }
      if (currentSlotDetails?.twoHourFeasibility && !currentSlotDetails.twoHourFeasibility.isFeasible) {
        setErrorMessage(
          currentSlotDetails.twoHourFeasibility.reason ||
            'ไม่มีผู้ช่วยแพทย์แผนไทยที่ว่างต่อเนื่อง 2 ชั่วโมงในรอบนี้ กรุณาเลือกรอบเวลาอื่นหรือนัด 1 ชั่วโมง'
        );
        return;
      }
    }

    // Postpartum Care strict check: Max 2 cases per person per day
    if (serviceId === 'postpartum_care' && postpartumQuota?.isDayFull) {
      setErrorMessage(
        'โควตามารดาหลังคลอดในวันที่เลือกเต็มแล้ว (คุณกัลยาณี และ คุณภัทรจิต รับเคสครบสูงสุด 2 เคสต่อคนต่อวันแล้ว) กรุณาเลือกวันอื่น'
      );
      return;
    }

    // Assistant Selection check
    const finalRequestedStaffId = assistantMode === 'custom' && requestedStaffId !== 'auto' ? requestedStaffId : undefined;

    setIsSubmitting(true);
    try {
      const res = await ClinicApi.createBooking({
        patientName,
        patientPhone,
        patientIdCard,
        symptoms,
        serviceId,
        date,
        timeSlot,
        durationHours: serviceId === 'massage_compress' ? durationHours : 1,
        notes,
        requestedStaffId: finalRequestedStaffId,
      });

      if (!res.success || !res.booking) {
        setErrorMessage(res.error || 'ไม่สามารถทำการจองได้ กรุณาตรวจสอบคิวว่างอีกครั้ง');
      } else {
        setSuccessBooking(res.booking);
        onBookingSuccess(res.booking);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPatientName('');
    setPatientPhone('');
    setPatientIdCard('');
    setSymptoms('');
    setNotes('');
    setAssistantMode('auto');
    setRequestedStaffId('auto');
    setSuccessBooking(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col my-0 sm:my-8 animate-in slide-in-from-bottom duration-200">
        {/* Mobile Grab Bar */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden shrink-0 bg-stone-50 border-b border-stone-100">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-stone-200 bg-stone-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-emerald-400/80 shadow-xs bg-white p-0.5 shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/107108_5321bd65.jpg"
                alt="PANTHAI AYHOS โลโก้แผนไทย"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 tracking-wider block">
                ตึกแพทย์แผนไทย ศูนย์เวชปฏิบัติครอบครัว รพ.อยุธยา
              </span>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
                จองคิวรับบริการคลินิกการแพทย์แผนไทย
              </h3>
            </div>
          </div>
          <button
            onClick={resetForm}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {successBooking ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500 shadow-sm mx-auto p-0.5 bg-white">
                <img
                  src="/assets/aistudio/107108_5321bd65.jpg"
                  alt="PANTHAI AYHOS"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <h4 className="text-xl font-bold text-stone-900">
                บันทึกการจองคิวสำเร็จเรียบร้อยแล้ว
              </h4>
              <p className="text-stone-600 text-sm">
                รหัสการนัดหมายของคุณคือ: <strong className="text-emerald-700 font-mono text-base">{successBooking.bookingCode}</strong>
              </p>
            </div>

            {/* Ticket Card */}
            <div className="bg-stone-50 rounded-xl border border-stone-200 p-5 space-y-3 text-sm">
              <div className="flex justify-between border-b border-stone-200 pb-2.5">
                <span className="text-stone-500">ผู้รับบริการ:</span>
                <span className="font-semibold text-stone-900">{successBooking.patientName}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2.5">
                <span className="text-stone-500">บริการ:</span>
                <span className="font-semibold text-stone-900">
                  {CLINIC_SERVICES.find((s) => s.id === successBooking.serviceId)?.name}
                  {successBooking.durationHours === 2 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      2 ชั่วโมง (120 นาที)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2.5">
                <span className="text-stone-500">วันและเวลานัด:</span>
                <span className="font-semibold text-stone-900 font-mono">
                  {successBooking.date} เวลา {successBooking.timeSlot}
                  {successBooking.durationHours === 2 ? ` - ${successBooking.endTimeSlot || getSlotEndTime(successBooking.timeSlot, 2)} น.` : ' น.'}
                  {successBooking.isOvertime && ' (รอบนอกเวลาราชการ)'}
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2.5">
                <span className="text-stone-500">ผู้ช่วยแพทย์แผนไทยผู้ดูแล:</span>
                <div className="text-right">
                  <span className="font-semibold text-emerald-800 block">
                    คุณ{successBooking.assignedStaffName || 'เจ้าหน้าที่จัดสรรหน้างาน'}
                    {successBooking.durationHours === 2 && ' (ดูแลต่อเนื่องตลอด 2 ชม.)'}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {successBooking.isStaffRequested ? '✓ ผู้ป่วยระบุผู้ช่วยด้วยตนเอง' : '⚙ ระบบจัดสรรให้อัตโนมัติ (ตามผู้ช่วยที่ว่าง)'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2.5">
                <span className="text-stone-500">อัตราค่าบริการ:</span>
                <span className="font-semibold text-stone-900 font-mono">
                  {successBooking.serviceId === 'herbal_medicine'
                    ? 'ราคาตามค่ายา'
                    : successBooking.durationHours === 2
                    ? (successBooking.isOvertime ? '฿500 (นวดประคบ+นวดสุขภาพ 2 ชม.)' : '฿450 (นวดประคบ+นวดสุขภาพ 2 ชม.)')
                    : (successBooking.isOvertime
                      ? `฿${CLINIC_SERVICES.find((s) => s.id === successBooking.serviceId)?.priceOvertime || 0}`
                      : `฿${CLINIC_SERVICES.find((s) => s.id === successBooking.serviceId)?.priceRegular || 0}`)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-b border-stone-200 pb-2.5">
                <span className="text-stone-500">สถานะการจอง:</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ยืนยันคิวแล้ว
                </span>
              </div>
              <div className="pt-1 text-[11px] text-stone-500 flex items-center justify-between">
                <span>สอบถามหรือเลื่อนนัด โทร:</span>
                <span className="font-mono font-medium text-stone-800">
                  063-207-0036 / 035-211-888 ต่อ 3101
                </span>
              </div>
            </div>

            {successBooking.serviceId === 'herbal_sauna' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-emerald-600" />
                  <span>บริการอบสมุนไพรบำบัด (จำกัด 3 เคสต่อวัน):</span>
                </div>
                <p>
                  ระบบได้ยืนยันคิวนัดหมายของท่านเรียบร้อยแล้วในโควตา 3 เคส/วัน กรุณาเดินทางมาถึงก่อนเวลานัด 10-15 นาทีเพื่อเปลี่ยนเครื่องแต่งกายและตรวจคัดกรองสัญญาณชีพ
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={resetForm}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm"
              >
                ปิดหน้าต่าง / กลับสู่หน้าหลัก
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form with scrollable body and sticky bottom action bar */
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

            {/* Step 1: Select Service */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                1. เลือกประเภทบริการ (Service Type)
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                {CLINIC_SERVICES.map((svc) => (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => setServiceId(svc.id)}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      serviceId === svc.id
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900 mb-1">
                      {svc.id === 'massage_compress' && <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />}
                      {svc.id === 'postpartum_care' && <Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                      {svc.id === 'herbal_sauna' && <Flame className="w-3.5 h-3.5 text-orange-600" />}
                      {svc.id === 'herbal_medicine' && <Pill className="w-3.5 h-3.5 text-teal-600" />}
                      <span className="truncate">{svc.shortName}</span>
                    </div>
                    <div className="text-[11px] text-stone-500 leading-snug line-clamp-2">
                      {svc.id === 'massage_compress' && 'ผู้ช่วย 9 ท่าน (1 ชม. 250.- / 2 ชม. 450.-)'}
                      {svc.id === 'postpartum_care' && 'เฉพาะคุณกัลยาณี & ภัทรจิต (สูงสุด 2 เคส/วัน)'}
                      {svc.id === 'herbal_sauna' && 'จำกัด 3 เคส/วัน (ยืนยันคิวทันที)'}
                      {svc.id === 'herbal_medicine' && 'ตรวจสั่งจ่ายยาสมุนไพรตามอาการ'}
                    </div>
                    <div className="text-[11px] font-mono font-semibold text-emerald-800 mt-2">
                      {svc.priceDisplay ? (
                        <span className="text-teal-700 font-semibold">{svc.priceDisplay}</span>
                      ) : (
                        <>฿{svc.priceRegular} <span className="text-[10px] text-stone-400 font-normal">/ เคส</span></>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 1.5: Massage Duration Selector (1 Hour vs 2 Hours) */}
            {serviceId === 'massage_compress' && (
              <div className="space-y-2 p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>เลือกระยะเวลาการนวด (Massage Duration)</span>
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full">
                    ✨ นวด 2 ชม. รวมนวดสุขภาพ 450.-
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDurationHours(1)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      durationHours === 1
                        ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/30 shadow-xs'
                        : 'bg-white/70 border-emerald-200 hover:bg-white text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">1 ชั่วโมง: นวดและประคบสมุนไพร</span>
                      {durationHours === 1 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      นวดรักษาอาการปวดเมื่อยเฉพาะจุด + ประคบสมุนไพรสดสูตรแพทย์แผนไทย
                    </p>
                    <div className="text-xs font-mono font-semibold text-emerald-800 mt-2">
                      ฿{isOvertime ? currentService.priceOvertime : currentService.priceRegular}
                      <span className="text-[10px] text-stone-400 font-normal"> / เคส (60 นาที)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDurationHours(2)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      durationHours === 2
                        ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/30 shadow-xs'
                        : 'bg-white/70 border-emerald-200 hover:bg-white text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                        <span>2 ชั่วโมง: นวดประคบสมุนไพร + นวดสุขภาพ</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.2 rounded-md">
                          คุ้มค่า
                        </span>
                      </span>
                      {durationHours === 2 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      นวดประคบสมุนไพรแก้อาการ + เสริมนวดสุขภาพผ่อนคลายทั่วร่างกาย (ผู้ช่วยท่านเดิมตลอด 2 ชม.)
                    </p>
                    <div className="text-xs font-mono font-semibold text-emerald-800 mt-2">
                      ฿{isOvertime ? (currentService.priceTwoHoursOvertime || 500) : (currentService.priceTwoHours || 450)}
                      <span className="text-[10px] text-stone-400 font-normal"> / เคส (นวดประคบ+นวดสุขภาพ 2 ชม.)</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Date & Slot Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-500" />
                  <span>2. เลือกวันที่ (Appointment Date)</span>
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-base sm:text-sm min-h-[44px] focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  required
                />
                {isWeekend(date) && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2 rounded-lg text-[11px] flex items-center justify-between mt-1">
                    <span>ปิดบริการเสาร์-อาทิตย์</span>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(date);
                        while (d.getDay() === 0 || d.getDay() === 6) {
                          d.setDate(d.getDate() + 1);
                        }
                        const ny = d.getFullYear();
                        const nm = String(d.getMonth() + 1).padStart(2, '0');
                        const nd = String(d.getDate()).padStart(2, '0');
                        setDate(`${ny}-${nm}-${nd}`);
                      }}
                      className="font-bold underline text-emerald-800 hover:text-emerald-950"
                    >
                      เลือกวันจันทร์ถัดไป →
                    </button>
                  </div>
                )}
              </div>

              {/* Time Slot */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                  <span>3. เลือกรอบเวลา {durationHours === 2 ? '(เวลาเริ่มนวด 2 ชม.)' : '(Time Slot)'}</span>
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-base sm:text-sm min-h-[44px] focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono bg-white"
                  required
                >
                  <optgroup label="รอบในเวลาราชการ (09:00 - 16:00 น.)">
                    {CLINIC_TIME_SLOTS.filter((s) => !s.is_overtime).map((s) => {
                      const isSaunaForbidden =
                        serviceId === 'herbal_sauna' && HERBAL_SAUNA_FORBIDDEN_SLOTS.includes(s.time);
                      const can2h = canSlotAccommodateTwoHours(s.time);
                      const is2hDisabled = durationHours === 2 && !can2h;

                      let labelText = `${s.label} - ในเวลาราชการ`;
                      if (isSaunaForbidden) {
                        labelText = `${s.label} (อบสมุนไพรงดรอบนี้)`;
                      } else if (durationHours === 2) {
                        if (can2h) {
                          labelText = `${s.label} ถึง ${getSlotEndTime(s.time, 2)} น. (นวด 2 ชม. ต่อเนื่อง)`;
                        } else {
                          labelText = `${s.label} (งดรับ 2 ชม. — ติดพักเที่ยง/หมดเวลา)`;
                        }
                      }

                      return (
                        <option
                          key={s.id}
                          value={s.time}
                          disabled={isSaunaForbidden || is2hDisabled}
                        >
                          {labelText}
                        </option>
                      );
                    })}
                  </optgroup>
                  <optgroup label="รอบนอกเวลาราชการ (16:30 - 18:30 น.)">
                    {CLINIC_TIME_SLOTS.filter((s) => s.is_overtime).map((s) => {
                      const isSaunaForbidden = serviceId === 'herbal_sauna';
                      const can2h = canSlotAccommodateTwoHours(s.time);
                      const is2hDisabled = durationHours === 2 && !can2h;

                      let labelText = `${s.label} - นอกเวลาราชการ`;
                      if (isSaunaForbidden) {
                        labelText = `${s.label} (อบสมุนไพรงดรอบนอกเวลา)`;
                      } else if (durationHours === 2) {
                        if (can2h) {
                          labelText = `${s.label} ถึง ${getSlotEndTime(s.time, 2)} น. (นวด 2 ชม. นอกเวลา)`;
                        } else {
                          labelText = `${s.label} (งดรับ 2 ชม. — คลินิกปิด 19:30 น.)`;
                        }
                      }

                      return (
                        <option
                          key={s.id}
                          value={s.time}
                          disabled={isSaunaForbidden || is2hDisabled}
                        >
                          {labelText}
                        </option>
                      );
                    })}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* 2-Hour Massage Notice & Feasibility Status */}
            {serviceId === 'massage_compress' && durationHours === 2 && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                  isTwoHourFeasible
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {isTwoHourFeasible ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="block text-emerald-900 font-semibold">
                        ยืนยันเวลาบริการนวด 2 ชั่วโมง: {timeSlot} ถึง {getSlotEndTime(timeSlot, 2)} น.
                      </strong>
                      <p className="text-[11px] text-emerald-800">
                        ระบบจะล็อกผู้ช่วยแพทย์แผนไทยท่านเดิมดูแลท่านต่อเนื่องตลอด 2 ชั่วโมง และบันทึกการใช้เตียง/ผู้ช่วยทั้ง 2 รอบเวลา
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">ไม่สามารถจองรอบ 2 ชั่วโมงในเวลานี้ได้:</strong>
                      <p className="text-[11px]">
                        {currentSlotDetails?.twoHourFeasibility?.reason ||
                          'ไม่มีผู้ช่วยแพทย์แผนไทยที่ว่างต่อเนื่องในทั้ง 2 รอบเวลา กรุณาเลือกรอบเวลาอื่น'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Special Notice for Selected Service & Time */}
            {serviceId === 'herbal_sauna' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <Flame className="w-4 h-4 text-amber-600" />
                    <span>กติกาบริการอบสมุนไพรบำบัด (จำกัดโควตาสูงสุด 3 เคสต่อวัน):</span>
                  </div>
                  {saunaDailyQuota && (
                    <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-white border border-amber-300 text-amber-900 shadow-2xs">
                      วันนี้จองแล้ว {saunaDailyQuota.count}/3 เคส
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  เปิดบริการเฉพาะรอบ 09:00, 10:00, 13:00, 14:00, 15:00 น. (งดรอบ 11:00, 16:00 และรอบนอกเวลาทั้งหมด) โดย<strong>จำกัดสูงสุด 3 เคสต่อวันทั่วทั้งคลินิก (ไม่ใช่ 3 คนต่อชั่วโมง)</strong> และระบบจะยืนยันคิวนัดหมายทันทีเมื่อมีโควตาว่างในวันนั้น
                </p>
                {saunaDailyQuota?.isDayFull && (
                  <div className="bg-rose-100/90 border border-rose-300 text-rose-800 p-2 rounded-lg text-xs font-semibold">
                    ⚠ โควตาอบสมุนไพรในวันที่เลือกเต็มแล้ว (ครบ 3 เคสต่อวันแล้ว) กรุณาเลือกวันอื่น
                  </div>
                )}
              </div>
            )}

            {serviceId === 'postpartum_care' && (
              <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>กติกาพิเศษบริการมารดาหลังคลอด (รับเคสสูงสุด 2 เคสต่อคนต่อวัน):</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  ทำหัตถการโดยผู้เชี่ยวชาญ 2 ท่าน ได้แก่ <strong>คุณกัลยาณี</strong> และ <strong>คุณภัทรจิต</strong> โดยจำกัดรับไม่เกิน 2 เคสต่อคนต่อวัน (รวมสูงสุด 4 เคส/วัน) เพื่อความประณีตในการบริบาลทับหม้อเกลือ
                </p>
                {postpartumQuota && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
                    <span className="bg-white px-2.5 py-1 rounded-md border border-amber-200 shadow-2xs">
                      คุณกัลยาณี: <strong className={postpartumQuota.staff_3.isFull ? 'text-rose-600' : 'text-emerald-700'}>{postpartumQuota.staff_3.count}/2 เคส</strong>
                    </span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-amber-200 shadow-2xs">
                      คุณภัทรจิต: <strong className={postpartumQuota.staff_6.isFull ? 'text-rose-600' : 'text-emerald-700'}>{postpartumQuota.staff_6.count}/2 เคส</strong>
                    </span>
                    <span className={`text-[11px] font-sans font-semibold ${postpartumQuota.isDayFull ? 'text-rose-700' : 'text-amber-800'}`}>
                      (รวม {postpartumQuota.totalCount}/4 เคส {postpartumQuota.isDayFull ? '— โควตาวันนี้เต็มแล้ว' : `— ว่างอีก ${4 - postpartumQuota.totalCount} เคส`})
                    </span>
                  </div>
                )}
                {postpartumQuota?.isDayFull && (
                  <div className="bg-rose-100/80 border border-rose-300 text-rose-800 p-2 rounded-lg text-xs font-semibold">
                    ⚠ โควตามารดาหลังคลอดในวันที่เลือกเต็มแล้ว (ครบ 2 เคสต่อคนต่อวันแล้ว) กรุณาเลือกวันอื่น
                  </div>
                )}
              </div>
            )}

            {serviceId === 'herbal_medicine' && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 text-xs text-teal-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-teal-800">
                  <Pill className="w-4 h-4 text-teal-600" />
                  <span>บริการตรวจวินิจฉัยและสั่งจ่ายยาสมุนไพร (ราคาตามค่ายา):</span>
                </div>
                <p className="text-[11px] leading-relaxed text-teal-800">
                  ตรวจวินิจฉัยสุขภาพโดยแพทย์แผนไทยวิชาชีพ และสั่งจ่ายยาสมุนไพรตามกลุ่มอาการ อัตราค่าบริการคิด<strong>ราคาตามค่ายาจริง</strong> (สามารถใช้สิทธิการรักษาพยาบาล/บัตรทอง/เบิกจ่ายได้ตามเกณฑ์กรมบัญชีกลาง)
                </p>
              </div>
            )}

            {/* Step 3: Assistant Selection (Patient choice or Auto Allocation) */}
            <div className="space-y-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span>3. การเลือกผู้ช่วยแพทย์แผนไทย (Assistant Selection)</span>
                </label>
                <span className="text-[10px] text-stone-500 font-medium">
                  {assistantMode === 'auto' ? '⚙ ระบบจัดสรรให้อัตโนมัติ' : '👤 ผู้ป่วยระบุเอง'}
                </span>
              </div>

              {/* Selection Mode Radios / Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setAssistantMode('auto');
                    setRequestedStaffId('auto');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    assistantMode === 'auto'
                      ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ไม่ระบุผู้ช่วย (จัดสรรอัตโนมัติ)</span>
                    </span>
                    {assistantMode === 'auto' && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-[11px] text-stone-500 leading-snug">
                    ให้ระบบคัดเลือกผู้ช่วยที่ว่างในรอบเวลานี้ให้อัตโนมัติ (แนะนำ / สะดวกและรวดเร็ว)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAssistantMode('custom');
                    const firstAvailable = staffAvailability.find((s: any) => s.isAvailable);
                    if (firstAvailable) {
                      setRequestedStaffId(firstAvailable.staff.id);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    assistantMode === 'custom'
                      ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-stone-700" />
                      <span>ระบุผู้ช่วยที่ต้องการด้วยตนเอง</span>
                    </span>
                    {assistantMode === 'custom' && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-[11px] text-stone-500 leading-snug">
                    เลือกผู้ช่วยที่ท่านประทับใจ หรือเคยรับบริการมาก่อน จากรายชื่อผู้ช่วยที่ว่างในรอบนี้
                  </p>
                </button>
              </div>

              {/* Custom Assistant List (Shown when assistantMode === 'custom') */}
              {assistantMode === 'custom' && (
                <div className="space-y-2 pt-2 border-t border-stone-200 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-stone-700">
                      รายชื่อผู้ช่วยที่มีสิทธิ์ให้บริการ ({currentService.shortName}):
                    </span>
                    {isLoadingStaff && (
                      <span className="text-[10px] text-emerald-700 font-mono animate-pulse">
                        กำลังตรวจสอบสถานะว่าง...
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {staffAvailability
                      .filter((s: any) => s.isQualified)
                      .map((item: any) => {
                        const isSelected = requestedStaffId === item.staff.id;
                        const isAvailable = item.isAvailable;

                        return (
                          <button
                            key={item.staff.id}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => {
                              if (isAvailable) {
                                setRequestedStaffId(item.staff.id);
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-start justify-between ${
                              !isAvailable
                                ? 'bg-stone-100 border-stone-200 text-stone-400 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-500/25 shadow-xs'
                                : 'bg-white border-stone-200 hover:border-emerald-300 text-stone-700'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                                <span>คุณ{item.staff.name}</span>
                                {item.staff.isPostpartumCertified && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 font-medium px-1 py-0.2 rounded-sm">
                                    ผู้เชี่ยวชาญมารดา
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-stone-500">
                                {item.staff.title || 'ผู้ช่วยแพทย์แผนไทย'}
                              </div>
                              {item.reason && (
                                <div className="text-[10px] text-rose-600 font-medium">
                                  {item.reason}
                                </div>
                              )}
                              {serviceId === 'postpartum_care' && item.postpartumDailyCount !== undefined && (
                                <div className="text-[10px] font-mono text-stone-500">
                                  เคสวันนี้: {item.postpartumDailyCount}/2 เคส
                                </div>
                              )}
                            </div>

                            <div className="shrink-0 ml-2 mt-0.5">
                              {isSelected ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                  <Check className="w-3 h-3" /> เลือกท่านนี้
                                </span>
                              ) : isAvailable ? (
                                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                  ว่าง
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-400 bg-stone-200 px-2 py-0.5 rounded-md">
                                  ไม่ว่าง
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  {staffAvailability.filter((s: any) => s.isQualified && s.isAvailable).length === 0 && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                      ขณะนี้ไม่มีผู้ช่วยแพทย์แผนไทยที่ว่างในรอบเวลา {timeSlot} น. กรุณาเลือกรอบเวลาอื่น
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fee summary banner */}
            <div className="bg-stone-100 border border-stone-200 rounded-xl p-3 text-xs text-stone-700 flex items-center justify-between">
              <div>
                <span className="font-semibold text-stone-800">
                  {currentService.name}
                  {serviceId === 'massage_compress' && ` (${durationHours} ชั่วโมง)`}
                </span>
                <span className="text-stone-500 block text-[11px]">
                  {isOvertime ? 'รอบนอกเวลาราชการ (16:30 - 18:30 น.)' : 'รอบในเวลาราชการ (09:00 - 16:00 น.)'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-500 block">ค่าบริการรวม</span>
                <strong className="text-emerald-800 font-mono text-base font-bold">
                  {currentService.priceDisplay ? (
                    currentService.priceDisplay
                  ) : serviceId === 'massage_compress' && durationHours === 2 ? (
                    isOvertime ? `฿${currentService.priceTwoHoursOvertime || 500}` : `฿${currentService.priceTwoHours || 450}`
                  ) : (
                    isOvertime ? `฿${currentService.priceOvertime}` : `฿${currentService.priceRegular}`
                  )}
                </strong>
              </div>
            </div>

            {/* Step 4: Patient Information */}
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                4. ข้อมูลผู้รับบริการ (Patient Information)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-stone-600 font-medium">ชื่อ - นามสกุล *</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="เช่น คุณกมลวรรณ สุขเกษม"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-base sm:text-sm min-h-[44px] focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-stone-600 font-medium">เบอร์โทรศัพท์ติดต่อ *</label>
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="เช่น 081-234-5678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-base sm:text-sm min-h-[44px] focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-stone-600 font-medium">อาการเบื้องต้น / ประวัติสุขภาพ *</label>
                <textarea
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="เช่น ปวดคอบ่าสะบักเรื้อรัง, หลังคลอด 2 สัปดาห์ต้องการทับหม้อเกลือ, มีอาการภูมิแพ้ทางเดินหายใจ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-base sm:text-sm min-h-[44px] focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-stone-600 font-medium">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น ต้องการระบุผู้ช่วยท่านเดิม หรือมีอาการเจ็บเฉพาะจุด"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-base sm:text-sm min-h-[44px] focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Scrollable body closes here */}
            </div>

            {/* Sticky Action Footer on Mobile */}
            <div className="flex items-center justify-end gap-3 p-3.5 sm:p-4 border-t border-stone-200 bg-stone-50 pb-safe shrink-0">
              <button
                type="button"
                onClick={resetForm}
                className="w-1/3 sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2.5 sm:py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 rounded-xl transition-colors text-center"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 px-6 py-2.5 sm:py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-stone-300 rounded-xl transition-colors shadow-sm text-center flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? 'กำลังตรวจสอบคิวว่าง...' : 'ยืนยันการจองคิว'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
