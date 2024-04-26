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
	init_segment: string
	index_segment: string
	segments: Segment[]
}

export interface AudioMedia extends Media {
	channels: number
	sample_rate: number
	max_segment_duration: number
	audio_primary: boolean
}

export interface VideoMedia extends Media {
	framerate: number
	width: number
	height: number
	max_segment_duration: number
}