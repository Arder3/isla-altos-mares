import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveAssetUrl } from '../core/AssetResolver';
import { MODULE_REGISTRY_V2 } from '../core/registry_v2';
import galleryManifest from '../core/gallery_manifest.json';
import { getTranslation as t } from '../core/i18n';
import { ArrowLeft, Lock, Info, Image as ImageIcon, Cpu, BookOpen, BarChart3 } from 'lucide-react';

const MORALITY_COLOR = { positivo: 'text-emerald-400', negativo: 'text-rose-400', neutral: 'text-amber-400' };

const TURNAROUND_LABELS = [
    '01. Frontal',
    '02. 3/4 Frontal D',
    '03. Lateral Derecho',
    '04. 3/4 Posterior D',
    '05. Posterior',
    '06. 3/4 Posterior I',
    '07. Lateral Izquierdo',
    '08. 3/4 Frontal I'
];

const WorkInProgress = ({ label, ratio = 'aspect-square' }) => (
    <div className={`relative ${ratio} bg-slate-900/40 border border-slate-800/50 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 group`}>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="w-12 h-12 rounded-full border border-slate-700/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
            <ImageIcon size={20} className="text-slate-600" />
        </div>
        <div className="text-center space-y-1">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{label || 'Estudio en Proceso'}</p>
            <p className="text-[8px] font-mono text-slate-700 uppercase tracking-tighter italic">Pending Asset v2.0</p>
        </div>
        <div className="absolute top-3 right-3 flex gap-1">
            <div className="w-1 h-1 rounded-full bg-amber-500/40 animate-pulse" />
            <div className="w-1 h-1 rounded-full bg-amber-500/20" />
        </div>
    </div>
);

export default function CharacterViewV2({ lang, charId, activeProfile, onBack }) {
    const char = MODULE_REGISTRY_V2[charId];
    if (!char) return <div className="p-12 text-center font-mono opacity-50 uppercase tracking-widest">Character data 2.0 not found</div>;

    const [activeTab, setActiveTab] = useState('visual');
    const [isVertical, setIsVertical] = React.useState(window.matchMedia('(orientation: portrait)').matches);
    const [isPc, setIsPc] = React.useState(window.innerWidth > 1024 || window.matchMedia('(pointer: fine)').matches);

    React.useEffect(() => {
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

    // ── SMART HERO FALLBACK ──
    const getSmartHero = () => {
        const manifest = galleryManifest[char.name];
        const findHero = (arr = [], heroRatio, poseFilter = null) => {
            if (!arr) return null;
            return arr.find(id => {
                const r = heroRatio.replace('-', 'x');
                const matchRatio = id.includes(`Hero_${heroRatio}`) || id.includes(`Hero_${r}`) || id.includes(`_${heroRatio}`) || id.includes(`_${r}`);
                const matchPose = poseFilter ? id.includes(poseFilter) : true;
                return (matchRatio || id.includes('Blueprint')) && matchPose;
            });
        };

        if (manifest) {
            if (char.name === 'Mita') {
                const hdMita = isPc 
                    ? manifest.HD.find(id => id.includes('PoseA') && id.includes('2-1') && id.includes('Top'))
                    : manifest.HD.find(id => id.includes('PoseB') && id.includes('1-1'));
                if (hdMita) return { id: hdMita, type: 'HD' };
            }
            let ratio = isVertical ? '1-1' : '2-1';
            const priorityPose = isPc ? 'PoseA' : 'PoseB';
            const hdPriority = findHero(manifest.HD, ratio, priorityPose);
            if (hdPriority) return { id: hdPriority, type: 'HD' };
            const sdPriority = findHero(manifest.SD, ratio, priorityPose);
            if (sdPriority) return { id: sdPriority, type: 'SD' };
            const hdMatch = findHero(manifest.HD, ratio);
            if (hdMatch) return { id: hdMatch, type: 'HD' };
            const sdMatch = findHero(manifest.SD, ratio);
            if (sdMatch) return { id: sdMatch, type: 'SD' };
            const hdAny = findHero(manifest.HD, '1-1') || manifest.HD[0];
            if (hdAny) return { id: hdAny, type: 'HD' };
        }
        return { id: char.visual?.concept_full_body || char.visual?.approved_face, type: 'SD' };
    };

    const smartHero = getSmartHero();
    const heroUrl = smartHero.id ? resolveAssetUrl(smartHero.id, char.name, smartHero.type) : null;

    // ── NARRATIVE ACCESS LOGIC ──
    const getVisibleNarrative = () => {
        const levels = char.narrative.levels;
        const isHost = activeProfile === 'equipo' || activeProfile === 'confidente' || activeProfile === 'host';
        
        if (isHost) {
            return [
                { id: 'kids', label: t(lang, 'level_kids'), content: levels.kids },
                { id: 'educator', label: t(lang, 'level_educator'), content: levels.educator },
                { id: 'team', label: t(lang, 'level_team'), content: levels.team },
                { id: 'vip', label: t(lang, 'level_vip'), content: levels.vip },
                { id: 'host', label: t(lang, 'level_host'), content: levels.host }
            ];
        }

        const roleMap = {
            child: [{ id: 'kids', label: t(lang, 'level_kids'), content: levels.kids }],
            producer: [{ id: 'educator', label: t(lang, 'level_educator'), content: levels.educator }],
            investor: [{ id: 'vip', label: t(lang, 'level_vip'), content: levels.vip }],
            equipo: [{ id: 'team', label: t(lang, 'level_team'), content: levels.team }]
        };

        return roleMap[activeProfile] || [{ id: 'basic', label: t(lang, 'basic_description'), content: char.narrative.basic_web }];
    };

    const visibleNarrative = getVisibleNarrative();

    // ── HELPERS ──
    const AssetCard = ({ id, label, isTurnaround = false }) => {
        const url = resolveAssetUrl(id, char.name, 'SD');
        return (
            <div className={`relative bg-[var(--surface-card)] border border-[var(--border-secondary)] rounded-2xl overflow-hidden group ${isTurnaround ? 'aspect-[3/4]' : 'aspect-square'}`}>
                <img src={url} alt={label} className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-primary)]">{label}</p>
                    <p className="text-[8px] font-mono text-[var(--text-dim)] truncate">{id}</p>
                </div>
            </div>
        );
    };

    const SectionHeader = ({ icon: Icon, title }) => (
        <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-primary)] pb-2">
            <Icon size={18} className="text-[var(--text-secondary)]" />
            <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-[var(--text-primary)]">{title}</h2>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-24">
            {/* Header Inmersivo (Hero Zone) */}
            <div className="relative overflow-hidden bg-[var(--bg-primary)] transition-all duration-500" 
                 style={{ minHeight: isVertical ? '65vh' : '45vw', maxHeight: '85vh' }}>
                
                {/* Background Image / Backdrop */}
                {heroUrl && (
                    <div className="absolute inset-0 z-0">
                        <motion.img 
                            initial={{ opacity: 0, scale: 1.1 }} 
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.2 }}
                            src={heroUrl} alt={char.name}
                            className="w-full h-full object-cover object-top opacity-100"
                            style={{
                                maskImage: 'linear-gradient(to left, black 30%, transparent 95%), linear-gradient(to top, black 30%, transparent 95%)',
                                WebkitMaskImage: 'linear-gradient(to left, black 30%, transparent 95%), linear-gradient(to top, black 30%, transparent 95%)'
                            }}
                        />
                    </div>
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-primary)]/70 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between h-full p-8 md:p-12" 
                     style={{ minHeight: isVertical ? '65vh' : '45vw', maxHeight: '85vh' }}>
                    
                    <button onClick={onBack} className="flex items-center gap-2 text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors group self-start feedback-ignore">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-mono text-[10px] uppercase tracking-widest">{t(lang, 'back')}</span>
                    </button>

                    <div className="mt-auto">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-3 mb-4"
                        >
                            <span className="text-amber-500 text-[10px] font-mono border border-amber-500/30 px-2 py-0.5 rounded backdrop-blur-md">V2.0 EXPERIMENTAL</span>
                            <span className="text-[var(--text-dim)] font-mono text-[10px] uppercase tracking-widest">{char.type} · ID {char.id}</span>
                            <span className={`font-mono text-[10px] uppercase tracking-widest ${MORALITY_COLOR[char.morality] || 'text-[var(--text-dim)]'}`}>
                                ✦ {t(lang, char.morality || 'neutral')}
                            </span>
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, x: -20 }} 
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85] mb-6"
                        >
                            {char.name}
                        </motion.h1>

                        {char.narrative.basic_web && (
                            <motion.p 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="text-[var(--text-secondary)] text-sm md:text-base leading-relaxed max-w-xl opacity-80"
                            >
                                {char.narrative.basic_web}
                            </motion.p>
                        )}
                    </div>
                </div>
            </div>

            {/* Grid Layout 2.0 Content */}
            <div className="px-8 md:px-12 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left Column: Visual & Technical (8 cols) */}
                    <div className="lg:col-span-8 flex flex-col gap-16">
                        
                        {/* 1. Información Visual */}
                        <section>
                            <SectionHeader icon={ImageIcon} title={t(lang, 'info_visual')} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-dim)]">{t(lang, 'concept_full_body')}</p>
                                    <AssetCard id={char.visual.concept_full_body} label={t(lang, 'concept_full_body')} />
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-dim)]">{t(lang, 'approved_face')}</p>
                                    <AssetCard id={char.visual.approved_face} label={t(lang, 'approved_face')} />
                                </div>
                            </div>
                            <div className="mt-12 space-y-10">
                                {/* Corporal */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-4 h-px bg-[var(--text-dim)]/30" />
                                        <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--text-dim)]">Expresión Corporal</p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {char.visual.acting.body.length > 0 ? (
                                            char.visual.acting.body.map(id => <AssetCard key={id} id={id} label="Acting Body" />)
                                        ) : (
                                            <WorkInProgress label="Corporal Pendiente" />
                                        )}
                                    </div>
                                </div>

                                {/* Facial */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-4 h-px bg-[var(--text-dim)]/30" />
                                        <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--text-dim)]">Expresión Facial</p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {char.visual.acting.face.length > 0 ? (
                                            char.visual.acting.face.map(id => <AssetCard key={id} id={id} label="Acting Face" />)
                                        ) : (
                                            <WorkInProgress label="Facial Pendiente" />
                                        )}
                                    </div>
                                </div>

                                {/* Manos */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-4 h-px bg-[var(--text-dim)]/30" />
                                        <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--text-dim)]">Expresión de Manos</p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {char.visual.acting.hands.length > 0 ? (
                                            char.visual.acting.hands.map(id => <AssetCard key={id} id={id} label="Hand Acting" />)
                                        ) : (
                                            <WorkInProgress label="Manos Pendiente" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. Información Técnica */}
                        <section>
                            <SectionHeader icon={Cpu} title={t(lang, 'info_tecnica')} />
                            <div className="space-y-12">
                                <div>
                                    <div className="flex justify-between items-end mb-6">
                                        <div>
                                            <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-dim)]">{t(lang, 'body_turnaround')}</p>
                                            <h3 className="text-xl font-bold uppercase tracking-tighter">Secuencia Cam-Rotate (8 pts)</h3>
                                        </div>
                                        <div className="hidden md:block text-[8px] font-mono text-[var(--text-dim)] border border-[var(--border-secondary)] px-2 py-1 rounded">
                                            ISO_STANDARD_8V
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {char.technical.body_turnaround.map((id, idx) => (
                                            id ? (
                                                <div key={`${id}-${idx}`} className="space-y-2">
                                                    <AssetCard id={id} label={TURNAROUND_LABELS[idx]} isTurnaround />
                                                    <p className="text-[8px] font-mono text-center opacity-40">{TURNAROUND_LABELS[idx]}</p>
                                                </div>
                                            ) : (
                                                <div key={`wip-body-${idx}`} className="space-y-2">
                                                    <WorkInProgress label={TURNAROUND_LABELS[idx]} ratio="aspect-[3/4]" />
                                                    <p className="text-[8px] font-mono text-center opacity-20">{TURNAROUND_LABELS[idx]}</p>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-end mb-6">
                                        <div>
                                            <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-dim)]">{t(lang, 'face_turnaround')}</p>
                                            <h3 className="text-xl font-bold uppercase tracking-tighter">Estudio Facial (8 pts)</h3>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {char.technical.face_turnaround.map((id, idx) => (
                                            id ? (
                                                <div key={`${id}-${idx}`} className="space-y-2">
                                                    <AssetCard id={id} label={TURNAROUND_LABELS[idx]} isTurnaround />
                                                    <p className="text-[8px] font-mono text-center opacity-40">{TURNAROUND_LABELS[idx]}</p>
                                                </div>
                                            ) : (
                                                <div key={`wip-face-${idx}`} className="space-y-2">
                                                    <WorkInProgress label={TURNAROUND_LABELS[idx]} ratio="aspect-[3/4]" />
                                                    <p className="text-[8px] font-mono text-center opacity-20">{TURNAROUND_LABELS[idx]}</p>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Narrative & Production (4 cols) */}
                    <div className="lg:col-span-4 flex flex-col gap-12">
                        
                        {/* 3. Información Narrativa */}
                        <section className="bg-[var(--surface-card)] border border-[var(--border-secondary)] rounded-3xl p-8">
                            <SectionHeader icon={BookOpen} title={t(lang, 'info_narrativa')} />
                            <div className="space-y-8">
                                {visibleNarrative.map((lv, idx) => (
                                    <div key={lv.id} className={`${idx > 0 ? 'border-t border-[var(--border-primary)] pt-6' : ''}`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)]" />
                                            <h3 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-secondary)]">{lv.label}</h3>
                                        </div>
                                        <p className="text-sm leading-relaxed text-[var(--text-primary)] opacity-80 italic">
                                            "{lv.content}"
                                        </p>
                                    </div>
                                ))}
                                {visibleNarrative.length === 0 && (
                                    <p className="text-xs text-[var(--text-dim)] italic">{t(lang, 'restricted_content')}</p>
                                )}
                            </div>
                        </section>

                        {/* 4. Estado de Producción */}
                        <section className="bg-[var(--surface-card)] border border-[var(--border-secondary)] rounded-3xl p-8">
                            <SectionHeader icon={BarChart3} title={t(lang, 'info_produccion')} />
                            <div className="space-y-6">
                                {char.production.map(p => (
                                    <div key={p.stage}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-dim)]">{p.stage}</span>
                                            <span className="text-[10px] font-mono text-[var(--text-secondary)]">{p.status}%</span>
                                        </div>
                                        <div className="h-1 bg-[var(--border-primary)] rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-[var(--text-secondary)] opacity-60 rounded-full transition-all duration-1000"
                                                style={{ width: `${p.status}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
