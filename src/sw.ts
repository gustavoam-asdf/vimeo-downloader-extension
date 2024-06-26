chrome.webRequest.onCompleted.addListener(
	async details => {
		if (details.tabId === -1) return
		const isMasterJsonRequest = details.url.includes('master.json')
		if (!isMasterJsonRequest) return

		await chrome.storage.session.set({
			["new-master-json"]: {
				tabId: details.tabId,
				url: details.url
			},
		})
	},
	{
		urls: [
			'<all_urls>'
		],
	},
)