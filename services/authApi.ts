import axiosInstance from '../config/axios';
import { ENDPOINTS } from '../config/api';

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface VerifyOTPData {
  userId: string;
  otp: string;
}

export interface LoginData {
  email?: string;
  phone?: string;
  password: string;
}

export interface OAuthLoginData {
  email: string;
  name?: string;
  providerId: string;
  provider: string;
}

export interface CompleteProfileData {
  name?: string;
  skills: string[];
  serviceSeeking: string;
  profileImage?: {
    uri: string;
    type: string;
    name: string;
  };
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
}

class AuthAPI {
  async register(data: RegisterData) {
    const response = await axiosInstance.post(ENDPOINTS.AUTH.REGISTER, data);
    return response.data;
  }

  async verifyOTP(data: VerifyOTPData) {
    const response = await axiosInstance.post(ENDPOINTS.AUTH.VERIFY_OTP, data);
    return response.data;
  }

  async login(data: LoginData) {
    const response = await axiosInstance.post(ENDPOINTS.AUTH.LOGIN, data);
    return response.data;
  }

  async oauthLogin(data: OAuthLoginData) {
    const response = await axiosInstance.post(ENDPOINTS.AUTH.OAUTH_LOGIN, {
      ...data,
      clerkId: data.providerId,
    });
    return response.data;
  }

  async completeProfile(data: CompleteProfileData) {
    const formData = new FormData();

    // Add name if provided
    if (data.name) {
      formData.append('name', data.name);
    }

    // Add skills as comma-separated string
    formData.append('skills', data.skills.join(','));
    formData.append('serviceSeeking', data.serviceSeeking);

    // Add profile image if provided
    if (data.profileImage) {
      const imageFile = {
        uri: data.profileImage.uri,
        type: data.profileImage.type,
        name: data.profileImage.name,
      };
      // @ts-ignore
      formData.append('profileImage', imageFile);
    }

    const response = await axiosInstance.post(
      ENDPOINTS.AUTH.COMPLETE_PROFILE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async forgotPassword(data: ForgotPasswordData) {
    const response = await axiosInstance.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
    return response.data;
  }

  async resetPassword(data: ResetPasswordData) {
    const response = await axiosInstance.post(ENDPOINTS.AUTH.RESET_PASSWORD, data);
    return response.data;
  }

  async getProfile() {
    const response = await axiosInstance.get(ENDPOINTS.AUTH.GET_PROFILE);
    return response.data;
  }
}

export default new AuthAPI();
