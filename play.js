$(document).ready(function () {
  loadExperiments().then(() => {
	if (!isMetricsEnabled) {
	  console.warn('Metrics disabled by experiment.');
	  initializeGame(null); // Proceed without tracking
	  return;
	}

	getServerPlayerId().then((playerId) => {
	  if (!playerId) {
		console.error('No valid playerId. Cannot proceed.');
		return;
	  }

	  initializeGame(playerId);
	});
  });

  function initializeGame(playerId) {
	const urlParams = new URLSearchParams(window.location.search);
	const gameId = urlParams.get('game');

	if (!gameId) {
	  const error = new Error('Game ID is missing from the URL.');
	  console.error(error);
	  throw error;
	}

	// Load local games mapping
	$.getScript('/js/utilities/local-games.js')
	  .done(function () {
		// Set a 5-second timeout for fetching remote data
		const fetchTimeout = new Promise((_, reject) =>
		  setTimeout(() => reject(new Error('Request timed out')), 5000)
		);

		const fetchGames = fetch(`${WEB_ENDPOINT}games`)
		  .then((response) => {
			if (!response.ok) {
			  throw new Error('Network response was not ok');
			}
			return response.json();
		  });

		// Use Promise.race to race fetch against timeout
		Promise.race([fetchGames, fetchTimeout])
		  .then((games) => {
			const game = games.find((g) => g.guid === gameId);

			if (!game || !game.available) {
			  const error = new Error('Game not found or unavailable.');
			  console.error(error);
			  throw error;
			}

			document.title = game.name;
			$('.gameTitle').text(game.name);

			if (isMetricsEnabled && playerId) {
			  trackPlayerEvent('LAUNCH', 'GAME', game.guid);
			  startGameTracking(gameId);
			}

			if (game.online && game.entrypoint) {
			  $('.gameAreaEmbed').attr('src', game.entrypoint);
			  $('#loadingOverlay').remove();
			} else if (LOCAL_GAMES[game.guid]) {
			  $('.gameAreaEmbed').attr('src', LOCAL_GAMES[game.guid].entrypoint);
			  $('#loadingOverlay').remove();
			} else {
			  const error = new Error(`Game "${game.name}" requires an update to play locally.`);
			  console.error(error);
			  showLocalFallback();
			}
		  })
		  .catch((error) => {
			console.error('Failed to load remote game data:', error);
			showLocalFallback();
			$('#loadingOverlay').remove();
		  });

		// Fallback to local games only
		function showLocalFallback() {
		  if (LOCAL_GAMES[gameId]) {
			const localGame = LOCAL_GAMES[gameId];
			document.title = localGame.name;
			$('.gameTitle').text(localGame.name);
			$('.gameAreaEmbed').attr('src', localGame.entrypoint);
		  } else {
			$('.gameArea').html(`
			  <div class="native-error-wrapper">
				<div class="generic native-error">
				  <h1>Error</h1>
				  <h2>Game Not Found</h2>
				  <hr/>
				  <p>The game you requested could not be found locally or online.</p>
				  <p>This typically happens when you're trying to access a game which was removed or is included in a newer version of the extension.</p>
				  <code>ERR_LF404</code>
				</div>
			  </div>
			`);
		  }
		}
	  })
	  .fail(() => {
		const error = new Error('Failed to load local games mapping.');
		console.error(error);
		throw error;
	  });
  }
});