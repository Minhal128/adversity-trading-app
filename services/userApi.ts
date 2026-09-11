import axiosInstance from '../config/axios';
import { ENDPOINTS } from '../config/api';

export interface EditProfileData {
  name?: string;
  phone?: string;
  skills?: string[];
  serviceSeeking?: string;
  profileImage?: any;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

class UserAPI {
  async getProfile() {
    const response = await axiosInstance.get(ENDPOINTS.USER.GET_PROFILE);
    return response.data;
  }

  async editProfile(data: EditProfileData) {
    const formData = new FormData();

    if (data.name) formData.append('name', data.name);
    if (data.phone) formData.append('phone', data.phone);
    if (data.skills) formData.append('skills', data.skills.join(','));
    if (data.serviceSeeking) formData.append('serviceSeeking', data.serviceSeeking);

    // Add profile image if provided
    if (data.profileImage) {
      // @ts-ignore
      formData.append('profileImage', data.profileImage);
    }

    const response = await axiosInstance.put(
      ENDPOINTS.USER.EDIT_PROFILE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async changePassword(data: ChangePasswordData) {
    const response = await axiosInstance.put(ENDPOINTS.USER.CHANGE_PASSWORD, data);
    return response.data;
  }

  async logout() {
    const response = await axiosInstance.post(ENDPOINTS.USER.LOGOUT);
    return response.data;
  }

  async deleteAccount() {
    const response = await axiosInstance.delete(ENDPOINTS.USER.DELETE_ACCOUNT);
    return response.data;
  }

  async searchUsers(query: string) {
    const response = await axiosInstance.get(ENDPOINTS.USER.SEARCH, { params: { query } });
    return response.data;
  }

  async getUserById(userId: string) {
    const response = await axiosInstance.get(`${ENDPOINTS.USER.GET_PROFILE}/${userId}`);
    return response.data;
  }

  async blockUser(userId: string) {
    const response = await axiosInstance.post(`${ENDPOINTS.USER.BLOCK_USER}/${userId}`);
    return response.data;
  }

  async unblockUser(userId: string) {
    const response = await axiosInstance.post(`${ENDPOINTS.USER.UNBLOCK_USER}/${userId}`);
    return response.data;
  }

  async reportUser(data: { reportedUserId: string; reason: string; description?: string }) {
    const response = await axiosInstance.post(ENDPOINTS.USER.REPORT_USER, data);
    return response.data;
  }
}

export default new UserAPI();
