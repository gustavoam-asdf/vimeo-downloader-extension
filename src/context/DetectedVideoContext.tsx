import { ReactNode, createContext, useEffect, useState } from "react";

export const DetectedVideoContext = createContext<{
	detectedVideoInfo: {
		name: string;
		masterJsonUrl: string;
	} | null;
} | undefined>(undefined)

export function DetectVideoContextProvider({
	children,
}: {
	children: ReactNode
}) {
	const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab>()
	const [detectedVideoInfo, setDetectedVideoInfo] = useState<{
		tabId: number
		name: string
		masterJsonUrl: string
	} | null>(null);

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
		const listener = (message: unknown) => {
			if (!currentTab) return

			if (typeof message !== 'object' || message === null) return
			const isMasterJsonMessage = (message as Record<string, string>).type === 'new-master-json'

			if (!isMasterJsonMessage) return

			const { tabId, url } = message as {
				tabId: number
				url: string
			}

			if (tabId !== currentTab?.id) return

			setDetectedVideoInfo({
				tabId,
				name: currentTab.title ?? 'video-detectado',
				masterJsonUrl: url,
			})
		}

		chrome.runtime.onMessage.addListener(listener)

		return () => chrome.runtime.onMessage.removeListener(listener)
	}, [currentTab])

	return (
		<DetectedVideoContext.Provider value={{ detectedVideoInfo }}>
			{children}
		</DetectedVideoContext.Provider>
	)

}

