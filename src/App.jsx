import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import CharacterView from './components/CharacterView';
import BrowserView from './components/BrowserView';
import { motion, AnimatePresence } from 'framer-motion';
import { MODULE_REGISTRY, PROFILE_REGISTRY } from './core/registry';
import { resolveAssetUrl } from './core/AssetResolver';
import posthog from './core/analytics';
import { Eye, LogOut, ArrowLeft, Sun, Moon, ChevronRight, Languages, Bell, BellOff } from 'lucide-react';
import { getTranslation as t } from './core/i18n';
import NotificationSystem from './components/NotificationSystem';

// ── Role → Profile key ──
const ROLE_TO_PROFILE = {
  host: 'equipo', equipo: 'equipo', confidente: 'equipo',
  vip: 'investor', guest: 'producer', kids: 'child',
  educadores: 'producer'
};

const VIEW_AS_ROLES = [
  { id: 'host', profileKey: 'equipo', label: 'Host', color: 'bg-[var(--text-primary)]', bannerColor: null },
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
  { id: 'proyectos', label: 'Proyectos', sublabel: 'Films · Series · Cortometrajes', emoji: '🎬', gradient: 'from-sky-950 via-cyan-900 to-blue-900', status: 'coming_soon' },
  { id: 'browser', label: 'Browser', sublabel: 'Assets · Galería · Explorador', emoji: '🖼️', gradient: 'from-slate-900 via-zinc-800 to-slate-900', status: 'active' },
];

// ── Progress bars ──
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

// ── Global Chrome (Visible to all) ──
function GlobalChrome({ lang, setLang, viewAsId, setViewAsId, setViewAsProfileKey, signOut, isLightMode, onToggleTheme, isHost }) {
  const [open, setOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('portal_notifications_enabled') !== 'false');
  const active = VIEW_AS_ROLES.find(r => r.id === (viewAsId || 'host')) || VIEW_AS_ROLES[0];
  
  // Listen for external storage changes (like clearing local storage)
  useEffect(() => {
    const handleStorageChange = () => {
      setNotificationsEnabled(localStorage.getItem('portal_notifications_enabled') !== 'false');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] flex items-center gap-2">
      {/* Language Toggle */}
      <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
        className="bg-[var(--bg-primary)]/80 backdrop-blur border border-[var(--border-primary)] hover:border-[var(--text-secondary)] p-1.5 rounded-full transition-all flex items-center justify-center gap-1.5 px-3 min-w-[64px]" 
        title={t(lang, 'change_lang')}>
        <Languages size={13} className="text-[var(--text-dim)]" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-primary)]">{lang}</span>
      </button>

      {/* View As (Host only) */}
      {isHost && (
        <div className="relative">
          <button onClick={() => setOpen(!open)}
            className="flex items-center gap-2 bg-[var(--bg-primary)]/80 backdrop-blur border border-[var(--border-primary)] hover:border-[var(--text-secondary)] px-3 py-1.5 rounded-full text-xs transition-all shadow-xl">
            <Eye size={11} className="text-[var(--text-dim)]" />
            <span className="text-[var(--text-dim)] font-mono uppercase tracking-widest text-[9px]">{t(lang, 'view_as')}</span>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active.color}`} />
            <span className="text-[var(--text-primary)] font-bold uppercase tracking-wider text-[10px]">{t(lang, `role_${active.id}`)}</span>
          </button>
          <AnimatePresence>
            {open && (
              <motion.div initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }} transition={{ duration: 0.12 }}
                className="absolute right-0 top-10 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl overflow-hidden shadow-2xl min-w-[160px]">
                {VIEW_AS_ROLES.map(role => (
                  <button key={role.id}
                    onClick={() => { setViewAsId(role.id); setViewAsProfileKey(role.profileKey); setOpen(false); posthog.capture('host_view_as', { role: role.id }); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--surface-card)] transition-colors ${role.id === viewAsId ? 'bg-[var(--surface-card)]' : ''}`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${role.color}`} />
                    <span className="text-[var(--text-primary)] text-[10px] font-mono uppercase tracking-widest opacity-80">{t(lang, `role_${role.id}`)}</span>
                    {role.id === (viewAsId || 'host') && <span className="ml-auto text-[var(--text-dim)] text-[10px]">✓</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Theme Toggle */}
      <button onClick={() => {
        const next = isLightMode ? 'dark' : 'light';
        onToggleTheme(next);
      }}
        className="bg-[var(--bg-primary)]/80 backdrop-blur border border-[var(--border-primary)] hover:border-[var(--text-secondary)] p-1.5 rounded-full transition-all" title={t(lang, 'change_theme')}>
        {isLightMode ? <Moon size={13} className="text-[var(--text-dim)]" /> : <Sun size={13} className="text-[var(--text-dim)]" />}
      </button>

      {/* Notifications Toggle */}
      <button 
        onClick={() => {
          const newState = !notificationsEnabled;
          setNotificationsEnabled(newState);
          localStorage.setItem('portal_notifications_enabled', newState.toString());
          // Alert other components
          window.dispatchEvent(new Event('storage'));
        }}
        className="bg-[var(--bg-primary)]/80 backdrop-blur border border-[var(--border-primary)] hover:border-[var(--text-secondary)] p-1.5 rounded-full transition-all" 
        title={t(lang, 'notification_settings')}
      >
        {notificationsEnabled ? (
          <Bell size={13} className="text-[var(--text-dim)]" />
        ) : (
          <BellOff size={13} className="text-[var(--text-primary)] opacity-50" />
        )}
      </button>

      {/* Sign Out */}
      <button onClick={() => { posthog.capture('sign_out'); signOut(); }}
        className="bg-[var(--bg-primary)]/80 backdrop-blur border border-[var(--border-primary)] hover:border-[var(--text-secondary)] p-1.5 rounded-full transition-all" title={t(lang, 'sign_out')}>
        <LogOut size={13} className="text-[var(--text-dim)]" />
      </button>
    </div>
  );
}

// ── Portal Content ──
function Portal({ lang, setLang, themeOverride, setThemeOverride }) {
  const { user, profile, loading, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState(null);
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterMorality, setFilterMorality] = useState('all');
  const [viewAsId, setViewAsId] = useState(null);
  const [viewAsProfileKey, setViewAsProfileKey] = useState(null);


  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
    </div>
  );

  const isHost = profile?.rol === 'host';
  const realProfileKey = profile?.rol ? ROLE_TO_PROFILE[profile.rol] || 'producer' : 'producer';
  const activeProfileKey = isHost && viewAsProfileKey ? viewAsProfileKey : realProfileKey;
  const activeViewId = viewAsId || (profile?.rol || 'host');
  const activeRole = VIEW_AS_ROLES.find(r => r.id === activeViewId) || VIEW_AS_ROLES[0];
  const stripeColor = activeRole.bannerColor;

  const defaultIsLight = activeViewId === 'kids' || activeViewId === 'educadores';
  const isLightMode = themeOverride === null ? defaultIsLight : themeOverride === 'light';

  if (!user) return (
    <LoginPage 
      lang={lang} 
      setLang={setLang} 
      themeOverride={themeOverride} 
      setThemeOverride={setThemeOverride} 
      isLightMode={isLightMode} 
      onToggleTheme={(next) => {
        setThemeOverride(next);
      }}
    />
  );

  const isCharAccessible = (char) => {
    const p = PROFILE_REGISTRY[activeProfileKey];
    if (!p) return true;
    return p.access.some(id => char.id === id || char.id.startsWith(id) || id.startsWith(char.id));
  };

  const goHome = () => { setActiveSection(null); setSelectedCharId(null); setFilterType('all'); setFilterMorality('all'); };

  // Browser section
  if (activeSection === 'browser') return (
    <>
      {stripeColor && (
        <motion.div key={activeViewId}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ duration: 0.35 }}
          style={{ backgroundColor: stripeColor, transformOrigin: 'left' }}
          className="fixed top-0 left-0 right-0 z-[110] h-[3px]"
        />
      )}
      <GlobalChrome
        lang={lang} setLang={setLang}
        viewAsId={activeViewId} setViewAsId={setViewAsId}
        setViewAsProfileKey={setViewAsProfileKey} signOut={signOut}
        isLightMode={isLightMode}
        onToggleTheme={(next) => { setThemeOverride(next); }}
        isHost={isHost}
      />
      <BrowserView lang={lang} onBack={goHome} />
    </>
  );

  const TYPE_FILTERS = ['all', 'main', 'secondary', 'npc'];
  const MORALITY_FILTERS = ['all', 'positive', 'negative', 'neutral'];

  const filteredChars = Object.values(MODULE_REGISTRY).filter(char => {
    const typeMatch = filterType === 'all' || char.type.toLowerCase() === t('es', filterType).toLowerCase();
    const moralKeyMap = { positive: 'positivo', negative: 'negativo', neutral: 'neutral', all: 'all' };
    const effectiveMoralMatch = filterMorality === 'all' || char.morality === moralKeyMap[filterMorality];
    return typeMatch && effectiveMoralMatch;
  });

  return (
    <>
      <NotificationSystem lang={lang} onReview={() => setActiveSection('browser')} />
      
      {stripeColor && (
        <motion.div key={activeViewId}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ duration: 0.35 }}
          style={{ backgroundColor: stripeColor, transformOrigin: 'left' }}
          className="fixed top-0 left-0 right-0 z-[110] h-[3px]"
        />
      )}

      <GlobalChrome 
        lang={lang} setLang={setLang}
        viewAsId={activeViewId} setViewAsId={setViewAsId} 
        setViewAsProfileKey={setViewAsProfileKey} signOut={signOut} 
        isLightMode={isLightMode} 
        onToggleTheme={(next) => {
          setThemeOverride(next);
        }} 
        isHost={isHost}
      />

      <AnimatePresence mode="wait">
        {selectedCharId ? (
          <motion.div key="char-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="pt-8">
            <CharacterView lang={lang} charId={selectedCharId} activeProfile={activeProfileKey} roleLabel={activeRole.label} onBack={() => setSelectedCharId(null)} />
          </motion.div>
        ) : activeSection === 'characters' ? (
          <motion.div key="characters" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 md:p-12 max-w-7xl mx-auto">
            <div className="mb-12">
              <button onClick={goHome} className="flex items-center gap-2 text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors mb-6 group text-xs font-mono uppercase tracking-widest">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                {t(lang, 'back_to_portal')}
              </button>
              <h1 className="text-5xl font-black uppercase tracking-tighter">{t(lang, 'section_characters')}</h1>
              <p className="text-[var(--text-dim)] font-mono text-xs mt-1 uppercase tracking-widest">{t(lang, 'sub_characters')}</p>
            </div>

            <div className="flex flex-col gap-4 mb-10">
              <div className="flex items-center gap-4">
                <span className="text-[var(--text-dim)] font-mono text-[9px] uppercase tracking-widest w-20">{t(lang, 'importance')}</span>
                <div className="flex gap-2">
                  {TYPE_FILTERS.map(f => (
                    <button key={f} onClick={() => setFilterType(f)} className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all ${filterType === f ? 'bg-[var(--accent-primary)] text-[var(--accent-invert)]' : 'border border-[var(--border-secondary)] text-[var(--text-dim)] hover:text-[var(--text-primary)]'}`}>{t(lang, f)}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[var(--text-dim)] font-mono text-[9px] uppercase tracking-widest w-20">{t(lang, 'morality')}</span>
                <div className="flex gap-2">
                  {MORALITY_FILTERS.map(f => (
                    <button key={f} onClick={() => setFilterMorality(f)} className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all ${filterMorality === f ? 'bg-[var(--accent-primary)] text-[var(--accent-invert)]' : 'border border-[var(--border-secondary)] text-[var(--text-dim)] hover:text-[var(--text-primary)]'}`}>{t(lang, f)}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredChars.map(char => {
                const isSoon = char.status === 'coming_soon';
                const accessible = !isSoon && isCharAccessible(char);
                const concept = !isSoon && char.assets?.concept ? resolveAssetUrl(char.assets.concept, char.name, 'SD') : null;
                
                return (
                  <motion.div key={char.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: accessible ? 1.015 : 1 }} onClick={() => accessible && setSelectedCharId(char.id)}
                    className={`relative aspect-[1.618/1] rounded-3xl overflow-hidden border transition-all duration-500 group shadow-xl ${accessible ? 'cursor-pointer border-[var(--border-primary)] hover:border-[var(--accent-primary)]' : 'border-[var(--border-secondary)]'}`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${char.gradient || 'from-stone-900 to-stone-800'} opacity-40`} />
                    {concept && <img src={concept} className="absolute inset-0 w-full h-full object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-700" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/40 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-end">
                      <div>
                        <h2 className={`text-3xl font-black uppercase tracking-tighter ${accessible ? 'text-[var(--text-primary)]' : 'text-[var(--text-dim)]'}`}>{char.name}</h2>
                        <p className="text-[var(--text-dim)] font-mono text-[10px] uppercase tracking-widest mt-0.5">{char.type} · {char.id}</p>
                        <ProgressBars progress={char.progress} dimmed={!accessible} />
                      </div>
                      {accessible && (
                        <div className="w-10 h-10 rounded-full border border-[var(--border-primary)] flex items-center justify-center group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--accent-invert)] transition-all">
                          <ChevronRight size={18} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 md:p-12 max-w-7xl mx-auto">
            <header className="mb-16 flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter">{profile?.nombre_display || t(lang, 'portal_unified')}</h1>
                <p className="text-[var(--text-dim)] font-mono text-xs mt-1 uppercase tracking-widest">{profile?.rol?.toUpperCase() || 'HOST'} · {t(lang, 'system_id')}</p>
              </div>
              {!isHost && <button onClick={signOut} className="bg-[var(--surface-card)] px-6 py-2 rounded-full text-xs font-mono uppercase tracking-widest border border-[var(--border-primary)]">{t(lang, 'exit')}</button>}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SECTIONS.map((s, i) => {
                const active = s.status === 'active';
                return (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => active && setActiveSection(s.id)}
                    className={`relative aspect-[1.618/1] rounded-3xl overflow-hidden border transition-all duration-500 group shadow-lg ${active ? 'cursor-pointer border-[var(--border-primary)] hover:border-[var(--accent-primary)]' : 'border-[var(--border-secondary)] grayscale'}`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} ${active ? 'opacity-80' : 'opacity-30'}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)]/80 to-transparent" />
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <span className="text-3xl mb-2">{s.emoji}</span>
                      <h2 className="text-xl font-black uppercase tracking-tight">{t(lang, `section_${s.id}`)}</h2>
                      <p className="text-[var(--text-dim)] text-[9px] font-mono uppercase tracking-widest mt-1">{t(lang, `sub_${s.id}`)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('portal_lang') || 'es');
  const [themeOverride, setThemeOverride] = useState(() => localStorage.getItem('portal_theme'));

  useEffect(() => {
    localStorage.setItem('portal_lang', lang);
  }, [lang]);

  useEffect(() => {
    console.log('App: themeOverride changed to:', themeOverride);
    if (themeOverride) {
      localStorage.setItem('portal_theme', themeOverride);
    } else {
      localStorage.removeItem('portal_theme');
    }
  }, [themeOverride]);

  const isLightMode = themeOverride === 'light'; 
  console.log('App: isLightMode calculated as:', isLightMode, 'themeOverride is:', themeOverride);

  return (
    <AuthProvider>
      <div id="portal-root" className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-500 ${isLightMode ? 'theme-light' : ''}`}>
        <Portal lang={lang} setLang={setLang} themeOverride={themeOverride} setThemeOverride={setThemeOverride} />
      </div>
    </AuthProvider>
  );
}
