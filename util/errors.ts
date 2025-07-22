export function isAborted(err: unknown): boolean {
	if (!(err instanceof Error)) {
		return false
	}

	if (err instanceof DOMException && err.name === "AbortError") {
		return true
	}

	if (err.cause && Array.isArray(err.cause)) {
		for (let e of err.cause) {
			if (isAborted(e)) {
				return true
			}
		}
	}

	if (err.cause) {
		return isAborted(err.cause)
	}

	return false
}
