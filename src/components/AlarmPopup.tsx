import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Clock, Calendar, CheckSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AlarmItem {
  id: string;
  type: 'event' | 'task';
  title: string;
  description?: string;
  time?: string; // formatted time string
  color?: string;
  category?: string;
}

interface AlarmPopupProps {
  alarms: AlarmItem[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onSnooze: (id: string, minutes: number) => void;
}

export default function AlarmPopup({ alarms, onDismiss, onDismissAll, onSnooze }: AlarmPopupProps) {
  if (alarms.length === 0) return null;

  return (
    <AnimatePresence>
      {alarms.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Alarm container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-md space-y-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
                >
                  <Bell className="h-5 w-5 text-warning" />
                </motion.div>
                <span className="text-sm font-medium text-white/90">
                  {alarms.length} emlékeztető
                </span>
              </div>
              {alarms.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDismissAll}
                  className="text-white/70 hover:text-white hover:bg-white/10 text-xs h-7"
                >
                  <BellOff className="h-3.5 w-3.5 mr-1" />
                  Mind elvetése
                </Button>
              )}
            </div>

            {/* Alarm cards */}
            {alarms.map((alarm, index) => (
              <motion.div
                key={alarm.id}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface-1/95 backdrop-blur-xl shadow-2xl"
              >
                {/* Color accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: alarm.color || (alarm.type === 'event' ? '#4DA3FF' : '#24D68A') }}
                />

                {/* Pulsing ring indicator */}
                <div className="absolute top-4 right-4">
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: alarm.color || '#F87171' }}
                  />
                </div>

                <div className="p-5 pt-6">
                  {/* Type badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      alarm.type === 'event'
                        ? "bg-primary/15 text-primary"
                        : "bg-success/15 text-success"
                    )}>
                      {alarm.type === 'event' ? (
                        <Calendar className="h-3 w-3" />
                      ) : (
                        <CheckSquare className="h-3 w-3" />
                      )}
                      {alarm.type === 'event' ? 'Esemény' : 'Feladat'}
                      {alarm.category && (
                        <span className="opacity-70">• {alarm.category}</span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-heading font-bold text-text-primary mb-1">
                    {alarm.title}
                  </h2>

                  {/* Description / Time */}
                  {alarm.description && (
                    <p className="text-sm text-text-secondary mb-2 line-clamp-2">{alarm.description}</p>
                  )}
                  {alarm.time && (
                    <div className="flex items-center gap-1.5 text-sm text-text-muted mb-4">
                      <Clock className="h-3.5 w-3.5" />
                      {alarm.time}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onSnooze(alarm.id, 5)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-white/15 text-text-secondary hover:bg-white/5"
                    >
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      Szundi (5 perc)
                    </Button>
                    <Button
                      onClick={() => onDismiss(alarm.id)}
                      size="sm"
                      className="flex-1 bg-primary hover:bg-primary/90 text-surface-0"
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Elvetés
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
