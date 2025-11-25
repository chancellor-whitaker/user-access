const build = {
  copyPublicDir: true,
  emptyOutDir: true,
  minify: false,
};

const configBuild = (build) => {
  const flaskOutDir = "static";

  const { outDir: specifiedOutDir = "" } = build;

  const base = `/${specifiedOutDir ? "" : flaskOutDir}`;

  const outDir = specifiedOutDir ? specifiedOutDir : flaskOutDir;

  return {
    experimental: {
      renderBuiltUrl: (fileName) =>
        `.${base}${fileName[0] === "/" ? "" : "/"}${fileName}`,
    },
    build: { ...build, outDir },
    base,
  };
};

export const buildConfig = configBuild(build);
