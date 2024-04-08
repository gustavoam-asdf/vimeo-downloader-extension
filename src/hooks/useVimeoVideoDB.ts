import { useEffect, useState } from "react"

import { UUID } from "crypto"

export interface VimeoVideo {
	id: UUID
	name: string
	videoContent: Blob
	audioContent?: Blob
}

export function useVimeoVideoDB() {
	const [db, setDb] = useState<IDBDatabase>()

	useEffect(() => {
		const request = indexedDB.open("vimeo-downloader-db")

		request.onerror = () => console.error("Error opening database")

		request.onsuccess = () => setDb(request.result)

		request.onupgradeneeded = () => {
			const db = request.result

			const videoStore = db.createObjectStore('vimeoVideo', { keyPath: 'id' })

			videoStore.createIndex('name', 'name', { unique: false })
			videoStore.createIndex('videoContent', 'videoContent', { unique: false })
			videoStore.createIndex('audioContent', 'audioContent', { unique: false })
		}
	}, [])

	const getVimeoVideoById = async (id: VimeoVideo["id"]) => {
		if (!db) return

		const transaction = db.transaction('vimeoVideo', 'readonly')
		const store = transaction.objectStore('vimeoVideo')
		const index = store.index('id')

		const request = index.get(id)

		return new Promise<VimeoVideo | undefined>((resolve, reject) => {
			request.onsuccess = () => resolve(request.result)
			request.onerror = () => reject(request.error)
		})
	}

	const saveVimeoVideo = async (vimeoVideo: VimeoVideo) => {
		if (!db) return

		const transaction = db.transaction('vimeoVideo', 'readwrite')
		const store = transaction.objectStore('vimeoVideo')

		const request = store.add(vimeoVideo)

		return new Promise<void>((resolve, reject) => {
			request.onsuccess = () => resolve()
			request.onerror = () => reject(request.error)
		})
	}


	return {
		getVimeoVideoById,
		saveVimeoVideo,
	}
}