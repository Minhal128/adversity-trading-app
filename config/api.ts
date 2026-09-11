// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://stingray-app-priwf.ondigitalocean.app', // Production backend (DigitalOcean)
  SOCKET_URL: 'https://stingray-app-priwf.ondigitalocean.app',
  TIMEOUT: 30000,
};

export const ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: '/api/auth/register',
    VERIFY_OTP: '/api/auth/verify-otp',
    LOGIN: '/api/auth/login',
    OAUTH_LOGIN: '/api/auth/oauth-login',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    COMPLETE_PROFILE: '/api/auth/complete-profile',
    GET_PROFILE: '/api/auth/profile',
  },

  // User endpoints
  USER: {
    GET_PROFILE: '/api/user/profile',
    EDIT_PROFILE: '/api/user/edit-profile',
    CHANGE_PASSWORD: '/api/user/change-password',
    LOGOUT: '/api/user/logout',
    DELETE_ACCOUNT: '/api/user/delete-account',
    SEARCH: '/api/user/search',
    SAVE_PUSH_TOKEN: '/api/user/push-token',
    UPDATE_NOTIFICATION_PREFS: '/api/user/notification-preferences',
    REMOVE_PUSH_TOKEN: '/api/user/push-token',
    BLOCK_USER: '/api/user/block',
    UNBLOCK_USER: '/api/user/unblock',
    REPORT_USER: '/api/user/report',
  },

  // Barter endpoints
  BARTER: {
    GET_FRIEND_REQUESTS: '/api/barter/friend-requests',
    GET_ALL_FRIEND_REQUESTS: '/api/barter/friend-requests/all',
    GET_PENDING_BARTERS: '/api/barter/pending-barters',
    SEND_FRIEND_REQUEST: '/api/barter/friend-request',
    ACCEPT_FRIEND_REQUEST: (requestId: string) => `/api/barter/friend-request/${requestId}/accept`,
    PROPOSE_BARTER: '/api/barter/barter',
    ACCEPT_BARTER: (barterId: string) => `/api/barter/barter/${barterId}/accept`,
    COMPLETE_BARTER: '/api/barter/complete',
    GET_SUGGESTIONS: '/api/barter/suggestions',
    GET_ACTIVE_TRADES: '/api/barter/trades',
  },

  // Chat endpoints
  CHAT: {
    SEND_MESSAGE: '/api/chat/send',
    SEND_MEDIA: '/api/chat/send-media',
    GET_MESSAGES: (chatId: string) => `/api/chat/${chatId}`,
    MARK_SEEN: (chatId: string) => `/api/chat/seen/${chatId}`,
    GET_CHATS: '/api/chat/list',
    GET_OR_CREATE: '/api/chat/get-or-create',
    CREATE_SAFE_TRADE_SPOT: (chatId: string) => `/api/chat/${chatId}/safe-trade-spot`,
    ACTIVE_SAFE_TRADE_SPOT: (chatId: string) => `/api/chat/${chatId}/safe-trade-spot/active`,
  },

  SAFE_TRADE_SPOT: {
    GET: (id: string) => `/api/safe-trade-spot/${id}`,
    RESPOND: (id: string) => `/api/safe-trade-spot/${id}/respond`,
    CANCEL: (id: string) => `/api/safe-trade-spot/${id}/cancel`,
    SHARE: (id: string) => `/api/safe-trade-spot/${id}/share-location`,
  },

  GEO: {
    SEARCH: '/api/geo/search',
    REVERSE: '/api/geo/reverse',
  },

  // Subscription endpoints
  SUBSCRIPTION: {
    CREATE_CHECKOUT: '/api/subscription/create-checkout-session',
    GET_STATUS: '/api/subscription/status',
    VERIFY: '/api/subscription/verify',
    CANCEL: '/api/subscription/cancel',
    GET_PLANS: '/api/subscription/plans',
  },
};
