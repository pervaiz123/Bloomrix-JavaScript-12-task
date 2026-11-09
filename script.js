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
function validateForm() {
  let valid = true;
  inputs.forEach(inp => {
    if (!validateField(inp)) valid = false;
  });
  // Skills validation
  const skillItems = $('#skillList').children.length;
  const skillError = $(`span[data-error-for="skills"]`);
  if (skillItems === 0) {
    skillError.textContent = 'Add at least one skill.';
    valid = false;
  } else {
    skillError.textContent = '';
  }
  submitBtn.disabled = !valid;
  return valid;
}

/* Live validation */
inputs.forEach(inp => {
  inp.addEventListener('input', () => validateField(inp));
  inp.addEventListener('blur', () => validateField(inp));
});
form.addEventListener('input', validateForm);

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
  if (/[\W_]/.test(val)) strength++;
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
      const li = document.createElement('li');
      li.textContent = skill;
      li.dataset.skill = skill;
      skillList.appendChild(li);
      skillInput.value = '';
      validateForm();
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
function openModal(id) {
  $(`#${id}`).classList.remove('hidden');
}
function closeModal(id) {
  $(`#${id}`).classList.add('hidden');
}

/* Confirmation before actual submit */
form.addEventListener('submit', e => {
  e.preventDefault();
  if (!validateForm()) return;
  openModal('confirmModal');
});

$('#confirmYes').addEventListener('click', () => {
  closeModal('confirmModal');
  // Simulate server processing
  openModal('successMessage');
  // Auto-close after 3 seconds
  setTimeout(() => closeModal('successMessage'), 3000);
});

$('#confirmNo').addEventListener('click', () => closeModal('confirmModal'));

/* Close modal via button */
$$('.close-modal').forEach(btn => {
  const target = btn.dataset.close;
  btn.addEventListener('click', () => closeModal(`${target}Modal`));
});

/* ---- Reset Action ---- */
$('#resetBtn').addEventListener('click', () => {
  // Clear dynamic parts after the native reset
  setTimeout(() => {
    $('#skillList').innerHTML = '';
    $('#pwdStrength').textContent = '';
    $('#bioCounter').textContent = '0 / 200';
    $$('.error').forEach(span => span.textContent = '');
    submitBtn.disabled = true;
    closeModal('successMessage');
  }, 0);
});

/* ---- Tabs ---- */
$$('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    // Activate tab
    $$('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    // Show content
    $$('.tab-content').forEach(c => {
      c.classList.toggle('hidden', c.id !== target);
    });
  });
});

/* ---- DOMContentLoaded ---- */
document.addEventListener('DOMContentLoaded', () => {
  validateForm(); // Initial button state
});