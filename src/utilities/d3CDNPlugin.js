import cdn from "vite-plugin-cdn-import";

export const d3CDNPlugin = cdn({
  modules: [
    {
      path: `dist/d3.min.js`,
      name: "d3",
      var: "d3",
    },
    {
      path: `dist/d3-fetch.min.js`,
      name: "d3-fetch",
      var: "d3",
    },
  ],
});
