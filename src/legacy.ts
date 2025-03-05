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

/**
 * Test class - Represents a test operation (Legacy support)
 */
export class Test {
  private readonly id: string;
  private readonly reporter: QAFlowReport;
  
  /**
   * Test class constructor (internal use only)
   * @param id Test ID
   * @param reporter Parent QAFlowReport instance
   */
  constructor(id: string, reporter: QAFlowReport) {
    this.id = id;
    this.reporter = reporter;
  }
  
  /**
   * Adds and executes a test step
   * @param name Step name
   * @param fn Function to execute or boolean value (for assertions)
   * @param options Step options
   * @returns Result of the executed test and the created step
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
    return this.reporter.stepInternal(this.id, name, fn, options);
  }
  
  /**
   * Ends the test session, sends all information to the API and returns a summary
   * @returns Test summary
   */
  async end(): Promise<{
    summary: ReturnType<typeof createTestSummary>;
    name: string;
    duration: number;
  }> {
    return this.reporter.endTestInternal(this.id);
  }
}

/**
 * QAFlow Report class - Main class for test reporting (Legacy support)
 */
export class QAFlowReport {
  private api: QAFlowAPI;
  private config: QAFlowConfig;
  private tests: Map<string, {
    session: Omit<TestSession, 'id'>;
    steps: TestStep[];
    startTime: number;
    isActive: boolean;
  }> = new Map();

  /**
   * QAFlowReport class constructor
   * @param config Module configuration
   */
  constructor(config: Omit<QAFlowConfig, 'apiUrl'>) {
    this.config = {
      ...config
    };
    this.api = new QAFlowAPI(this.config);
  }

  /**
   * Creates a new test object
   * @param testName Test name
   * @param tester Tester information (author and email)
   * @param environment Test environment information (automatically detected if not provided)
   * @param description Test description (optional)
   * @returns Test object
   */
  createTest(
    testName: string,
    tester: Tester,
    environment: TestEnvironment,
    description: string
  ): Test {
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
    
    this.tests.set(testId, {
      session,
      steps: [],
      startTime,
      isActive: true
    });
    
    return new Test(testId, this);
  }

  /**
   * Internal method to add and execute a test step
   * @param testId Test ID
   * @param name Step name
   * @param fn Function to execute or boolean value (for assertions)
   * @param options Step options
   * @returns Result of the executed test and the created step
   */
  async stepInternal<T>(
    testId: string,
    name: string,
    fn: (() => Promise<T> | T) | boolean,
    options?: {
      description?: string;
      screenshot?: string;
      skipped?: boolean;
    }
  ): Promise<{ step: TestStep; result?: T }> {
    const test = this.tests.get(testId);
    if (!test || !test.isActive) {
      throw new Error(`No active test found with ID: ${testId}. Please create a test before adding steps.`);
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

      test.steps.push(step);
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

      test.steps.push(step);
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

      test.steps.push(step);
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

      test.steps.push(step);
      return { step };
    }
  }

  /**
   * Internal method to end a test session, sends all information to the API and returns a summary
   * @param testId Test ID
   * @returns Test summary
   */
  async endTestInternal(testId: string): Promise<{
    summary: ReturnType<typeof createTestSummary>;
    name: string;
    duration: number;
  }> {
    const test = this.tests.get(testId);
    if (!test || !test.isActive) {
      throw new Error(`No active test found with ID: ${testId}`);
    }

    const endTime = getCurrentTimestamp();
    const duration = endTime - test.startTime;
    
    try {
      // Calculate test status
      const totalStatus = this.calculateTestStatus(test.steps);
      
      // Create test summary
      const summary = createTestSummary(test.steps);
      
      // Send all test data to the API
      const testData = {
        ...test.session,
        steps: test.steps,
        endTime,
        duration,
        status: totalStatus
      };
      
      await this.api.submitTestReport(testData);
      
      const result = {
        name: test.session.name,
        summary,
        duration
      };

      // Update the session
      test.isActive = false;
      this.tests.set(testId, test);

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
} 