import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// Lazy load storage utilities to prevent initialization crashes
let storageUtils: any = null;
const getStorageUtils = () => {
  if (!storageUtils) {
    try {
      storageUtils = require('../utils/storage');
    } catch (error) {
      console.warn('⚠️ Storage utils not available:', error);
      // Provide fallback empty functions
      storageUtils = {
        saveToken: async () => { },
        getToken: async () => null,
        clearToken: async () => { },
        saveUser: async () => { },
        getUser: async () => null,
        clearUser: async () => { },
        saveUserId: async () => { },
        getUserId: async () => null,
      };
    }
  }
  return storageUtils;
};

// Lazy load auth API
let authApiModule: any = null;
const getAuthApi = () => {
  if (!authApiModule) {
    try {
      authApiModule = require('../services/authApi').default;
    } catch (error) {
      console.warn('⚠️ Auth API not available:', error);
      authApiModule = { getProfile: async () => ({ user: null }) };
    }
  }
  return authApiModule;
};

// Lazy load socket service
let socketServiceModule: any = null;
const getSocketService = () => {
  if (!socketServiceModule) {
    try {
      socketServiceModule = require('../services/socketService').default;
    } catch (error) {
      console.warn('⚠️ Socket service not available:', error);
      socketServiceModule = { connect: async () => { }, disconnect: () => { } };
    }
  }
  return socketServiceModule;
};

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: {
    url: string;
    public_id: string;
  };
  skills?: string[];
  serviceSeeking?: string;
  subscription?: {
    plan: string | null;
    status: string | null;
  };
  credits?: number;
  isVerified: boolean;
  friends?: Array<string | { _id: string; name: string; email: string; profileImage?: { url: string }; skills_offered?: string[]; skills_wanted?: string[]; rating?: number }>;
  trades?: any[];
  rating?: number;
  location?: string;
  notificationPreferences?: {
    email?: boolean;
    push?: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  userId: string | null;
  loading: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user data on app start
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storage = getStorageUtils();
      const storedToken = await storage.getToken();
      const storedUser = await storage.getUser();
      const storedUserId = await storage.getUserId();

      if (storedToken && storedUser) {
        // Normalize user data - ensure 'id' field exists
        const normalizedUser = {
          ...storedUser,
          id: storedUser.id || (storedUser as any)._id
        };

        setToken(storedToken);
        setUser(normalizedUser);
        setUserId(storedUserId || normalizedUser.id);

        console.log('✅ Loaded user:', normalizedUser.name, 'ID:', normalizedUser.id);

        // Connect socket after loading user data
        try {
          const socketService = getSocketService();
          await socketService.connect();
        } catch (socketError) {
          console.warn('⚠️ Socket connection failed:', socketError);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (authToken: string, userData: User) => {
    try {
      console.log('🔐 Login function called with token:', authToken ? 'yes' : 'no');
      console.log('🔐 Login function called with user:', userData?.email || 'no email');

      const storage = getStorageUtils();
      // Normalize user data - backend sends _id but we use id
      const normalizedUser = {
        ...userData,
        id: userData.id || (userData as any)._id
      };

      console.log('🔐 Saving token to storage...');
      await storage.saveToken(authToken);
      console.log('🔐 Saving user to storage...');
      await storage.saveUser(normalizedUser);
      console.log('🔐 Saving userId to storage...');
      await storage.saveUserId(normalizedUser.id);

      setToken(authToken);
      setUser(normalizedUser);
      setUserId(normalizedUser.id);

      console.log('✅ Logged in user:', normalizedUser.name, 'ID:', normalizedUser.id);
      console.log('✅ Token saved successfully');

      // Connect socket after login
      try {
        const socketService = getSocketService();
        await socketService.connect();
      } catch (socketError) {
        console.warn('⚠️ Socket connection failed:', socketError);
      }
    } catch (error) {
      console.error('❌ Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const storage = getStorageUtils();
      // Disconnect socket before logout
      try {
        const socketService = getSocketService();
        socketService.disconnect();
      } catch (socketError) {
        console.warn('⚠️ Socket disconnect failed:', socketError);
      }

      await storage.clearToken();
      await storage.clearUser();

      setToken(null);
      setUser(null);
      setUserId(null);

      console.log('✅ Logout complete');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const storage = getStorageUtils();
      const updatedUser = { ...user, ...userData } as User;
      await storage.saveUser(updatedUser);
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const storage = getStorageUtils();
      const authApi = getAuthApi();
      const response = await authApi.getProfile();
      const userData = response.user || response.data?.user;

      if (userData) {
        // Normalize user data - ensure 'id' field exists
        const normalizedUser = {
          ...userData,
          id: userData.id || userData._id
        };

        await storage.saveUser(normalizedUser);
        setUser(normalizedUser);

        console.log('✅ Refreshed user:', normalizedUser.name, 'ID:', normalizedUser.id);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      throw error;
    }
  }, []);

  const value = {
    user,
    token,
    userId,
    loading,
    login,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
