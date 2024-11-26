// Addresses for various contracts on supported networks

export enum ChainId {
  Mainnet = 8453,
  Testnet = 4

}
export const ZYBRA_CONFIGURATOR_ADDRESS = {
    1: '0xZybraConfiguratorMainnet', // Mainnet
    4: '0xZybraConfiguratorRinkeby', // Rinkeby
    8453: '0xZybraConfiguratorBase', // Base
  };
  
  export const SWARM_VAULT_ADDRESS = {
    1: '0xERC7540VaultMainnet', // Mainnet
    4: '0xERC7540VaultRinkeby', // Rinkeby
    8453: '0xERC7540VaultBase', // Base
  };

export const CENTRIFUGE_VAULT_ADDRESS = {
    1: '0xERC7540VaultMainnet', // Mainnet
    4: '0xERC7540VaultRinkeby', // Rinkeby
    8453: '0xERC7540VaultBase', // Base
  };
  
  export const MULTICALL_ADDRESS = {
    1: '0xERC7540VaultMainnet', // Mainnet
    4: '0xERC7540VaultRinkeby', // Rinkeby
    8453: '0xERC7540VaultBase', // Base
  };

  export const ENS_REGISTRAR_ADDRESSES = {
    1: '0xERC7540VaultMainnet', // Mainnet
    4: '0xERC7540VaultRinkeby', // Rinkeby
    8453: '0xERC7540VaultBase', // Base
  };

  export const CENTRIFUGE_ROUTER_ADDRESS = {
    1: '0xCentrifugeRouterMainnet', // Mainnet
    4: '0xCentrifugeRouterRinkeby', // Rinkeby
    8453: '0xCentrifugeRouterBase', // Base
  };
  
  export const INVESTMENT_MANAGER_ADDRESS = {
    1: '0xInvestmentManagerMainnet', // Mainnet
    4: '0xInvestmentManagerRinkeby', // Rinkeby
    8453: '0xInvestmentManagerBase', // Base
  };
  
  export const ZYBRA_VAULT_BASE_ADDRESS = {
    1: '0xZybraVaultBaseMainnet', // Mainnet
    4: '0xZybraVaultBaseRinkeby', // Rinkeby
    8453: '0xZybraVaultBaseBase', // Base
  };

  export const QOUTER_ADDRESS = {
    1: '0xZybraVaultBaseMainnet', // Mainnet
    4: '0xZybraVaultBaseRinkeby', // Rinkeby
    8453: '0xZybraVaultBaseBase', // Base
  };
  
  export const ZFI_TOKEN_ADDRESS = {
    1: '0xZybraVaultBaseMainnet', // Mainnet
    4: '0xZybraVaultBaseRinkeby', // Rinkeby
    8453: '0xZybraVaultBaseBase', // Base
  };

  export const ZFI_STAKING_ADDRESS = {
    1: '0xZybraVaultBaseMainnet', // Mainnet
    4: '0xZybraVaultBaseRinkeby', // Rinkeby
    8453: '0xZybraVaultBaseBase', // Base
  };
  
  // USDC Token Addresses for different networks
  export const USDC_ADDRESS = {
    1: '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // Mainnet
    4: '0x4dbcdf9b62e891a7cec5a2568c3f4faf9e8abe2b', // Rinkeby
    8453: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Base
  };
  
  // Price Feed Addresses for different networks
  export const PRICE_FEED_ADDRESS = {
    1: {
      ETH_USD: '0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419', // Chainlink ETH/USD Price Feed on Mainnet
      BTC_USD: '0xf4030086522a5beea4988f8ca5b36dbc97bee88c', // Chainlink BTC/USD Price Feed on Mainnet
    },
    4: {
      ETH_USD: '0x8a753747a1fa494ec906cE90E9f37563A8AF630e', // Chainlink ETH/USD Price Feed on Rinkeby
      BTC_USD: '0x5741306c21795fdcbb9b265ea0255f499dfe515c', // Chainlink BTC/USD Price Feed on Rinkeby
    },
    8453: {
      ETH_USD: '0xBaseChainETHUSDPriceFeed', // Replace with actual Base chain ETH/USD Price Feed
      BTC_USD: '0xBaseChainBTCUSDPriceFeed', // Replace with actual Base chain BTC/USD Price Feed
    },
  };
  