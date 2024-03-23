import { useEffect, useState } from 'react'

import { Button } from './components/ui/button'
import { Progress } from "@/components/ui/progress"
import { useVimeoDownloader } from './hooks/useVimeoDownloader'

function App() {
	const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab>()
	const [masterJsonUrl, setMasterJsonUrl] = useState<string>()

	useEffect(() => {
		const getActiveTab = async () => {
			const [currentTab] = await chrome.tabs.query({ active: true })

			setCurrentTab(currentTab)
		}

		getActiveTab()
	}, [])

	useEffect(() => {
		if (!currentTab) return

		const tabUpdateHandler = (tabId: number, _: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
			if (tabId !== currentTab.id) return
			setCurrentTab(tab)
		}

		chrome.tabs.onUpdated.addListener(tabUpdateHandler)

		return () => chrome.tabs.onUpdated.removeListener(tabUpdateHandler)
	}, [currentTab])

	useEffect(() => {
		const getMasterJsonUrl = async () => {
			if (!currentTab?.id) return
			const masterJsonUrlSaved = await chrome.storage.session.get(currentTab.id.toString())
			const masterJsonUrl = masterJsonUrlSaved[currentTab.id.toString()] as string

			setMasterJsonUrl(masterJsonUrl)
		}

		getMasterJsonUrl()
	}, [currentTab])

	useEffect(() => {
		const onChangeStorage = (changes: { [key: string]: chrome.storage.StorageChange }) => {
			for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
				const isCurrentTab = key === currentTab?.id?.toString()

				if (!isCurrentTab) return

				if (oldValue === newValue) return

				setMasterJsonUrl(newValue as string)
			}
		}

		chrome.storage.onChanged.addListener(onChangeStorage);

		return () => chrome.storage.onChanged.removeListener(onChangeStorage)
	}, [currentTab])

	const { downloadState, getBetterMedia, processVideoMedia, processAudioMedia } = useVimeoDownloader({
		name: currentTab?.title ?? "Vimeo Downloader Extension video",
		masterJsonUrl: masterJsonUrl
	})

	const handleClick = async () => {
		if (!masterJsonUrl || !currentTab?.title) return

		const betterMedia = await getBetterMedia()

		if (!betterMedia) {
			console.error('No se pudo obtener el contenido multimedia')
			return
		}

		const { video, audio } = betterMedia

		if (!audio) {
			await processVideoMedia({
				video,
			})
			return
		}

		await Promise.all([
			processVideoMedia({
				video,
			}),
			processAudioMedia({
				audio,
			})
		])

		// await chrome.downloads.download({
		// 	url: masterJsonUrl,
		// 	filename: 'master.json'
		// })
	}

	return (
		<main className="min-w-96 max-w-96 p-3">
			<h1 className="text-primary font-bold text-base text-pretty text-center mb-2">
				{currentTab?.title}
			</h1>
			<div className="flex justify-center">
				<Button
					type="button"
					onClick={handleClick}
					disabled={downloadState.video.isDownloading || downloadState.audio.isDownloading || !masterJsonUrl}
				>
					{
						downloadState.video.isDownloading || downloadState.audio.isDownloading
							? 'Descargando'
							: masterJsonUrl
								? 'Descargar'
								: 'No hay contenido multimedia'
					}
				</Button>
			</div>
			<div>
				{downloadState.video.isDownloading && (
					<div>
						<p>Descargando video</p>
						<Progress value={downloadState.video.progress} />
					</div>
				)}
				{downloadState.audio.isDownloading && (
					<div>
						<p>Descargando audio</p>
						<Progress value={downloadState.audio.progress} />
					</div>
				)}
			</div>
		</main>
	)
}

export default App
