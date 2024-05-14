import useSWR, {
	type BareFetcher,
	type SWRConfiguration,
	type SWRResponse,
	mutate,
	type MutatorOptions,
} from "swr";
import type { TypeOf, ZodType, ZodTypeAny, z } from "zod";
import { useRpcContext } from "./context.js";
import useSWRMutation, {
	type SWRMutationConfiguration,
	type SWRMutationResponse,
} from "swr/mutation";
// import { rpcState } from "./rpc/state.js";

export const useQuery = <
	RpcName extends string,
	Args,
	Returns,
	SWROptions extends SWRConfiguration<Returns, any, BareFetcher<Returns>>,
>(
	name: RpcName,
	args: Args,
	config?: SWROptions,
): SWRResponse<Returns> => {
	const context = useRpcContext();

	return useSWR(
		{ name, args },
		() => {
			return context.invoke(name, args);
		},
		config,
	);
};

export const useMutation = <RpcName extends string, Args, Returns>(
	name: RpcName,
	config?: SWRMutationConfiguration<Returns, any, string, Args, Returns>,
): SWRMutationResponse<Returns, any, string, Args> => {
	const context = useRpcContext();

	return useSWRMutation<
		Returns /*data*/,
		unknown /*error*/,
		string /* key */,
		Args /*extraArg*/,
		Returns /*swrData*/
	>(
		name,
		(name, { arg }) => {
			return context.invoke(name, arg);
		},
		config,
	);
};
