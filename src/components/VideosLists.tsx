import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { VimeoVideo, useVimeoVideoDB } from "@/hooks/useVimeoVideoDB"
import { useEffect, useState } from "react"

import { Button } from "./ui/button"
import { useDetectedVimeoVideo } from "@/hooks/useDetectedVimeoVideo"
import { useFfmpeg } from "@/hooks/useFfmpeg"

export function VideosLists() {
	const { detectedVideoInfo } = useDetectedVimeoVideo()
	const [vimeoVideos, setVimeoVideos] = useState<Pick<VimeoVideo, "id" | "name">[]>()
	const { isReady: dbIsReady, listVimeoVideos, getVimeoVideoById, deleteVimeoVideo } = useVimeoVideoDB()
	const [isWorking, setIsWorking] = useState(false)
	const { load, mux } = useFfmpeg()

	useEffect(() => {
		load()
	}, [load])

	useEffect(() => {
		const getVimeoVideos = async () => {
			if (!detectedVideoInfo) return
			if (!dbIsReady) return

			const vimeoVideos = await listVimeoVideos(detectedVideoInfo.tab.url)

			setVimeoVideos(vimeoVideos)
		}

		getVimeoVideos()
	}, [detectedVideoInfo, dbIsReady, listVimeoVideos])

	useEffect(() => {
		if (!dbIsReady) return

		const onVimeoVideoListUpdated = async () => {
			if (!detectedVideoInfo) return

			const vimeoVideos = await listVimeoVideos(detectedVideoInfo.tab.url)

			setVimeoVideos(vimeoVideos)
		};

		window.addEventListener("vimeo-video-list-updated", onVimeoVideoListUpdated);

		return () => {
			window.removeEventListener("vimeo-video-list-updated", onVimeoVideoListUpdated);
		};
	}, [detectedVideoInfo, dbIsReady, listVimeoVideos]);

	const downloadVideo = async (videoId: string) => {
		if (isWorking) return

		setIsWorking(true)
		const vimeoVideo = await getVimeoVideoById(videoId)

		if (!vimeoVideo) return

		const filename = `vimeo-downloader/${vimeoVideo.name}.mp4`

		const createDownloadOptions: (url: string) => chrome.downloads.DownloadOptions = (url) => ({
			url,
			filename,
			saveAs: true,
		})

		if (!vimeoVideo.audioContent) {
			const videoUrl = URL.createObjectURL(vimeoVideo.videoContent)

			await chrome.downloads.download(createDownloadOptions(videoUrl))

			URL.revokeObjectURL(videoUrl)

			await deleteVimeoVideo(videoId)

			setIsWorking(false)
			return
		}

		const muxed = await mux({
			audio: vimeoVideo.audioContent,
			video: vimeoVideo.videoContent
		})

		const videoContentUrl = URL.createObjectURL(muxed)

		await chrome.downloads.download(
			createDownloadOptions(videoContentUrl)
		)

		URL.revokeObjectURL(videoContentUrl)

		await deleteVimeoVideo(videoId)

		setIsWorking(false)
	}

	if (vimeoVideos && vimeoVideos.length === 0) {
		return null
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Videos obtenidos</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="flex flex-col gap-6">
					{
						vimeoVideos?.map(vimeoVideo => (
							<li key={vimeoVideo.id} className="flex gap-2 items-center justify-between">
								<p className="text-primary-foreground text-sm font-semibold">{vimeoVideo.name}</p>
								<Button
									onClick={() => downloadVideo(vimeoVideo.id)}
									disabled={isWorking}
								>
									{
										isWorking
											? 'Descargando ...'
											: 'Descargar'
									}
								</Button>
							</li>
						))
					}
				</ul>
			</CardContent>
		</Card>
	)
}