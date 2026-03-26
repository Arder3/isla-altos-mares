import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, ArrowLeft, History, Wand2, X, MessageSquare, Heart, HelpCircle, Info, Shield, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../core/supabaseClient';
import { getTranslation as t } from '../core/i18n';
import AltarSubChat from './AltarSubChat';
import { CESAR_ID, processUIMessage, AGENTS } from '../core/CesarOrchestrator';

export default function AltarEchoes({ lang, onBack, viewAsRole }) {
    const { user, profile } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [activeSubChatId, setActiveSubChatId] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [activeLabs, setActiveLabs] = useState([]);
    const [showLabsList, setShowLabsList] = useState(false);
    const chatEndRef = useRef(null);

    const effectiveRole = viewAsRole || profile?.rol || 'host';
    const isHost = effectiveRole === 'host';
    const isAlma = effectiveRole === 'kids';

    // ── Session Management: Daily Reset ──
    useEffect(() => {
        const initDailySession = async () => {
            const today = new Date().toISOString().split('T')[0];
            
            // 1. Fetch or Create Session (upsert on unique date)
            const { data: session, error: sessionErr } = await supabase
                .from('altar_chat_sessions')
                .upsert({ date: today, status: 'active' }, { onConflict: 'date', ignoreDuplicates: false })
                .select()
                .single();

            if (session) {
                setSessionId(session.id);
                // 2. Load Messages (v2)
                const { data: msgs } = await supabase
                    .from('altar_messages_v2')
                    .select('*')
                    .eq('session_id', session.id)
                    .order('created_at', { ascending: true });
                
                if (msgs) setMessages(msgs);

                // 3. Load active permissions
                const { data: perms } = await supabase
                    .from('altar_permissions')
                    .select('*')
                    .eq('session_id', session.id)
                    .gt('expires_at', new Date().toISOString());
                if (perms) setPermissions(perms);

                // 4. Load all active labs for supervision
                const { data: labs } = await supabase
                    .from('altar_sub_chats')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (labs) setActiveLabs(labs);
            }
        };
        initDailySession();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        // Create a session on-demand if not yet initialized (e.g. tables were just created)
        let activeSessionId = sessionId;
        if (!activeSessionId) {
            const today = new Date().toISOString().split('T')[0];
            const { data: newSession } = await supabase
                .from('altar_chat_sessions')
                .upsert({ date: today, status: 'active' }, { onConflict: 'date' })
                .select()
                .single();
            if (newSession) {
                activeSessionId = newSession.id;
                setSessionId(newSession.id);
            }
        }

        if (!activeSessionId) {
            // If still null, show inline error
            setMessages(prev => [...prev, { sender_role: 'system', content: '⚠️ No se pudo iniciar sesión. Verifica la base de datos.', created_at: new Date().toISOString() }]);
            return;
        }

        const userMsg = {
            session_id: activeSessionId,
            sender_id: user.id,
            sender_role: effectiveRole,
            content: input,
            message_type: 'text',
            metadata: { mentions: input.includes('@Cesar') ? ['cesar'] : [] }
        };

        setMessages(prev => [...prev, { ...userMsg, created_at: new Date().toISOString() }]);
        setInput('');
        setIsTyping(true);

        // Audit Log
        const { data: savedMsg } = await supabase.from('altar_messages_v2').insert(userMsg).select().single();

        // ── Orchestrator Logic ──
        const cesarResponse = await processUIMessage(userMsg, activeSessionId, effectiveRole);
        
        if (cesarResponse) {
            setTimeout(async () => {
                const altarMsg = {
                    session_id: sessionId,
                    sender_role: 'agent',
                    agent_persona: t(lang, 'tag_cesar'),
                    content: cesarResponse.response,
                    message_type: cesarResponse.action === 'LINK' ? 'link' : 'text',
                    metadata: cesarResponse.metadata || {}
                };
                setMessages(prev => [...prev, { ...altarMsg, created_at: new Date().toISOString() }]);
                setIsTyping(false);
                await supabase.from('altar_messages_v2').insert(altarMsg);

                // If permission was granted by Father, update the local state/DB
                if (cesarResponse.action === 'PERMISSION_GRANTED' && isHost) {
                   // This would actually be handled by a more complex parser, but for now:
                   const newPerm = {
                       session_id: sessionId,
                       granted_to_user_id: user.id, // Assuming Alma for now, would need real ID
                       skill_authorized: 'general',
                       expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
                   };
                   await supabase.from('altar_permissions').insert(newPerm);
                   setPermissions(prev => [...prev, newPerm]);
                }
            }, 1500);
        } else {
            setIsTyping(false);
        }
    };

    if (activeSubChatId) {
        return <AltarSubChat subChatId={activeSubChatId} lang={lang} onExit={() => setActiveSubChatId(null)} />;
    }

    return (
        <div className="fixed inset-0 z-40 bg-[#020617] text-slate-100 flex flex-col font-serif overflow-hidden">
            {/* Real Background Image */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/assets/altar_bg.png" 
                    alt="Altar de los Ecos" 
                    className="w-full h-full object-cover opacity-30 mix-blend-lighten"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617] opacity-80" />
            </div>

            {/* Header */}
            <header className="relative z-10 p-4 border-b border-indigo-900/40 bg-slate-950/60 backdrop-blur-xl flex justify-between items-center px-6">
                <button onClick={onBack} className="flex items-center gap-2 text-indigo-400 hover:text-white transition-colors group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] uppercase tracking-widest font-mono">Regresar</span>
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-black uppercase tracking-[0.3em] text-indigo-100">{t(lang, 'altar_2_title')}</h1>
                    <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-indigo-400/60 ">{t(lang, 'altar_2_sub')}</p>
                </div>
                <div className="flex gap-4">
                    {isHost && (
                        <button 
                            onClick={() => setShowLabsList(!showLabsList)}
                            className={`p-2 rounded-full border border-indigo-500/30 transition-all ${showLabsList ? 'bg-indigo-600 text-white' : 'text-indigo-300 hover:bg-indigo-500/20'}`}
                            title="Supervisión de Laboratorios"
                        >
                            <Users size={16} />
                        </button>
                    )}
                    <div className="flex -space-x-2">
                         <div className="w-8 h-8 rounded-full bg-rose-500 border border-slate-950 flex items-center justify-center text-[10px] font-bold shadow-lg" title="Alma">A</div>
                         <div className="w-8 h-8 rounded-full bg-indigo-500 border border-slate-950 flex items-center justify-center text-xs shadow-lg" title="César">🎩</div>
                         <div className="w-8 h-8 rounded-full bg-amber-500 border border-slate-950 flex items-center justify-center text-[10px] font-bold shadow-lg" title="Padre">P</div>
                    </div>
                </div>
            </header>

            {/* Permissions/Status Bar */}
            {isAlma && (
                <div className="relative z-10 bg-indigo-600/10 border-b border-indigo-500/10 p-2 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield size={12} className="text-indigo-400" />
                        <span className="text-[9px] font-mono text-indigo-300 uppercase tracking-widest">
                            {permissions.length > 0 ? t(lang, 'lab_active') : t(lang, 'waiting_blessing')}
                        </span>
                    </div>
                    <span className="text-[8px] font-mono text-indigo-400/60 uppercase">Sesión de {new Date().toLocaleDateString(lang)}</span>
                </div>
            )}

            {/* Labs Supervision Panel (Host Only) */}
            <AnimatePresence>
                {isHost && showLabsList && (
                    <motion.div 
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        className="absolute right-0 top-[73px] bottom-0 w-80 bg-slate-900/95 border-l border-indigo-900/40 backdrop-blur-2xl z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] p-6"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300 flex items-center gap-2">
                                <Users size={14} /> Laboratorios Activos
                            </h3>
                            <button onClick={() => setShowLabsList(false)}><X size={14} className="text-slate-500" /></button>
                        </div>
                        
                        <div className="space-y-4">
                            {activeLabs.length === 0 && (
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center mt-20">No hay labores activas</p>
                            )}
                            {activeLabs.map(lab => (
                                <div key={lab.id} className="p-4 rounded-xl bg-slate-800/40 border border-indigo-500/10 hover:border-indigo-500/40 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-2xl">{AGENTS[lab.agent_id]?.avatar || '✨'}</span>
                                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-mono ${lab.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/40 text-slate-400'}`}>
                                            {lab.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <h4 className="text-[11px] font-bold text-indigo-100">{AGENTS[lab.agent_id]?.name}</h4>
                                    <p className="text-[9px] text-slate-400 mt-1 line-clamp-2 italic">"{lab.task_goal}"</p>
                                    <button 
                                        onClick={() => { setActiveSubChatId(lab.id); setShowLabsList(false); }}
                                        className="mt-3 w-full py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border border-indigo-500/20"
                                    >
                                        Supervisar
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Area */}
            <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.map((m, idx) => (
                        <motion.div 
                            key={m.id || idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${m.sender_role === 'kids' ? 'justify-end' : (m.sender_role === 'host' ? 'justify-end' : 'justify-start')}`}
                        >
                            <div className={`max-w-[80%] md:max-w-lg p-5 rounded-2xl relative backdrop-blur-md shadow-xl ${
                                m.sender_role === 'kids' ? 'bg-rose-600/10 border border-rose-500/30 text-rose-50 ml-12 rounded-tr-none' :
                                m.sender_role === 'host' ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-50 ml-12 rounded-tr-none' :
                                'bg-slate-900/80 border border-slate-700/40 text-slate-100 mr-12 rounded-tl-none font-medium italic'
                            }`}>
                                
                                {/* Label for Sender */}
                                <span className={`absolute -top-5 ${m.sender_role === 'kids' || m.sender_role === 'host' ? 'right-0 text-right' : 'left-0 text-left'} text-[8px] font-mono uppercase tracking-[0.2em] opacity-60`}>
                                    {m.sender_role === 'agent' ? m.agent_persona : (m.sender_role === 'kids' ? t(lang, 'tag_alma') : t(lang, 'tag_father'))}
                                </span>

                                <p className="text-sm md:text-base leading-relaxed">
                                    {m.content.split(' ').map((word, i) => 
                                        word.startsWith('@') ? <strong key={i} className="text-indigo-400">{word} </strong> : word + ' '
                                    )}
                                </p>

                                {/* Invitation Card */}
                                {m.message_type === 'link' && (
                                    <div className="mt-4 p-4 bg-indigo-500/20 rounded-xl border border-indigo-500/40 flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                             <Wand2 className="text-amber-400" size={18} />
                                             <span className="text-xs font-bold font-mono uppercase tracking-widest">{t(lang, 'lab_invitation')}</span>
                                        </div>
                                        <button 
                                            onClick={() => setActiveSubChatId(m.metadata.sub_chat_id)}
                                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
                                        >
                                            {t(lang, 'lab_join')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-slate-900/60 border border-slate-700/40 p-3 rounded-xl flex gap-1 items-center">
                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </main>

            {/* Input Area */}
            <footer className="relative z-10 p-6 md:p-8 bg-slate-950/80 backdrop-blur-2xl border-t border-indigo-900/40">
                <div className="max-w-4xl mx-auto flex gap-4">
                    <input 
                        type="text" 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        placeholder={t(lang, 'placeholder_group')}
                        className="flex-1 bg-slate-900/80 border border-indigo-900/50 rounded-2xl px-6 py-4 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 shadow-inner"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 p-4 rounded-2xl text-white transition-all shadow-lg active:scale-95"
                    >
                        <Send size={20} />
                    </button>
                </div>
                <div className="max-w-4xl mx-auto mt-4 px-2 flex justify-between items-center text-[8px] font-mono uppercase tracking-[0.2em] text-indigo-400/60">
                    <span className="flex items-center gap-1">
                        <Info size={8} /> 
                        {isHost ? 'Modo: Moderador de la Isla' : 'Modo: Visión Compartida'}
                    </span>
                    <span>Reset diario: 00:00:00</span>
                </div>
            </footer>

            <style sx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.4); }
            `}</style>
        </div>
    );
}
