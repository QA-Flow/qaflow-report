import reporter from '@qaflow/report';
import fs from 'fs/promises';
import path from 'path';

require('dotenv').config();

beforeAll(() => {
  reporter.initialize(process.env.API_KEY || '');
});

describe('Advanced QAFlow Reporter Tests', () => {
  let tempDir: string;
  
  beforeAll(async () => {
    tempDir = path.join(__dirname, 'temp_test_dir');
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (err) {
      console.error('Error creating temp directory:', err);
    }
  });

  afterAll(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.error('Error removing temp directory:', err);
    }
  });

  test('should handle file operations with reporting', async () => {
    reporter.createTest(
      'File Operations Test',
      'Testing file operations with QAFlow reporter',
      { author: 'File System Tester', email: 'fs@example.com' },
      { name: 'Node.js', os: process.platform, version: process.version }
    );

    const testFilePath = path.join(tempDir, 'test-file.txt');
    const testContent = 'This is a test file created by QAFlow reporter tests';
    
    await reporter.step('Create test file', async () => {
      await fs.writeFile(testFilePath, testContent, 'utf8');
      const fileExists = await fs.stat(testFilePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
      return { created: fileExists, path: testFilePath };
    });

    await reporter.step('Read file content', async () => {
      const content = await fs.readFile(testFilePath, 'utf8');
      expect(content).toBe(testContent);
      return { content, length: content.length };
    });

    await reporter.step('Append to file', async () => {
      const additionalContent = '\nThis line was appended in a test step';
      await fs.appendFile(testFilePath, additionalContent, 'utf8');
      const newContent = await fs.readFile(testFilePath, 'utf8');
      expect(newContent).toBe(testContent + additionalContent);
      return { 
        originalLength: testContent.length,
        newLength: newContent.length,
        difference: newContent.length - testContent.length
      };
    });

    const results = await reporter.end();
    expect(results.summary.passed).toBeGreaterThan(0);
  });

  test('should handle complex data processing', async () => {
    const testData = [
      { id: 1, name: 'Item 1', value: 10 },
      { id: 2, name: 'Item 2', value: 20 },
      { id: 3, name: 'Item 3', value: 30 },
      { id: 4, name: 'Item 4', value: 40 },
      { id: 5, name: 'Item 5', value: 50 }
    ];
    
    reporter.createTest(
      'Data Processing Test',
      'Testing data transformations with QAFlow reporter',
      { author: 'Data Engineer', email: 'data@example.com' },
      { name: 'Node.js Data Processing', version: process.version }
    );

    await reporter.step('Filter data items', () => {
      const filtered = testData.filter(item => item.value > 25);
      expect(filtered.length).toBe(3);
      return { count: filtered.length, items: filtered };
    });

    await reporter.step('Calculate data statistics', () => {
      const sum = testData.reduce((acc, item) => acc + item.value, 0);
      const average = sum / testData.length;
      const min = Math.min(...testData.map(item => item.value));
      const max = Math.max(...testData.map(item => item.value));
      
      expect(sum).toBe(150);
      expect(average).toBe(30);
      
      return { sum, average, min, max };
    });

    await reporter.step('Transform data structure', () => {
      const transformed = testData.map(item => ({
        identifier: `ID-${item.id}`,
        label: item.name.toUpperCase(),
        metrics: {
          original: item.value,
          doubled: item.value * 2,
          squared: item.value * item.value
        }
      }));
      
      expect(transformed.length).toBe(testData.length);
      expect(transformed[0].metrics.doubled).toBe(testData[0].value * 2);
      
      return transformed;
    });

    const results = await reporter.end();
    expect(results.summary.passed).toBe(3);
  });
}); 