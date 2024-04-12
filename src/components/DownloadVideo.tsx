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
		<>
			<h1 className="mb-2 text-primary font-bold text-xl">
				Video encontrado
			</h1>
			<div className="grid grid-cols-5 gap-2 items-center">
				<h2 className="text-primary-foreground font-bold text-sm text-pretty col-span-3">
					{name}
				</h2>
				<Button
					type="button"
					className="text-wrap col-span-2"
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
			</div>
			<div className={`overflow-hidden transition-[height] ${downloadState.video.isDownloading || downloadState.audio.isDownloading ? "h-20 my-2" : "h-0"}`}>
				<div className={`mb-2 transition-opacity ${downloadState.video.isDownloading ? "" : "opacity-0"}`}>
					<p className="text-foreground mb-1">Obteniendo video</p>
					<Progress value={downloadState.video.progress} />
				</div>
				<div className={`mb-2 transition-opacity ${downloadState.video.isDownloading ? "" : "opacity-0"}`}>
					<p className="text-foreground mb-1">Obteniendo audio</p>
					<Progress value={downloadState.audio.progress} />
				</div>
			</div>
		</>
	)
}