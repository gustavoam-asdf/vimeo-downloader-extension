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
	const { videoResourcesResolved, downloadState, processVideoMedia, processAudioMedia } = useVimeoDownloader(masterJsonUrl)

	const handleDownload = useCallback(
		async () => {
			if (!name || !dbIsReady || !videoResourcesResolved) return

			if (!videoResourcesResolved) {
				console.error('No se pudo obtener el contenido multimedia')
				return
			}

			const { video, audio, videoId } = videoResourcesResolved

			if (!audio) {
				const videoContent = await processVideoMedia(video)
				if (!videoContent) return

				const vimeoVideo: VimeoVideo = {
					id: videoId,
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
				id: videoId,
				name: name,
				url: tabUrl!,
				videoContent,
				audioContent
			}

			await saveVimeoVideo(vimeoVideo)
		},
		[videoResourcesResolved, name, tabUrl, dbIsReady]
	)

	return (
		<Card>
			<CardHeader>
				<CardTitle>Video encontrado</CardTitle>
			</CardHeader>
			<CardContent>
				<h2 className="text-primary-foreground font-bold text-sm text-pretty mb-3">
					{name}
				</h2>
				<Button
					type="button"
					className="text-wrap w-full"
					onClick={handleDownload}
					disabled={downloadState.video.isDownloading || downloadState.audio.isDownloading || !dbIsReady || !videoResourcesResolved}
				>
					{
						downloadState.video.isDownloading || downloadState.audio.isDownloading
							? 'Obteniendo ...'
							: videoResourcesResolved
								? 'Obtener video'
								: 'Debe iniciar el video primero'
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