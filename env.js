// Get the Chrome extension ID
var extensionId = chrome.runtime.id;

// Determine environment based on extension ID
var ENV = (extensionId === 'apdihfpnlkpbmpkehgdkcmknklmbilal') ? 'prod' : 'dev';

// Base URL for the web endpoint
var WEB_ENDPOINT = (ENV === 'prod') 
	? 'https://ftg.devinbaeten.com/v4/prod/' 
	: 'https://ftg.devinbaeten.com/v4/dev/';

// Optionally, expose the settings as an object
const config = {
	env: ENV,
	webEndpoint: WEB_ENDPOINT
};

// Log the configuration for debugging
console.log('Environment:', ENV);
console.log('Web Endpoint:', WEB_ENDPOINT);