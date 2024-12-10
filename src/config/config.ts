import { z } from 'zod';

/**
 * Environment variable schema validation
 */
const envSchema = z.object({
  // API Keys and External Services
  OPENAI_API_KEY: z.string(),
  CLOUDFLARE_ACCOUNT_ID: z.string(),
  CLOUDFLARE_ACCESS_KEY: z.string(),
  CLOUDFLARE_SECRET_KEY: z.string(),

  // Application Settings
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  ENABLE_RATE_LIMITING: z.boolean().default(true),
  MAX_REQUESTS_PER_MINUTE: z.number().default(60),
  ENABLE_TEST_LOGS: z.boolean().default(false),

  // AI Model Settings
  DEFAULT_MODEL: z.string().default('gpt-4-vision-preview'),
  MODEL_TEMPERATURE: z.number().min(0).max(2).default(0.7),
  MAX_TOKENS: z.number().default(4000),

  // Security Settings
  JWT_SECRET: z.string().optional(),
  CORS_ORIGINS: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.number().default(60000),

  // Monitoring Settings
  ENABLE_METRICS: z.boolean().default(true),
  METRICS_PORT: z.number().default(9090),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

/**
 * Validate and export environment variables
 */
export const env = envSchema.parse(process.env);

/**
 * Application constants
 */
export const constants = {
  // AI Model Defaults
  DEFAULT_MODEL: 'gpt-4-vision-preview',
  TEMPERATURE: 0.7,
  MAX_TOKENS: 4000,
  
  // Rate Limiting
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  
  // Timeouts
  REQUEST_TIMEOUT_MS: 30000,
  SOCKET_TIMEOUT_MS: 60000,
  
  // Cache Settings
  CACHE_TTL_SECONDS: 3600,
  MAX_CACHE_ITEMS: 1000,
  
  // Security
  PASSWORD_MIN_LENGTH: 8,
  TOKEN_EXPIRY: '24h',
  
  // File Upload Limits
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_FILE_TYPES: ['image/png', 'image/jpeg', 'image/webp'],
  
  // API Endpoints
  API_VERSION: 'v1',
  API_BASE_PATH: '/api/v1',
  
  // Monitoring
  METRICS_PREFIX: 'liminal_ai_',
  ERROR_THRESHOLD: 0.05, // 5% error rate threshold
  
  // Design Generation
  MAX_DESIGN_ATTEMPTS: 3,
  DESIGN_TIMEOUT_MS: 45000,
} as const;

/**
 * Example .env file content
 */
export const envExample = `
# API Keys and External Services
OPENAI_API_KEY=your_openai_api_key
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_ACCESS_KEY=your_cloudflare_access_key
CLOUDFLARE_SECRET_KEY=your_cloudflare_secret_key

# Application Settings
NODE_ENV=development
PORT=3000
ENABLE_RATE_LIMITING=true
MAX_REQUESTS_PER_MINUTE=60
ENABLE_TEST_LOGS=false

# AI Model Settings
DEFAULT_MODEL=gpt-4-vision-preview
MODEL_TEMPERATURE=0.7
MAX_TOKENS=4000

# Security Settings
JWT_SECRET=your_jwt_secret
CORS_ORIGINS=*
RATE_LIMIT_WINDOW_MS=60000

# Monitoring Settings
ENABLE_METRICS=true
METRICS_PORT=9090
LOG_LEVEL=info
`;

/**
 * Configuration type definitions
 */
export type Config = z.infer<typeof envSchema>;
export type Constants = typeof constants; 