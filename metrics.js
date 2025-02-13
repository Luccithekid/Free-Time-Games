// ===============================
// metrics.js
// ===============================

// Cache the experiment state
let isMetricsEnabled = true; // Default to enabled if no cache

// Function to load experiments from cache
function loadExperiments() {
  return new Promise((resolve) => {
	chrome.storage.local.get(['experiments'], (result) => {
	  const experiments = result.experiments || [];
	  const targetExperiment = experiments.find(
		(exp) => exp.guid === '78f45ec7-e5e0-4d20-b848-01d790089d4c'
	  );

	  // Update the global `isMetricsEnabled` variable
	  isMetricsEnabled = targetExperiment ? targetExperiment.enabled : true; // Default to enabled
	  resolve(isMetricsEnabled);
	});
  });
}

// ==== Player ID Logic ====
function getServerPlayerId() {
  return new Promise((resolve) => {
	chrome.storage.local.get(['playerId'], (result) => {
	  const localPlayerId = result.playerId || null;

	  // Log immediately with the saved player ID
	  if (localPlayerId) {
		console.log('Using cached player ID:', localPlayerId);
		resolve(localPlayerId); // Use the cached playerId right away
	  } else {
		console.warn('No cached player ID available.');
		resolve(null); // No cached ID available
	  }

	  // Validate or fetch a new player ID in the background
	  $.ajax({
		url: `${WEB_ENDPOINT}metrics/player`,
		method: 'POST',
		contentType: 'application/json',
		data: JSON.stringify({ player_id: localPlayerId }),
		success: function (res, statusText, xhr) {
		  if (xhr.status === 200 || xhr.status === 201) {
			const playerId = res.player_id;
			chrome.storage.local.set({ playerId }, () => {
			  console.log('Player ID validated/updated:', playerId);
			});
		  } else {
			console.error('Unexpected response from server:', xhr.status);
		  }
		},
		error: function (xhr) {
		  console.error('Failed to validate/create player:', xhr.responseText);
		},
	  });
	});
  });
}

// ==== PID Logic, but async ====
function getServerPlayerIdAsync() {
  // This version is fire-and-forget, resolving immediately to avoid blocking
  chrome.storage.local.get(['playerId'], (result) => {
	const localPlayerId = result.playerId || null;

	$.ajax({
	  url: `${WEB_ENDPOINT}metrics/player`,
	  method: 'POST',
	  contentType: 'application/json',
	  data: JSON.stringify({ player_id: localPlayerId }),
	  success: function (res, statusText, xhr) {
		if (xhr.status === 200 || xhr.status === 201) {
		  const playerId = res.player_id;
		  chrome.storage.local.set({ playerId }, () => {
			console.log('Player ID updated:', playerId);
		  });
		} else {
		  console.error('Unexpected response from server while loading player:', xhr.status);
		}
	  },
	  error: function (xhr) {
		console.error('Failed to validate/create player:', xhr.responseText);
	  },
	});
  });
}

// ==== Session Tracking ====
let activeStartTime = null; // Tracks the current session start time
let totalActiveTime = 0; // Accumulated time in milliseconds
let trackIntervalId = null; // Interval for sending updates
let currentGameId = null; // Current game being tracked
let currentSessionId = null; // Session UUID from the server

function startGameTracking(gameId) {
  if (!isMetricsEnabled) {
	console.warn('Metrics disabled by experiment. Skipping session tracking.');
	return;
  }

  currentGameId = gameId;
  totalActiveTime = 0; // Reset accumulated time
  activeStartTime = Date.now(); // Set start time

  // Start tracking visibility and focus
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', startTimer);
  window.addEventListener('blur', stopTimer);

  // Send updates every 5 seconds
  trackIntervalId = setInterval(() => {
	sendSessionUpdate();
  }, 15000);
}

function stopGameTracking() {
  if (trackIntervalId) {
	clearInterval(trackIntervalId);
	trackIntervalId = null;
  }

  // Remove event listeners
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('focus', startTimer);
  window.removeEventListener('blur', stopTimer);

  // Ensure a final update
  stopTimer();
  sendSessionUpdate();

  // Reset variables
  currentGameId = null;
  currentSessionId = null;
  totalActiveTime = 0;
  activeStartTime = null;
}

function startTimer() {
  if (activeStartTime === null) {
	activeStartTime = Date.now(); // Record start time
	console.log(`[Timer] Started at: ${new Date(activeStartTime).toISOString()}`);
  } else {
	console.warn('[Timer] Timer already running.');
  }
}

function stopTimer() {
  if (activeStartTime !== null) {
	const elapsed = Date.now() - activeStartTime; // Calculate elapsed time
	totalActiveTime += elapsed; // Accumulate total active time
	activeStartTime = null; // Reset start time
	console.log(`[Timer] Stopped. Elapsed time: ${elapsed}ms. Total active time: ${totalActiveTime}ms`);
  } else {
	console.warn('[Timer] Timer is not running. Cannot stop.');
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
	stopTimer();
  } else {
	startTimer();
  }
}

function sendSessionUpdate() {
  if (!isMetricsEnabled) {
	console.warn('Metrics disabled by experiment. Session update not logged.');
	return;
  }

  const now = Date.now();
  const accumulatedMs =
	activeStartTime === null
	  ? totalActiveTime
	  : totalActiveTime + (now - activeStartTime); // Add elapsed time if timer is running

  const secondsPlayed = Math.floor(accumulatedMs / 1000);
  if (secondsPlayed <= 0) {
	console.warn('No time accumulated. Skipping session update.');
	return;
  }

  const payload = {
	game_id: currentGameId,
	accumulated_seconds: secondsPlayed,
	session_id: currentSessionId || null,
  };

  chrome.storage.local.get(['playerId'], (result) => {
	const playerId = result.playerId || null;
	const extensionVersion = chrome.runtime.getManifest().version;
	if (!playerId) {
	  console.error('No valid playerId. Session not logged.');
	  return;
	}

	$.ajax({
	  url: `${WEB_ENDPOINT}metrics/session`,
	  method: 'POST',
	  headers: {
		'Player-ID': playerId,
		'Extension-Version': extensionVersion,
	  },
	  contentType: 'application/json',
	  data: JSON.stringify(payload),
	  success: function (res) {
		if (res && res.session_id) {
		  currentSessionId = res.session_id; // Update session ID if returned
		}
		console.log(`[Session Update] Logged ${secondsPlayed} seconds.`);
	  },
	  error: function (xhr) {
		console.error('Failed to update session:', xhr.responseText);
	  },
	});
  });
}

// ==== Event Tracking ====
function trackPlayerEvent(eventType, target, targetId) {
  if (!isMetricsEnabled) {
	console.warn('Metrics disabled by experiment. Event not logged.');
	return; // Exit early
  }

  chrome.storage.local.get(['playerId'], (result) => {
	const playerId = result.playerId || null;
	if (!playerId) {
	  console.error('No valid playerId in storage. Event not tracked.');
	  return;
	}

	const clientTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

	$.ajax({
	  url: `${WEB_ENDPOINT}metrics/event`,
	  method: 'POST',
	  headers: {
		'Player-ID': playerId,
		'Extension-Version': chrome.runtime.getManifest().version,
	  },
	  contentType: 'application/json',
	  data: JSON.stringify({
		client_timestamp: clientTimestamp,
		event_type: eventType,
		target: target,
		target_id: targetId,
	  }),
	  success: function () {
		// console.log(`Event logged: ${eventType}, Target: ${target}, Target ID: ${targetId}`);
	  },
	  error: function (xhr) {
		console.error('Error logging event:', xhr.responseText);
	  },
	});
  });
}

// Attach functions to global scope
window.startGameTracking = startGameTracking;
window.stopGameTracking = stopGameTracking;
window.trackPlayerEvent = trackPlayerEvent;