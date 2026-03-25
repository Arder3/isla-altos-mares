import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, X, Send, MousePointer2 } from 'lucide-react';
import { supabase } from '../core/supabaseClient';

export default function AIAnnotator({ isVisible, onClose, onSave, user, profile }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState(null);
  const [comment, setComment] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const overlayRef = useRef(null);

  const isHost = profile?.rol === 'host';

  const handleMouseDown = (e) => {
    if (showPopup) return;
    setIsDrawing(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentRect({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const x = Math.min(e.clientX, startPos.x);
    const y = Math.min(e.clientY, startPos.y);
    const w = Math.abs(e.clientX - startPos.x);
    const h = Math.abs(e.clientY - startPos.y);
    setCurrentRect({ x, y, w, h });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentRect && currentRect.w > 10 && currentRect.h > 10) {
      setShowPopup(true);
    } else {
      setCurrentRect(null);
    }
  };

  const handleSubmit = async () => {
    if (!comment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    const isIA = isHost;

    const feedbackData = {
      user_id: isIA ? (user?.id || '00000000-0000-0000-0000-000000000000') : user.id,
      user_role: profile?.rol || 'guest',
      target_type: 'area',
      target_data: {
        type: 'area_selection',
        rect: currentRect,
        viewport: { width: window.innerWidth, height: window.innerHeight }
      },
      content: comment,
      path: window.location.pathname,
      timestamp: new Date().toISOString()
    };

    try {
      if (isIA) {
        const response = await fetch('/api/save-local-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feedbackData)
        });
        if (response.ok) resetForm();
      } else {
        const { error } = await supabase.from('portal_feedback').insert([feedbackData]);
        if (!error) resetForm();
        else console.error('Supabase error:', error);
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setComment('');
    setShowPopup(false);
    setCurrentRect(null);
    if (onSave) onSave();
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-[200] cursor-crosshair bg-black/10 backdrop-blur-[1px]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[var(--bg-primary)] border border-[var(--border-secondary)] px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 pointer-events-none">
        <Target size={16} className="text-rose-500 animate-pulse" />
        <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[var(--text-primary)]">Modo Selección de Área</span>
        <div className="w-[1px] h-3 bg-[var(--border-primary)]" />
        <span className="text-[9px] text-[var(--text-dim)] uppercase tracking-wider">Arrastra para seleccionar un área</span>
      </div>

      <button 
        onClick={onClose}
        className="absolute top-6 right-6 bg-red-500 text-white p-2 rounded-full shadow-xl hover:scale-110 transition-transform z-[210]"
      >
        <X size={18} />
      </button>

      {/* Current Selection Box */}
      {currentRect && (
        <div 
          className="absolute border-2 border-[var(--accent-primary)] bg-[var(--accent-primary)]/10"
          style={{
            left: currentRect.x,
            top: currentRect.y,
            width: currentRect.w,
            height: currentRect.h
          }}
        >
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-[var(--accent-primary)]" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--accent-primary)]" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[var(--accent-primary)]" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[var(--accent-primary)]" />
        </div>
      )}

      {/* Comment Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bg-[var(--bg-primary)] border border-[var(--border-primary)] p-4 rounded-2xl shadow-2xl w-80 z-[250]"
            style={{
              left: Math.min(currentRect.x, window.innerWidth - 340),
              top: Math.min(currentRect.y + currentRect.h + 10, window.innerHeight - 250)
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <MousePointer2 size={14} className="text-rose-500" />
              <span className="text-[9px] font-mono uppercase tracking-widest font-bold text-[var(--text-primary)]">Feedback de Área</span>
            </div>
            <textarea
              autoFocus
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué observas en este área?"
              className="w-full bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-xl p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] min-h-[100px] resize-none"
            />
            
            <button 
              onClick={handleSubmit}
              disabled={!comment.trim() || isSubmitting}
              className={`w-full mt-3 py-2.5 rounded-lg text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 ${
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
    </div>
  );
}
