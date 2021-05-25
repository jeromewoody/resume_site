const HtmlWebPackPlugin = require('html-webpack-plugin');

const webpackConfig = {
    module: {
        rules: [
            {
                test:/\.(js|jsx)$/,
                exclude: /node_modules/,
                use: 'babel-loader'
            }
        ]
    },
    plugins: [
        new HtmlWebPackPlugin({
            title: 'CV of Jerome Woody',
            template: './src/index.html',
            filename: './public/index.html'
        })
    ]
};

module.exports = webpackConfig;