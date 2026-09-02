/**
 * Shared reorder logic for admin list rows.
 *
 * Swaps the `sort_order` values of a row and its neighbor through the
 * resource's own update endpoint (the PATCH payload reuses the contract
 * `*Update` schemas — `sort_order` only, every other field is omitted and
 * therefore kept as-is).
 *
 * The neighbor is patched first: a crash between the two calls leaves a
 * half-applied swap that still holds two distinct values and can be repaired
 * by clicking the control again. The backend orders public lists by
 * `sort_order ASC, id ASC`, so swapping concrete neighbor values always
 * produces a deterministic visible change even when many rows share `0`.
 */

/** The subset of a contract row the swap needs. */
export interface AdminRowSortKey {
  id: string;
  sort_order: number;
}

/**
 * A resource update function (`api.updateNews`, `api.updateProject`, ...).
 * Every contract `*Update` schema accepts an optional `sort_order`, so the
 * payload here stays within the contract for all content resources.
 */
export type AdminRowUpdate = (
  id: string,
  patch: { sort_order?: number },
) => Promise<unknown>;

/**
 * Swap `sort_order` between `row` and its adjacent `neighbor`.
 * Two PATCH calls: neighbor first, then the row.
 */
export async function moveAdminRow(
  row: AdminRowSortKey,
  neighbor: AdminRowSortKey,
  update: AdminRowUpdate,
): Promise<void> {
  await update(neighbor.id, { sort_order: row.sort_order });
  await update(row.id, { sort_order: neighbor.sort_order });
}
