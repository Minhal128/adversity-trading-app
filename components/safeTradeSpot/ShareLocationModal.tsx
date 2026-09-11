import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SafeTradeSpot } from '../../services/safeTradeSpotApi';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  visible: boolean;
  spot: SafeTradeSpot;
  onClose: () => void;
  onSubmit: (recipientEmail: string, relationship: string) => Promise<void>;
};

export default function ShareLocationModal({ visible, spot, onClose, onSubmit }: Props) {
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      Alert.alert('Invalid email', 'Enter a valid recipient email');
      return;
    }
    if (!relationship.trim()) {
      Alert.alert('Required', 'Relationship is required (e.g. Parent, Friend)');
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit(trimmed, relationship.trim());
      setEmail('');
      setRelationship('');
      Alert.alert('Shared', 'Trusted contact email sent');
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to share');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white px-5 pb-8 pt-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-900">Share Location</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text className="mb-1 text-sm font-medium text-gray-700">Recipient Email</Text>
          <TextInput
            className="mb-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
            placeholder="friend@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text className="mb-1 text-sm font-medium text-gray-700">Relationship</Text>
          <TextInput
            className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
            placeholder="Parent, Sibling, Friend…"
            value={relationship}
            onChangeText={setRelationship}
            maxLength={80}
          />

          <View className="mb-4 rounded-xl bg-gray-50 p-3">
            <Text className="text-xs font-semibold uppercase text-gray-500">Meetup (read-only)</Text>
            <Text className="mt-1 text-sm text-gray-800">
              {spot.scheduledDay} · {spot.scheduledDate} · {spot.scheduledTime}
            </Text>
            <Text className="mt-1 text-sm text-gray-800">{spot.location.name}</Text>
            <Text className="text-xs text-gray-500">{spot.location.formattedAddress}</Text>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className="items-center rounded-2xl bg-[#008C99] py-4">
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-semibold text-white">Send to trusted contact</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
