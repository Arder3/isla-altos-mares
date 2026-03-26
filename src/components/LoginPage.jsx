import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Anchor, Loader2, AlertCircle, Languages, Sun, Moon, Check } from 'lucide-react';
import { getTranslation as t } from '../core/i18n';

export default function LoginPage({ lang, setLang, themeOverride, setThemeOverride, isLightMode, onToggleTheme }) {
    const { signIn, resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resetSent, setResetSent] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            setError(t(lang, 'email_required') || 'Ingresa tu email primero');
            return;
        }
        setLoading(true);
        const { error: resetErr } = await resetPassword(email);
        setLoading(false);
        if (resetErr) {
            if (resetErr.status === 429) {
                setError(t(lang, 'rate_limit_warning'));
            } else {
                setError(resetErr.message);
            }
        } else {
            setResetSent(true);
            setError('');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
            {/* Ambient glows */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[180px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[180px] rounded-full pointer-events-none" />

            {/* Global Settings Toggle (Pre-login) */}
            <div className="absolute top-6 right-6 z-20 flex gap-2">
                <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
                    className="flex items-center gap-2 bg-[var(--bg-primary)]/40 backdrop-blur border border-[var(--border-primary)] hover:border-[var(--text-secondary)] px-4 py-2 rounded-full text-xs transition-all shadow-xl group">
                    <Languages size={14} className="text-[var(--text-dim)] group-hover:text-[var(--text-primary)] transition-colors" />
                    <span className="text-[var(--text-primary)] font-mono font-bold uppercase tracking-widest">{lang}</span>
                </button>
                <button onClick={() => onToggleTheme(isLightMode ? 'dark' : 'light')}
                    className="bg-[var(--bg-primary)]/40 backdrop-blur border border-[var(--border-primary)] hover:border-[var(--text-secondary)] p-2 rounded-full transition-all shadow-xl">
                    {isLightMode ? <Moon size={14} className="text-[var(--text-dim)]" /> : <Sun size={14} className="text-[var(--text-dim)]" />}
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-primary)] flex items-center justify-center"
                    >
                        <Anchor size={28} className="text-[var(--text-secondary)]" />
                    </motion.div>
                    <h1 className="text-3xl font-black tracking-tighter text-[var(--text-primary)] mb-2">
                        {t(lang, 'project_title')}
                    </h1>
                    <p className="text-[var(--text-dim)] text-xs font-mono uppercase tracking-widest">
                        {t(lang, 'portal_name')} — {t(lang, 'system_id')}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-[var(--surface-card)] border border-[var(--border-secondary)] backdrop-blur-xl rounded-3xl p-8">
                    <p className="text-[var(--text-secondary)] text-sm text-center mb-6">
                        {t(lang, 'login_prompt')}
                    </p>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        setLoading(true);
                        setError('');
                        signIn(email, password).then(({ error: authErr }) => {
                            setLoading(false);
                            if (authErr) setError(t(lang, 'error_creds'));
                        });
                    }} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-[var(--text-dim)] text-xs font-mono uppercase tracking-widest mb-2">
                                {t(lang, 'email_label')}
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                className="w-full bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--text-secondary)] transition-colors text-sm"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[var(--text-dim)] text-xs font-mono uppercase tracking-widest">
                                    {t(lang, 'password_label')}
                                </label>
                                <button 
                                    type="button"
                                    onClick={handleResetPassword}
                                    className="text-[var(--text-secondary)] text-[10px] font-mono uppercase tracking-widest hover:underline"
                                >
                                    {t(lang, 'forgot_password')}
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    required={!resetSent}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-xl px-4 py-3 pr-12 text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--text-secondary)] transition-colors text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors"
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                                >
                                    <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                                    <p className="text-red-300 text-[10px] leading-tight">{error}</p>
                                </motion.div>
                            )}
                            {resetSent && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3"
                                >
                                    <Check size={14} className="text-emerald-400 flex-shrink-0" />
                                    <p className="text-emerald-300 text-[10px] leading-tight">{t(lang, 'reset_sent')}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                            className="w-full bg-[var(--accent-primary)] text-[var(--accent-invert)] font-black py-3 rounded-xl text-sm tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    {t(lang, 'verifying')}
                                </>
                            ) : t(lang, 'login_button')}
                        </motion.button>
                    </form>
                </div>

                <p className="text-center text-[var(--text-dim)] text-[10px] font-mono uppercase tracking-widest mt-6">
                    {t(lang, 'invitation_only')}
                </p>
            </motion.div>
        </div>
    );
}
