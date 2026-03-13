import { useState, useEffect } from 'react';
import { Button } from './button';
import { Volume2, VolumeX } from 'lucide-react';
import { notificationSound } from '@/lib/notificationSound';

export const SoundSelector = () => {
  const [isEnabled, setIsEnabled] = useState(notificationSound.isEnabled());

  useEffect(() => {
    setIsEnabled(notificationSound.isEnabled());
    // Force loud_alarm sound
    notificationSound.setSound('loud_alarm');
  }, []);

  const handleToggleSound = () => {
    const newState = notificationSound.toggle();
    setIsEnabled(newState);
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleSound}
        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        title={isEnabled ? 'Disable notification sounds (Loud Alarm)' : 'Enable notification sounds (Loud Alarm)'}
      >
        {isEnabled ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </Button>
      
      {/* Show indicator that loud alarm is active */}
      {isEnabled && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
    </div>
  );
};
