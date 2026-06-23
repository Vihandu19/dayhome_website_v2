/**
 * MSW Client-Side Validation Test
 * Tests all validation rules that mirror client-side validation
 * Run: node test-msw-client-validation.js
 */

import { validateSubmission } from './mocks/handlers.js';

console.log('=== MSW Client-Side Validation Test ===\n');

let passed = 0;
let failed = 0;

function test(name, data, expectValid, expectedErrors = []) {
  console.log(`Test: ${name}`);
  const result = validateSubmission(data);
  const hasExpectedErrors = expectedErrors.every(e => result.errors[e]);
  const noUnexpectedErrors = expectedErrors.length === 0 || Object.keys(result.errors).every(e => expectedErrors.includes(e));

  const success = result.isValid === expectValid && hasExpectedErrors && noUnexpectedErrors;

  if (success) {
    console.log(`  ✅ PASS`);
    passed++;
  } else {
    console.log(`  ❌ FAIL`);
    console.log(`    Expected: isValid=${expectValid}, errors=${JSON.stringify(expectedErrors)}`);
    console.log(`    Got:      isValid=${result.isValid}, errors=${JSON.stringify(Object.keys(result.errors))}`);
    failed++;
  }
  console.log('');
}

// Valid baseline
const validBase = {
  parent_name: 'Jane Smith',
  email: 'jane.smith@example.com',
  phone: '4035559876',
  contact_method: 'Phone',
  age_range: '3-years-4-years',
  care_schedule: 'part-time',
  message: 'Looking for part-time care for my 3.5 year old.',
  website: '',
};

// 1. Valid submission
test('Valid submission', validBase, true);

// 2. Missing required fields
test('Missing parent_name', { ...validBase, parent_name: '' }, false, ['parent_name']);
test('Missing email', { ...validBase, email: '' }, false, ['email']);
test('Missing phone', { ...validBase, phone: '' }, false, ['phone']);
test('Missing contact_method', { ...validBase, contact_method: '' }, false, ['contact_method']);
test('Missing age_range', { ...validBase, age_range: '' }, false, ['age_range']);
test('Missing care_schedule', { ...validBase, care_schedule: '' }, false, ['care_schedule']);
test('Missing message', { ...validBase, message: '' }, false, ['message']);

// 3. Invalid email formats
test('Invalid email - no @', { ...validBase, email: 'invalid-email' }, false, ['email']);
test('Invalid email - no domain', { ...validBase, email: 'test@' }, false, ['email']);
test('Invalid email - no TLD', { ...validBase, email: 'test@domain' }, false, ['email']);
test('Valid email formats', { ...validBase, email: 'user+tag@sub.domain.com' }, true);

// 4. Phone validation (exactly 10 digits)
test('Phone - too few digits', { ...validBase, phone: '403555' }, false, ['phone']);
test('Phone - too many digits', { ...validBase, phone: '14035551234' }, false, ['phone']);
test('Phone - with formatting', { ...validBase, phone: '(403) 555-1234' }, true);
test('Phone - with dashes', { ...validBase, phone: '403-555-1234' }, true);
test('Phone - with spaces', { ...validBase, phone: '403 555 1234' }, true);

// 5. Age range validation (server-side blocks these)
test('Age range - under 16 months', { ...validBase, age_range: 'under-16-months' }, false, ['age_range']);
test('Age range - over 6 years', { ...validBase, age_range: 'over-6-years' }, false, ['age_range']);
test('Age range - valid: 16-months-2-years', { ...validBase, age_range: '16-months-2-years' }, true);
test('Age range - valid: 2-years-3-years', { ...validBase, age_range: '2-years-3-years' }, true);
test('Age range - valid: 3-years-4-years', { ...validBase, age_range: '3-years-4-years' }, true);
test('Age range - valid: 4-years-5-years', { ...validBase, age_range: '4-years-5-years' }, true);
test('Age range - valid: 5-years-6-years', { ...validBase, age_range: '5-years-6-years' }, true);

// 6. Contact method validation
test('Contact method - invalid', { ...validBase, contact_method: 'SMS' }, false, ['contact_method']);
test('Contact method - Email', { ...validBase, contact_method: 'Email' }, true);
test('Contact method - Phone', { ...validBase, contact_method: 'Phone' }, true);
test('Contact method - Either', { ...validBase, contact_method: 'Either' }, true);

// 7. Care schedule validation
test('Care schedule - invalid', { ...validBase, care_schedule: 'drop-in' }, false, ['care_schedule']);
test('Care schedule - full-time', { ...validBase, care_schedule: 'full-time' }, true);
test('Care schedule - part-time', { ...validBase, care_schedule: 'part-time' }, true);
test('Care schedule - flexible', { ...validBase, care_schedule: 'flexible' }, true);

// 8. Message length (max 1000)
test('Message - exactly 1000 chars', { ...validBase, message: 'a'.repeat(1000) }, true);
test('Message - 1001 chars', { ...validBase, message: 'a'.repeat(1001) }, false, ['message']);

// 9. Optional field: start_date (not required)
test('Optional start_date - present', { ...validBase, start_date: '2026-09-01' }, true);
test('Optional start_date - empty', { ...validBase, start_date: '' }, true);
test('Optional start_date - omitted', { ...validBase }, true); // remove key

console.log('=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);

if (failed === 0) {
  console.log('\n✅ ALL TESTS PASSED');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED');
  process.exit(1);
}