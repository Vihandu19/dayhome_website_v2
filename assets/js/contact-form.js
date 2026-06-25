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
  const radioOptions = document.querySelectorAll('.radio-option');

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
      message: 'I currently serve children 16 months to 6 years old.'
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

  const fieldSelectors = {
    'parent-name': '#parent-name',
    'phone': '#phone',
    'email': '#email',
    'contact_method': 'input[name="contact_method"]',
    'age-range': '#age-range',
    'care-schedule': '#care-schedule',
    'message': '#message'
  };

  const validationState = {};

  if (msgField && charCount) {
    msgField.addEventListener('input', function() {
      const count = this.value.length;
      charCount.querySelector('span').textContent = count;
      validateField('message');
    });
  }

  if (ageSelect && submitBtn) {
    ageSelect.addEventListener('change', function() {
      validateField('age-range');
    });
  }

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

  Object.keys(fieldSelectors).forEach(function(fieldName) {
    const selector = fieldSelectors[fieldName];
    const elements = document.querySelectorAll(selector);
    elements.forEach(function(el) {
      el.addEventListener('blur', function() {
        validateField(fieldName);
      });
      el.addEventListener('input', function() {
        if (validationState[fieldName] === false) {
          clearError(fieldName);
        }
      });
    });
  });

  function validateRequired(value) {
    return value !== null && value.trim().length > 0;
  }

  function validateEmail(value) {
    if (!validateRequired(value)) return false;
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
    const digits = value.replace(/\D/g, '');
    return digits.length === 10;
  }

  function validateField(fieldName) {
    const rule = validationRules[fieldName];
    if (!rule) return true;

    const selector = fieldSelectors[fieldName];
    const elements = document.querySelectorAll(selector);

    let isValid;

    if (fieldName === 'contact_method') {
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
      if (formGroup) formGroup.classList.add('form-group--error');
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
      if (formGroup) formGroup.classList.remove('form-group--error');
      el.setAttribute('aria-invalid', 'false');
    });

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }

    validationState[fieldName] = true;
  }

  function focusFirstInvalid(fieldName) {
    const el = document.querySelector(fieldSelectors[fieldName]);
    if (el) el.focus();
  }

  // =========================
  // FORM SUBMISSION (FIXED)
  // =========================
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      const hp = document.getElementById('hp-field');
      if (hp && hp.value) return;

      if (!validateAllFields()) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      submitBtn.classList.add('btn-submit--submitted');

      try {

        // Build payload safely (no undefined values breaking JSON)
        const payload = {
          parentName: String(document.getElementById('parent-name')?.value || ''),
          email: String(document.getElementById('email')?.value || ''),
          phone: String(document.getElementById('phone')?.value || ''),
          contactMethod: String(document.querySelector('input[name="contact_method"]:checked')?.value || ''),
          childAge: String(document.getElementById('age-range')?.value || ''),
          startDate: String(document.getElementById('start-date')?.value || ''),
          schedule: String(document.getElementById('care-schedule')?.value || ''),
          message: String(document.getElementById('message')?.value || ''),
          website: String(document.getElementById('website')?.value || '')
        };

        // FINAL FIX: guaranteed valid JSON
        const response = await fetch('https://8vuebj7rte.execute-api.us-east-1.amazonaws.com/submit-inquiry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.ok) {
          form.style.display = 'none';
          successState.classList.add('visible');
          submitBtn.textContent = 'Submitted';
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit inquiry';
          submitBtn.classList.remove('btn-submit--submitted');

          alert(result.error || 'Server rejected submission.');
        }

      } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit inquiry';
        submitBtn.classList.remove('btn-submit--submitted');

        console.error('Submission error:', error);
        alert('An error occurred while submitting. Please try again.');
      }
    });
  }
});