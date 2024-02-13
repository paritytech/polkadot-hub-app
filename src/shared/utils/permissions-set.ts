import { escapeRegExpSensitiveCharacters, last } from './fp'

type PermissionsSetMapFn = (value: string) => boolean

export class PermissionsSet extends Set<string> {
  has(permission: string, officeId?: string): boolean {
    if (!officeId) {
      return super.has(permission)
    }
    return super.has(permission + ':' + officeId) || super.has(permission)
  }
  hasRoot(permissionRoot: string): boolean {
    const escaped = escapeRegExpSensitiveCharacters(permissionRoot)
    const re = new RegExp(`^${escaped}(:.*)?$`)
    return this.some((x) => re.test(x))
  }
  some(fn: PermissionsSetMapFn, thisArg?: any): boolean {
    for (const value of this) {
      if (fn.call(thisArg, value)) {
        return true
      }
    }
    return false
  }
  hasAll(values: string[], officeId?: string): boolean {
    return values.every((x) => this.has(x, officeId))
  }
  hasAnyOf(values: string[], officeId?: string): boolean {
    return values.some((x) => this.has(x, officeId))
  }
  extractOfficeIds(permissionRoot: string): string[] | null {
    if (this.has(permissionRoot)) {
      return []
    }
    const escaped = escapeRegExpSensitiveCharacters(permissionRoot)
    const re = new RegExp(`^${escaped}(:.*)?$`)
    const officeIds = Array.from(this)
      .filter((x) => re.test(x))
      .map((x) => last(x.split(':')))
    return officeIds.length ? officeIds : null
  }
}
