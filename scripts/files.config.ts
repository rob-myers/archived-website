import webpack from 'webpack';
import { WebpackCtxt } from './next.config';

export default function(_: WebpackCtxt): webpack.Configuration {
  return {
    module: {
      rules: [
        {
          test: /\.gltf$/,
          loader: 'raw-loader',
        }
      ],
    }
  };
}
