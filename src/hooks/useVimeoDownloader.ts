import { useCallback, useState } from "react"

import { MasterVideo } from "@/models/MasterVideo"
import { MediaResolved } from "@/models/MediaResolved"
import { SegmentResolved } from "@/models/SegmentResolved"
import { fetchWithRetry } from "@/lib/fetchWithRetry"
import { splitInChunks } from "@/lib/splitInChunks"

export interface Params {
	name: string
	masterJsonUrl?: string
}

interface DownloadState {
	video: {
		isDownloading: boolean
		progress: number
	}
	audio: {
		isDownloading: boolean
		progress: number
	}
}

export function useVimeoDownloader({ masterJsonUrl }: Params) {
	const [downloadState, setDownloadState] = useState<DownloadState>({
		video: {
			isDownloading: false,
			progress: 0,
		},
		audio: {
			isDownloading: false,
			progress: 0,
		}
	})

	const getBetterMedia = async () => {
		if (!masterJsonUrl) return

		const masterUrl = new URL(masterJsonUrl).toString()
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
			return await response.blob();
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
		setDownloadState(prev => ({
			...prev,
			[type]: {
				downloading: true,
				progress: 0
			}
		}))

		const totalSegments = media.segments.length + 1
		const segmentSize = 100 / totalSegments

		const writable = await fileHandle.createWritable();

		const rawInitContent = window.atob(media.init_segment)
		const initContentData = Uint8Array.from(rawInitContent, c => c.charCodeAt(0))

		const initContent = new Blob([initContentData], { type: media.mime_type });

		await writable.write(initContent);

		setDownloadState(prev => ({
			...prev,
			[type]: {
				isDownloading: true,
				progress: segmentSize
			}
		}))

		const chunks = splitInChunks({
			values: media.segments,
			size: 2
		})

		for await (const { values: segments } of chunks) {
			const downloadedSegments = await Promise.all(
				segments.map(downloadSegment)
			)
			const result = new Blob(downloadedSegments, { type: media.mime_type });

			await writable.write(result);

			setDownloadState(prev => ({
				...prev,
				[type]: {
					isDownloading: true,
					progress: prev[type].progress + segmentSize * segments.length
				}
			}))
		}

		await writable.close();

		setDownloadState(prev => ({
			...prev,
			[type]: {
				isDownloading: false,
				progress: 100
			}
		}))
	}

	const processVideoMedia = async ({
		video,
		fileHandle
	}: {
		video: MediaResolved
		fileHandle: FileSystemFileHandle
	}) => {
		if (downloadState.video.isDownloading) {
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
		if (downloadState.audio.isDownloading) {
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
		downloadState,
		getBetterMedia,
		processVideoMedia,
		processAudioMedia,
	}

}