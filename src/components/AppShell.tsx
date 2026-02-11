import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import BottomNav from './layout/BottomNav';
import AlarmPopup from './AlarmPopup';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAlarmSystem } from '@/hooks/useAlarmSystem';

export default function AppShell() {
  const isMobile = useIsMobile();
  const { activeAlarms, dismissAlarm, dismissAll, snoozeAlarm } = useAlarmSystem();

  return (
    <div className="min-h-screen bg-surface-0 flex overflow-x-hidden max-w-[100vw]">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 p-3 sm:p-4 md:p-6 pb-20 md:pb-6 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
        
        {/* Mobile Bottom Navigation */}
        {isMobile && <BottomNav />}
      </div>

      {/* Alarm popup overlay */}
      <AlarmPopup
        alarms={activeAlarms}
        onDismiss={dismissAlarm}
        onDismissAll={dismissAll}
        onSnooze={snoozeAlarm}
      />
    </div>
  );
}