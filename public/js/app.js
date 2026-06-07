'use strict';

/* ─── Flash auto-dismiss ──────────────────────────────────────────────────── */
document.querySelectorAll('.alert[data-dismiss]').forEach(el => {
  setTimeout(() => {
    el.style.transition = 'opacity .4s ease, transform .4s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-6px)';
    setTimeout(() => el.remove(), 400);
  }, parseInt(el.dataset.dismiss) || 3500);
});

/* ─── Confirm-delete forms ────────────────────────────────────────────────── */
document.querySelectorAll('form[data-confirm]').forEach(form => {
  form.addEventListener('submit', e => {
    if (!confirm(form.dataset.confirm)) e.preventDefault();
  });
});

/* ─── Row click → navigate (skip action cells) ───────────────────────────── */
document.querySelectorAll('tr[data-href]').forEach(row => {
  row.addEventListener('click', e => {
    if (e.target.closest('a, button, form, .actions-cell')) return;
    window.location.href = row.dataset.href;
  });
});

/* ─── Animate department fill bars ───────────────────────────────────────── */
function animateBars() {
  document.querySelectorAll('.dept-fill[data-w]').forEach(bar => {
    bar.style.width = '0%';
    requestAnimationFrame(() =>
      setTimeout(() => { bar.style.width = bar.dataset.w; }, 80)
    );
  });
}
document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', animateBars)
  : animateBars();

/* ─── CGPA chip dynamic colour ───────────────────────────────────────────── */
document.querySelectorAll('.cgpa[data-v]').forEach(el => {
  const v = parseFloat(el.dataset.v);
  if      (v >= 3.5) el.classList.add('cgpa-a');
  else if (v >= 3.0) el.classList.add('cgpa-b');
  else if (v >= 2.5) el.classList.add('cgpa-c');
  else               el.classList.add('cgpa-lo');
});

/* ─── Active sidebar link ─────────────────────────────────────────────────── */
const path = window.location.pathname;
document.querySelectorAll('.sidebar-link').forEach(link => {
  const href = link.getAttribute('href');
  if (href !== '/' && path.startsWith(href)) link.classList.add('active');
  else if (href === '/' && path === '/') link.classList.add('active');
});

/* ─── Searchable select (semester/dept dropdowns) ─────────────────────────── */
// Minimal enhancement: auto-submit filter form on select change
document.querySelectorAll('.filter-row select').forEach(sel => {
  sel.addEventListener('change', () => sel.closest('form')?.submit());
});
