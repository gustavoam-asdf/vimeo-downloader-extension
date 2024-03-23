import './App.css'

import { Button } from './components/ui/button'
import { useState } from 'react'

function App() {
	const [count, setCount] = useState(0)

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
