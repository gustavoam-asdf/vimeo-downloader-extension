import './App.css'

import { Button } from './components/ui/button'
import { useState } from 'react'

function App() {
	const [count, setCount] = useState(0)

	return (
		<>
			<Button onClick={() => setCount((count) => count + 1)}>
				count is {count}
			</Button>
		</>
	)
}

export default App
