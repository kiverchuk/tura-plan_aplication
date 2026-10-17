/** Bumped only with a reviewed change to backend/docs/openapi/openapi.yaml. */
export const API_CONTRACT_VERSION = '1.0.0' as const;

export type SyncEntity = 'employer' | 'calendar' | 'shift-type' | 'shift' | 'personal-event' | 'rotation-template';
export type SyncOperation = 'upsert' | 'delete';
export type SyncMutation = { id: string; entityType: SyncEntity; entityId: string; operation: SyncOperation; payload: Record<string, unknown>; baseRevision?: number };
export type SyncPushResult = { applied: { id: string; status: 'applied' | 'duplicate'; revision: number }[]; conflicts: { id: string; status: 'conflict'; current: { revision: number; data: Record<string, unknown> } }[] };
export type SyncPullResult = { changes: { id: string; entityType: SyncEntity; entityId: string; operation: SyncOperation; payload: Record<string, unknown>; revision: number; deletedAt: string | null; sequence: number }[]; cursor: number };
