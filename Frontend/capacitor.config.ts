import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.miniproject.app',
  appName: 'Hyperlocal Community Action Platform',
  webDir: 'out',
  server: {
    cleartext: true,
    hostname: 'localhost',
    iosScheme: 'https'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
