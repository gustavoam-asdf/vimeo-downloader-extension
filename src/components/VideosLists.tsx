import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { VimeoVideo, useVimeoVideoDB } from "@/hooks/useVimeoVideoDB"
import { useEffect, useState } from "react"

import { Button } from "./ui/button"
import { UUID } from "crypto"
import { useFfmpeg } from "@/hooks/useFfmpeg"

type Params = {
	currentTab: chrome.tabs.Tab | undefined
}

export function VideosLists({
	currentTab,
}: Params) {
	const [vimeoVideos, setVimeoVideos] = useState<Pick<VimeoVideo, "id" | "name">[]>()
	const { isReady: dbIsReady, listVimeoVideos, getVimeoVideoById, deleteVimeoVideo } = useVimeoVideoDB()
	const [isWorking, setIsWorking] = useState(false)
	const { load, mux } = useFfmpeg()

	useEffect(() => {
		load()
	}, [])

	useEffect(() => {
		const getVimeoVideos = async () => {
			if (!currentTab?.url) return
			if (!dbIsReady) return

			const vimeoVideos = await listVimeoVideos(currentTab.url)

			setVimeoVideos(vimeoVideos)
		}

		getVimeoVideos()
	}, [currentTab, dbIsReady])

	useEffect(() => {
		if (!dbIsReady) return

		const onVimeoVideoListUpdated = async () => {
			if (!currentTab?.url) return

			const vimeoVideos = await listVimeoVideos(currentTab.url)

			setVimeoVideos(vimeoVideos)
		};

		window.addEventListener("vimeo-video-list-updated", onVimeoVideoListUpdated);

		return () => {
			window.removeEventListener("vimeo-video-list-updated", onVimeoVideoListUpdated);
		};
	}, [currentTab, dbIsReady]);

	const downloadVideo = async (videoId: UUID) => {
		if (isWorking) return

		setIsWorking(true)
		const vimeoVideo = await getVimeoVideoById(videoId)

		if (!vimeoVideo) return

		if (!vimeoVideo.audioContent) {
			const videoUrl = URL.createObjectURL(vimeoVideo.videoContent)

			await chrome.downloads.download({
				url: videoUrl,
				filename: `vimeo-downloader/${vimeoVideo.name}.mp4`,
			})

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

		await chrome.downloads.download({
			url: videoContentUrl,
			filename: `vimeo-downloader/${vimeoVideo.name}.mp4`,
		})

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