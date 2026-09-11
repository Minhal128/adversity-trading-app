import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axiosInstance from '../config/axios';
import { ENDPOINTS } from '../config/api';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;
  private isInitialized: boolean = false;

  /**
   * Register for push notifications and get the Expo push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    // Prevent multiple initialization attempts
    if (this.isInitialized) {
      return this.expoPushToken;
    }
    
    let token: string | null = null;

    // Check if running on a physical device
    if (!Device.isDevice) {
      console.log('ℹ️ Push notifications require a physical device');
      this.isInitialized = true;
      return null;
    }

    try {
      // Check existing permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('ℹ️ Push notification permission not granted');
        this.isInitialized = true;
        return null;
      }

      // Set up Android notification channel first (before getting token)
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#008C99',
          });

          await Notifications.setNotificationChannelAsync('subscription', {
            name: 'Subscription Reminders',
            description: 'Notifications about your subscription status',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF7A00',
          });
        } catch (channelError) {
          console.warn('⚠️ Error setting up notification channels:', channelError);
        }
      }

      // Get the Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId || undefined,
        });
        token = tokenData.data;
        this.expoPushToken = token;
        console.log('✅ ====================================');
        console.log('✅ FCM PUSH NOTIFICATIONS CONFIGURED!');
        console.log('✅ ====================================');
        console.log('✅ Expo Push Token:', token);
        console.log('✅ Project ID:', projectId);
        console.log('✅ Platform:', Platform.OS);
        console.log('✅ ====================================');
      } catch (tokenError: any) {
        // Handle all push token errors gracefully - don't crash the app
        const errorMessage = tokenError?.message || String(tokenError);
        console.warn('⚠️ Push notifications unavailable:', errorMessage);
        
        // Common issues:
        // - FirebaseApp not initialized (missing google-services.json)
        // - No project ID configured
        // - Running in Expo Go without proper setup
        this.isInitialized = true;
        return null;
      }

      this.isInitialized = true;
      return token;
    } catch (error: any) {
      console.warn('⚠️ Error registering for push notifications:', error?.message || error);
      this.isInitialized = true;
      return null;
    }
  }

  /**
   * Save the push token to the backend
   */
  async savePushTokenToBackend(token: string): Promise<boolean> {
    try {
      const response = await axiosInstance.post(ENDPOINTS.USER.SAVE_PUSH_TOKEN, {
        expoPushToken: token,
      });
      console.log('Push token saved to backend:', response.data);
      return response.data.success;
    } catch (error) {
      console.error('Error saving push token to backend:', error);
      return false;
    }
  }

  /**
   * Register and save push token (convenience method)
   */
  async initializePushNotifications(): Promise<boolean> {
    const token = await this.registerForPushNotifications();
    if (token) {
      return await this.savePushTokenToBackend(token);
    }
    return false;
  }

  /**
   * Get the current push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Schedule a local notification (for testing or offline reminders)
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
    triggerSeconds?: number
  ): Promise<string> {
    const trigger: Notifications.NotificationTriggerInput = triggerSeconds
      ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: triggerSeconds }
      : null;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger,
    });

    return notificationId;
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Add listener for when a notification is received while app is foregrounded
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Add listener for when user taps on a notification
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Remove a notification listener
   */
  removeNotificationListener(subscription: Notifications.Subscription): void {
    subscription.remove();
  }

  /**
   * TEST: Show a notification immediately
   * Call this to verify notifications are working
   */
  async testNotification(): Promise<string> {
    console.log('🔔 Sending test notification...');
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 ATC Notification Test',
        body: 'ATC notification is working',
        data: { test: true },
        sound: 'default',
      },
      trigger: null, // null means show immediately
    });

    console.log('✅ Test notification sent! ID:', notificationId);
    return notificationId;
  }
}

export default new NotificationService();
