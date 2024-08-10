// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface, appConfig }) {
    await queryInterface.addColumn('working_hours_entries', 'metadata', {
      type: DataTypes.JSONB,
      defaultValue: {},
    })
  },
  async down({ context: queryInterface, appConfig }) {
    await queryInterface.removeColumn('working_hours_entries', 'metadata')
  },
}
