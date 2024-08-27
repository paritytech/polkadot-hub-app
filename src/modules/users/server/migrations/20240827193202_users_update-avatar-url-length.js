// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface, appConfig }) {
    await queryInterface.changeColumn('users', 'avatar', {
      type: DataTypes.STRING(2000),
    })
  },
  async down({ context: queryInterface, appConfig }) {},
}
