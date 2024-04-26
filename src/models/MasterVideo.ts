import { Media } from "./Media"
import { UUID } from "crypto"

export interface MasterVideo {
	clip_id: UUID
	base_url: string
	video: Media[]
	audio?: Media[]
}