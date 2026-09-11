import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SafeTradeLocation } from '../../services/safeTradeSpotApi';
import LeafletLocationPicker from './LeafletLocationPicker';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeStr(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function combine(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

function deriveDay(dateStr: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return DAYS[new Date(y, m - 1, d).getDay()] || '';
}

function defaultSchedule() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

type Props = {
  visible: boolean;
  initial?: {
    location?: SafeTradeLocation;
    scheduledDate?: string;
    scheduledTime?: string;
  };
  title?: string;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (data: {
    location: SafeTradeLocation;
    scheduledDate: string;
    scheduledTime: string;
  }) => Promise<void>;
};

export default function SafeTradeSpotInviteModal({
  visible,
  initial,
  title = 'Safe Trade Spot',
  submitLabel = 'Send Invite',
  onClose,
  onSubmit,
}: Props) {
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState<SafeTradeLocation | null>(initial?.location || null);
  const [scheduledAt, setScheduledAt] = useState(() => {
    if (initial?.scheduledDate && initial?.scheduledTime) {
      return combine(initial.scheduledDate, initial.scheduledTime);
    }
    return defaultSchedule();
  });
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLocation(initial?.location || null);
    if (initial?.scheduledDate && initial?.scheduledTime) {
      setScheduledAt(combine(initial.scheduledDate, initial.scheduledTime));
    } else {
      setScheduledAt(defaultSchedule());
    }
    setShowDate(false);
    setShowTime(false);
  }, [visible, initial]);

  const scheduledDate = toDateStr(scheduledAt);
  const scheduledTime = toTimeStr(scheduledAt);
  const day = useMemo(() => deriveDay(scheduledDate), [scheduledDate]);

  const minDate = useMemo(() => new Date(Date.now() + 5 * 60 * 1000), [visible]);
  const maxDate = useMemo(() => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), [visible]);

  const onDateChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDate(false);
    if (!date) return;
    const next = new Date(scheduledAt);
    next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    setScheduledAt(next < minDate ? minDate : next > maxDate ? maxDate : next);
  };

  const onTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowTime(false);
    if (!date) return;
    const next = new Date(scheduledAt);
    next.setHours(date.getHours(), date.getMinutes(), 0, 0);
    setScheduledAt(next < minDate ? minDate : next);
  };

  const handleSubmit = async () => {
    if (!location?.name || !location?.formattedAddress) {
      Alert.alert('Pick a location', 'Search or tap the map to set a meetup pin');
      return;
    }
    if (location.lat == null || location.lng == null) {
      Alert.alert('Pick a pin', 'Location must include map coordinates');
      return;
    }
    if (scheduledAt.getTime() < Date.now() + 5 * 60 * 1000) {
      Alert.alert('Invalid time', 'Meetup must be at least 5 minutes from now');
      return;
    }
    if (scheduledAt.getTime() > Date.now() + 90 * 24 * 60 * 60 * 1000) {
      Alert.alert('Invalid date', 'Meetup cannot be more than 90 days out');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        location,
        scheduledDate: toDateStr(scheduledAt),
        scheduledTime: toTimeStr(scheduledAt),
      });
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const dateLabel = scheduledAt.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeLabel = scheduledAt.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View
          className="max-h-[92%] rounded-t-3xl bg-white px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-900">{title}</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}>
            <LeafletLocationPicker value={location} onChange={setLocation} />

            <Text className="mb-1 text-sm font-medium text-gray-700">Date</Text>
            <TouchableOpacity
              onPress={() => setShowDate(true)}
              className="mb-3 flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              accessibilityLabel="Pick date">
              <Text className="text-base text-gray-800">{dateLabel}</Text>
              <Ionicons name="calendar-outline" size={20} color="#008C99" />
            </TouchableOpacity>

            {!!day && (
              <Text className="mb-3 text-sm text-[#008C99]">Day: {day}</Text>
            )}

            <Text className="mb-1 text-sm font-medium text-gray-700">Time</Text>
            <TouchableOpacity
              onPress={() => setShowTime(true)}
              className="mb-6 flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              accessibilityLabel="Pick time">
              <Text className="text-base text-gray-800">{timeLabel}</Text>
              <Ionicons name="time-outline" size={20} color="#008C99" />
            </TouchableOpacity>

            {showDate && (
              <DateTimePicker
                value={scheduledAt}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={minDate}
                maximumDate={maxDate}
                onChange={onDateChange}
              />
            )}
            {Platform.OS === 'ios' && showDate && (
              <TouchableOpacity
                className="mb-3 items-end"
                onPress={() => setShowDate(false)}>
                <Text className="font-semibold text-[#008C99]">Done</Text>
              </TouchableOpacity>
            )}

            {showTime && (
              <DateTimePicker
                value={scheduledAt}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}
            {Platform.OS === 'ios' && showTime && (
              <TouchableOpacity
                className="mb-3 items-end"
                onPress={() => setShowTime(false)}>
                <Text className="font-semibold text-[#008C99]">Done</Text>
              </TouchableOpacity>
            )}

            {/* Web fallback text fields if native picker unavailable */}
            {Platform.OS === 'web' && (
              <Text className="mb-4 text-xs text-gray-500">
                Using system date/time controls. Prefer the mobile app for the native experience.
              </Text>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              className="items-center rounded-2xl bg-[#008C99] py-4"
              accessibilityLabel={submitLabel}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-semibold text-white">{submitLabel}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
