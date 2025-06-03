// Addresses for various contracts on supported networks

export enum SupportedChainId {
  Base_Mainnet = 8453,
  Mainnet = 1,
  Polygon_Mainnet = 137,
  Testnet = 84532,
}
export const ZYBRA_CONFIGURATOR_ADDRESS: Record<number, string> = {
  1: "0xZybraConfiguratorMainnet", // Base_Mainnet
  84532: "0x8c590228a7c22BD5bf33e7008f9C2d21D70989fA", // Rinkeby
  8453: "0xZybraConfiguratorBase", // Base
};

export const SWARM_VAULT_ADDRESS: Record<number, string> = {
  1: "0x37516bE016988beA12b1d83BDCdd6542970F8236", // Base_Mainnet
  84532: "0xbc3d4f321eace819b338042b1a529243ab395920", // Rinkeby
  8453: "0x37516bE016988beA12b1d83BDCdd6542970F8236", // Base
};

export const DOTCV2_ADDRESS: Record<number, string> = {
  1: "0x37516bE016988beA12b1d83BDCdd6542970F8236", // Base_Mainnet
  84532: "0x3bbb23da0a7eea8b4747e8d0de37ed32e03ad363", // Rinkeby
  8453: "0x37516bE016988beA12b1d83BDCdd6542970F8236", // Base
};

export const LENDING_POOL_ADDRESS: Record<number, string> = {
  1: "0x37516bE016988beA12b1d83BDCdd6542970F8236", // Base_Mainnet
  84532: "0xa71488317691d3672889b1Ff85c90E9cb380506b", // Base Sepolia
  8453: "0x37516bE016988beA12b1d83BDCdd6542970F8236", // Base
};



export const CENTRIFUGE_POOL_IDS:  string[] = [  '3410462771',
  '1761235385',
  '2866607643',
  '3295454411',
  '420584179',
  '1298321265',
  '353744957'
] // Base_Mainnet

 


export const CENTRIFUGE_VAULT_ADDRESS: Record<number, string> = {
  1: "0xd867e273eAbD6c853fCd0Ca0bFB6a3aE6491d2C1", // Base_Mainnet
  84532: "0xeAA98ea967e9da460efD3B5bB85eB7903a235Ea3", // Rinkeby
  8453: "0xERC7540VaultBase", // Base
};



export const MULTICALL_ADDRESS: Record<number, string> = {
  1: "0xd867e273eAbD6c853fCd0Ca0bFB6a3aE6491d2C1", // Base_Mainnet
  84532: "0xd867e273eAbD6c853fCd0Ca0bFB6a3aE6491d2C1", // Rinkeby
  8453: "0xcA11bde05977b3631167028862bE2a173976CA11", // Base
};

export const ENS_REGISTRAR_ADDRESSES: Record<number, string> = {
  1: "0xERC7540VaultMainnet", // Base_Mainnet
  84532: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e", // Rinkeby
  8453: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e", // Base
};

export const CENTRIFUGE_ROUTER_ADDRESS: Record<number, string> = {
  1: "0xCentrifugeRouterMainnet", // Base_Mainnet
  84532: "0x1e67906F3F990F7d1B53bfcAB97346d4B16310E3", // Rinkeby
  8453: "0xCentrifugeRouterBase", // Base
};

export const INVESTMENT_MANAGER_ADDRESS: Record<number, string> = {
  1: "0xInvestmentManagerMainnet", // Base_Mainnet
  84532: "0x93Df372726238ee6BB63B9046009DAc3B5f8462F", // Rinkeby
  8453: "0xInvestmentManagerBase", // Base
};

export const QOUTER_ADDRESS: Record<number, string> = {
  1: "0x4e3D53a25571e647fCa0b9bcf98aC7768454bBA7",
  84532: "0xC5290058841028F1614F3A6F0F5816cAd0df5E27", // Rinkeby
  8453: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a", // Base
};

export const ZFI: Record<number, string> = {
  1: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
  84532: "0x91d587fB7E607137893A52445ED0bb776fcfE282", // Rinkeby
  8453: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"
};


export const ZrUSD: Record<number, string> = {
  1: "0x4e3D53a25571e647fCa0b9bcf98aC7768454bBA7",
  84532: "0xd50d59f278bff077f28d220349a0ea6388519dfa", // Rinkeby
  8453: "0x4e3D53a25571e647fCa0b9bcf98aC7768454bBA7"
};

export const ZRUSD = "0xd50d59f278bff077f28d220349a0ea6388519dfa"

export const ZFI_STAKING_ADDRESS: Record<number, string> = {
  1: "0xEA591B78e9d748b8C8581Ff06Be81285FfcFbD19", // Base_Mainnet
  84532: "0xEA591B78e9d748b8C8581Ff06Be81285FfcFbD19", // Rinkeby
  8453: "0xEA591B78e9d748b8C8581Ff06Be81285FfcFbD19", // Base
};

// USDC Token Addresses for different networks
export const USDC_ADDRESS: Record<number, string> = {
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Base_Mainnet
  84532: "0x15C46bEc4B862BABb386437CECEc9e53e8F4694A", // Rinkeby
  8453: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Base
};

export const TOKEN_FAUCET_ADDRESS: { [key in SupportedChainId]: string } = {
  [SupportedChainId.Base_Mainnet]: "", // No mainnet faucet
  [SupportedChainId.Testnet]: "0x5acd4023aBCceA3B5f270578784F80f519506583",
  [SupportedChainId.Mainnet]: "",
  [SupportedChainId.Polygon_Mainnet]: ""
};

// Price Feed Addresses for different networks
export const PRICE_FEED_ADDRESS: Record<number, Record<string, string>> = {
  1: {
    ETH: "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419", // Chainlink ETH/USD Price Feed on Base_Mainnet
    BTC: "0xf4030086522a5beea4988f8ca5b36dbc97bee88c", // Chainlink BTC/USD Price Feed on Base_Mainnet
  },
  84532: {
    USD: "0xBba8B56e3902F46A8CCBCfDf2f948fD364Bc8C46", // Chainlink ETH/USD Price Feed on Rinkeby
    ETH: "0x8a753747a1fa494ec906cE90E9f37563A8AF630e", // Chainlink ETH/USD Price Feed on Rinkeby
    BTC: "0x5741306c21795fdcbb9b265ea0255f499dfe515c", // Chainlink BTC/USD Price Feed on Rinkeby
    MSFT: "0x0d3FCD8C4df5421b32Bd65c5c323035B93D3fB7b", // Chainlink BTC/USD Price Feed on Rinkeby
    TSLA: "0x5741306c21795fdcbb9b265ea0255f499dfe515c", // Chainlink BTC/USD Price Feed on Rinkeby
    NVIDIA: "0xe2A76443cA2FEA274886DD176Bc4152a3Ca6d39F", // Chainlink BTC/USD Price Feed on Rinkeby
  },
  8453: {
    ETH: "0xBaseChainETHUSDPriceFeed", // Replace with actual Base chain ETH/USD Price Feed
    BTC: "0xBaseChainBTCUSDPriceFeed", // Replace with actual Base chain BTC/USD Price Feed
  },
};
// Stock Price Feed IDs for Pyth Network
export const STOCK_PRICE_FEED_ID: Record<string, string> = {
  // Tech Stocks
  AAPL: "0xAAPL_PriceFeedID", // Apple
  MSFT: "0x0d3FCD8C4df5421b32Bd65c5c323035B93D3fB7b", // Microsoft
  NVIDIA: "0xe00382e98e94620Dc265889CA2EC9D13E024A37a", // Alphabet (Google)
  AMZN: "0xAMZN_PriceFeedID", // Amazon
  TSLA: "0xb9F7c42468461ff1C93ee5a5501756486aB6096B", // Tesla
  META: "0xMETA_PriceFeedID", // Meta (Facebook)

  // Financial Stocks
  JPM: "0xJPM_PriceFeedID", // JPMorgan Chase
  BAC: "0xBAC_PriceFeedID", // Bank of America
  WFC: "0xWFC_PriceFeedID", // Wells Fargo
  GS: "0xGS_PriceFeedID", // Goldman Sachs

  // Consumer Goods Stocks
  KO: "0xKO_PriceFeedID", // Coca-Cola
  PEP: "0xPEP_PriceFeedID", // PepsiCo
  PG: "0xPG_PriceFeedID", // Procter & Gamble
  MCD: "0xMCD_PriceFeedID", // McDonald's
  SBUX: "0xSBUX_PriceFeedID", // Starbucks

  // Automotive Stocks
  GM: "0xGM_PriceFeedID", // General Motors
  F: "0xF_PriceFeedID", // Ford Motor Company

  // Healthcare Stocks
  JNJ: "0xJNJ_PriceFeedID", // Johnson & Johnson
  PFE: "0xPFE_PriceFeedID", // Pfizer
  MRK: "0xMRK_PriceFeedID", // Merck

  // Energy Stocks
  XOM: "0xXOM_PriceFeedID", // Exxon Mobil
  CVX: "0xCVX_PriceFeedID", // Chevron

  // Airlines
  DAL: "0xDAL_PriceFeedID", // Delta Airlines
  UAL: "0xUAL_PriceFeedID", // United Airlines

  // Indices
  SPY: "0xSPY_PriceFeedID", // S&P 500 ETF
  DIA: "0xDIA_PriceFeedID", // Dow Jones ETF
  QQQ: "0xQQQ_PriceFeedID", // NASDAQ 100 ETF
};
