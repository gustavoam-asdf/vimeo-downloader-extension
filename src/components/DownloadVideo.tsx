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
		<div>
			<h1 className="text-primary font-bold text-base text-pretty text-center mb-2">
				{name}
			</h1>
			<div className="flex justify-center">
				<Button
					type="button"
					onClick={handleDownload}
					disabled={downloadState.video.isDownloading || downloadState.audio.isDownloading || !dbIsReady || !mediaResolved}
				>
					{
						downloadState.video.isDownloading || downloadState.audio.isDownloading
							? 'Obteniendo'
							: mediaResolved
								? 'Obtener'
								: 'No hay contenido multimedia'
					}
				</Button>
			</div>
			<div>
				{downloadState.video.isDownloading && (
					<div>
						<p>Obteniendo video</p>
						<Progress value={downloadState.video.progress} />
					</div>
				)}
				{downloadState.audio.isDownloading && (
					<div>
						<p>Obteniendo audio</p>
						<Progress value={downloadState.audio.progress} />
					</div>
				)}
			</div>
		</div>
	)
}