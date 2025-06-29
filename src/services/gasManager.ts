/**
 * Alchemy Gas Manager Service - EIP-4337 Compliant Implementation
 *
 * This implementation follows:
 * - EIP-4337: Account Abstraction Using Alt Mempool
 * - Alchemy Gas Manager API specification
 * - Proper UserOperation construction and validation
 *
 * Key Features:
 * - Real UserOperation creation (not dummy operations)
 * - Proper nonce management from smart account
 * - Correct gas estimation and sponsorship
 * - EIP-4337 compliant transaction flow
 *
 * References:
 * - https://eips.ethereum.org/EIPS/eip-4337
 * - https://www.alchemy.com/docs/reference/how-to-sponsor-gas-on-evm
 * - https://www.alchemy.com/docs/node/gas-manager-admin-api/gas-abstraction-api-endpoints/alchemy-request-gas-and-paymaster-and-data
 */

import { getGasManagerPolicyId } from '@/config';
import { encodeFunctionData, type Address, type Hex } from 'viem';

// Alchemy Gas Manager API endpoints by chain - Official endpoints
const ALCHEMY_GAS_MANAGER_ENDPOINTS: Record<number, string> = {
  // Mainnet
  1: 'https://eth-mainnet.g.alchemy.com/v2',
  // Base
  8453: 'https://base-mainnet.g.alchemy.com/v2',
  // Base Sepolia
  84532: 'https://base-sepolia.g.alchemy.com/v2',
  // Polygon
  137: 'https://polygon-mainnet.g.alchemy.com/v2',
  // Arbitrum
  42161: 'https://arb-mainnet.g.alchemy.com/v2',
  // Optimism
  10: 'https://opt-mainnet.g.alchemy.com/v2',
  // Sepolia
  11155111: 'https://eth-sepolia.g.alchemy.com/v2',
};

// EntryPoint addresses - Official Alchemy supported EntryPoints (same across all chains)
// Source: https://www.alchemy.com/docs/reference/bundler-faqs#at-which-addresses-are-the-entrypoint-contracts-for-v06-and-v07-deployed
const ENTRY_POINT_ADDRESSES = {
  '0.6': '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  '0.7': '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
};

// Dummy signature for gas estimation - as per Alchemy documentation
const DUMMY_SIGNATURE = '0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c';

/**
 * Real Transaction Data for UserOperation creation
 */
export interface RealTransactionData {
  target: Address;
  data: Hex;
  value?: bigint;
  abi?: any[];
  functionName?: string;
  args?: any[];
}

/**
 * Smart Account Context for UserOperation creation
 */
export interface SmartAccountContext {
  address: Address;
  nonce: bigint;
  initCode?: Hex;
  factory?: Address;
  factoryData?: Hex;
}

/**
 * UserOperation v0.6 - EIP-4337 Compliant Format
 */
export interface UserOperationV06 {
  sender: Address;
  nonce: Hex;
  initCode: Hex;
  callData: Hex;
  callGasLimit: Hex;
  verificationGasLimit: Hex;
  preVerificationGas: Hex;
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
  paymasterAndData: Hex;
  signature: Hex;
}

/**
 * UserOperation v0.7 - EIP-4337 Compliant Format
 */
export interface UserOperationV07 {
  sender: Address;
  nonce: Hex;
  factory?: Address;
  factoryData?: Hex;
  callData: Hex;
  callGasLimit: Hex;
  verificationGasLimit: Hex;
  preVerificationGas: Hex;
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
  paymaster?: Address;
  paymasterVerificationGasLimit?: Hex;
  paymasterPostOpGasLimit?: Hex;
  paymasterData?: Hex;
  signature: Hex;
}

/**
 * Gas Manager Response - EIP-4337 Compliant Format
 * This is the response from alchemy_requestGasAndPaymasterAndData
 */
export interface AlchemyGasManagerResponse {
  entrypointV06Response?: {
    paymasterAndData?: Hex;
    callGasLimit?: Hex;
    verificationGasLimit?: Hex;
    preVerificationGas?: Hex;
    maxFeePerGas?: Hex;
    maxPriorityFeePerGas?: Hex;
  };
  entrypointV07Response?: {
    paymaster?: Address;
    paymasterData?: Hex;
    paymasterVerificationGasLimit?: Hex;
    paymasterPostOpGasLimit?: Hex;
    callGasLimit?: Hex;
    verificationGasLimit?: Hex;
    preVerificationGas?: Hex;
    maxFeePerGas?: Hex;
    maxPriorityFeePerGas?: Hex;
  };
}

/**
 * Gas Manager Request Parameters - EIP-4337 Compliant Format
 * This is the request payload for alchemy_requestGasAndPaymasterAndData
 */
export interface AlchemyGasManagerRequest {
  policyId: string;
  entryPoint: Address;
  dummySignature: Hex;
  userOperation: UserOperationV06 | UserOperationV07;
  overrides?: AlchemyGasOverrides;
  stateOverrideSet?: Record<string, unknown>;
  webhookData?: string;
}

/**
 * Gas Overrides - Exact format from Alchemy API documentation
 */
export interface AlchemyGasOverrides {
  maxFeePerGas?: string | { multiplier: number };
  maxPriorityFeePerGas?: string | { multiplier: number };
  callGasLimit?: string | { multiplier: number };
  verificationGasLimit?: string | { multiplier: number };
  preVerificationGas?: string | { multiplier: number };
}

/**
 * Gas Manager Service Class - Official Alchemy Implementation
 * Implements the exact flow from Alchemy documentation
 */
export class AlchemyGasManagerService {
  private apiKey: string;
  private baseUrl: string;
  private chainId: number;

  constructor(apiKey: string, chainId: number) {
    this.apiKey = apiKey;
    this.chainId = chainId;
    this.baseUrl = this.getAlchemyEndpoint(chainId);
  }

  /**
   * Get the correct Alchemy endpoint for the chain
   */
  private getAlchemyEndpoint(chainId: number): string {
    const endpoint = ALCHEMY_GAS_MANAGER_ENDPOINTS[chainId];
    if (!endpoint) {
      throw new Error(`Unsupported chain ID for Gas Manager: ${chainId}`);
    }
    return endpoint;
  }

  /**
   * Get EntryPoint address for version
   */
  public getEntryPointAddress(version: '0.6' | '0.7'): Address {
    return ENTRY_POINT_ADDRESSES[version] as Address;
  }

  /**
   * Generate dummy signature for gas estimation
   */
  public getDummySignature(): Hex {
    return DUMMY_SIGNATURE as Hex;
  }

  /**
   * Create a real UserOperation with proper smart account context
   * This is the main method that should be used for actual transactions
   */
  public async createRealUserOperation(
    transactionData: RealTransactionData,
    accountContext: SmartAccountContext,
    version: '0.6' | '0.7' = '0.7'
  ): Promise<UserOperationV06 | UserOperationV07> {
    if (version === '0.6') {
      return this.createRealUserOperationV06(transactionData, accountContext);
    } else {
      return this.createRealUserOperationV07(transactionData, accountContext);
    }
  }

  /**
   * Get gas sponsorship for a real transaction
   * This method creates a proper UserOperation and requests sponsorship
   */
  public async requestRealGasSponsorship(
    transactionData: RealTransactionData,
    accountContext: SmartAccountContext,
    policyId: string,
    options: {
      entryPointVersion?: '0.6' | '0.7';
      overrides?: AlchemyGasOverrides;
      webhookData?: string;
    } = {}
  ): Promise<AlchemyGasManagerResponse> {
    const { entryPointVersion = '0.7', overrides, webhookData } = options;

    // Create real UserOperation with actual transaction data
    const userOperation = await this.createRealUserOperation(
      transactionData,
      accountContext,
      entryPointVersion
    );

    // Get EntryPoint address
    const entryPointAddress = this.getEntryPointAddress(entryPointVersion);

    // Prepare request for Alchemy Gas Manager
    const gasManagerRequest: AlchemyGasManagerRequest = {
      policyId,
      entryPoint: entryPointAddress,
      dummySignature: this.getDummySignature(),
      userOperation,
      ...(overrides && { overrides }),
      ...(webhookData && { webhookData }),
    };

    // Call Alchemy Gas Manager API
    return await this.requestGasAndPaymasterAndData(gasManagerRequest);
  }

  /**
   * Request Gas and Paymaster Data from Alchemy
   * This is the main method that follows the exact Alchemy API flow
   * https://www.alchemy.com/docs/node/gas-manager-admin-api/gas-abstraction-api-endpoints/alchemy-request-gas-and-paymaster-and-data
   */
  public async requestGasAndPaymasterAndData(
    request: AlchemyGasManagerRequest
  ): Promise<AlchemyGasManagerResponse> {
    const url = `${this.baseUrl}/${this.apiKey}`;

    // Prepare the exact request payload as per Alchemy documentation
    const payload = {
      jsonrpc: '2.0',
      method: 'alchemy_requestGasAndPaymasterAndData',
      params: [
        {
          policyId: request.policyId,
          entryPoint: request.entryPoint,
          dummySignature: request.dummySignature,
          userOperation: request.userOperation,
          ...(request.overrides && { overrides: request.overrides }),
          ...(request.stateOverrideSet && { stateOverrideSet: request.stateOverrideSet }),
          ...(request.webhookData && { webhookData: request.webhookData }),
        },
      ],
      id: Date.now(),
    };

    console.log('Alchemy Gas Manager Request:', {
      url,
      method: payload.method,
      policyId: request.policyId,
      entryPoint: request.entryPoint,
      userOperation: {
        sender: request.userOperation.sender,
        nonce: request.userOperation.nonce,
        callData: request.userOperation,
      },
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Alchemy Gas Manager HTTP Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      if (data.error) {
        console.error('Alchemy Gas Manager API Error:', data.error);
        throw new Error(`Alchemy API Error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      if (!data.result) {
        console.error('Alchemy Gas Manager Invalid Response:', data);
        throw new Error('Invalid response from Alchemy Gas Manager API');
      }

      console.log('Alchemy Gas Manager Success:', {
        hasV06Response: !!data.result.entrypointV06Response,
        hasV07Response: !!data.result.entrypointV07Response,
        v06PaymasterAndData: data.result.entrypointV06Response?.paymasterAndData?.slice(0, 20) + '...',
        v07Paymaster: data.result.entrypointV07Response?.paymaster,
        v07PaymasterData: data.result.entrypointV07Response?.paymasterData?.slice(0, 20) + '...',
      });

      return data.result as AlchemyGasManagerResponse;
    } catch (error) {
      console.error('Alchemy Gas Manager Request Failed:', error);
      throw error;
    }
  }

  /**
   * Create a real UserOperation v0.6 with proper transaction data
   */
  public createRealUserOperationV06(
    transactionData: RealTransactionData,
    accountContext: SmartAccountContext
  ): UserOperationV06 {
    // Encode the call data if we have ABI information
    let callData: Hex = transactionData.data;
    if (transactionData.abi && transactionData.functionName && transactionData.args) {
      callData = encodeFunctionData({
        abi: transactionData.abi,
        functionName: transactionData.functionName,
        args: transactionData.args,
      });
    }

    return {
      sender: accountContext.address,
      nonce: `0x${accountContext.nonce.toString(16)}` as Hex,
      initCode: accountContext.initCode || '0x',
      callData,
      // Gas limits will be filled by Alchemy Gas Manager
      callGasLimit: '0x0',
      verificationGasLimit: '0x0',
      preVerificationGas: '0x0',
      maxFeePerGas: '0x0',
      maxPriorityFeePerGas: '0x0',
      paymasterAndData: '0x',
      signature: this.getDummySignature() as Hex,
    };
  }

  /**
   * Create a UserOperation v0.6 for gas estimation (legacy method)
   */
  public createUserOperationV06(params: {
    sender: string;
    nonce: string;
    callData: string;
    initCode?: string;
  }): UserOperationV06 {
    return {
      sender: params.sender as Address,
      nonce: params.nonce as Hex,
      callData: params.callData as Hex,
      initCode: (params.initCode || '0x') as Hex,
      // These will be filled by Alchemy
      callGasLimit: '0x0',
      verificationGasLimit: '0x0',
      preVerificationGas: '0x0',
      maxFeePerGas: '0x0',
      maxPriorityFeePerGas: '0x0',
      paymasterAndData: '0x',
      signature: this.getDummySignature() as Hex,
    };
  }

  /**
   * Create a real UserOperation v0.7 with proper transaction data
   */
  public createRealUserOperationV07(
    transactionData: RealTransactionData,
    accountContext: SmartAccountContext
  ): UserOperationV07 {
    // Encode the call data if we have ABI information
    let callData: Hex = transactionData.data;
    if (transactionData.abi && transactionData.functionName && transactionData.args) {
      callData = encodeFunctionData({
        abi: transactionData.abi,
        functionName: transactionData.functionName,
        args: transactionData.args,
      });
    }

    return {
      sender: accountContext.address,
      nonce: `0x${accountContext.nonce.toString(16)}` as Hex,
      factory: accountContext.factory,
      factoryData: accountContext.factoryData,
      callData,
      // Gas limits will be filled by Alchemy Gas Manager
      callGasLimit: '0x0',
      verificationGasLimit: '0x0',
      preVerificationGas: '0x0',
      maxFeePerGas: '0x0',
      maxPriorityFeePerGas: '0x0',
      paymaster: '0x0000000000000000000000000000000000000000' as Address,
      paymasterVerificationGasLimit: '0x0',
      paymasterPostOpGasLimit: '0x0',
      paymasterData: '0x',
      signature: this.getDummySignature() as Hex,
    };
  }

  /**
   * Create a UserOperation v0.7 for gas estimation (legacy method)
   */
  public createUserOperationV07(params: {
    sender: string;
    nonce: string;
    callData: string;
    factory?: string;
    factoryData?: string;
  }): UserOperationV07 {
    return {
      sender: params.sender as Address,
      nonce: params.nonce as Hex,
      callData: params.callData as Hex,
      factory: params.factory as Address | undefined,
      factoryData: params.factoryData as Hex | undefined,
      // These will be filled by Alchemy
      callGasLimit: '0x0',
      verificationGasLimit: '0x0',
      preVerificationGas: '0x0',
      maxFeePerGas: '0x0',
      maxPriorityFeePerGas: '0x0',
      paymaster: '0x0000000000000000000000000000000000000000' as Address,
      paymasterVerificationGasLimit: '0x0',
      paymasterPostOpGasLimit: '0x0',
      paymasterData: '0x',
      signature: this.getDummySignature() as Hex,
    };
  }

  /**
   * Apply gas sponsorship data to UserOperation v0.6
   */
  public applySponsorshipV06(
    userOp: UserOperationV06,
    response: AlchemyGasManagerResponse
  ): UserOperationV06 {
    if (!response.entrypointV06Response) {
      throw new Error('No EntryPoint v0.6 response from Alchemy Gas Manager');
    }

    const sponsored = { ...userOp };
    const gasData = response.entrypointV06Response;

    if (gasData.paymasterAndData) sponsored.paymasterAndData = gasData.paymasterAndData;
    if (gasData.callGasLimit) sponsored.callGasLimit = gasData.callGasLimit;
    if (gasData.verificationGasLimit) sponsored.verificationGasLimit = gasData.verificationGasLimit;
    if (gasData.preVerificationGas) sponsored.preVerificationGas = gasData.preVerificationGas;
    if (gasData.maxFeePerGas) sponsored.maxFeePerGas = gasData.maxFeePerGas;
    if (gasData.maxPriorityFeePerGas) sponsored.maxPriorityFeePerGas = gasData.maxPriorityFeePerGas;

    return sponsored;
  }

  /**
   * Apply gas sponsorship data to UserOperation v0.7
   */
  public applySponsorshipV07(
    userOp: UserOperationV07,
    response: AlchemyGasManagerResponse
  ): UserOperationV07 {
    if (!response.entrypointV07Response) {
      throw new Error('No EntryPoint v0.7 response from Alchemy Gas Manager');
    }

    const sponsored = { ...userOp };
    const gasData = response.entrypointV07Response;

    if (gasData.paymaster) sponsored.paymaster = gasData.paymaster;
    if (gasData.paymasterData) sponsored.paymasterData = gasData.paymasterData;
    if (gasData.paymasterVerificationGasLimit) sponsored.paymasterVerificationGasLimit = gasData.paymasterVerificationGasLimit;
    if (gasData.paymasterPostOpGasLimit) sponsored.paymasterPostOpGasLimit = gasData.paymasterPostOpGasLimit;
    if (gasData.callGasLimit) sponsored.callGasLimit = gasData.callGasLimit;
    if (gasData.verificationGasLimit) sponsored.verificationGasLimit = gasData.verificationGasLimit;
    if (gasData.preVerificationGas) sponsored.preVerificationGas = gasData.preVerificationGas;
    if (gasData.maxFeePerGas) sponsored.maxFeePerGas = gasData.maxFeePerGas;
    if (gasData.maxPriorityFeePerGas) sponsored.maxPriorityFeePerGas = gasData.maxPriorityFeePerGas;

    return sponsored;
  }
}

/**
 * Create a singleton instance of the Gas Manager Service
 */
let gasManagerInstance: AlchemyGasManagerService | null = null;

export function createGasManagerService(apiKey: string, chainId: number): AlchemyGasManagerService {
  if (!gasManagerInstance || gasManagerInstance['chainId'] !== chainId) {
    gasManagerInstance = new AlchemyGasManagerService(apiKey, chainId);
  }
  return gasManagerInstance;
}

/**
 * Check if gas sponsorship is available for the current configuration
 */
export function isGasSponsorshipAvailable(chainId: number): boolean {
  const policyId = getGasManagerPolicyId(chainId);
  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

  return !!(policyId && apiKey);
}
