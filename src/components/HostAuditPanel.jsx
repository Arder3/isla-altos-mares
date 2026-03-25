import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Users, Shield, Eye, MessageSquare, Heart, 
  Sparkles, ChevronRight, Clock, CheckCircle, XCircle,
  Activity, Search, X
} from 'lucide-react';
import { supabase } from '../core/supabaseClient';
import { useAuth } from '../context/AuthContext';

const ROL_COLOR = {
  host:       'bg-white text-black',
  vip:        'bg-amber-400 text-black',
  confidente: 'bg-sky-400 text-black',
  equipo:     'bg-violet-500 text-white',
  guest:      'bg-emerald-500 text-white',
  kids:       'bg-rose-400 text-white',
  educadores: 'bg-sky-300 text-black',
};

const ROL_ICON = {
  host: '👑', vip: '💎', confidente: '🤝', equipo: '⚙️',
  guest: '🎬', kids: '✨', educadores: '📚'
};

const ESTADO_BADGE = {
  activo:    { label: 'Activo',    color: 'text-emerald-400', icon: CheckCircle },
  pendiente: { label: 'Pendiente', color: 'text-amber-400',   icon: Clock },
  bloqueado: { label: 'Bloqueado', color: 'text-red-400',     icon: XCircle },
  vencido:   { label: 'Vencido',   color: 'text-zinc-500',    icon: XCircle },
};

export default function HostAuditPanel({ onBack, onImpersonate }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [activity, setActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('altar');

  // ── Load all profiles (Host only, policy allows it) ──────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setUsers(data || []);
      setLoading(false);
    };
    load();
  }, []);

  // ── Load activity for selected user ──────────────────────────────
  const loadActivity = useCallback(async (targetUser) => {
    setActivityLoading(true);
    setActivity(null);
    setActiveTab('altar');

    const [draftsRes, ecoRes, feedbackRes, notifRes] = await Promise.all([
      supabase
        .from('character_drafts')
        .select('*, altar_conversations(*)')
        .eq('user_id', targetUser.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('alma_ecos')
        .select('*')
        .eq('user_id', targetUser.id)
        .order('timestamp', { ascending: false }),
      supabase
        .from('portal_feedback')
        .select('*')
        .eq('user_id', targetUser.id)
        .order('timestamp', { ascending: false }),
      supabase
        .from('portal_notifications')
        .select('*')
        .eq('sender_user_id', targetUser.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    setActivity({
      drafts:   draftsRes.data  || [],
      ecos:     ecoRes.data     || [],
      feedback: feedbackRes.data || [],
      notifs:   notifRes.data   || [],
    });
    setActivityLoading(false);
  }, []);

  const handleSelect = (u) => {
    setSelected(u);
    loadActivity(u);
  };

  const filtered = users.filter(u =>
    u.nombre_display?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.rol?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Shared panel header ───────────────────────────────────────────
  const Header = () => (
    <div className="flex items-center gap-4 mb-10">
      <button
        onClick={selected ? () => setSelected(null) : onBack}
        className="flex items-center gap-2 text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors text-xs font-mono uppercase tracking-widest group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        {selected ? 'Todos los Usuarios' : 'Portal'}
      </button>
      <div className="h-px flex-1 bg-[var(--border-primary)]" />
      <div className="flex items-center gap-2 text-[var(--text-dim)]">
        <Shield size={14} />
        <span className="font-mono text-[10px] uppercase tracking-widest">Consola del Padre</span>
      </div>
    </div>
  );
  
  // ── User list view ────────────────────────────────────────────────
  if (!selected) return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="p-8 md:p-12 max-w-5xl mx-auto pt-8"
    >
      <Header />
      
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Usuarios Registrados</h1>
          <p className="text-[var(--text-dim)] font-mono text-xs mt-1 uppercase tracking-widest">
            {users.length} perfil{users.length !== 1 ? 'es' : ''} en el sistema
          </p>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-xl pl-8 pr-4 py-2 text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-indigo-500 transition-colors w-48"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-[var(--text-dim)]">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <Activity size={24} />
          </motion.div>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(u => {
            const estado = ESTADO_BADGE[u.estado] || ESTADO_BADGE.activo;
            const EstadoIcon = estado.icon;
            return (
              <motion.button
                key={u.id}
                onClick={() => handleSelect(u)}
                whileHover={{ x: 4 }}
                className="w-full flex items-center gap-5 bg-[var(--surface-card)] border border-[var(--border-primary)] hover:border-indigo-500/60 rounded-2xl p-4 text-left transition-all group"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center text-2xl flex-shrink-0">
                  {ROL_ICON[u.rol] || '👤'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-[var(--text-primary)] text-sm truncate">
                      {u.nombre_display || 'Sin nombre'}
                    </span>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${ROL_COLOR[u.rol] || 'bg-zinc-700 text-white'}`}>
                      {u.rol}
                    </span>
                  </div>
                  <span className="text-[var(--text-dim)] text-xs truncate block">{u.email}</span>
                </div>

                {/* Estado */}
                <div className={`flex items-center gap-1.5 ${estado.color} flex-shrink-0`}>
                  <EstadoIcon size={12} />
                  <span className="font-mono text-[10px] uppercase tracking-widest hidden sm:block">
                    {estado.label}
                  </span>
                </div>

                {/* Arrow */}
                <ChevronRight size={16} className="text-[var(--text-dim)] group-hover:text-indigo-400 transition-colors flex-shrink-0" />
              </motion.button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[var(--text-dim)] font-mono text-xs">
              No se encontraron usuarios
            </div>
          )}
        </div>
      )}
    </motion.div>
  );

  // ── User detail view ──────────────────────────────────────────────
  const estado = ESTADO_BADGE[selected.estado] || ESTADO_BADGE.activo;
  const EstadoIcon = estado.icon;

  const TABS = [
    { id: 'altar',    label: 'Altar',    icon: Sparkles,      count: activity?.drafts?.length },
    { id: 'ecos',     label: 'Ecos',     icon: Heart,         count: activity?.ecos?.length },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, count: activity?.feedback?.length },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="p-8 md:p-12 max-w-5xl mx-auto pt-8"
    >
      <Header />

      {/* Profile card */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-3xl p-6 mb-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-[var(--bg-primary)] border border-[var(--border-secondary)] flex items-center justify-center text-5xl">
          {ROL_ICON[selected.rol] || '👤'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-black uppercase tracking-tighter">
              {selected.nombre_display || 'Sin nombre'}
            </h2>
            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${ROL_COLOR[selected.rol] || 'bg-zinc-700 text-white'}`}>
              {selected.rol}
            </span>
          </div>
          <p className="text-[var(--text-dim)] text-xs">{selected.email}</p>
          <div className={`flex items-center gap-1.5 mt-2 ${estado.color}`}>
            <EstadoIcon size={11} />
            <span className="font-mono text-[10px] uppercase tracking-widest">{estado.label}</span>
          </div>
        </div>
        <button
          onClick={() => onImpersonate(selected)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-colors"
        >
          <Eye size={14} />
          Preview as {selected.nombre_display?.split(' ')[0] || 'User'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-[var(--border-primary)]">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-[var(--text-dim)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon size={12} />
              {tab.label}
              {tab.count != null && (
                <span className="bg-[var(--bg-primary)] text-[var(--text-dim)] px-1.5 py-0.5 rounded-full text-[8px]">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activityLoading ? (
        <div className="flex items-center justify-center h-48 text-[var(--text-dim)]">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <Activity size={24} />
          </motion.div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* ── ALTAR TAB ── */}
          {activeTab === 'altar' && (
            <motion.div key="altar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {activity?.drafts?.length === 0 ? (
                <EmptyState label="Ningún personaje creado aún" />
              ) : (
                activity?.drafts?.map(draft => (
                  <div key={draft.id} className="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-2xl p-5 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-[var(--text-primary)] text-sm">
                        {draft.nombre_provisorio || 'Personaje sin nombre'}
                      </span>
                      <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                        draft.status === 'materializado' ? 'border-emerald-500/50 text-emerald-400' :
                        draft.status === 'descartado' ? 'border-red-500/50 text-red-400' :
                        'border-indigo-500/50 text-indigo-400'
                      }`}>
                        {draft.status}
                      </span>
                    </div>
                    {/* Conversation thread */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(draft.altar_conversations || []).map(msg => (
                        <div key={msg.id} className={`text-xs px-3 py-2 rounded-lg ${
                          msg.sender === 'alma'
                            ? 'bg-indigo-500/10 text-[var(--text-primary)] ml-8'
                            : 'bg-[var(--bg-primary)] text-[var(--text-dim)] mr-8'
                        }`}>
                          <span className={`font-mono text-[8px] uppercase tracking-widest block mb-0.5 ${
                            msg.sender === 'alma' ? 'text-indigo-400' : 'text-[var(--text-dim)]'
                          }`}>{msg.sender === 'alma' ? selected.nombre_display?.split(' ')[0] || 'Usuario' : 'Altar'}</span>
                          {msg.content}
                        </div>
                      ))}
                      {(draft.altar_conversations || []).length === 0 && (
                        <p className="text-[var(--text-dim)] text-xs italic">Sin mensajes registrados</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* ── ECOS TAB ── */}
          {activeTab === 'ecos' && (
            <motion.div key="ecos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {activity?.ecos?.length === 0 ? (
                <EmptyState label="Ningún eco registrado" />
              ) : (
                <div className="grid gap-3">
                  {activity?.ecos?.map(eco => (
                    <div key={eco.id} className="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <Heart size={14} className="text-rose-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[var(--text-dim)] text-[10px] font-mono uppercase tracking-widest mb-1">
                            {eco.categoria || 'diversos'}
                          </p>
                          <p className="text-xs text-[var(--text-dim)] mb-1">❓ {eco.pregunta}</p>
                          <p className="text-xs text-[var(--text-primary)] font-medium">💬 {eco.respuesta}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── FEEDBACK TAB ── */}
          {activeTab === 'feedback' && (
            <motion.div key="feedback" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {activity?.feedback?.length === 0 ? (
                <EmptyState label="Ningún feedback enviado" />
              ) : (
                <div className="grid gap-3">
                  {activity?.feedback?.map(fb => (
                    <div key={fb.id} className="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={12} className="text-indigo-400" />
                        <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--text-dim)]">{fb.path}</span>
                        <span className="ml-auto font-mono text-[8px] text-[var(--text-dim)]">
                          {new Date(fb.timestamp).toLocaleDateString('es')}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-primary)]">{fb.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="text-center py-16 text-[var(--text-dim)] font-mono text-xs tracking-widest uppercase">
      <Activity size={24} className="mx-auto mb-3 opacity-30" />
      {label}
    </div>
  );
}
