import React from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  Shield,
  PlusCircle,
  Search,
  Phone,
  FileSpreadsheet,
  BookOpen,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'calendar' | 'media' | 'booking' | 'check_queue' | 'staff' | 'report' | 'admin';
  setActiveTab: (tab: 'calendar' | 'media' | 'booking' | 'check_queue' | 'staff' | 'report' | 'admin') => void;
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
      {/* Top Header Bar - Clean hospital-grade white/emerald theme */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-stone-800 border-b border-stone-200 shadow-2xs print:hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Brand Logo & Title */}
          <div
            onClick={() => setActiveTab('calendar')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink min-w-0"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-emerald-600 shadow-2xs bg-white p-0.5 shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/107108_5321bd65.jpg"
                alt="กลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก รพ.พระนครศรีอยุธยา"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-stone-900 truncate block">
                กลุ่มงานการแพทย์แผนไทย
                <span className="hidden sm:inline font-normal text-stone-600"> และการแพทย์ทางเลือก</span>
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-800 font-semibold tracking-normal truncate block -mt-0.5">
                ตึกแพทย์แผนไทย ศูนย์เวชปฏิบัติครอบครัว รพ.อยุธยา
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-stone-600">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`transition-colors whitespace-nowrap py-1.5 ${
                activeTab === 'calendar'
                  ? 'text-emerald-800 font-bold border-b-2 border-emerald-700'
                  : 'hover:text-stone-900'
              }`}
            >
              ปฏิทินรวมคลินิก
            </button>

            <button
              onClick={() => setActiveTab('media')}
              className={`transition-colors whitespace-nowrap py-1.5 flex items-center gap-1.5 ${
                activeTab === 'media'
                  ? 'text-emerald-800 font-bold border-b-2 border-emerald-700'
                  : 'hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>คลังความรู้และสื่อวิดีโอ</span>
            </button>

            <button
              onClick={() => setActiveTab('check_queue')}
              className={`transition-colors whitespace-nowrap py-1.5 ${
                activeTab === 'check_queue'
                  ? 'text-emerald-800 font-bold border-b-2 border-emerald-700'
                  : 'hover:text-stone-900'
              }`}
            >
              ตรวจสถานะคิว
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`transition-colors whitespace-nowrap py-1.5 ${
                activeTab === 'staff'
                  ? 'text-emerald-800 font-bold border-b-2 border-emerald-700'
                  : 'hover:text-stone-900'
              }`}
            >
              ทีมผู้ช่วยแพทย์
            </button>

            {/* Backoffice Roster Report - Only visible to authenticated staff */}
            {isAdminLoggedIn && (
              <button
                onClick={() => setActiveTab('report')}
                className={`transition-colors whitespace-nowrap py-1.5 flex items-center gap-1 ${
                  activeTab === 'report'
                    ? 'text-emerald-800 font-bold border-b-2 border-emerald-700'
                    : 'hover:text-stone-900'
                }`}
              >
                <span>ตารางคิวประจำวัน</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('admin')}
              className={`transition-colors whitespace-nowrap py-1.5 ${
                activeTab === 'admin'
                  ? 'text-emerald-800 font-bold border-b-2 border-emerald-700'
                  : 'hover:text-stone-900'
              }`}
            >
              {isAdminLoggedIn ? 'ระบบหลังบ้านเจ้าหน้าที่' : 'สำหรับเจ้าหน้าที่'}
            </button>
          </nav>

          {/* Right Action: Call button & Booking CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Call Button on Mobile */}
            <a
              href="tel:0632070036"
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 active:scale-95 transition-all shadow-2xs"
              title="โทรติดต่อคลินิก 063-207-0036"
              aria-label="โทรติดต่อคลินิก 063-207-0036"
            >
              <Phone className="w-4 h-4" />
            </a>

            {/* Desktop Contact Numbers */}
            <div className="hidden xl:flex items-center gap-2 text-xs text-stone-600 bg-stone-100/80 px-3 py-1.5 rounded-lg border border-stone-200/80">
              <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <a href="tel:0632070036" className="font-mono font-semibold text-emerald-800 hover:underline">063-207-0036</a>
              <span className="text-stone-300">|</span>
              <a href="tel:035211888" className="font-mono text-stone-600 hover:text-stone-900">035-211-888 ต่อ 3101</a>
            </div>

            {isAdminLoggedIn ? (
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline text-xs font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                  เจ้าหน้าที่
                </span>
                <button
                  onClick={onAdminLogout}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="text-xs text-stone-600 hover:text-stone-900 font-medium px-2 py-1 transition-colors whitespace-nowrap hidden sm:inline"
              >
                เข้าสู่ระบบ
              </button>
            )}

            {/* Desktop Booking CTA Button */}
            <button
              onClick={onOpenBooking}
              className="hidden sm:flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>จองคิวรับบริการ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Clean Hospital Mobile Bottom Navigation Bar */}
      <nav
        aria-label="เมนูหลักสำหรับมือถือ"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 text-stone-600 pb-safe shadow-lg print:hidden"
      >
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {/* Tab 1: Calendar */}
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] ${
              activeTab === 'calendar' ? 'text-emerald-800 font-bold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">ปฏิทิน</span>
          </button>

          {/* Tab 2: Health Education & Media Hub */}
          <button
            onClick={() => setActiveTab('media')}
            className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] ${
              activeTab === 'media' ? 'text-emerald-800 font-bold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">คลังความรู้</span>
          </button>

          {/* Tab 3: Center Elevated Book CTA Button */}
          <div className="flex flex-col items-center justify-center -mt-5">
            <button
              onClick={onOpenBooking}
              className="w-13 h-13 rounded-full bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white flex flex-col items-center justify-center shadow-md ring-4 ring-white transition-all"
              aria-label="จองคิวรับบริการทันที"
            >
              <PlusCircle className="w-6 h-6" />
            </button>
            <span className="text-[9px] font-bold text-emerald-800 mt-0.5 tracking-tight">จองคิว</span>
          </div>

          {/* Tab 4: Check Queue */}
          <button
            onClick={() => setActiveTab('check_queue')}
            className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] ${
              activeTab === 'check_queue' ? 'text-emerald-800 font-bold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Search className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">เช็คคิว</span>
          </button>

          {/* Tab 5: Admin / Staff Portal */}
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] relative ${
              activeTab === 'admin' ? 'text-emerald-800 font-bold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <div className="relative">
              <Shield className="w-5 h-5 mb-0.5" />
              {isAdminLoggedIn && (
                <span className="w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white absolute -top-0.5 -right-0.5" />
              )}
            </div>
            <span className="text-[10px] leading-tight">
              {isAdminLoggedIn ? 'หลังบ้าน' : 'เจ้าหน้าที่'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
