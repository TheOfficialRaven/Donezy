import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Heart,
  Banknote,
  Users,
  Rocket,
  BookOpen,
  Palette,
  Home,
  Brain,
  Clock,
  ListTodo,
  Activity,
  Flame,
  Target,
  User,
  UserPlus,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { personas, usePersonaStore, type Persona } from '@/stores/usePersonaStore';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';
import * as dbService from '@/services/databaseService';
import { cn } from '@/lib/utils';

// ============ CONSTANTS ============

const INTEREST_OPTIONS = [
  { id: 'health', label: 'Egészség & Fitnesz', icon: Heart, description: 'Sport, táplálkozás, alvás', color: 'hsl(0 80% 60%)' },
  { id: 'finance', label: 'Pénzügyek', icon: Banknote, description: 'Megtakarítás, költségvetés', color: 'hsl(45 90% 50%)' },
  { id: 'social', label: 'Társas kapcsolatok', icon: Users, description: 'Barátok, család, közösség', color: 'hsl(330 80% 60%)' },
  { id: 'productivity', label: 'Produktivitás', icon: Rocket, description: 'Időgazdálkodás, fókusz, hatékonyság', color: 'hsl(200 85% 55%)' },
  { id: 'learning', label: 'Tanulás & Fejlődés', icon: BookOpen, description: 'Nyelvtanulás, kurzusok, olvasás', color: 'hsl(150 60% 45%)' },
  { id: 'creativity', label: 'Kreativitás', icon: Palette, description: 'Alkotás, írás, zene, design', color: 'hsl(280 75% 60%)' },
  { id: 'home', label: 'Otthoni rend', icon: Home, description: 'Takarítás, rendszerezés, háztartás', color: 'hsl(30 80% 55%)' },
  { id: 'mental', label: 'Mentális jólét', icon: Brain, description: 'Meditáció, relaxáció, tudatosság', color: 'hsl(170 70% 50%)' },
];

const CHALLENGE_OPTIONS = [
  { id: 'routine', label: 'Nehezen tartom be a rutinokat', icon: Clock },
  { id: 'priorities', label: 'Túl sok a teendőm, nem tudok priorizálni', icon: ListTodo },
  { id: 'exercise', label: 'Nem mozgok eleget', icon: Activity },
  { id: 'finance', label: 'Pénzügyi gondjaim vannak', icon: Banknote },
  { id: 'motivation', label: 'Hiányzik a motiváció', icon: Flame },
  { id: 'focus', label: 'Szétszórt vagyok, nehezen fókuszálok', icon: Target },
];

const LIVING_OPTIONS = [
  { id: 'alone', label: 'Egyedül', icon: User },
  { id: 'partner', label: 'Párral', icon: Heart },
  { id: 'family', label: 'Családdal', icon: Users },
  { id: 'roommates', label: 'Szobatársakkal', icon: UserPlus },
  { id: 'parents', label: 'Szülőkkel', icon: Home },
];

const FREQUENCY_OPTIONS = [
  { id: 'low' as const, label: 'Keveset, de lényegeseket', detail: '3 küldetés / nap' },
  { id: 'medium' as const, label: 'Átlagos mennyiséget', detail: '4 küldetés / nap' },
  { id: 'high' as const, label: 'Sokat, legyen mindig feladat', detail: '5 küldetés / nap' },
];

const TIME_OPTIONS = [
  { id: 'morning' as const, label: 'Reggel', detail: '6:00 - 12:00', icon: Sun },
  { id: 'afternoon' as const, label: 'Délután', detail: '12:00 - 18:00', icon: Sunset },
  { id: 'evening' as const, label: 'Este', detail: '18:00 - 24:00', icon: Moon },
];

const TOTAL_STEPS = 5;

// ============ COMPONENT ============

export default function Onboarding() {
  const isLight = useThemeStore((s) => s.theme) === 'light';
  const [step, setStep] = useState(0);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [challenge, setChallenge] = useState('');
  const [livingWith, setLivingWith] = useState<string[]>([]);
  const [questFrequency, setQuestFrequency] = useState<'low' | 'medium' | 'high'>('medium');
  const [activeTime, setActiveTime] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setPersona } = usePersonaStore();
  const triggerQuestGeneration = useAppStore((s) => s.triggerQuestGeneration);

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return selectedPersona !== null;
      case 2: return selectedInterests.length > 0;
      case 3: return challenge !== '';
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1 && canProceed()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleLiving = (id: string) => {
    setLivingWith((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    if (!user || !selectedPersona) return;
    setSaving(true);

    try {
      // Save preferences to Firebase
      await dbService.updatePreferences(user.uid, {
        onboardingCompleted: true,
        interests: selectedInterests,
        challenge,
        questFrequency,
        activeTime,
        livingWith,
      });

      // Set persona
      setPersona(selectedPersona);
      await dbService.savePersona(user.uid, selectedPersona.id);

      // Force-regenerate quests with the new preferences & persona
      // (deletes any quests that were generated before onboarding with empty interests)
      setTimeout(() => triggerQuestGeneration(true), 800);

      // Navigate to app
      navigate('/app', { replace: true });
    } catch {
      setSaving(false);
    }
  };

  // ============ STEP RENDERERS ============

  const renderWelcome = () => (
    <div className="text-center space-y-8 max-w-lg mx-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary"
      >
        <Sparkles className="h-10 w-10 text-white" />
      </motion.div>

      <div className="space-y-3">
        <h1 className="text-4xl font-heading font-bold text-text-primary">
          Üdvözlünk a Donezy-ban!
        </h1>
        <p className="text-lg text-text-secondary leading-relaxed">
          Néhány kérdéssel személyre szabjuk az élményedet, hogy pontosan azokat
          a funkciókat és küldetéseket kapd, amikre szükséged van.
        </p>
      </div>

      <p className="text-sm text-text-muted">
        Mindössze 1-2 perc az egész
      </p>
    </div>
  );

  const renderPersonaSelection = () => (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading font-bold text-text-primary">
          Miben segíthet neked a Donezy?
        </h2>
        <p className="text-text-secondary">
          Válaszd ki melyik célcsoport illik rád a legjobban
        </p>
      </div>

      <div className="grid gap-3">
        {personas.map((persona) => {
          const PersonaIcon = LucideIcons[persona.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
          const isSelected = selectedPersona?.id === persona.id;

          return (
            <motion.button
              key={persona.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelectedPersona(persona)}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left',
                isSelected
                  ? 'border-primary/60 bg-primary/10 shadow-lg'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
              )}
              style={isSelected ? { boxShadow: `0 0 30px ${persona.color}25` } : undefined}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${persona.color}, ${isLight ? persona.color : persona.color + '88'})`,
                  boxShadow: isSelected
                    ? (isLight ? `0 2px 12px ${persona.color}50, 0 0 0 1px ${persona.color}30` : `0 0 20px ${persona.color}50`)
                    : (isLight ? `0 1px 4px ${persona.color}30` : 'none'),
                }}
              >
                <PersonaIcon className="h-6 w-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-text-primary">{persona.label}</div>
                <div className="text-sm text-text-muted">{persona.heroSubtitle}</div>
              </div>

              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0"
                >
                  <Check className="h-4 w-4 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  const renderInterestSelection = () => (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading font-bold text-text-primary">
          Milyen területeken szeretnél fejlődni?
        </h2>
        <p className="text-text-secondary">
          Válassz legalább egyet — ezek alapján személyre szabott küldetéseket kapsz
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {INTEREST_OPTIONS.map((interest) => {
          const isSelected = selectedInterests.includes(interest.id);

          return (
            <motion.button
              key={interest.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleInterest(interest.id)}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 text-left',
                isSelected
                  ? 'border-primary/50 bg-primary/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all',
                  isSelected ? 'opacity-100' : 'opacity-60'
                )}
                style={{ background: `${interest.color}22`, color: interest.color }}
              >
                <interest.icon className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-text-primary text-sm">{interest.label}</div>
                <div className="text-xs text-text-muted">{interest.description}</div>
              </div>

              <div
                className={cn(
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-white/30 bg-transparent'
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>
            </motion.button>
          );
        })}
      </div>

      {selectedInterests.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-primary"
        >
          {selectedInterests.length} terület kiválasztva
        </motion.p>
      )}
    </div>
  );

  const renderAboutYou = () => (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading font-bold text-text-primary">
          Mesélj egy kicsit magadról
        </h2>
        <p className="text-text-secondary">
          Segíts nekünk jobban megérteni az igényeidet
        </p>
      </div>

      {/* Challenge */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
          Mi a legnagyobb kihívásod jelenleg?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CHALLENGE_OPTIONS.map((opt) => {
            const isSelected = challenge === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setChallenge(opt.id)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-all',
                  isSelected
                    ? 'border-primary/50 bg-primary/10 text-text-primary'
                    : 'border-white/10 bg-white/5 text-text-secondary hover:bg-white/10'
                )}
              >
                <opt.icon className={cn('h-4 w-4 shrink-0', isSelected ? 'text-primary' : 'text-text-muted')} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Living situation */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
          Kivel élsz együtt?
        </h3>
        <div className="flex flex-wrap gap-2">
          {LIVING_OPTIONS.map((opt) => {
            const isSelected = livingWith.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleLiving(opt.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-all',
                  isSelected
                    ? 'border-primary/50 bg-primary/10 text-text-primary'
                    : 'border-white/10 bg-white/5 text-text-secondary hover:bg-white/10'
                )}
              >
                <opt.icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quest frequency */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
          Mennyi küldetést szeretnél naponta?
        </h3>
        <div className="grid gap-2">
          {FREQUENCY_OPTIONS.map((opt) => {
            const isSelected = questFrequency === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setQuestFrequency(opt.id)}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border text-sm transition-all',
                  isSelected
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                )}
              >
                <span className={isSelected ? 'text-text-primary font-medium' : 'text-text-secondary'}>
                  {opt.label}
                </span>
                <span className="text-xs text-text-muted">{opt.detail}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active time */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
          Mikor vagy a legaktívabb?
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {TIME_OPTIONS.map((opt) => {
            const isSelected = activeTime === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setActiveTime(opt.id)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm transition-all',
                  isSelected
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                )}
              >
                <opt.icon className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-text-muted')} />
                <span className={isSelected ? 'text-text-primary font-medium' : 'text-text-secondary'}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-text-muted">{opt.detail}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="text-center space-y-8 max-w-lg mx-auto">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center"
        style={{ boxShadow: '0 0 40px hsl(142 71% 45% / 0.4)' }}
      >
        <Check className="h-10 w-10 text-white" />
      </motion.div>

      <div className="space-y-3">
        <h2 className="text-3xl font-heading font-bold text-text-primary">
          Minden kész!
        </h2>
        <p className="text-lg text-text-secondary">
          Az élményed személyre lett szabva az igényeid alapján.
        </p>
      </div>

      {/* Summary */}
      <div className="space-y-3 text-left">
        {selectedPersona && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${selectedPersona.color}, ${selectedPersona.color}88)` }}
            >
              {(() => {
                const Icon = LucideIcons[selectedPersona.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
                return <Icon className="h-4 w-4 text-white" />;
              })()}
            </div>
            <div>
              <div className="text-xs text-text-muted">Célcsoport</div>
              <div className="text-sm font-medium text-text-primary">{selectedPersona.label}</div>
            </div>
          </div>
        )}

        {selectedInterests.length > 0 && (
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-text-muted mb-2">Érdeklődési területek</div>
            <div className="flex flex-wrap gap-1.5">
              {selectedInterests.map((id) => {
                const interest = INTEREST_OPTIONS.find((i) => i.id === id);
                return interest ? (
                  <span
                    key={id}
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: `${interest.color}20`, color: interest.color }}
                  >
                    {interest.label}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="text-xs text-text-muted mb-1">Napi küldetések</div>
          <div className="text-sm font-medium text-text-primary">
            {FREQUENCY_OPTIONS.find((f) => f.id === questFrequency)?.detail}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 0: return renderWelcome();
      case 1: return renderPersonaSelection();
      case 2: return renderInterestSelection();
      case 3: return renderAboutYou();
      case 4: return renderComplete();
      default: return null;
    }
  };

  // ============ RENDER ============

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      {/* Progress bar */}
      {step > 0 && (
        <div className="w-full h-1 bg-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary"
            initial={{ width: 0 }}
            animate={{ width: `${(step / (TOTAL_STEPS - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Step indicator */}
      {step > 0 && step < TOTAL_STEPS - 1 && (
        <div className="flex justify-center pt-6 pb-2">
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_STEPS - 2 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  i + 1 <= step
                    ? 'bg-primary w-6'
                    : 'bg-white/20'
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-3xl"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="px-4 pb-8 pt-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            {step > 0 && step < TOTAL_STEPS - 1 && (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-text-secondary hover:text-text-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Vissza
              </Button>
            )}
          </div>

          <div>
            {step === 0 && (
              <Button
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
                size="lg"
              >
                Kezdjük!
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            )}

            {step > 0 && step < TOTAL_STEPS - 1 && (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-primary hover:bg-primary/90 text-white px-6"
              >
                Tovább
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {step === TOTAL_STEPS - 1 && (
              <Button
                onClick={handleComplete}
                disabled={saving}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white px-8 py-3 text-lg"
                size="lg"
              >
                {saving ? 'Mentés...' : 'Irány a Donezy!'}
                <Sparkles className="h-5 w-5 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
