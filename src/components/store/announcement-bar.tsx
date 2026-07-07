'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, Info, Zap, Gift, Wrench } from 'lucide-react';

interface Announcement {
  id: string;
  type: 'INFO' | 'WARNING' | 'SALE' | 'EVENT' | 'MAINTENANCE';
  message: string;
  dismissible: boolean;
}

const getAnnouncementColor = (type: Announcement['type']) => {
  switch (type) {
    case 'INFO':
      return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
    case 'WARNING':
      return 'bg-amber-500/20 border-amber-500/30 text-amber-300';
    case 'SALE':
      return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300';
    case 'EVENT':
      return 'bg-purple-500/20 border-purple-500/30 text-purple-300';
    case 'MAINTENANCE':
      return 'bg-red-500/20 border-red-500/30 text-red-300';
    default:
      return 'bg-gray-800/50 border-white/5 text-gray-300';
  }
};

const getAnnouncementIcon = (type: Announcement['type']) => {
  switch (type) {
    case 'INFO':
      return <Info className="w-4 h-4" />;
    case 'WARNING':
      return <AlertCircle className="w-4 h-4" />;
    case 'SALE':
      return <Gift className="w-4 h-4" />;
    case 'EVENT':
      return <Zap className="w-4 h-4" />;
    case 'MAINTENANCE':
      return <Wrench className="w-4 h-4" />;
    default:
      return null;
  }
};

export function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch announcements from API
    const fetchAnnouncements = async () => {
      try {
        // Replace with actual API endpoint
        const response = await fetch('/api/announcements/active');
        if (response.ok) {
          const data = await response.json();
          setAnnouncements(data);
        }
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
        // Set some default announcements for demo
        setAnnouncements([
          {
            id: 'demo-1',
            type: 'SALE',
            message: 'Summer Sale: 30% off all items this weekend only! Use code SUMMER30 at checkout.',
            dismissible: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();

    // Load dismissed announcements from localStorage
    const dismissedFromStorage = localStorage.getItem('dismissedAnnouncements');
    if (dismissedFromStorage) {
      setDismissed(new Set(JSON.parse(dismissedFromStorage)));
    }
  }, []);

  const handleDismiss = (id: string) => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(id);
    setDismissed(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(Array.from(newDismissed)));
  };

  const visibleAnnouncements = announcements.filter((a) => !dismissed.has(a.id));

  if (isLoading || visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 bg-gray-950/30 border-b border-white/5 px-4 py-3">
      {visibleAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-medium ${getAnnouncementColor(announcement.type)}`}
        >
          <div className="flex items-center gap-3 flex-1">
            {getAnnouncementIcon(announcement.type)}
            <span className="leading-relaxed">{announcement.message}</span>
          </div>
          {announcement.dismissible && (
            <button
              onClick={() => handleDismiss(announcement.id)}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded-md transition-colors"
              aria-label="Dismiss announcement"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
