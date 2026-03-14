import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ExternalLink } from 'lucide-react';
import { getTranslation as t } from '../core/i18n';
import localManifest from '../core/local_manifest.json';

export default function NotificationSystem({ lang, onReview }) {
  const [isVisible, setIsVisible] = useState(false);
  const [lastSeenTime, setLastSeenTime] = useState(() => localStorage.getItem('portal_last_manifest_time') || null);
  const [hasNewChanges, setHasNewChanges] = useState(false);

  useEffect(() => {
    const isNotificationsEnabled = localStorage.getItem('portal_notifications_enabled') !== 'false';
    if (!isNotificationsEnabled) return;

    if (!localManifest || localManifest.length === 0) return;

    // Find the latest modified date in the manifest
    const latestDateStr = localManifest.reduce((latest, asset) => {
      if (!asset.modified) return latest;
      return asset.modified > latest ? asset.modified : latest;
    }, '2000-01-01');
    
    // Using simple timestamp for comparison (e.g., '2026-03-08' -> Date object)
    const latestTime = new Date(latestDateStr).getTime();
    
    if (lastSeenTime) {
      if (latestTime > parseInt(lastSeenTime, 10)) {
        setHasNewChanges(true);
        setIsVisible(true);
      }
    } else {
      // First time loading, set it but don't show notification to avoid spamming
      localStorage.setItem('portal_last_manifest_time', latestTime.toString());
      setLastSeenTime(latestTime.toString());
    }
  }, [lastSeenTime]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Mark as seen
    if (localManifest && localManifest.length > 0) {
      const latestDateStr = localManifest.reduce((latest, asset) => {
        return asset.modified && asset.modified > latest ? asset.modified : latest;
      }, '2000-01-01');
      const latestTime = new Date(latestDateStr).getTime();
      localStorage.setItem('portal_last_manifest_time', latestTime.toString());
      setLastSeenTime(latestTime.toString());
    }
  };

  const handleReview = () => {
    handleDismiss();
    onReview();
  };

  return (
    <AnimatePresence>
      {isVisible && hasNewChanges && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-[200] max-w-sm w-full"
        >
          <div className="relative bg-[var(--surface-card)]/90 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-4 shadow-2xl shadow-indigo-900/20 overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            
            <div className="relative flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Bell size={20} className="animate-pulse" />
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-[var(--text-primary)] font-bold text-sm mb-1 uppercase tracking-wider">
                  {t(lang, 'notification_update_title')}
                </h3>
                <p className="text-[var(--text-dim)] text-xs leading-relaxed mb-4">
                  {t(lang, 'notification_update_msg')}
                </p>
                
                <div className="flex gap-2">
                  <button 
                    onClick={handleReview}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-mono font-bold uppercase tracking-widest py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span>{t(lang, 'notification_review')}</span>
                    <ExternalLink size={12} />
                  </button>
                  <button 
                    onClick={handleDismiss}
                    className="flex-shrink-0 bg-[var(--bg-primary)] hover:bg-[var(--text-secondary)] border border-[var(--border-secondary)] text-[var(--text-dim)] hover:text-[var(--text-primary)] px-3 rounded-lg transition-colors flex items-center justify-center"
                    title={t(lang, 'notification_dismiss')}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
