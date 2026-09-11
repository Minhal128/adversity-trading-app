import { Linking, Platform } from 'react-native';
import type { SafeTradeLocation } from '../services/safeTradeSpotApi';

export async function openMapsNavigation(location: SafeTradeLocation) {
  const hasCoords =
    typeof location.lat === 'number' && typeof location.lng === 'number';
  const label = encodeURIComponent(location.name || location.formattedAddress || 'Meetup');
  const query = encodeURIComponent(location.formattedAddress || location.name || '');

  let url: string;
  if (Platform.OS === 'ios') {
    url = hasCoords
      ? `http://maps.apple.com/?daddr=${location.lat},${location.lng}&q=${label}`
      : `http://maps.apple.com/?daddr=${query}`;
  } else if (Platform.OS === 'android') {
    url = hasCoords
      ? `google.navigation:q=${location.lat},${location.lng}`
      : `geo:0,0?q=${query}`;
  } else {
    url = hasCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  }

  const can = await Linking.canOpenURL(url);
  if (!can && Platform.OS !== 'web') {
    const fallback = hasCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    await Linking.openURL(fallback);
    return;
  }
  await Linking.openURL(url);
}
