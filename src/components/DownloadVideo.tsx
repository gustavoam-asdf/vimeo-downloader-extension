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
	const { downloadState, getBetterMedia, processVideoMedia, processAudioMedia } = useVimeoDownloader()

	const handleDownload = useCallback(
		async () => {
			if (!masterJsonUrl || !name || !dbIsReady) return

			const betterMedia = await getBetterMedia(masterJsonUrl)

			if (!betterMedia) {
				console.error('No se pudo obtener el contenido multimedia')
				return
			}

			const { video, audio } = betterMedia

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
		[name, masterJsonUrl, tabUrl, dbIsReady]
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
					disabled={downloadState.video.isDownloading || downloadState.audio.isDownloading || !dbIsReady || !masterJsonUrl}
				>
					{
						downloadState.video.isDownloading || downloadState.audio.isDownloading
							? 'Obteniendo'
							: masterJsonUrl
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