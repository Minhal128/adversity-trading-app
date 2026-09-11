import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Splash: undefined;
  Getstarted: undefined;
  AboutATC: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ProfileSetup: undefined;
  Home: undefined;
  UserDiscovery: undefined;
  FriendsList: undefined;
  Profile: undefined;
  ForgotPassword: undefined;
  OTPScreen: { userId?: string; email: string; isPasswordReset?: boolean };
  PasswordChangeScreen: { email?: string; otp?: string; isPasswordReset?: boolean };
  ChangePassword: { email?: string; isPasswordReset?: boolean };
  OtherProfile: { userId: string; userName: string; rating?: number };
  ProposeBarter: { userId: string; userName: string; friendRequestId?: string };
  ActiveTrades: undefined;
  Trades: undefined;
  TradeScreen: { tradeId: string };
  Chats: undefined;
  Chat: { chatId?: string; userName?: string; userAvatar?: string; userId?: string; otherUserId?: string };
  CallScreen: {
    call: any;
    isVideoCall: boolean;
    otherUserName: string;
    otherUserAvatar?: string;
  };
  Subscription: undefined;
  SubscriptionSuccess: { session_id?: string };
  SubscriptionCancel: undefined;
  Rating: { trade: any; barterId: string; userName: string; userImage?: string };
  Settings: undefined;
  Editprofile: undefined;
  Mysubscription: undefined;
  Security: undefined;
  Privacy: undefined;
  Help: undefined;
  Notification: undefined;
  'Terms&Policy': undefined;
  ServiceAccount: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
