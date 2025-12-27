export const environment = {
  production: true,
  // Backend API URL - Updated 2025-12-27 12:31
  apiBaseUrl: "https://ai-agents-lab.onrender.com/api/v1",
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
