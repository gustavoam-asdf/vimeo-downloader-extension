chrome.webRequest.onCompleted.addListener(
	async details => {
		if (details.tabId === -1) return
		const isMasterJsonRequest = details.url.includes('master.json') || details.url.includes('playlist.json')
		if (!isMasterJsonRequest) return

		await chrome.runtime.sendMessage({
			type: 'new-master-json',
			tabId: details.tabId,
			url: details.url,
		})
			.catch((error) => {
				console.error("Failed to send message from background script")
				console.error(error)
			})
	},
	{
		urls: [
			'<all_urls>'
		],
	},
)