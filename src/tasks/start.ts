import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { initializeNetworkHook } from "../hooks/network.js";

const startAction = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const options = hre.config.gasReporter;

  if (options.enabled === true) {
    // Lazy load all imports to minimize HH startup time
    const { getContracts } = await import("../lib/artifacts.js");
    const { Collector } = await import("../lib/collector.js");
    const { warnParallel } = await import("../utils/ui.js");

    // Temporarily skipping when in parallel mode because it crashes and
    // unsure how to resolve...
    if (args.parallel === true) {
      warnParallel();
      return;
    }

    // solidity-coverage disables gas reporter via mocha but that
    // no longer works for this version. (No warning necessary)
    if ((hre as any).__SOLIDITY_COVERAGE_RUNNING === true) {
      return;
    }

    // Need to compile so we have access to the artifact data.
    if (!args.noCompile) {
      await hre.tasks.getTask("compile").run({ quiet: true });
    }

    // Get a network connection and provider
    const connection = await hre.network.connect();
    const provider = connection.provider;

    // Store provider reference for use by GasData, Resolver, etc.
    hre.__hhgrec.provider = provider;

    const contracts = await getContracts(hre, options);

    hre.__hhgrec.usingCall = options.reportPureAndViewMethods;
    hre.__hhgrec.usingViem = (hre as any).viem;
    hre.__hhgrec.usingOZ = (hre as any).upgrades || (hre as any).defender;

    hre.__hhgrec.collector = new Collector(hre, options);
    hre.__hhgrec.collector.data.initialize(provider, contracts);

    // Custom proxy resolvers are instantiated in the config,
    // OZ proxy resolver instantiated in Resolver constructor called by new Collector()
    hre.__hhgrec.methodIgnoreList = options.proxyResolver
      ? options.proxyResolver.ignore()
      : [];

    // Trigger provider initialization with a cheap call
    await provider.request({ method: "eth_blockNumber", params: [] });

    // Activate gas tracking in the network hook
    initializeNetworkHook(hre.__hhgrec);
  }
};

export default startAction;
