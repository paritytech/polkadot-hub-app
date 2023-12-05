import Module from 'module'
import path from 'path'
import ts, { CompilerOptions } from 'typescript'

type Paths = Record<string, string[]>

function getTsConfig(): CompilerOptions | null {
  const tsConfigPath = path.join(process.cwd(), 'tsconfig.json')
  const { error, config } = ts.readConfigFile(tsConfigPath, ts.sys.readFile)
  if (error) return null
  let { options, errors } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path.resolve(path.dirname(tsConfigPath))
  )
  if (errors.length > 0) return null
  return options
}

function getPrefixedPaths(paths: Paths, prefixRegexes: RegExp[]): Paths {
  const result: Paths = {}
  for (const pattern of Object.keys(paths)) {
    if (prefixRegexes.some((regex) => regex.test(pattern))) {
      result[pattern] = paths[pattern]
    }
  }
  return result
}

function resolveModuleName(
  request: string,
  paths: Paths,
  outDir: string
): string | null {
  const alternativeOutDirPathRe = /^(\.\/)?..\//
  for (const pattern of Object.keys(paths)) {
    // FIXME: set "baseUrl": "." in the tsconfig.json (maybe)
    const relativeTarget = paths[pattern][0]
    const target = relativeTarget.replace(alternativeOutDirPathRe, '')
    const outDirRoute = alternativeOutDirPathRe.test(relativeTarget)
      ? ''
      : 'src'

    // "#lib-foo": ["src/utils/lib-foo"]
    // import '#lib-foo'
    if (request === pattern) {
      return path.resolve(outDir, outDirRoute, target)
    }

    // "#utils/*": ["src/utils/*"]
    // import '#utils/lib-foo'
    const wildcardIndex = pattern.indexOf('*')
    if (wildcardIndex !== -1) {
      const patternPrefix = pattern.substring(0, wildcardIndex)
      if (request.startsWith(patternPrefix)) {
        const requestSuffix = request.replace(patternPrefix, '') // "lib-foo"
        const targetPrefix = target.split('*')[0] // "utils/"
        return path.resolve(outDir, outDirRoute, targetPrefix, requestSuffix)
      }
    }
  }
  return null
}

function escapeRegExpSensitiveCharacters(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function register(opts: { prefixes: string[] }): void {
  const tsConfig = getTsConfig()
  if (!tsConfig) {
    console.warn(`Can't setup custom paths: missing tsconfig.json`)
    return
  }
  const prefixRegexes = opts.prefixes
    .map(escapeRegExpSensitiveCharacters)
    .map((prefix) => new RegExp(`^${prefix}`))
  const paths = getPrefixedPaths(tsConfig.paths || {}, prefixRegexes)
  if (!Object.keys(paths).length) {
    console.warn(
      `Can't setup custom paths: there are no paths with ${JSON.stringify(
        opts.prefixes
      )} prefixes`
    )
    return
  }
  const outDir = tsConfig.outDir || '.'
  const _Module = Module as unknown as { _resolveFilename: Function }
  const originalResolveFilename = _Module['_resolveFilename']
  _Module['_resolveFilename'] = function (
    request: string,
    parent: any,
    ...args: any[]
  ) {
    if (!parent) return originalResolveFilename.apply(this, arguments)
    if (prefixRegexes.some((regex) => regex.test(request))) {
      const moduleName = resolveModuleName(request, paths, outDir)
      if (moduleName) {
        return originalResolveFilename.apply(this, [
          moduleName,
          parent,
          ...args,
        ])
      }
    }
    return originalResolveFilename.apply(this, arguments)
  }
}

export default { register }
