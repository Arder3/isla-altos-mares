import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Breadcrumbs({ activeSection, selectedCharId, charName, onNavigate, lang }) {
  const items = [
    { id: 'home', label: 'Portal', icon: <Home size={12} /> }
  ];

  if (activeSection) {
    const sectionLabels = {
      characters: lang === 'es' ? 'Personajes' : 'Characters',
      characters_v2: lang === 'es' ? 'Ficha 2.0' : 'Character 2.0',
      browser: lang === 'es' ? 'Explorador' : 'Browser',
      creatures: lang === 'es' ? 'Criaturas' : 'Creatures',
      world: lang === 'es' ? 'Mundo' : 'World',
      map: lang === 'es' ? 'Mapa' : 'Map',
      artifacts: lang === 'es' ? 'Artefactos' : 'Artifacts'
    };
    items.push({ id: 'section', label: sectionLabels[activeSection] || activeSection });
  }

  if (selectedCharId && charName) {
    items.push({ id: 'char', label: charName });
  }

  return (
    <nav className="flex items-center gap-2 mb-6 pointer-events-auto feedback-ignore">
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && <ChevronRight size={12} className="text-[var(--text-dim)]/50" />}
          <motion.button
            whileHover={{ x: 2 }}
            onClick={() => {
              if (item.id === 'home') onNavigate('home');
              if (item.id === 'section') onNavigate('section');
            }}
            className={`flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest transition-colors ${
              index === items.length - 1 
                ? 'text-[var(--text-primary)] font-bold cursor-default' 
                : 'text-[var(--text-dim)] hover:text-[var(--accent-primary)]'
            }`}
          >
            {item.icon}
            {item.label}
          </motion.button>
        </React.Fragment>
      ))}
    </nav>
  );
}
