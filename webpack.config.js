const webpack = require("webpack");
module.exports = {
  plugins: [
    new webpack.ProvidePlugin({
      async_hooks: "async_hooks",
    }),
  ],
};
