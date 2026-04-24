import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, Layers3, ListTodo, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { personas, usePersonaStore } from '@/stores/usePersonaStore';
import * as dbService from '@/services/databaseService';
import {
  ONBOARDING_PRESETS,
  ONBOARDING_TOTAL_STEPS,
  buildOnboardingResultProfile,
  getOnboardingProgress,
  getOnboardingSummaryLines,
  normalizeOnboardingAnswers,
  validateOnboardingStep,
} from '@/lib/onboarding';
import type { PreferenceTargetGroup } from '@/lib/preferences';
import OnboardingOptionCard from '@/components/onboarding/OnboardingOptionCard';
import OnboardingPresetCard from '@/components/onboarding/OnboardingPresetCard';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import OnboardingStep from '@/components/onboarding/OnboardingStep';
import OnboardingSummary from '@/components/onboarding/OnboardingSummary';

export default function Onboarding() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setPersona = usePersonaStore((s) => s.setPersona);
  const {
    onboardingStep,
    onboardingAnswers,
    userPreferences,
    setOnboardingAnswer,
    goToNextOnboardingStep,
    goToPreviousOnboardingStep,
    completeOnboarding,
    skipOnboarding,
    triggerQuestGeneration,
  } = useAppStore();
  const [saving, setSaving] = useState(false);

  const progress = useMemo(() => getOnboardingProgress(onboardingStep, ONBOARDING_TOTAL_STEPS), [onboardingStep]);
  const validationErrors = useMemo(
    () => validateOnboardingStep(onboardingStep, onboardingAnswers),
    [onboardingStep, onboardingAnswers]
  );
  const summaryProfile = useMemo(
    () => buildOnboardingResultProfile(onboardingAnswers, userPreferences),
    [onboardingAnswers, userPreferences]
  );
  const summaryLines = useMemo(() => getOnboardingSummaryLines(onboardingAnswers), [onboardingAnswers]);

  const canProceed = onboardingStep === ONBOARDING_TOTAL_STEPS - 1 || validationErrors.length === 0;

  const handleNext = () => {
    if (!canProceed) return;
    goToNextOnboardingStep();
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await completeOnboarding();
      const targetGroup = summaryProfile.derivedTargetGroup;
      const personaId =
        targetGroup === 'self-development'
          ? 'selfdev'
          : targetGroup === 'student'
            ? 'student'
            : targetGroup === 'young-professional'
              ? 'worker'
              : targetGroup === 'freelancer'
                ? 'freelancer'
                : targetGroup === 'organizer'
                  ? 'organizer'
                  : 'student';
      const persona = personas.find((row) => row.id === personaId);
      if (persona) {
        setPersona(persona);
        await dbService.savePersona(user.uid, persona.id);
      }
      setTimeout(() => triggerQuestGeneration(true), 700);
      navigate('/app/dashboard', { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className="space-y-4">
      <OnboardingProgress step={onboardingStep} totalSteps={ONBOARDING_TOTAL_STEPS} progressPercent={progress} />
      {onboardingStep === 0 && (
        <OnboardingStep
          title="Gyors beallitas, jobb kezdes"
          description="Nehany gyors kerdessel a Donezy jobban hozzad tud igazodni. Ezt kesobb barmikor modositani tudod."
        >
          <div className="grid gap-2 md:grid-cols-2">
            {ONBOARDING_PRESETS.map((preset) => (
              <OnboardingPresetCard
                key={preset.id}
                preset={preset}
                selected={onboardingAnswers.selectedPresetId === preset.id}
                onSelect={() => {
                  const merged = normalizeOnboardingAnswers({ ...onboardingAnswers, ...preset.answersPatch, selectedPresetId: preset.id });
                  setOnboardingAnswer(merged);
                }}
              />
            ))}
          </div>
        </OnboardingStep>
      )}
      {onboardingStep === 1 && (
        <OnboardingStep title="Mire hasznalnad elsosorban?" description="Nem kell tokeletesen valasztanod, ez csak az indulasi hangolas.">
          <div className="grid gap-2 md:grid-cols-2">
            <OnboardingOptionCard label="Napi rendszerezes" icon={<ListTodo className="h-4 w-4" />} selected={onboardingAnswers.goalPrimary === 'daily-organization'} onClick={() => setOnboardingAnswer({ goalPrimary: 'daily-organization' })} />
            <OnboardingOptionCard label="Onfejlesztes" icon={<Target className="h-4 w-4" />} selected={onboardingAnswers.goalPrimary === 'self-development'} onClick={() => setOnboardingAnswer({ goalPrimary: 'self-development' })} />
            <OnboardingOptionCard label="Tanulas" icon={<BookOpen className="h-4 w-4" />} selected={onboardingAnswers.goalPrimary === 'learning'} onClick={() => setOnboardingAnswer({ goalPrimary: 'learning' })} />
            <OnboardingOptionCard label="Munka / projektek" icon={<Clock3 className="h-4 w-4" />} selected={onboardingAnswers.goalPrimary === 'work-projects'} onClick={() => setOnboardingAnswer({ goalPrimary: 'work-projects' })} />
            <OnboardingOptionCard label="Altalanos rendrakas" icon={<Layers3 className="h-4 w-4" />} selected={onboardingAnswers.goalPrimary === 'general-order'} onClick={() => setOnboardingAnswer({ goalPrimary: 'general-order' })} />
          </div>
        </OnboardingStep>
      )}
      {onboardingStep === 2 && (
        <OnboardingStep title="Melyik celcsoport ir le legjobban?" description="Ez meghatarozza az indulasi dashboard hangsulyokat.">
          <div className="grid gap-2 md:grid-cols-2">
            {([
              ['self-development', 'Self-development'],
              ['student', 'Student'],
              ['young-professional', 'Young professional'],
              ['freelancer', 'Freelancer'],
              ['organizer', 'Organizer'],
              ['other', 'Other'],
            ] as Array<[PreferenceTargetGroup, string]>).map(([id, label]) => (
              <OnboardingOptionCard
                key={id}
                label={label}
                selected={onboardingAnswers.targetGroupChoice === id}
                onClick={() => setOnboardingAnswer({ targetGroupChoice: id })}
              />
            ))}
          </div>
        </OnboardingStep>
      )}
      {onboardingStep === 3 && (
        <OnboardingStep title="Milyen segitseg-hangnemet szeretnel?" description="A Guidance es a dashboard szovege ehhez igazodik.">
          <div className="grid gap-2 md:grid-cols-3">
            <OnboardingOptionCard label="Tamogato" selected={onboardingAnswers.tonePreference === 'supportive'} onClick={() => setOnboardingAnswer({ tonePreference: 'supportive' })} />
            <OnboardingOptionCard label="Targyilagos" selected={onboardingAnswers.tonePreference === 'neutral'} onClick={() => setOnboardingAnswer({ tonePreference: 'neutral' })} />
            <OnboardingOptionCard label="Direktebb" selected={onboardingAnswers.tonePreference === 'direct'} onClick={() => setOnboardingAnswer({ tonePreference: 'direct' })} />
          </div>
        </OnboardingStep>
      )}
      {onboardingStep === 4 && (
        <OnboardingStep title="Milyen dashboardot szeretnel?" description="Az elso nezet ettol lesz egyszerubb vagy reszletesebb.">
          <div className="grid gap-2 md:grid-cols-3">
            <OnboardingOptionCard label="Egyszeru es letisztult" selected={onboardingAnswers.dashboardDensityPreference === 'minimal'} onClick={() => setOnboardingAnswer({ dashboardDensityPreference: 'minimal' })} />
            <OnboardingOptionCard label="Kiegyensulyozott" selected={onboardingAnswers.dashboardDensityPreference === 'balanced'} onClick={() => setOnboardingAnswer({ dashboardDensityPreference: 'balanced' })} />
            <OnboardingOptionCard label="Reszletesebb" selected={onboardingAnswers.dashboardDensityPreference === 'detailed'} onClick={() => setOnboardingAnswer({ dashboardDensityPreference: 'detailed' })} />
          </div>
        </OnboardingStep>
      )}
      {onboardingStep === 5 && (
        <OnboardingStep title="Mennyire legyen kimelo a rendszer?" description="Ez befolyasolja a terhelesvedelmet es a napi ritmust.">
          <div className="grid gap-2 md:grid-cols-3">
            <OnboardingOptionCard label="Erosen" icon={<ShieldCheck className="h-4 w-4" />} selected={onboardingAnswers.overwhelmPreference === 'high'} onClick={() => setOnboardingAnswer({ overwhelmPreference: 'high', productivityPreference: 'recovery' })} />
            <OnboardingOptionCard label="Kozepesen" selected={onboardingAnswers.overwhelmPreference === 'medium'} onClick={() => setOnboardingAnswer({ overwhelmPreference: 'medium', productivityPreference: 'balanced' })} />
            <OnboardingOptionCard label="Nem szukseges kulonosen" selected={onboardingAnswers.overwhelmPreference === 'low'} onClick={() => setOnboardingAnswer({ overwhelmPreference: 'low', productivityPreference: 'focus' })} />
          </div>
        </OnboardingStep>
      )}
      {onboardingStep === 6 && (
        <OnboardingStep title="Mi legyen jobban eloterben?" description="Ez finomhangolja az indulasi hangsulyokat es quick action sorrendet.">
          <div className="grid gap-2 md:grid-cols-2">
            <OnboardingOptionCard label="Feladatok es esemenyek" selected={onboardingAnswers.dashboardEmphasis === 'tasks-events'} onClick={() => setOnboardingAnswer({ dashboardEmphasis: 'tasks-events' })} />
            <OnboardingOptionCard label="Fejlodes es szokasok" selected={onboardingAnswers.dashboardEmphasis === 'growth-habits'} onClick={() => setOnboardingAnswer({ dashboardEmphasis: 'growth-habits' })} />
            <OnboardingOptionCard label="Tanulas es haladas" selected={onboardingAnswers.dashboardEmphasis === 'learning-progress'} onClick={() => setOnboardingAnswer({ dashboardEmphasis: 'learning-progress' })} />
            <OnboardingOptionCard label="Projektek es fokusz" selected={onboardingAnswers.dashboardEmphasis === 'projects-focus'} onClick={() => setOnboardingAnswer({ dashboardEmphasis: 'projects-focus' })} />
            <OnboardingOptionCard label="Rend es atlathatosag" selected={onboardingAnswers.dashboardEmphasis === 'order-clarity'} onClick={() => setOnboardingAnswer({ dashboardEmphasis: 'order-clarity' })} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-text-muted">Opcionális: mi a legfontosabb neked most?</p>
            <Textarea
              value={onboardingAnswers.prioritiesFreeform || ''}
              onChange={(e) => setOnboardingAnswer({ prioritiesFreeform: e.target.value })}
              placeholder="Pl. kevesebb szetszortsag, jobb napi attekintes..."
              className="bg-white/5 border-white/10 min-h-[84px]"
            />
          </div>
          <OnboardingSummary profile={summaryProfile} lines={summaryLines} />
        </OnboardingStep>
      )}
      {validationErrors.length > 0 && onboardingStep > 0 && onboardingStep < ONBOARDING_TOTAL_STEPS && (
        <p className="text-xs text-amber-300">{validationErrors[0]}</p>
      )}
    </div>
  );

  return (
    <OnboardingShell
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={() => (onboardingStep > 0 ? goToPreviousOnboardingStep() : skipOnboarding().then(() => navigate('/app/dashboard', { replace: true })))}>
            {onboardingStep > 0 ? (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Vissza
              </>
            ) : (
              'Most kihagyom'
            )}
          </Button>
          {onboardingStep < ONBOARDING_TOTAL_STEPS - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed} className="bg-primary hover:bg-primary/90 text-surface-0">
              Tovabb
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={saving} className="bg-primary hover:bg-primary/90 text-surface-0">
              {saving ? 'Beallitas...' : 'Igy induljon a Donezy'}
              <Sparkles className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      }
    >
      {content}
      {onboardingStep === ONBOARDING_TOTAL_STEPS - 1 ? (
        <div className="mt-4 rounded-xl border border-primary/25 bg-primary/10 p-3 text-xs text-text-secondary">
          <div className="flex items-center gap-2 text-text-primary font-medium mb-1">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Nem kell tokeletesen valasztanod.
          </div>
          Ezeket a beallitasokat kesobb barmikor modositani tudod a Settings oldalon.
        </div>
      ) : null}
    </OnboardingShell>
  );
}
