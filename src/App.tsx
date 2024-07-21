import { DetectVideoContextProvider } from './context/DetectedVideoContext'
import { DownloadVideo } from './components/DownloadVideo'
import { VideosLists } from './components/VideosLists'

function App() {

	// useEffect(() => {
	// 	const onChangeStorage = (changes: { [key: string]: chrome.storage.StorageChange }) => {
	// 		const newMasterJson = changes[MASTER_JSON_KEY]
	// 		if (!newMasterJson) return

	// 		const { oldValue, newValue } = newMasterJson as {
	// 			oldValue: {
	// 				tabId: number
	// 				url: string
	// 			} | undefined,
	// 			newValue: {
	// 				tabId: number
	// 				url: string
	// 			} | undefined
	// 		}

	// 		if (!newValue) {
	// 			setMasterJsonUrl(undefined)
	// 			return
	// 		}

	// 		const referSameTab = currentTab?.id === newValue.tabId

	// 		if (!referSameTab) {
	// 			setMasterJsonUrl(undefined)
	// 			return
	// 		}

	// 		if (oldValue?.url === newValue.url) return

	// 		setMasterJsonUrl(newValue.url)
	// 	}

	// 	chrome.storage.session.onChanged.addListener(onChangeStorage);

	// 	return () => chrome.storage.session.onChanged.removeListener(onChangeStorage)
	// }, [currentTab])

	///////////////////////////////////////////////////////////

	return (
		<DetectVideoContextProvider>
			<main className="min-w-[25rem] max-w-[25rem] px-4 py-6 dark bg-background flex flex-col gap-4">
				<DownloadVideo />
				<VideosLists />
			</main>
		</DetectVideoContextProvider>
	)
}

export default App
