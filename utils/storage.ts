import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  TOKEN: '@auth_token',
  USER: '@user_data',
  USER_ID: '@user_id',
  OAUTH_USER: '@oauth_user_temp',
};

// Token management
export const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
  } catch (error) {
    console.error('Error saving token:', error);
    throw error;
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const clearToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error clearing token:', error);
    throw error;
  }
};

// User data management
export const saveUser = async (user: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

export const getUser = async (): Promise<any | null> => {
  try {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const clearUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  } catch (error) {
    console.error('Error clearing user:', error);
    throw error;
  }
};

// User ID management
export const saveUserId = async (userId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  } catch (error) {
    console.error('Error saving user ID:', error);
    throw error;
  }
};

export const getUserId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

export const clearUserId = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_ID);
  } catch (error) {
    console.error('Error clearing user ID:', error);
    throw error;
  }
};

// OAuth user temporary storage (for users completing profile)
export const saveOAuthUser = async (oauthUser: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.OAUTH_USER, JSON.stringify(oauthUser));
  } catch (error) {
    console.error('Error saving OAuth user:', error);
    throw error;
  }
};

export const getOAuthUser = async (): Promise<any | null> => {
  try {
    const oauthUserData = await AsyncStorage.getItem(STORAGE_KEYS.OAUTH_USER);
    return oauthUserData ? JSON.parse(oauthUserData) : null;
  } catch (error) {
    console.error('Error getting OAuth user:', error);
    return null;
  }
};

export const clearOAuthUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.OAUTH_USER);
  } catch (error) {
    console.error('Error clearing OAuth user:', error);
    throw error;
  }
};

// Clear all storage
export const clearAllStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.USER_ID,
      STORAGE_KEYS.OAUTH_USER,
    ]);
  } catch (error) {
    console.error('Error clearing all storage:', error);
    throw error;
  }
};
