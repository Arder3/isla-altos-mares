import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import CharacterView from './components/CharacterView';
import { motion, AnimatePresence } from 'framer-motion';
import { MODULE_REGISTRY, PROFILE_REGISTRY } from './core/registry';
import { resolveAssetUrl } from './core/AssetResolver';
import posthog from './core/analytics';
import { Eye, LogOut, ArrowLeft } from 'lucide-react';

// ── Role → Profile key ──
const ROLE_TO_PROFILE = {
  host: 'equipo', equipo: 'equipo', confidente: 'equipo',
  vip: 'investor', guest: 'producer', kids: 'child',
  educadores: 'producer'
};

const VIEW_AS_ROLES = [
  { id: 'host', profileKey: 'equipo', label: 'Host', color: 'bg-white', bannerColor: null },
  { id: 'equipo', profileKey: 'equipo', label: 'Equipo', color: 'bg-violet-500', bannerColor: '#8B5CF6' },
  { id: 'vip', profileKey: 'investor', label: 'VIP', color: 'bg-amber-400', bannerColor: '#FBBF24' },
  { id: 'confidente', profileKey: 'equipo', label: 'Confidente', color: 'bg-sky-500', bannerColor: '#0EA5E9' },
  { id: 'guest', profileKey: 'producer', label: 'Guest', color: 'bg-emerald-500', bannerColor: '#10B981' },
  { id: 'kids', profileKey: 'child', label: 'Kids', color: 'bg-rose-400', bannerColor: '#FB7185' },
  { id: 'educadores', profileKey: 'producer', label: 'Educador', color: 'bg-sky-400', bannerColor: '#38BDF8' },
];

// ── 6 Module Sections ──
const SECTIONS = [
  { id: 'world', label: 'Creación del Mundo', sublabel: 'Génesis · Historia · Mitología', emoji: '🌊', gradient: 'from-blue-950 via-indigo-900 to-blue-900', status: 'coming_soon' },
  { id: 'characters', label: 'Personajes', sublabel: 'Principales · Secundarios · NPC', emoji: '👥', gradient: 'from-stone-900 via-neutral-800 to-stone-900', status: 'active' },
  { id: 'creatures', label: 'Criaturas', sublabel: 'Bestiario · Fauna · Especies', emoji: '🦎', gradient: 'from-emerald-950 via-green-900 to-teal-900', status: 'coming_soon' },
  { id: 'map', label: 'Mapa & Biomas', sublabel: 'Territorios · Locaciones · Rutas', emoji: '🗺️', gradient: 'from-amber-950 via-yellow-900 to-orange-900', status: 'coming_soon' },
  { id: 'artifacts', label: 'Artefactos', sublabel: 'Objetos · Reliquias · Tecnología', emoji: '⚙️', gradient: 'from-violet-950 via-purple-900 to-fuchsia-900', status: 'coming_soon' },
  { id: 'mysteries', label: 'Misterios', sublabel: 'Enigmas · Secretos · Revelaciones', emoji: '🔮', gradient: 'from-rose-950 via-pink-900 to-red-900', status: 'coming_soon' },
];

// ── Progress bars — used on ALL character card types ──
function ProgressBars({ progress, dimmed }) {
  if (!progress) return null;
  const bars = [
    { label: 'Narrativa', value: progress.narrativa ?? 0 },
    { label: 'Arte', value: progress.arte ?? 0 },
    { label: 'HD', value: progress.hd ?? 0 },
  ];
  const labelCls = dimmed ? 'text-[var(--text-dim)]' : 'text-[var(--text-secondary)]';
  const numCls = dimmed ? 'opacity-30' : 'opacity-60';
  const fillCls = dimmed ? 'bg-[var(--text-dim)]' : 'bg-[var(--text-secondary)]';
  return (
    <div className="flex gap-4 mt-3">
      {bars.map(b => (
        <div key={b.label}>
          <p className={`font-mono text-[8px] uppercase tracking-widest mb-1 ${labelCls}`}>{b.label}</p>
          <div className="w-16 h-[2px] bg-[var(--border-primary)] rounded-full overflow-hidden">
            {b.value > 0 && <div className={`h-full rounded-full ${fillCls}`} style={{ width: `${b.value}%` }} />}
          </div>
          <p className={`font-mono text-[8px] mt-0.5 ${numCls}`}>{b.value}%</p>
        </div>
      ))}
    </div>
  );
}

// ── Floating Host Chrome ──
function HostChrome({ viewAsId, setViewAsId, setViewAsProfileKey, signOut }) {
  const [open, setOpen] = useState(false);
  const active = VIEW_AS_ROLES.find(r => r.id === viewAsId) || VIEW_AS_ROLES[0];
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <div className="relative">
        <button onClick={() => setOpen(!open)}
          className="flex items-center gap-2 bg-black/60 backdrop-blur border border-white/10 hover:border-white/25 px-3 py-1.5 rounded-full text-xs transition-all">
          <Eye size={11} className="text-white/40" />
          <span className="text-white/40 font-mono uppercase tracking-widest">Ver como:</span>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active.color}`} />
          <span className="text-white font-bold uppercase tracking-wider text-[10px]">{active.label}</span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }} transition={{ duration: 0.12 }}
              className="absolute right-0 top-10 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl min-w-[160px]">
              {VIEW_AS_ROLES.map(role => (
                <button key={role.id}
                  onClick={() => { setViewAsId(role.id); setViewAsProfileKey(role.profileKey); setOpen(false); posthog.capture('host_view_as', { role: role.id }); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors ${role.id === viewAsId ? 'bg-white/8' : ''}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${role.color}`} />
                  <span className="text-white/80 text-[10px] font-mono uppercase tracking-widest">{role.label}</span>
                  {role.id === (viewAsId || 'host') && <span className="ml-auto text-white/30 text-[10px]">✓</span>}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <button onClick={() => { posthog.capture('sign_out'); signOut(); }}
        className="bg-black/60 backdrop-blur border border-white/10 hover:border-white/25 p-1.5 rounded-full transition-all" title="Cerrar sesión">
        <LogOut size={13} className="text-white/50" />
      </button>
    </div>
  );
}

// ── Portal ──
function Portal() {
  const { user, profile, loading, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState(null);
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [filterType, setFilterType] = useState('Todos');
  const [filterMorality, setFilterMorality] = useState('Todos');
  const [viewAsId, setViewAsId] = useState(null);
  const [viewAsProfileKey, setViewAsProfileKey] = useState(null);

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center transition-colors duration-500">
      <div className="w-8 h-8 border-2 border-[var(--border-primary)] border-t-[var(--text-primary)] rounded-full animate-spin" />
    </div>
  );

  if (!user) return <LoginPage />;

  const isHost = profile?.rol === 'host';
  const realProfileKey = profile?.rol ? ROLE_TO_PROFILE[profile.rol] || 'producer' : 'producer';
  const activeProfileKey = isHost && viewAsProfileKey ? viewAsProfileKey : realProfileKey;
  const activeViewId = viewAsId || 'host';
  const activeRole = VIEW_AS_ROLES.find(r => r.id === activeViewId);
  const stripeColor = activeRole?.bannerColor || null;
  const isLightMode = activeViewId === 'kids' || activeViewId === 'educadores';

  const isCharAccessible = (char) => {
    const p = PROFILE_REGISTRY[activeProfileKey];
    if (!p) return true;
    return p.access.some(id => char.id === id || char.id.startsWith(id) || id.startsWith(char.id));
  };

  const goHome = () => { setActiveSection(null); setSelectedCharId(null); setFilterType('Todos'); setFilterMorality('Todos'); };

  const TYPE_FILTERS = ['Todos', 'Principal', 'Secundario', 'NPC'];
  const MORALITY_FILTERS = ['Todos', 'Positivo', 'Negativo', 'Neutral'];

  const FilterStrip = ({ label, options, active, onChange }) => (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-[var(--text-dim)] font-mono text-[9px] uppercase tracking-widest w-20 flex-shrink-0">{label}</span>
      <div className="flex gap-2 flex-wrap">
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)}
            className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all ${active === opt
              ? 'bg-[var(--accent-primary)] text-[var(--accent-invert)]'
              : 'bg-[var(--surface-card)] hover:bg-[var(--border-primary)] border border-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  const filteredChars = Object.values(MODULE_REGISTRY).filter(char => {
    const typeMatch = filterType === 'Todos' || char.type === filterType;
    const moralMatch = filterMorality === 'Todos' || char.morality === filterMorality.toLowerCase();
    return typeMatch && moralMatch;
  });

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isLightMode ? 'theme-light bg-white' : 'bg-[#050505]'} text-white`}>

      {/* ── Role stripe ── */}
      <AnimatePresence>
        {stripeColor && (
          <motion.div key={activeViewId}
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{ backgroundColor: stripeColor, transformOrigin: 'left' }}
            className="fixed top-0 left-0 right-0 z-50 h-[3px]"
          />
        )}
      </AnimatePresence>

      {/* ── Host chrome ── */}
      {isHost && <HostChrome viewAsId={activeViewId} setViewAsId={setViewAsId} setViewAsProfileKey={setViewAsProfileKey} signOut={signOut} />}

      {/* ── Content ── */}
      <AnimatePresence mode="wait">

        {/* CHARACTER DETAIL */}
        {selectedCharId ? (
          <motion.div key="char-view" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.3 }}>
            <CharacterView charId={selectedCharId} activeProfile={activeProfileKey} roleLabel={activeRole?.label} onBack={() => setSelectedCharId(null)} />
          </motion.div>

          /* PERSONAJES SECTION */
        ) : activeSection === 'characters' ? (
          <motion.div key="characters-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-12">

            <div className="max-w-7xl mx-auto mb-12">
              <button onClick={goHome}
                className="flex items-center gap-2 text-white/30 hover:text-white transition-colors mb-8 group text-xs font-mono uppercase tracking-widest">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Portal
              </button>
              <h1 className="text-5xl font-black uppercase tracking-tighter">Personajes</h1>
              <p className="text-white/30 font-mono text-xs mt-1 uppercase tracking-widest">Principales · Secundarios · NPC</p>
            </div>

            {/* Filter strips */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col gap-3">
              <FilterStrip label="Importancia" options={TYPE_FILTERS} active={filterType} onChange={setFilterType} />
              <FilterStrip label="Moralidad" options={MORALITY_FILTERS} active={filterMorality} onChange={setFilterMorality} />
            </div>

            {/* Character grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
              {filteredChars.map((char) => {
                const isComingSoon = char.status === 'coming_soon';
                const accessible = !isComingSoon && isCharAccessible(char);
                const conceptUrl = !isComingSoon && char.assets?.concept
                  ? resolveAssetUrl(char.assets.concept, char.name, 'SD')
                  : null;

                /* ── COMING SOON ── */
                if (isComingSoon) return (
                  <motion.div key={char.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="relative h-72 rounded-3xl overflow-hidden border border-white/[0.04] cursor-default">
                    <div className={`absolute inset-0 bg-gradient-to-br ${char.gradient || 'from-stone-900 to-stone-800'} opacity-40`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute top-4 right-4 bg-black/40 border border-white/10 px-2.5 py-1 rounded-full">
                      <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">En desarrollo</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h2 className="text-3xl font-black uppercase tracking-tighter text-white/25">{char.name}</h2>
                      <p className="text-white/20 font-mono text-[10px] uppercase tracking-widest mt-0.5">{char.type} · {char.id}</p>
                      <ProgressBars progress={char.progress} dimmed />
                    </div>
                  </motion.div>
                );

                /* ── ACTIVE (accessible or restricted) ── */
                return (
                  <motion.div key={char.id}
                    whileHover={{ scale: accessible ? 1.015 : 1.005 }} whileTap={{ scale: 0.99 }}
                    onClick={() => { posthog.capture(accessible ? 'open_character' : 'open_restricted', { character: char.name, profile: activeProfileKey, accessible }); setSelectedCharId(char.id); }}
                    className="relative h-72 rounded-3xl overflow-hidden cursor-pointer border transition-all duration-500 group"
                    style={{ borderColor: accessible ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)' }}>

                    {conceptUrl
                      ? <img src={conceptUrl} alt={char.name} className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-700 ${accessible ? 'group-hover:scale-105' : 'grayscale opacity-40'}`} />
                      : <div className="absolute inset-0 bg-white/[0.02]" />}

                    <div className={`absolute inset-0 bg-gradient-to-t ${accessible ? 'from-black/90 via-black/40 to-transparent' : 'from-black/95 via-black/60 to-black/20'} transition-all duration-500`} />

                    {!accessible && (
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/30">
                          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-end">
                      <div className="flex-1 min-w-0">
                        <h2 className={`text-3xl font-black uppercase tracking-tighter drop-shadow-lg ${accessible ? 'text-white' : 'text-white/40'}`}>{char.name}</h2>
                        <p className="text-white/30 font-mono text-[10px] uppercase tracking-widest mt-0.5">
                          {char.type} · {char.id}{!accessible && <span className="ml-2 text-white/20">· Acceso restringido</span>}
                        </p>
                        <ProgressBars progress={char.progress} dimmed={!accessible} />
                      </div>
                      <div className={`ml-4 w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 flex-shrink-0 ${accessible ? 'bg-white/10 border-white/20 group-hover:bg-white group-hover:text-black text-white' : 'bg-white/5 border-white/10 text-white/20'}`}>
                        <span className="text-sm">{accessible ? '→' : '🔒'}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          /* HOME — 6 section cards */
        ) : (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-12">

            <header className="flex justify-between items-start mb-16 max-w-7xl mx-auto">
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter">{profile?.nombre_display || 'Portal Unificado'}</h1>
                <p className="text-white/40 font-mono text-xs mt-1 uppercase tracking-widest">{profile?.rol?.toUpperCase() || 'HOST'} · Sistema Modular ID 04.02</p>
              </div>
              {!isHost && (
                <button onClick={() => { posthog.capture('sign_out'); signOut(); }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2 rounded-full text-xs transition-all uppercase tracking-widest">
                  Salir
                </button>
              )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
              {SECTIONS.map((section, i) => {
                const isActive = section.status === 'active';
                return (
                  <motion.div key={section.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    whileHover={{ scale: isActive ? 1.02 : 1.005, y: isActive ? -3 : 0 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { if (isActive) { posthog.capture('open_section', { section: section.id }); setActiveSection(section.id); } }}
                    className={`relative h-52 rounded-3xl overflow-hidden border transition-all duration-500 group ${isActive ? 'cursor-pointer border-white/10 hover:border-white/20' : 'cursor-default border-white/[0.04]'}`}>

                    <div className={`absolute inset-0 bg-gradient-to-br ${section.gradient} ${isActive ? 'opacity-80 group-hover:opacity-100' : 'opacity-40'} transition-opacity duration-500`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className={`absolute -right-4 -top-4 text-9xl transition-transform duration-500 ${isActive ? 'group-hover:scale-110 group-hover:rotate-6' : ''}`}
                      style={{ opacity: isActive ? 0.15 : 0.08 }}>
                      {section.emoji}
                    </div>

                    {!isActive && (
                      <div className="absolute top-4 right-4 bg-black/40 border border-white/10 px-2.5 py-1 rounded-full">
                        <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">En desarrollo</span>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-end">
                      <div>
                        <div className="text-2xl mb-1.5">{section.emoji}</div>
                        <h2 className={`text-xl font-black uppercase tracking-tight leading-tight ${isActive ? 'text-white' : 'text-white/40'}`}>{section.label}</h2>
                        <p className={`font-mono text-[9px] uppercase tracking-widest mt-1 ${isActive ? 'text-white/40' : 'text-white/20'}`}>{section.sublabel}</p>
                      </div>
                      {isActive && (
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 text-white group-hover:bg-white group-hover:text-black transition-all duration-300">
                          <span className="text-sm">→</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Portal />
    </AuthProvider>
  );
}
