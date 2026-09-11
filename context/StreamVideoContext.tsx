import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { STREAM_API_KEY, STREAM_CONFIG } from '../config/streamConfig';
import { useAuth } from './AuthContext';
import axios from 'axios';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Stream Video SDK references
let StreamVideoClient: any = null;
let StreamVideo: any = null;

// Only attempt to load Stream Video SDK on native platforms and not in Expo Go
const loadStreamVideoSDK = () => {
  // Skip in Expo Go - WebRTC native modules are not available
  if (isExpoGo) {
    return { client: null, provider: null };
  }
  
  if (Platform.OS === 'web') {
    return { client: null, provider: null };
  }
  
  try {
    const streamVideo = require('@stream-io/video-react-native-sdk');
    return { 
      client: streamVideo?.StreamVideoClient || null,
      provider: streamVideo?.StreamVideo || null
    };
  } catch (error) {
    // Only warn in development builds, not Expo Go
    if (!isExpoGo) {
      console.warn('⚠️ Stream Video SDK not available:', error);
    }
    return { client: null, provider: null };
  }
};

interface StreamVideoContextType {
  client: any;
  isInitialized: boolean;
  isConnecting: boolean;
  error: string | null;
  initializeClient: () => Promise<void>;
}

export const StreamVideoContext = React.createContext<StreamVideoContextType>({
  client: null,
  isInitialized: false,
  isConnecting: false,
  error: null,
  initializeClient: async () => {},
});

export const StreamVideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<any>(null);
  const { user, token: authToken } = useAuth();

  const initializeClient = useCallback(async () => {
    // Skip in Expo Go - native modules not available
    if (isExpoGo) {
      console.log('📱 Running in Expo Go - Stream Video disabled');
      setIsInitialized(true);
      return;
    }
    
    // Skip on web platform
    if (Platform.OS === 'web') {
      console.log('🌐 Running on web - Stream Video disabled');
      setIsInitialized(true);
      return;
    }

    // Need user to be authenticated
    if (!user || !authToken) {
      console.log('👤 User not authenticated - waiting for auth');
      setIsInitialized(true);
      return;
    }

    // Already connected
    if (clientRef.current) {
      console.log('✅ Stream client already initialized');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Load SDK lazily
      const { client: StreamVideoClientClass } = loadStreamVideoSDK();
      
      if (!StreamVideoClientClass) {
        console.warn('⚠️ Stream Video SDK not available');
        setIsInitialized(true);
        setIsConnecting(false);
        return;
      }

      // Get token from backend
      console.log('🔑 Fetching Stream token from backend...');
      const response = await axios.get(STREAM_CONFIG.tokenProviderUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.data.success || !response.data.token) {
        throw new Error('Failed to get Stream token from server');
      }

      const streamToken = response.data.token;
      const userId = response.data.userId || user.id.toString();

      console.log('🎥 Initializing Stream Video client...');
      
      // Create the Stream Video client
      const streamClient = new StreamVideoClientClass({
        apiKey: STREAM_API_KEY,
        user: {
          id: userId,
          name: user.name || 'User',
          image: user.profileImage || undefined,
        },
        token: streamToken,
      });

      clientRef.current = streamClient;
      setClient(streamClient);
      setIsInitialized(true);
      console.log('✅ Stream Video client initialized successfully');

    } catch (err: any) {
      console.error('❌ Stream Video initialization error:', err);
      setError(err.message || 'Failed to initialize video client');
      setIsInitialized(true);
    } finally {
      setIsConnecting(false);
    }
  }, [user, authToken]);

  // Initialize when user logs in
  useEffect(() => {
    if (user && authToken && !clientRef.current && !isConnecting) {
      initializeClient();
    }
  }, [user, authToken, initializeClient, isConnecting]);

  // Cleanup on unmount or logout
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        console.log('🧹 Cleaning up Stream client');
        try {
          clientRef.current.disconnectUser();
        } catch (e) {
          // Ignore cleanup errors
        }
        clientRef.current = null;
        setClient(null);
      }
    };
  }, []);

  // If SDK not available, render children without provider wrapper
  if (isExpoGo || Platform.OS === 'web') {
    return (
      <StreamVideoContext.Provider value={{ 
        client: null, 
        isInitialized: true, 
        isConnecting: false, 
        error: null,
        initializeClient: async () => {} 
      }}>
        {children}
      </StreamVideoContext.Provider>
    );
  }

  // Load the StreamVideo provider component
  const { provider: StreamVideoComponent } = loadStreamVideoSDK();

  // If client is ready and StreamVideo component exists, wrap with it
  if (client && StreamVideoComponent) {
    return (
      <StreamVideoContext.Provider value={{ 
        client, 
        isInitialized, 
        isConnecting, 
        error,
        initializeClient 
      }}>
        <StreamVideoComponent client={client}>
          {children}
        </StreamVideoComponent>
      </StreamVideoContext.Provider>
    );
  }

  // Otherwise just provide context without StreamVideo wrapper
  return (
    <StreamVideoContext.Provider value={{ 
      client, 
      isInitialized, 
      isConnecting, 
      error,
      initializeClient 
    }}>
      {children}
    </StreamVideoContext.Provider>
  );
};

export const useStreamVideo = () => {
  const context = React.useContext(StreamVideoContext);
  return context.client;
};

export const useStreamVideoContext = () => {
  return React.useContext(StreamVideoContext);
};
