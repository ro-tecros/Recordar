module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Debe ir siempre el último. Habilita las worklets de Reanimated 4.
    plugins: ['react-native-worklets/plugin'],
  };
};
