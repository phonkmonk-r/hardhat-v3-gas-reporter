import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

const mergeAction = async (
  taskArguments: any,
  hre: HardhatRuntimeEnvironment
) => {
  const { taskMergeImplementation } = await import("./mergeReports.js");
  return taskMergeImplementation(taskArguments, hre);
};

export default mergeAction;
