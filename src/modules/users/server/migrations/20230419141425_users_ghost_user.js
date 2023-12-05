// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface, appConfig }) {
    const defaultRole = appConfig.lowPriorityRole
    if (!defaultRole) throw new Error('Missing default role')
    await queryInterface.sequelize.query(`
      INSERT INTO users (
        id,
        "fullName",
        email,
        role
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        'Ghost User',
        'ghost@user',
        '${defaultRole}'
      )
    `)
  },
  async down({ context: queryInterface }) {},
}
