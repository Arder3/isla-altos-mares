// ════════════════════════════════════════════════════════
// REGISTRY.JS — Fuente de verdad del portal
//
// SYNC manual desde CSV de producción:
//   01.03.03/04/05_Listado_Personajes_*.csv
// TODO: build script de sincronización automática
// ════════════════════════════════════════════════════════

export const PROJECT_ID_HIERARCHY = {
    root: '04', proyectos: '04.02', universo: '03', arte: '03.02', personajes: '03.02.03'
};

// status:   'active' | 'coming_soon'
// type:     'Principal' | 'Secundario' | 'NPC'
// morality: 'positivo' | 'negativo' | 'neutral'
// lore:     { bio_short, bio_full, psych_profile } — acceso por rol en NarrativaTab

export const MODULE_REGISTRY = {

    // ── PRINCIPALES — ACTIVOS ──────────────────────────────────────
    '03.02.03.01': {
        id: '03.02.03.01', name: 'Mita', type: 'Principal', morality: 'positivo', status: 'active',
        progress: { narrativa: 80, arte: 75, hd: 0 },
        lore: {
            bio_short: 'Exploradora valiente con una conexión especial con el Mar Interior y sus criaturas. Protectora instintiva de quienes la rodean, lidera cada aventura con intuición y coraje.',
            bio_full: 'Mita creció escuchando las historias del Mar Interior desde la costa del pueblo. Desde niña sintió que el mar le hablaba, y lo que parecía imaginación resultó ser un vínculo real con la isla. Su rol como protectora nació naturalmente cuando Cito apareció en su vida — desde ese momento, guiarle se convirtió en su propósito más claro. Su magia no es espectacular sino silenciosa: las criaturas confían en ella, los caminos se abren ante sus pasos.',
            psych_profile: 'Perfil psicológico: alta empatía con sesgo protector. Toma decisiones rápidas bajo presión pero carga el peso emocional en privado. Su fortaleza es a la vez su vulnerabilidad — le cuesta pedir ayuda. Relación con Cito activada por instinto maternal desplazado. Arquetipo: El Guía / La Protectora.'
        },
        assets: {
            concept: '03.02.03.01.03.01_Concepto_General',
            hero: {
                '1-1': ['v1', 'v2', 'v3'],
                '1-2': ['v1', 'v2'],
                '2-1': ['v1']
            },
            turnaround: [
                '03.02.03.01.03.09.01_Frontal',
                '03.02.03.01.03.09.02_Posterior',
                '03.02.03.01.03.09.03_Lateral'
            ]
        }
    },

	'03.02.03.02': {
		id: '03.02.03.02', name: 'Cito', type: 'Principal', morality: 'positivo', status: 'active',
		progress: { narrativa: 80, arte: 70, hd: 0 },
		lore: {
			bio_short: 'Infante curioso con una energía pura que atrae a las criaturas de la isla. Su inocencia desbloquea misterios que los adultos no pueden ver. El corazón de cada aventura.',
			bio_full: 'Cito no tiene miedo porque aún no sabe que debería tenerlo. Esa inocencia es su superpoder. Las criaturas de la isla lo reconocen como algo distinto — no una amenaza, sino parte del ecosistema. Su magia es involuntaria: donde Cito va, el mundo responde. Desde que apareció en la vida de Mita, cada día es un descubrimiento nuevo para ambos.',
			psych_profile: 'Perfil psicológico: curiosidad pura sin filtro de peligro. Sin estructura cortical de miedo desarrollada. Responde al mundo con asombro total. Catalizador narrativo — su presencia activa la magia latente. Arquetipo: El Niño / El Trickster Inocente.'
		},
		assets: {
			concept: '03.02.03.02.03.01_Concept_Maestro',
			hero: {
				'1-1': 'v1',
				'1-2': ['v1', 'v2', 'v3', 'v4'],
				'2-1': ['v1', 'v2']
			},
			acting: [
				'03.02.03.02.03.14.01_Interaccion_Abeja_Flor',
				'03.02.03.02.03.14.05_Interaccion_Castillo_Arena',
				'03.02.03.02.03.14.10_Interaccion_Mariposa'
			]
		}
	},

    // ── PRINCIPALES — EN DESARROLLO ───────────────────────────────
    '03.02.03.03': {
        id: '03.02.03.03', name: 'El Padre', type: 'Principal', morality: 'positivo', status: 'coming_soon',
        gradient: 'from-amber-950 via-stone-900 to-amber-900',
        progress: { narrativa: 80, arte: 0, hd: 0 }, assets: {}
    },
    '03.02.03.04': {
        id: '03.02.03.04', name: 'Capitán Barracuda', type: 'Principal', morality: 'negativo', status: 'coming_soon',
        gradient: 'from-cyan-950 via-blue-950 to-teal-900',
        progress: { narrativa: 100, arte: 0, hd: 0 }, assets: {}
    },
    '03.02.03.05': {
        id: '03.02.03.05', name: 'Guardián del Eco', type: 'Principal', morality: 'neutral', status: 'coming_soon',
        gradient: 'from-emerald-950 via-green-950 to-teal-900',
        progress: { narrativa: 80, arte: 0, hd: 0 }, assets: {}
    },

    // ── SECUNDARIOS — EN DESARROLLO ───────────────────────────────
    '03.02.04.01': { id: '03.02.04.01', name: 'Sofía', type: 'Secundario', morality: 'positivo', status: 'coming_soon', gradient: 'from-purple-950 via-fuchsia-950 to-pink-900', progress: { narrativa: 33, arte: 0, hd: 0 }, assets: {} },
    '03.02.04.02': { id: '03.02.04.02', name: 'Papá Gato', type: 'Secundario', morality: 'neutral', status: 'coming_soon', gradient: 'from-orange-950 via-amber-900 to-yellow-900', progress: { narrativa: 33, arte: 0, hd: 0 }, assets: {} },
    '03.02.04.03': { id: '03.02.04.03', name: 'Mamá Gata', type: 'Secundario', morality: 'positivo', status: 'coming_soon', gradient: 'from-rose-950 via-pink-900 to-red-900', progress: { narrativa: 33, arte: 0, hd: 0 }, assets: {} },
    '03.02.04.04': { id: '03.02.04.04', name: 'Gatita Gema', type: 'Secundario', morality: 'positivo', status: 'coming_soon', gradient: 'from-teal-950 via-cyan-900 to-sky-900', progress: { narrativa: 33, arte: 0, hd: 0 }, assets: {} },
    '03.02.04.05': { id: '03.02.04.05', name: 'Gatita Joya', type: 'Secundario', morality: 'positivo', status: 'coming_soon', gradient: 'from-violet-950 via-purple-900 to-indigo-900', progress: { narrativa: 33, arte: 0, hd: 0 }, assets: {} },

    // ── NPC — EN DESARROLLO ───────────────────────────────────────
    '03.02.05.01': { id: '03.02.05.01', name: 'Estegosaurio Valiente', type: 'NPC', morality: 'positivo', status: 'coming_soon', gradient: 'from-lime-950 via-green-900 to-emerald-900', progress: { narrativa: 50, arte: 0, hd: 0 }, assets: {} },
    '03.02.05.02': { id: '03.02.05.02', name: 'Pteranodon Guía', type: 'NPC', morality: 'neutral', status: 'coming_soon', gradient: 'from-sky-950 via-blue-900 to-indigo-900', progress: { narrativa: 50, arte: 0, hd: 0 }, assets: {} },
};

export const PROFILE_REGISTRY = {
    child: { id: 'child', theme: 'playful', access: ['03.02.03.01.03.01', '03.02.03.01.03.14', '03.02.03.02.03.01', '03.02.03.02.03.14'] },
    educator: { id: 'educator', theme: 'structured', access: ['03.02.03.01', '03.02.03.02'] },
    producer: { id: 'producer', theme: 'industrial', access: ['03.02.03.01', '03.02.03.02'] },
    investor: { id: 'investor', theme: 'premium', access: ['03.02.03.01', '03.02.03.02'] },
    equipo: { id: 'equipo', theme: 'technical', access: ['03.02.03.01', '03.02.03.02'] },
};

// Lore access tiers:
// bio_short   → all profiles
// bio_full    → investor, equipo, producer
// psych_profile → equipo only
export const LORE_ACCESS = {
    bio_short: ['child', 'educator', 'producer', 'investor', 'equipo'],
    bio_full: ['producer', 'investor', 'equipo'],
    psych_profile: ['equipo'],
};
