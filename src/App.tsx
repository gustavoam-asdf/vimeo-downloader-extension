import { useEffect, useState } from 'react'

import { Button } from './components/ui/button'

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

		chrome.webRequest.onCompleted.addListener(
			details => {
				const isMasterJsonRequest = details.url.includes('master.json')
				if (!isMasterJsonRequest) return

				setMasterJsonUrl(details.url)
			},
			{
				urls: [
					'<all_urls>'
				],
				tabId: currentTab.id,
			},
		)
	}, [currentTab])

	const handleClick = async () => {
		console.log(masterJsonUrl)
	}

	return (
		<main className="min-w-96 p-3">
			<h1 className="text-primary font-bold text-base text-pretty text-center mb-2">
				{currentTab?.title}
			</h1>
			<Button onClick={handleClick}>
				Descargar
			</Button>
		</main>
	)
}

export default App
