const path = require('path');

module.exports = {
  entry: './src/widget.ts',
  output: {
    filename: 'widget.min.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'AIAgentsWidget',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  mode: 'production',
  optimization: {
    minimize: true,
  },
};
