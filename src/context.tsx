import {
	RpcClient,
	WebSocketDom,
	type RpcConnection,
} from "@ptah-sh/dualshock";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	type PropsWithChildren,
} from "react";
import { type TypeOf, type ZodTypeAny, z } from "zod";
import { useQuery, useMutation } from "./hooks.js";
import type { BareFetcher, SWRConfiguration, SWRResponse } from "swr";
import { pino } from "pino";
import type {
	SWRMutationConfiguration,
	SWRMutationResponse,
} from "swr/mutation";

type Context = {
	invoke: (name: string, args: any) => Promise<any>;
};

const RpcContext = createContext<Context>({
	invoke: () => Promise.reject(new Error("RPC Context is not configured")),
});

type RpcProviderProps = PropsWithChildren & {
	url: string;
	invokables: Record<string, { args: ZodTypeAny; returns: ZodTypeAny }>;
	events: Record<string, { payload: ZodTypeAny }>;
};

const RpcProvider: React.FC<RpcProviderProps> = ({
	children,
	url,
	invokables,
	events,
}) => {
	const client = useMemo(() => new RpcClient(pino()), []);
	const connection = useRef<RpcConnection<any, any, any, any, any> | null>(
		null,
	);

	const invoke = useCallback(
		async (name: string, args: any) => {
			if (connection.current == null) {
				const ws = new WebSocketDom(new WebSocket(url));

				connection.current = await client.connect(ws, { invokables, events });
			}

			return connection.current.invoke(name, args);
		},
		[client, url, invokables, events],
	);

	return (
		<RpcContext.Provider value={{ invoke }}>{children}</RpcContext.Provider>
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
	Invokables extends Record<string, { args: ZodTypeAny; returns: ZodTypeAny }>,
	Events extends Record<string, { payload: ZodTypeAny }>,
>({
	url,
	invokables,
	events,
}: {
	url: `ws://${string}` | `wss://${string}`;
	invokables: Invokables;
	events: Events;
}): {
	Provider: React.FC<PropsWithChildren>;
	useQuery: <K extends Extract<keyof Invokables, string>>(
		name: K,
		args: TypeOf<Invokables[K]["args"]>,
		config?: SWRConfiguration<
			Invokables[K]["returns"],
			Error,
			BareFetcher<Invokables[K]["returns"]>
		>,
	) => SWRResponse<TypeOf<Invokables[K]["returns"]>>;
	useMutation: <
		K extends Extract<keyof Invokables, string>,
		Args extends TypeOf<Invokables[K]["args"]>,
		Returns extends TypeOf<Invokables[K]["returns"]>,
	>(
		name: K,
		config?: SWRMutationConfiguration<
			TypeOf<Invokables[K]["returns"]>,
			Error,
			string,
			TypeOf<Invokables[K]["args"]>,
			TypeOf<Invokables[K]["returns"]>
		>,
	) => SWRMutationResponse<
		TypeOf<Invokables[K]["returns"]>,
		Error,
		string,
		TypeOf<Invokables[K]["args"]>
	>;
} => {
	return {
		Provider: ({ children }) => (
			<RpcProvider url={url} invokables={invokables} events={events}>
				{children}
			</RpcProvider>
		),
		useQuery,
		useMutation,
		// useSubscription: () => {},
	};
};

/**
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

const { useQuery: dsQ, useMutation: dsM } = createDualshock({
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
	argsFromSecondRpc: 123,
});

const { trigger } = dsM("someRpc");

trigger({
	argFromSomeRpc: "test",
});

 */
