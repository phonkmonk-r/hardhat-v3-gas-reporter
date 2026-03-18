import hardhatToolbox from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";
import gasReporter from "../../dist/index.js";

export default defineConfig({
  plugins: [hardhatToolbox, gasReporter],
  solidity: {
    profiles: {
      default: {
        compilers: [{ version: "0.8.24" }],
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    artifacts: "./artifacts",
    cache: "./cache",
  },
  gasReporter: {
    enabled: true,
    offline: true,
    suppressTerminalOutput: false,
  },
});
