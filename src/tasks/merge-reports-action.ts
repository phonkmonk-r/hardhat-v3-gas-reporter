const mergeReportsAction = async (
  { inputFiles }: { inputFiles: string[] },
  _hre: any
) => {
  const { subtaskMergeReportsImplementation } = await import(
    "./mergeReports.js"
  );
  return subtaskMergeReportsImplementation({ inputFiles });
};

export default mergeReportsAction;
