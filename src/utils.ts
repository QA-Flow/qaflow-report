import { TestStatus, TestStep } from './types';

/**
 * Returns the current timestamp
 * @returns Current timestamp
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * Converts an error to string format
 * @param error Error object
 * @returns Error message in string format
 */
export function errorToString(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack || ''}`;
  }
  
  return String(error);
}

/**
 * Determines the status of a test step
 * @param passed Success status of the test step
 * @param skipped Skip status of the test step
 * @returns Test status
 */
export function determineTestStatus(passed?: boolean, skipped?: boolean): TestStatus {
  if (skipped) {
    return TestStatus.SKIPPED;
  }
  
  return passed ? TestStatus.PASSED : TestStatus.FAILED;
}

/**
 * Creates a summary of the test session
 * @param steps Test steps
 * @returns Test summary (total, passed, failed, skipped, duration)
 */
export function createTestSummary(steps: TestStep[]) {
  const summary = {
    total: steps.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0
  };

  steps.forEach((step) => {
    switch (step.status) {
      case TestStatus.PASSED:
        summary.passed += 1;
        break;
      case TestStatus.FAILED:
        summary.failed += 1;
        break;
      case TestStatus.SKIPPED:
        summary.skipped += 1;
        break;
    }

    if (step.duration) {
      summary.duration += step.duration;
    }
  });

  return summary;
}