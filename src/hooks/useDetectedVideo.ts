import { DetectedVideoContext } from "@/context/DetectedVideoContext"
import { useContext } from "react"

export function useDetectedVideo() {
	const context = useContext(DetectedVideoContext)

	if (!context) {
		throw new Error('useDetectedVideo must be used within a DetectedVideoContextProvider')
	}

	console.log({ context })

	return context
}