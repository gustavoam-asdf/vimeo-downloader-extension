import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export async function processVimeoVideo({
	name,
	audioUrl,
	videoUrl
}: {
	name: string
	videoUrl: string
	audioUrl?: string
}) {
	if (!audioUrl) {
		await chrome.downloads.download({
			url: videoUrl,
			filename: `${name}.mp4`,
			saveAs: true,
		})
		return
	}

	const [videoContent, audioContent] = await Promise.all([
		fetch(videoUrl).then(res => res.blob()),
		fetch(audioUrl).then(res => res.blob())
	])

	console.log("Starting ffmpeg")
	const ffmpeg = new FFmpeg()
	console.log("FFmpeg created")

	console.log("Loading ffmpeg")
	await ffmpeg.load({
		coreURL: chrome.runtime.getURL("ffmpeg/ffmpeg-core.js"),
		wasmURL: chrome.runtime.getURL("ffmpeg/ffmpeg-core.wasm")
	})
	console.log("FFmpeg loaded")

	await ffmpeg.writeFile('video.m4v', await fetchFile(videoContent))
	await ffmpeg.writeFile('audio.m4a', await fetchFile(audioContent))

	await ffmpeg.exec([
		'-i', 'video.m4v',
		'-i', 'audio.m4a',
		'-c', 'copy',
		'output.mp4',
	])

	const data = await ffmpeg.readFile('output.mp4') as Uint8Array

	const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }))

	await chrome.downloads.download({
		url,
		filename: `${name}.mp4`,
		saveAs: true,
	})
}