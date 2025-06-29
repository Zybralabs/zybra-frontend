/**
 * Environment variable utilities with fallbacks for Netlify deployment
 */

// Helper function to safely get environment variables with fallbacks
export function getEnvVar(key: string, fallback: string = ''): string {
  if (typeof window !== 'undefined') {
    // Client-side: only access NEXT_PUBLIC_ variables
    if (!key.startsWith('NEXT_PUBLIC_')) {
      console.warn(`Attempting to access non-public env var ${key} on client side`);
      return fallback;
    }
  }
  
  const value = process.env[key];
  if (value === undefined || value === null || value === '') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Environment variable ${key} is not set, using fallback: ${fallback}`);
    }
    return fallback;
  }
  
  return value;
}

// Helper function to safely get boolean environment variables
export function getEnvBool(key: string, fallback: boolean = false): boolean {
  const value = getEnvVar(key, fallback.toString());
  return value.toLowerCase() === 'true' || value === '1';
}

// Helper function to safely get number environment variables
export function getEnvNumber(key: string, fallback: number = 0): number {
  const value = getEnvVar(key, fallback.toString());
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

// Centralized environment configuration with fallbacks
export const ENV_CONFIG = {
  // API Configuration
  ALCHEMY_API_KEY: getEnvVar('NEXT_PUBLIC_ALCHEMY_API_KEY', '1dUe6zHAjXocqykmyQks8EmNvFiPJ0p3'),

  // Centrifuge Configuration
  NETWORK: getEnvVar('NEXT_PUBLIC_NETWORK', 'centrifuge') as 'altair' | 'centrifuge',
  RELAY_WSS_URL: getEnvVar('NEXT_PUBLIC_RELAY_WSS_URL', 'wss://frag-moonbase-relay-rpc-ws.g.moonbase.moonbeam.network'),
  COLLATOR_WSS_URL: getEnvVar('NEXT_PUBLIC_COLLATOR_WSS_URL', 'wss://fullnode.demo.k-f.dev,wss://fullnode-apps.demo.k-f.dev'),
  SUBQUERY_URL: getEnvVar('NEXT_PUBLIC_SUBQUERY_URL', 'https://api.subquery.network/sq/centrifuge/pools-demo-multichain'),
  IPFS_GATEWAY: getEnvVar('NEXT_PUBLIC_IPFS_GATEWAY', 'https://centrifuge.mypinata.cloud/'),
  
  // Wallet Configuration
  WALLET_CONNECT_PROJECT_ID: getEnvVar('NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID', 'c6c9bacd35afa3eb9e6cccf6d8464395'),
  
  // API Keys
  MOONPAY_API_KEY: getEnvVar('NEXT_PUBLIC_MOONPAY_PUBLISHABLE_KEY', 'pk_test_DycfESRid31UaSxhI5yWKe1r5E5kKSz'),
  FINNHUB_API_KEY: getEnvVar('NEXT_PUBLIC_FINNHUB_API_KEY', 'cuegv4pr01qkqnpf6060cuegv4pr01qkqnpf606g'),
  
  // Feature Flags
  IS_DEMO: getEnvBool('NEXT_PUBLIC_IS_DEMO', true),
  IS_ZYBRA_INTERFACE: getEnvBool('NEXT_PUBLIC_IS_ZYBRA_INTERFACE', true),
  DEFAULT_UNLIST_POOLS: getEnvBool('NEXT_PUBLIC_DEFAULT_UNLIST_POOLS', true),
  
  // Development
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  
  // External API URLs
  ZYBRA_BASE_API_URL: getEnvVar('NEXT_PUBLIC_ZYBRA_BASE_API_URL', 'http://localhost:5000'),
  AWS_API_ENDPOINT: getEnvVar('NEXT_PUBLIC_AWS_API_ENDPOINT', 'https://beta.gateway.zybra.org/v1/graphql'),
  
  // Third-party API keys with fallbacks
  ONFINALITY_KEY: getEnvVar('NEXT_PUBLIC_ONFINALITY_KEY', '0e1c049f-d876-4e77-a45f-b5afdf5739b2'),
  TENDERLY_KEY: getEnvVar('NEXT_PUBLIC_TENDERLY_KEY', '18aMTJlpNb1lElcYNkkunC'),
};

// Validation function to check critical environment variables
export function validateEnvironment(): { isValid: boolean; missingVars: string[] } {
  const criticalVars = [
    'NEXT_PUBLIC_ALCHEMY_API_KEY',
    'NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID',
  ];
  
  const missingVars = criticalVars.filter(varName => {
    const value = process.env[varName];
    return !value || value.trim() === '';
  });
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

// Log environment status (only in development)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  const validation = validateEnvironment();
  if (!validation.isValid) {
    console.warn('Missing critical environment variables:', validation.missingVars);
  }
  console.log('Environment configuration loaded:', {
    NODE_ENV: ENV_CONFIG.NODE_ENV,
    NETWORK: ENV_CONFIG.NETWORK,
    IS_DEMO: ENV_CONFIG.IS_DEMO,
    hasAlchemyKey: !!ENV_CONFIG.ALCHEMY_API_KEY,
    hasWalletConnect: !!ENV_CONFIG.WALLET_CONNECT_PROJECT_ID,
  });
}
