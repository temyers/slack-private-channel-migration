var path = require('path');

module.exports = {
    entry: {
        "src/migrate-channel-svc": 'src/migrate-channel-svc/handler.js',
        "src/event_log": 'src/event_log/handler.js'
    },
    target: 'node',
    module: {
        loaders: [{
            test: /\.js$/,
            loaders: ['babel-loader'],
            include: __dirname,
            exclude: /node_modules/,
        }]
    },
    output: {
        libraryTarget: 'commonjs',
        path: path.join(__dirname, '.webpack'),
        filename: '[name]/handler.js'
    },
    externals: [{
        "@slack/client": "@slack/client"
    }],
};
