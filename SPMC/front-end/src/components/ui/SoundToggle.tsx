import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { notificationSound } from '@/lib/notificationSound';
import { Button } from './button';
import { SoundSelector } from './SoundSelector';

export const SoundToggle = () => {
  const [soundEnabled, setSoundEnabled] = useState(notificationSound.isEnabled());

  const toggleSound = () => {
    const newState = notificationSound.toggle();
    setSoundEnabled(newState);
    
    // Play a test sound when enabling
    if (newState) {
      notificationSound.playNotification();
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSound}
        className="relative"
        title={soundEnabled ? 'Disable notification sounds' : 'Enable notification sounds'}
      >
        {soundEnabled ? (
          <Volume2 className="w-5 h-5 text-green-600 dark:text-green-400" />
        ) : (
          <VolumeX className="w-5 h-5 text-gray-400" />
        )}
      </Button>
      
      {soundEnabled && <SoundSelector />}
    </div>
  );
};
