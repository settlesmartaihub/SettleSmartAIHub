// File name: start.js
// Custom startup script to avoid TypeScript experimental features

// Disable experimental features
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '';
process.env.NODE_NO_WARNINGS = '1';

// Set memory limit
if (!process.env.NODE_OPTIONS.includes('max-old-space-size')) {
    process.env.NODE_OPTIONS += ' --max-old-space-size=480';
}

// Force disable TypeScript experimental features
process.env.NODE_OPTIONS += ' --no-experimental-type-stripping';

console.log('Starting SettleSmart AI Backend...');
console.log('Node Options:', process.env.NODE_OPTIONS);

// Import and run the main application
require('./dist/main.js');