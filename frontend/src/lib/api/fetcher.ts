import { API_BASE_URL } from "./config";

export interface FetcherOptions extends RequestInit {
	error?: string;
}

export async function fetcher<T>(
	path: string,
	options: FetcherOptions = {},
): Promise<T> {
	const { error, ...init } = options;
	try {
		const res = await fetch(`${API_BASE_URL}${path}`, {
			...init,
			headers: { "Content-Type": "application/json", ...init.headers },
		});

		if (!res.ok) {
			throw new Error(error ?? `API responded with ${res.status}`);
		}

		return (await res.json()) as T;
	} catch (e) {
		if (e instanceof Error) throw e;
		throw new Error(error ?? "Request failed");
	}
}

export function getFetcher<T>(
	path: string,
	options?: FetcherOptions,
): Promise<T> {
	return fetcher<T>(path, { ...options, method: "GET" });
}

export function postFetcher<T>(
	path: string,
	body: unknown,
	options?: FetcherOptions,
): Promise<T> {
	return fetcher<T>(path, {
		...options,
		method: "POST",
		body: JSON.stringify(body),
	});
}

export function patchFetcher<T>(
	path: string,
	body: unknown,
	options?: FetcherOptions,
): Promise<T> {
	return fetcher<T>(path, {
		...options,
		method: "PATCH",
		body: JSON.stringify(body),
	});
}
