// Ensure variable is not re-declared
if (typeof vu_manifest === 'undefined') {
	// Get Version
	const vu_manifest = chrome.runtime.getManifest();
	const vu_version = vu_manifest.version;
	$('#version').text(vu_version);
}