/** Compare complete route membership, never pending/visited rows or search pages. */
export function routeMembershipChanged(previous: readonly string[] | null, current: readonly string[]): boolean {
  if (previous === null) return false
  const before = new Set(previous)
  const after = new Set(current)
  return before.size !== after.size || [...before].some((id) => !after.has(id))
}
