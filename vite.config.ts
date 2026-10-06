import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte"; 
import { sveltePreprocess } from "svelte-preprocess"; 
import { cep, CepOptions, runAction } from "vite-cep-plugin";
import cepConfig from "./cep.config";
import fs from "fs";
import path from "path";
import { extendscriptConfig } from "./vite.es.config";

const extensions = [".js", ".ts", ".tsx"];

const devDist = "dist";
const cepDist = "cep";

const src = path.resolve(__dirname, "src");
const root = path.resolve(src, "js");
const outDir = path.resolve(__dirname, "dist", cepDist);

const debugReact = process.env.DEBUG_REACT === "true";
const isProduction = process.env.NODE_ENV === "production";
const isMetaPackage = process.env.ZIP_PACKAGE === "true";
const isPackage = process.env.ZXP_PACKAGE === "true" || isMetaPackage;
const isServe = process.env.SERVE_PANEL === "true";
const action = process.env.BOLT_ACTION;

let input: { [key: string]: string } = {};
cepConfig.panels.map((panel) => {
  input[panel.name] = path.resolve(root, panel.mainPath);
});

Object.values(input).forEach((panelEntry) => {
  const relativePath = path.relative(root, panelEntry);
  const panelOutputDir = path.dirname(path.resolve(outDir, relativePath));
  fs.mkdirSync(panelOutputDir, { recursive: true });
});

const runtimeAssets = [
  [path.resolve(root, "main/bin/win/ffmpeg.exe"), "ffmpeg.exe"],
  [path.resolve(root, "main/bin/mac/ffmpeg.bin"), "ffmpeg"],
] as const;
const runtimeAssetDir = path.resolve(outDir, "assets");
fs.mkdirSync(runtimeAssetDir, { recursive: true });
runtimeAssets.forEach(([source, fileName]) => {
  const destination = path.join(runtimeAssetDir, fileName);

  try {
    fs.copyFileSync(source, destination);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "EBUSY") {
      throw error;
    }

    const sourceSize = fs.statSync(source).size;
    const destinationSize = fs.statSync(destination).size;
    if (sourceSize !== destinationSize) {
      throw new Error(
        `Cannot update locked runtime asset "${destination}". ` +
          "Close the host application using it and run the build again.",
        { cause: error },
      );
    }

    console.warn(
      `Runtime asset "${destination}" is locked; using the existing file.`,
    );
  }
});

const config: CepOptions = {
  cepConfig,
  isProduction,
  isPackage,
  isMetaPackage,
  isServe,
  debugReact,
  dir: `${__dirname}/${devDist}`,
  cepDist: cepDist,
  zxpOutput: `${__dirname}/${devDist}/zxp/${cepConfig.id}`,
  zipOutput: `${__dirname}/${devDist}/zip/${cepConfig.displayName}_${cepConfig.version}`,
  packages: cepConfig.installModules || [],
};

if (action) runAction(config, action);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte({ preprocess: sveltePreprocess({ typescript: true }) }), 
    cep(config),
  ],
  resolve: {
    alias: [{ find: "@esTypes", replacement: path.resolve(__dirname, "src") }],
  },
  root,
  clearScreen: false,
  server: {
    port: cepConfig.port,
  },
  preview: {
    port: cepConfig.servePort,
  },

  build: {
    sourcemap: isPackage ? cepConfig.zxp.sourceMap : cepConfig.build?.sourceMap,
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    watch: {
      include: "src/jsx/**",
    },
    rollupOptions: {
      input,
      external: ["uiohook-napi"], 
      output: {
        manualChunks: {},
        preserveModules: false,
        format: "cjs",
        entryFileNames: "assets/[name]-[hash].cjs",
        chunkFileNames: "assets/[name]-[hash].cjs",
      },
    },
    target: "chrome74",
    outDir,
  },
});

// rollup es3 build
const outPathExtendscript = path.join("dist", cepDist, "jsx", "index.js");
extendscriptConfig(
  `src/jsx/index.ts`,
  outPathExtendscript,
  cepConfig,
  extensions,
  isProduction,
  isPackage,
);