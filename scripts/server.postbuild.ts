import fs from 'fs'
import { join } from 'path'

/*
  This script ensures a consistent structure in the `dist_server` directory after the build process.
  The build output's structure depends on the presence of custom modules in the `config/modules`.
  The script moves all build outputs into a new `src` subdirectory within `dist_server` if needed.
*/

const cwd = process.cwd()
const originalDistPath = join(cwd, 'dist_server')
const tempSrcPath = join(cwd, 'src_temp')

if (!fs.existsSync(join(originalDistPath, 'src'))) {
  // rename `dist_server` to `src_temp`
  fs.renameSync(originalDistPath, tempSrcPath)

  // create new empty folder `dist_server`
  fs.mkdirSync(originalDistPath)

  // rename `src_temp` to `dist_server/src`
  fs.renameSync(tempSrcPath, join(originalDistPath, 'src'))
}
