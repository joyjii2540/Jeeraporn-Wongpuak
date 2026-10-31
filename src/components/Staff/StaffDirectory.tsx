import React from 'react';
import { CLINIC_STAFF, CLINIC_SERVICES } from '../../types/clinic';
import { UserCheck, ShieldCheck, HeartHandshake, Sparkles, Flame, CheckCircle2, Phone } from 'lucide-react';

export const StaffDirectory: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
          <UserCheck className="w-4 h-4" />
          <span>ทีมผู้ช่วยแพทย์แผนไทยประจำคลินิก (9 ท่าน)</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          รายชื่อและสิทธิ์การให้บริการ (Staff Capabilities)
        </h2>
        <p className="text-sm text-stone-600">
          ระบบควบคุมโควตาคิวว่างโดยอิงจากความเชี่ยวชาญเฉพาะทางของผู้ช่วยแพทย์แผนไทยแต่ละท่าน 
          เพื่อความปลอดภัยและมาตรฐานการบำบัดรักษา
        </p>
      </div>

      {/* Visual Showcase Banner */}
      <div className="bg-stone-900 text-stone-100 rounded-3xl overflow-hidden border border-stone-800 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="p-6 sm:p-8 lg:col-span-7 space-y-4">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
            ภูมิปัญญาการแพทย์แผนไทยประยุกต์
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            หัตถการเฉพาะทางและความเชี่ยวชาญของผู้ช่วย
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
            การดูแลมารดาหลังคลอด (ทับหม้อเกลือ ขับน้ำคาวปลา) และการอบสมุนไพร 
            ต้องใช้ทักษะความรู้ด้านสมุนไพรสดและอุณหภูมิความร้อนที่แม่นยำ 
            คลินิกจึงกำหนดสิทธิ์ผู้ให้บริการเฉพาะผู้ช่วยที่ผ่านการรับรองหลักสูตรเฉพาะทางเท่านั้น
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700">
              <strong className="text-emerald-400 block font-semibold mb-0.5">นวดประคบ</strong>
              <span className="text-stone-300">ให้บริการได้ทั้ง 9 ท่าน</span>
            </div>
            <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700">
              <strong className="text-amber-400 block font-semibold mb-0.5">มารดาหลังคลอด</strong>
              <span className="text-stone-300">คุณกัลยาณี & คุณภัทรจิต</span>
            </div>
            <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700">
              <strong className="text-orange-400 block font-semibold mb-0.5">อบสมุนไพร</strong>
              <span className="text-stone-300">กัลยาณี, ภัทรจิต, กัลยรัตน์</span>
            </div>
          </div>

          <div className="pt-2 text-xs text-stone-400">
            โทรติดต่อกลุ่มงานฯ: <a href="tel:0632070036" className="font-mono text-emerald-400 font-bold hover:underline">063-207-0036</a> หรือ <a href="tel:035211888" className="font-mono text-stone-200 hover:underline">035-211-888 ต่อ 3101</a>
          </div>
        </div>

        <div className="lg:col-span-5 h-64 lg:h-full min-h-[220px]">
          <img
            src="/src/assets/images/thai_herbal_pot_1792986606686.jpg"
            alt="ตำรับสมุนไพรไทยและหม้อเกลือ"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* 9 Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CLINIC_STAFF.map((staff, idx) => {
          const isPostpartumSpecialist = staff.id === 'staff_3' || staff.id === 'staff_6';
          const isSaunaSpecialist = staff.id === 'staff_3' || staff.id === 'staff_5' || staff.id === 'staff_6';

          return (
            <div
              key={staff.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-emerald-300 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center font-bold font-mono text-stone-700 text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-base">
                      คุณ{staff.name}
                    </h4>
                    <span className="text-xs text-stone-500 font-mono">
                      {staff.code} · {staff.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service Badges */}
              <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  สิทธิ์การให้บริการที่ได้รับรอง:
                </span>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-stone-700">
                    <span className="flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                      <span>นวดประคบสมุนไพร</span>
                    </span>
                    <span className="text-emerald-700 font-medium">✓ ปฏิบัติการได้</span>
                  </div>

                  <div className="flex items-center justify-between text-stone-700">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>มารดาหลังคลอด (ทับหม้อเกลือ)</span>
                    </span>
                    {isPostpartumSpecialist ? (
                      <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                        ✓ ผู้เชี่ยวชาญ (รับสูงสุด 2 เคส/วัน)
                      </span>
                    ) : (
                      <span className="text-stone-300">-</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-stone-700">
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-600" />
                      <span>อบสมุนไพรเพื่อสุขภาพ</span>
                    </span>
                    {isSaunaSpecialist ? (
                      <span className="text-orange-800 font-bold bg-orange-50 px-2 py-0.5 rounded">
                        ✓ ผู้เชี่ยวชาญ
                      </span>
                    ) : (
                      <span className="text-stone-300">-</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-stone-400 pt-2 border-t border-stone-100 flex items-center justify-between">
                <span>สถานะ: พร้อมปฏิบัติหน้าที่</span>
                <span className="font-mono text-stone-600">{staff.phone}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Contact Banner */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
            กลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก
          </span>
          <p className="text-sm text-stone-300">
            โรงพยาบาลพระนครศรีอยุธยา · เปิดบริการวันจันทร์ - ศุกร์ (ปิดทำการวันเสาร์และวันอาทิตย์)
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <a
            href="tel:0632070036"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-lg transition-colors font-mono"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>063-207-0036</span>
          </a>
          <a
            href="tel:035211888"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium rounded-lg transition-colors border border-stone-700 font-mono"
          >
            <span>035-211-888 ต่อ 3101</span>
          </a>
        </div>
      </div>
    </div>
  );
};

