import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, Wand2, CheckCircle, Info } from 'lucide-react';
import { supabase } from '../core/supabaseClient';
import { getTranslation as t } from '../core/i18n';
import { AGENTS } from '../core/CesarOrchestrator';
import { useAuth } from '../context/AuthContext';

export default function AltarSubChat({ subChatId, lang, onExit }) {
    const { user, profile } = useAuth();
    const [subChat, setSubChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        const fetchSubChat = async () => {
            const { data, error } = await supabase
                .from('altar_sub_chats')
                .select('*')
                .eq('id', subChatId)
                .single();
            if (data) {
                setSubChat(data);
                // Load messages for this sub-chat
                const { data: msgs } = await supabase
                    .from('altar_messages_v2')
                    .select('*')
                    .eq('sub_chat_id', subChatId)
                    .order('created_at', { ascending: true });
                if (msgs) setMessages(msgs);
            }
        };
        fetchSubChat();
    }, [subChatId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!subChat) return <div className="flex-1 flex items-center justify-center bg-slate-950 text-indigo-300 font-mono text-xs uppercase tracking-widest">Invocando el Lab...</div>;

    const isHost = profile?.rol === 'host';
    const agent = AGENTS[subChat.agent_id];

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const senderRole = isHost ? 'host' : 'kids';
        const userMsg = {
            sub_chat_id: subChatId,
            sender_role: senderRole,
            content: input,
            message_type: 'text'
        };

        setMessages(prev => [...prev, { ...userMsg, created_at: new Date().toISOString() }]);
        setInput('');
        if (!isHost) setIsTyping(true); // Agent only responds to Alma in this mock logic

        // Log to database
        await supabase.from('altar_messages_v2').insert([userMsg]);

        // Mock Agent response logic (only if Alma sends)
        if (!isHost) {
            setTimeout(async () => {
                const response = {
                    sub_chat_id: subChatId,
                    sender_role: 'agent',
                    agent_persona: agent.name,
                    content: `¡Vaya visión, Alma! Como ${agent.name}, entiendo perfectamente que buscas "${input}". Déjame tejer los primeros hilos para ti...`,
                    message_type: 'text'
                };
                setMessages(prev => [...prev, { ...response, created_at: new Date().toISOString() }]);
                setIsTyping(false);
                await supabase.from('altar_messages_v2').insert([response]);
            }, 1500);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#050b1a] text-slate-100 flex flex-col font-serif">
            {/* Background */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-purple-900/20" />
                 <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-indigo-500/10" />
            </div>

            {/* Header */}
            <header className="relative z-10 p-4 border-b border-indigo-500/20 bg-slate-950/60 backdrop-blur-md flex justify-between items-center">
                <button onClick={onExit} className="flex items-center gap-2 text-indigo-400 hover:text-white transition-colors">
                    <ArrowLeft size={18} />
                    <span className="text-[10px] uppercase tracking-widest font-mono">Cerrar Laboratorio</span>
                </button>
                <div className="text-center">
                    <h2 className="text-lg font-bold text-indigo-200">{agent.name}</h2>
                    <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-indigo-400/60">{subChat.skill_name} · Lab Activo</p>
                </div>
                <div className="w-24 text-right">
                    <span className="text-2xl">{agent.avatar}</span>
                </div>
            </header>

            {/* Goal Banner */}
            <div className="relative z-10 bg-indigo-600/10 border-b border-indigo-500/10 p-3 px-6 flex items-center gap-3">
                <Info size={14} className="text-indigo-400" />
                <p className="text-[10px] font-mono text-indigo-300/80 uppercase tracking-wider">
                    {t(lang, 'lab_goal', { goal: subChat.task_goal })}
                </p>
            </div>

            {/* Chat Area */}
            <main className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.map((m, idx) => (
                        <motion.div 
                            key={m.id || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${m.sender_role === 'kids' || m.sender_role === 'host' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] p-4 rounded-2xl relative shadow-lg ${
                                m.sender_role === 'kids' ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-50 rounded-tr-none' :
                                m.sender_role === 'host' ? 'bg-amber-600/20 border border-amber-500/30 text-amber-50 rounded-tr-none' :
                                'bg-slate-900/80 border border-slate-700/30 text-slate-200 rounded-tl-none italic'
                            }`}>
                                
                                <span className="absolute -top-5 left-0 text-[8px] font-mono uppercase tracking-widest text-indigo-400/60">
                                    {m.sender_role === 'kids' ? t(lang, 'tag_alma') : (m.sender_role === 'host' ? t(lang, 'tag_father') : m.agent_persona)}
                                </span>

                                <p className="text-sm md:text-base leading-relaxed">{m.content}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-slate-900/40 p-3 rounded-xl flex gap-1">
                             <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-indigo-400 rounded-full" />
                             <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-indigo-400 rounded-full" />
                             <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-indigo-400 rounded-full" />
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </main>

            {/* Input */}
            <footer className="relative z-10 p-4 bg-slate-950/80 backdrop-blur-xl border-t border-indigo-500/10">
                <div className="max-w-3xl mx-auto flex gap-3">
                    <input 
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        placeholder={`Habla con ${agent.name}...`}
                        className="flex-1 bg-slate-900/60 border border-indigo-500/20 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-indigo-400 transition-colors"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="bg-indigo-600 hover:bg-indigo-500 p-3 rounded-xl text-white transition-all disabled:opacity-50"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </footer>
        </div>
    );
}
