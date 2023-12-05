import fs from 'fs'
import path from 'path'

const cwd = process.cwd()

const dynamicFiles = [
  'src/shared/types/__import-types.ts',
  'src/shared/permissions/__import-permissions.ts',
  'src/server/types/__import-models-integrations.ts',
  'src/client/stores/__import-stores.tsx',
  'src/client/components/__import-components.tsx',
].map((x) => path.join(cwd, x))

for (const file of dynamicFiles) {
  try {
    fs.unlinkSync(file)
  } catch (err) {
    console.error(`Can't delete file ${file}`, err)
  }
}
