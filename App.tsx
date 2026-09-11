import * as React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Lazy load expo modules to prevent crashes in production
let Linking: any = null;
let SplashScreen: any = null;

try {
  Linking = require('expo-linking');
} catch (error) {
  console.warn('⚠️ expo-linking not available:', error);
}

try {
  SplashScreen = require('expo-splash-screen');
} catch (error) {
  console.warn('⚠️ expo-splash-screen not available:', error);
}

if (SplashScreen) {
  SplashScreen.preventAutoHideAsync();
}

// IAP will be initialized inside the app component after mount
// This prevents initialization errors on different platforms

import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Error Boundary Component to catch crashes
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <View style={errorStyles.iconContainer}>
            <Text style={errorStyles.icon}>⚠️</Text>
          </View>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Text style={errorStyles.subtitle}>Please restart the app to continue</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#008c99',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#008c99',
    fontWeight: '500',
  },
});

import SignIn from './app/screens/SignIn';
import SignUp from './app/screens/Signup';
import ProfileSetup from './app/screens/ProfileSetup';
import HomeScreen from './app/screens/Home';
import ProfileScreen from './app/screens/Profile';
import ForgotPasswordScreen from './app/screens/ForgotPassword';
import OTPScreen from './app/screens/Otp';
import PasswordChangeScreen from './app/screens/ChangePassword';
import OtherProfileScreen from './app/screens/OtherProfile';
import ActiveTradesScreen from './app/screens/ActiveTrade';
import ProposeBarterScreen from './app/screens/ProposeBarter';
import TradeDetailsScreen from './app/screens/TradeScreen';
import ChatsScreen from './app/screens/ChatScreen';
import Chat from './app/screens/Chat';
import CallScreen from './app/screens/CallScreen';
import SettingsScreen from './app/screens/Setting';
import RatingScreen from './app/screens/Rating';
import SubscriptionScreen from './app/screens/Subscription';
import SubscriptionSuccessScreen from './app/screens/SubscriptionSuccess';
import SubscriptionCancelScreen from './app/screens/SubscriptionCancel';
import SecurityScreen from './app/screens/Security';
import MySubscriptionScreen from './app/screens/Mysubscription';
import HelpSupportScreen from './app/screens/Helpandsupport';
import PrivacyScreen from './app/screens/Privacy';
import NotificationScreen from './app/screens/Notifcation';
import EditProfile from './app/screens/EditProfile';
import TermsPoliciesScreen from './app/screens/TermsAndPolicy';
import GetStartedPage from './app/screens/Welocme';
import UserDiscoveryScreen from './app/screens/UserDiscovery';
import AboutATCScreen from './app/screens/AboutATC';
import FriendsListScreen from './app/screens/FriendsList';
import ServiceAccountScreen from './app/screens/ServiceAccountScreen';


import './global.css';

import type { RootStackParamList } from './types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const prefix = Linking?.createURL?.('/') || 'atc://';

const linking = {
  prefixes: [prefix, 'atc://'],
  config: {
    screens: {
      Home: 'home',
      Subscription: 'subscription',
      SubscriptionSuccess: {
        path: 'subscription/success',
        parse: { session_id: (session_id: string) => session_id },
      },
      SubscriptionCancel: 'subscription/cancel',
    },
  },
};

// Teal theme — NavigationContainer background is teal, never white
const AppTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#008c99' },
};

// Renders immediately — no auth provider splash delays.
// contentStyle sets a teal background on EVERY screen so a partial render
// never looks like a blank white screen.
const AppNavigator = () => (
  <AuthProvider>
    <NavigationContainer linking={linking} theme={AppTheme}>
      <NotificationProvider>
        <Stack.Navigator
          id="main"
          initialRouteName="Getstarted"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#008c99' },
          }}
        >
          <Stack.Screen name="Getstarted" component={GetStartedPage} />
          <Stack.Screen name="AboutATC" component={AboutATCScreen} />
          <Stack.Screen name="SignIn" component={SignIn} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetup} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="UserDiscovery" component={UserDiscoveryScreen} />
          <Stack.Screen name="FriendsList" component={FriendsListScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="OTPScreen" component={OTPScreen} />
          <Stack.Screen name="PasswordChangeScreen" component={PasswordChangeScreen} />
          <Stack.Screen name="OtherProfile" component={OtherProfileScreen} />
          <Stack.Screen name="ProposeBarter" component={ProposeBarterScreen} />
          <Stack.Screen name="ActiveTrades" component={ActiveTradesScreen} />
          <Stack.Screen name="Trades" component={TradeDetailsScreen} />
          <Stack.Screen name="Chats" component={ChatsScreen} />
          <Stack.Screen name="Chat" component={Chat} />
          <Stack.Screen
            name="CallScreen"
            component={CallScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Subscription" component={SubscriptionScreen} />
          <Stack.Screen name="SubscriptionSuccess" component={SubscriptionSuccessScreen} />
          <Stack.Screen name="SubscriptionCancel" component={SubscriptionCancelScreen} />
          <Stack.Screen name="Rating" component={RatingScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Editprofile" component={EditProfile} />
          <Stack.Screen name="Mysubscription" component={MySubscriptionScreen} />
          <Stack.Screen name="Security" component={SecurityScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
          <Stack.Screen name="Help" component={HelpSupportScreen} />
          <Stack.Screen name="Notification" component={NotificationScreen} />
          <Stack.Screen name="Terms&Policy" component={TermsPoliciesScreen} />
          <Stack.Screen name="ServiceAccount" component={ServiceAccountScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NotificationProvider>
    </NavigationContainer>
  </AuthProvider>
);

function App() {
  React.useEffect(() => {
    // Dismiss native splash immediately — screens show their own branded backgrounds
    if (SplashScreen) SplashScreen.hideAsync().catch(() => { });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#008c99' }}>
      <SafeAreaProvider style={{ backgroundColor: '#008c99' }}>
        <ErrorBoundary>
          <AppNavigator />
        </ErrorBoundary>
      </SafeAreaProvider>
    </View>
  );
}

export default App;
