// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface, appConfig }) {
    await queryInterface.addColumn('forms', 'purgeSubmissionsAfterDays', {
      type: DataTypes.INTEGER,
    })
  },
  async down({ context: queryInterface, appConfig }) {
    await queryInterface.removeColumn('forms', 'purgeSubmissionsAfterDays')
  },
}
