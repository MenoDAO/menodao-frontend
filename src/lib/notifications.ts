import { api } from './api';

/**
 * Check if the browser supports push notifications
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Get the current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Register the service worker and get FCM token
 * Note: This is a simplified version that works without Firebase SDK
 * For full FCM support, you would initialize Firebase here
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    // Request permission first
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker registered:', registration);

    // Get push subscription
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const subscriptionOptions: PushSubscriptionOptionsInit = {
      userVisibleOnly: true,
    };
    
    // Only add applicationServerKey if VAPID key is configured
    if (vapidKey) {
      subscriptionOptions.applicationServerKey = vapidKey;
    }
    
    const subscription = await registration.pushManager.subscribe(subscriptionOptions);

    // Convert subscription to token format
    const token = btoa(JSON.stringify(subscription.toJSON()));

    // Register token with backend
    await registerTokenWithBackend(token, 'web');

    return token;
  } catch (error) {
    console.error('Failed to register for push notifications:', error);
    return null;
  }
}

/**
 * Register the FCM token with the backend
 */
export async function registerTokenWithBackend(token: string, platform: string): Promise<void> {
  try {
    const response = await fetch(`${getApiUrl()}/notifications/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ token, platform }),
    });

    if (!response.ok) {
      throw new Error('Failed to register token');
    }

    console.log('Push token registered with backend');
  } catch (error) {
    console.error('Failed to register token with backend:', error);
  }
}

/**
 * Unregister from push notifications
 */
export async function unregisterFromPushNotifications(token: string): Promise<void> {
  try {
    const response = await fetch(`${getApiUrl()}/notifications/unregister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('Failed to unregister token');
    }

    console.log('Push token unregistered');
  } catch (error) {
    console.error('Failed to unregister token:', error);
  }
}

// Helper functions
function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'app.menodao.org') return 'https://api.menodao.org';
    if (hostname === 'dev.menodao.org') return 'https://dev-api.menodao.org';
  }
  return 'http://localhost:3000';
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

