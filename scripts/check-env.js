#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const projectRoot = join(dirname(__filename), '..');

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const optionalEnvVars = [
  'VITE_FIREBASE_MEASUREMENT_ID',
];

function checkEnvFile() {
  const envPath = join(projectRoot, '.env');
  
  // Check if .env file exists
  if (!existsSync(envPath)) {
    console.error(' .env file not found!');
    return false;
  }

  const envContent = readFileSync(envPath, 'utf8');
  const envVars = {};

  // Parse .env file
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });

  let hasErrors = false;

  // Check required variables
  console.log('\nChecking required environment variables:');
  requiredEnvVars.forEach(varName => {
    if (!envVars[varName]) {
      console.error(` Missing required variable: ${varName}`);
      hasErrors = true;
    } else if (envVars[varName].length === 0) {
      console.error(` Empty required variable: ${varName}`);
      hasErrors = true;
    } else {
      console.log(` ${varName} is set`);
    }
  });

  // Check optional variables
  console.log('\nChecking optional environment variables:');
  optionalEnvVars.forEach(varName => {
    if (!envVars[varName]) {
      console.warn(`  Optional variable not set: ${varName}`);
    } else if (envVars[varName].length === 0) {
      console.warn(`  Optional variable is empty: ${varName}`);
    } else {
      console.log(` ${varName} is set`);
    }
  });

  return !hasErrors;
}

const isValid = checkEnvFile();
if (!isValid) {
  console.error('\n Environment configuration is incomplete. Please check your .env file.');
  process.exit(1);
} else {
  console.log('\n Environment configuration is valid!');
}
