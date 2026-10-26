// Adds a base path for the web build when EXPO_BASE_URL is set (the home-screen version is
// served from https://scr1ble12.github.io/Kodam/app). Everything else comes from app.json.
module.exports = ({ config }) =>
  process.env.EXPO_BASE_URL
    ? { ...config, experiments: { ...config.experiments, baseUrl: process.env.EXPO_BASE_URL } }
    : config;
