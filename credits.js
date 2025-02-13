const GAME_CREDITS = {
	"f5a6b5ae-8b25-44f1-9c31-63297a67b7e9": {
		"description": "A small clone of&nbsp;<a href=\"https://play.google.com/store/apps/details?id=com.veewo.a1024\" rel=\"nofollow\">1024</a>, based on&nbsp;<a href=\"http://saming.fr/p/2048/\" rel=\"nofollow\">Saming\'s 2048</a>&nbsp;(also a clone). 2048 was indirectly inspired by&nbsp;<a href=\"https://asherv.com/threes/\" rel=\"nofollow\">Threes</a>.",
		"repository": {
			"text": "gabrielecirulli/2048",
			"url": "https://github.com/gabrielecirulli/2048"
		}
	},
	"7e5947fc-a448-496b-b9ac-d795c5c331be": {
		"description": "As seen in the Chromium browser when your device is offline.",
		"repository": {
			"text": "wayou/t-rex-runner",
			"url": "https://github.com/wayou/t-rex-runner"
		}
	},
	"d35d4ce6-ca81-4d8b-b6cf-b664115533bd": {
		"description": "A web-based take on the popular mobile game.",
		"repository": {
			"text": "nebez/floppybird",
			"url": "https://github.com/nebez/floppybird"
		}
	},
	"i98j01k2-m3n4-7586-n901-o23456789012": {
		"description": "The classic game, rewritten for web browsers.",
		"repository": {
			"text": "platzhersh/pacman-canvas",
			"url": "https://github.com/platzhersh/pacman-canvas"
		}
	},
	"a19d55e8-13fc-4e53-bfef-2613185b2d5c": {
		"description": "A tribute to the classic Pong game.",
		"repository": {
			"text": "denysdovhan/pingpong.js",
			"url": "https://github.com/denysdovhan/pingpong.js"
		}
	},
	"ffe32416-27be-4fc6-9713-61a9524d762f": {
		"description": "Classic Snake, recreated for web browsers.",
		"repository": {
			"text": "[Gist] ZiKT1229/Basic Snake HTML Game",
			"url": "https://gist.github.com/ZiKT1229/5935a10ce818ea7b851ea85ecf55b4da"
		}
	},
	"h87i90j1-l2m3-6475-m890-n12345678901": {
		"description": "A very simple version of Tetris made for web browsers.",
		"repository": {
			"text": "dionyziz/canvas-tetris",
			"url": "https://github.com/dionyziz/canvas-tetris"
		}
	},
	"3d48c810-dda1-47af-9bad-29963d1a1692": {
		"description": "Solve puzzles visually with this interactive game.",
		"repository": {
			"text": "TomMalbran/games",
			"url": "https://github.com/TomMalbran/games"
		}
	},
	"91752062-b897-4524-8289-734ad0d14368": {
		"description": "A futuristic, fast-paced racing game.",
		"repository": {
			"text": "BKcore/HexGL",
			"url": "https://github.com/BKcore/HexGL"
		}
	}

};

/**
 * Renders the credits dynamically into the `.games-list` element.
 * Fetches game names by GUID from `LOCAL_GAMES` to ensure consistency.
 */
function renderCredits() {
	const gamesList = document.querySelector(".games-list");

	if (!gamesList) {
		console.error("No .games-list container found.");
		return;
	}

	// Clear the list (useful for re-rendering)
	gamesList.innerHTML = `
		<div class="game-item" style="color: gray;">
			Note: This list only includes games that are bundled locally with this release.
		</div>
	`;

	// Iterate over credits and fetch names from LOCAL_GAMES
	for (const [guid, credit] of Object.entries(GAME_CREDITS)) {
		const localGame = LOCAL_GAMES[guid];

		if (!localGame) {
			console.warn(`Game with GUID ${guid} not found in LOCAL_GAMES.`);
			continue;
		}

		const gameItem = document.createElement("div");
		gameItem.classList.add("game-item");

		let content = `<b style="margin-bottom: 5px; display: block;">${localGame.name}</b>`;
		if (credit.description) content += `${credit.description}<br>`;
		if (credit.author) {
			content += `Created by <a href="${credit.author.url}" target="_blank">${credit.author.name}</a>.<br>`;
		}
		if (credit.repository) {
			content += `<span style="padding-top: 5px; display: block;">Source repository: <a href="${credit.repository.url}" target="_blank">${credit.repository.text}</a></span>`;
		}

		gameItem.innerHTML = content;
		gamesList.appendChild(gameItem);
	}

	// Append disclaimer
	const disclaimer = document.createElement("div");
	disclaimer.classList.add("game-item");
	disclaimer.style.color = "gray";
	disclaimer.innerHTML = `
		If your game is included in this extension and you would like it removed, 
		please contact us at <a href="mailto:content@freetimegames.app">content@freetimegames.app</a> 
		with proof of ownership/affiliation and indicate your request.
	`;
	gamesList.appendChild(disclaimer);
}