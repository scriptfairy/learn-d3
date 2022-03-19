const HtmlWebpackPlugin = require("html-webpack-plugin");

const templateContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>D3 Force Directed Graph</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <div id="app" />
  </body>
</html>
`;

module.exports = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
  },
  plugins: [new HtmlWebpackPlugin({ templateContent })],
};
