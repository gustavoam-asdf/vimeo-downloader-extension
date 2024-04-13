import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { VimeoVideo, useVimeoVideoDB } from "@/hooks/useVimeoVideoDB"

import { Button } from "./ui/button"
import { Progress } from "./ui/progress"
import { useCallback } from "react"
import { useVimeoDownloader } from "@/hooks/useVimeoDownloader"

type Params = {
	name?: string
	tabUrl?: string
	masterJsonUrl?: string
}

export function DownloadVideo({
	name,
	masterJsonUrl,
	tabUrl,
}: Params) {
	const { isReady: dbIsReady, saveVimeoVideo } = useVimeoVideoDB()
	const { mediaResolved, downloadState, processVideoMedia, processAudioMedia } = useVimeoDownloader(masterJsonUrl)

	const handleDownload = useCallback(
		async () => {
			if (!name || !dbIsReady || !mediaResolved) return

			if (!mediaResolved) {
				console.error('No se pudo obtener el contenido multimedia')
				return
			}

			const { video, audio } = mediaResolved

			if (!audio) {
				const videoContent = await processVideoMedia(video)
				if (!videoContent) return

				const vimeoVideo: VimeoVideo = {
					id: window.crypto.randomUUID(),
					name: name,
					url: tabUrl!,
					videoContent: new Blob(),
				}

				await saveVimeoVideo(vimeoVideo)
				return
			}

			const [videoContent, audioContent] = await Promise.all([
				processVideoMedia(video),
				processAudioMedia(audio)
			])

			if (!videoContent || !audioContent) {
				throw new Error('No se pudo obtener el contenido multimedia')
			}

			const vimeoVideo: VimeoVideo = {
				id: window.crypto.randomUUID(),
				name: name,
				url: tabUrl!,
				videoContent,
				audioContent
			}

			await saveVimeoVideo(vimeoVideo)
		},
		[mediaResolved, name, tabUrl, dbIsReady]
	)

	return (
		<Card>
			<CardHeader>
				<CardTitle>Video encontrado</CardTitle>
			</CardHeader>
			<CardContent>
				<h2 className="text-primary-foreground font-bold text-sm text-pretty mb-2">
					{name}
				</h2>
				<Button
					type="button"
					className="text-wrap w-full"
					onClick={handleDownload}
					disabled={downloadState.video.isDownloading || downloadState.audio.isDownloading || !dbIsReady || !mediaResolved}
				>
					{
						downloadState.video.isDownloading || downloadState.audio.isDownloading
							? 'Obteniendo ...'
							: mediaResolved
								? 'Obtener video'
								: 'No hay contenido multimedia'
					}
				</Button>
			</CardContent>
			<CardFooter className={`overflow-hidden flex-col justify-between gap-2 transition-[height] ${downloadState.video.isDownloading || downloadState.audio.isDownloading ? "h-24 my-2" : "h-0 p-0"}`}>
				<div className={`transition-opacity w-full ${downloadState.video.isDownloading ? "" : "opacity-0"}`}>
					<p className="text-foreground mb-1">Obteniendo video</p>
					<Progress value={downloadState.video.progress} />
				</div>
				<div className={`transition-opacity w-full ${downloadState.video.isDownloading ? "" : "opacity-0"}`}>
					<p className="text-foreground mb-1">Obteniendo audio</p>
					<Progress value={downloadState.audio.progress} />
				</div>
			</CardFooter>
		</Card>
	)
}