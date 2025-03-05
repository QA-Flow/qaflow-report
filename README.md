# QAFlow Report

QAFlow Report is a comprehensive reporting module for your test automation efforts. It seamlessly integrates with Playwright, Jest, and other test frameworks.

## Installation

```bash
npm install @qaflow/report
# or
yarn add @qaflow/report
# or
pnpm add @qaflow/report
```

## Quick Start

### Creating a Configuration File

To use QAFlow Report, you need to create a configuration file that contains your API key. You can generate this file using the following command:

```bash
npx @qaflow/report init
```

This command will interactively prompt you for your API key and generate a `reporter.config.js` or `reporter.config.ts` file.

Alternatively, you can specify your API key directly:

```bash
npx @qaflow/report init --key=<apiKey>
```

The generated configuration file will look like this:

#### `reporter.config.js`
```javascript
export default {
  apiKey: 'YOUR_API_KEY_HERE'
};
```

#### `reporter.config.ts`
```typescript
export default {
  apiKey: 'YOUR_API_KEY_HERE'
};
```

### Basic Usage

To use the reporter in your test files:

```javascript
// Import the reporter
import reporter from "@qaflow/report";

// Create a test
reporter.createTest(
  "Login Test", // Test name
  "Testing the login functionality of our application", // Description
  { author: "QA Tester", email: "tester@example.com" }, // Tester info
  { name: "Chrome", version: "118.0.0", os: "macOS", browser: "Chrome" } // Environment
);

// Add test steps
await reporter.step("Navigate to the login page", () => {
  return true; // Step successful
});

await reporter.step("Enter username", () => {
  return true;
});

// End the test and retrieve results
const results = await reporter.end();
console.log(`Total steps: ${results.summary.total}`);
console.log(`Passed steps: ${results.summary.passed}`);
console.log(`Failed steps: ${results.summary.failed}`);
console.log(`Skipped steps: ${results.summary.skipped}`);
```

## API Usage

### `reporter.initialize(apiKey, options)`

If you are not using a configuration file, you can initialize the reporter programmatically:

```javascript
reporter.initialize("your-api-key-here");
```

### `reporter.createTest(testName, description, tester, environment)`

Creates a new test and registers it as the active test:

```javascript
reporter.createTest(
  "Search Test",
  "Tests the search functionality on the homepage",
  { author: "QA Tester", email: "tester@example.com" },
  { name: "Firefox", version: "115.0", os: "Windows" }
);
```

### `reporter.step(name, fn, options)`

Adds a step to the active test and executes it:

```javascript
// Successful step
await reporter.step("Navigate to homepage", () => {
  return true;
});

// Failed step
await reporter.step("Perform login", () => {
  throw new Error("Login failed");
});

// Skipped step
await reporter.step("View profile", () => {}, { skipped: true });

// Step with screenshot
await reporter.step("Verify search results", () => {
  return true;
}, { screenshot: "base64-screenshot-data" });
```

### `reporter.end()`

Ends the active test and sends results to the API:

```javascript
const results = await reporter.end();
console.log("Test result:", results);
```

## Documentation

For detailed documentation, visit [QAFlow Docs](https://qaflow.tech/docs).

## Website

Learn more about QAFlow at [QAFlow Website](https://qaflow.tech/).

## 📜 License
This project is licensed under the [MIT License](LICENSE).

## 👤 Author
- GitHub: [@QA-Flow](https://github.com/QA-Flow)
- Author Github: [@dorukozgen](https://github.com/dorukozgen)
- LinkedIn: [Doruk](https://www.linkedin.com/in/dorukozgen)