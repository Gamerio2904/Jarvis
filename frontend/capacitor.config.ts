import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'de.gamerio.jarvis',
  appName: 'Jarvis',
  webDir: 'dist',
  server: {
    // Allow http://LAN-IP:8000 from the WebView (dev / home NAS).
    cleartext: true,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0b0f0c',
    },
  },
}

export default config
