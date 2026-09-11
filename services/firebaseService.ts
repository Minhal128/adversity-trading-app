import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const googleServices = require('../google-services.json');

const projectInfo = googleServices?.project_info || {};
const androidClient = googleServices?.client?.[0] || {};

const firebaseConfig = {
    apiKey:
        (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_FIREBASE_API_KEY) ||
        androidClient?.api_key?.[0]?.current_key ||
        '',
    authDomain:
        (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN) ||
        (projectInfo?.project_id ? `${projectInfo.project_id}.firebaseapp.com` : ''),
    projectId:
        (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_FIREBASE_PROJECT_ID) ||
        projectInfo?.project_id ||
        '',
    storageBucket:
        (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET) ||
        projectInfo?.storage_bucket ||
        '',
    messagingSenderId:
        (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) ||
        projectInfo?.project_number ||
        '',
    appId:
        (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_FIREBASE_APP_ID) ||
        androidClient?.client_info?.mobilesdk_app_id ||
        '',
};

export const isFirebaseConfigured =
    !!firebaseConfig.apiKey &&
    !!firebaseConfig.projectId &&
    !!firebaseConfig.appId;

let firebaseApp: ReturnType<typeof initializeApp> | null = null;
let firebaseAuth: ReturnType<typeof getAuth> | null = null;

try {
    if (isFirebaseConfigured) {
        firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
        firebaseAuth = getAuth(firebaseApp);
    } else {
        console.warn('⚠️ Firebase config is incomplete. Google sign-in will be unavailable.');
    }
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
}

export { firebaseAuth };
