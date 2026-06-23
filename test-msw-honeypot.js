/**
 * MSW Honeypot Test
 * Tests bot detection via honeypot field
 * Run: node test-msw-honeypot.js
 */

import { validateSubmission } from './mocks/handlers.js';

console.log('=== MSW Honeypot Test ===\n');

const honeypotSubmission = {
  parent_name: 'Bot User',
  email: 'bot@example.com',
  phone: '4035551234',
  contact_method: 'Email',
  age_range: '2-years-3-years',
  care_schedule: 'full-time',
  start_date: '2026-09-01',
  message: 'Automated spam message filling all fields including honeypot',
  website: 'http://spam-site.com', // honeypot - filled by bot
};

console.log('Testing honeypot submission (bot fills hidden field):');
console.log(JSON.stringify(honeypotSubmission, null, 2));
console.log('');

const result = validateSubmission(honeypotSubmission);

console.log('Result:');
console.log(`  isValid: ${result.isValid}`);
console.log(`  silentDiscard: ${result.silentDiscard}`);
console.log(`  errors: ${JSON.stringify(result.errors, null, 2)}`);
console.log('');

if (!result.isValid && result.silentDiscard && Object.keys(result.errors).length === 0) {
  console.log('✅ TEST PASSED: Honeypot triggered - silent discard (200 OK, no errors)');
  process.exit(0);
} else {
  console.log('❌ TEST FAILED: Honeypot not handled correctly');
  console.log('Expected: isValid=false, silentDiscard=true, errors={}');
  process.exit(1);
}