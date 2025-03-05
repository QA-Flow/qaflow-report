/**
 * Enum representing test statuses
 */
export enum TestStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

/**
 * Interface containing information about the test performer
 */
export interface Tester {
  author: string;
  email: string;
}

/**
 * Interface containing test environment information
 */
export interface TestEnvironment {
  name: string;
  version?: string;
  os?: string;
  browser?: string;
  device?: string;
  viewport?: string;
}

/**
 * Interface representing a test step
 */
export interface TestStep {
  name: string;
  status: TestStatus;
  description?: string;
  error?: { message: string; stack?: string };
  screenshot?: string;
  timestamp: number;
  duration?: number;
}

/**
 * Interface representing a test session
 */
export interface TestSession {
  id: string;
  name: string;
  description?: string;
  tester: Tester;
  environment: TestEnvironment;
  steps: TestStep[];
  startTime: number;
  endTime?: number;
  status?: TestStatus;
}

/**
 * Interface representing module configuration
 */
export interface QAFlowConfig {
  apiKey: string;
  pingInterval?: number;
  autoScreenshot?: boolean;
}

/**
 * Interfaces representing API responses
 */
export interface CreateTestSessionResponse {
  id: string;
  success: boolean;
  message?: string;
}

export interface UpdateTestSessionResponse {
  success: boolean;
  message?: string;
}

export interface PingTestSessionResponse {
  success: boolean;
  message?: string;
}

export interface EndTestSessionResponse {
  success: boolean;
  message?: string;
  summary?: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
} 