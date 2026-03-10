import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveAssetUrl } from '../core/AssetResolver';
import { MODULE_REGISTRY, PROFILE_REGISTRY, LORE_ACCESS } from '../core/registry';
import { ArrowLeft, Lock, X, ZoomIn, ZoomOut } from 'lucide-react';

// ─────────────────────────────────────────────
// LIGHTBOX — zoom-to-pointer / zoom-to-pinch
// ─────────────────────────────────────────────
function Lightbox({ src, alt, onClose }) {
    const containerRef = useRef(null);
    const stateRef = useRef({ scale: 1, x: 0, y: 0 });
    const [, forceRender] = useState(0);

    const applyState = (scale, x, y) => {
        const s = Math.min(Math.max(scale, 1), 6);
        stateRef.current = { scale: s, x: s <= 1 ? 0 : x, y: s <= 1 ? 0 : y };
        forceRender(n => n + 1);
    };

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Backspace') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const center = () => {
            const r = el.getBoundingClientRect();
            return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
        };
        const zoomAt = (newScale, focalX, focalY) => {
            const { cx, cy } = center();
            const { scale, x, y } = stateRef.current;
            const fx = focalX - cx; const fy = focalY - cy;
            const imgX = (fx - x) / scale; const imgY = (fy - y) / scale;
            const clamped = Math.min(Math.max(newScale, 1), 6);
            applyState(clamped, fx - imgX * clamped, fy - imgY * clamped);
        };

        const onWheel = (e) => { e.preventDefault(); zoomAt(stateRef.current.scale + (e.deltaY > 0 ? -0.2 : 0.2), e.clientX, e.clientY); };

        const drag = { active: false, sx: 0, sy: 0, ox: 0, oy: 0 };
        const onMouseDown = (e) => { drag.active = true; drag.sx = e.clientX; drag.sy = e.clientY; drag.ox = stateRef.current.x; drag.oy = stateRef.current.y; el.style.cursor = 'grabbing'; };
        const onMouseMove = (e) => { if (!drag.active) return; const { scale } = stateRef.current; applyState(scale, drag.ox + (e.clientX - drag.sx), drag.oy + (e.clientY - drag.sy)); };
        const onMouseUp = () => { drag.active = false; el.style.cursor = stateRef.current.scale > 1 ? 'grab' : 'zoom-out'; };

        let lastClick = 0;
        const onMouseClick = (e) => {
            if (e.target === el) { onClose(); return; }
            const now = Date.now(); if (now - lastClick < 300) onClose(); lastClick = now;
        };

        const touch = { initDist: 0, initScale: 1, initMidX: 0, initMidY: 0, initX: 0, initY: 0, panSX: 0, panSY: 0, panOX: 0, panOY: 0 };
        let lastTap = 0;
        const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

        const onTouchStart = (e) => {
            e.preventDefault();
            const ts = Array.from(e.touches);
            if (ts.length === 2) { touch.initDist = dist(ts); touch.initScale = stateRef.current.scale; touch.initMidX = (ts[0].clientX + ts[1].clientX) / 2; touch.initMidY = (ts[0].clientY + ts[1].clientY) / 2; touch.initX = stateRef.current.x; touch.initY = stateRef.current.y; }
            else { touch.panSX = ts[0].clientX; touch.panSY = ts[0].clientY; touch.panOX = stateRef.current.x; touch.panOY = stateRef.current.y; }
        };
        const onTouchMove = (e) => {
            e.preventDefault();
            const ts = Array.from(e.touches);
            if (ts.length === 2 && touch.initDist > 0) {
                const newScale = (dist(ts) / touch.initDist) * touch.initScale;
                const { cx, cy } = center();
                const fx = touch.initMidX - cx; const fy = touch.initMidY - cy;
                const imgX = (fx - touch.initX) / touch.initScale; const imgY = (fy - touch.initY) / touch.initScale;
                const clamped = Math.min(Math.max(newScale, 1), 6);
                applyState(clamped, fx - imgX * clamped, fy - imgY * clamped);
            } else if (ts.length === 1 && stateRef.current.scale > 1) {
                applyState(stateRef.current.scale, touch.panOX + (ts[0].clientX - touch.panSX), touch.panOY + (ts[0].clientY - touch.panSY));
            }
        };
        const onTouchEnd = (e) => {
            if (e.changedTouches.length === 1 && e.touches.length === 0) { const now = Date.now(); if (now - lastTap < 300) onClose(); lastTap = now; }
            touch.initDist = 0;
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        el.addEventListener('mousedown', onMouseDown);
        el.addEventListener('mousemove', onMouseMove);
        el.addEventListener('mouseup', onMouseUp);
        el.addEventListener('mouseleave', onMouseUp);
        el.addEventListener('click', onMouseClick);
        el.addEventListener('touchstart', onTouchStart, { passive: false });
        el.addEventListener('touchmove', onTouchMove, { passive: false });
        el.addEventListener('touchend', onTouchEnd, { passive: false });
        return () => {
            ['wheel', 'mousedown', 'mousemove', 'mouseup', 'mouseleave', 'click', 'touchstart', 'touchmove', 'touchend']
                .forEach(ev => el.removeEventListener(ev, ev === 'wheel' ? onWheel : ev.startsWith('touch') ? (ev === 'touchstart' ? onTouchStart : ev === 'touchmove' ? onTouchMove : onTouchEnd) : ev === 'mousedown' ? onMouseDown : ev === 'mousemove' ? onMouseMove : ev === 'click' ? onMouseClick : onMouseUp));
        };
    }, [onClose]);

    const { scale, x, y } = stateRef.current;
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/75 flex items-center justify-center select-none"
            style={{ backdropFilter: 'blur(2px)' }}>
            <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button onClick={() => applyState(Math.min(scale + 0.5, 6), x, y)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all"><ZoomIn size={14} className="text-white/70" /></button>
                <button onClick={() => applyState(Math.max(scale - 0.5, 1), x, y)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all"><ZoomOut size={14} className="text-white/70" /></button>
                {scale > 1 && <button onClick={() => applyState(1, 0, 0)} className="px-3 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-[10px] font-mono text-white/70 transition-all">1:1</button>}
                <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all"><X size={14} className="text-white/70" /></button>
            </div>
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/20 text-[10px] font-mono uppercase tracking-widest pointer-events-none whitespace-nowrap">
                🖥 Scroll·zoom al cursor · Drag·mover &nbsp;|&nbsp; 📱 Pinch·zoom · 1 dedo·mover &nbsp;|&nbsp; Doble clic/tap · ESC · cerrar
            </p>
            <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden" style={{ cursor: scale > 1 ? 'grab' : 'zoom-out' }}>
                <img src={src} alt={alt} draggable={false}
                    style={{ transform: `translate(${x}px,${y}px) scale(${scale})`, transition: 'transform 0.05s linear', maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', pointerEvents: 'none' }}
                />
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────
const TABS = ['Visual', 'Narrativa', 'Datos'];
const MORALITY_LABEL = { positivo: '✦ Positivo', negativo: '✦ Negativo', neutral: '✦ Neutral' };
const MORALITY_COLOR = { positivo: 'text-emerald-400', negativo: 'text-rose-400', neutral: 'text-amber-400' };

// ─────────────────────────────────────────────
// CHARACTER VIEW
// ─────────────────────────────────────────────
export default function CharacterView({ charId, activeProfile, roleLabel, onBack }) {
    const char = MODULE_REGISTRY[charId];
    if (!char) return <div>Character not found</div>;

    const profileAccess = PROFILE_REGISTRY[activeProfile]?.access || [];
    const charIsAccessible = profileAccess.some(id =>
        char.id === id || char.id.startsWith(id) || id.startsWith(char.id)
    );

    const [activeTab, setActiveTab] = useState('Visual');
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const lastTapRef = useRef(0);

    const conceptUrl = char.assets?.concept ? resolveAssetUrl(char.assets.concept, char.name, 'SD') : null;

    const openLightbox = (url) => setLightboxSrc(url);
    const openOnDblClick = (url) => openLightbox(url);
    const openOnDblTap = (e, url) => { e.preventDefault(); const now = Date.now(); if (now - lastTapRef.current < 300) openLightbox(url); lastTapRef.current = now; };

    // ── ACCESS RESTRICTED ──
    if (!charIsAccessible) {
        return (
            <div className="min-h-screen bg-[#050505] text-white p-8">
                <div className="max-w-7xl mx-auto">
                    <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        VOLVER
                    </button>
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6">
                            <Lock size={24} className="text-white/30" />
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter mb-3">Acceso Restringido</h2>
                        <p className="text-white/40 text-sm max-w-md leading-relaxed">
                            El perfil de <strong className="text-white/60">{char.name}</strong> no está disponible para <strong className="text-white/60">{roleLabel || activeProfile}</strong>.
                        </p>
                        <button onClick={onBack} className="mt-8 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-3 rounded-full text-sm transition-all uppercase tracking-widest">
                            ← Explorar
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ── PRESENTATION ASSETS ──
    const presentationAssets = [
        ...(char.assets.concept ? [{ id: char.assets.concept, label: 'Concepto', assetType: 'concept' }] : []),
        ...(char.assets.acting || []).map(id => ({ id, label: 'Acting', assetType: 'acting' })),
        ...(char.assets.acting_hd || []).map(id => ({ id, label: 'Acting HD', assetType: 'acting_hd', hd: true })),
    ];
    const turnaroundAssets = (char.assets.turnaround || []).map(id => ({ id, label: 'Turnaround', assetType: 'turnaround' }));

    // ── LORE ACCESS ──
    const canSee = (tier) => LORE_ACCESS[tier]?.includes(activeProfile);

    const LoreCard = ({ tier, title, text, icon }) => {
        const accessible = canSee(tier);
        return (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border p-6 ${accessible ? 'bg-white/[0.03] border-white/10' : 'bg-white/[0.01] border-white/[0.04]'}`}>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{icon}</span>
                    <h3 className={`text-xs font-mono uppercase tracking-widest ${accessible ? 'text-white/60' : 'text-white/20'}`}>{title}</h3>
                    {!accessible && (
                        <span className="ml-auto flex items-center gap-1 text-[9px] font-mono text-white/20 uppercase tracking-widest">
                            <Lock size={9} /> acceso restringido
                        </span>
                    )}
                </div>
                {accessible
                    ? <p className="text-white/70 text-sm leading-relaxed">{text}</p>
                    : <p className="text-white/15 text-sm italic">Contenido disponible para niveles superiores de acceso.</p>
                }
            </motion.div>
        );
    };

    // ─────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────
    return (
        <>
            <AnimatePresence>
                {lightboxSrc && <Lightbox src={lightboxSrc} alt={char.name} onClose={() => setLightboxSrc(null)} />}
            </AnimatePresence>

            <div className="min-h-screen bg-[#050505] text-white">

                {/* ── HERO ZONE ── */}
                <div className="relative overflow-hidden bg-[#050505]" style={{ minHeight: '65vh' }}>
                    {/* Background Blueprint or Concept Art */}
                    {char.assets?.hero_bg ? (
                        <div className="absolute inset-0 z-0">
                            <img src={resolveAssetUrl(char.assets.hero_bg, char.name, 'SD')} alt=""
                                className="w-full h-full object-cover opacity-50 transition-opacity duration-1000"
                                style={{
                                    maskImage: 'linear-gradient(to left, black 30%, transparent 90%)',
                                    WebkitMaskImage: 'linear-gradient(to left, black 30%, transparent 90%)'
                                }}
                            />
                        </div>
                    ) : conceptUrl && (
                        <img src={conceptUrl} alt={char.name}
                            className="absolute right-0 top-0 h-full w-auto max-w-[55%] object-contain object-right-top"
                            style={{ maskImage: 'linear-gradient(to left, black 40%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to left, black 40%, transparent 100%)' }}
                        />
                    )}

                    {/* Dark gradient overlays for readability and blending */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/30" />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col justify-between h-full p-8 md:p-12" style={{ minHeight: '65vh' }}>
                        {/* Back button */}
                        <button onClick={onBack} className="flex items-center gap-2 text-white/30 hover:text-white transition-colors group self-start">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-mono text-[10px] uppercase tracking-widest">Personajes</span>
                        </button>

                        {/* Character identity */}
                        <div className="max-w-xl mt-auto">
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <span className="text-white/30 font-mono text-[10px] uppercase tracking-widest">{char.type}</span>
                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                <span className={`font-mono text-[10px] uppercase tracking-widest ${MORALITY_COLOR[char.morality] || 'text-white/30'}`}>
                                    {MORALITY_LABEL[char.morality] || char.morality}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                <span className="text-white/20 font-mono text-[10px]">{char.id}</span>
                            </div>

                            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-4">
                                {char.name}
                            </h1>

                            {char.lore?.bio_short && (
                                <p className="text-white/55 text-sm md:text-base leading-relaxed max-w-md">
                                    {char.lore.bio_short}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── TAB BAR ── */}
                <div className="sticky top-0 z-20 bg-[#050505]/95 backdrop-blur-sm border-b border-white/[0.06]">
                    <div className="max-w-7xl mx-auto px-8 md:px-12 flex gap-8">
                        {TABS.map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`py-4 text-[11px] font-mono uppercase tracking-widest transition-all border-b-2 -mb-px ${activeTab === tab
                                    ? 'text-white border-white'
                                    : 'text-white/25 border-transparent hover:text-white/50'
                                    }`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── TAB CONTENT ── */}
                <div className="max-w-7xl mx-auto px-8 md:px-12 py-12">

                    <AnimatePresence mode="wait">

                        {/* ── VISUAL TAB ── */}
                        {activeTab === 'Visual' && (
                            <motion.div key="visual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                                {presentationAssets.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                                        {presentationAssets.map(asset => {
                                            const url = resolveAssetUrl(asset.id, char.name, asset.hd ? 'HD' : 'SD');
                                            return (
                                                <motion.div key={asset.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                                                    onDoubleClick={() => openOnDblClick(url)}
                                                    onTouchEnd={(e) => openOnDblTap(e, url)}
                                                    title="Doble clic / doble toque para ampliar"
                                                    className="group relative bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden aspect-square cursor-zoom-in">
                                                    <img src={url} alt={asset.label} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-[1.02]" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                                        <h3 className="text-sm font-bold">{asset.label}</h3>
                                                        {asset.hd && <span className="text-[9px] text-amber-400 font-mono uppercase tracking-widest">Master Quality</span>}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}

                                {turnaroundAssets.length > 0 && (
                                    <>
                                        <p className="text-white/20 font-mono text-[10px] uppercase tracking-widest mb-4">
                                            Turnaround · {turnaroundAssets.length} vistas
                                        </p>
                                        <div className="flex gap-4 overflow-x-auto pb-2" style={{ height: '500px' }}>
                                            {turnaroundAssets.map(asset => {
                                                const url = resolveAssetUrl(asset.id, char.name, 'SD');
                                                return (
                                                    <motion.div key={asset.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                                                        onDoubleClick={() => openOnDblClick(url)}
                                                        onTouchEnd={(e) => openOnDblTap(e, url)}
                                                        className="group relative h-full flex-shrink-0 bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden cursor-zoom-in"
                                                        style={{ width: 'calc(500px * 0.56)' }}>
                                                        <img src={url} alt="Turnaround" className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-700" />
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}

                                {presentationAssets.length === 0 && turnaroundAssets.length === 0 && (
                                    <div className="text-center py-24 text-white/20">
                                        <p className="text-4xl mb-3">🎨</p>
                                        <p className="font-mono text-xs uppercase tracking-widest">Assets visuales en desarrollo</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── NARRATIVA TAB ── */}
                        {activeTab === 'Narrativa' && (
                            <motion.div key="narrativa" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="flex flex-col gap-5 max-w-3xl">
                                {char.lore ? (
                                    <>
                                        <LoreCard tier="bio_short" icon="📖" title="Descripción general" text={char.lore.bio_short} />
                                        <LoreCard tier="bio_full" icon="📚" title="Historia completa" text={char.lore.bio_full} />
                                        <LoreCard tier="psych_profile" icon="🧠" title="Perfil psicológico" text={char.lore.psych_profile} />
                                    </>
                                ) : (
                                    <div className="text-center py-24 text-white/20">
                                        <p className="text-4xl mb-3">📝</p>
                                        <p className="font-mono text-xs uppercase tracking-widest">Contenido narrativo en desarrollo</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── DATOS TAB ── */}
                        {activeTab === 'Datos' && (
                            <motion.div key="datos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="max-w-2xl">

                                {/* Ficha */}
                                <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden mb-6">
                                    {[
                                        ['Nombre', char.name],
                                        ['Tipo', char.type],
                                        ['Moralidad', char.morality ? char.morality.charAt(0).toUpperCase() + char.morality.slice(1) : '—'],
                                        ['ID', char.id],
                                        ['Estado', char.status === 'active' ? 'Activo en portal' : 'En desarrollo'],
                                    ].map(([label, value], i, arr) => (
                                        <div key={label} className={`flex items-center ${i < arr.length - 1 ? 'border-b border-white/[0.06]' : ''}`}>
                                            <span className="w-40 px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-white/30 flex-shrink-0">{label}</span>
                                            <span className="px-6 py-4 text-sm text-white/70">{value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Production progress */}
                                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-5">Estado de Producción</h3>
                                    {char.progress && Object.entries(char.progress).map(([key, val]) => (
                                        <div key={key} className="mb-4 last:mb-0">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-xs font-mono uppercase tracking-widest text-white/40">{key}</span>
                                                <span className="text-xs font-mono text-white/30">{val}%</span>
                                            </div>
                                            <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
                                                <motion.div className="h-full bg-white/40 rounded-full"
                                                    initial={{ width: 0 }} animate={{ width: `${val}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}
