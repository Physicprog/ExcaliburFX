import type { Readable, Writable } from "svelte/store";

export const TRANSITION_MS: Readable<number>;
export const scriptFavoriteExpressions: Writable<Record<string, boolean>>;
