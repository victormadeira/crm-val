/**
 * Prisma requires `tenantId` statically no input-type de create/upsert. O
 * scoped extension injeta em runtime — então aqui só derrubamos a exigência
 * estática. Use SEMPRE `scopedData` nos writes de models tenant-scoped.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function scopedData<T extends object>(d: T): any {
  return d;
}
