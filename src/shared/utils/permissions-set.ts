type PermissionsSetMapFn = (value: string) => boolean

export class PermissionsSet extends Set<string> {
  some(fn: PermissionsSetMapFn, thisArg?: any): boolean {
    for (const value of this) {
      if (fn.call(thisArg, value)) {
        return true
      }
    }
    return false
  }
  every(fn: PermissionsSetMapFn, thisArg?: any): boolean {
    for (const value of this) {
      if (!fn.call(thisArg, value)) {
        return false
      }
    }
    return true
  }
  hasAll(values: string[]): boolean {
    return values.every((x) => this.has(x))
  }
  hasAnyOf(values: string[]): boolean {
    return values.some((x) => this.has(x))
  }
}
