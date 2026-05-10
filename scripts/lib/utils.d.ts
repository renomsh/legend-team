/**
 * lib/utils.ts — shared utilities for legend-team scripts
 * Centralizes readJson, writeJson, appendLog, nextId
 */
export declare const ROOT: string;
export declare function readJson<T>(absPath: string, fallback: T): T;
export declare function writeJson(absPath: string, content: unknown): void;
export declare function appendLog(context: string, message: string): void;
/**
 * Generate next sequential ID from a list of entries with `id` field.
 * @param entries - array of objects with `id` string field
 * @param prefix - e.g. 'MF-', 'E-', 'session_'
 */
export declare function nextId(entries: Array<{
    id: string;
}>, prefix: string): string;
//# sourceMappingURL=utils.d.ts.map