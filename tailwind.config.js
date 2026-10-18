/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './projects.html',
    './achievements.html',
    './assets/js/*.js',
  ],
  // Classes toggled at runtime by JS (classList.add/remove) that may not appear
  // as literal strings in the scanned files. Keeps JS-driven visibility working.
  safelist: [
    'hidden',
    'flex',
    'block',
    'inline-block',
    'opacity-0',
    'opacity-100',
    'translate-y-0',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
