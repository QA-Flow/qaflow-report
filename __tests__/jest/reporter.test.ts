import reporter from '@qaflow/report';

require('dotenv').config();

beforeAll(() => {
  reporter.initialize(process.env.API_KEY || '');
});

describe('QAFlow Reporter with Jest', () => {
  let testId: string;
  beforeEach(() => {
    testId = reporter.createTest(
      'Jest Integration Test',
      'Testing QAFlow reporter integration with Jest',
      { author: 'Test Engineer', email: 'engineer@example.com' },
      { name: 'Jest Test Environment', os: 'Node.js', browser: 'Jest' }
    );
  });

  test('should report successful step', async () => {
    const { step } = await reporter.step('Successful step', () => {
      expect(1 + 1).toBe(2);
      return true;
    });
    
    expect(step.status).toBe('passed');
  });

  test('should report failed step', async () => {
    try {
      await reporter.step('Failing step', () => {
        throw new Error('This step is designed to fail');
      });
    } catch (error) {
      // Error is thrown but step is still recorded
      const testResults = await reporter.end();
      expect(testResults.summary.failed).toBeGreaterThan(0);
    }
  });

  test('should report skipped step', async () => {
    const { step } = await reporter.step('Skipped step', true, {
      skipped: true,
      description: 'This step is explicitly skipped'
    });
    
    expect(step.status).toBe('skipped');
  });

  test('should handle async operations', async () => {
    const { step, result } = await reporter.step('Async operation', async () => {
      return new Promise<number>((resolve) => {
        setTimeout(() => {
          resolve(42);
        }, 100);
      });
    });
    
    expect(step.status).toBe('passed');
    expect(result).toBe(42);
  });

  afterEach(async () => {
    const results = await reporter.end();
    console.log('Test results:', results);
  });
}); 