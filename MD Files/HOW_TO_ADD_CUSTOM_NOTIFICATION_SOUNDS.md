# How to Add Custom Notification Sounds

This guide explains how to add your own custom notification sounds (like "chanak" sound) to the SPMC Referral System.

## 📁 Where to Put Your Sound Files

Place your `.mp3` audio files in this folder:

```
SPMC/front-end/public/notification-sounds/
```

## 📝 File Naming Convention

The system looks for these specific filenames:

### Standard Notification Sounds:
- `default.mp3` - Default notification sound
- `chanak.mp3` - Chanak sound (your custom sound)
- `bell.mp3` - Bell sound
- `chime.mp3` - Chime sound
- `ding.mp3` - Ding sound
- `beep.mp3` - Beep sound

### Urgent Notification Sounds (Optional):
You can also add urgent variants that play for critical notifications:
- `chanak-urgent.mp3` - Urgent version of chanak sound
- `bell-urgent.mp3` - Urgent version of bell sound
- etc.

## 🎵 Step-by-Step: Adding Your Chanak Sound

1. **Prepare your audio file:**
   - Make sure your sound file is in `.mp3` format
   - Keep it short (1-3 seconds is ideal for notifications)
   - Ensure the volume is normalized (not too loud or too quiet)

2. **Create the folder (if it doesn't exist):**
   ```bash
   mkdir SPMC/front-end/public/notification-sounds
   ```

3. **Copy your sound file:**
   - Rename your sound file to `chanak.mp3`
   - Copy it to: `SPMC/front-end/public/notification-sounds/chanak.mp3`

4. **That's it!** The sound will automatically appear in the sound selector.

## 🎛️ How to Select Your Sound

1. **Enable notification sounds:**
   - Click the speaker icon (🔊) in the top navigation bar
   - The icon should turn green when enabled

2. **Open sound selector:**
   - Click the music note icon (🎵) next to the speaker icon
   - A dropdown menu will appear showing all available sounds

3. **Choose your sound:**
   - Click on "🎵 Chanak" (or any other sound)
   - Click the play button (▶️) to test the sound
   - The selected sound will be saved automatically

## 📂 Complete Folder Structure

```
SPMC/
└── front-end/
    └── public/
        └── notification-sounds/
            ├── default.mp3          ← Default sound
            ├── chanak.mp3           ← Your custom chanak sound
            ├── bell.mp3             ← Bell sound
            ├── chime.mp3            ← Chime sound
            ├── ding.mp3             ← Ding sound
            ├── beep.mp3             ← Beep sound
            ├── chanak-urgent.mp3    ← (Optional) Urgent variant
            └── bell-urgent.mp3      ← (Optional) Urgent variant
```

## 🔧 Adding More Custom Sounds

If you want to add more sound options beyond the default ones:

1. **Add your sound file** to `public/notification-sounds/`
   - Example: `mysound.mp3`

2. **Update the code** in `SPMC/front-end/src/lib/notificationSound.ts`:
   ```typescript
   export const NOTIFICATION_SOUNDS = {
     default: '/notification-sounds/default.mp3',
     chanak: '/notification-sounds/chanak.mp3',
     bell: '/notification-sounds/bell.mp3',
     chime: '/notification-sounds/chime.mp3',
     ding: '/notification-sounds/ding.mp3',
     beep: '/notification-sounds/beep.mp3',
     mysound: '/notification-sounds/mysound.mp3',  // ← Add this line
     generated: 'generated'
   } as const;
   ```

3. **Update the display name** in `SPMC/front-end/src/components/ui/SoundSelector.tsx`:
   ```typescript
   const getSoundDisplayName = (soundType: NotificationSoundType) => {
     const names: Record<NotificationSoundType, string> = {
       default: '🔔 Default',
       chanak: '🎵 Chanak',
       bell: '🔔 Bell',
       chime: '🎶 Chime',
       ding: '✨ Ding',
       beep: '📢 Beep',
       mysound: '🎸 My Sound',  // ← Add this line
       generated: '🎹 Generated'
     };
     return names[soundType] || soundType;
   };
   ```

## 🎯 Tips for Best Results

1. **Audio Format:** Use `.mp3` format for best browser compatibility
2. **File Size:** Keep files under 100KB for fast loading
3. **Duration:** 1-3 seconds is ideal for notification sounds
4. **Volume:** Normalize your audio to -3dB to -6dB peak level
5. **Sample Rate:** 44.1kHz or 48kHz is recommended
6. **Bit Rate:** 128kbps or 192kbps is sufficient for notification sounds

## 🔍 Troubleshooting

**Sound not playing?**
- Check if the file exists in the correct folder
- Verify the filename matches exactly (case-sensitive)
- Make sure the file is a valid `.mp3` file
- Check browser console for errors (F12 → Console tab)
- Try clearing browser cache (Ctrl+Shift+R)

**Sound too loud/quiet?**
- Use audio editing software (like Audacity) to adjust volume
- Normalize the audio to a consistent level
- Export with appropriate bit rate

**Sound not appearing in selector?**
- Make sure you added it to `NOTIFICATION_SOUNDS` in the code
- Restart the development server
- Clear browser cache

## 🎨 Where Sounds Are Used

Notification sounds play in these scenarios:

1. **New Referral** - When a new referral is submitted
2. **Status Update** - When referral status changes
3. **Urgent Alert** - For emergent/urgent referrals (uses urgent variant if available)
4. **Department Assignment** - When referral is assigned to a department
5. **Arrival Confirmation** - When patient arrival is confirmed

## 📱 Browser Compatibility

The notification sound system works on:
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera
- ⚠️ Mobile browsers (may require user interaction first)

---

**Need help?** Contact the development team or check the browser console for error messages.
