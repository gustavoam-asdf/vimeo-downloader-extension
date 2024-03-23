chrome.webRequest.onCompleted.addListener(
	details => {
		const isMasterJsonRequest = details.url.includes('master.json')
		if (!isMasterJsonRequest) return

		console.log({
			url: details.url,
			tabId: details.tabId,
		})
	},
	{
		urls: [
			'<all_urls>'
		],
	},
)