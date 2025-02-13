$(document).ready(function () {
  if (typeof LOCAL_GAMES === 'undefined') {
	const error = new Error('LOCAL_GAMES is not defined. Check if local-games.js is loaded.');
	console.error(error);
	throw error;
  }

  // Check if metrics are enabled
  loadExperiments().then(() => {
	if (!isMetricsEnabled) {
	  console.warn('Metrics disabled by experiment.');
	  initializeLauncher(null); // Proceed without Player ID
	} else {
	  // Use cached Player ID and log launcher opening
	  getServerPlayerId().then((playerId) => {
		if (playerId) {
		  console.log('Logging launcher opening with player ID:', playerId);
		  trackPlayerEvent('OPEN', 'LAUNCHER', null); // Log the launcher opening
		} else {
		  console.warn('No valid player ID for launcher opening log.');
		}
	  });

	  initializeLauncher(); // Proceed immediately, player validation is async
	}
  });

  function initializeLauncher() {
	const gamesContainer = $('#gamesContainer');

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

	Promise.race([fetchGames, fetchTimeout])
	  .then((games) => {
		// Clear the container to ensure only server games are shown
		gamesContainer.empty();

		// Filter and render games returned by the server
		games
		  .filter((game) => game.available && (game.online || LOCAL_GAMES[game.guid]))
		  .forEach(renderGameCard);
	  })
	  .catch((error) => {
		console.error('Failed to load games from server:', error);

		// Clear the container and fallback to local games
		gamesContainer.empty();

		// Render only local games when server fetch fails
		Object.keys(LOCAL_GAMES).forEach((guid) => {
		  const game = LOCAL_GAMES[guid];
		  renderGameCard({
			guid,
			name: game.name,
			icons: [{ url: game.icon }],
			entrypoint: game.entrypoint,
			available: true,
			player: true, // Assume local games use the standard player
		  });
		});
	  });

	function renderGameCard(game) {
	  const isPlayable = game.player !== false;

	  const gameLink = $('<a>')
		.attr({
		  href: isPlayable ? `/play.html?game=${game.guid}` : game.entrypoint,
		  target: '_blank',
		})
		.addClass('redirCardLink');

	  const gameCard = $('<div>').addClass('gameCard');
	  gameCard.append(
		$('<img>').attr({
		  src: game.icons[0].url,
		  alt: game.name,
		  height: '76px',
		  width: '76px',
		})
	  );
	  gameCard.append($('<p>').text(game.name));

	  gameLink.append(gameCard);
	  gamesContainer.append(gameLink);
	}
  }
});