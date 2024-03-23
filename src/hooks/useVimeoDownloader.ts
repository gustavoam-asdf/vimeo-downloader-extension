import { useCallback, useMemo, useState } from "react"

import { MasterVideo } from "@/models/MasterVideo"
import { MediaResolved } from "@/models/MediaResolved"
import { SegmentResolved } from "@/models/SegmentResolved"
import { fetchWithRetry } from "@/lib/fetchWithRetry"
import { splitInChunks } from "@/lib/splitInChunks"

export interface Params {
	name: string
	masterJsonUrl: string
}

export const VIMEO_DOWNLOAD_DIR = 'vimeo-downloader'

export function useVimeoDownloader({ name, masterJsonUrl }: Params) {
	const [isDownloading, setIsDownloading] = useState({
		video: false,
		audio: false
	})

	const masterUrl = new URL(masterJsonUrl).toString()

	const getBetterMedia = async () => {
		const response = await fetchWithRetry({ url: masterUrl })
		const master = await response.json() as MasterVideo

		const availableVideos = [...master.video].sort((a, b) => a.avg_bitrate - b.avg_bitrate)
		const availableAudios = master.audio
			? [...master.audio].sort((a, b) => a.avg_bitrate - b.avg_bitrate)
			: undefined

		const betterVideo = availableVideos[availableVideos.length - 1]
		const betterAudio = availableAudios ? availableAudios[availableAudios.length - 1] : undefined

		const mediaUrl = new URL(master.base_url, masterUrl).href

		const videoResolved: MediaResolved = {
			...betterVideo,
			absoluteUrl: mediaUrl,
			segments: betterVideo.segments.map(segment => ({
				...segment,
				absoluteUrl: `${mediaUrl}${betterVideo.base_url}${segment.url}`
			}))
		}

		const audioResolved: MediaResolved | undefined = betterAudio
			? {
				...betterAudio,
				absoluteUrl: mediaUrl,
				segments: betterAudio.segments.map(segment => ({
					...segment,
					absoluteUrl: `${mediaUrl}${betterAudio.base_url}${segment.url}`
				}))
			}
			: undefined

		return {
			video: videoResolved,
			audio: audioResolved
		}
	}

	const downloadSegment = useCallback(
		async (segment: SegmentResolved) => {
			const response = await fetchWithRetry({
				url: segment.absoluteUrl
			});
			if (!response.ok) {
				throw new Error(`Downloading segment with url '${segment.absoluteUrl}' failed with status: ${response.status} ${response.statusText}`);
			}
			const buffer = await response.arrayBuffer();
			const data = new Uint8Array(buffer);
			return data;
		},
		[]
	)

	const processMedia = async ({
		fileHandle,
		type,
		media
	}: {
		fileHandle: FileSystemFileHandle,
		type: 'video' | 'audio',
		media: MediaResolved
	}) => {
		setIsDownloading(prev => ({
			...prev,
			[type]: true
		}))

		const writable = await fileHandle.createWritable();

		const initContent = window.atob(media.init_segment)

		await writable.write(initContent);

		const chunks = splitInChunks({
			values: media.segments,
			size: 10
		})

		for await (const { values: segments } of chunks) {
			const downloadedSegments = await Promise.all(
				segments.map(downloadSegment)
			)
			const bytes = downloadedSegments.map(dw => Array.from(dw)).reduce((acc, curr) => acc.concat(curr), [])
			const result = new Uint8Array(bytes)

			const decoded = new TextDecoder().decode(result)
			await writable.write(decoded);
		}

		await writable.close();

		setIsDownloading(prev => ({
			...prev,
			[type]: false
		}))
	}

	const processVideoMedia = async ({
		video,
		fileHandle
	}: {
		video: MediaResolved
		fileHandle: FileSystemFileHandle
	}) => {
		if (isDownloading.video) {
			console.warn('Video is already downloading, skipping')
			return
		}

		await processMedia({
			fileHandle,
			type: 'video',
			media: video
		})
	}

	const processAudioMedia = async ({
		audio,
		fileHandle
	}: {
		audio: MediaResolved
		fileHandle: FileSystemFileHandle
	}) => {
		if (isDownloading.audio) {
			console.warn('Audio is already downloading, skipping')
			return
		}

		await processMedia({
			fileHandle,
			type: 'audio',
			media: audio
		})
	}

	return {
		getBetterMedia,
		processVideoMedia,
		processAudioMedia,
	}

}