/**
 * Expo Config Plugin to remove 'audio' from UIBackgroundModes
 * 
 * This is needed because the Stream Video SDK adds 'audio' to UIBackgroundModes,
 * but our app doesn't actually play audio in the background.
 * Apple rejects apps that declare audio background mode without using it.
 */
const { withInfoPlist } = require('@expo/config-plugins');

function withRemoveAudioBackgroundMode(config) {
  return withInfoPlist(config, (config) => {
    const backgroundModes = config.modResults.UIBackgroundModes || [];
    
    // Remove 'audio' if present
    const audioIndex = backgroundModes.indexOf('audio');
    if (audioIndex > -1) {
      backgroundModes.splice(audioIndex, 1);
      console.log('✅ Removed "audio" from UIBackgroundModes');
    }
    
    // Also remove 'voip' if present (we use push notifications, not VoIP)
    const voipIndex = backgroundModes.indexOf('voip');
    if (voipIndex > -1) {
      backgroundModes.splice(voipIndex, 1);
      console.log('✅ Removed "voip" from UIBackgroundModes');
    }
    
    config.modResults.UIBackgroundModes = backgroundModes;
    
    return config;
  });
}

module.exports = withRemoveAudioBackgroundMode;
