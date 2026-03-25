import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ExternalLink, Sparkles } from 'lucide-react';
import { getTranslation as t } from '../core/i18n';
import localManifest from '../core/local_manifest.json';
import { supabase } from '../core/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function NotificationSystem({ lang, onReview }) {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [manifestNotif, setManifestNotif] = useState(null);
  const [lastSeenTime, setLastSeenTime] = useState(() => localStorage.getItem('portal_last_manifest_time') || null);
  const channelRef = useRef(null);

  const isHost = profile?.rol === 'host';

  // ── Manifest-based notifications (existing) ──
  useEffect(() => {
    const isNotifEnabled = localStorage.getItem('portal_notifications_enabled') !== 'false';
    if (!isNotifEnabled || !isHost) return;
    if (!localManifest || localManifest.length === 0) return;

    const latestDateStr = localManifest.reduce((latest, asset) => {
      if (!asset.modified) return latest;
      return asset.modified > latest ? asset.modified : latest;
    }, '2000-01-01');
    const latestTime = new Date(latestDateStr).getTime();

    if (lastSeenTime) {
      if (latestTime > parseInt(lastSeenTime, 10)) {
        setManifestNotif({ id: 'manifest', type: 'manifest' });
      }
    } else {
      localStorage.setItem('portal_last_manifest_time', latestTime.toString());
      setLastSeenTime(latestTime.toString());
    }
  }, [lastSeenTime, isHost]);

  // ── Supabase Realtime — Host subscribes to incoming notifications ──
  useEffect(() => {
    if (!user || !isHost) return;

    // Load unread notifications first
    const loadUnread = async () => {
      const { data } = await supabase
        .from('portal_notifications')
        .select('*')
        .eq('recipient_user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setNotifications(data);
    };
    loadUnread();

    // Subscribe to new inserts in real-time
    channelRef.current = supabase
      .channel('host_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'portal_notifications',
          filter: `recipient_user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [user, isHost]);

  const dismissNotif = async (notif) => {
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    if (notif.id !== 'manifest') {
      await supabase.from('portal_notifications').update({ is_read: true }).eq('id', notif.id);
    }
  };

  const dismissManifest = () => {
    setManifestNotif(null);
    if (localManifest?.length > 0) {
      const latestDateStr = localManifest.reduce((latest, asset) =>
        asset.modified && asset.modified > latest ? asset.modified : latest, '2000-01-01');
      const latestTime = new Date(latestDateStr).getTime();
      localStorage.setItem('portal_last_manifest_time', latestTime.toString());
      setLastSeenTime(latestTime.toString());
    }
  };

  // Build a combined list to show
  const allVisible = [
    ...(manifestNotif ? [manifestNotif] : []),
    ...notifications,
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 items-end pointer-events-none">
      <AnimatePresence>
        {allVisible.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="pointer-events-auto max-w-sm w-full"
          >
            <div className="relative bg-[var(--surface-card)]/90 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-4 shadow-2xl shadow-indigo-900/20 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

              <div className="relative flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    {notif.type === 'manifest' ? (
                      <Bell size={20} className="animate-pulse" />
                    ) : (
                      <Sparkles size={20} className="animate-pulse" />
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-[var(--text-primary)] font-bold text-sm mb-1 uppercase tracking-wider">
                    {notif.type === 'manifest'
                      ? t(lang, 'notification_update_title')
                      : (notif.sender_display_name
                          ? `${notif.sender_display_name} está activa`
                          : 'Actividad en el Portal')}
                  </h3>
                  <p className="text-[var(--text-dim)] text-xs leading-relaxed mb-4">
                    {notif.type === 'manifest'
                      ? t(lang, 'notification_update_msg')
                      : notif.message}
                  </p>

                  <div className="flex gap-2">
                    {notif.type === 'manifest' && (
                      <button
                        onClick={() => { dismissManifest(); onReview?.(); }}
                        className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-mono font-bold uppercase tracking-widest py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <span>{t(lang, 'notification_review')}</span>
                        <ExternalLink size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => notif.type === 'manifest' ? dismissManifest() : dismissNotif(notif)}
                      className="flex-shrink-0 bg-[var(--bg-primary)] hover:bg-[var(--text-secondary)] border border-[var(--border-secondary)] text-[var(--text-dim)] hover:text-[var(--text-primary)] px-3 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
