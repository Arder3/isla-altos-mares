import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Anchor, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
            {/* Ambient glows */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[180px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[180px] rounded-full pointer-events-none" />

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
                        Isla de Altos Mares
                    </h1>
                    <p className="text-[var(--text-dim)] text-xs font-mono uppercase tracking-widest">
                        Portal de Acceso — Sistema 04.02
                    </p>
                </div>

                {/* Card */}
                <div className="bg-[var(--surface-card)] border border-[var(--border-secondary)] backdrop-blur-xl rounded-3xl p-8">
                    <p className="text-[var(--text-secondary)] text-sm text-center mb-6">
                        Ingresa con tus credenciales de acceso
                    </p>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        setLoading(true);
                        setError('');
                        signIn(email, password).then(({ error }) => {
                            setLoading(false);
                            if (error) setError('Credenciales incorrectas. Verifica tu email y contraseña.');
                        });
                    }} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-[var(--text-dim)] text-xs font-mono uppercase tracking-widest mb-2">
                                Email
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
                            <label className="block text-[var(--text-dim)] text-xs font-mono uppercase tracking-widest mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    required
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
                                    <p className="text-red-300 text-xs">{error}</p>
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
                                    Verificando...
                                </>
                            ) : 'Ingresar'}
                        </motion.button>
                    </form>
                </div>

                <p className="text-center text-[var(--text-dim)] text-[10px] font-mono uppercase tracking-widest mt-6">
                    Acceso por invitación únicamente
                </p>
            </motion.div>
        </div>
    );
}
