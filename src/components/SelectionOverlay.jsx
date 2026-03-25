import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Highlighter, X, Send } from 'lucide-react';
import { supabase } from '../core/supabaseClient';

export default function SelectionOverlay({ activeMode, onClose, user, profile, isHost }) {
  const [hoveredElement, setHoveredElement] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [comment, setComment] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [textSelection, setTextSelection] = useState(null);

  // --- Element Selection Logic ---
  useEffect(() => {
    const isElementMode = activeMode === 'team' || activeMode === 'ia_element';
    if (!isElementMode) {
      setHoveredElement(null);
      return;
    }

    const handleMouseMove = (e) => {
      // Find the deepest element at point
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el && !el.closest('.feedback-ignore')) {
        setHoveredElement(el);
      } else {
        setHoveredElement(null);
      }
    };

    const handleClick = (e) => {
      if (e.target.closest('.feedback-ignore')) return;
      e.preventDefault();
      e.stopPropagation();
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el) {
        setPopupPos({ x: e.clientX, y: e.clientY });
        setSelectedElement(el);
        setShowPopup(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick, true);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick, true);
    };
  }, [activeMode]);

  // --- Text Selection Logic ---
  useEffect(() => {
    const isTextMode = activeMode === 'text' || activeMode === 'ia_text';
    if (!isTextMode) return;

    const handleMouseUp = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      if (text && text.length > 2) {
        const range = selection.getRangeAt(0);
        const rects = range.getClientRects();
        const lastRect = rects[rects.length - 1];
        
        setTextSelection({
          text: text,
          range: range,
          rect: lastRect
        });
        setPopupPos({ x: lastRect.left, y: lastRect.bottom + window.scrollY });
        setShowPopup(true);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [activeMode]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);

  const handleSubmit = async () => {
    if (!comment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setErrorStatus(null);

    const isIA = isHost;

    // Validate user for Supabase
    if (!isIA && (!user || !user.id)) {
      setErrorStatus('Debes iniciar sesión para comentar al equipo');
      setIsSubmitting(false);
      return;
    }

    const targetData = (activeMode === 'text')
      ? { text: textSelection.text, context: textSelection.text.substring(0, 50) }
      : { selector: getUniqueSelector(selectedElement) };

    const feedback = {
      user_id: isIA ? (user?.id || '00000000-0000-0000-0000-000000000000') : user.id,
      user_role: profile?.rol || 'guest',
      target_type: (activeMode === 'text') ? 'text' : 'element',
      target_data: targetData,
      content: comment,
      path: window.location.pathname,
      timestamp: new Date().toISOString()
    };

    if (isIA) {
      // Save locally for Antigravity
      try {
        const response = await fetch('/api/save-local-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feedback)
        });
        if (response.ok) {
          resetForm();
        } else {
          setErrorStatus('Error al guardar localmente');
        }
      } catch (err) {
        setErrorStatus('Error de red local');
      }
    } else {
      // Save to Supabase for the team
      try {
        const { error: sbError } = await supabase.from('portal_feedback').insert([feedback]);
        if (!sbError) {
          resetForm();
        } else {
          setErrorStatus(`Supabase: ${sbError.message}`);
          console.error('Supabase error:', sbError);
        }
      } catch (err) {
        setErrorStatus('Error de conexión con la base de datos');
      }
    }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setComment('');
    setShowPopup(false);
    setSelectedElement(null);
    setHoveredElement(null);
    setTextSelection(null);
    setIsSubmitting(false);
    setErrorStatus(null);
  };

  const getUniqueSelector = (el) => {
    if (!el) return 'unknown';
    if (el.id) return `#${el.id}`;
    if (el.dataset.testid) return `[data-testid="${el.dataset.testid}"]`;
    let path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
      let selector = el.nodeName.toLowerCase();
      if (el.className && typeof el.className === 'string') {
        const cls = el.className.split(' ').filter(c => c && !c.includes(':') && !c.includes('[')).join('.');
        if (cls) selector += "." + cls;
      }
      path.unshift(selector);
      el = el.parentNode;
    }
    return path.join(" > ");
  };

  if (!activeMode) return null;

  const rect = hoveredElement?.getBoundingClientRect();

  return (
    <div className="fixed inset-0 z-[180] pointer-events-none">
      {/* Visual Indicator: Element Hover */}
      {hoveredElement && activeMode === 'element' && !showPopup && (
        <div 
          className="absolute border-2 border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 pointer-events-none transition-all duration-75"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
          }}
        >
          <div className="absolute top-0 left-0 bg-[var(--accent-primary)] text-[var(--accent-invert)] px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-widest">
            {hoveredElement.tagName.toLowerCase()}
          </div>
        </div>
      )}

      {/* Popup Overlay */}
      <AnimatePresence>
        {showPopup && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute bg-[var(--bg-primary)] border border-[var(--border-primary)] p-4 rounded-2xl shadow-2xl w-80 pointer-events-auto feedback-ignore"
            style={{
              left: Math.min(popupPos.x, window.innerWidth - 340),
              top: Math.min(popupPos.y + 10, window.innerHeight - 250)
            }}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                {activeMode === 'text' ? <Highlighter size={14} className="text-amber-500" /> : <MessageSquare size={14} className="text-blue-500" />}
                <span className="text-[9px] font-mono uppercase tracking-widest font-bold text-[var(--text-primary)]">
                  {activeMode === 'text' ? 'Anotación de Texto' : 'Comentar Elemento'}
                </span>
              </div>
              <button onClick={() => { setShowPopup(false); setComment(''); }} className="text-[var(--text-dim)] hover:text-red-500">
                <X size={14} />
              </button>
            </div>

            {activeMode === 'text' && (
              <div className="bg-[var(--surface-card)] p-2 rounded-lg mb-3 border-l-2 border-amber-500">
                <p className="text-[10px] italic text-[var(--text-dim)] line-clamp-2">"{textSelection?.text}"</p>
              </div>
            )}

            <textarea
              autoFocus
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escribe tu observación aquí..."
              className="w-full bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-xl p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] min-h-[80px] resize-none mb-2"
            />

            {errorStatus && (
              <p className="text-[10px] text-red-500 mb-2 font-medium bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                ⚠️ {errorStatus}
              </p>
            )}
            
            <button 
              onClick={handleSubmit}
              disabled={!comment.trim() || isSubmitting}
              className={`w-full mt-1 py-2.5 rounded-lg text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 ${
                isHost ? 'bg-rose-600 text-white' : 'bg-[var(--accent-primary)] text-[var(--accent-invert)]'
              }`}
            >
              {isSubmitting ? (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                isHost ? <Target size={12} /> : <Send size={12} />
              )}
              {isSubmitting ? 'Enviando...' : (isHost ? 'Enviar a Antigravity (IA)' : 'Enviar a Host')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[var(--bg-primary)] border border-[var(--border-secondary)] px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 pointer-events-auto feedback-ignore">
        <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[var(--text-primary)]">
          Modo: {activeMode === 'element' ? 'Selección de Elemento' : 'Anotación de Texto'}
        </span>
        <div className="w-[1px] h-3 bg-[var(--border-primary)]" />
        <button onClick={onClose} className="text-[9px] text-red-500 uppercase tracking-wider font-bold hover:underline">
          Cancelar
        </button>
      </div>
    </div>
  );
}
