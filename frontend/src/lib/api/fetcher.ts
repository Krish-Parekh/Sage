import { createClient } from "@/lib/supabase/client";
import { API_BASE_URL } from "./config";

export interface FetcherOptions extends RequestInit {
	error?: string;
}

const supabase = createClient();

async function getAuthToken() {
	const {
		data: { session },
	} = await supabase.auth.getSession();

	return session?.access_token;
}

export async function fetcher<T>(
	path: string,
	options: FetcherOptions = {},
): Promise<T> {
	const { error, headers, ...init } = options;

	try {
		const token = await getAuthToken();

		const res = await fetch(`${API_BASE_URL}${path}`, {
			...init,
			headers: {
				"Content-Type": "application/json",
				...(token && {
					Authorization: `Bearer ${token}`,
				}),
				...headers,
			},
		});

		if (!res.ok) {
			throw new Error(error ?? `API responded with ${res.status}`);
		}

		if (res.status === 204) {
			return undefined as T;
		}

		const text = await res.text();
		if (!text) {
			return undefined as T;
		}

		return JSON.parse(text) as T;
	} catch (err) {
		throw err instanceof Error ? err : new Error(error ?? "Request failed");
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

export function deleteFetcher<T = void>(
	path: string,
	options?: FetcherOptions,
): Promise<T> {
	return fetcher<T>(path, { ...options, method: "DELETE" });
}
