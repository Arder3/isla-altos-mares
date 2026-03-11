import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveAssetUrl } from '../core/AssetResolver';
import { MODULE_REGISTRY, PROFILE_REGISTRY, LORE_ACCESS } from '../core/registry';
import galleryManifest from '../core/gallery_manifest.json';
import { ArrowLeft, Lock, X, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';
import { getTranslation as t } from '../core/i18n';

// ─────────────────────────────────────────────
// LIGHTBOX — zoom-to-pointer / zoom-to-pinch
// ─────────────────────────────────────────────
function Lightbox({ src, alt, onClose, lang }) {
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
            className="fixed inset-0 z-[100] bg-[var(--bg-primary)]/95 backdrop-blur-md flex items-center justify-center select-none"
            style={{ backdropFilter: 'blur(2px)' }}>
            <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button onClick={() => applyState(Math.min(scale + 0.5, 6), x, y)} className="w-9 h-9 rounded-full bg-[var(--surface-card)] hover:bg-[var(--border-primary)] border border-[var(--border-primary)] flex items-center justify-center transition-all shadow-lg"><ZoomIn size={14} className="text-[var(--text-secondary)]" /></button>
                <button onClick={() => applyState(Math.max(scale - 0.5, 1), x, y)} className="w-9 h-9 rounded-full bg-[var(--surface-card)] hover:bg-[var(--border-primary)] border border-[var(--border-primary)] flex items-center justify-center transition-all shadow-lg"><ZoomOut size={14} className="text-[var(--text-secondary)]" /></button>
                {scale > 1 && <button onClick={() => applyState(1, 0, 0)} className="px-3 h-9 rounded-full bg-[var(--surface-card)] hover:bg-[var(--border-primary)] border border-[var(--border-primary)] text-[10px] font-mono text-[var(--text-secondary)] transition-all shadow-lg">1:1</button>}
                <button onClick={onClose} className="w-9 h-9 rounded-full bg-[var(--surface-card)] hover:bg-[var(--border-primary)] border border-[var(--border-primary)] flex items-center justify-center transition-all shadow-lg"><X size={14} className="text-[var(--text-secondary)]" /></button>
            </div>
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[var(--text-dim)] text-[10px] font-mono uppercase tracking-widest pointer-events-none whitespace-nowrap">
                {t(lang, 'lightbox_hint')}
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
const MORALITY_COLOR = { positivo: 'text-emerald-400', negativo: 'text-rose-400', neutral: 'text-amber-400' };

// ─────────────────────────────────────────────
// CHARACTER VIEW
// ─────────────────────────────────────────────
export default function CharacterView({ lang, charId, activeProfile, roleLabel, onBack }) {
    const char = MODULE_REGISTRY[charId];
    if (!char) return <div>Character not found</div>;

    const profileAccess = PROFILE_REGISTRY[activeProfile]?.access || [];
    const charIsAccessible = profileAccess.some(id =>
        char.id === id || char.id.startsWith(id) || id.startsWith(char.id)
    );

    const TABS = [
        { key: 'visual', label: t(lang, 'tab_visual') },
        { key: 'narrative', label: t(lang, 'tab_narrative') },
        { key: 'data', label: t(lang, 'tab_data') },
        { key: 'gallery', label: t(lang, 'tab_gallery') }
    ];
    const [activeTabKey, setActiveTabKey] = useState(TABS[0].key);
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const [isVertical, setIsVertical] = useState(window.matchMedia('(orientation: portrait)').matches);
    const [isPc, setIsPc] = useState(window.innerWidth > 1024 || window.matchMedia('(pointer: fine)').matches);

    useEffect(() => {
        const mq = window.matchMedia('(orientation: portrait)');
        const pmq = window.matchMedia('(pointer: fine)');
        const listener = () => {
            setIsVertical(mq.matches);
            setIsPc(window.innerWidth > 1024 || pmq.matches);
        };
        mq.addEventListener('change', listener);
        pmq.addEventListener('change', listener);
        window.addEventListener('resize', listener);
        return () => {
            mq.removeEventListener('change', listener);
            pmq.removeEventListener('change', listener);
            window.removeEventListener('resize', listener);
        };
    }, []);

    // ── SMART HERO FALLBACK (Multi-Ratio, Pattern-Based) ──
    const getSmartHero = () => {
        const manifest = galleryManifest[char.name];
        
        // Helper: find file containing Hero_RATIO and optionally a Pose identifier
        const findHero = (arr = [], heroRatio, poseFilter = null) => {
            if (!arr) return null;
            return arr.find(id => {
                const r = heroRatio.replace('-', 'x');
                const matchRatio = id.includes(`Hero_${heroRatio}`) || id.includes(`Hero_${r}`);
                const matchPose = poseFilter ? id.includes(poseFilter) : true;
                return matchRatio && matchPose;
            });
        };

        if (manifest) {
            // Mita Specific Override: Strict Device-Based Pose/Ratio (Strict asset matching)
            if (char.name === 'Mita') {
                if (isPc) {
                    // For PC: Strictly PoseA + 2-1 + Top
                    const hdMita = manifest.HD.find(id => id.includes('PoseA') && id.includes('2-1') && id.includes('Top'));
                    if (hdMita) return { id: hdMita, type: 'HD' };
                    const sdMita = manifest.SD.find(id => id.includes('PoseA') && id.includes('2-1') && id.includes('Top'));
                    if (sdMita) return { id: sdMita, type: 'SD' };
                } else {
                    // For Mobile: Strictly PoseB + 1-1
                    const hdMita = manifest.HD.find(id => id.includes('PoseB') && id.includes('1-1'));
                    if (hdMita) return { id: hdMita, type: 'HD' };
                    const sdMita = manifest.SD.find(id => id.includes('PoseB') && id.includes('1-1'));
                    if (sdMita) return { id: sdMita, type: 'SD' };
                }
            }

            let ratio = isVertical ? '1-1' : '2-1';
            const priorityPose = isPc ? 'PoseA' : 'PoseB';

            // 1. Try Priority Pose + Correct Ratio (HD then SD)
            const hdPriority = findHero(manifest.HD, ratio, priorityPose);
            if (hdPriority) return { id: hdPriority, type: 'HD' };
            
            const sdPriority = findHero(manifest.SD, ratio, priorityPose);
            if (sdPriority) return { id: sdPriority, type: 'SD' };

            // 2. Try ANY Pose + Correct Ratio (HD then SD)
            const hdMatch = findHero(manifest.HD, ratio);
            if (hdMatch) return { id: hdMatch, type: 'HD' };

            const sdMatch = findHero(manifest.SD, ratio);
            if (sdMatch) return { id: sdMatch, type: 'SD' };

            // 3. Fallback to 1-1 if we were looking for something else
            if (ratio !== '1-1') {
                const hd11 = findHero(manifest.HD, '1-1', priorityPose) || findHero(manifest.HD, '1-1');
                if (hd11) return { id: hd11, type: 'HD' };

                const sd11 = findHero(manifest.SD, '1-1', priorityPose) || findHero(manifest.SD, '1-1');
                if (sd11) return { id: sd11, type: 'SD' };
            }
        }

        // 4. Ultimate Fallback: Concept Art
        return { id: char.assets?.concept, type: 'SD' };
    };

    const smartHero = getSmartHero();
    const heroUrl = smartHero.id ? resolveAssetUrl(smartHero.id, char.name, smartHero.type) : null;

    const lastTapRef = useRef({ time: 0, url: null });

    const openLightbox = (url) => setLightboxSrc(url);
    const openOnDblClick = (url) => openLightbox(url);
    const openOnDblTap = (e, url) => {
        const now = Date.now();
        const prevTap = lastTapRef.current;
        if (prevTap.url === url && (now - prevTap.time) < 300) {
            if (e && typeof e.preventDefault === 'function' && e.cancelable) {
                e.preventDefault();
            }
            openLightbox(url);
            lastTapRef.current = { time: 0, url: null };
            return;
        }
        lastTapRef.current = { time: now, url };
    };

    // ── ACCESS RESTRICTED ──
    if (!charIsAccessible) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-8 transition-colors duration-500">
                <div className="max-w-7xl mx-auto">
                    <button onClick={onBack} className="flex items-center gap-2 text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors mb-8 group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        {t(lang, 'back')}
                    </button>
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-primary)] flex items-center justify-center mb-6">
                            <Lock size={24} className="text-[var(--text-dim)]" />
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter mb-3 text-[var(--text-primary)]">{t(lang, 'restricted_access')}</h2>
                        <p className="text-[var(--text-secondary)] text-sm max-w-md leading-relaxed">
                            {t(lang, 'restricted_msg', { name: char.name, role: roleLabel || activeProfile })}
                        </p>
                        <button onClick={onBack} className="mt-8 bg-[var(--surface-card)] hover:bg-[var(--border-primary)] border border-[var(--border-primary)] px-8 py-3 rounded-full text-sm transition-all uppercase tracking-widest text-[var(--text-primary)]">
                            ← {t(lang, 'explore')}
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ── PRESENTATION ASSETS ──
    const presentationAssets = [
        ...(char.assets?.concept ? [{ id: char.assets.concept, label: t(lang, 'asset_concept'), assetType: 'concept' }] : []),
        ...(char.assets?.acting || []).map(id => ({ id, label: t(lang, 'asset_acting'), assetType: 'acting' })),
    ];
    const turnaroundAssets = (char.assets?.turnaround || []).map(id => ({ id, label: t(lang, 'asset_turnaround'), assetType: 'turnaround' }));

    // ── LORE ACCESS ──
    const canSee = (tier) => LORE_ACCESS[tier]?.includes(activeProfile);

    const LoreCard = ({ tier, title, text, icon }) => {
        const accessible = canSee(tier);
        return (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border p-6 ${accessible ? 'bg-[var(--surface-card)] border-[var(--border-secondary)]' : 'bg-[var(--surface-card)]/30 border-[var(--border-secondary)]/50 opacity-40'}`}>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{icon}</span>
                    <h3 className={`text-xs font-mono uppercase tracking-widest ${accessible ? 'text-[var(--text-secondary)]' : 'text-[var(--text-dim)]'}`}>{title}</h3>
                    {!accessible && (
                        <span className="ml-auto flex items-center gap-1 text-[9px] font-mono text-[var(--text-dim)] uppercase tracking-widest">
                            <Lock size={9} /> {t(lang, 'restricted_access').toLowerCase()}
                        </span>
                    )}
                </div>
                {accessible
                    ? <p className="text-[var(--text-primary)] opacity-80 text-sm leading-relaxed">{text}</p>
                    : <p className="text-[var(--text-dim)] text-sm italic">{t(lang, 'restricted_content')}</p>
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
                {lightboxSrc && <Lightbox lang={lang} src={lightboxSrc} alt={char.name} onClose={() => setLightboxSrc(null)} />}
            </AnimatePresence>

            <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-500">

                {/* ── HERO ZONE ── */}
                <div className="relative overflow-hidden bg-[var(--bg-primary)]" style={{ minHeight: '65vh' }}>
                    {/* Background Concept or Smart Hero */}
                    {heroUrl && (
                        <div className="absolute inset-0 z-0">
                            <img src={heroUrl} alt={char.name}
                                className="w-full h-full object-cover object-top opacity-100 transition-opacity duration-1000"
                                style={{
                                    maskImage: 'linear-gradient(to left, black 30%, transparent 90%)',
                                    WebkitMaskImage: 'linear-gradient(to left, black 30%, transparent 90%)'
                                }}
                            />
                        </div>
                    )}

                    {/* Dark gradient overlays for readability and blending */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-primary)]/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-[var(--bg-primary)]/30" />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col justify-between h-full p-8 md:p-12" style={{ minHeight: '65vh' }}>
                        {/* Back button */}
                        <button onClick={onBack} className="flex items-center gap-2 text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors group self-start">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-mono text-[10px] uppercase tracking-widest">{t(lang, 'section_characters')}</span>
                        </button>

                        {/* Character identity */}
                        <div className="max-w-xl mt-auto">
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <span className="text-[var(--text-dim)] font-mono text-[10px] uppercase tracking-widest">{char.type}</span>
                                <span className="w-1 h-1 rounded-full bg-[var(--text-dim)] opacity-30" />
                                <span className={`font-mono text-[10px] uppercase tracking-widest ${MORALITY_COLOR[char.morality] || 'text-[var(--text-dim)]'}`}>
                                    ✦ {t(lang, char.morality || 'neutral')}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-[var(--text-dim)] opacity-30" />
                                <span className="text-[var(--text-dim)] font-mono text-[10px] opacity-60">{char.id}</span>
                                {smartHero.type === 'HD' && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-[var(--text-dim)] opacity-30" />
                                        <span className="text-amber-400 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1">
                                            <ImageIcon size={10} /> {t(lang, 'master_quality')}
                                        </span>
                                    </>
                                )}
                            </div>

                            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-4">
                                {char.name}
                            </h1>

                            {char.lore?.bio_short && (
                                <p className="text-[var(--text-secondary)] text-sm md:text-base leading-relaxed max-w-md">
                                    {char.lore.bio_short}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── TAB BAR ── */}
                <div className="sticky top-0 z-20 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--border-primary)]">
                    <div className="max-w-7xl mx-auto px-8 md:px-12 flex gap-8">
                        {TABS.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTabKey(tab.key)}
                                className={`py-4 text-[11px] font-mono uppercase tracking-widest transition-all border-b-2 -mb-px ${activeTabKey === tab.key
                                    ? 'text-[var(--text-primary)] border-[var(--text-primary)]'
                                    : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
                                    }`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── TAB CONTENT ── */}
                <div className="max-w-7xl mx-auto px-8 md:px-12 py-12">

                    <AnimatePresence mode="wait">

                        {/* ── VISUAL TAB ── */}
                        {activeTabKey === 'visual' && (
                            <motion.div key="visual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                                {presentationAssets.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                                        {presentationAssets.map(asset => {
                                            const url = resolveAssetUrl(asset.id, char.name, asset.hd ? 'HD' : 'SD');
                                            return (
                                                <motion.div key={asset.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                                                    onDoubleClick={() => openOnDblClick(url)}
                                                    onTouchEnd={(e) => openOnDblTap(e, url)}
                                                    title={t(lang, 'hint_zoom')}
                                                    className="group relative bg-[var(--surface-card)] border border-[var(--border-secondary)] rounded-2xl overflow-hidden aspect-square cursor-zoom-in">
                                                    <img src={url} alt={asset.label} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-[1.02]" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                                        <h3 className="text-sm font-bold text-[var(--text-primary)]">{asset.label}</h3>
                                                        {asset.hd && <span className="text-[9px] text-amber-400 font-mono uppercase tracking-widest">{t(lang, 'master_quality')}</span>}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}

                                {turnaroundAssets.length > 0 && (
                                    <>
                                        <p className="text-[var(--text-dim)] font-mono text-[10px] uppercase tracking-widest mb-4">
                                            {t(lang, 'turnaround_label', { count: turnaroundAssets.length })}
                                        </p>
                                        <div className="flex gap-4 overflow-x-auto pb-2" style={{ height: '500px' }}>
                                            {turnaroundAssets.map(asset => {
                                                const url = resolveAssetUrl(asset.id, char.name, 'SD');
                                                return (
                                                    <motion.div key={asset.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                                                        onDoubleClick={() => openOnDblClick(url)}
                                                        onTouchEnd={(e) => openOnDblTap(e, url)}
                                                        className="group relative h-full flex-shrink-0 bg-[var(--surface-card)] border border-[var(--border-secondary)] rounded-2xl overflow-hidden cursor-zoom-in"
                                                        style={{ width: 'calc(500px * 0.56)' }}>
                                                        <img src={url} alt="Turnaround" className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-700" />
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}

                                {presentationAssets.length === 0 && turnaroundAssets.length === 0 && (
                                    <div className="text-center py-24 text-[var(--text-dim)]">
                                        <p className="text-4xl mb-3 opacity-30">🎨</p>
                                        <p className="font-mono text-xs uppercase tracking-widest">{t(lang, 'visual_assets_dev')}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── NARRATIVA TAB ── */}
                        {activeTabKey === 'narrative' && (
                            <motion.div key="narrativa" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="flex flex-col gap-5 max-w-3xl">
                                {char.lore ? (
                                    <>
                                        <LoreCard tier="bio_short" icon="📖" title={t(lang, 'description_gen')} text={char.lore.bio_short} />
                                        <LoreCard tier="bio_full" icon="📚" title={t(lang, 'history_full')} text={char.lore.bio_full} />
                                        <LoreCard tier="psych_profile" icon="🧠" title={t(lang, 'psych_profile')} text={char.lore.psych_profile} />
                                    </>
                                ) : (
                                    <div className="text-center py-24 text-[var(--text-dim)]">
                                        <p className="text-4xl mb-3 opacity-30">📝</p>
                                        <p className="font-mono text-xs uppercase tracking-widest">{t(lang, 'narrative_assets_dev')}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── DATOS TAB ── */}
                        {activeTabKey === 'data' && (
                            <motion.div key="datos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="max-w-2xl">

                                {/* Ficha */}
                                <div className="bg-[var(--surface-card)] border border-[var(--border-secondary)] rounded-2xl overflow-hidden mb-6">
                                    {[
                                        [t(lang, 'label_name'), char.name],
                                        [t(lang, 'label_type'), t(lang, char.type.toLowerCase())],
                                        [t(lang, 'label_moral'), char.morality ? t(lang, char.morality) : '—'],
                                        [t(lang, 'label_id'), char.id],
                                        [t(lang, 'label_status'), char.status === 'active' ? t(lang, 'active_portal') : t(lang, 'in_development')],
                                    ].map(([label, value], i, arr) => (
                                        <div key={label} className={`flex items-center ${i < arr.length - 1 ? 'border-b border-[var(--border-secondary)]' : ''}`}>
                                            <span className="w-40 px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-[var(--text-dim)] flex-shrink-0">{label}</span>
                                            <span className="px-6 py-4 text-sm text-[var(--text-secondary)]">{value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Production progress */}
                                <div className="bg-[var(--surface-card)] border border-[var(--border-secondary)] rounded-2xl p-6">
                                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-dim)] mb-5">{t(lang, 'production_status')}</h3>
                                    {char.progress && Object.entries(char.progress).map(([key, val]) => (
                                        <div key={key} className="mb-4 last:mb-0">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)] opacity-80">{t(lang, `label_${key}`)}</span>
                                                <span className="text-xs font-mono text-[var(--text-dim)]">{val}%</span>
                                            </div>
                                            <div className="h-1 bg-[var(--border-primary)] rounded-full overflow-hidden">
                                                <motion.div className="h-full bg-[var(--text-secondary)] opacity-50 rounded-full"
                                                    initial={{ width: 0 }} animate={{ width: `${val}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ── GALERÍA TAB ── */}
                        {activeTabKey === 'gallery' && (
                            <motion.div key="galeria" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold mb-1">{t(lang, 'gallery_archive')}</h3>
                                    <p className="text-[var(--text-dim)] text-[10px] font-mono uppercase tracking-widest">
                                        {t(lang, 'gallery_sub')}
                                    </p>
                                </div>

                                {galleryManifest[char.name] ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {[
                                            ...galleryManifest[char.name].SD.map(id => ({ id, type: 'SD' })),
                                            ...galleryManifest[char.name].HD.map(id => ({ id, type: 'HD' }))
                                        ].map((asset, i) => {
                                            const url = resolveAssetUrl(asset.id, char.name, asset.type);
                                            return (
                                                <motion.div
                                                    key={`${asset.id}-${i}`}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.02 }}
                                                    onDoubleClick={() => openOnDblClick(url)}
                                                    onTouchEnd={(e) => openOnDblTap(e, url)}
                                                    className="group relative aspect-square bg-[var(--surface-card)] border border-[var(--border-secondary)] rounded-xl overflow-hidden cursor-zoom-in"
                                                >
                                                    <img
                                                        src={url}
                                                        alt={asset.id}
                                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-[var(--bg-primary)]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <p className="text-[8px] font-mono whitespace-nowrap overflow-hidden text-ellipsis text-[var(--text-primary)] opacity-80">
                                                            {asset.id}
                                                        </p>
                                                        {asset.type === 'HD' && (
                                                            <span className="text-[7px] bg-amber-500/20 text-amber-400 px-1 rounded font-bold">HD</span>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-24 text-[var(--text-dim)]">
                                        <ImageIcon className="mx-auto mb-4 opacity-20" size={48} />
                                        <p className="font-mono text-xs uppercase tracking-widest text-center">{t(lang, 'no_assets')}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}
