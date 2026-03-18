import type { GasReporterExecutionContext } from "../types.js";

export default async () => ({
  async created(_context: any, hre: any): Promise<void> {
    hre.__hhgrec = {
      collector: undefined,
      task: undefined,
    } as GasReporterExecutionContext;
  },
});
