import { useCallback, useEffect, useState } from "react"

import { MasterVideo } from "@/models/MasterVideo"
import { MediaResolved } from "@/models/MediaResolved"
import { SegmentResolved } from "@/models/SegmentResolved"
import { fetchWithRetry } from "@/lib/fetchWithRetry"
import { splitInChunks } from "@/lib/splitInChunks"

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

export function useVimeoDownloader(resolvedMasterJsonUrl?: string) {
	const [masterJsonUrl, setMasterJsonUrl] = useState(resolvedMasterJsonUrl)

	useEffect(() => {
		if (!resolvedMasterJsonUrl) return
		setMasterJsonUrl(resolvedMasterJsonUrl)
	}, [resolvedMasterJsonUrl])

	const [betterMediaResolved, setBetterMediaResolved] = useState<{
		video: MediaResolved
		audio: MediaResolved | undefined
	}>()
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

	useEffect(() => {
		if (!masterJsonUrl) return

		const getBetterMedia = async () => {
			const masterUrl = new URL(masterJsonUrl).toString()

			const cachedMap = await chrome.storage.session.get(masterUrl)

			const cached = cachedMap[masterUrl] as {
				video: MediaResolved
				audio: MediaResolved | undefined
			}

			if (cached) {
				return cached
			}

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

			const mediaResolved = {
				video: videoResolved,
				audio: audioResolved
			}

			await chrome.storage.session.set({
				[masterUrl]: mediaResolved
			})

			return mediaResolved
		}

		getBetterMedia()
			.then(setBetterMediaResolved)
	}, [masterJsonUrl])

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
		type,
		media
	}: {
		type: 'video' | 'audio',
		media: MediaResolved
	}): Promise<Blob> => {
		setDownloadState(prev => ({
			...prev,
			[type]: {
				downloading: true,
				progress: 0
			}
		}))

		const totalSegments = media.segments.length + 1
		const segmentSize = 100 / totalSegments

		const chunkSize = Math.ceil(totalSegments / 10) + 1

		const rawInitContent = window.atob(media.init_segment)
		const initContentData = Uint8Array.from(rawInitContent, c => c.charCodeAt(0))

		const initContent = new Blob([initContentData], { type: media.mime_type });

		setDownloadState(prev => ({
			...prev,
			[type]: {
				isDownloading: true,
				progress: segmentSize
			}
		}))

		const chunks = splitInChunks({
			values: media.segments,
			size: chunkSize
		})

		let mediaContent = new Blob([initContent], { type: media.mime_type });

		for await (const { values: segments } of chunks) {
			const downloadedSegments = await Promise.all(
				segments.map(downloadSegment)
			)
			const result = new Blob(downloadedSegments, { type: media.mime_type });

			mediaContent = new Blob([mediaContent, result], { type: media.mime_type });

			setDownloadState(prev => ({
				...prev,
				[type]: {
					isDownloading: true,
					progress: prev[type].progress + segmentSize * segments.length
				}
			}))
		}

		setDownloadState(prev => ({
			...prev,
			[type]: {
				isDownloading: false,
				progress: 100
			}
		}))

		return mediaContent
	}

	const processVideoMedia = async (video: MediaResolved) => {
		if (downloadState.video.isDownloading) {
			console.warn('Video is already downloading, skipping')
			return
		}

		return await processMedia({
			type: 'video',
			media: video
		})
	}

	const processAudioMedia = async (audio: MediaResolved) => {
		if (downloadState.audio.isDownloading) {
			console.warn('Audio is already downloading, skipping')
			return
		}

		return await processMedia({
			type: 'audio',
			media: audio
		})
	}

	return {
		downloadState,
		mediaResolved: betterMediaResolved,
		processVideoMedia,
		processAudioMedia,
	}

}