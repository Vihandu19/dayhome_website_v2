/**
 * Contact Form Interactive Logic
 * Extracted from contact.template.html for maintainability
 */

// Initialize bundled MSW mock worker on localhost only (zero production impact)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  const script = document.createElement('script');
  script.src = '/assets/msw-worker.js';
  script.onload = () => console.log('[MSW] Bundled worker loaded');
  script.onerror = () => console.warn('[MSW] Failed to load bundled worker');
  document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('inquiry-form');
  const successState = document.getElementById('success-state');
  const submitBtn = document.getElementById('submit-btn');
  const msgField = document.getElementById('message');
  const charCount = document.getElementById('char-count');
  const ageSelect = document.getElementById('age-range');
  const ageNote = document.getElementById('age-note');
  const radioOptions = document.querySelectorAll('.radio-option');

  // Validation rules and messages
  const validationRules = {
    'parent-name': {
      validate: validateRequired,
      message: 'Full name is required'
    },
    'phone': {
      validate: validatePhone,
      message: 'Please enter a valid phone number.'
    },
    'email': {
      validate: validateEmail,
      message: 'Please enter a valid email address'
    },
    'contact_method': {
      validate: validateRadioGroup,
      message: 'Please select a preferred contact method'
    },
    'age-range': {
      validate: validateAgeRange,
      message: 'We currently serve children 16 months to 6 years old'
    },
    'care-schedule': {
      validate: validateRequired,
      message: 'Please select a care schedule'
    },
    'message': {
      validate: validateMessage,
      message: 'Message must be 1000 characters or fewer'
    }
  };

  // Field selectors for validation
  const fieldSelectors = {
    'parent-name': '#parent-name',
    'phone': '#phone',
    'email': '#email',
    'contact_method': 'input[name="contact_method"]',
    'age-range': '#age-range',
    'care-schedule': '#care-schedule',
    'message': '#message'
  };

  // Track validation state
  const validationState = {};

  // Character counter for message textarea
  if (msgField && charCount) {
    msgField.addEventListener('input', function() {
      const count = this.value.length;
      charCount.querySelector('span').textContent = count;
      // Real-time validation for message length
      validateField('message');
    });
  }

  // Age range validation - disable submit if "over-6-years" or "under-16-months" selected
  if (ageSelect && ageNote && submitBtn) {
    ageSelect.addEventListener('change', function() {
      const ineligibleAge = this.value === 'over-6-years' || this.value === 'under-16-months';
      if (ineligibleAge) {
        ageNote.classList.add('visible');
        submitBtn.disabled = true;
      } else {
        ageNote.classList.remove('visible');
        submitBtn.disabled = false;
      }
      validateField('age-range');
    });
  }

  // Radio group visual selection state
  radioOptions.forEach(function(opt) {
    const radio = opt.querySelector('input[type="radio"]');
    if (radio) {
      radio.addEventListener('change', function() {
        radioOptions.forEach(function(o) { o.classList.remove('selected'); });
        if (this.checked) {
          this.closest('.radio-option').classList.add('selected');
        }
        validateField('contact_method');
      });
    }
  });

  // Blur validation for all fields
  Object.keys(fieldSelectors).forEach(function(fieldName) {
    const selector = fieldSelectors[fieldName];
    const elements = document.querySelectorAll(selector);
    elements.forEach(function(el) {
      el.addEventListener('blur', function() {
        validateField(fieldName);
      });
      // Clear error on input (real-time feedback)
      el.addEventListener('input', function() {
        if (validationState[fieldName] === false) {
          clearError(fieldName);
        }
      });
    });
  });

  // Validation functions
  function validateRequired(value) {
    return value !== null && value.trim().length > 0;
  }

  function validateEmail(value) {
    if (!validateRequired(value)) return false;
    // RFC 5322 compliant regex (practical subset)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(value.trim());
  }

  function validateMessage(value) {
    if (!validateRequired(value)) return false;
    return value.length <= 1000;
  }

  function validateAgeRange(value) {
    return validateRequired(value) && value !== 'over-6-years' && value !== 'under-16-months';
  }

  function validateRadioGroup(name) {
    const radios = document.querySelectorAll('input[name="' + name + '"]');
    return Array.from(radios).some(function(radio) { return radio.checked; });
  }

  function validatePhone(value) {
    if (!validateRequired(value)) return false;
    // Strip all non-digit characters
    const digits = value.replace(/\D/g, '');
    // Must be exactly 10 digits (North American format without country code)
    return digits.length === 10;
  }

  function validateField(fieldName) {
    const rule = validationRules[fieldName];
    if (!rule) return true;

    const selector = fieldSelectors[fieldName];
    const elements = document.querySelectorAll(selector);
    let isValid;

    if (fieldName === 'contact_method') {
      // validateRadioGroup queries DOM directly, doesn't need a value
      isValid = validateRadioGroup(fieldName);
    } else {
      const el = elements[0];
      const value = el ? el.value : '';
      isValid = rule.validate(value);
    }

    validationState[fieldName] = isValid;

    if (isValid) {
      clearError(fieldName);
    } else {
      showError(fieldName, rule.message);
    }

    return isValid;
  }

  function validateAllFields() {
    let allValid = true;
    let firstInvalidField = null;

    Object.keys(validationRules).forEach(function(fieldName) {
      if (!validateField(fieldName)) {
        allValid = false;
        if (!firstInvalidField) {
          firstInvalidField = fieldName;
        }
      }
    });

    if (!allValid && firstInvalidField) {
      focusFirstInvalid(firstInvalidField);
    }

    return allValid;
  }

  function showError(fieldName, message) {
    const selector = fieldSelectors[fieldName];
    const elements = document.querySelectorAll(selector);
    const errorId = fieldName + '-error';
    const errorEl = document.getElementById(errorId);

    elements.forEach(function(el) {
      const formGroup = el.closest('.form-group');
      if (formGroup) {
        formGroup.classList.add('form-group--error');
      }
      el.setAttribute('aria-invalid', 'true');
    });

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
  }

  function clearError(fieldName) {
    const selector = fieldSelectors[fieldName];
    const elements = document.querySelectorAll(selector);
    const errorId = fieldName + '-error';
    const errorEl = document.getElementById(errorId);

    elements.forEach(function(el) {
      const formGroup = el.closest('.form-group');
      if (formGroup) {
        formGroup.classList.remove('form-group--error');
      }
      el.setAttribute('aria-invalid', 'false');
    });

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }

    validationState[fieldName] = true;
  }

  function focusFirstInvalid(fieldName) {
    const selector = fieldSelectors[fieldName];
    const el = document.querySelector(selector);
    if (el) {
      el.focus();
    }
  }

  // Form submission handling
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Honeypot check
      const hp = document.getElementById('hp-field');
      if (hp && hp.value) return;

      // Run full validation
      if (!validateAllFields()) {
        return;
      }

      // Valid submission - soft cooldown (UX rate limit)
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      submitBtn.classList.add('btn-submit--submitted');

      try {
        // Serialize form data
        const formData = new FormData(form);

        // Submit to API (will be intercepted by MSW on localhost)
        const response = await fetch('/submit-inquiry', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          // Success - show overlay
          form.style.display = 'none';
          successState.classList.add('visible');
          submitBtn.textContent = 'Submitted';
        } else {
          // Server-side validation failed (shouldn't happen if client validation passes, but handle it)
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit inquiry';
          submitBtn.classList.remove('btn-submit--submitted');

          // Display server errors
          if (result.errors) {
            Object.entries(result.errors).forEach(([field, message]) => {
              const errorEl = document.getElementById(field + '-error');
              const fieldEl = document.querySelector(fieldSelectors[field]);
              if (errorEl && fieldEl) {
                errorEl.textContent = message;
                errorEl.hidden = false;
                fieldEl.closest('.form-group')?.classList.add('form-group--error');
                fieldEl.setAttribute('aria-invalid', 'true');
              }
            });
            // Focus first error
            const firstErrorField = Object.keys(result.errors)[0];
            focusFirstInvalid(firstErrorField);
          }
        }
      } catch (error) {
        // Network error or other failure
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit inquiry';
        submitBtn.classList.remove('btn-submit--submitted');
        console.error('Submission error:', error);
        alert('An error occurred. Please try again.');
      }
    });
  }
});