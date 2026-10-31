import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { MasterCalendar } from './components/Calendar/MasterCalendar';
import { BookingModal } from './components/Booking/BookingModal';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { PatientQueueCheck } from './components/Patient/PatientQueueCheck';
import { StaffDirectory } from './components/Staff/StaffDirectory';
import { DailyRosterReport } from './components/Report/DailyRosterReport';
import { Booking, ServiceId } from './types/clinic';

export default function App() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'booking' | 'check_queue' | 'staff' | 'report' | 'admin'>('calendar');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<ServiceId | 'all'>('all');
  const [selectedReportDate, setSelectedReportDate] = useState<string | undefined>();

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>();
  const [modalInitialTime, setModalInitialTime] = useState<string | undefined>();
  const [modalInitialServiceId, setModalInitialServiceId] = useState<ServiceId | undefined>();

  // Admin Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return !!localStorage.getItem('clinic_admin_token');
  });

  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState<number>(0);

  const handleOpenBooking = (date?: string, time?: string, serviceId?: ServiceId) => {
    setModalInitialDate(date);
    setModalInitialTime(time);
    setModalInitialServiceId(serviceId);
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = (_newBooking: Booking) => {
    setCalendarRefreshTrigger((prev) => prev + 1);
  };

  const handleLoginSuccess = (token: string, _user: any) => {
    localStorage.setItem('clinic_admin_token', token);
    setIsAdminLoggedIn(true);
    setActiveTab('admin');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('clinic_admin_token');
    setIsAdminLoggedIn(false);
    setActiveTab('calendar');
  };

  const handleOpenReport = (date?: string) => {
    setSelectedReportDate(date);
    setActiveTab('report');
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-emerald-200">
      {/* 3-Zone Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenBooking={() => handleOpenBooking()}
        onOpenAdminLogin={() => setActiveTab('admin')}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main Content Area (with bottom spacing for mobile bottom bar) */}
      <main className="flex-1 pb-20 md:pb-0">
        {activeTab === 'calendar' && (
          <>
            <HeroSection
              selectedFilter={selectedServiceFilter}
              onSelectServiceFilter={setSelectedServiceFilter}
              onOpenBooking={() => handleOpenBooking()}
            />
            <MasterCalendar
              selectedServiceFilter={selectedServiceFilter}
              onSelectSlotToBook={(date, time, serviceId) => handleOpenBooking(date, time, serviceId)}
              isAdmin={isAdminLoggedIn}
              onViewSlotDetails={(_date, _slotTime) => {
                setActiveTab('admin');
              }}
              refreshTrigger={calendarRefreshTrigger}
            />
          </>
        )}

        {activeTab === 'report' && (
          <DailyRosterReport
            initialDate={selectedReportDate}
            onBack={() => setActiveTab('calendar')}
          />
        )}

        {activeTab === 'check_queue' && <PatientQueueCheck />}

        {activeTab === 'staff' && <StaffDirectory />}

        {activeTab === 'admin' && (
          <AdminDashboard
            isAdminLoggedIn={isAdminLoggedIn}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleAdminLogout}
            onRefreshCalendar={() => setCalendarRefreshTrigger((prev) => prev + 1)}
            onOpenReport={handleOpenReport}
          />
        )}
      </main>

      {/* Global Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialDate={modalInitialDate}
        initialTime={modalInitialTime}
        initialServiceId={modalInitialServiceId}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Quiet Clinic Footer with Official Logo */}
      <footer className="border-t border-stone-200 bg-white text-stone-600 text-xs py-8 pb-24 md:pb-8 mt-12 sm:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-emerald-400 shadow-2xs p-0.5 bg-white shrink-0">
              <img
                src="/assets/aistudio/107108_5321bd65.jpg"
                alt="โลโก้แผนไทย PANTHAI AYHOS"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <span className="font-bold text-stone-900 block text-sm">
                กลุ่มงานการแพทย์แผนไทย และการแพทย์ทางเลือก โรงพยาบาลพระนครศรีอยุธยา
              </span>
              <p className="text-stone-500">
                เปิดให้บริการวันจันทร์ - วันศุกร์ (ปิดทำการวันเสาร์และวันอาทิตย์) · ในเวลาราชการ (09:00 - 16:00 น.) · นอกเวลาราชการ (16:30 - 18:30 น.)
              </p>
              <p className="text-xs text-stone-600 mt-1">
                โทรติดต่อ: <a href="tel:0632070036" className="font-mono font-semibold text-emerald-700 hover:underline">063-207-0036</a> และ <a href="tel:035211888" className="font-mono text-stone-700 hover:underline">035-211-888 ต่อ 3101</a>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-stone-500">
            <button
              onClick={() => setActiveTab('calendar')}
              className="hover:text-stone-900 transition-colors"
            >
              ปฏิทินรวมคลินิก
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className="hover:text-stone-900 transition-colors"
            >
              ตารางคิว (Report)
            </button>
            <button
              onClick={() => setActiveTab('check_queue')}
              className="hover:text-stone-900 transition-colors"
            >
              ตรวจสอบคิว
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className="hover:text-stone-900 transition-colors"
            >
              ทีมผู้ช่วย 9 ท่าน
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className="hover:text-stone-900 transition-colors"
            >
              เจ้าหน้าที่
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
