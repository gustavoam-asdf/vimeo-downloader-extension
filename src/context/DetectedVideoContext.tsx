import { ReactNode, createContext, useEffect, useState } from "react";

export type DetectedVideoInfo = {
	tab: {
		id: number
		url: string
	}
	name: string
	masterJsonUrl: string
}

export const DetectedVideoContext = createContext<{
	detectedVideoInfo: DetectedVideoInfo | null;
} | undefined>(undefined)

export function DetectVideoContextProvider({
	children,
}: {
	children: ReactNode
}) {
	const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab>()
	const [detectedVideoInfo, setDetectedVideoInfo] = useState<DetectedVideoInfo | null>(null);

	useEffect(() => {
		const getActiveTab = async () => {
			const [currentTab] = await chrome.tabs.query({ active: true })

			setCurrentTab(currentTab)
		}

		getActiveTab()
	}, [])

	useEffect(() => {
		const tabUpdateHandler = async (tabId: number, info: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
			// * Update video info when navigating to a new page in the same tab
			if (
				currentTab?.id === tabId
				&& info.audible === undefined
				&& info.status === undefined
				&& info.favIconUrl === undefined
			) {
				setDetectedVideoInfo(null)
			}

			setCurrentTab(tab)
		}

		chrome.tabs.onUpdated.addListener(tabUpdateHandler)

		return () => chrome.tabs.onUpdated.removeListener(tabUpdateHandler)
	}, [currentTab])

	useEffect(() => {
		const listener = async (message: unknown) => {
			if (!currentTab) return

			if (typeof message !== 'object' || message === null) return
			const isMasterJsonMessage = (message as Record<string, string>).type === 'new-master-json'

			if (!isMasterJsonMessage) return

			const { tabId, url } = message as {
				tabId: number
				url: string
			}

			if (tabId !== currentTab?.id) return 

			const newDetectedVideoInfo: DetectedVideoInfo = {
				tab: {
					id: tabId,
					url: currentTab.url!,
				},
				name: currentTab.title ?? 'video-detectado',
				masterJsonUrl: url,
			}

			setDetectedVideoInfo(newDetectedVideoInfo)

			await chrome.storage.session.set({
				[newDetectedVideoInfo.tab.url]: newDetectedVideoInfo
			})
		}

		chrome.runtime.onMessage.addListener(listener)

		return () => chrome.runtime.onMessage.removeListener(listener)
	}, [currentTab])

	useEffect(() => {
		const getLastDetectedVideoInfo = async () => {
			if (!currentTab) return

			const cachedMap = await chrome.storage.session.get(currentTab.url)

			const cached = cachedMap[currentTab.url!] as DetectedVideoInfo | undefined

			if (!cached) return

			if (cached.tab.id !== currentTab.id) return

			setDetectedVideoInfo(cached)
		}

		getLastDetectedVideoInfo()
	}, [currentTab])

	return (
		<DetectedVideoContext.Provider value={{ detectedVideoInfo }}>
			{children}
		</DetectedVideoContext.Provider>
	)

}

