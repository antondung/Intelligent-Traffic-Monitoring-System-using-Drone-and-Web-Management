import { useState, FormEvent } from 'react';
import vi from '../i18n/vi';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hexagon, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store';

/* ─── floating particle ─── */
function Particle({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-cyan-400/20"
      style={{ width: 3, height: 3, left: `${x}%`, top: `${y}%` }}
      animate={{
        y: [0, -30, 10, -20, 0],
        x: [0, 15, -10, 5, 0],
        opacity: [0.2, 0.6, 0.3, 0.5, 0.2],
      }}
      transition={{
        duration: 8 + Math.random() * 4,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    />
  );
}

const particles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 3,
}));

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    login(email, password);
    navigate('/');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-surface-0 flex items-center justify-center">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.04] blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/[0.04] blur-[100px]" />
      </div>

      {/* Particles */}
      {particles.map((p) => (
        <Particle key={p.id} x={p.x} y={p.y} delay={p.delay} />
      ))}

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-card p-8 border border-white/[0.08] shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="relative inline-flex h-14 w-14 items-center justify-center mb-4">
              <Hexagon className="h-14 w-14 text-cyan-400" strokeWidth={1} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(0,212,255,0.6)]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-wider text-white">SENTINEL</h1>
            <p className="text-sm text-slate-500 mt-1">{vi.login.subtitle}</p>
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent mt-4" />
          </div>

          {/* Terminal header */}
          <div className="mb-6">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-400">{vi.login.title}</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={vi.login.emailPlaceholder}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/40 focus:shadow-[0_0_15px_rgba(0,212,255,0.1)] transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={vi.login.passwordPlaceholder}
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/40 focus:shadow-[0_0_15px_rgba(0,212,255,0.1)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400"
              >
                {error}
              </motion.p>
            )}

            {/* Remember */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <div
                className={`h-4 w-4 rounded border transition-all flex items-center justify-center ${
                  remember ? 'bg-cyan-400/20 border-cyan-400/50' : 'border-white/10 bg-white/[0.03]'
                }`}
                onClick={() => setRemember(!remember)}
              >
                {remember && <div className="h-1.5 w-1.5 rounded-sm bg-cyan-400" />}
              </div>
              <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                {vi.login.rememberMe}
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-sm tracking-wider transition-all hover:shadow-[0_0_25px_rgba(0,212,255,0.3)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {vi.login.signingIn}
                </>
              ) : (
                vi.login.signIn.toUpperCase()
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] font-mono text-slate-600">HOẶC</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Register link */}
          <div className="text-center">
            <button
              onClick={() => navigate('/register')}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              {vi.login.createAccount} →
            </button>
          </div>
        </div>

        {/* System info */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-[10px] font-mono text-slate-600">
            SENTINEL v2.4.0 &nbsp;|&nbsp; Kết nối Mã hoá &nbsp;|&nbsp; AES-256
          </p>
          <p className="text-[10px] font-mono text-slate-700">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
