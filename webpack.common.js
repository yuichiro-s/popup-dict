const CopyWebpackPlugin = require('copy-webpack-plugin');

const fs = require('fs');
const GenerateJsonPlugin = require('generate-json-webpack-plugin');
manifest = JSON.parse(fs.readFileSync('app/manifest.json'));

module.exports = {
    config: {
        entry: {
            background: './app/scripts/background.ts',
            content: './app/scripts/content.ts',
            options: './app/scripts/options.tsx',
            'eijiro.worker': './app/scripts/preprocess/eijiro.worker.ts',
        },
        target: 'web',
        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: './app/images',
                        to: 'images',
                    },
                    {
                        from: './app/_locales',
                        to: '_locales',
                    },
                ]
            }),
            new GenerateJsonPlugin('manifest.json', manifest),
        ],
        module: {
            rules: [{
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(png|woff|woff2|eot|ttf|svg)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192
                        }
                    }
                ]
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
            {
                test: /\.styl$/,
                use: 'style-loader!css-loader!stylus-loader'
            }
            ]
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx'],
            modules: [
                'node_modules/',
                'app/scripts/',
            ],
            alias: {
                'handlebars': 'handlebars/dist/handlebars.js',
            }
        },
        externals: {
            "react": "React",
            "react-dom": "ReactDOM",
        }
    },
    manifest,
};
