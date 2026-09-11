import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { LeafletView } from 'react-native-leaflet-view';
import geoApi from '../../services/geoApi';
import type { SafeTradeLocation } from '../../services/safeTradeSpotApi';

const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 };

async function readAssetText(moduleId: number): Promise<string> {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  const uri = asset.localUri || asset.uri;
  try {
    const { File } = require('expo-file-system');
    if (File && uri) {
      return await new File(uri).text();
    }
  } catch (_) {}
  const legacy = require('expo-file-system/legacy');
  return legacy.readAsStringAsync(uri);
}

type Props = {
  value?: SafeTradeLocation | null;
  onChange: (location: SafeTradeLocation) => void;
};

export default function LeafletLocationPicker({ value, onChange }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SafeTradeLocation[]>([]);

  const center = useMemo(() => {
    if (value?.lat != null && value?.lng != null) {
      return { lat: value.lat, lng: value.lng };
    }
    return DEFAULT_CENTER;
  }, [value?.lat, value?.lng]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const content = await readAssetText(require('../../assets/leaflet.html'));
        if (mounted) setHtml(content);
      } catch (e: any) {
        console.warn('Leaflet HTML load failed', e);
        if (mounted) setError('Map failed to load');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const applyCoords = useCallback(
    async (lat: number, lng: number) => {
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        setError('Invalid map coordinates');
        return;
      }
      setResolving(true);
      setError(null);
      try {
        const location = await geoApi.reverse(lat, lng);
        onChange(location);
        setResults([]);
      } catch (e: any) {
        onChange({
          name: 'Pinned location',
          formattedAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          lat,
          lng,
        });
        setError(e.message || 'Could not resolve address');
      } finally {
        setResolving(false);
      }
    },
    [onChange]
  );

  const onMapMessage = useCallback(
    (message: any) => {
      try {
        const event = message?.event || message?.payload?.event;
        const payload = message?.payload || message;
        if (event === 'onMapClicked' || event === 'onMapMarkerClicked') {
          const pos = payload?.payload || payload?.position || payload;
          const lat = Number(pos?.lat ?? pos?.latitude);
          const lng = Number(pos?.lng ?? pos?.longitude);
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            applyCoords(lat, lng);
          }
        }
      } catch (e) {
        console.warn('map message parse', e);
      }
    },
    [applyCoords]
  );

  const runSearch = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    setError(null);
    try {
      const list = await geoApi.search(q);
      setResults(list);
      if (!list.length) setError('No places found');
    } catch (e: any) {
      setError(e.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const markers = useMemo(() => {
    if (value?.lat == null || value?.lng == null) return [];
    return [
      {
        id: 'sts-pin',
        position: { lat: value.lat, lng: value.lng },
        icon: '📍',
        size: [32, 32],
        title: value.name,
      },
    ];
  }, [value]);

  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-gray-700">Meetup location</Text>
      <View className="mb-2 flex-row items-center rounded-xl border border-gray-200 bg-gray-50 px-3">
        <Ionicons name="search" size={18} color="#008C99" />
        <TextInput
          className="mx-2 flex-1 py-3 text-base text-gray-800"
          placeholder="Search address or place"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          returnKeyType="search"
          accessibilityLabel="Search meetup location"
        />
        <TouchableOpacity onPress={runSearch} disabled={searching} accessibilityLabel="Run search">
          {searching ? (
            <ActivityIndicator size="small" color="#008C99" />
          ) : (
            <Text className="font-semibold text-[#008C99]">Go</Text>
          )}
        </TouchableOpacity>
      </View>

      {results.length > 0 && (
        <View className="mb-2 overflow-hidden rounded-xl border border-gray-200">
          {results.map((r, idx) => (
            <TouchableOpacity
              key={`${r.placeId || r.formattedAddress}-${idx}`}
              className="border-b border-gray-100 bg-white px-3 py-2"
              onPress={() => {
                onChange(r);
                setResults([]);
                setQuery(r.name);
              }}>
              <Text className="text-sm font-semibold text-gray-900">{r.name}</Text>
              <Text className="text-xs text-gray-500" numberOfLines={2}>
                {r.formattedAddress}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.mapBox} className="overflow-hidden rounded-2xl border border-gray-200">
        {!html ? (
          <View className="flex-1 items-center justify-center bg-gray-100">
            <ActivityIndicator color="#008C99" />
            <Text className="mt-2 text-xs text-gray-500">Loading map…</Text>
          </View>
        ) : (
          <LeafletView
            source={{ html }}
            mapCenterPosition={center}
            zoom={14}
            mapMarkers={markers as any}
            onMessageReceived={onMapMessage}
            doDebug={false}
          />
        )}
        {resolving && (
          <View style={styles.overlay}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
      </View>

      <Text className="mt-2 text-xs text-gray-500">
        Tap the map to drop a pin. Address is filled automatically.
      </Text>

      {value && (
        <View className="mt-2 rounded-xl bg-[#E8FAFB] px-3 py-2">
          <Text className="text-sm font-semibold text-gray-900">{value.name}</Text>
          <Text className="text-xs text-gray-600">{value.formattedAddress}</Text>
          {value.lat != null && value.lng != null && (
            <Text className="mt-1 text-xs text-[#008C99]">
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </Text>
          )}
        </View>
      )}

      {error && <Text className="mt-1 text-xs text-red-600">{error}</Text>}
      {Platform.OS === 'web' && (
        <Text className="mt-1 text-xs text-amber-600">
          Map works best on iOS/Android builds.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapBox: { height: 220, width: '100%', backgroundColor: '#e5e7eb' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
