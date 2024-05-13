import useSWR, {
	type BareFetcher,
	type SWRConfiguration,
	type SWRResponse,
} from "swr";
import type { TypeOf, z } from "zod";
import { useRpcContext } from "./context.js";
// import { rpcState } from "./rpc/state.js";

export const useQuery = <
	Invokables extends Record<
		string,
		{ args: z.ZodTypeAny; returns: z.ZodTypeAny }
	>,
	TRpcName extends keyof Invokables,
	// TODO: replace any with dualshock's error types
	Error = any,
	SWROptions extends
		| SWRConfiguration<
				Invokables[TRpcName]["returns"],
				Error,
				BareFetcher<Invokables[TRpcName]["returns"]>
		  >
		| undefined =
		| SWRConfiguration<
				Invokables[TRpcName]["returns"],
				Error,
				BareFetcher<Invokables[TRpcName]["returns"]>
		  >
		| undefined,
>(
	name: TRpcName,
	args: TypeOf<Invokables[TRpcName]["args"]>,
	config?: SWROptions,
): SWRResponse<Invokables[TRpcName]["returns"]> => {
	const context = useRpcContext();

	return useSWR(
		{ name, args },
		() => {
			return context.getConnection().invoke(name, args);
		},
		config,
	);
};
