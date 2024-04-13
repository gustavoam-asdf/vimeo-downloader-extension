//import { FFmpeg } from '@ffmpeg/ffmpeg'

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

//const ffmpeg = new FFmpeg()

chrome.storage.session.onChanged.addListener(changes => {
	const downloadedVideo = changes["downloaded-video"]
	if (!downloadedVideo) return

	/**
	 * @type {{
	* 	oldValue: unknown | undefined
	* 	newValue: import("crypto").UUID | undefined
	* }}
	*/
	const { newValue } = downloadedVideo

	if (!newValue) return

	console.log({ newValue })
});