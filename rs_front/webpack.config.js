const HtmlWebPackPlugin = require('html-webpack-plugin');
const path = require('path');

const webpackConfig = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        path: path.resolve('/home/jerome/Workspace/resume_site'),
        filename: '[name].[contenthash].js',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react']
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',  // Inject CSS into the DOM
                    {
                        loader: 'css-loader',  // Process CSS imports
                        options: {
                            sourceMap: true    // Enable source maps for debugging
                        }
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx', '.json']
    },
    plugins: [
        new HtmlWebPackPlugin({
            title: 'CV of Jerome Woody',
            template: './src/index.html',
            filename: '/home/jerome/Workspace/resume_site/index.html'
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'public')
        },
        compress: true,
        port: 3000,
        hot: true,
        allowedHosts: 'all'
    }
};

module.exports = webpackConfig;