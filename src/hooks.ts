import useSWR, {
	type BareFetcher,
	type SWRConfiguration,
	type SWRResponse,
} from "swr";
import { useRpcContext } from "./context.js";
import useSWRMutation, {
	type SWRMutationConfiguration,
	type SWRMutationResponse,
} from "swr/mutation";
import useSWRSubscription, {
	type SWRSubscriptionResponse,
} from "swr/subscription";
import { on } from "@ptah-sh/dualshock";

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

export const useSubscription = <EventName extends string, EventData>(
	name: EventName,
	config?: SWRConfiguration<EventData>,
): SWRSubscriptionResponse<EventData> => {
	const { client, events, connect } = useRpcContext();

	return useSWRSubscription(
		name as string,
		async (name, { next }) => {
			try {
				await connect();
			} catch (err) {
				next(err);

				return;
			}

			client.on(
				name,
				on()
					.args(events[name].payload)
					.fn(async (args) => {
						next(null, args);
					}),
			);

			return () => {
				console.log("unsubscribing (no, lol) from", name);
			};
		},
		config,
	);
};
