const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
    mode: 'production',

    entry: './src/index.ts',

    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/server02/', // 🔴 IMPORTANTE: Base path para deployment em subdiretório
        clean: true,
    },

    devtool: false, // Desabilita source maps para não expor código no browser

    devServer: {
        static: {
            directory: path.resolve(__dirname, 'public'), // ✅ serve public/
        },
        hot: true,
        // Para desenvolvimento local (sem /server02/), use:
        // historyApiFallback: true,

        // Para produção com base path /server02/:
        historyApiFallback: {
            index: '/server02/index.html', // Aponta para o index.html no base path
            rewrites: [
                { from: /^\/server02\/.*/, to: '/server02/index.html' } // Redireciona todas as rotas para o index
            ],
            disableDotRule: true, // Permite rotas com pontos (ex: /api/user.json ainda vai para backend)
        },
        port: 4173
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
