/**
 * Notification Sound Utility
 * Generates and plays notification sounds using Web Audio API
 */

class NotificationSound {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Check if user has sound preference saved
    const savedPreference = localStorage.getItem('notificationSoundEnabled');
    this.enabled = savedPreference !== 'false'; // Default to true
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
   * Play a pleasant notification sound (two-tone chime)
   */
  playNotification() {
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
   * Play an urgent notification sound (three rapid beeps)
   */
  playUrgentNotification() {
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
