/* terminal

$ npm i d3 d3-fetch
$ npm i vite-plugin-cdn-import --save-dev

*/

/* index.html

<head>
    ...
    <script type="module" src="/src/utilities/customFetch.js"></script>
    <script type="module" src="/src/utilities/patchCsv.js"></script>
</head>

*/

/* vite.config.js

import { patch } from "./src/utilities/patch";
...
// https://vitejs.dev/config/
export default defineConfig(
  patch(config)
);

*/

import { buildConfig } from "./buildConfig";
import { d3CDNPlugin } from "./d3CDNPlugin";

export const patch = (config) => {
  const plugins = [d3CDNPlugin, ...config.plugins];

  const restOfConfig = Object.fromEntries(
    Object.entries(config).filter(([key]) => key !== "plugins")
  );

  return { plugins, ...restOfConfig, ...buildConfig };
};
