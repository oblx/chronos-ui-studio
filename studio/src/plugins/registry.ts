export interface InputConnector<TIn = unknown, TOut = unknown> {
	readonly id: string;
	readonly label: string;
	readonly accept: string;
	readonly ingest: (input: TIn) => TOut;
}

export interface OutputAdapter<TIn = unknown, TOut = unknown> {
	readonly id: string;
	readonly label: string;
	readonly mimeType: string;
	readonly emit: (input: TIn) => TOut;
}

const inputConnectors = new Map<string, InputConnector<unknown, unknown>>();
const outputAdapters = new Map<string, OutputAdapter<unknown, unknown>>();

export function registerInputConnector<TIn, TOut>(connector: InputConnector<TIn, TOut>): void {
	inputConnectors.set(connector.id, connector as InputConnector<unknown, unknown>);
}

export function registerOutputAdapter<TIn, TOut>(adapter: OutputAdapter<TIn, TOut>): void {
	outputAdapters.set(adapter.id, adapter as OutputAdapter<unknown, unknown>);
}

export function runInputConnector<TIn, TOut>(id: string, input: TIn): TOut {
	const conn = inputConnectors.get(id);
	if (!conn) throw new Error(`Unknown input connector: ${id}`);
	return conn.ingest(input) as TOut;
}

export function runOutputAdapter<TIn, TOut>(id: string, input: TIn): TOut {
	const adapter = outputAdapters.get(id);
	if (!adapter) throw new Error(`Unknown output adapter: ${id}`);
	return adapter.emit(input) as TOut;
}

export function listInputConnectors(): readonly Pick<InputConnector, 'id' | 'label' | 'accept'>[] {
	return [...inputConnectors.values()].map(({ id, label, accept }) => ({ id, label, accept }));
}

export function listOutputAdapters(): readonly Pick<OutputAdapter, 'id' | 'label' | 'mimeType'>[] {
	return [...outputAdapters.values()].map(({ id, label, mimeType }) => ({ id, label, mimeType }));
}
