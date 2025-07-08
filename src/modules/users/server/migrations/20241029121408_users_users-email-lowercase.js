// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface, appConfig }) {
    await queryInterface.sequelize.query(`
      UPDATE users
      SET email = LOWER(email)
      WHERE email <> LOWER(email)
    `)
  },

  async down({ context: queryInterface, appConfig }) {},
}
