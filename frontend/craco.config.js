const { POSTCSS_MODES } = require("@craco/craco");

module.exports = {
  eslint: {
    enable: false,
  },
    style: {
        postcss: {
            mode: POSTCSS_MODES.file
        }
    }
};
