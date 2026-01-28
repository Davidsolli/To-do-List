const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
    mode: 'development',

    entry: './src/index.ts',

    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/', // 🔴 IMPORTANTE para SPA + assets absolutos
        clean: true,
    },

    devtool: 'inline-source-map',

    devServer: {
        static: {
            directory: path.resolve(__dirname, 'public'), // ✅ serve public/
        },
        hot: true,
        historyApiFallback: true,
        port: 4173,
        proxy: [
            {
                context: ['/api'],
                target: 'http://localhost:3000',
                secure: false,
                changeOrigin: true,
            },
        ],
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
                exclude: /public/, // 🔴 NÃO processar HTML do public
                use: 'html-loader',
            },

            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },

            {
                test: /\.(png|jpe?g|svg|gif)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/[name][ext]', // opcional: organização no dist
                },
            },
        ],
    },

    resolve: {
        extensions: ['.ts', '.js'],
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html', // HTML raiz
            inject: 'body',
        }),
        new Dotenv(),
    ],
};
