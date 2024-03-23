import { Segment } from "./Segment"

export interface Media {
	id: string
	avg_id: string
	base_url: string
	format: string
	mime_type: string
	codecs: string
	bitrate: number
	avg_bitrate: number
	duration: number
	channels?: number
	sample_rate?: number
	max_segment_duration: number
	init_segment: string
	index_segment: string
	segments: Segment[]
	audio_primary?: boolean
	framerate?: number
	width?: number
	height?: number
}