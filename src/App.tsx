import { useEffect, useState } from 'react'

import { DownloadVideo } from './components/DownloadVideo'
import { VideosLists } from './components/VideosLists'

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

	return (
		<main className="min-w-[25rem] max-w-[25rem] px-4 py-6 dark bg-background flex flex-col gap-4">
			<DownloadVideo masterJsonUrl={masterJsonUrl} name={currentTab?.title} tabUrl={currentTab?.url} />
			<VideosLists currentTab={currentTab} />
		</main>
	)
}

export default App
