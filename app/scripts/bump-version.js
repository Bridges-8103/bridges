#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageLockJsonPath = path.resolve(__dirname, '../package-lock.json');
const appJsonPath = path.resolve(__dirname, '../app.json');

// 1. Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version || '1.0.0';

// Bump patch version (x.y.z -> x.y.(z+1))
const parts = currentVersion.split('.').map(Number);
if (parts.length !== 3 || parts.some(isNaN)) {
  console.error(`Invalid semver version: ${currentVersion}`);
  process.exit(1);
}
parts[2] += 1;
const newVersion = parts.join('.');

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

// 2. Update package-lock.json if it exists
if (fs.existsSync(packageLockJsonPath)) {
  const packageLock = JSON.parse(fs.readFileSync(packageLockJsonPath, 'utf8'));
  packageLock.version = newVersion;
  if (packageLock.packages && packageLock.packages['']) {
    packageLock.packages[''].version = newVersion;
  }
  fs.writeFileSync(packageLockJsonPath, JSON.stringify(packageLock, null, 2) + '\n', 'utf8');
}

// 3. Update app.json
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
if (!appJson.expo) appJson.expo = {};
appJson.expo.version = newVersion;

if (!appJson.expo.android) appJson.expo.android = {};
const currentCode = appJson.expo.android.versionCode || 1;
const newCode = currentCode + 1;
appJson.expo.android.versionCode = newCode;

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n', 'utf8');

console.log(`Successfully bumped version: ${currentVersion} -> ${newVersion} (Android versionCode: ${newCode})`);

// Export to GITHUB_OUTPUT if available in CI
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `new_version=${newVersion}\nversion_code=${newCode}\n`);
}
