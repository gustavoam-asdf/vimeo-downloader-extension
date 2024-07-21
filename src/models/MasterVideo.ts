import { AudioMedia, VideoMedia } from "./Media"

export interface MasterVideo {
	clip_id: string
	base_url: string
	video: VideoMedia[]
	audio?: AudioMedia[]
}