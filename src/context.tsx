import type { RpcClient } from "@ptah-sh/dualshock";
import type { RpcConnection } from "@ptah-sh/dualshock/dist/types/src/RpcConnection.js";
import {
	createContext,
	useContext,
	useState,
	type PropsWithChildren,
} from "react";
import { TypeOf, z } from "zod";
import { useQuery } from "./hooks.js";

type Context = {
	rpcClient: RpcClient;
	rpcConnection: RpcConnection<any, any, any, any, any>;
	getConnection: () => RpcConnection<any, any, any, any, any>;
} | null;

const RpcContext = createContext<Context>(null);

type RpcProviderProps = PropsWithChildren & {
	rpcClient: RpcClient;
};

const RpcProvider: React.FC<RpcProviderProps> = ({ children }) => {
	const [state, setState] = useState<Context>(null);

	return (
		<RpcContext.Provider value={rpcClient}>{children}</RpcContext.Provider>
	);
};

export const useRpcContext = () => {
	const context = useContext(RpcContext);
	if (context == null) {
		throw new Error("RPC Context is not configured");
	}

	return context;
};

export const createDualshock = <
	A extends z.ZodTypeAny,
	R extends z.ZodTypeAny,
	E extends z.ZodTypeAny,
	Invokables extends Record<
		string,
		{ args: z.ZodTypeAny; returns: z.ZodTypeAny }
	>,
	Events extends Record<string, { payload: E }>,
>({
	url,
	invokables,
}: {
	url: `ws://${string}` | `wss://${string}`;
	invokables: Invokables;
	events: Events;
}): {
	useQuery: typeof useQuery<Invokables>;
} => {
	return {
		// Provider: RpcProvider,
		useQuery: useQuery,
		// useMutation: () => {},
		// useSubscription: () => {},
	};
};

const invokables = {
	someRpc: {
		args: z.object({
			argFromSomeRpc: z.string(),
		}),
		returns: z.object({
			returnsFromSomeRpc: z.number(),
		}),
	},
	secondRpc: {
		args: z.object({
			argsFromSecondRpc: z.number(),
		}),
		returns: z.object({
			returnsFromSecondRpc: z.string(),
		}),
	},
} as const;

const { useQuery: dsQ } = createDualshock({
	url: "ws://some-url",
	invokables,
	events: {},
});

// should be ok
dsQ("someRpc", {
	argFromSomeRpc: "test",
});

// should be type error
dsQ("secondRpc", {
	argFromSomeRpc: "SHOULD ERROR",
	argsFromSecondRpc: 123,
	nonExistingArg: "SHOULD ERROR",
});

dsQ("nonexistingrpc", {});
