chrome.webRequest.onCompleted.addListener(
	async details => {
		const isMasterJsonRequest = details.url.includes('master.json')
		if (!isMasterJsonRequest) return

		await chrome.storage.session.set({
			[details.tabId]: details.url,
		})
		// .then(() => {
		// 	console.log({
		// 		message: 'master.json url saved',
		// 		tabId: details.tabId,
		// 		url: details.url,
		// 	})
		// })
	},
	{
		urls: [
			'<all_urls>'
		],
	},
)