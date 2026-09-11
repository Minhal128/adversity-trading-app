import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';

// Lazy load notifications module to prevent crashes
let notificationServiceModule: any = null;

const getNotificationService = () => {
  if (!notificationServiceModule) {
    try {
      notificationServiceModule = require('../services/notificationService').default;
    } catch (error) {
      console.warn('⚠️ Notification service not available:', error);
      notificationServiceModule = {
        registerForPushNotifications: async () => null,
        savePushTokenToBackend: async () => {},
        addNotificationReceivedListener: () => null,
        addNotificationResponseListener: () => null,
        removeNotificationListener: () => {},
      };
    }
  }
  return notificationServiceModule;
};

interface NotificationContextType {
  expoPushToken: string | null;
  notification: any | null;
  initializeNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // Return a default context instead of throwing
    return {
      expoPushToken: null,
      notification: null,
      initializeNotifications: async () => {},
    };
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any | null>(null);
  const notificationListener = useRef<any | null>(null);
  const responseListener = useRef<any | null>(null);
  
  // Get auth context - this is safe because NotificationProvider is inside AuthProvider
  const { user, isAuthenticated } = useAuth();

  const initializeNotifications = async () => {
    try {
      const notificationService = getNotificationService();
      const token = await notificationService.registerForPushNotifications();
      if (token) {
        setExpoPushToken(token);
        // Save token to backend if user is authenticated
        if (isAuthenticated) {
          try {
            await notificationService.savePushTokenToBackend(token);
          } catch (saveError) {
            console.warn('⚠️ Could not save push token to backend:', saveError);
          }
        }
      }
    } catch (error) {
      // Silently handle notification errors - don't crash the app
      console.warn('⚠️ Notifications not available:', error);
    }
  };

  useEffect(() => {
    const notificationService = getNotificationService();
    
    // Initialize push notifications when user is authenticated
    if (isAuthenticated && user) {
      initializeNotifications();
    }

    // Set up notification listeners
    try {
      notificationListener.current = notificationService.addNotificationReceivedListener(
        (notification: any) => {
          console.log('Notification received:', notification);
          setNotification(notification);
        }
      );

      responseListener.current = notificationService.addNotificationResponseListener(
        (response: any) => {
          console.log('Notification response:', response);
          const data = response?.notification?.request?.content?.data;

          // Store the notification data for navigation handling
          // Navigation will be handled by screens that check this data
          console.log('Notification data:', data);
        }
      );
    } catch (error) {
      console.warn('⚠️ Error setting up notification listeners:', error);
    }

    // Cleanup listeners on unmount
    return () => {
      try {
        if (notificationListener.current) {
          notificationService.removeNotificationListener(notificationListener.current);
        }
        if (responseListener.current) {
          notificationService.removeNotificationListener(responseListener.current);
        }
      } catch (error) {
        console.warn('⚠️ Error cleaning up notification listeners:', error);
      }
    };
  }, [isAuthenticated, user]);

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        initializeNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
