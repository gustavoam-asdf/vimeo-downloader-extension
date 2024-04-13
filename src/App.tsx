import { VimeoVideo, useVimeoVideoDB } from './hooks/useVimeoVideoDB'
import { useEffect, useState } from 'react'

import { DownloadVideo } from './components/DownloadVideo'

//import { useFfmpeg } from './hooks/useFfmpeg'

function App() {
	const { isReady: dbIsReady, listVimeoVideos } = useVimeoVideoDB()
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
			const masterJsonUrlSavedMap = await chrome.storage.session.get("new-master-json")
			const masterJsonUrlSaved = masterJsonUrlSavedMap["new-master-json"] as {
				tabId: number
				url: string
			}

			if (!masterJsonUrlSaved) return
			if (masterJsonUrlSaved.tabId !== currentTab.id && masterJsonUrlSaved.tabId !== -1) return

			setMasterJsonUrl(masterJsonUrlSaved.url)
		}

		getMasterJsonUrl()
	}, [currentTab])

	useEffect(() => {
		const onChangeStorage = (rawChanges: { [key: string]: chrome.storage.StorageChange }) => {
			const changes = Object.entries(rawChanges) as [key: "new-master-json", {
				oldValue: {
					tabId: number
					url: string
				},
				newValue: {
					tabId: number
					url: string
				}
			}][]

			for (let [key, { oldValue, newValue }] of changes) {
				if (key !== "new-master-json") return

				const referSameTab = oldValue.tabId === newValue.tabId && currentTab?.id === oldValue.tabId

				if (!referSameTab) return

				if (oldValue.url === newValue.url) return

				setMasterJsonUrl(newValue.url as string)
			}
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

	//const { isLoaded, videoRef, messageRef, load, transcode } = useFfmpeg()

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
			{
				/* isLoaded
					? (
						<>
							<video ref={videoRef} controls></video><br />
							<button onClick={transcode}>Transcode webm to mp4</button>
							<p ref={messageRef}></p>
							<p>Open Developer Tools (Ctrl+Shift+I) to View Logs</p>
						</>
					)
					: (
						<button onClick={load}>Load ffmpeg-core (~31 MB)</button>
					) */
			}
		</main>
	)
}

export default App
