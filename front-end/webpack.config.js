const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true, // Limpa a pasta dist antes de cada build
  },
  devtool: 'inline-source-map', // Ótimo para debugar TS no navegador
  devServer: {
    static: './dist',
    hot: true,
    historyApiFallback: true, // Importante para SPA (Redireciona 404 para index.html)
    port: 3000,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        use: 'html-loader', // Permite: import template from './file.html'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'], // Injeta CSS no <head>
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new Dotenv(),
  ],
};