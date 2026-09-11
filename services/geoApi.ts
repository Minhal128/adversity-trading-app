import axiosInstance from '../config/axios';
import { ENDPOINTS } from '../config/api';
import type { SafeTradeLocation } from './safeTradeSpotApi';

class GeoAPI {
  async search(q: string): Promise<SafeTradeLocation[]> {
    const response = await axiosInstance.get(ENDPOINTS.GEO.SEARCH, { params: { q } });
    return response.data.results || [];
  }

  async reverse(lat: number, lng: number): Promise<SafeTradeLocation> {
    const response = await axiosInstance.get(ENDPOINTS.GEO.REVERSE, {
      params: { lat, lng },
    });
    return response.data.location;
  }
}

export default new GeoAPI();
