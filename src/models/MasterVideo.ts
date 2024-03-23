import { Media } from "./Media"

export interface MasterVideo {
	clip_id: string
	base_url: string
	video: Media[]
	audio?: Media[]
}