import { Chunk } from "@/models/Chunk"

type Params<T> = {
	values: T[]
	size: number
}

export function splitInChunks<T>({ values, size }: Params<T>) {
	const chunks: Chunk<T>[] = []

	for (let i = 0; i < values.length; i += size) {
		const startIndex = i
		const endIndex = i + size

		const chunkValues = values.slice(startIndex, endIndex)

		chunks.push({
			startIndex,
			values: chunkValues,
		})
	}

	return chunks
}