(async function () {
  const endpoint = `${WEB_ENDPOINT}experiments`;

  try {
	// Load cached experiments from local storage
	const cachedExperiments = await new Promise((resolve) => {
	  chrome.storage.local.get(['experiments'], (result) => {
		resolve(result.experiments || null);
	  });
	});

	// Render the cached experiments immediately (if available)
	if (cachedExperiments) {
	  applyExperiments(cachedExperiments);
	}

	// Fetch fresh experiments data from the endpoint
	const response = await fetch(endpoint);
	if (!response.ok) {
	  console.error('Failed to fetch experiments:', response.statusText);
	  return;
	}

	const experiments = await response.json();

	// Cache the experiments in local storage
	chrome.storage.local.set({ experiments });

	// Apply the experiments from the fresh data
	applyExperiments(experiments);

  } catch (error) {
	console.error('Error loading experiments:', error);
  }

  // Function to apply experiments
  function applyExperiments(experiments) {
	const targetExperiment1 = experiments.find(
	  exp => exp.guid === '01fcaebe-d280-4a75-8541-f14a6ab39482'
	);

	const targetExperiment2 = experiments.find(
	  exp => exp.guid === 'd74fd0eb-f1aa-483e-9127-7740ac6f1e95'
	);

	if (targetExperiment1 && targetExperiment1.enabled) {
	  const style = document.createElement('style');
	  style.textContent = `
		#donatebtn {
		  display: block;
		}
	  `;
	  document.head.appendChild(style);
	}

	if (targetExperiment2 && targetExperiment2.enabled) {
	  const style = document.createElement('style');
	  style.textContent = `
		html {
		  display: flex;
		  justify-content: center;
		  align-items: center;
		  height: 100%;
		  margin: 0;
		  background-color: #f8f9fa;
		}
		body {
		  display: none;
		}
		.message-container {
		  text-align: center;
		  font-family: Arial, sans-serif;
		  color: #333;
		  background-color: white;
		  height: 100%;
		}
		.message-container img {
		  height: 70px;
		  margin-top: 50px;
		  margin-bottom: 5px;
		}
		.message-container h1 {
		  font-size: 24px;
		  font-weight: bold;
		}
		.message-container p {
		  font-size: 20px;
		}
	  `;
	  document.head.appendChild(style);

	  const messageContainer = document.createElement('div');
	  messageContainer.className = 'message-container';
	  messageContainer.innerHTML = `
		<img src="/assets/branding/FTGspelled.png" alt="Extension Logo">
		<h1>This extension has been discontinued</h1>
		<p>Thanks for playing 👋</p>
	  `;

	  document.body.innerHTML = '';
	  document.body.style.display = 'block';
	  document.body.appendChild(messageContainer);
	}
  }
})();