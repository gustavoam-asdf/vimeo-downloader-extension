import { useEffect, useState } from 'react'

import { Button } from './components/ui/button'
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

	const { isDownloading, getBetterMedia, processVideoMedia } = useVimeoDownloader({
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

		const { video } = betterMedia

		const videoFileHandle = await window.showSaveFilePicker({
			startIn: 'videos',
			suggestedName: `${currentTab.title}.m4v`,
			types: [
				{
					description: 'Archivo de video',
					accept: {
						'video/m4v': ['.m4v']
					}
				}
			]
		})

		console.log("Starting download")
		await processVideoMedia({
			video,
			fileHandle: videoFileHandle
		})
		console.log("Download finished")

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
					disabled={isDownloading.video || isDownloading.audio || !masterJsonUrl}
				>
					{
						isDownloading.video
							? 'Descargando video'
							: isDownloading.audio
								? 'Descargando audio'
								: masterJsonUrl
									? 'Descargar'
									: 'No hay contenido multimedia'
					}
				</Button>
			</div>
		</main>
	)
}

export default App
