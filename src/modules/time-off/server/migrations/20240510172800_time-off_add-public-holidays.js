// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface, appConfig }) {
    await queryInterface.createTable('public_holidays', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      calendarId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      externalIds: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    })
    await queryInterface.addIndex('public_holidays', ['date', 'calendarId'], {
      unique: true,
      name: 'date_calendarId_index',
    })
  },
  async down({ context: queryInterface, appConfig }) {
    await queryInterface.dropTable('public_holidays')
  },
}
