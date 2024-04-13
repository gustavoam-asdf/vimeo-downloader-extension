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
		<main className="min-w-[30rem] max-w-[30rem] px-4 py-6 dark bg-background">
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
