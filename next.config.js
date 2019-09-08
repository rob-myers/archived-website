const path = require('path')

module.exports = {
  webpack(config, _options) {
    /**
     * Add path aliases.
     * Also defined in tsconfig.json.
     */
    Object.assign(config.resolve.alias, {
      '@components': path.join(__dirname, 'components'),
      '@model': path.join(__dirname, 'model'),
      '@store': path.join(__dirname, 'store')
    });
    return config;
  },

  exportPathMap: function () {
    return {
      '/': { page: '/' }
    };
  }
}
