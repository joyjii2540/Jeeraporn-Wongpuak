import React from 'react';
import { Calendar, Users, Flame, HeartHandshake, Sparkles, CheckCircle2, Phone, Pill } from 'lucide-react';
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
  return (
    <section className="relative overflow-hidden bg-stone-900 text-stone-100 border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Clinic Headline & Description */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-400/80 shadow-md bg-white p-0.5 shrink-0 flex items-center justify-center">
                <img
                  src="/assets/aistudio/107108_5321bd65.jpg"
                  alt="PANTHAI AYHOS โลโก้แผนไทย"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                  PANTHAI AYHOS · โรงพยาบาลพระนครศรีอยุธยา
                </span>
                <span className="text-xs text-stone-300 font-medium">
                  กลุ่มงานการแพทย์แผนไทย และการแพทย์ทางเลือก
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white text-balance leading-tight">
              ปฏิทินรวมนัดหมาย <br className="hidden sm:inline" />
              <span className="text-emerald-400 font-normal">คลินิกการแพทย์แผนไทย</span>
            </h1>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl font-light">
              ระบบตรวจสอบคิวว่างแบบเรียลไทม์ (Clinic Master Calendar) 
              คำนวณความพร้อมของเตียงและทีมผู้ช่วยแพทย์แผนไทยทั้ง 9 ท่านโดยอัตโนมัติ
              แยกชัดเจนระหว่างรอบในเวลาราชการและนอกเวลาราชการ พร้อมระบบรวมกลุ่มห้องอบสมุนไพร
            </p>

            {/* Unboxed Metadata Discipline */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-stone-400 pt-0.5">
              <span className="flex items-center gap-1.5 text-stone-200">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>ผู้ช่วยแพทย์แผนไทย 9 ท่าน</span>
              </span>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span className="text-emerald-300 font-medium">เปิดบริการจันทร์ - ศุกร์ (หยุดเสาร์-อาทิตย์)</span>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span>ในเวลา 09:00 - 16:00 น.</span>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span className="text-amber-300">นอกเวลา 16:30 - 18:30 น.</span>
            </div>

            {/* Direct Contact Phone Box */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-stone-950/80 border border-stone-800 rounded-xl p-3 text-xs">
              <span className="text-stone-400 flex items-center gap-1.5 shrink-0">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>โทรติดต่อคลินิก:</span>
              </span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <a
                  href="tel:0632070036"
                  className="font-mono font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 bg-stone-900 px-2 py-1 rounded border border-stone-800"
                >
                  <span>063-207-0036</span>
                </a>
                <a
                  href="tel:035211888"
                  className="font-mono text-stone-300 hover:text-white transition-colors flex items-center gap-1 bg-stone-900 px-2 py-1 rounded border border-stone-800"
                >
                  <span>035-211-888 ต่อ 3101</span>
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
              <button
                onClick={onOpenBooking}
                className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-sm rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
              >
                <span>จองคิวออนไลน์ทันที</span>
              </button>
              <a
                href="#master-calendar"
                className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-sm rounded-xl border border-stone-700 transition-colors text-center"
              >
                ดูผังปฏิทินวันนี้
              </a>
            </div>
          </div>

          {/* Right Column: Authentic Image Showcase & Rates Summary Card */}
          <div className="lg:col-span-5 space-y-4 mt-2 sm:mt-0">
            <div className="relative rounded-2xl overflow-hidden border border-stone-800 shadow-2xl bg-stone-950">
              <img
                src="/src/assets/images/thai_clinic_hero_1792986606917.jpg"
                alt="บรรยากาศคลินิกการแพทย์แผนไทย"
                className="w-full h-40 sm:h-52 lg:h-56 object-cover opacity-90"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent flex flex-col justify-end p-3 sm:p-4">
                <div className="text-[11px] sm:text-xs text-emerald-400 font-semibold">ห้องตรวจและหัตถการมาตรฐาน</div>
                <div className="text-xs sm:text-sm font-medium text-stone-100">
                  เตียงนวดประคบสมุนไพร · ห้องทับหม้อเกลือ · ห้องอบไอน้ำสมุนไพร
                </div>
              </div>
            </div>

            {/* Official Rates Schedule Card */}
            <div className="bg-stone-950/90 border border-stone-800 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                    อัตราค่าบริการคลินิกการแพทย์แผนไทย
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                  รพ.พระนครศรีอยุธยา
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                  <div className="text-stone-300 font-medium text-[11px] flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>นวดและประคบสมุนไพร</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-base font-bold text-emerald-400 font-mono">฿250</span>
                    <span className="text-[10px] text-stone-400">/ ชม.</span>
                  </div>
                  <div className="text-[10px] text-amber-300/90 mt-0.5 font-medium">
                    + นวดสุขภาพ (2 ชม.) <strong>฿450</strong>
                  </div>
                </div>

                <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                  <div className="text-stone-300 font-medium text-[11px] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span>อบสมุนไพร</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-base font-bold text-orange-400 font-mono">฿120</span>
                    <span className="text-[10px] text-stone-400">/ ครั้ง</span>
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    จำกัดสูงสุด 3 เคส/วัน
                  </div>
                </div>

                <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                  <div className="text-stone-300 font-medium text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>ดูแลมารดาหลังคลอด</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-base font-bold text-amber-400 font-mono">฿670</span>
                    <span className="text-[10px] text-stone-400">/ ครั้ง</span>
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    ทับหม้อเกลือ (สูงสุด 2 เคส/คน/วัน)
                  </div>
                </div>

                <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                  <div className="text-stone-300 font-medium text-[11px] flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>จ่ายยาสมุนไพร</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-sm font-bold text-teal-300">ราคาตามค่ายา</span>
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    สั่งจ่ายโดยแพทย์แผนไทย
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5 Interactive Service Filter Tabs (Scrollable/Wrap on Mobile, 5 cols on Desktop) */}
        <div className="mt-8 pt-6 border-t border-stone-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
            เลือกกรองมุมมองปฏิทินตามประเภทบริการ:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
            <button
              onClick={() => onSelectServiceFilter('all')}
              className={`p-2.5 text-left rounded-xl border transition-all ${
                selectedFilter === 'all'
                  ? 'bg-stone-800 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs sm:text-sm font-semibold truncate">ภาพรวมทุกบริการ</span>
                {selectedFilter === 'all' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </div>
              <p className="text-[10px] text-stone-400 line-clamp-1">
                แสดงสถานะรวมทุกหัตถการ
              </p>
            </button>

            <button
              onClick={() => onSelectServiceFilter('massage_compress')}
              className={`p-2.5 text-left rounded-xl border transition-all ${
                selectedFilter === 'massage_compress'
                  ? 'bg-stone-800 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 min-w-0">
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold truncate">นวดประคบ (1-2 ชม.)</span>
                </div>
                {selectedFilter === 'massage_compress' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </div>
              <p className="text-[10px] text-stone-400 line-clamp-1">
                ฿250 (2 ชม. ฿450) · 9 ท่าน
              </p>
            </button>

            <button
              onClick={() => onSelectServiceFilter('postpartum_care')}
              className={`p-2.5 text-left rounded-xl border transition-all ${
                selectedFilter === 'postpartum_care'
                  ? 'bg-stone-800 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold truncate">มารดาหลังคลอด</span>
                </div>
                {selectedFilter === 'postpartum_care' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </div>
              <p className="text-[10px] text-stone-400 line-clamp-1">
                ฿670 · สูงสุด 2 เคส/คน/วัน
              </p>
            </button>

            <button
              onClick={() => onSelectServiceFilter('herbal_sauna')}
              className={`p-2.5 text-left rounded-xl border transition-all ${
                selectedFilter === 'herbal_sauna'
                  ? 'bg-stone-800 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 min-w-0">
                  <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold truncate">อบสมุนไพร</span>
                </div>
                {selectedFilter === 'herbal_sauna' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </div>
              <p className="text-[10px] text-stone-400 line-clamp-1">
                ฿120 · จำกัด 3 เคส/วัน
              </p>
            </button>

            <button
              onClick={() => onSelectServiceFilter('herbal_medicine')}
              className={`p-2.5 text-left rounded-xl border transition-all ${
                selectedFilter === 'herbal_medicine'
                  ? 'bg-stone-800 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 min-w-0">
                  <Pill className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold truncate">จ่ายยาสมุนไพร</span>
                </div>
                {selectedFilter === 'herbal_medicine' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </div>
              <p className="text-[10px] text-stone-400 line-clamp-1">
                ราคาตามค่ายาจริง
              </p>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
