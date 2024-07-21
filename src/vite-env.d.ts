/// <reference types="vite/client" />

interface WindowEventMap {
	"onVimeoVideoListUpdated": CustomEvent;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ReadableStream<R = any> {
	[Symbol.asyncIterator](): AsyncIterableIterator<R>;
}