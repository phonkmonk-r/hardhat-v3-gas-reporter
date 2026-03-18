import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

const stopAction = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const options = hre.config.gasReporter;

  if (
    options.enabled === true &&
    args.parallel !== true &&
    (hre as any).__SOLIDITY_COVERAGE_RUNNING !== true
  ) {
    const { setGasAndPriceRates } = await import("../utils/prices.js");
    const { render } = await import("../lib/render/index.js");

    const warnings = await setGasAndPriceRates(options);

    await hre.__hhgrec.collector?.data.runAnalysis(hre, options);
    render(hre, options, warnings);
  }
};

export default stopAction;
