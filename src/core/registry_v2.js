// ════════════════════════════════════════════════════════
// REGISTRY_V2.JS — Esquema de Ficha de Personaje 2.0
// ════════════════════════════════════════════════════════

export const MODULE_REGISTRY_V2 = {
    // ── MITA (01) ──────────────────────────────────────────────────
    '03.02.03.01': {
        id: '03.02.03.01',
        name: 'Mita',
        type: 'Principal',
        morality: 'positivo',
        status: 'active',
        
        // 1. INFORMACIÓN VISUAL (Acting Segmentado)
        visual: {
            concept_full_body: '03.02.03.01.03.01_Concepto_General',
            approved_face: '03.02.03.01.03.08_Referencia_Facial',
            acting: {
                body: [
                    '03.02.03.01.04.50.01_Mita_Hero_1-1_PoseA_v01',
                    '03.02.03.01.04.50.01_Mita_Hero_1-1_PoseB_v01'
                ],
                face: [
                    '03.02.03.01.03.12.01_Alegre',
                    '03.02.03.01.03.12.05_Curiosa'
                ],
                hands: [] // Pendiente
            }
        },
        
        // 2. INFORMACIÓN TÉCNICA (Turnaround 8 Vistas)
        technical: {
            body_turnaround: [
                '03.02.03.01.03.04.01_Frontal',           // 1. Frontal
                '03.02.03.01.03.04.02_Frontal_Derecho',   // 2. 3/4 Front R
                null,                                    // 3. Right (Missing)
                null,                                    // 4. 3/4 Back R (Missing)
                '03.02.03.01.03.04.05_Posterior',         // 5. Posterior
                '03.02.03.01.03.04.06_Posterior_Izquierdo', // 6. 3/4 Back L
                '03.02.03.01.03.04.07_Izquierdo',         // 7. Left
                null                                     // 8. 3/4 Front L (Missing)
            ],
            face_turnaround: [
                '03.02.03.01.03.10.01_Frontal',
                null,
                '03.02.03.01.03.10.03_Lateral_Derecho',
                null,
                '03.02.03.01.03.10.02_Posterior',
                null,
                '03.02.03.01.03.10.04_Lateral_Izquierdo',
                null
            ]
        },
        
        // 3. INFORMACIÓN NARRATIVA
        narrative: {
            basic_web: 'Exploradora valiente con una conexión especial con el Mar Interior y sus criaturas. Protectora instintiva de quienes la rodean.',
            levels: {
                kids: 'Mita es una niña muy valiente a la que le encanta explorar la playa y ayudar a los animalitos del mar. ¡Siempre cuida de su hermanito Cito!',
                educator: 'El personaje de Mita funciona como un modelo de conducta asertiva (Payoff #6) y autorregulación emocional (Payoff #5). Su arco enfatiza la importancia de los vínculos familiares como motores de seguridad.',
                team: 'Perfil psicológico: alta empatía con sesgo protector. Toma decisiones rápidas bajo presión. Arquetipo: El Guía. Su diseño visual debe mantener la asimetría funcional en su vestuario.',
                vip: 'Mita representa el valor central de la franquicia: la resiliencia infantil frente a la ausencia adulta. Es el IP core para la línea de productos de exploración.',
                host: 'CONFIDENCIAL: Mita heredará la brújula de los Guardianes en el Acto 3, revelando que su conexión con el Mar es genética, no solo espiritual. Todo el lore previo de "Alma" se integra aquí.'
            }
        },
        
        // 4. ESTADO DE PRODUCCIÓN
        production: [
            { stage: 'Narrativa', status: 80 },
            { stage: 'Diseño Arte', status: 75 },
            { stage: 'Activos HD', status: 10 },
            { stage: 'Animación (Acting)', status: 40 }
        ]
    },

    // ── CITO (02) ──────────────────────────────────────────────────
    '03.02.03.02': {
        id: '03.02.03.02',
        name: 'Cito',
        type: 'Principal',
        morality: 'positivo',
        status: 'active',
        
        visual: {
            concept_full_body: '03.02.03.02.03.01_Concepto_Maestro',
            approved_face: '03.02.03.02.03.14.02_Detalle_Cabello_Refinado',
            acting: {
                body: [
                    '03.02.03.02.03.14.01_Interaccion_Abeja_Flor',
                    '03.02.03.02.03.14.05_Interaccion_Castillo_Arena'
                ],
                face: [
                    '03.02.03.02.03.14.10_Interaccion_Mariposa'
                ],
                hands: []
            }
        },
        technical: {
            body_turnaround: Array(8).fill(null).map((_, i) => i === 0 ? '03.02.03.02.03.12_Grid_4x4_Master' : null),
            face_turnaround: Array(8).fill(null)
        },
        narrative: {
            basic_web: 'Infante curioso con una energía pura que atrae a las criaturas de la isla. El corazón de cada aventura.',
            levels: {
                kids: '¡Cito es súper curioso! Le encanta jugar en la arena y hacer nuevos amigos, incluso si son cangrejos o mariposas.',
                educator: 'Cito representa el asombro puro y la curiosidad sin miedo (neuroplasticidad activa). Catalizador narrativo que activa la magia latente por proximidad.',
                team: 'Perfil psicológico: curiosidad pura sin filtro de peligro. Sin estructura cortical de miedo desarrollada. Arquetipo: El Niño / El Trickster Inocente.',
                vip: 'Cito es el personaje de mayor "toyability" del proyecto. Su diseño busca la empatía inmediata mediante proporciones de "baby schema".',
                host: 'Cito es el único que puede ver al Guardián del Eco sin que este se manifieste físicamente, debido a su frecuencia vibratoria de inocencia.'
            }
        },
        production: [
            { stage: 'Narrativa', status: 80 },
            { stage: 'Diseño Arte', status: 70 },
            { stage: 'Activos HD', status: 50 },
            { stage: 'Animación (Acting)', status: 20 }
        ]
    },
    
    // ── PADRE (03) ──────────────────────────────────────────────────
    '03.02.03.03': {
        id: '03.02.03.03',
        name: 'Padre',
        type: 'Principal',
        morality: 'positivo',
        status: 'active',
        visual: {
            concept_full_body: '03.02.03.03.03.01_Concepto_Maestro_Vestuario_General',
            approved_face: '03.02.03.03.03.09.01_Frontal',
            acting: { body: [], face: [], hands: [] }
        },
        technical: {
            body_turnaround: [
                '03.02.03.03.03.09.01_Frontal',           // 1. Frontal
                null,                                    // 2
                '03.02.03.03.03.09.03_Lateral_Derecho',   // 3. Right
                null,                                    // 4
                '03.02.03.03.03.09.02_Posterior',         // 5. Posterior
                null,                                    // 6
                '03.02.03.03.03.09.04_Lateral_Izquierdo', // 7. Left
                null                                     // 8
            ],
            face_turnaround: Array(8).fill(null)
        },
        narrative: {
            basic_web: 'Padre abnegado y pilar de su hogar. Un hombre de pocas palabras pero acciones firmes.',
            levels: {
                kids: 'El Papá de la Isla es muy fuerte y siempre está trabajando para que todos estemos seguros.',
                educator: 'Representa la figura de protección y estabilidad. Su arco trata sobre la carga del deber silente.',
                team: 'Perfil psicológico: Altamente resiliente. Fuerte sentido del deber personal. Arquetipo: El Guardián.',
                vip: 'El Padre es el ancla emocional de la serie, proporcionando el contraste de realismo frente a la magia de los niños.',
                host: 'CONFIDENCIAL: El Padre conoce el secreto del Mar Interior pero ha elegido el silencio para proteger a sus hijos del destino de los Guardianes.'
            }
        },
        production: [
            { stage: 'Narrativa', status: 100 },
            { stage: 'Diseño Arte', status: 100 },
            { stage: 'Activos HD', status: 0 },
            { stage: 'Animación (Acting)', status: 0 }
        ]
    }
};
