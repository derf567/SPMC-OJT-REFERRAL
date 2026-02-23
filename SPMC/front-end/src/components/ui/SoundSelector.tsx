import { useState, useEffect } from 'react';
import { Button } from './button';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { notificationSound, NotificationSoundType } from '@/lib/notificationSound';

export const SoundSelector = () => {
  const [isEnabled, setIsEnabled] = useState(notificationSound.isEnabled());
  const [selectedSound, setSelectedSound] = useState<NotificationSoundType>(notificationSound.getSound());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsEnabled(notificationSound.isEnabled());
    setSelectedSound(notificationSound.getSound());
  }, []);

  const handleToggleSound = () => {
    const newState = notificationSound.toggle();
    setIsEnabled(newState);
  };

  const handleSoundChange = (soundType: NotificationSoundType) => {
    notificationSound.setSound(soundType);
    setSelectedSound(soundType);
  };

  const handleTestSound = (soundType: NotificationSoundType) => {
    // Temporarily set the sound to test it
    const currentSound = notificationSound.getSound();
    notificationSound.setSound(soundType);
    notificationSound.playNotification();
    // Restore the original sound after a delay
    setTimeout(() => {
      notificationSound.setSound(currentSound);
    }, 100);
  };

  const getSoundDisplayName = (soundType: NotificationSoundType) => {
    const names: Record<NotificationSoundType, string> = {
      default: '🔔 Default',
      chanak: '🎵 Chanak',
      bell: '🔔 Bell',
      chime: '🎶 Chime',
      ding: '✨ Ding',
      beep: '📢 Beep',
      generated: '🎹 Generated'
    };
    return names[soundType] || soundType;
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleSound}
        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        title={isEnabled ? 'Disable notification sounds' : 'Enable notification sounds'}
      >
        {isEnabled ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </Button>

      {/* Sound Selector Dropdown */}
      {isEnabled && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white ml-2"
          title="Select notification sound"
        >
          <span className="text-xs">🎵</span>
        </Button>
      )}

      {/* Dropdown Menu */}
      {isOpen && isEnabled && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Notification Sound
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Choose your preferred notification sound
              </p>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {notificationSound.getAvailableSounds().map((soundType) => (
                <div
                  key={soundType}
                  className={`flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                    selectedSound === soundType ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => handleSoundChange(soundType)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`w-2 h-2 rounded-full ${
                      selectedSound === soundType 
                        ? 'bg-blue-600' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                    <span className={`text-sm ${
                      selectedSound === soundType 
                        ? 'font-medium text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {getSoundDisplayName(soundType)}
                    </span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestSound(soundType);
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 h-auto"
                    title="Test this sound"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                💡 Tip: Place custom .mp3 files in <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">public/notification-sounds/</code>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
