import { type UseQueryOptions, useQuery } from "@tanstack/react-query";

import { type FetcherOptions, getFetcher } from "../fetcher";

export function useGet<T>(
	path: string,
	options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn"> & {
		queryKey?: UseQueryOptions<T, Error>["queryKey"];
		fetcherOptions?: FetcherOptions;
	},
) {
	const { queryKey, fetcherOptions, ...queryOptions } = options ?? {};
	return useQuery<T, Error>({
		queryKey: queryKey ?? [path],
		queryFn: () => getFetcher<T>(path, fetcherOptions),
		...queryOptions,
	});
}
