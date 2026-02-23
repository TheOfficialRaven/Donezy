import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Download,
  LogOut,
  ChevronRight,
  Save,
  ArrowLeft,
  Users as UsersIcon,
  Check,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { personas, usePersonaStore, type Persona } from '@/stores/usePersonaStore';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import * as dbService from '@/services/databaseService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { currentPersona, setPersona } = usePersonaStore();
  const { userStats } = useAppStore();
  const triggerQuestGeneration = useAppStore((s) => s.triggerQuestGeneration);
  const { user, signOut, deleteAccount } = useAuthStore();
  const isLight = useThemeStore((s) => s.theme) === 'light';
  const cleanup = useAppStore((s) => s.cleanup);
  const navigate = useNavigate();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingPersona, setPendingPersona] = useState<Persona | null>(null);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch {
      toast.error('Hiba a kijelentkezéskor');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      cleanup();
      await deleteAccount();
      navigate('/', { replace: true });
      toast.success('A fiókod sikeresen törölve.');
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        toast.error('A fiók törléséhez újra be kell jelentkezned. Kérjük, jelentkezz ki, majd újra be, és próbáld újra.');
      } else {
        toast.error('Hiba a fiók törlésekor. Próbáld újra.');
      }
    }
    setDeleteConfirmOpen(false);
  };

  const handlePersonaClick = (persona: Persona) => {
    if (persona.id === currentPersona.id) return;
    setPendingPersona(persona);
    setConfirmOpen(true);
  };

  const handleConfirmSwitch = async () => {
    if (!pendingPersona || !user) return;
    setPersona(pendingPersona);
    await dbService.savePersona(user.uid, pendingPersona.id);
    setTimeout(() => triggerQuestGeneration(), 500);
    setPendingPersona(null);
    setConfirmOpen(false);
    toast.success(`Célcsoport váltva: ${pendingPersona.label}`);
  };

  const settingsSections = [
    {
      title: 'Profil',
      icon: User,
      items: [
        { label: 'Teljes név', value: user?.displayName || 'Felhasználó', type: 'input' as const },
        { label: 'Email cím', value: user?.email || '', type: 'input' as const }
      ]
    },
    {
      title: 'Értesítések',
      icon: Bell,
      items: [
        { label: 'Push értesítések', value: true, type: 'toggle' as const },
        { label: 'Küldetés emlékeztetők', value: true, type: 'toggle' as const },
        { label: 'Eredmény értesítések', value: true, type: 'toggle' as const },
        { label: 'Heti összefoglaló', value: false, type: 'toggle' as const }
      ]
    },
    {
      title: 'Megjelenés',
      icon: Palette,
      items: [
        { label: 'Téma', value: 'Dark (Alapértelmezett)', type: 'link' as const },
        { label: 'Animációk csökkentése', value: false, type: 'toggle' as const },
        { label: 'Kompakt nézet', value: false, type: 'toggle' as const }
      ]
    },
    {
      title: 'Nyelv és régió',
      icon: Globe,
      items: [
        { label: 'Nyelv', value: 'Magyar', type: 'link' as const },
        { label: 'Időzóna', value: 'Budapest (CET)', type: 'link' as const },
        { label: 'Dátum formátum', value: 'YYYY.MM.DD', type: 'link' as const }
      ]
    },
    {
      title: 'Adatok',
      icon: Download,
      items: [
        { label: 'Adatok exportálása', value: '', type: 'button' as const },
        { label: 'Adatok importálása', value: '', type: 'button' as const },
        { label: 'Gyorsítótár törlése', value: '', type: 'button' as const }
      ]
    },
    {
      title: 'Adatvédelem',
      icon: Shield,
      items: [
        { label: 'Adatvédelmi irányelvek', value: '', type: 'link' as const },
        { label: 'Felhasználási feltételek', value: '', type: 'link' as const },
        { label: 'Fiók törlése', value: '', type: 'button' as const, destructive: true }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-surface-0 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/app/dashboard')}
          className="text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Vissza
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center glow-primary">
            <SettingsIcon className="h-8 w-8 text-surface-0" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">
            Beállítások
          </h1>
          <p className="text-text-secondary">
            Személyre szabd az alkalmazást igényeid szerint
          </p>
        </motion.div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Avatar'}
                    className="w-16 h-16 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                ) : (
                  <User className="h-8 w-8 text-surface-0" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-heading font-semibold text-text-primary">
                  {user?.displayName || 'Felhasználó'}
                </h3>
                <p className="text-text-secondary">
                  {currentPersona.label} persona
                </p>
                <p className="text-sm text-text-muted">
                  Szint {userStats.level} • {userStats.essence} Essence
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Persona (Target Group) Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="glass p-6">
            <h2 className="text-xl font-heading font-semibold text-text-primary mb-2 flex items-center gap-3">
              <UsersIcon className="h-5 w-5 text-primary" />
              Célcsoport
            </h2>
            <p className="text-sm text-text-muted mb-4">
              Válaszd ki a célcsoportodat — a küldetések és funkciók ehhez igazodnak
            </p>

            <div className="grid gap-2">
              {personas.map((persona) => {
                const PersonaIcon = LucideIcons[persona.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
                const isSelected = currentPersona.id === persona.id;

                return (
                  <button
                    key={persona.id}
                    onClick={() => handlePersonaClick(persona)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                      isSelected
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    )}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${persona.color}, ${isLight ? persona.color : persona.color + '88'})`,
                        boxShadow: isSelected
                          ? (isLight ? `0 2px 12px ${persona.color}50, 0 0 0 1px ${persona.color}30` : `0 0 20px ${persona.color}50`)
                          : (isLight ? `0 1px 4px ${persona.color}30` : 'none'),
                      }}
                    >
                      <PersonaIcon className="h-5 w-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-text-primary text-sm">{persona.label}</div>
                      <div className="text-xs text-text-muted">{persona.description}</div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + sectionIndex * 0.1 }}
            >
              <Card className="glass p-6">
                <h2 className="text-xl font-heading font-semibold text-text-primary mb-4 flex items-center gap-3">
                  <section.icon className="h-5 w-5 text-primary" />
                  {section.title}
                </h2>

                <div className="space-y-4">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex-1">
                        <label className="text-sm font-medium text-text-primary">
                          {item.label}
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        {item.type === 'input' && (
                          <Input
                            value={item.value as string}
                            className="w-64 bg-surface-1/50 border-white/10"
                            readOnly
                          />
                        )}

                        {item.type === 'toggle' && (
                          <Switch
                            checked={item.value as boolean}
                          />
                        )}

                        {item.type === 'link' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-text-secondary hover:text-text-primary"
                            onClick={
                              item.label === 'Adatvédelmi irányelvek'
                                ? () => navigate('/privacy')
                                : item.label === 'Felhasználási feltételek'
                                ? () => navigate('/terms')
                                : undefined
                            }
                          >
                            {item.value}
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        )}

                        {item.type === 'button' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className={
                              'destructive' in item && item.destructive
                                ? "border-danger text-danger hover:bg-danger/10"
                                : "border-white/20"
                            }
                            onClick={
                              item.label === 'Fiók törlése'
                                ? () => setDeleteConfirmOpen(true)
                                : undefined
                            }
                          >
                            {item.label.includes('exportálása') && 'Exportálás'}
                            {item.label.includes('importálása') && 'Importálás'}
                            {item.label.includes('törlése') && 'Törlés'}
                            {item.label.includes('Gyorsítótár') && 'Törlés'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row gap-4 pt-6"
        >
          <Button className="bg-primary hover:bg-primary/90 text-surface-0">
            <Save className="h-4 w-4 mr-2" />
            Változtatások mentése
          </Button>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-danger text-danger hover:bg-danger/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Kijelentkezés
          </Button>
        </motion.div>

        {/* Version Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="text-center py-6 text-sm text-text-muted"
        >
          <p>Donezy v1.0.0</p>
          <p className="mt-1">© 2025 Donezy Team. Minden jog fenntartva.</p>
        </motion.div>
      </div>

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

      {/* Confirm account deletion */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Fiók törlése"
        description="Biztosan törölni szeretnéd a fiókodat? Minden adatod (küldetések, jegyzetek, eredmények, statisztikák) véglegesen törlődik. Ez a művelet nem vonható vissza!"
        confirmLabel="Fiók végleges törlése"
        onConfirm={handleDeleteAccount}
        destructive
      />
    </div>
  );
}
