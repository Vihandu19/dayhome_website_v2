/**
 * MSW Full Validation Test
 * Tests valid form submission against the mock handlers
 * Run: node test-msw-final.js
 */

import { validateSubmission } from './mocks/handlers.js';

console.log('=== MSW Full Validation Test ===\n');

const validSubmission = {
  parent_name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '4035551234',
  contact_method: 'Email',
  age_range: '2-years-3-years',
  care_schedule: 'full-time',
  start_date: '2026-09-01',
  message: 'We are looking for full-time care for our 2.5 year old son. He is very social and enjoys outdoor play. We would love to schedule a tour.',
  website: '', // honeypot - empty
};

console.log('Testing valid submission:');
console.log(JSON.stringify(validSubmission, null, 2));
console.log('');

const result = validateSubmission(validSubmission);

console.log('Result:');
console.log(`  isValid: ${result.isValid}`);
console.log(`  silentDiscard: ${result.silentDiscard}`);
console.log(`  errors: ${JSON.stringify(result.errors, null, 2)}`);
console.log('');

if (result.isValid && !result.silentDiscard) {
  console.log('✅ TEST PASSED: Valid submission accepted');
  process.exit(0);
} else {
  console.log('❌ TEST FAILED: Valid submission was rejected');
  process.exit(1);
}