// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface, appConfig }) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'users',
        'roles',
        {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
          defaultValue: [],
        },
        { transaction }
      )
      await queryInterface.sequelize.query(
        `
        UPDATE users
        SET roles = ARRAY[role]::varchar[]
        WHERE role IS NOT NULL;
      `,
        { transaction }
      )
      await queryInterface.changeColumn(
        'users',
        'role',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction }
      )
    })
  },
  async down({ context: queryInterface, appConfig }) {
    await queryInterface.removeColumn('users', 'roles')
  },
}
