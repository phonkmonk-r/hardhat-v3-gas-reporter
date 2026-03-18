import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import {
  TASK_GAS_REPORTER_START,
  TASK_GAS_REPORTER_STOP,
} from "../task-names.js";

const testOverride = async (
  args: any,
  hre: HardhatRuntimeEnvironment,
  runSuper: (args?: any) => Promise<any>
) => {
  hre.__hhgrec.task = "test";

  await hre.tasks.getTask(TASK_GAS_REPORTER_START).run({
    parallel: args.parallel ?? false,
    noCompile: args.noCompile ?? false,
  });
  await runSuper(args);
  await hre.tasks.getTask(TASK_GAS_REPORTER_STOP).run({
    parallel: args.parallel ?? false,
  });
};

export default testOverride;
