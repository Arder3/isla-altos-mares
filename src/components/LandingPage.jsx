import React from 'react';
import { motion } from 'framer-motion';
import { Smile, BookOpen, Layout, TrendingUp, Terminal } from 'lucide-react';

const profiles = [
    {
        id: 'child',
        title: 'NIÑOS',
        desc: 'Aventura interactiva',
        icon: <Smile className="text-pink-400" size={32} />
    },
    {
        id: 'educator',
        title: 'EDUCADORES',
        desc: 'Material didáctico',
        icon: <BookOpen className="text-blue-400" size={32} />
    },
    {
        id: 'producer',
        title: 'CREATIVOS',
        desc: 'Pipeline y Activos',
        icon: <Layout className="text-purple-400" size={32} />
    },
    {
        id: 'investor',
        title: 'INVERSORES',
        desc: 'Progreso y Valor',
        icon: <TrendingUp className="text-amber-400" size={32} />
    },
    {
        id: 'equipo',
        title: 'EQUIPO',
        desc: 'Acceso Interno',
        icon: <Terminal className="text-emerald-400" size={32} />
    },
];

export default function LandingPage({ onSelectProfile }) {
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 font-sans selection:bg-white/20">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[35%] h-[35%] bg-purple-500/10 blur-[120px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16 z-10"
            >
                <h1 className="text-8xl font-black mb-4 tracking-tighter uppercase leading-[0.8]">
                    Isla de Altos Mares
                </h1>
                <p className="text-white/40 font-mono text-sm tracking-widest uppercase opacity-80 decoration-white/10">Portal de Acceso Unificado • Sistema Modular ID 04.02</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl w-full z-10">
                {profiles.map((profile, index) => (
                    <motion.div
                        key={profile.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05, y: -10 }}
                        onClick={() => onSelectProfile(profile.id)}
                        className="group cursor-pointer relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
                        <div className="relative bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-8 rounded-3xl h-full flex flex-col items-center text-center transition-all duration-300 group-hover:border-white/20">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 shadow-2xl transition-all group-hover:bg-white/10">
                                {profile.icon}
                            </div>
                            <h2 className="text-2xl font-black mb-2 tracking-tighter group-hover:text-white transition-colors">{profile.title}</h2>
                            <p className="text-white/40 text-xs font-mono uppercase tracking-widest leading-tight">{profile.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.footer
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 1 }}
                className="mt-16 text-xs font-mono tracking-widest uppercase border-t border-white/10 pt-8"
            >
                Industrial Standard ArchiV4.0 • Google Drive Realtime Sync
            </motion.footer>
        </div>
    );
}
