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
				const parallelDownloads = 3
				const segments = media.segments.slice(segmentIndex, segmentIndex + parallelDownloads)

				if (segments.length === 0) {
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

				const chunks = await Promise.all(
					segments
						.map(
							segment => fetch(segment.absoluteUrl)
								.then(response => {
									if (!response.ok) {
										const error = new Error(`[${response.status}] Failed to fetch ${segment.absoluteUrl}: ${response.statusText}`)
										return Promise.reject(error)
									}

									return response.arrayBuffer()
								})
								.then(content => new Uint8Array(content))
						)
				)
					.catch(error => {
						controller.error(error)
					})

				if (!chunks) {
					return
				}

				for (const chunk of chunks) {
					controller.enqueue(chunk)
				}

				setDownloadState(prev => {
					const prevProgress = prev[type].progress

					const increment = (parallelDownloads / media.segments.length) * 100

					return {
						...prev,
						[type]: {
							isDownloading: true,
							progress: prevProgress + increment
						}
					}
				})

				segmentIndex += parallelDownloads
			}
		})

		return stream
	}

	return {
		downloadState,
		downloadMedia,
	}

}