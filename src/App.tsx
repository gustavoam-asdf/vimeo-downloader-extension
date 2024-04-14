import { VimeoVideo, useVimeoVideoDB } from './hooks/useVimeoVideoDB'
import { useEffect, useState } from 'react'

import { Button } from './components/ui/button'
import { DownloadVideo } from './components/DownloadVideo'
import { processVimeoVideo } from './lib/processVimeoVideo'

//import { useFfmpeg } from './hooks/useFfmpeg'

function App() {
	const { isReady: dbIsReady, listVimeoVideos, getVimeoVideoById } = useVimeoVideoDB()
	const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab>()
	const [masterJsonUrl, setMasterJsonUrl] = useState<string>()
	const [vimeoVideos, setVimeoVideos] = useState<VimeoVideo[]>([])

	useEffect(() => {
		const getActiveTab = async () => {
			const [currentTab] = await chrome.tabs.query({ active: true })

			setCurrentTab(currentTab)
		}

		getActiveTab()
	}, [])

	useEffect(() => {
		const tabUpdateHandler = async (tabId: number, info: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
			if (currentTab?.id === tabId && info.audible === undefined) {
				setMasterJsonUrl(undefined)
			}
			setCurrentTab(tab)
		}

		chrome.tabs.onUpdated.addListener(tabUpdateHandler)

		return () => chrome.tabs.onUpdated.removeListener(tabUpdateHandler)
	}, [currentTab])

	useEffect(() => {
		const onChangeStorage = (changes: { [key: string]: chrome.storage.StorageChange }) => {
			const newMasterJson = changes["new-master-json"]
			if (!newMasterJson) return

			const { oldValue, newValue } = newMasterJson as {
				oldValue: {
					tabId: number
					url: string
				} | undefined,
				newValue: {
					tabId: number
					url: string
				} | undefined
			}

			if (!newValue) {
				setMasterJsonUrl(undefined)
				return
			}

			const referSameTab = currentTab?.id === newValue.tabId

			if (!referSameTab) {
				setMasterJsonUrl(undefined)
				return
			}

			if (oldValue?.url === newValue.url) return

			setMasterJsonUrl(newValue.url)
		}

		chrome.storage.session.onChanged.addListener(onChangeStorage);

		return () => chrome.storage.session.onChanged.removeListener(onChangeStorage)
	}, [currentTab])

	useEffect(() => {
		const getVimeoVideos = async () => {
			if (!currentTab?.url) return
			if (!dbIsReady) return

			const vimeoVideos = await listVimeoVideos(currentTab.url)

			console.log({ vimeoVideos })

			setVimeoVideos(vimeoVideos)
		}

		getVimeoVideos()
	}, [currentTab, dbIsReady])

	const handleClick = async () => {
		if (!currentTab?.id) return
		const vimeoId = "1e803d9e-5e9d-43d1-974c-a8adc04b4de0"

		const vimeoVideo = await getVimeoVideoById(vimeoId)

		if (!vimeoVideo) return

		const videoContentUrl = URL.createObjectURL(vimeoVideo.videoContent)
		const audioContentUrl = vimeoVideo.audioContent
			? URL.createObjectURL(vimeoVideo.audioContent)
			: undefined

		await chrome.scripting.executeScript({
			target: { tabId: currentTab.id },
			func: processVimeoVideo,
			args: [{
				name: vimeoVideo.name,
				audioUrl: audioContentUrl,
				videoUrl: videoContentUrl
			}]
		})
			.catch(console.error)

		URL.revokeObjectURL(videoContentUrl)
		if (audioContentUrl) {
			URL.revokeObjectURL(audioContentUrl)
		}
	}

	return (
		<main className="min-w-[25rem] max-w-[25rem] px-4 py-6 dark bg-background">
			<DownloadVideo masterJsonUrl={masterJsonUrl} name={currentTab?.title} tabUrl={currentTab?.url} />
			<ul>
				{vimeoVideos.map(vimeoVideo => (
					<li key={vimeoVideo.id}>
						<p>{vimeoVideo.name}</p>
						<p>{vimeoVideo.url}</p>
					</li>
				))}
			</ul>
			<Button onClick={handleClick}>Unir</Button>
		</main>
	)
}

export default App
