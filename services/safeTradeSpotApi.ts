import axiosInstance from '../config/axios';
import { ENDPOINTS } from '../config/api';

export type SafeTradeLocation = {
  name: string;
  formattedAddress: string;
  lat?: number;
  lng?: number;
  placeId?: string;
};

export type SafeTradeSpot = {
  _id: string;
  chatThreadId: string;
  initiatorUserId: string;
  recipientUserId: string;
  status:
    | 'pending'
    | 'accepted'
    | 'counter_proposed'
    | 'locked'
    | 'completed'
    | 'cancelled'
    | 'expired';
  location: SafeTradeLocation;
  scheduledDate: string;
  scheduledDay: string;
  scheduledTime: string;
  scheduledAt: string;
  lockedAt?: string | null;
};

function tzOffset() {
  return new Date().getTimezoneOffset();
}

class SafeTradeSpotAPI {
  async create(chatId: string, data: {
    location: SafeTradeLocation;
    scheduledDate: string;
    scheduledTime: string;
  }) {
    const response = await axiosInstance.post(ENDPOINTS.CHAT.CREATE_SAFE_TRADE_SPOT(chatId), {
      ...data,
      timezoneOffsetMinutes: tzOffset(),
    });
    return response.data;
  }

  async getActive(chatId: string) {
    const response = await axiosInstance.get(ENDPOINTS.CHAT.ACTIVE_SAFE_TRADE_SPOT(chatId));
    return response.data;
  }

  async getOne(id: string) {
    const response = await axiosInstance.get(ENDPOINTS.SAFE_TRADE_SPOT.GET(id));
    return response.data;
  }

  async respond(
    id: string,
    body: {
      action: 'accept' | 'counter_propose';
      location?: SafeTradeLocation;
      scheduledDate?: string;
      scheduledTime?: string;
    }
  ) {
    const response = await axiosInstance.patch(ENDPOINTS.SAFE_TRADE_SPOT.RESPOND(id), {
      ...body,
      timezoneOffsetMinutes: tzOffset(),
    });
    return response.data;
  }

  async cancel(id: string) {
    const response = await axiosInstance.post(ENDPOINTS.SAFE_TRADE_SPOT.CANCEL(id));
    return response.data;
  }

  async shareLocation(id: string, recipientEmail: string, relationship: string) {
    const response = await axiosInstance.post(ENDPOINTS.SAFE_TRADE_SPOT.SHARE(id), {
      recipientEmail,
      relationship,
    });
    return response.data;
  }
}

export default new SafeTradeSpotAPI();
