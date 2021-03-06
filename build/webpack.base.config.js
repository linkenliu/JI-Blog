const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HappyPack = require('happypack');
const os = require('os');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const chalk = require('chalk');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const sourcePath = path.join(__dirname, '../web');
const nodeModules = path.resolve(__dirname, '../node_modules');

// const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });

function createHappyPlugin(id, loaders) {
    return new HappyPack({
        id: id,
        loaders: loaders,
        // threadPool: happyThreadPool,
    });
}

var cssLoader = ExtractTextPlugin.extract({
    fallback: "style-loader",
    use: [
        'happypack/loader?id=happy-css'
    ]
});


var lessLoader = ExtractTextPlugin.extract({
    fallback: "style-loader",
    use: [
        'happypack/loader?id=happy-less'
    ]
})

var babelPreset = process.env.NODE_ENV == 'development' ? {development: {presets: ['react-hmre']}} : {};

module.exports = {
    context: sourcePath,
    module: {
        rules: [{
            test: /\.(js|jsx)$/,
            exclude: nodeModules,
            include: sourcePath,
            use: ['happypack/loader?id=happy-babel-js'],
            // use: [{
            //     loader: 'babel-loader',
            //     options: {
            //         cacheDirectory: true
            //     }
            // }],
        }, {
            test: /\.css$/,
            exclude: nodeModules,
            use: cssLoader
            // use: ExtractTextPlugin.extract({
            //     fallback: "style-loader",
            //     use: [{
            //         loader: 'css-loader',
            //         options: {
            //             minimize: true
            //         }
            //     }, {
            //         loader: 'postcss-loader',
            //         options: {
            //             config: {
            //                 path: path.join(__dirname, './postcss.config.js')
            //             }
            //         }
            //     }]
            // }),
        }, {
            test: /\.less$/,
            use: lessLoader
            // use: ExtractTextPlugin.extract({
            //     fallback: "style-loader",
            //     use: [{
            //         loader: 'css-loader',
            //         options: {
            //             minimize: true
            //         }
            //     }, {
            //         loader: 'postcss-loader',
            //         options: {
            //             config: {
            //                 path: path.join(__dirname, './postcss.config.js')
            //             }
            //         }
            //     }, 'less-loader']
            // })
        }, {
            test: /.(gif|jpg|png)$/,
            use: [{
                loader: 'url-loader',
                options: {
                    limit: 8192,
                    name: 'images/[name].[hash:8].[ext]'
                }
            }]
        }, {
            test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
            // use: ['happypack/loader?id=happy-font']
            use: [{
                    loader: 'file-loader',
                    options: {
                        limit: 8192,
                        name: 'font/[name].[hash:8].[ext]'
                    }
                }

            ]
        }, {
            // test: require.resolve('jquery'),
            // use: [{
            //     loader: 'expose-loader',
            //     options: '$'
            // }, {
            //     loader: 'expose-loader',
            //     options: 'Zepto'
            // }]
        }],
        noParse: /node_modules\/(jquey|js\-cookie\.js)/
    },
    resolve: {
        extensions: ['.js', '.jsx'],
        modules: [
            sourcePath,
            nodeModules
        ],
        alias: {
            Components: path.join(__dirname, '../web/components/')
        },
    },
    externals: {
        jquery: "$"
    },
    plugins: [
        new ExtractTextPlugin('css/[name].[contenthash:8].css'),
        new webpack.DllReferencePlugin({
            context: path.resolve(__dirname, "../"),
            manifest: require('./vendor-manifest.json'),
        }),
        createHappyPlugin('happy-babel-js', [{
            loader: 'babel-loader',
            query: {
                cacheDirectory: true,
                env: babelPreset
            }
        }]),
        createHappyPlugin('happy-css', [{
            loader: 'css-loader',
            query: {
                minimize: true
            }
        }, {
            loader: 'postcss-loader',
            query: {
                config: {
                    path: path.join(__dirname, './postcss.config.js')
                }
            }
        }]),
        createHappyPlugin('happy-less', [{
            loader: 'css-loader',
            query: {
                minimize: true
            }
        }, {
            loader: 'postcss-loader',
            query: {
                config: {
                    path: path.join(__dirname, './postcss.config.js')
                }
            }
        }, 'less-loader']),
        // createHappyPlugin('happy-font', [{
        //     loader: "file-loader",
        //     query: {
        //         limit: 8192,
        //         name: 'font/[name].[hash:8].[ext]'
        //     }
        // }]),
        new ProgressBarPlugin({
            format: chalk.blue.bold("build  ") + chalk.cyan("[:bar]")  + chalk.green.bold(':percent') + ' (' + chalk.magenta(":elapsed") + ' seconds) ',
            clear: false
        }),
        new LodashModuleReplacementPlugin(),
        // new webpack.optimize.CommonsChunkPlugin({ name: 'vendor', filename: 'js/[name].js' })
    ]
};