# Audio Notification System

## Overview
The SPMC Referral System now includes audio notifications to alert users of important events in real-time.

## Features

### 1. **Notification Sounds**
Three types of sounds are available:

#### Standard Notification (Two-Tone Chime)
- **When**: New referral received, referral transferred
- **Sound**: Pleasant two-tone chime (E5 → D5)
- **Duration**: ~0.5 seconds
- **Use**: General notifications

#### Urgent Notification (Triple Beep)
- **When**: Urgent/emergent referrals
- **Sound**: Three rapid beeps at 1000Hz
- **Duration**: ~0.6 seconds
- **Use**: Critical alerts requiring immediate attention

#### Success Sound (Ascending Chord)
- **When**: Actions completed successfully
- **Sound**: Major chord (C5, E5, G5)
- **Duration**: ~0.4 seconds
- **Use**: Confirmation of successful operations

### 2. **Sound Toggle Control**
Users can enable/disable notification sounds:

- **Location**: Top right of dashboard (next to dark mode toggle)
- **Icon**: 
  - 🔊 Green speaker = Sounds enabled
  - 🔇 Gray speaker = Sounds muted
- **Persistence**: Preference saved in browser localStorage
- **Test**: Click to toggle - plays test sound when enabling

### 3. **Automatic Sound Playback**
Sounds play automatically when:
- ✅ New referral arrives (EDCC staff)
- ✅ Referral transferred to triage (EDMAR staff)
- ✅ New account approval request (Admin)
- ✅ Urgent triage call (Referrer)

## Technical Implementation

### Web Audio API
- Uses browser's built-in Web Audio API
- No external audio files needed
- Generates tones programmatically
- Works offline
- Low latency (~10ms)

### Browser Compatibility
- ✅ Chrome/Edge (v23+)
- ✅ Firefox (v25+)
- ✅ Safari (v6.1+)
- ✅ Opera (v15+)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Sound Specifications

| Sound Type | Frequency | Duration | Volume | Pattern |
|------------|-----------|----------|--------|---------|
| Standard   | 800Hz → 600Hz | 0.5s | 30% | Two-tone |
| Urgent     | 1000Hz | 0.6s | 40% | Triple beep |
| Success    | 523Hz → 659Hz → 784Hz | 0.4s | 20% | Ascending |

## User Guide

### Enabling Sounds
1. Look for the speaker icon in the top right corner
2. Click the icon to enable sounds
3. You'll hear a test sound confirming it's enabled
4. The icon turns green 🔊

### Disabling Sounds
1. Click the green speaker icon 🔊
2. Icon turns gray 🔇
3. No sounds will play until re-enabled

### Troubleshooting

**No sound playing?**
- Check if sounds are enabled (green speaker icon)
- Verify browser volume is not muted
- Check system volume settings
- Try clicking the speaker icon to test

**Sound too loud/quiet?**
- Adjust system volume
- Adjust browser tab volume (right-click tab)
- Sounds are designed to be non-intrusive (20-40% volume)

**Sound not working on mobile?**
- Some mobile browsers require user interaction first
- Tap anywhere on the page to initialize audio
- Check phone is not in silent mode

## Best Practices

### For Users
- Keep sounds enabled during active monitoring
- Disable sounds during meetings or quiet hours
- Test sound after enabling to verify it works

### For Administrators
- Educate staff about sound notifications
- Recommend keeping sounds enabled for critical roles:
  - EDCC Personnel (new referrals)
  - EDMAR Triage (transferred referrals)
  - Referrers (urgent triage calls)

## Privacy & Accessibility

### Privacy
- No audio data is recorded or transmitted
- Sound preference stored locally only
- No external audio files downloaded

### Accessibility
- Visual notifications always shown alongside audio
- Audio is supplementary, not required
- Users can disable if sounds cause issues
- Compatible with screen readers

## Future Enhancements

Potential improvements:
- [ ] Custom sound selection
- [ ] Volume control slider
- [ ] Different sounds per notification type
- [ ] Sound preview before enabling
- [ ] Scheduled quiet hours
- [ ] Desktop notification integration

## API Reference

### notificationSound Methods

```typescript
// Play standard notification
notificationSound.playNotification();

// Play urgent notification
notificationSound.playUrgentNotification();

// Play success sound
notificationSound.playSuccess();

// Enable sounds
notificationSound.enable();

// Disable sounds
notificationSound.disable();

// Toggle sounds
const isEnabled = notificationSound.toggle();

// Check if enabled
const enabled = notificationSound.isEnabled();
```

## Support

For issues or questions about audio notifications:
1. Check browser console for errors
2. Verify browser compatibility
3. Test with different browsers
4. Contact system administrator

---

**Note**: Audio notifications enhance the user experience but are not required for system functionality. All notifications are also displayed visually.
