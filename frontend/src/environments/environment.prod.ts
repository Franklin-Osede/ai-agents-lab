export const environment = {
  production: true,
  // Use relative path so Nginx Docker container proxies it correctly to backend
  apiBaseUrl: "/api/v1",
  googleMapsApiKey: "AIzaSyAkqMXaq13jJWUMaUAJAtQniiAOmNyh2BA", // Usage of dev key for demo
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
  },
  enabledAgents: ["booking", "cart", "voice", "rider"],
};
