import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { notificationSound } from '@/lib/notificationSound';
import { Button } from './button';

export const SoundToggle = () => {
  const [soundEnabled, setSoundEnabled] = useState(notificationSound.isEnabled());

  useEffect(() => {
    // Force loud_alarm sound on mount
    notificationSound.setSound('loud_alarm');
  }, []);

  const toggleSound = () => {
    const newState = notificationSound.toggle();
    setSoundEnabled(newState);
    // Don't play test sound - only play when actual referral is submitted
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSound}
        className="relative"
        title={soundEnabled ? 'Disable notification sounds (Loud Alarm)' : 'Enable notification sounds (Loud Alarm)'}
      >
        {soundEnabled ? (
          <Volume2 className="w-5 h-5 text-green-600 dark:text-green-400" />
        ) : (
          <VolumeX className="w-5 h-5 text-gray-400" />
        )}
        
        {/* Show red indicator when loud alarm is active */}
        {soundEnabled && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </Button>
    </div>
  );
};
