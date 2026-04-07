export type PropertyKeyOf<T extends object> = Extract<keyof T, string>;

export const defineGetter = <Target extends object, Key extends string, Value>(
	target: Target,
	key: Key,
	getValue: () => Value
): void => {
	Object.defineProperty(target, key, {
		configurable: true,
		enumerable: true,
		get: getValue
	});
};

export const defineGetterBackedProperties = <Target extends object, Shape extends object>(
	target: Target,
	getters: {
		[K in PropertyKeyOf<Shape>]: () => Shape[K];
	},
	keys: readonly PropertyKeyOf<Shape>[]
): void => {
	for (const key of keys) {
		defineGetter(target, key, getters[key]);
	}
};

export const defineForwardedProperties = <Target extends object, Source extends object>(
	target: Target,
	getSource: () => Source,
	keys: readonly PropertyKeyOf<Source>[]
): void => {
	for (const key of keys) {
		defineGetter(target, key, () => getSource()[key]);
	}
};

/**
 * @deprecated Prefer explicit getter wiring so runtime bridges stay visible.
 */
export const bind = <Target extends object, Source extends object>(
	target: Target,
	source: Source
): void => {
	const descriptors = Object.getOwnPropertyDescriptors(source);
	for (const [key, descriptor] of Object.entries(descriptors)) {
		Object.defineProperty(target, key, descriptor);
	}
};
