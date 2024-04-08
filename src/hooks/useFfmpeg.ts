import { useRef, useState } from 'react'

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

export function useFfmpeg() {
	const [isLoaded, setIsLoaded] = useState(false)
	const ffmpegRef = useRef(new FFmpeg())
	const videoRef = useRef<HTMLVideoElement>(null)
	const messageRef = useRef<HTMLParagraphElement>(null)

	const load = async () => {
		const ffmpeg = ffmpegRef.current
		ffmpeg.on('log', ({ message }) => {
			if (!messageRef.current) return
			messageRef.current.innerHTML = message
			console.log(message)
		})
		// toBlobURL is used to bypass CORS issue, urls with the same
		// domain can be used directly.
		await ffmpeg.load({
			coreURL: "/ffmpeg/ffmpeg-core.js",
			wasmURL: "/ffmpeg/ffmpeg-core.wasm"
		})
		setIsLoaded(true)
	}

	const transcode = async () => {
		const ffmpeg = ffmpegRef.current
		await ffmpeg.writeFile('input.webm', await fetchFile('https://raw.githubusercontent.com/ffmpegwasm/testdata/master/Big_Buck_Bunny_180_10s.webm'))
		await ffmpeg.exec(['-i', 'input.webm', 'output.mp4'])
		const data = await ffmpeg.readFile('output.mp4') as Uint8Array

		if (videoRef.current) {
			videoRef.current.src =
				URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }))
		}
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

		if (videoRef.current) {
			const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }))
			console.log({ url })
			videoRef.current.src = url
		}
	}

	return {
		isLoaded,
		videoRef,
		messageRef,
		load,
		transcode,
		mux,
	}
}