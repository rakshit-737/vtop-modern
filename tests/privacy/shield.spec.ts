import { describe, expect, it, vi } from 'vitest';

import { shieldAcademicValues, updatePrivacyShield } from '../../src/features/privacy/shield';

describe('privacy shield', () => {
  it('targets labeled metrics and sensitive table columns', () => {
    document.body.innerHTML = `<div><span>CGPA: 9.42</span><span>ordinary 42</span></div>
      <table><thead><tr><th>Course</th><th>CAT Marks</th><th>Grade</th><th>Attendance</th></tr></thead>
      <tbody><tr><td>MAT101</td><td>42</td><td>A</td><td>88%</td></tr></tbody></table>`;
    shieldAcademicValues(document, true);
    expect(document.querySelector('span')?.classList.contains('vtop-privacy-shielded')).toBe(true);
    expect(document.querySelectorAll('.vtop-privacy-shielded')).toHaveLength(3);
    expect(document.querySelector('td')?.classList.contains('vtop-privacy-shielded')).toBe(false);
  });

  it('supports click, Enter, Space, and idempotent rebinding', () => {
    document.body.innerHTML = '<span id="gpa">GPA: 8.8</span>';
    shieldAcademicValues(document, true);
    const value = document.querySelector('#gpa') as HTMLElement;
    value.click();
    expect(value.classList.contains('revealed')).toBe(true);
    value.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(value.classList.contains('revealed')).toBe(false);
    value.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(value.classList.contains('revealed')).toBe(true);
    shieldAcademicValues(document, true);
    value.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(value.classList.contains('revealed')).toBe(false);
  });

  it('re-blurs a value that was revealed before the setting was re-enabled', () => {
    document.body.innerHTML = '<span id="cgpa">CGPA: 9.42</span>';
    shieldAcademicValues(document, true);
    const value = document.querySelector('#cgpa') as HTMLElement;
    value.click();
    expect(value.classList.contains('revealed')).toBe(true);
    updatePrivacyShield(document, false);
    updatePrivacyShield(document, true);
    expect(value.classList.contains('vtop-privacy-shielded')).toBe(true);
    expect(value.classList.contains('revealed')).toBe(false);
  });

  it('does not add interaction or block clicks while disabled', () => {
    document.body.innerHTML = '<a href="#next"><span id="gpa">GPA: 8.8</span></a>';
    const link = document.querySelector('a') as HTMLAnchorElement;
    const navigate = vi.fn();
    link.addEventListener('click', navigate);
    shieldAcademicValues(document, false);
    const value = document.querySelector('#gpa') as HTMLElement;
    expect(value.dataset.vtopModernPrivacyBound).toBeUndefined();
    expect(value.getAttribute('role')).toBeNull();
    value.click();
    expect(navigate).toHaveBeenCalledOnce();

    shieldAcademicValues(document, true);
    updatePrivacyShield(document, false);
    expect(value.getAttribute('role')).toBeNull();
    value.click();
    expect(value.classList.contains('vtop-privacy-shielded')).toBe(false);
  });
});
