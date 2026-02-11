import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, LogIn, Zap, Target, Calendar, Trophy, Star, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { personas } from '@/stores/usePersonaStore';
import * as LucideIcons from 'lucide-react';
import DonezyLogo from '@/components/DonezyLogo';

const features = [
  {
    icon: Zap,
    title: 'Küldetés rendszer',
    description: 'Alakítsd át minden feladatod izgalmas küldetéssé'
  },
  {
    icon: Target,
    title: 'Szokás követés',
    description: 'Építs fel hosszú távú szokásokat játékos módon'
  },
  {
    icon: Calendar,
    title: 'Okos naptár',
    description: 'Integráld napi rutinod és hosszú távú céljaid'
  },
  {
    icon: Trophy,
    title: 'Eredmények',
    description: 'Szerezz badge-eket és lépj új szintekre'
  },
  {
    icon: Star,
    title: 'Persona rendszer',
    description: 'Válassz személyiségtípust optimális élményért'
  },
  {
    icon: Shield,
    title: 'Prémium design',
    description: 'Sötét téma és üveges felület, minden eszközön'
  }
];

const stats = [
  { label: 'Teljesítmény', value: '99%', description: 'Optimalizált sebesség' },
  { label: 'Hozzáférhetőség', value: 'AA', description: 'WCAG megfelelőség' },
  { label: 'UX score', value: '4.9', description: 'Felhasználói élmény' },
  { label: 'Mobil first', value: '100%', description: 'Reszponzív design' }
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-20 px-4">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />

        <div className="container mx-auto max-w-6xl relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="flex items-center justify-center gap-3 sm:gap-5 mb-6">
              <DonezyLogo className="w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28" />
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-heading font-bold">
                <span className="text-gradient-primary">Donezy</span>
              </h1>
            </div>
            <p className="text-base sm:text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto mb-8 px-2">
              Gamifikált produktivitási platform, amely átalakítja a mindennapjaidat
              egy izgalmas kaland sorozattá
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="bg-primary hover:bg-primary/90 text-surface-0 px-8 py-4 text-lg glow-primary"
              >
                <User className="mr-3 h-6 w-6" />
                Fiók létrehozása
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/auth')}
                className="border-white/20 text-text-primary hover:bg-white/5 px-8 py-4 text-lg"
              >
                <LogIn className="mr-3 h-6 w-6" />
                Belépés
              </Button>
            </div>
          </motion.div>

          {/* Demo Card Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="glass-intense rounded-2xl p-4 sm:p-8 hover-lift">
              <div className="flex items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-success to-success/60 flex items-center justify-center glow-primary flex-shrink-0">
                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-surface-0" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-semibold text-text-primary text-sm sm:text-base">Reggeli rutinok elvégzése</h3>
                    <p className="text-xs sm:text-sm text-text-muted truncate">Kávé, újságolvasás és napi célok átgondolása</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-success hover:bg-success/90 text-surface-0 flex-shrink-0"
                >
                  Kész
                </Button>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-text-muted">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-primary" /> +50 XP
                </span>
                <span>30 perc</span>
                <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">Rutin</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Persona Selection */}
      <section className="py-20 px-4 bg-surface-1/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-text-primary mb-4">
              Válassz személyiségtípust
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Minden persona egyedi élményt nyújt, személyre szabott küldetésekkel és célokkal
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personas.map((persona, index) => {
              const IconComponent = LucideIcons[persona.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;

              return (
                <motion.div
                  key={persona.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="glass p-6 hover-lift cursor-pointer group">
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:animate-glow-pulse"
                        style={{
                          background: `linear-gradient(135deg, ${persona.color}, ${persona.color}88)`,
                          boxShadow: `0 0 20px ${persona.color}40`
                        }}
                      >
                        <IconComponent className="h-6 w-6 text-surface-0" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-text-primary">{persona.label}</h3>
                        <p className="text-sm text-text-muted">{persona.description}</p>
                      </div>
                    </div>

                    <div className="text-xs text-text-muted">
                      <div
                        className="w-full h-1 rounded-full mb-2"
                        style={{ backgroundColor: `${persona.color}40` }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-1000 group-hover:w-full"
                          style={{
                            backgroundColor: persona.color,
                            width: '60%'
                          }}
                        />
                      </div>
                      Optimalizált élmény erre a típusra
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-text-primary mb-4">
              Miért válaszd a Donezy-t?
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Modern produktivitási megoldás játékos elemekkel és prémium designnal
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="glass p-6 hover-lift">
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="font-heading font-semibold text-text-primary mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-surface-1/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-text-primary mb-4">
              Teljesítmény és minőség
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="glass p-6 text-center">
                  <div className="text-3xl font-heading font-bold text-gradient-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="font-medium text-text-primary mb-1">
                    {stat.label}
                  </div>
                  <div className="text-sm text-text-muted">
                    {stat.description}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-text-primary mb-6">
              Kezdj el most
            </h2>
            <p className="text-base sm:text-xl text-text-secondary mb-8 max-w-2xl mx-auto px-2">
              Hozz létre fiókot és kezdj el építeni egy produktívabb életstílust
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="bg-primary hover:bg-primary/90 text-surface-0 px-8 py-4 text-lg glow-primary"
              >
                <User className="mr-3 h-6 w-6" />
                Fiók létrehozása
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/auth')}
                className="border-white/20 text-text-primary hover:bg-white/5 px-8 py-4 text-lg"
              >
                Belépés
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
