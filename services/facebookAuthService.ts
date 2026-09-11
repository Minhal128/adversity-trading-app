export interface FacebookAuthResult {
    success: boolean;
    user?: any;
    token?: string;
    error?: string;
    isNewUser?: boolean;
    hasCompletedProfile?: boolean;
    oauthUser?: any;
}

export const handleFacebookOAuthResult = async (): Promise<FacebookAuthResult> => {
    return {
        success: false,
        error: 'Facebook sign-in is currently disabled.',
    };
};

/**
 * Check if Facebook Sign-In is available
 */
export const isFacebookAuthAvailable = (): boolean => {
    return false;
};
