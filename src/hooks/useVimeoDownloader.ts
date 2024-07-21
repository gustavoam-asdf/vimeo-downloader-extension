import { MediaResolved } from "@/models/MediaResolved"
import { useState } from "react"

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

export function useVimeoDownloader() {
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

	const downloadMedia = async ({
		type,
		media
	}: {
		type: 'video' | 'audio',
		media: MediaResolved
	}): Promise<ReadableStream<Uint8Array>> => {
		setDownloadState(prev => ({
			...prev,
			[type]: {
				downloading: true,
				progress: 0
			}
		}))

		let segmentIndex = 0
		const stream = new ReadableStream({
			start(controller) {
				const initSegment = media.init_segment
				const initContent = Uint8Array.from(globalThis.atob(initSegment), c => c.charCodeAt(0))

				controller.enqueue(initContent)
			},
			async pull(controller) {
				const segment = media.segments[segmentIndex]

				if (!segment) {
					controller.close()

					setDownloadState(prev => ({
						...prev,
						[type]: {
							isDownloading: false,
							progress: 100
						}
					}))

					return
				}

				const response = await fetch(segment.absoluteUrl)

				if (!response.ok) {
					controller.error(new Error(`[${response.status}] Failed to fetch ${segment.absoluteUrl}: ${response.statusText}`))
				}

				const content = new Uint8Array(await response.arrayBuffer())

				controller.enqueue(content)

				setDownloadState(prev => ({
					...prev,
					[type]: {
						isDownloading: true,
						progress: prev[type].progress + segmentIndex * 100 / media.segments.length
					}
				}))

				segmentIndex++
			}
		})

		return stream
	}

	return {
		downloadState,
		downloadMedia,
	}

}