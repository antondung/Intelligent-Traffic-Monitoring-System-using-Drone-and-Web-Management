import { useState, FormEvent } from 'react';
import vi from '../i18n/vi';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hexagon, Mail, Lock, Eye, EyeOff, Loader2, User } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-surface-0 flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0">
        <div className="absolute top-1/3 right-1/3 w-[500px] h-[500px] rounded-full bg-purple-500/[0.04] blur-[100px]" />
        <div className="absolute bottom-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-[100px]" />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-card p-8 border border-white/[0.08] shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="relative inline-flex h-12 w-12 items-center justify-center mb-3">
              <Hexagon className="h-12 w-12 text-purple-400" strokeWidth={1} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-purple-400 shadow-[0_0_16px_rgba(168,85,247,0.6)]" />
              </div>
            </div>
            <h1 className="text-xl font-bold tracking-wider text-white">{vi.register.title.toUpperCase()}</h1>
            <p className="text-xs text-slate-500 mt-1">{vi.register.subtitle}</p>
            <div className="h-px bg-gradient-to-r from-transparent via-purple-400/20 to-transparent mt-4" />
          </div>

          <div className="mb-5">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-purple-400">Đăng ký Mới</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Name */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={vi.register.fullNamePlaceholder}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-400/40 focus:shadow-[0_0_15px_rgba(168,85,247,0.1)] transition-all"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={vi.register.emailPlaceholder}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-400/40 focus:shadow-[0_0_15px_rgba(168,85,247,0.1)] transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={vi.register.passwordPlaceholder}
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-400/40 focus:shadow-[0_0_15px_rgba(168,85,247,0.1)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={vi.register.confirmPasswordPlaceholder}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-400/40 focus:shadow-[0_0_15px_rgba(168,85,247,0.1)] transition-all"
              />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-400">{error}</motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-semibold text-sm tracking-wider transition-all hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {vi.register.creating}
                </>
              ) : (
                vi.register.createAccount.toUpperCase()
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] font-mono text-slate-600">HOẶC</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              ← {vi.register.hasAccount} {vi.register.signIn}
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-[10px] font-mono text-slate-600">
            SENTINEL v2.4.0 &nbsp;|&nbsp; Kết nối Mã hoá &nbsp;|&nbsp; AES-256
          </p>
        </div>
      </motion.div>
    </div>
  );
}
