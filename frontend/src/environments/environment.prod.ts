export const environment = {
  production: true,
  // Read from environment variable set in Vercel
  apiBaseUrl:
    typeof process !== "undefined" && process.env?.["NG_APP_API_URL"]
      ? `${process.env["NG_APP_API_URL"]}/api/v1`
      : "https://ai-agents-lab.onrender.com/api/v1",
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
