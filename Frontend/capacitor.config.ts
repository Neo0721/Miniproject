import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.miniproject.app',
  appName: 'Miniproject',
  webDir: 'out',
  server: {
    cleartext: true
  }
};

export default config;
