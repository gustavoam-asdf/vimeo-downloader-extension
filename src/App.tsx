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
		const getMasterJsonUrl = async () => {
			if (!currentTab?.id) return
			const masterJsonUrlSaved = await chrome.storage.session.get(currentTab.id.toString())
			const masterJsonUrl = masterJsonUrlSaved[currentTab.id.toString()] as string

			setMasterJsonUrl(masterJsonUrl)
		}

		getMasterJsonUrl()
	}, [currentTab])

	const handleClick = async () => {
		console.log(masterJsonUrl)
	}

	return (
		<main className="min-w-96 p-3">
			<h1 className="text-primary font-bold text-base text-pretty text-center mb-2">
				{currentTab?.title}
			</h1>
			<div className="flex justify-center">
				<Button
					type="button"
					onClick={handleClick}
					disabled={!masterJsonUrl}
				>
					{
						masterJsonUrl
							? 'Descargar'
							: 'No se encontró ningún video'
					}
				</Button>
			</div>
		</main>
	)
}

export default App
