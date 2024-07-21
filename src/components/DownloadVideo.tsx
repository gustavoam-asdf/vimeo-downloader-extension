import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { MaxVideoHeight, useDetectedVimeoVideo } from "@/hooks/useDetectedVimeoVideo"
import { VimeoVideo, useVimeoVideoDB } from "@/hooks/useVimeoVideoDB"

import { Button } from "./ui/button"
import { Progress } from "./ui/progress"
import { useCallback } from "react"
import { useVimeoDownloader } from "@/hooks/useVimeoDownloader"

export function DownloadVideo() {
	const { detectedVideoInfo, resolveMedia } = useDetectedVimeoVideo()
	const { isReady: dbIsReady, saveVimeoVideo } = useVimeoVideoDB()
	const { downloadState, downloadMedia } = useVimeoDownloader()

	const streamToBlob = async (stream: ReadableStream<Uint8Array>, {
		type
	}: {
		type: string
	}) => {
		const chunks: Uint8Array[] = []

		for await (const chunk of stream) {
			chunks.push(chunk)
		}

		return new Blob(chunks, { type })
	}

	const handleDownload = useCallback(
		async () => {
			if (!detectedVideoInfo) return

			const videoResourcesResolved = await resolveMedia({
				maxVideoHeight: MaxVideoHeight.FHD,
				detectedVideoInfo
			})

			const { video, audio, videoId } = videoResourcesResolved

			if (!audio) {
				const videoStream = await downloadMedia({
					media: video,
					type: 'video'
				})
				if (!videoStream) return

				const videoContent = await streamToBlob(videoStream, { type: 'video/m4v' })

				const vimeoVideo: VimeoVideo = {
					id: videoId,
					name: detectedVideoInfo.name,
					url: detectedVideoInfo.tab.url,
					videoContent,
				}

				await saveVimeoVideo(vimeoVideo)
				return
			}

			const [videoStream, audioStream] = await Promise.all([
				downloadMedia({
					media: video,
					type: 'video'
				}),
				downloadMedia({
					media: audio,
					type: 'audio'
				})
			])

			if (!videoStream || !audioStream) {
				throw new Error('No se pudo obtener el contenido multimedia')
			}

			const [videoContent, audioContent] = await Promise.all([
				streamToBlob(videoStream, { type: 'video/m4v' }),
				streamToBlob(audioStream, { type: 'audio/m4a' })
			])

			const vimeoVideo: VimeoVideo = {
				id: videoId,
				name: detectedVideoInfo.name,
				url: detectedVideoInfo.tab.url,
				videoContent,
				audioContent,
			}

			await saveVimeoVideo(vimeoVideo)
		},
		[detectedVideoInfo, resolveMedia, downloadMedia, saveVimeoVideo]
	)

	return (
		<Card>
			<CardHeader>
				<CardTitle>Video encontrado</CardTitle>
			</CardHeader>
			<CardContent>
				<h2 className="text-primary-foreground font-bold text-sm text-pretty mb-3">
					{detectedVideoInfo?.name}
				</h2>
				<Button
					type="button"
					className="text-wrap w-full"
					onClick={handleDownload}
					disabled={downloadState.video.isDownloading || downloadState.audio.isDownloading || !dbIsReady || !detectedVideoInfo}
				>
					{
						downloadState.video.isDownloading || downloadState.audio.isDownloading
							? 'Obteniendo ...'
							: detectedVideoInfo
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