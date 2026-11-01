import React, { useState } from 'react';
import {
  Calendar,
  Users,
  Flame,
  HeartHandshake,
  Sparkles,
  CheckCircle2,
  Phone,
  Pill,
  Clock,
  MapPin,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { ServiceId } from '../types/clinic';

interface HeroSectionProps {
  onSelectServiceFilter: (serviceId: ServiceId | 'all') => void;
  onOpenBooking: () => void;
  selectedFilter: ServiceId | 'all';
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSelectServiceFilter,
  onOpenBooking,
  selectedFilter,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <section className="bg-gradient-to-b from-emerald-50/70 via-stone-50 to-stone-50 border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Main Grid: Info + Rates */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Column (Col 1-7): Clinic Identity & Primary Action */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            
            {/* Clinic Official Header Banner */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-emerald-600 shadow-sm bg-white p-0.5 shrink-0 flex items-center justify-center">
                <img
                  src="/assets/aistudio/107108_5321bd65.jpg"
                  alt="PANTHAI AYHOS โลโก้แผนไทย"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] sm:text-xs font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                    ตึกแพทย์แผนไทย ศูนย์เวชปฏิบัติครอบครัว รพ.อยุธยา
                  </span>
                  <span className="text-[11px] text-stone-500 font-medium hidden sm:inline">
                    · โรงพยาบาลพระนครศรีอยุธยา
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-stone-900 mt-1 truncate">
                  กลุ่มงานการแพทย์แผนไทย และการแพทย์ทางเลือก
                </h2>
              </div>
            </div>

            {/* Main Headline */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
                ปฏิทินนัดหมายและจองคิวออนไลน์ <br />
                <span className="text-emerald-700 font-bold">คลินิกการแพทย์แผนไทย</span>
              </h1>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mt-2 font-normal max-w-xl">
                ระบบตรวจสอบคิวว่างแบบเรียลไทม์ พร้อมคำนวณความพร้อมของเตียงและทีมผู้ช่วยแพทย์แผนไทยทั้ง 9 ท่าน
                แยกชัดเจนระหว่างรอบในเวลาราชการและนอกเวลาราชการ
              </p>
            </div>

            {/* Clinic Operating Hours & Conditions */}
            <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-stone-200/90 shadow-2xs space-y-2 text-xs">
              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-stone-700 font-medium">
                <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>วันจันทร์ - ศุกร์</span>
                  <span className="text-stone-400 font-normal">(หยุดเสาร์-อาทิตย์)</span>
                </span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="text-stone-700">
                  ในเวลา <span className="font-semibold text-stone-900">09:00 - 16:00 น.</span>
                </span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                  นอกเวลา 16:30 - 18:30 น.
                </span>
              </div>

              {/* Call contact line */}
              <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-stone-600">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-[11px] text-stone-500">โทรติดต่อ:</span>
                  <a
                    href="tel:0632070036"
                    className="font-mono font-bold text-emerald-700 hover:text-emerald-800 underline decoration-emerald-300"
                  >
                    063-207-0036
                  </a>
                  <span className="text-stone-300">/</span>
                  <a
                    href="tel:035211888"
                    className="font-mono text-stone-600 hover:text-stone-900"
                  >
                    035-211-888 ต่อ 3101
                  </a>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-stone-500">
                  <Users className="w-3 h-3 text-emerald-600" />
                  <span>ผู้ช่วยแพทย์ 9 ท่าน</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-0.5">
              <button
                onClick={onOpenBooking}
                className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Calendar className="w-4 h-4 text-emerald-200" />
                <span>จองคิวออนไลน์ทันที</span>
              </button>

              <a
                href="tel:0632070036"
                className="px-4 py-3 bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-700 font-semibold text-xs rounded-xl border border-stone-200 transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>โทรสอบถามคลินิก</span>
              </a>

              <a
                href="#master-calendar"
                className="px-4 py-3 text-stone-600 hover:text-stone-900 font-medium text-xs text-center flex items-center justify-center gap-1 transition-colors"
              >
                <span>ดูตารางปฏิทินวันนี้</span>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              </a>
            </div>
          </div>

          {/* Right Column (Col 8-12): Visual Showcase + Rates Schedule */}
          <div className="lg:col-span-5 space-y-3.5">
            
            {/* Visual Photo / Banner with graceful hospital fallback */}
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-xs bg-gradient-to-br from-emerald-900 via-emerald-800 to-stone-900 aspect-[16/9] sm:aspect-[21/9] lg:aspect-[16/8]">
              {!imageError ? (
                <img
                  src="/assets/images/thai_clinic_hero_1792986606917.jpg"
                  alt="บรรยากาศคลินิกการแพทย์แผนไทย โรงพยาบาลพระนครศรีอยุธยา"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-6 text-white text-center">
                  <div>
                    <Sparkles className="w-8 h-8 text-emerald-300 mx-auto mb-2 opacity-80" />
                    <p className="font-bold text-sm">กลุ่มงานการแพทย์แผนไทย</p>
                    <p className="text-xs text-emerald-200/90 mt-0.5">ตึกแพทย์แผนไทย ศูนย์เวชปฏิบัติครอบครัว รพ.อยุธยา</p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent flex flex-col justify-end p-3 sm:p-3.5 text-white pointer-events-none">
                <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>หัตถการมาตรฐานกระทรวงสาธารณสุข</span>
                </span>
                <span className="text-xs text-stone-200 mt-0.5 line-clamp-1">
                  เตียงนวดประคบสมุนไพร · ห้องทับหม้อเกลือ · ห้องอบสมุนไพร
                </span>
              </div>
            </div>

            {/* Official Rates Schedule Card (Well-proportioned, clean & readable) */}
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-3.5 sm:p-4">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-stone-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-stone-900">
                    อัตราค่าบริการคลินิกการแพทย์แผนไทย
                  </span>
                </div>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200/60">
                  รพ.พระนครศรีอยุธยา
                </span>
              </div>

              {/* 4 Clean Rate Items */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                
                {/* 1. Massage & Compress */}
                <div className="bg-stone-50/80 hover:bg-emerald-50/40 p-2.5 rounded-xl border border-stone-200/70 transition-colors">
                  <div className="text-stone-700 font-semibold text-[11px] flex items-center gap-1">
                    <HeartHandshake className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">นวดประคบสมุนไพร</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-base font-extrabold text-emerald-800 font-mono">250</span>
                    <span className="text-[10px] text-stone-500">บาท/ชม.</span>
                  </div>
                  <div className="text-[10px] text-stone-600 mt-0.5 font-medium">
                    2 ชม. <span className="font-bold text-emerald-800 font-mono">450</span> บาท
                  </div>
                </div>

                {/* 2. Herbal Sauna */}
                <div className="bg-stone-50/80 hover:bg-orange-50/40 p-2.5 rounded-xl border border-stone-200/70 transition-colors">
                  <div className="text-stone-700 font-semibold text-[11px] flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span className="truncate">อบสมุนไพร</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-base font-extrabold text-orange-700 font-mono">120</span>
                    <span className="text-[10px] text-stone-500">บาท/ครั้ง</span>
                  </div>
                  <div className="text-[10px] text-orange-800 font-medium mt-0.5">
                    จำกัด 3 เคส/วัน
                  </div>
                </div>

                {/* 3. Postpartum Care */}
                <div className="bg-stone-50/80 hover:bg-amber-50/40 p-2.5 rounded-xl border border-stone-200/70 transition-colors">
                  <div className="text-stone-700 font-semibold text-[11px] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">ดูแลมารดาหลังคลอด</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-base font-extrabold text-amber-800 font-mono">670</span>
                    <span className="text-[10px] text-stone-500">บาท/ครั้ง</span>
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    ทับหม้อเกลือ (2 เคส/คน/วัน)
                  </div>
                </div>

                {/* 4. Herbal Medicine */}
                <div className="bg-stone-50/80 hover:bg-teal-50/40 p-2.5 rounded-xl border border-stone-200/70 transition-colors">
                  <div className="text-stone-700 font-semibold text-[11px] flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span className="truncate">จ่ายยาสมุนไพร</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-xs font-bold text-teal-800">ราคาตามค่ายา</span>
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    สั่งจ่ายโดยแพทย์แผนไทย
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Service Filter Bar (Section Separator) */}
        <div className="mt-6 pt-5 border-t border-stone-200">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-stone-800">
              เลือกกรองประเภทบริการในปฏิทิน:
            </span>
            <span className="text-[11px] text-stone-500 hidden sm:inline">
              คลิกเพื่อดูเฉพาะรอบเวลาของบริการที่ต้องการ
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            
            <button
              onClick={() => onSelectServiceFilter('all')}
              className={`p-2.5 text-left rounded-xl border transition-all text-xs ${
                selectedFilter === 'all'
                  ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs font-semibold'
                  : 'bg-white border-stone-200 text-stone-700 hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>ภาพรวมทุกบริการ</span>
                {selectedFilter === 'all' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />}
              </div>
              <span className={`text-[10px] block mt-0.5 ${selectedFilter === 'all' ? 'text-emerald-100' : 'text-stone-400'}`}>
                แสดงรวมทุกหัตถการ
              </span>
            </button>

            <button
              onClick={() => onSelectServiceFilter('massage_compress')}
              className={`p-2.5 text-left rounded-xl border transition-all text-xs ${
                selectedFilter === 'massage_compress'
                  ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs font-semibold'
                  : 'bg-white border-stone-200 text-stone-700 hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 truncate">
                  <HeartHandshake className="w-3 h-3 shrink-0" />
                  <span>นวดประคบ (1-2 ชม.)</span>
                </span>
                {selectedFilter === 'massage_compress' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />}
              </div>
              <span className={`text-[10px] block mt-0.5 ${selectedFilter === 'massage_compress' ? 'text-emerald-100' : 'text-stone-400'}`}>
                250 บาท (2 ชม. 450 บาท)
              </span>
            </button>

            <button
              onClick={() => onSelectServiceFilter('postpartum_care')}
              className={`p-2.5 text-left rounded-xl border transition-all text-xs ${
                selectedFilter === 'postpartum_care'
                  ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs font-semibold'
                  : 'bg-white border-stone-200 text-stone-700 hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 truncate">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>ดูแลมารดาหลังคลอด</span>
                </span>
                {selectedFilter === 'postpartum_care' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />}
              </div>
              <span className={`text-[10px] block mt-0.5 ${selectedFilter === 'postpartum_care' ? 'text-emerald-100' : 'text-stone-400'}`}>
                670 บาท · 2 เคส/คน/วัน
              </span>
            </button>

            <button
              onClick={() => onSelectServiceFilter('herbal_sauna')}
              className={`p-2.5 text-left rounded-xl border transition-all text-xs ${
                selectedFilter === 'herbal_sauna'
                  ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs font-semibold'
                  : 'bg-white border-stone-200 text-stone-700 hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 truncate">
                  <Flame className="w-3 h-3 shrink-0" />
                  <span>อบสมุนไพร</span>
                </span>
                {selectedFilter === 'herbal_sauna' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />}
              </div>
              <span className={`text-[10px] block mt-0.5 ${selectedFilter === 'herbal_sauna' ? 'text-emerald-100' : 'text-stone-400'}`}>
                120 บาท · จำกัด 3 เคส/วัน
              </span>
            </button>

            <button
              onClick={() => onSelectServiceFilter('herbal_medicine')}
              className={`p-2.5 text-left rounded-xl border transition-all text-xs ${
                selectedFilter === 'herbal_medicine'
                  ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs font-semibold'
                  : 'bg-white border-stone-200 text-stone-700 hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 truncate">
                  <Pill className="w-3 h-3 shrink-0" />
                  <span>จ่ายยาสมุนไพร</span>
                </span>
                {selectedFilter === 'herbal_medicine' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />}
              </div>
              <span className={`text-[10px] block mt-0.5 ${selectedFilter === 'herbal_medicine' ? 'text-emerald-100' : 'text-stone-400'}`}>
                ราคาตามค่ายาจริง
              </span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
