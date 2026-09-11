import axiosInstance from '../config/axios';
import { ENDPOINTS } from '../config/api';

export interface SendFriendRequestData {
  toUserId: string;
}

export interface ProposeBarterData {
  friendRequestId?: string;
  userId?: string;
  offered_skill: string;
  wanted_skill: string;
}

export interface CompleteBarterData {
  barterId: string;
  rating: number;
  comment: string;
}

class BarterAPI {
  async getPendingFriendRequests() {
    const response = await axiosInstance.get(ENDPOINTS.BARTER.GET_FRIEND_REQUESTS);
    return response.data;
  }

  async getAllFriendRequests() {
    const response = await axiosInstance.get(ENDPOINTS.BARTER.GET_ALL_FRIEND_REQUESTS);
    return response.data;
  }

  async getPendingBarters() {
    const response = await axiosInstance.get(ENDPOINTS.BARTER.GET_PENDING_BARTERS);
    return response.data;
  }

  async sendFriendRequest(data: SendFriendRequestData) {
    try {
      console.log('🔵 Sending friend request with data:', data);
      const response = await axiosInstance.post(ENDPOINTS.BARTER.SEND_FRIEND_REQUEST, data);
      console.log('🟢 Friend request sent successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('🔴 Friend request failed:', error.message);
      throw error;
    }
  }

  async acceptFriendRequest(requestId: string) {
    const response = await axiosInstance.put(ENDPOINTS.BARTER.ACCEPT_FRIEND_REQUEST(requestId));
    return response.data;
  }

  async proposeBarter(data: ProposeBarterData) {
    const response = await axiosInstance.post(ENDPOINTS.BARTER.PROPOSE_BARTER, data);
    return response.data;
  }

  async acceptBarter(barterId: string) {
    const response = await axiosInstance.put(ENDPOINTS.BARTER.ACCEPT_BARTER(barterId));
    return response.data;
  }

  async completeBarter(data: CompleteBarterData) {
    const response = await axiosInstance.put(ENDPOINTS.BARTER.COMPLETE_BARTER, data);
    return response.data;
  }

  async getSkillSuggestions() {
    const response = await axiosInstance.get(ENDPOINTS.BARTER.GET_SUGGESTIONS);
    return response.data;
  }

  async getBarterById(barterId: string) {
    const response = await axiosInstance.get(`/api/barter/${barterId}`);
    return response.data;
  }

  async cancelBarter(barterId: string) {
    const response = await axiosInstance.put(`/api/barter/${barterId}/cancel`);
    return response.data;
  }

  async getActiveTrades(status?: string) {
    const params = status ? { status } : {};
    const response = await axiosInstance.get('/api/barter/trades', { params });
    return response.data;
  }
}

export default new BarterAPI();
