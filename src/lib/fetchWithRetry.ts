type Params = {
	url: string | URL | Request
	retries?: number | undefined
	init?: RequestInit | undefined
}

export function fetchWithRetry({
	url,
	retries = 3,
	init
}: Params) {
	try {
		return fetch(url, init)
	} catch (error) {
		if (retries <= 0) {
			throw error
		}

		return fetchWithRetry({
			url,
			retries: retries - 1,
			init
		})
	}
}