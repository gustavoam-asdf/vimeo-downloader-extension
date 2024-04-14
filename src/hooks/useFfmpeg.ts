import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { useRef } from 'react'

export function useFfmpeg() {
	const ffmpegRef = useRef(new FFmpeg())

	const load = async () => {
		const ffmpeg = ffmpegRef.current
		ffmpeg.on('log', ({ message }) => {
			console.log(message)
		})
		// toBlobURL is used to bypass CORS issue, urls with the same
		// domain can be used directly.
		await ffmpeg.load({
			coreURL: chrome.runtime.getURL('ffmpeg/core/ffmpeg-core.js'),
			wasmURL: chrome.runtime.getURL('ffmpeg/core/ffmpeg-core.wasm'),
		})
	}

	const mux = async ({
		audio: audioBlob,
		video: videoBlob,
	}: {
		audio: Blob
		video: Blob
	}) => {
		const ffmpeg = ffmpegRef.current
		await ffmpeg.writeFile('video.m4v', await fetchFile(videoBlob))
		await ffmpeg.writeFile('audio.m4a', await fetchFile(audioBlob))
		await ffmpeg.exec([
			'-i', 'video.m4v',
			'-i', 'audio.m4a',
			'-c', 'copy',
			'output.mp4',
		])
		const data = await ffmpeg.readFile('output.mp4') as Uint8Array

		await ffmpeg.deleteFile('video.m4v')
		await ffmpeg.deleteFile('audio.m4a')
		await ffmpeg.deleteFile('output.mp4')

		return new Blob([data.buffer], { type: 'video/mp4' })
	}

	return {
		load,
		mux,
	}
}