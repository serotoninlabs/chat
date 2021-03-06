import image from "@rollup/plugin-image";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import nodePolyfills from "rollup-plugin-node-polyfills";

export default {
  //input: ["src/index.ts", "src/cards/index.ts", "src/ethereum/index.ts"],
  input: ["src/index.ts"],
  output: [
    {
      dir: "dist/module",
      format: "es",
      sourcemap: true,
      globals: {
        react: "React",
      },
    },
    {
      dir: "dist/node",
      format: "cjs",
      sourcemap: true,
      globals: {
        react: "React",
      },
    },
  ],
  external: [
    "react",
    "styled-components",
    "libsignal-protocol/dist/libsignal-protocol",
  ],
  plugins: [nodeResolve(), commonjs(), typescript(), image(), nodePolyfills()],
};
