/**
 * Ambient shim: extension runner references AgentSession surface without importing @gsd/agent-core.
 * Runtime session orchestration lives in @gsd/agent-core.
 */
declare module "@gsd/agent-core" {
	export interface AgentSession {}
	export type AgentSessionEvent = { type: string; [key: string]: unknown };
	export type SessionStateChangeReason = string;
}
