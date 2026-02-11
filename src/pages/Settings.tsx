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
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { usePersonaStore } from '@/stores/usePersonaStore';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';

export default function Settings() {
  const { currentPersona } = usePersonaStore();
  const { userStats } = useAppStore();
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch {
      toast.error('Hiba a kijelentkezéskor');
    }
  };

  const settingsSections = [
    {
      title: 'Profil',
      icon: User,
      items: [
        { label: 'Teljes név', value: user?.displayName || 'Felhasználó', type: 'input' as const },
        { label: 'Email cím', value: user?.email || '', type: 'input' as const },
        { label: 'Jelenlegi persona', value: currentPersona.label, type: 'link' as const }
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
    </div>
  );
}
