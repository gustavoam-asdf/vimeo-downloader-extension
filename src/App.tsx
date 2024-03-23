import './App.css'

import { useEffect, useState } from 'react'

import { Button } from './components/ui/button'

function App() {
	const [count, setCount] = useState(0)

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
		<>
			<Button onClick={handleClick}>
				count is {count}
			</Button>
		</>
	)
}

export default App
