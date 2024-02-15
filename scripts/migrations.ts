/*
    node -r esbuild-runner/register scripts/migrations.ts [ARGUMENTS]
    [ARGUMENTS]
      -new users create-users-table       generate new empty migration file for the `users` module
      -up                                 upgrade the database state for all modules
      -up users visits                    upgrade the database state for `users` & `visits` only
      -down                               downgrade the database state for all modules
      -down visits                        downgrade the database state for the `visits` only
*/

import fs from 'fs'
import path from 'path'
import { Sequelize } from 'sequelize'
import { Umzug, SequelizeStorage } from 'umzug'
import dotenv from 'dotenv'
import { appConfig } from '../src/server/app-config'

// appConfig.validate()
const args = process.argv.slice(2)

// Generate migration file
if (args[0] === '-new') {
  const [scope, name] = args.slice(1)
  if (!scope || !name) {
    throw new Error(
      'Invalid input format. Should be "node migrations.js -new <MODULE_NAME> <MIGRATION_NAME>"'
    )
  }
  if (!appConfig.modules.some((m) => m.id === scope)) {
    throw new Error(`Module name "${scope}" was not found`)
  }
  const timeToken = getTimeToken(new Date())
  const fileName = getMigrationFileName(timeToken, scope, name)
  const filePath = path.join(getMigrationsPath(scope), fileName)
  generateMigration(filePath)
  console.log(`Generated "${scope}" module migration:\n\t${filePath}`)
  process.exit(0)
}

// Execute `up` or `down` migration
if (['-up', '-down'].includes(args[0])) {
  const command = args[0]
  let scopes = args.slice(1)

  const moduleIds = appConfig.modules.map((x) => x.id)

  if (scopes.length) {
    scopes.forEach((scope) => {
      if (!moduleIds.includes(scope)) {
        throw new Error(`Module name "${scope}" was not found`)
      }
    })
    scopes = moduleIds.filter((x) => scopes.includes(x))
  } else {
    scopes = moduleIds
  }

  if (command === '-down') {
    scopes = scopes.reverse()
  }

  dotenv.config()
  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) {
    throw new Error('Missed "DATABASE_URI" env variable')
  }
  const sequelize = new Sequelize(databaseUri, { logging: false })

  ;(async () => {
    for (const scope of scopes) {
      console.log(
        '\x1b[36m%s\x1b[0m',
        `\nExecuting migrations for "${scope}" module...`
      )
      try {
        const migrationsPath = getMigrationsPath(scope) + '/*.js'
        const umzug = new Umzug({
          migrations: {
            glob: migrationsPath,
            resolve: ({ name, path, context }) => {
              const migration = require(path!)
              return {
                name,
                up: async () => migration.up({ context, appConfig }),
                down: async () => migration.down({ context, appConfig }),
              }
            },
          },
          context: sequelize.getQueryInterface(),
          storage: new SequelizeStorage({ sequelize }),
          logger: console,
        })
        if (command === '-up') {
          await umzug.up()
        } else {
          // TODO: support "down" flag
          // await umzug.down({ to: 0 })
          // await umzug.down({ step: 1 })
          console.log(
            'Currently, the "down" flag for the migration script is not well supported.'
          )
        }
      } catch (err) {
        console.error(
          `Error while executing migrations for "${scope}" module:\n`,
          err
        )
        break
      }
    }
    sequelize.close()
    process.exit(0)
  })()
}

// Utils
function getMigrationsPath(scope) {
  const relativePath = appConfig.getModuleRelativePath(scope)
  if (!relativePath) {
    throw new Error(`Module "${scope}" was not found`)
  }
  return path.join(__dirname, '..', relativePath, `server/migrations`)
}
function generateMigration(filePath) {
  const content = `
// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface, appConfig }) {
    // await queryInterface.sequelize.transaction(async (transaction) => {})
    // await queryInterface.createTable('table_name', { id: { type: DataTypes.INTEGER, primaryKey: true } })
    // await queryInterface.addColumn('table_name', 'column_name', { type: DataTypes.STRING })
    // await queryInterface.changeColumn('table_name', 'column_name', { type: DataTypes.STRING })
  },
  async down({ context: queryInterface, appConfig }) {
    // await queryInterface.sequelize.transaction(async (transaction) => {})
    // await queryInterface.dropTable('table_name')
    // await queryInterface.removeColumn('table_name', 'column_name')
  }
}\n`.trimStart()
  fs.writeFileSync(filePath, content)
}
function getTimeToken(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ].join('')
}
function getMigrationFileName(timeToken, scope, name) {
  return `${timeToken}_${scope}_${name}.js`
}
