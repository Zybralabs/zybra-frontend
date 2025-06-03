import { ethers } from "ethers";

/**
 * Dynamically generate calldata for a given function.
 * 
 * @param functionName - The name of the function to encode.
 * @param abi - The ABI of the contract containing the function.
 * @param params - The parameters for the function.
 * @returns The encoded calldata as a string.
 */
export const generateCalldata = (
  functionName: string,
  abi: ethers.Fragment[] | string[],
  params: unknown[]
): string => {
  try {
    // Create an interface for the contract using its ABI
    const contractInterface = new ethers.Interface(abi);

    // Encode the calldata for the specified function and parameters
    const calldata = contractInterface.encodeFunctionData(functionName, params);

    return calldata;
  } catch (error) {
    console.error("Error generating calldata:", error);
    throw new Error("Failed to generate calldata");
  }
};
