/**
 * MSW Mock Handlers for Contact Form
 * Validates submissions using the same rules as the production AWS Lambda
 * Reference: docs/PROJECT.md - Backend (Serverless Form Processing) section
 */

import { http, HttpResponse } from 'msw';

/**
 * Validate form submission against Lambda rules
 * @param {Object} data - FormData entries as object
 * @returns {{silentDiscard: boolean, errors: Object, isValid: boolean}}
 */
export function validateSubmission(data) {
  const errors = {};

  // Honeypot check (silent discard - matches Lambda behavior)
  if (data.website && String(data.website).trim().length > 0) {
    return { silentDiscard: true, errors: {}, isValid: false };
  }

  // Required fields (all except start_date)
  const required = ['parent_name', 'email', 'phone', 'contact_method', 'age_range', 'care_schedule', 'message'];
  for (const field of required) {
    if (!data[field] || String(data[field]).trim().length === 0) {
      errors[field] = `${field.replace('_', ' ')} is required`;
    }
  }

  // Email format (RFC 5322 practical subset - matches client-side)
  if (data.email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(String(data.email).trim())) {
      errors.email = 'Please enter a valid email address';
    }
  }

  // Phone: exactly 10 digits (North American format)
  if (data.phone) {
    const digits = String(data.phone).replace(/\D/g, '');
    if (digits.length !== 10) {
      errors.phone = 'Please enter a valid phone number.';
    }
  }

  // Age range: must not be "over-6-years" or "under-16-months" (matches Lambda server-side check)
  const ineligibleAges = ['over-6-years', 'under-16-months'];
  if (ineligibleAges.includes(data.age_range)) {
    errors.age_range = 'We currently serve children 16 months to 6 years old';
  }

  // Contact method: must be one of the valid radio values
  if (data.contact_method && !['Email', 'Phone', 'Either'].includes(data.contact_method)) {
    errors.contact_method = 'Please select a preferred contact method';
  }

  // Care schedule: must be one of valid select values
  if (data.care_schedule && !['full-time', 'part-time', 'flexible'].includes(data.care_schedule)) {
    errors.care_schedule = 'Please select a care schedule';
  }

  // Message length: max 1000 characters (matches client-side maxlength)
  if (data.message && String(data.message).length > 1000) {
    errors.message = 'Message must be 1000 characters or fewer';
  }

  // SES Sandbox: In production, Lambda only sends to verified email addresses.
  // The form doesn't have a recipient field - it always sends to the owner's verified email.
  // This is documented here for parity with Lambda behavior.

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    silentDiscard: false,
  };
}

export const handlers = [
  http.post('/submit-inquiry', async ({ request }) => {
    const formData = await request.formData();
    // Convert FormData to plain object (handles multiple values for same key)
    const data = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    const result = validateSubmission(data);

    // Honeypot: silent discard (200 OK but no email sent - matches Lambda)
    if (result.silentDiscard) {
      console.log('[MSW] Honeypot triggered - silent discard');
      return HttpResponse.json({ success: true }, { status: 200 });
    }

    // Validation failed - return 400 with field errors
    if (!result.isValid) {
      return HttpResponse.json(
        { success: false, errors: result.errors },
        { status: 400 }
      );
    }

    // Success - simulate SES Sandbox email delivery
    // Log high-signal fields first (matching Lambda email structure from PROJECT.md)
    console.log('[MSW] Valid submission received:', {
      ageRange: data.age_range,
      careSchedule: data.care_schedule,
      desiredStartDate: data.start_date || 'Not specified',
      contactMethod: data.contact_method,
      parentName: data.parent_name,
      parentEmail: data.email,
      parentPhone: data.phone,
      messageLength: data.message?.length || 0,
    });

    return HttpResponse.json(
      { success: true, message: 'Inquiry received. We will be in touch.' },
      { status: 200 }
    );
  }),
];