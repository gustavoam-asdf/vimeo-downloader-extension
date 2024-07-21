import { DetectedVideoContext, DetectedVideoInfo } from "@/context/DetectedVideoContext"
import { useCallback, useContext } from "react"

import { MasterVideo } from "@/models/MasterVideo"
import { MediaResolved } from "@/models/MediaResolved"
import { UUID } from "node:crypto"
import { fetchWithRetry } from "@/lib/fetchWithRetry"

export enum MaxVideoHeight {
	"4K" = 2160,
	"2K" = 1440,
	FHD = 1080,
	HD = 720,
}

interface VideoResourcesResolved {
	videoId: UUID
	video: MediaResolved
	audio?: MediaResolved
}

export function useDetectedVimeoVideo() {
	const context = useContext(DetectedVideoContext)

	if (!context) {
		throw new Error('useDetectedVideo must be used within a DetectedVideoContextProvider')
	}

	const { detectedVideoInfo } = context

	const resolveMedia = useCallback(async ({
		maxVideoHeight,
		detectedVideoInfo,
	}: {
		maxVideoHeight: MaxVideoHeight
		detectedVideoInfo: DetectedVideoInfo
	}) => {
		const { masterJsonUrl } = detectedVideoInfo

		const masterUrl = new URL(masterJsonUrl).toString()

		const cachedMap = await chrome.storage.session.get(masterUrl)

		const cached = cachedMap[masterUrl] as VideoResourcesResolved | undefined

		if (cached) {
			return cached
		}

		const response = await fetchWithRetry({ url: masterUrl })
		const master = await response.json() as MasterVideo

		const availableVideos = [...master.video]
			.filter(video => video.height <= maxVideoHeight)
			.sort((a, b) => a.avg_bitrate - b.avg_bitrate)
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

		const mediaResourcesResolved: VideoResourcesResolved = {
			videoId: master.clip_id,
			video: videoResolved,
			audio: audioResolved
		}

		await chrome.storage.session.set({
			[masterUrl]: mediaResourcesResolved
		})

		return mediaResourcesResolved
	}, [])

	return {
		detectedVideoInfo,
		resolveMedia
	}
}