const { getDefaultConfig } = require('expo/metro-config');
const { createApiMiddleware } = require('./scripts/apiProxy.cjs');

const config = getDefaultConfig(__dirname);
const enhance = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => createApiMiddleware(
  enhance ? enhance(middleware, server) : middleware,
  Number(process.env.HUESO_API_PORT || 8787),
);

module.exports = config;
