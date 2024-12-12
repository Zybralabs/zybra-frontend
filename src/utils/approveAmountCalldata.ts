import { Interface } from "@ethersproject/abi";
import type { BigNumberish } from "ethers";

const ERC20_INTERFACE = new Interface([
  {
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
]);

interface Token {
  address: string;
  isToken: boolean;
}

interface Amount {
  currency: Token;
  quotient: BigNumberish;
}

export default function approveAmountCalldata(
  amount: Amount,
  spender: string,
): { to: string; data: string; value: "0x0" } {
  if (!amount.currency.isToken) {
    throw new Error("Must call with an amount of token");
  }

  const approveData = ERC20_INTERFACE.encodeFunctionData("approve", [
    spender,
    amount.quotient.toString(),
  ]);

  return {
    to: amount.currency.address,
    data: approveData,
    value: "0x0",
  };
}
