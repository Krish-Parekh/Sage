import { type UseMutationOptions, useMutation } from "@tanstack/react-query";

import { type FetcherOptions, patchFetcher, postFetcher } from "../fetcher";

type MutationOptions<TData, TBody> = Omit<
	UseMutationOptions<TData, Error, TBody>,
	"mutationFn"
> & {
	fetcherOptions?: FetcherOptions;
};

export function usePost<TData, TBody = unknown>(
	path: string,
	options?: MutationOptions<TData, TBody>,
) {
	const { fetcherOptions, ...mutationOptions } = options ?? {};
	return useMutation<TData, Error, TBody>({
		mutationFn: (body) => postFetcher<TData>(path, body, fetcherOptions),
		...mutationOptions,
	});
}

export function usePatch<TData, TBody = unknown>(
	path: string,
	options?: MutationOptions<TData, TBody>,
) {
	const { fetcherOptions, ...mutationOptions } = options ?? {};
	return useMutation<TData, Error, TBody>({
		mutationFn: (body) => patchFetcher<TData>(path, body, fetcherOptions),
		...mutationOptions,
	});
}
