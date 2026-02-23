/**
 * Notification Sound Utility
 * Plays notification sounds using custom audio files or Web Audio API
 */

// Available notification sounds
export const NOTIFICATION_SOUNDS = {
  default: '/notification-sounds/default.mp3',
  chanak: '/notification-sounds/chanak.mp3',
  bell: '/notification-sounds/bell.mp3',
  chime: '/notification-sounds/chime.mp3',
  ding: '/notification-sounds/ding.mp3',
  beep: '/notification-sounds/beep.mp3',
  // Fallback to generated sound if no file exists
  generated: 'generated'
} as const;

export type NotificationSoundType = keyof typeof NOTIFICATION_SOUNDS;

class NotificationSound {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private selectedSound: NotificationSoundType = 'default';
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    // Check if user has sound preference saved
    const savedPreference = localStorage.getItem('notificationSoundEnabled');
    this.enabled = savedPreference !== 'false'; // Default to true
    
    // Load selected sound preference
    const savedSound = localStorage.getItem('notificationSoundType') as NotificationSoundType;
    if (savedSound && NOTIFICATION_SOUNDS[savedSound]) {
      this.selectedSound = savedSound;
    }
  }

  /**
   * Initialize audio context (required for some browsers)
   */
  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Play audio file from URL
   */
  private async playAudioFile(url: string, volume: number = 0.5) {
    try {
      // Check if audio is cached
      let audio = this.audioCache.get(url);
      
      if (!audio) {
        // Create new audio element
        audio = new Audio(url);
        audio.volume = volume;
        
        // Preload the audio
        audio.preload = 'auto';
        
        // Cache it for future use
        this.audioCache.set(url, audio);
      }
      
      // Reset audio to start if it was already playing
      audio.currentTime = 0;
      audio.volume = volume;
      
      // Play the audio
      await audio.play();
    } catch (error) {
      console.error('Error playing audio file:', error);
      // Fallback to generated sound if file fails to load
      this.playGeneratedNotification();
    }
  }

  /**
   * Set the notification sound type
   */
  setSound(soundType: NotificationSoundType) {
    this.selectedSound = soundType;
    localStorage.setItem('notificationSoundType', soundType);
  }

  /**
   * Get current sound type
   */
  getSound(): NotificationSoundType {
    return this.selectedSound;
  }

  /**
   * Get available sounds
   */
  getAvailableSounds() {
    return Object.keys(NOTIFICATION_SOUNDS) as NotificationSoundType[];
  }

  /**
   * Play a notification sound based on selected type
   */
  playNotification() {
    if (!this.enabled) return;

    const soundUrl = NOTIFICATION_SOUNDS[this.selectedSound];
    
    if (soundUrl === 'generated' || this.selectedSound === 'generated') {
      this.playGeneratedNotification();
    } else {
      this.playAudioFile(soundUrl, 0.5);
    }
  }

  /**
   * Play a generated notification sound (two-tone chime) - fallback
   */
  private playGeneratedNotification() {
    if (!this.enabled) return;

    try {
      const context = this.initAudioContext();
      const now = context.currentTime;

      // Create oscillator for first tone (higher pitch)
      const oscillator1 = context.createOscillator();
      const gainNode1 = context.createGain();
      
      oscillator1.connect(gainNode1);
      gainNode1.connect(context.destination);
      
      oscillator1.frequency.value = 800; // E5 note
      oscillator1.type = 'sine';
      
      gainNode1.gain.setValueAtTime(0, now);
      gainNode1.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      oscillator1.start(now);
      oscillator1.stop(now + 0.3);

      // Create oscillator for second tone (lower pitch) - plays after first
      const oscillator2 = context.createOscillator();
      const gainNode2 = context.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(context.destination);
      
      oscillator2.frequency.value = 600; // D5 note
      oscillator2.type = 'sine';
      
      gainNode2.gain.setValueAtTime(0, now + 0.15);
      gainNode2.gain.linearRampToValueAtTime(0.3, now + 0.16);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      oscillator2.start(now + 0.15);
      oscillator2.stop(now + 0.5);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  /**
   * Play an urgent notification sound (three rapid beeps or custom urgent sound)
   */
  playUrgentNotification() {
    if (!this.enabled) return;

    // Try to play urgent variant if available
    const urgentSoundUrl = `/notification-sounds/${this.selectedSound}-urgent.mp3`;
    
    // Check if urgent variant exists, otherwise use regular sound with higher volume
    this.playAudioFile(urgentSoundUrl, 0.7).catch(() => {
      // Fallback to regular sound or generated urgent sound
      if (this.selectedSound === 'generated') {
        this.playGeneratedUrgentNotification();
      } else {
        this.playAudioFile(NOTIFICATION_SOUNDS[this.selectedSound], 0.7);
      }
    });
  }

  /**
   * Play generated urgent notification sound (three rapid beeps) - fallback
   */
  private playGeneratedUrgentNotification() {
    if (!this.enabled) return;

    try {
      const context = this.initAudioContext();
      const now = context.currentTime;

      // Create three beeps for urgent notifications
      for (let i = 0; i < 3; i++) {
        const startTime = now + (i * 0.2);
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = 1000; // Higher pitch for urgency
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.15);
      }
    } catch (error) {
      console.error('Error playing urgent notification sound:', error);
    }
  }

  /**
   * Play a success sound (ascending tones)
   */
  playSuccess() {
    if (!this.enabled) return;

    try {
      const context = this.initAudioContext();
      const now = context.currentTime;

      const frequencies = [523, 659, 784]; // C5, E5, G5 (major chord)
      
      frequencies.forEach((freq, index) => {
        const startTime = now + (index * 0.1);
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
      });
    } catch (error) {
      console.error('Error playing success sound:', error);
    }
  }

  /**
   * Enable notification sounds
   */
  enable() {
    this.enabled = true;
    localStorage.setItem('notificationSoundEnabled', 'true');
  }

  /**
   * Disable notification sounds
   */
  disable() {
    this.enabled = false;
    localStorage.setItem('notificationSoundEnabled', 'false');
  }

  /**
   * Toggle notification sounds
   */
  toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.enabled;
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled() {
    return this.enabled;
  }
}

// Export singleton instance
export const notificationSound = new NotificationSound();
