import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertCircle, ArrowRight, Mail, Eye, EyeOff } from 'lucide-react';
import { signIn, type AppProfile } from '@/lib/auth';
import loginBgAsset from '@/assets/login-bg.jpg';
import logo3dAsset from '@/assets/conaf-logo-3d.png';

const loginBg = loginBgAsset.src;
const logo3d = logo3dAsset.src;

interface Props {
  onLogin: (profile: AppProfile) => void;
}

export function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;
    setLoading(true);
    setError('');
    const { profile, error: err } = await signIn(email, password);
    if (profile) {
      onLogin(profile);
    } else {
      setError(err || 'No se pudo iniciar sesión');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <img src={loginBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-[#060a14]/85 backdrop-blur-sm" />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-emerald-400/20 rounded-full"
          initial={{ x: `${15 + i * 12}%`, y: `${25 + (i % 4) * 18}%`, opacity: 0 }}
          animate={{
            y: [`${25 + (i % 4) * 18}%`, `${15 + (i % 4) * 12}%`],
            opacity: [0, 0.5, 0],
          }}
          transition={{ duration: 5 + i * 0.5, repeat: Infinity, delay: i * 0.8 }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            className="relative inline-block mb-4"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="absolute inset-0 bg-emerald-500/15 rounded-full blur-3xl scale-[2]" />
            <img src={logo3d} alt="CONAFSync" className="relative w-24 h-24 drop-shadow-[0_0_30px_rgba(52,211,153,0.25)]" />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            CONAF<span className="text-gradient">Sync</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">DEFA CONAF — Los Ríos</p>
        </div>

        {/* Glass card */}
        <form onSubmit={handleSubmit} className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.07] rounded-2xl p-8 shadow-deep">
          <div className="flex items-center gap-2.5 mb-7">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/10">
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Iniciar sesión</p>
              <p className="text-[11px] text-slate-500">Ingresa con tu correo institucional</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                ref={emailRef}
                type="email"
                autoComplete="username"
                placeholder="correo@conaf.cl"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                disabled={loading}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none transition-all placeholder:text-slate-600 focus:border-emerald-500/40 focus:shadow-[0_0_20px_rgba(52,211,153,0.08)] disabled:opacity-50"
              />
            </div>
            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                disabled={loading}
                className={`w-full pl-11 pr-11 py-3.5 rounded-xl border-2 bg-white/[0.03] text-white text-sm outline-none transition-all placeholder:text-slate-600 focus:shadow-[0_0_20px_rgba(52,211,153,0.08)] disabled:opacity-50 ${error ? 'border-red-500/50 shake' : 'border-white/[0.08] focus:border-emerald-500/40'}`}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 text-red-400 text-[13px] mt-4"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-[0_8px_24px_-8px_rgba(16,185,129,0.6)] hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Entrar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-600 mt-6">
          Acceso restringido · DEFA CONAF Región de Los Ríos
        </p>
      </motion.div>

      <style>{`
        .shake { animation: shake 0.4s ease-in-out; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
