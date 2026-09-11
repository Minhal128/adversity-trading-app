import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SafeTradeSpot } from '../../services/safeTradeSpotApi';
import { openMapsNavigation } from '../../utils/openMapsNavigation';

type Props = {
  spot: SafeTradeSpot;
  onShare: () => void;
  onCancel: () => void;
};

function formatCountdown(ms: number) {
  if (ms <= 0) return 'Now';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function SafeTradeSpotLockedBanner({ spot, onShare, onCancel }: Props) {
  const [left, setLeft] = useState(() => new Date(spot.scheduledAt).getTime() - Date.now());

  useEffect(() => {
    const tick = () => setLeft(new Date(spot.scheduledAt).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [spot.scheduledAt]);

  if (spot.status === 'cancelled') {
    return (
      <View className="mx-4 mb-2 rounded-2xl bg-red-50 px-4 py-3">
        <Text className="text-sm font-medium text-red-700">Safe Trade Spot cancelled</Text>
      </View>
    );
  }

  if (spot.status !== 'locked') return null;

  return (
    <View className="mx-4 mb-2 rounded-2xl border border-[#008C99]/40 bg-[#E8FAFB] px-4 py-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-xs font-semibold uppercase text-[#008C99]">Confirmed meetup</Text>
          <Text className="mt-1 text-sm font-bold text-gray-900">{spot.location.name}</Text>
          <Text className="text-xs text-gray-600">{spot.location.formattedAddress}</Text>
          <Text className="mt-1 text-sm text-gray-800">
            {spot.scheduledDay} · {spot.scheduledDate} · {spot.scheduledTime}
          </Text>
          <Text className="mt-1 text-xs font-medium text-[#008C99]">
            Starts in {formatCountdown(left)}
          </Text>
        </View>
        <TouchableOpacity onPress={() => openMapsNavigation(spot.location)} className="p-1">
          <Ionicons name="navigate" size={22} color="#008C99" />
        </TouchableOpacity>
      </View>

      <View className="mt-3 flex-row gap-2">
        <TouchableOpacity
          onPress={onShare}
          className="flex-1 flex-row items-center justify-center rounded-xl bg-[#008C99] py-2.5">
          <Ionicons name="share-social-outline" size={16} color="#fff" />
          <Text className="ml-1 text-sm font-semibold text-white">Share Location</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCancel}
          className="items-center justify-center rounded-xl border border-red-300 px-3 py-2.5">
          <Text className="text-sm font-medium text-red-600">Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
