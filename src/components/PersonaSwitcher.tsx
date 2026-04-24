import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { personas, usePersonaStore, type Persona } from '@/stores/usePersonaStore';
import { useAppStore } from '@/stores/useAppStore';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { cn } from '@/lib/utils';

export default function PersonaSwitcher() {
  const { currentPersona, setPersona } = usePersonaStore();
  const triggerQuestGeneration = useAppStore((s) => s.triggerQuestGeneration);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPersona, setPendingPersona] = useState<Persona | null>(null);

  const IconComponent = LucideIcons[currentPersona.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;

  const handlePersonaClick = (persona: Persona) => {
    if (persona.id === currentPersona.id) {
      setIsOpen(false);
      return;
    }
    // Close dropdown and show confirmation
    setPendingPersona(persona);
    setIsOpen(false);
    setConfirmOpen(true);
  };

  const handleConfirmSwitch = () => {
    if (!pendingPersona) return;
    setPersona(pendingPersona);
    // Generate quests for the new persona (if not already cached)
    setTimeout(() => triggerQuestGeneration(), 500);
    setPendingPersona(null);
    setConfirmOpen(false);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className={cn(
              "flex items-center gap-2 sm:gap-3 px-1.5 sm:px-3 py-1.5 sm:py-2 h-auto",
              "hover:bg-white/5 transition-all duration-200",
              currentPersona.colorClass
            )}
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
            >
              <IconComponent className="h-4 w-4" style={{ color: currentPersona.iconColor }} />
            </div>
            
            <span className="text-xs font-medium text-text-primary sm:hidden">
              {currentPersona.label}
            </span>

            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-medium text-text-primary">
                {currentPersona.label}
              </span>
              <span className="text-xs text-text-muted">
                {currentPersona.description}
              </span>
            </div>
            
            <ChevronDown className={cn(
              "h-3.5 w-3.5 sm:h-4 sm:w-4 text-text-muted transition-transform duration-200",
              isOpen && "transform rotate-180"
            )} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          align="start" 
          className="w-80 p-2 bg-surface-1/95 backdrop-blur-xl border border-white/10"
        >
          <AnimatePresence>
            {personas.map((persona, index) => {
              const PersonaIcon = LucideIcons[persona.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
              const isSelected = currentPersona.id === persona.id;
              
              return (
                <motion.div
                  key={persona.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer",
                      "hover:bg-white/5 transition-all duration-200",
                      isSelected && "bg-white/10 border border-white/20"
                    )}
                    onClick={() => handlePersonaClick(persona)}
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                    >
                      <PersonaIcon className="h-5 w-5" style={{ color: persona.iconColor }} />
                    </div>
                    
                    <div className="flex flex-col flex-1">
                      <span className="font-medium text-text-primary">
                        {persona.label}
                      </span>
                      <span className="text-sm text-text-muted">
                        {persona.description}
                      </span>
                    </div>
                    
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
                    )}
                  </DropdownMenuItem>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirm persona switch */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Célcsoport váltás"
        description={
          pendingPersona
            ? `Biztosan át szeretnél váltani "${pendingPersona.label}" célcsoportra? A küldetéseid és a felület az új célcsoporthoz igazodnak.`
            : ''
        }
        confirmLabel="Váltás"
        onConfirm={handleConfirmSwitch}
      />
    </>
  );
}
