import React from 'react';
import { Calendar, Clock, UserCheck, Shield, PlusCircle, Search, Phone, FileSpreadsheet } from 'lucide-react';

interface NavbarProps {
  activeTab: 'calendar' | 'booking' | 'check_queue' | 'staff' | 'report' | 'admin';
  setActiveTab: (tab: 'calendar' | 'booking' | 'check_queue' | 'staff' | 'report' | 'admin') => void;
  isAdminLoggedIn: boolean;
  onOpenBooking: () => void;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isAdminLoggedIn,
  onOpenBooking,
  onOpenAdminLogin,
  onAdminLogout,
}) => {
  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6">
          {/* Brand Logo & Title */}
          <div
            onClick={() => setActiveTab('calendar')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink min-w-0"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-emerald-400/80 shadow-md bg-white p-0.5 shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/107108_5321bd65.jpg"
                alt="โลโก้กลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลพระนครศรีอยุธยา"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="min-w-0 truncate">
              <span className="text-xs sm:text-base font-bold tracking-tight text-stone-100 truncate block">
                กลุ่มงานการแพทย์แผนไทย
                <span className="hidden sm:inline">และการแพทย์ทางเลือก</span>
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-400 font-medium tracking-normal truncate block -mt-0.5">
                รพ.พระนครศรีอยุธยา · Master Calendar
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (hidden on mobile, handled by bottom bar) */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-stone-300">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`transition-colors whitespace-nowrap py-1 ${
                activeTab === 'calendar'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                  : 'hover:text-stone-100'
              }`}
            >
              ปฏิทินรวมคลินิก
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1 ${
                activeTab === 'report'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                  : 'hover:text-stone-100'
              }`}
            >
              <span>ตารางคิว (Report)</span>
            </button>

            <button
              onClick={() => setActiveTab('check_queue')}
              className={`transition-colors whitespace-nowrap py-1 ${
                activeTab === 'check_queue'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                  : 'hover:text-stone-100'
              }`}
            >
              ตรวจสอบสถานะคิว
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`transition-colors whitespace-nowrap py-1 ${
                activeTab === 'staff'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                  : 'hover:text-stone-100'
              }`}
            >
              ผู้ช่วยแพทย์ 9 ท่าน
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`transition-colors whitespace-nowrap py-1 ${
                activeTab === 'admin'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                  : 'hover:text-stone-100'
              }`}
            >
              {isAdminLoggedIn ? 'แดชบอร์ดเจ้าหน้าที่' : 'สำหรับเจ้าหน้าที่'}
            </button>
          </nav>

          {/* Right Action: Call button & Booking CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Call Button on Mobile */}
            <a
              href="tel:0632070036"
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-stone-800 border border-stone-700 text-emerald-400 hover:bg-stone-700 active:scale-95 transition-all shadow-xs"
              title="โทรติดต่อคลินิก 063-207-0036"
              aria-label="โทรติดต่อคลินิก 063-207-0036"
            >
              <Phone className="w-4 h-4" />
            </a>

            {/* Desktop Contact Numbers */}
            <div className="hidden xl:flex items-center gap-2 text-xs text-stone-300 bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700/60">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <a href="tel:0632070036" className="font-mono text-emerald-400 hover:underline">063-207-0036</a>
              <span className="text-stone-500">|</span>
              <a href="tel:035211888" className="font-mono text-stone-300 hover:text-white">035-211-888 ต่อ 3101</a>
            </div>

            {isAdminLoggedIn ? (
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline text-xs text-emerald-400 font-mono">
                  Admin
                </span>
                <button
                  onClick={onAdminLogout}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-stone-300 bg-stone-800 hover:bg-stone-700 rounded-md transition-colors whitespace-nowrap"
                >
                  ออก
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="text-xs text-stone-400 hover:text-stone-200 font-medium px-2 py-1 transition-colors whitespace-nowrap hidden sm:inline"
              >
                เข้าสู่ระบบ
              </button>
            )}

            {/* Desktop Booking CTA Button */}
            <button
              onClick={onOpenBooking}
              className="hidden sm:flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-stone-900 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>จองคิวรับบริการ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Modern Thumb-Friendly Mobile Bottom Navigation Bar */}
      <nav
        aria-label="เมนูหลักสำหรับมือถือ"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 text-stone-300 pb-safe shadow-2xl print:hidden"
      >
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {/* Tab 1: Calendar */}
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] ${
              activeTab === 'calendar' ? 'text-emerald-400 font-bold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">ปฏิทิน</span>
          </button>

          {/* Tab 2: Check Queue */}
          <button
            onClick={() => setActiveTab('check_queue')}
            className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] ${
              activeTab === 'check_queue' ? 'text-emerald-400 font-bold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Search className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">เช็คคิว</span>
          </button>

          {/* Tab 3: Center Elevated Book CTA Button */}
          <div className="flex flex-col items-center justify-center -mt-5">
            <button
              onClick={onOpenBooking}
              className="w-13 h-13 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-stone-950 flex flex-col items-center justify-center shadow-lg ring-4 ring-stone-900 transition-all"
              aria-label="จองคิวรับบริการทันที"
            >
              <PlusCircle className="w-6 h-6" />
            </button>
            <span className="text-[9px] font-bold text-emerald-400 mt-0.5 tracking-tight">จองคิว</span>
          </div>

          {/* Tab 4: Roster Report */}
          <button
            onClick={() => setActiveTab('report')}
            className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] ${
              activeTab === 'report' ? 'text-emerald-400 font-bold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">ตารางคิว</span>
          </button>

          {/* Tab 5: Admin / Staff */}
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] relative ${
              activeTab === 'admin' ? 'text-emerald-400 font-bold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <div className="relative">
              <Shield className="w-5 h-5 mb-0.5" />
              {isAdminLoggedIn && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-stone-900 absolute -top-0.5 -right-0.5" />
              )}
            </div>
            <span className="text-[10px] leading-tight">
              {isAdminLoggedIn ? 'จัดการ' : 'เจ้าหน้าที่'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
