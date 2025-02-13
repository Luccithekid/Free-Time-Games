// options.js

const contentContainer = document.getElementById('content');
const cache = {}; // Cache for preloaded content
const pages = [
  '/html/options/about.html',
  '/html/options/appearance.html',
  '/html/options/credits.html',
  '/html/options/uc.html',
  '/html/options/sstat.html',
];

// Preload local pages
pages.forEach((page) => {
  fetch(page)
	.then((res) => res.text())
	.then((html) => {
	  cache[page] = html; // store in cache
	});
});

// Remote changelog fetch
const changelogUrl = `${WEB_ENDPOINT}changelog`;
fetch(changelogUrl)
  .then((res) => res.text())
  .then((html) => {
	cache[changelogUrl] = html;
  });

// Function to create the sidebar HTML
function getSidebarHTML(activeUrl) {
  // highlight the 'sel' class if the URL matches
  return `
	<div class="sidebar">
	  <ul class="options-nav-list">
		<li class="options-nav-list-item">
		  <a class="ui-btn ${activeUrl.includes('about') ? 'sel' : ''}" href="about.html">About</a>
		</li>
		<li class="options-nav-list-item">
		  <a class="ui-btn ${activeUrl.includes('appearance') ? 'sel' : ''}" href="appearance.html">Appearance</a>
		</li>
		<li class="options-nav-list-item">
		  <a class="ui-btn ${activeUrl.includes('credits') ? 'sel' : ''}" href="credits.html">Credits</a>
		</li>
		<li class="options-nav-list-item">
		  <a class="ui-btn ${activeUrl.includes('uc') ? 'sel' : ''}" href="uc.html">Release Notes</a>
		</li>
	  </ul>
	</div>
  `;
}

// Wrap the fetched content with .internal-header + sidebar + .options-content
function wrapWithLayout(innerHTML, url) {
  return `
	<div class="internal-header">
	  ${getSidebarHTML(url)}
	  <div class="options-content">
		${innerHTML}
	  </div>
	</div>
  `;
}

// 1. Load Page
function loadPage(url) {
  const fullUrl = url.startsWith('/') ? url : `/html/options/${url}`;

  if (cache[fullUrl]) {
	// If we have it in the cache
	const rawHTML = cache[fullUrl];
	contentContainer.innerHTML = wrapWithLayout(rawHTML, url);
	handlePageSpecificLogic(url);
	executeScripts(contentContainer);
	setupNavigation(); // rebind links
  } else {
	// Fetch and cache
	contentContainer.innerHTML = 'Loading...';
	fetch(fullUrl)
	  .then((res) => res.text())
	  .then((html) => {
		cache[fullUrl] = html;
		contentContainer.innerHTML = wrapWithLayout(html, url);
		handlePageSpecificLogic(url);
		executeScripts(contentContainer);
		setupNavigation();
	  });
  }
}

// 2. Setup Navigation
function setupNavigation() {
  const sidebarLinks = document.querySelectorAll('.ui-btn');
  sidebarLinks.forEach((link) => {
	link.addEventListener('click', (e) => {
	  e.preventDefault();
	  const url = e.target.getAttribute('href');
	  loadPage(url);
	  // Log Event
	  trackPlayerEvent('CLICK', 'OPTIONS_NAV_LINK', url);
	});
  });
}

// 3. Page-specific logic
function handlePageSpecificLogic(url) {
  if (url.includes('uc.html')) {
	injectChangelog();
  } else if (url.includes('credits.html')) {
	renderCredits();
  } else if (url.includes('appearance.html')) {
	initAppearancePane();
  }
}

// 4. Appearance (3-way theme radio)
function initAppearancePane() {
  const radios = document.querySelectorAll('input[name="themeOption"]');
  if (!radios.length) return;

  chrome.storage.sync.get('userTheme', (data) => {
	const savedTheme = data.userTheme || 'system';
	radios.forEach((radio) => {
	  radio.checked = (radio.value === savedTheme);
	});
  });

  radios.forEach((radio) => {
	radio.addEventListener('change', (e) => {
	  chrome.storage.sync.set({ userTheme: e.target.value }, () => {
		// console.log('Theme preference set to:', e.target.value);
		// Log Event
		trackPlayerEvent('CHANGE', 'OPT_APPEARANCE', e.target.value);
	  });
	});
  });
}

// 5. Changelog
function injectChangelog() {
  const changelogDiv = document.querySelector('.changelog');
  if (changelogDiv && cache[changelogUrl]) {
	changelogDiv.innerHTML = formatChangelog(cache[changelogUrl]);
  }
}
function formatChangelog(serverHTML) {
  // Parse the server HTML string
  const parser = new DOMParser();
  const doc = parser.parseFromString(serverHTML, 'text/html');

  // Helper function to process an individual list item
  function processListItem(item) {
	const version = item.querySelector('strong')?.textContent.replace(/^v/, 'Version ') || 'Unknown Version';

	// Break the content into lines for ordered processing
	const contentLines = item.innerHTML
	  .replace(/<strong>.*?<\/strong>/, '') // Remove the <strong> tag for the version
	  .replace(/<br\s*\/?>/g, '\n') // Replace <br> tags with newlines
	  .trim()
	  .split('\n') // Split content into lines
	  .map((line) => line.trim()) // Trim each line
	  .filter((line) => line); // Remove empty lines

	let processedHTML = `<h3>${version}</h3>`;
	let bulletListHTML = '';

	// Process each line in order
	contentLines.forEach((line) => {
	  if (line.startsWith('-')) {
		// If it's a bullet point, add it to the bullet list
		bulletListHTML += `<li>${line.replace(/^- /, '').trim()}</li>`;
	  } else {
		// Otherwise, treat it as regular text
		if (bulletListHTML) {
		  // Close the bullet list before adding new text
		  processedHTML += `<ul>${bulletListHTML}</ul>`;
		  bulletListHTML = '';
		}
		processedHTML += `<p>${line}</p>`;
	  }
	});

	// Append any remaining bullet list
	if (bulletListHTML) {
	  processedHTML += `<ul>${bulletListHTML}</ul>`;
	}

	return processedHTML;
  }

  // Extract top-level list items and process them
  const topLevelItems = doc.querySelectorAll('ul > li');
  let formattedHTML = '';
  topLevelItems.forEach((item) => {
	formattedHTML += processListItem(item);
  });

  return formattedHTML;
}
function renderCredits() {
  // console.log('Credits page loaded');
}

// 6. Run inline scripts if needed
function executeScripts(container) {
  const scripts = container.querySelectorAll('script');
  scripts.forEach((script) => {
	const newScript = document.createElement('script');
	newScript.textContent = script.textContent;
	if (script.src) {
	  newScript.src = script.src;
	  newScript.async = false;
	}
	document.head.appendChild(newScript);
	document.head.removeChild(newScript);
  });
}

// 7. Initialize
loadPage('/html/options/about.html'); // Default page

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setupNavigation();
} else {
  document.addEventListener('DOMContentLoaded', setupNavigation);
}

$(document).ready(function () {
	getServerPlayerId().then((playerId) => {
		if (!playerId) {
			console.error('No valid playerId; cannot proceed.');
			return; // Stop here if we can't get an ID
		}
		
		// Log Event
		trackPlayerEvent('LAUNCH', 'OPTIONS', null);
	});
});