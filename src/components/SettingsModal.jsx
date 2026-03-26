import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTranslation as t } from '../core/i18n';

export default function SettingsModal({ lang, isOpen, onClose, forceReset = false }) {
    const { updateUserPassword } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        if (newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        setError('');
        const { error: updateErr } = await updateUserPassword(newPassword);
        setLoading(false);

        if (updateErr) {
            setError(updateErr.message);
        } else {
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setNewPassword('');
                setConfirmPassword('');
                onClose();
            }, 2000);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={forceReset ? null : onClose}
                        className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[130] w-full max-w-sm"
                    >
                        <div className="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-3xl overflow-hidden shadow-2xl p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--text-primary)] flex items-center gap-2">
                                        <Shield size={20} className="text-[var(--accent-primary)]" />
                                        {forceReset ? t(lang, 'reset_password') || 'Restablecer' : t(lang, 'change_password')}
                                    </h2>
                                    <p className="text-[var(--text-dim)] text-[10px] font-mono uppercase tracking-widest mt-1">
                                        {t(lang, 'security_settings') || 'Ajustes de Seguridad'}
                                    </p>
                                </div>
                                {!forceReset && (
                                    <button onClick={onClose} className="text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors">
                                        <X size={20} />
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[var(--text-dim)] text-[10px] font-mono uppercase tracking-widest mb-2">
                                        {t(lang, 'new_password')}
                                    </label>
                                    <div className="relative">
                                        <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                                        <input
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-10 py-3 text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[var(--text-dim)] text-[10px] font-mono uppercase tracking-widest mb-2">
                                        {t(lang, 'confirm_password') || 'Confirmar'}
                                    </label>
                                    <div className="relative">
                                        <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                                        <input
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-10 py-3 text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                                        />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2"
                                        >
                                            <AlertCircle size={14} className="text-red-400" />
                                            <p className="text-red-300 text-[10px]">{error}</p>
                                        </motion.div>
                                    )}
                                    {success && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2"
                                        >
                                            <CheckCircle2 size={14} className="text-emerald-400" />
                                            <p className="text-emerald-300 text-[10px]">{t(lang, 'password_updated')}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    type="submit"
                                    disabled={loading || success}
                                    className="w-full bg-[var(--accent-primary)] text-[var(--accent-invert)] font-black py-3 rounded-xl text-xs tracking-widest uppercase transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : t(lang, 'update_button')}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
