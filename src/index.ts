import { QAFlowAPI } from './api';
import {
  QAFlowConfig,
  TestEnvironment,
  TestSession,
  TestStatus,
  TestStep,
  Tester
} from './types';
import {
  createTestSummary,
  errorToString,
  getCurrentTimestamp
} from './utils';
import fs from 'fs';

/**
 * QAFlow Reporter - Singleton instance for test reporting
 */
class QAFlowReporter {
  private api: QAFlowAPI | null = null;
  private config: QAFlowConfig | null = null;
  private currentTest: {
    id: string;
    session: Omit<TestSession, 'id'>;
    steps: TestStep[];
    startTime: number;
    isActive: boolean;
  } | null = null;
  
  /**
   * Initialize the reporter with API key and configuration
   * @param apiKey API Key for authentication
   * @param options Additional configuration options
   */
  initialize(apiKey: string, options: Partial<Omit<QAFlowConfig, 'apiKey'>> = {}): void {
    this.config = {
      apiKey,
      ...options
    };
    
    this.api = new QAFlowAPI(this.config);
  }
  
  /**
   * Load configuration from config file
   */
  async loadConfig(): Promise<void> {
    try {
      const config = await import(process.cwd() + '/reporter.config.js');
      if (config && config.apiKey) {
        this.initialize(config.apiKey, config.options || {});
      } else {
        console.warn('Warning: API key not found in config file. Please set API key before using reporter.');
      }
    } catch (e) {
      try {
        const config = await import(process.cwd() + '/reporter.config.ts');
        if (config && config.default && config.default.apiKey) {
          this.initialize(config.default.apiKey, config.default.options || {});
        } else if (config && config.apiKey) {
          this.initialize(config.apiKey, config.options || {});
        } else {
          console.warn('Warning: API key not found in config file. Please set API key before using reporter.');
        }
      } catch (e) {
        console.warn('Warning: Config file not found. Please create reporter.config.js or set API key manually.');
      }
    }
  }
  
  /**
   * Creates a new test and makes it the current active test
   * @param testName Test name
   * @param description Test description
   * @param tester Tester information (author and email)
   * @param environment Test environment information
   * @returns Test ID
   */
  createTest(
    testName: string,
    description: string,
    tester: Tester,
    environment: TestEnvironment
  ): string {
    if (!this.api) {
      throw new Error('Reporter not initialized. Please call initialize() with API key first.');
    }
    
    const testId = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const startTime = getCurrentTimestamp();
    
    const session: Omit<TestSession, 'id'> = {
      name: testName,
      description,
      tester,
      environment,
      steps: [],
      startTime
    };
    
    this.currentTest = {
      id: testId,
      session,
      steps: [],
      startTime,
      isActive: true
    };
    
    return testId;
  }
  
  /**
   * Adds a step to the current test
   * @param name Step name
   * @param fn Function to execute or boolean value
   * @param options Step options
   * @returns Step result
   */
  async step<T>(
    name: string,
    fn: (() => Promise<T> | T) | boolean,
    options?: {
      description?: string;
      screenshot?: string;
      skipped?: boolean;
    }
  ): Promise<{ step: TestStep; result?: T }> {
    if (!this.currentTest || !this.currentTest.isActive) {
      throw new Error('No active test found. Please create a test before adding steps.');
    }
    
    // Skip the step if specified
    if (options?.skipped) {
      const stepTime = getCurrentTimestamp();
      const step: TestStep = {
        name,
        status: TestStatus.SKIPPED,
        description: options?.description,
        screenshot: options?.screenshot,
        timestamp: stepTime,
        duration: 0
      };

      this.currentTest.steps.push(step);
      return { step };
    }

    // Direct assertion with boolean value
    if (typeof fn === 'boolean') {
      const stepTime = getCurrentTimestamp();
      const status = fn ? TestStatus.PASSED : TestStatus.FAILED;
      const step: TestStep = {
        name,
        status,
        description: options?.description,
        screenshot: options?.screenshot,
        timestamp: stepTime,
        duration: 0
      };

      this.currentTest.steps.push(step);
      return { step };
    }

    // Function execution and error handling
    const startTime = getCurrentTimestamp();
    try {
      const result = await fn();
      
      // Treat result as assertion if it's boolean
      const status = typeof result === 'boolean' 
        ? (result ? TestStatus.PASSED : TestStatus.FAILED)
        : TestStatus.PASSED;
        
      const endTime = getCurrentTimestamp();
      const step: TestStep = {
        name,
        status,
        description: options?.description,
        screenshot: options?.screenshot,
        timestamp: startTime,
        duration: endTime - startTime
      };

      this.currentTest.steps.push(step);
      return { step, result };
    } catch (error) {
      const endTime = getCurrentTimestamp();
      const step: TestStep = {
        name,
        status: TestStatus.FAILED,
        description: options?.description,
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : ""
        },
        screenshot: options?.screenshot,
        timestamp: startTime,
        duration: endTime - startTime
      };

      this.currentTest.steps.push(step);
      this.end();
      throw error;
    }
  }
  
  /**
   * Ends the current test, sends data to the API, and returns a summary
   * @returns Test summary
   */
  async end(): Promise<{
    summary: ReturnType<typeof createTestSummary>;
    name: string;
    duration: number;
  }> {
    if (!this.currentTest || !this.currentTest.isActive) {
      throw new Error('No active test found. Please create a test before ending it.');
    }
    
    if (!this.api) {
      throw new Error('Reporter not initialized. Please call initialize() with API key first.');
    }

    const endTime = getCurrentTimestamp();
    const duration = endTime - this.currentTest.startTime;
    
    try {
      // Calculate test status
      const totalStatus = this.calculateTestStatus(this.currentTest.steps);
      
      // Create test summary
      const summary = createTestSummary(this.currentTest.steps);
      
      // Send all test data to the API
      const testData = {
        ...this.currentTest.session,
        steps: this.currentTest.steps,
        endTime,
        duration,
        status: totalStatus
      };
      
      await this.api.submitTestReport(testData);
      
      const result = {
        name: this.currentTest.session.name,
        summary,
        duration
      };

      // Mark the test as inactive
      this.currentTest.isActive = false;

      return result;
    } catch (error) {
      throw new Error(`Failed to end test: ${errorToString(error)}`);
    }
  }
  
  /**
   * Calculates the test result
   * @param steps Test steps
   * @returns Test result (passed, failed, skipped)
   */
  private calculateTestStatus(steps: TestStep[]): TestStatus {
    // Return PASSED if there are no steps
    if (steps.length === 0) {
      return TestStatus.PASSED;
    }

    // If any step is FAILED, the test is considered FAILED
    const hasFailedStep = steps.some(step => step.status === TestStatus.FAILED);
    if (hasFailedStep) {
      return TestStatus.FAILED;
    }

    // If all steps are SKIPPED, the test is considered SKIPPED
    const allSkipped = steps.every(step => step.status === TestStatus.SKIPPED);
    if (allSkipped) {
      return TestStatus.SKIPPED;
    }

    // In other cases, PASSED
    return TestStatus.PASSED;
  }
  
  /**
   * Generate a config file template
   * @param path Path to save the config file
   * @param apiKey Optional API key to include in the config
   */
  generateConfig(path: string = './reporter.config.js', apiKey?: string): void {
    const configTemplate = `module.exports = {
  apiKey: '${apiKey || 'YOUR_API_KEY_HERE'}',
  options: {
    // Additional options (optional)
    // pingInterval: 5000,
    // autoScreenshot: true
  }
};
`;
    
    fs.writeFileSync(path, configTemplate);
    console.log(`Config file generated at: ${path}`);
  }
}

// Create and export singleton instance
const reporter = new QAFlowReporter();

// Try to load config automatically
try {
  reporter.loadConfig();
} catch (e) {
  // Silent fail - user will need to initialize manually
}

// Export the default instance
export default reporter;

// Export the old classes for backward compatibility
export { QAFlowReport } from './legacy';
export * from './types';
export * from './utils'; 