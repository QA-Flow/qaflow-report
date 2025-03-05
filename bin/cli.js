import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const TS_CONFIG_TEMPLATE = `export default {
  apiKey: 'YOUR_API_KEY_HERE'
};
`;

const JS_CONFIG_TEMPLATE = `module.exports = {
  apiKey: 'YOUR_API_KEY_HERE'
};
`;

function isTypeScriptProject() {
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    return true;
  }

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const allDeps = {
        ...(packageJson.dependencies || {}),
        ...(packageJson.devDependencies || {})
      };

      return 'typescript' in allDeps;
    } catch (error) {
      return false;
    }
  }

  return false;
}

function getConfigFileName() {
  return isTypeScriptProject() ? 'reporter.config.ts' : 'reporter.config.js';
}

function getConfigTemplate(apiKey = 'YOUR_API_KEY_HERE') {
  const template = isTypeScriptProject() ? TS_CONFIG_TEMPLATE : JS_CONFIG_TEMPLATE;
  return template.replace('API_KEY_PLACEHOLDER', apiKey);
}

function createConfigFile(apiKey) {
  const configFileName = getConfigFileName();
  const configPath = path.join(process.cwd(), configFileName);

  if (fs.existsSync(configPath)) {
    console.log(`\x1b[33mWarning: ${configFileName} already exists at ${configPath}\x1b[0m`);
    rl.question('Do you want to overwrite it? (y/N): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        writeConfigFile(configPath, apiKey);
      } else {
        console.log(`Operation cancelled. Existing ${configFileName} was not modified.`);
      }
      rl.close();
    });
  } else {
    writeConfigFile(configPath, apiKey);
    rl.close();
  }
}

function writeConfigFile(configPath, apiKey) {
  const configFileName = path.basename(configPath);
  try {
    fs.writeFileSync(configPath, getConfigTemplate(apiKey));
    console.log(`\x1b[32mSuccess: ${configFileName} created at ${configPath}\x1b[0m`);
  } catch (error) {
    console.error(`\x1b[31mError: Failed to create ${configFileName}\x1b[0m`);
    console.error(error);
  }
}

function showHelp() {
  console.log('\x1b[36mQAFlow Report - CLI Tool\x1b[0m');
  console.log('\nUsage:');
  console.log('  npx @qaflow/report <command>');
  console.log('\nCommands:');
  console.log('  init                 Initialize by creating a reporter.config.[js|ts] file');
  console.log('  init --key=<apiKey>  Initialize with a specific API key');
  console.log('  help                 Show this help information');
  rl.close();
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help') {
    showHelp();
    return;
  }
  
  switch (args[0]) {
    case 'init':
      let apiKey = 'YOUR_API_KEY_HERE';
      const keyArg = args.find(arg => arg.startsWith('--key='));
      
      if (keyArg) {
        apiKey = keyArg.split('=')[1];
        createConfigFile(apiKey);
      } else {
        rl.question('Enter your QAFlow API key (or press Enter to use a placeholder): ', (answer) => {
          if (answer.trim()) {
            apiKey = answer.trim();
          }
          createConfigFile(apiKey);
        });
      }
      break;
    default:
      console.log(`\x1b[31mError: Unknown command '${args[0]}'\x1b[0m`);
      showHelp();
      rl.close();
  }
}

main(); 