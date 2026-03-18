import type { HardhatConfig, HardhatUserConfig } from "hardhat/types/config";
import _ from "lodash";
const { cloneDeep } = _;
import { getDefaultOptions } from "../lib/options.js";

export default async () => ({
  async resolveUserConfig(
    userConfig: HardhatUserConfig,
    resolveConfigurationVariable: any,
    next: (
      userConfig: HardhatUserConfig,
      resolveConfigurationVariable: any
    ) => Promise<HardhatConfig>
  ): Promise<HardhatConfig> {
    const resolvedConfig = await next(userConfig, resolveConfigurationVariable);

    let options = getDefaultOptions(userConfig);

    if (userConfig.gasReporter !== undefined) {
      options = Object.assign(options, cloneDeep(userConfig.gasReporter));

      // Use legacy Etherscan API Key if user did not migrate from deprecated options
      if (options.L1Etherscan && !options.etherscan) {
        options.etherscan = options.L1Etherscan;
      }
    }

    (resolvedConfig as any).gasReporter = options;
    return resolvedConfig;
  },
});
