/* ---- Utility Functions ---- */
function $(selector) {
  return document.querySelector(selector);
}
function $$(selector) {
  return Array.from(document.querySelectorAll(selector));
}

/* ---- Form Validation ---- */
const form = $('#registrationForm');
const submitBtn = $('#submitBtn');
const inputs = $$('#registrationForm input, #registrationForm textarea');

function showError(field, message) {
  const errorSpan = $(`span[data-error-for="${field.id}"]`);
  if (errorSpan) errorSpan.textContent = message;
}
function clearError(field) {
  const errorSpan = $(`span[data-error-for="${field.id}"]`);
  if (errorSpan) errorSpan.textContent = '';
}
function validateField(field) {
  clearError(field);
  if (field.required && !field.value.trim()) {
    showError(field, 'This field is required.');
    return false;
  }
  if (field.type === 'email') {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(field.value)) {
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
 * validateForm
 * @param {boolean} showAll – true when we want to display *all* errors (e.g. on submit)
 */
function validateForm(showAll = false) {
  let valid = true;

  // Validate regular inputs (skip skill input)
  inputs.forEach(inp => {
    if (inp.id === 'skillInput') return;
    const shouldShow = showAll || inp.dataset.touched === 'true';
    if (shouldShow && !validateField(inp)) valid = false;
  });

  // Password minlength check (custom because of novalidate)
  const pwdField = $('#password');
  if ((showAll || pwdField.dataset.touched === 'true') &&
      pwdField.value.length > 0 && pwdField.value.length < 8) {
    showError(pwdField, 'Password must be at least 8 characters.');
    valid = false;
  }

  // Skills validation
  const skillItems = $('#skillList').children.length;
  const skillError = $(`span[data-error-for="skills"]`);
  const skillShouldShow = showAll || skillError.dataset.touched === 'true';
  if (skillShouldShow) {
    if (skillItems === 0) {
      skillError.textContent = 'Add at least one skill.';
      valid = false;
    } else {
      skillError.textContent = '';
    }
  }

  submitBtn.disabled = !valid;
  return valid;
}

/* Live validation – per‑field */
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

/* ---- Textarea Counter ---- */
const bio = $('#bio');
const counter = $('#bioCounter');
bio.addEventListener('input', () => {
  counter.textContent = `${bio.value.length} / 200`;
});

/* ---- Password Strength ---- */
const pwd = $('#password');
const strengthDiv = $('#pwdStrength');
pwd.addEventListener('input', () => {
  const val = pwd.value;
  let strength = 0;
  if (/[a-z]/.test(val)) strength++;
  if (/[A-Z]/.test(val)) strength++;
  if (/[0-9]/.test(val)) strength++;
  if (/[^A-Za-z0-9]/.test(val)) strength++;
  if (val.length >= 8) strength++;
  const levels = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
  strengthDiv.textContent = levels[strength - 1] || '';
});

/* ---- Skills List (Delegation) ---- */
const skillInput = $('#skillInput');
const skillList = $('#skillList');

skillInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const skill = skillInput.value.trim();
    if (skill) {
      // Prevent duplicate entries
      const exists = Array.from(skillList.children).some(li => li.textContent === skill);
      if (!exists) {
        const li = document.createElement('li');
        li.textContent = skill;
        li.dataset.skill = skill;
        skillList.appendChild(li);
        skillInput.value = '';
        // Mark skills as touched so error disappears after a valid entry
        $(`span[data-error-for="skills"]`).dataset.touched = 'true';
        validateForm();
      }
    }
  }
});

/* Remove skill on click (event delegation) */
skillList.addEventListener('click', e => {
  if (e.target.tagName === 'LI') {
    e.target.remove();
    validateForm();
  }
});

/* ---- Modal Handling ---- */
let successTimeoutId = null;
function openModal(id) {
  $(`#${id}`).classList.remove('hidden');
}
function closeModal(id) {
  $(`#${id}`).classList.add('hidden');
}

/* Confirmation before actual submit */
form.addEventListener('submit', e => {
  e.preventDefault();
  // Force all validations to become visible
  const allValid = validateForm(true);
  if (!allValid) return;
  openModal('confirmModal');
});

$('#confirmYes').addEventListener('click', () => {
  closeModal('confirmModal');
  openModal('successMessage');
  successTimeoutId = setTimeout(() => {
    closeModal('successMessage');
    successTimeoutId = null;
  }, 3000);
});
$('#confirmNo').addEventListener('click', () => closeModal('confirmModal'));

/* Close modal via button */
$$('.close-modal').forEach(btn => {
  const target = btn.dataset.close;
  btn.addEventListener('click', () => closeModal(target));
});

/* ---- Reset Action ---- */
$('#resetBtn').addEventListener('click', () => {
  setTimeout(() => {
    // Clear dynamic UI
    $('#skillList').innerHTML = '';
    $('#pwdStrength').textContent = '';
    $('#bioCounter').textContent = '0 / 200';
    $$('.error').forEach(span => span.textContent = '');

    // Reset touched flags
    inputs.forEach(inp => delete inp.dataset.touched);
    $(`span[data-error-for="skills"]`).removeAttribute('data-touched');

    submitBtn.disabled = true;

    // Close any open modals
    closeModal('successMessage');
    closeModal('confirmModal');

    // Reset tabs to the first one
    $$('.tab').forEach((t, i) => t.classList.toggle('active', i === 0));
    $$('.tab-content').forEach((c, i) => c.classList.toggle('hidden', i !== 0));

    // Clear pending timeouts
    if (successTimeoutId) {
      clearTimeout(successTimeoutId);
      successTimeoutId = null;
    }
  }, 0);
});

/* ---- Tabs ---- */
$$('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    $$('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    $$('.tab-content').forEach(c => c.classList.toggle('hidden', c.id !== target));
  });
});

/* ---- DOMContentLoaded ---- */
document.addEventListener('DOMContentLoaded', () => {
  // No initial validation – start with a clean form.
});