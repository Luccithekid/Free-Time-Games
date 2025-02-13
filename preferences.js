// preferences.js

// An IIFE or module that loads and applies user preferences
const Preferences = (() => {
  // Key in chrome.storage
  const THEME_KEY = 'userTheme'; // 'system', 'light', or 'dark'

  // Initialize on each page
  function init() {
	// 1. Apply the user's theme right away
	applyStoredTheme();

	// 2. Listen for changes in storage (if user changes it elsewhere)
	chrome.storage.onChanged.addListener((changes, area) => {
	  if (area === 'sync' && changes[THEME_KEY]) {
		applyStoredTheme();
	  }
	});
  }

  // Load and apply the stored theme from chrome.storage
  function applyStoredTheme() {
	chrome.storage.sync.get(THEME_KEY, (data) => {
	  const htmlEl = document.documentElement;
	  const userTheme = data[THEME_KEY] || 'system';

	  // Remove forced classes before reapplying
	  htmlEl.classList.remove('light', 'dark');

	  if (userTheme === 'light') {
		htmlEl.classList.add('light');
	  } else if (userTheme === 'dark') {
		htmlEl.classList.add('dark');
	  }
	  // If 'system', do nothing (the @media(prefers-color-scheme) will handle it)
	});
  }

  // Optional: convenience function to read the theme preference (returns a Promise)
  function getTheme() {
	return new Promise((resolve) => {
	  chrome.storage.sync.get(THEME_KEY, (data) => {
		resolve(data[THEME_KEY] || 'system');
	  });
	});
  }

  // Optional: convenience function to set the theme (light/dark/system)
  function setTheme(theme) {
	return new Promise((resolve) => {
	  chrome.storage.sync.set({ [THEME_KEY]: theme }, () => {
		resolve();
	  });
	});
  }

  // Expose public methods
  return {
	init,
	getTheme,
	setTheme,
  };
})();

// Run `Preferences.init()` once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Preferences.init();
});