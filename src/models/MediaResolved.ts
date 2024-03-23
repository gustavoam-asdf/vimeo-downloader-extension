import { Media } from "./Media"
import { SegmentResolved } from "./SegmentResolved"

export interface MediaResolved extends Media {
	absoluteUrl: string
	segments: SegmentResolved[]
}