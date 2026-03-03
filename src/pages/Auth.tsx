import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';
import DonezyLogo from '@/components/DonezyLogo';

const REMEMBER_ME_STORAGE_KEY = 'donezy-remember-me';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('tab') !== 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [verificationResent, setVerificationResent] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    const saved = localStorage.getItem(REMEMBER_ME_STORAGE_KEY);
    if (saved === null) return true; // better default for PWA/mobile
    return saved === 'true';
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const navigate = useNavigate();
  const {
    signIn, signUp, signInWithGoogle, resetPassword, resendVerificationEmail,
    loading, error, clearError, needsEmailVerification, clearVerificationState
  } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setVerificationResent(false);

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password, rememberMe);
        navigate('/app/dashboard');
      } else {
        await signUp(formData.email, formData.password, formData.name);
        // Don't navigate - show verification screen
      }
    } catch {
      // Error is handled in the store
      // If needsEmailVerification is set, the UI will show the verification screen
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail(formData.email, formData.password);
      setVerificationResent(true);
      toast.success('Megerősítő email újraküldve!');
    } catch {
      toast.error('Nem sikerült újraküldeni. Ellenőrizd az adatokat.');
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    try {
      await signInWithGoogle(rememberMe);
      navigate('/app/dashboard');
    } catch {
      // Error is handled in the store
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch {
      // Error is handled in the store
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    localStorage.setItem(REMEMBER_ME_STORAGE_KEY, String(checked));
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    clearError();
    clearVerificationState();
    setShowResetPassword(false);
    setResetSent(false);
    setVerificationResent(false);
  };

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        {/* Left side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col justify-center p-8 lg:p-12"
        >
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <DonezyLogo className="w-14 h-14" />
              <span className="text-3xl font-heading font-bold text-gradient-primary">
                Donezy
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-heading font-bold text-text-primary mb-4">
              {isLogin ? 'Üdvözlünk vissza!' : 'Csatlakozz hozzánk!'}
            </h1>
            <p className="text-lg text-text-secondary mb-8">
              {isLogin
                ? 'Folytasd ott, ahol abbahagytad. Küldetéseid várnak rád!'
                : 'Kezdj el egy új kalandot a produktivitás világában.'
              }
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            {[
              { text: 'Gamifikált küldetés rendszer' },
              { text: 'Szokás és haladás követés' },
              { text: 'Okos naptár és jegyzetek' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-text-secondary">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right side - Auth form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-center p-4"
        >
          <Card className="glass-intense w-full max-w-md p-8">
            {needsEmailVerification ? (
              /* Email Verification Screen */
              <div className="text-center py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-16 h-16 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center"
                >
                  <Mail className="h-8 w-8 text-primary" />
                </motion.div>

                <h2 className="text-2xl font-heading font-bold text-text-primary mb-2">
                  Erősítsd meg az email címed!
                </h2>
                <p className="text-text-secondary mb-2">
                  Küldtünk egy megerősítő linket a következő címre:
                </p>
                <p className="text-primary font-medium mb-6">
                  {formData.email}
                </p>

                <div className="glass p-4 rounded-lg mb-6 text-left">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-text-secondary">
                      <p className="font-medium text-text-primary mb-1">Következő lépések:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Nyisd meg az email fiókodat</li>
                        <li>Keresd meg a Donezy megerősítő emailt</li>
                        <li>Kattints a megerősítő linkre</li>
                        <li>Gyere vissza és jelentkezz be!</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {verificationResent && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm mb-4">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    Megerősítő email újraküldve!
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={() => switchMode(true)}
                    className="w-full bg-primary hover:bg-primary/90 text-surface-0 glow-primary"
                  >
                    Belépés megerősített fiókkal
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="w-full border-white/20 text-text-primary hover:bg-white/5"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Küldés...' : 'Megerősítő email újraküldése'}
                  </Button>

                  <p className="text-xs text-text-muted">
                    Nem kaptad meg? Ellenőrizd a spam/levélszemét mappát is.
                  </p>
                </div>
              </div>
            ) : showResetPassword ? (
              /* Password Reset Form */
              <div>
                <h2 className="text-xl font-heading font-semibold text-text-primary mb-2">
                  Elfelejtett jelszó
                </h2>
                <p className="text-sm text-text-secondary mb-6">
                  Add meg az email címed és küldünk egy jelszó visszaállító linket.
                </p>

                {resetSent ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 mx-auto mb-4 bg-success/20 rounded-full flex items-center justify-center">
                      <Mail className="h-6 w-6 text-success" />
                    </div>
                    <p className="text-text-primary font-medium mb-2">Email elküldve!</p>
                    <p className="text-sm text-text-secondary mb-4">
                      Ellenőrizd a postaládád a jelszó visszaállító linkért.
                    </p>
                    <Button
                      variant="ghost"
                      onClick={() => { setShowResetPassword(false); setResetSent(false); }}
                      className="text-primary"
                    >
                      Vissza a belépéshez
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {error}
                      </div>
                    )}

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="pl-10 bg-surface-1/50 border-white/10 text-text-primary placeholder:text-text-muted"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary hover:bg-primary/90 text-surface-0"
                    >
                      {loading ? 'Küldés...' : 'Visszaállító link küldése'}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { setShowResetPassword(false); clearError(); }}
                      className="w-full text-text-secondary"
                    >
                      Vissza a belépéshez
                    </Button>
                  </form>
                )}
              </div>
            ) : (
              /* Login / Register Form */
              <div>
                <div className="mb-6">
                  <div className="flex bg-surface-2/50 rounded-lg p-1 mb-6">
                    <button
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                        isLogin
                          ? 'bg-primary text-surface-0 shadow-lg'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                      onClick={() => switchMode(true)}
                    >
                      Belépés
                    </button>
                    <button
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                        !isLogin
                          ? 'bg-primary text-surface-0 shadow-lg'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                      onClick={() => switchMode(false)}
                    >
                      Regisztráció
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm mb-4">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-primary">
                        Teljes név
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                        <Input
                          type="text"
                          placeholder="Add meg a neved"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="pl-10 bg-surface-1/50 border-white/10 text-text-primary placeholder:text-text-muted"
                          required={!isLogin}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">
                      Email cím
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10 bg-surface-1/50 border-white/10 text-text-primary placeholder:text-text-muted"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">
                      Jelszó
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="pl-10 pr-10 bg-surface-1/50 border-white/10 text-text-primary placeholder:text-text-muted"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isLogin && (
                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 cursor-pointer group select-none">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => handleRememberMeChange(e.target.checked)}
                            className="peer sr-only"
                          />
                          <div className="w-4 h-4 rounded border border-white/20 bg-surface-1/50 peer-checked:bg-primary peer-checked:border-primary transition-all duration-200 flex items-center justify-center group-hover:border-primary/50">
                            {rememberMe && (
                              <svg className="w-3 h-3 text-surface-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-text-secondary group-hover:text-text-primary transition-colors">
                          Maradj bejelentkezve
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => { setShowResetPassword(true); clearError(); }}
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        Elfelejtett jelszó?
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-surface-0 py-3 glow-primary"
                  >
                    {loading ? 'Betöltés...' : isLogin ? 'Belépés' : 'Fiók létrehozása'}
                  </Button>

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-surface-1 px-3 text-text-muted">vagy</span>
                    </div>
                  </div>

                  {/* Google Sign In */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full border-white/20 text-text-primary hover:bg-white/5 py-3"
                  >
                    <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Belépés Google fiókkal
                  </Button>

                  {!isLogin && (
                    <p className="text-xs text-text-muted text-center">
                      A regisztrációval elfogadod az{' '}
                      <a href="/terms" className="text-primary hover:text-primary/80">Általános Szerződési Feltételeket</a>
                      {' '}és az{' '}
                      <a href="/privacy" className="text-primary hover:text-primary/80">Adatkezelési Tájékoztatót</a>.
                    </p>
                  )}
                </form>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
