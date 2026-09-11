import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Payload = {
  safeTradeSpotId: string;
  status: string;
  location: { name: string; formattedAddress: string };
  scheduledDate: string;
  scheduledDay: string;
  scheduledTime: string;
  initiatorUserId: string;
  recipientUserId: string;
};

type Props = {
  payload: Payload;
  currentUserId?: string;
  busy?: boolean;
  onAccept: () => void;
  onCounter: () => void;
};

export default function SafeTradeSpotInviteCard({
  payload,
  currentUserId,
  busy,
  onAccept,
  onCounter,
}: Props) {
  const isRecipient = currentUserId === payload.recipientUserId;
  const canAct =
    isRecipient &&
    (payload.status === 'pending' || payload.status === 'counter_proposed');
  const isLocked = payload.status === 'locked';
  const isCancelled = payload.status === 'cancelled';

  return (
    <View className="mb-3 w-full max-w-[92%] self-center rounded-2xl border border-[#008C99]/30 bg-white p-4 shadow-sm">
      <View className="mb-2 flex-row items-center">
        <Ionicons name="location" size={18} color="#008C99" />
        <Text className="ml-2 text-base font-bold text-gray-900">Safe Trade Spot</Text>
        <View className="ml-auto rounded-full bg-gray-100 px-2 py-0.5">
          <Text className="text-xs capitalize text-gray-600">{payload.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <Text className="text-sm font-semibold text-gray-800">{payload.location?.name}</Text>
      <Text className="mb-2 text-xs text-gray-500">{payload.location?.formattedAddress}</Text>
      <Text className="text-sm text-gray-700">
        {payload.scheduledDay} · {payload.scheduledDate} · {payload.scheduledTime}
      </Text>

      {isLocked && (
        <Text className="mt-2 text-sm font-medium text-green-700">Meetup confirmed</Text>
      )}
      {isCancelled && (
        <Text className="mt-2 text-sm font-medium text-red-600">Cancelled</Text>
      )}

      {canAct && (
        <View className="mt-3 flex-row gap-2">
          <TouchableOpacity
            onPress={onAccept}
            disabled={busy}
            className="flex-1 items-center rounded-xl bg-[#008C99] py-3">
            {busy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="font-semibold text-white">Accept</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onCounter}
            disabled={busy}
            className="flex-1 items-center rounded-xl border border-[#008C99] py-3">
            <Text className="font-semibold text-[#008C99]">Propose new</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
