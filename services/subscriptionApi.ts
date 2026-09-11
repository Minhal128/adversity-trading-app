import axiosInstance from '../config/axios';
import { ENDPOINTS } from '../config/api';

export interface CreateCheckoutData {
  plan: 'basic' | 'standard' | 'premium';
  successRedirectUrl?: string;
  cancelRedirectUrl?: string;
}

class SubscriptionAPI {
  async createCheckoutSession(data: CreateCheckoutData) {
    console.log('🛒 Creating checkout session with plan:', data.plan);
    const response = await axiosInstance.post(ENDPOINTS.SUBSCRIPTION.CREATE_CHECKOUT, data);
    console.log('✅ Checkout session response:', response.data);
    return response.data;
  }

  async getSubscriptionStatus() {
    const response = await axiosInstance.get(ENDPOINTS.SUBSCRIPTION.GET_STATUS);
    return response.data;
  }

  async cancelSubscription() {
    const response = await axiosInstance.post(ENDPOINTS.SUBSCRIPTION.CANCEL);
    return response.data;
  }

  async getSubscriptionPlans() {
    const response = await axiosInstance.get(ENDPOINTS.SUBSCRIPTION.GET_PLANS);
    return response.data;
  }

  async verifySubscription() {
    const response = await axiosInstance.post(ENDPOINTS.SUBSCRIPTION.VERIFY);
    return response.data;
  }
}

export default new SubscriptionAPI();
