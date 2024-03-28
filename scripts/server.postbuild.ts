import fs from 'fs'
import { join } from 'path'

/*
  This script ensures a consistent structure in the `dist_server` directory after the build process.
  The build output's structure depends on the presence of custom modules in the `config/modules`.
  The script moves all build outputs into a new `src` subdirectory within `dist_server` if needed.
*/

const cwd = process.cwd()
const distPath = join(cwd, 'dist_server')
const distSrcPath = join(distPath, 'src')
const tempDistSrcPath = join(cwd, 'src_temp')

// there are no custom modules in `config/modules`
if (!fs.existsSync(join(distPath, 'config'))) {
  // delete `dist_server/src` if present (previous build output)
  if (fs.existsSync(distSrcPath)) {
    fs.rmSync(distSrcPath, { recursive: true })
  }

  // rename `dist_server` to `src_temp`
  fs.renameSync(distPath, tempDistSrcPath)

  // create new empty folder `dist_server`
  fs.mkdirSync(distPath)

  // rename `src_temp` to `dist_server/src`
  fs.renameSync(tempDistSrcPath, join(distPath, 'src'))
}
