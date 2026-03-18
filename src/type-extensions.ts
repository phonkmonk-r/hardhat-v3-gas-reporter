import type { GasReporterOptions, GasReporterExecutionContext } from "./types.js";

/* Type Extensions */
declare module "hardhat/types/config" {
  interface HardhatConfig {
    gasReporter: Partial<GasReporterOptions>;
  }

  interface HardhatUserConfig {
    gasReporter?: Partial<GasReporterOptions>;
  }
}

declare module "hardhat/types/hre" {
  export interface HardhatRuntimeEnvironment {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __hhgrec: GasReporterExecutionContext;
  }
}
