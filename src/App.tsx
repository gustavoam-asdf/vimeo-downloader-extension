import './App.css'

import { useEffect, useState } from 'react'

import { Button } from './components/ui/button'

function App() {
	const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab>()
	const [count, setCount] = useState(0)

	useEffect(() => {
		const getActiveTab = async () => {
			const [currentTab] = await chrome.tabs.query({ active: true })

			setCurrentTab(currentTab)
		}

		getActiveTab()
	}, [])

	useEffect(() => {
		async function interceptRequests() {
			const [currentTab] = await chrome.tabs.query({ active: true })
			chrome.webRequest.onCompleted.addListener(
				details => {
					const isMasterJson = details.url.includes('master.json')
					if (!isMasterJson) return

					console.log(details)
				},
				{
					urls: [
						'<all_urls>'
					],
					tabId: currentTab.id,
				},
			)
		}

		interceptRequests()
	}, [])

	const handleClick = async () => {
		setCount((count) => count + 1)
		const [tab] = await chrome.tabs.query({ active: true })
		console.log(tab)
	}

	return (
		<main>
			<h1>
				Estas en la pestaña: {currentTab?.title}
			</h1>
			<Button onClick={handleClick}>
				count is {count}
			</Button>
		</main>
	)
}

export default App
