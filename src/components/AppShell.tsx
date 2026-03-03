import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import BottomNav from './layout/BottomNav';
import AlarmPopup from './AlarmPopup';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAlarmSystem } from '@/hooks/useAlarmSystem';
import { usePersonaStore, applyPersonaTheme } from '@/stores/usePersonaStore';
import { useAppStore } from '@/stores/useAppStore';

export default function AppShell() {
  const isMobile = useIsMobile();
  const { activeAlarms, dismissAlarm, dismissAll, snoozeAlarm } = useAlarmSystem();
  const currentPersona = usePersonaStore((s) => s.currentPersona);
  const dataLoaded = useAppStore((s) => s.dataLoaded);
  const onboardingCompleted = useAppStore((s) => s.userPreferences.onboardingCompleted);
  const navigate = useNavigate();

  // Apply persona theme colors on mount and when persona changes
  useEffect(() => {
    applyPersonaTheme(currentPersona);
  }, [currentPersona]);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (dataLoaded && onboardingCompleted === false) {
      navigate('/onboarding', { replace: true });
    }
  }, [dataLoaded, onboardingCompleted, navigate]);

  return (
    <div className="min-h-screen bg-surface-0 flex overflow-x-hidden w-full">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 p-3 sm:p-4 md:p-6 pb-4 md:pb-6 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Reserve space for fixed bottom nav on mobile */}
        {isMobile && <div className="h-[calc(5.5rem+env(safe-area-inset-bottom))] shrink-0" />}
        
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