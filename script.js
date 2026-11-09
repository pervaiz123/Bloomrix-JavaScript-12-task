/* ------------------------------------------------------------------
 * Utility helpers
 * ------------------------------------------------------------------ */
function $(selector) {
  return document.querySelector(selector);
}
function $$(selector) {
  return Array.from(document.querySelectorAll(selector));
}

/* ------------------------------------------------------------------
 * Validation rules & helpers
 * ------------------------------------------------------------------ */
const VALIDATION = {
  emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

/**
 * Show a custom error message for a form field.
 * @param {HTMLElement} field - The input/textarea element.
 * @param {string} message - The message to display.
 */
function showError(field, message) {
  const errorSpan = $(`span[data-error-for="${field.id}"]`);
  if (errorSpan) errorSpan.textContent = message;
}

/**
 * Clear the error message for a field.
 * @param {HTMLElement} field
 */
function clearError(field) {
  const errorSpan = $(`span[data-error-for="${field.id}"]`);
  if (errorSpan) errorSpan.textContent = '';
}

/**
 * Validate a single field (excluding password minlength).
 * Returns true if the field passes validation.
 * @param {HTMLElement} field
 */
function validateField(field) {
  clearError(field);
  if (field.required && !field.value.trim()) {
    showError(field, 'This field is required.');
    return false;
  }
  if (field.type === 'email' && field.value) {
    if (!VALIDATION.emailPattern.test(field.value)) {
      showError(field, 'Enter a valid email address.');
      return false;
    }
  }
  if (field.id === 'confirmPassword') {
    const pwd = $('#password').value;
    if (field.value !== pwd) {
      showError(field, 'Passwords do not match.');
      return false;
    }
  }
  return true;
}

/**
 * Full form validation.
 * @param {boolean} [showAll=false] - When true, all errors are displayed regardless of touch state.
 * @returns {boolean} - true if the whole form is valid.
 */
function validateForm(showAll = false) {
  let overallValid = true;

  // Validate each regular input (skip the skill‑input itself)
  inputs.forEach(inp => {
    if (inp.id === 'skillInput') return;

    const fieldValid = validateField(inp);
    if (!fieldValid) overallValid = false;

    const shouldShow = showAll || inp.dataset.touched === 'true';
    if (!shouldShow && fieldValid) return; // hide error if not needed
    // error is already shown by validateField when shouldShow === true
  });

  // Password minlength (custom because form has novalidate)
  const pwdField = $('#password');
  if (pwdField.value.length > 0 && pwdField.value.length < 8) {
    if (showAll || pwdField.dataset.touched === 'true')
      showError(pwdField, 'Password must be at least 8 characters.');
    overallValid = false;
  }

  // Skills validation
  const skillItems = $('#skillList').children.length;
  const skillError = $(`span[data-error-for="skills"]`);
  const skillShouldShow = showAll || skillError.dataset.touched === 'true';
  if (skillItems === 0) {
    if (skillShouldShow) skillError.textContent = 'Add at least one skill.';
    overallValid = false;
  } else {
    if (skillShouldShow) skillError.textContent = '';
  }

  submitBtn.disabled = !overallValid;
  return overallValid;
}

/* ------------------------------------------------------------------
 * Event listeners – per‑field live validation
 * ------------------------------------------------------------------ */
inputs.forEach(inp => {
  if (inp.id === 'skillInput') return; // not validated directly
  inp.addEventListener('input', () => {
    inp.dataset.touched = 'true';
    validateForm();
  });
  inp.addEventListener('blur', () => {
    inp.dataset.touched = 'true';
    validateForm();
  });
});

/* ------------------------------------------------------------------
 * Textarea character counter
 * ------------------------------------------------------------------ */
const bio = $('#bio');
const counter = $('#bioCounter');
bio.addEventListener('input', () => {
  counter.textContent = `${bio.value.length} / 200`;
});

/* ------------------------------------------------------------------
 * Password strength indicator (short passwords never become “Strong”)
 * ------------------------------------------------------------------ */
const pwd = $('#password');
const strengthDiv = $('#pwdStrength');
pwd.addEventListener('input', () => {
  const val = pwd.value;
  let criteria = 0;
  if (/[a-z]/.test(val)) criteria++;
  if (/[A-Z]/.test(val)) criteria++;
  if (/[0-9]/.test(val)) criteria++;
  if (/[^A-Za-z0-9]/.test(val)) criteria++;
  const lengthOk = val.length >= 8;
  const strength = lengthOk ? criteria + 1 : 1; // at least Very Weak
  const levels = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
  strengthDiv.textContent = levels[Math.min(strength, levels.length) - 1] || '';
});

/* ------------------------------------------------------------------
 * Skills list – add / remove with delegation; case‑insensitive duplicate check
 * ------------------------------------------------------------------ */
const skillInput = $('#skillInput');
const skillList = $('#skillList');

skillInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const raw = skillInput.value.trim();
    if (!raw) return;
    const normalized = raw.toLowerCase();
    const exists = Array.from(skillList.children).some(
      li => li.textContent.toLowerCase() === normalized
    );
    if (!exists) {
      const li = document.createElement('li');
      li.textContent = raw;
      li.dataset.skill = raw;
      skillList.appendChild(li);
      skillInput.value = '';
      $(`span[data-error-for="skills"]`).dataset.touched = 'true';
      validateForm();
    }
  }
});

skillList.addEventListener('click', e => {
  if (e.target.tagName === 'LI') {
    e.target.remove();
    validateForm();
  }
});

/* ------------------------------------------------------------------
 * Modal handling – success and confirmation dialogs
 * ------------------------------------------------------------------ */
let successTimeoutId = null;
function openModal(id) {
  $(`#${id}`).classList.remove('hidden');
}
function closeModal(id) {
  $(`#${id}`).classList.add('hidden');
}

form.addEventListener('submit', e => {
  e.preventDefault();
  // Force all validation errors to appear
  const allValid = validateForm(true);
  if (!allValid) return;
  openModal('confirmModal');
});

$('#confirmYes').addEventListener('click', () => {
  // Real‑world: submit data to a server; here we just log it.
  const formData = new FormData(form);
  console.log('Form submitted:', Object.fromEntries(formData));

  // Reset the form (clears generated state)
  $('#resetBtn').click();

  closeModal('confirmModal');
  openModal('successMessage');

  // Auto‑close after 3 s; keep the id for possible cancellation.
  successTimeoutId = setTimeout(() => {
    closeModal('successMessage');
    successTimeoutId = null;
  }, 3000);
});
$('#confirmNo').addEventListener('click', () => closeModal('confirmModal'));

// Close button inside the success modal (data‑close now matches the id)
$$('.close-modal').forEach(btn => {
  const target = btn.dataset.close;
  btn.addEventListener('click', () => closeModal(target));
});

/* ------------------------------------------------------------------
 * Reset button – restores the form to its original pristine state
 * ------------------------------------------------------------------ */
$('#resetBtn').addEventListener('click', () => {
  setTimeout(() => {
    // Clear dynamic UI parts
    $('#skillList').innerHTML = '';
    $('#pwdStrength').textContent = '';
    $('#bioCounter').textContent = '0 / 200';
    $$('.error').forEach(span => (span.textContent = ''));

    // Reset touched markers
    inputs.forEach(inp => delete inp.dataset.touched);
    $(`span[data-error-for="skills"]`).removeAttribute('data-touched');
    submitBtn.disabled = true;

    // Close any open dialogs
    closeModal('successMessage');
    closeModal('confirmModal');

    // Reset tabs to the first one
    $$('.tab').forEach((t, i) => t.classList.toggle('active', i === 0));
    $$('.tab-content').forEach((c, i) => c.classList.toggle('hidden', i !== 0));

    // Cancel pending timers
    if (successTimeoutId) {
      clearTimeout(successTimeoutId);
      successTimeoutId = null;
    }
  }, 0);
});

$$('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    $$('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    $$('.tab-content').forEach(c => c.classList.toggle('hidden', c.id !== target));
  });
});