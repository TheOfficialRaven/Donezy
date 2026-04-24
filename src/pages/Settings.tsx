import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, LogOut, Save, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import PreferencesSection from '@/components/preferences/PreferencesSection';
import PreferenceOptionGroup from '@/components/preferences/PreferenceOptionGroup';
import TargetGroupSelector from '@/components/preferences/TargetGroupSelector';
import PreferencesSummaryPanel from '@/components/preferences/PreferencesSummaryPanel';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { PreferencesViewSection, UserProfilePreferences } from '@/lib/preferences/types';
import { PREFERENCES_SECTION_LABELS } from '@/lib/preferences/constants';

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut, deleteAccount } = useAuthStore();
  const cleanup = useAppStore((s) => s.cleanup);
  const userPreferences = useAppStore((s) => s.userPreferences);
  const updateUserPreferences = useAppStore((s) => s.updateUserPreferences);
  const resetUserPreferencesSection = useAppStore((s) => s.resetUserPreferencesSection);
  const preferencesViewSection = useAppStore((s) => s.preferencesViewSection);
  const setPreferencesViewSection = useAppStore((s) => s.setPreferencesViewSection);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<UserProfilePreferences>(userPreferences);
  const [localDirty, setLocalDirty] = useState(false);

  useEffect(() => {
    if (saving || localDirty) return;
    setLocalPreferences(userPreferences);
  }, [userPreferences, saving, localDirty]);

  const handleSave = async (updates: Partial<UserProfilePreferences>) => {
    const nextLocal = { ...localPreferences, ...updates };
    setLocalPreferences(nextLocal);
    setLocalDirty(true);
    const payload =
      Object.keys(updates).length > 0
        ? updates
        : (Object.fromEntries(
            Object.entries(nextLocal).filter(([key, value]) => {
              const original = (userPreferences as Record<string, unknown>)[key];
              return JSON.stringify(original) !== JSON.stringify(value);
            })
          ) as Partial<UserProfilePreferences>);
    setSaving(true);
    try {
      if (Object.keys(payload).length > 0) {
        await updateUserPreferences(payload);
      }
      toast.success('Beallitasok elmentve.');
      setLocalDirty(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ismeretlen hiba';
      toast.error(`A szerver nem elerheto (${message}). A valtoztatas helyben megmaradt.`);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    cleanup();
    await deleteAccount();
    navigate('/', { replace: true });
    setDeleteConfirmOpen(false);
  };

  const sectionTabs = useMemo(() => Object.entries(PREFERENCES_SECTION_LABELS) as Array<[PreferencesViewSection, string]>, []);

  return (
    <div className="min-h-screen bg-surface-0 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <Button variant="ghost" onClick={() => navigate('/app/dashboard')} className="text-text-secondary hover:text-text-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Vissza
        </Button>

        <Card className="glass p-6 border-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-text-primary flex items-center gap-2">
                <SettingsIcon className="h-7 w-7 text-primary" />
                Beallitasok es szemelyre szabas
              </h1>
              <p className="text-sm text-text-secondary mt-2 max-w-3xl">
                Itt allitod be, hogyan mukodjon a Donezy nalad: mennyire legyen reszletes, milyen hangnemben segitsen, es
                hogyan kezelje a napi terhelest.
              </p>
            </div>
            <Button onClick={() => void handleSave({})} disabled={saving} className="bg-primary text-surface-0">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Mentes...' : 'Mentes'}
            </Button>
          </div>
        </Card>

        <PreferencesSummaryPanel preferences={localPreferences} />

        <Card className="glass p-2 border-white/5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
            {sectionTabs.map(([key, label]) => (
              <Button
                key={key}
                variant={preferencesViewSection === key ? 'secondary' : 'ghost'}
                className="justify-start h-8 text-xs"
                onClick={() => setPreferencesViewSection(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </Card>

        {preferencesViewSection === 'profile-target-group' && (
          <PreferencesSection
            title="Profil es celcsoport"
            description="Ez adja a szemelyre szabott viselkedes alapjat: dashboard hangsulyok, guidance fokusz es nyelvezet."
          >
            <TargetGroupSelector value={localPreferences.targetGroup} onChange={(targetGroup) => void handleSave({ targetGroup })} />
            <PreferenceOptionGroup
              label="Milyen hangnemben segitsen a rendszer?"
              value={localPreferences.preferredTone}
              onChange={(preferredTone) => void handleSave({ preferredTone: preferredTone as UserProfilePreferences['preferredTone'] })}
              options={[
                { value: 'supportive', label: 'Tamogato', help: 'Empatikusabb, nyugodtabb visszajelzesek.' },
                { value: 'neutral', label: 'Semleges', help: 'Targyilagos, kiegyensulyozott stilus.' },
                { value: 'direct', label: 'Direkt', help: 'Rovid, lenyegretoro javaslatok.' },
              ]}
            />
          </PreferencesSection>
        )}

        {preferencesViewSection === 'productivity-style' && (
          <PreferencesSection
            title="Produktivitasi stilus"
            description="Itt hangolod, mennyire legyen feszes vagy rugalmas a napi haladasi javaslat."
          >
            <PreferenceOptionGroup
              label="Melyik mukodesi mod all hozzad kozel?"
              value={localPreferences.productivityMode}
              onChange={(productivityMode) => void handleSave({ productivityMode: productivityMode as UserProfilePreferences['productivityMode'] })}
              options={[
                { value: 'balanced', label: 'Kiegyensulyozott' },
                { value: 'focus', label: 'Fokuszalt' },
                { value: 'light', label: 'Kimeletes' },
                { value: 'recovery', label: 'Regeneralo' },
              ]}
            />
            <PreferenceOptionGroup
              label="Mennyire legyen kotott a nap tervezese?"
              value={localPreferences.dayPlanningStyle}
              onChange={(dayPlanningStyle) => void handleSave({ dayPlanningStyle: dayPlanningStyle as UserProfilePreferences['dayPlanningStyle'] })}
              options={[
                { value: 'strict', label: 'Kotott' },
                { value: 'flexible', label: 'Rugalmas' },
                { value: 'mixed', label: 'Vegyes' },
              ]}
            />
            <PreferenceOptionGroup
              label="Mennyire vegye figyelembe, ha tul sok a teher?"
              value={localPreferences.overloadProtection}
              onChange={(overloadProtection) => void handleSave({ overloadProtection: overloadProtection as UserProfilePreferences['overloadProtection'] })}
              options={[
                { value: 'on', label: 'Bekapcsolva', help: 'Tulterhelesnel egyszerusit es visszavesz.' },
                { value: 'off', label: 'Kikapcsolva', help: 'Mindig teljes kepet mutat.' },
              ]}
            />
          </PreferencesSection>
        )}

        {preferencesViewSection === 'dashboard-focus' && (
          <PreferencesSection
            title="Dashboard es fokusz"
            description="Itt allitod be, mennyire reszletes legyen az attekintes es milyen idotavra optimalizaljon."
          >
            <PreferenceOptionGroup
              label="Mennyire reszletes dashboardot szeretnel?"
              value={localPreferences.dashboardDensity}
              onChange={(dashboardDensity) => void handleSave({ dashboardDensity: dashboardDensity as UserProfilePreferences['dashboardDensity'] })}
              options={[
                { value: 'minimal', label: 'Minimal' },
                { value: 'balanced', label: 'Kiegyensulyozott' },
                { value: 'detailed', label: 'Reszletes' },
              ]}
            />
            <PreferenceOptionGroup
              label="Melyik idotav legyen az alap?"
              value={localPreferences.defaultTimeHorizon}
              onChange={(defaultTimeHorizon) => void handleSave({ defaultTimeHorizon: defaultTimeHorizon as UserProfilePreferences['defaultTimeHorizon'] })}
              options={[
                { value: 'today', label: 'Ma' },
                { value: 'this-week', label: 'Ez a het' },
                { value: 'mixed', label: 'Vegyes' },
              ]}
            />
            <PreferenceOptionGroup
              label="A kuldetesek mennyire legyenek eloterben?"
              value={localPreferences.missionVisibility}
              onChange={(missionVisibility) => void handleSave({ missionVisibility: missionVisibility as UserProfilePreferences['missionVisibility'] })}
              options={[
                { value: 'secondary', label: 'Masodlagos' },
                { value: 'balanced', label: 'Kiegyensulyozott' },
                { value: 'strong', label: 'Eros hangsuly' },
              ]}
            />
          </PreferencesSection>
        )}

        {preferencesViewSection === 'habits-missions' && (
          <PreferencesSection
            title="Szokasok es kuldetesek"
            description="A rendszer mennyire automatikusan kezelje a szokaskovetest es mission hangsulyokat."
          >
            <PreferenceOptionGroup
              label="Hogyan kezelje a szokaskovetest?"
              value={localPreferences.habitTrackingPreference}
              onChange={(habitTrackingPreference) =>
                void handleSave({ habitTrackingPreference: habitTrackingPreference as UserProfilePreferences['habitTrackingPreference'] })
              }
              options={[
                { value: 'auto-first', label: 'Auto-first' },
                { value: 'hybrid', label: 'Vegyes' },
                { value: 'manual-light', label: 'Konnyu manualis' },
              ]}
            />
          </PreferencesSection>
        )}

        {preferencesViewSection === 'reflection-reading' && (
          <PreferencesSection
            title="Reflexio es olvasas"
            description="Milyen mely reflexios es olvasasi jelenletet szeretnel a napi folyamataidban."
          >
            <PreferenceOptionGroup
              label="Milyen reflexios melyseg legyen az alap?"
              value={localPreferences.reflectionStyle}
              onChange={(reflectionStyle) => void handleSave({ reflectionStyle: reflectionStyle as UserProfilePreferences['reflectionStyle'] })}
              options={[
                { value: 'quick', label: 'Gyors' },
                { value: 'mixed', label: 'Vegyes' },
                { value: 'deep', label: 'Mely' },
              ]}
            />
            <PreferenceOptionGroup
              label="Olvasasi modul hangsulya"
              value={localPreferences.readingVisibility}
              onChange={(readingVisibility) => void handleSave({ readingVisibility: readingVisibility as UserProfilePreferences['readingVisibility'] })}
              options={[
                { value: 'low', label: 'Alacsony' },
                { value: 'medium', label: 'Kozepes' },
                { value: 'high', label: 'Magas' },
              ]}
            />
            <PreferenceOptionGroup
              label="Jegyzet inbox viselkedese"
              value={localPreferences.notesInboxBehavior}
              onChange={(notesInboxBehavior) => void handleSave({ notesInboxBehavior: notesInboxBehavior as UserProfilePreferences['notesInboxBehavior'] })}
              options={[
                { value: 'simple', label: 'Egyszeru' },
                { value: 'structured', label: 'Strukturalt' },
              ]}
            />
          </PreferencesSection>
        )}

        {preferencesViewSection === 'appearance-advanced' && (
          <PreferencesSection
            title="Megjelenes es halado opciok"
            description="A vizualis suruseg, nyelv es halado szurok gyors hangolasa."
          >
            <div className="flex items-center justify-between rounded-md border border-white/10 bg-surface-0/20 p-3">
              <div>
                <p className="text-sm text-text-primary">Halado szurok mutatasa alapbol</p>
                <p className="text-xs text-text-muted">Tobb kontroll a modulok toolbarjaiban.</p>
              </div>
              <Switch
                checked={localPreferences.showAdvancedFilters}
                onCheckedChange={(checked) => void handleSave({ showAdvancedFilters: checked })}
              />
            </div>
            <PreferenceOptionGroup
              label="Tema preferencia"
              value={localPreferences.themePreference || 'system'}
              onChange={(themePreference) => void handleSave({ themePreference: themePreference as UserProfilePreferences['themePreference'] })}
              options={[
                { value: 'system', label: 'Rendszer' },
                { value: 'dark', label: 'Sotet' },
                { value: 'light', label: 'Vilagos' },
              ]}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="border-white/15" onClick={() => resetUserPreferencesSection('appearance-advanced')}>
                Szekcio visszaallitasa
              </Button>
            </div>
          </PreferencesSection>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="outline" onClick={handleLogout} className="border-danger text-danger hover:bg-danger/10">
            <LogOut className="h-4 w-4 mr-2" />
            Kijelentkezes
          </Button>
          <Button variant="outline" className="border-danger text-danger hover:bg-danger/10" onClick={() => setDeleteConfirmOpen(true)}>
            Fiok torlese
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Fiok torlese"
        description="Biztosan torolni szeretned a fiokodat? Minden adat veglegesen torlodik."
        confirmLabel="Vegleges torles"
        onConfirm={handleDeleteAccount}
        destructive
      />
    </div>
  );
}
