const path = require('path');
const webpack = require('@cypress/webpack-preprocessor');

module.exports = (on) => {
const options = {
webpackOptions: {
    resolve: {
    alias: {
        react: path.resolve('./node_modules/react'),
    },
    },
    module: {
    rules: [
        {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
            loader: 'babel-loader',
        },
        },
    ],
    },
},
};

on('file:preprocessor', webpack(options));
};
