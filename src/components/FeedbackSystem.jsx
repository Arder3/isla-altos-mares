import React, { useState, useEffect, createContext, useContext } from 'react';
import AIAnnotator from './AIAnnotator';
import SelectionOverlay from './SelectionOverlay';
import { MessageSquare, Target, Highlighter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FeedbackContext = createContext();

export const useFeedback = () => useContext(FeedbackContext);

export function FeedbackProvider({ children, isHost, user, profile }) {
  const [activeMode, setActiveMode] = useState(null); // 'ia' | 'team' | 'text' | null
  const [showMenu, setShowMenu] = useState(false);
  const [iaTool, setIaTool] = useState('area'); // 'area' | 'element' | 'text'

  // Shortcut to toggle IA mode (Alt+A for Annotate)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'a' && isHost) {
        setActiveMode(prev => prev === 'ia' ? null : 'ia');
        setIaTool('area');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHost]);

  const handleToolSelection = (tool) => {
    setIaTool(tool);
    setActiveMode('unified_selection');
    setShowMenu(false);
  };

  return (
    <FeedbackContext.Provider value={{ activeMode, setActiveMode }}>
      {children}
      
      {/* Floating Action Menu */}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-3">
        <AnimatePresence>
          {showMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="flex flex-col gap-3 mb-2"
            >
              {[
                { id: 'area', icon: Target, label: 'Área Libre', color: 'bg-rose-500' },
                { id: 'element', icon: MessageSquare, label: 'Elemento UI', color: 'bg-blue-500' },
                { id: 'text', icon: Highlighter, label: 'Anotar Texto', color: 'bg-amber-500' }
              ].map(tool => (
                <button 
                  key={tool.id}
                  onClick={() => handleToolSelection(tool.id)}
                  className={`${tool.color} text-white p-3.5 rounded-full shadow-2xl hover:scale-110 transition-transform group relative border-2 border-white/20`}
                  title={tool.label}
                >
                  <tool.icon size={22} />
                  <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-[var(--bg-primary)] border border-[var(--border-primary)] px-3 py-1.5 rounded-xl text-[10px] text-[var(--text-primary)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity font-mono uppercase tracking-widest shadow-xl">
                    {tool.label}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => {
            if (activeMode) {
              setActiveMode(null);
            } else {
              setShowMenu(!showMenu);
            }
          }}
          className={`p-4 rounded-full shadow-2xl transition-all duration-300 ${activeMode ? 'bg-red-500 text-white rotate-0' : showMenu ? 'bg-zinc-800 text-white rotate-45' : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:scale-105'}`}
        >
          {activeMode ? <X size={26} /> : (showMenu ? <X size={26} /> : <MessageSquare size={26} />)}
        </button>
      </div>

      {/* Overlays (Unified) */}
      <AIAnnotator 
        isVisible={activeMode === 'unified_selection' && iaTool === 'area'} 
        onClose={() => setActiveMode(null)} 
        user={user}
        profile={profile}
        isIA={isHost} // Default to IA if Host, but let popup decide
      />
      
      <SelectionOverlay 
        activeMode={activeMode === 'unified_selection' ? iaTool : null} 
        onClose={() => setActiveMode(null)} 
        user={user}
        profile={profile}
        isHost={isHost}
      />
    </FeedbackContext.Provider>
  );
}
