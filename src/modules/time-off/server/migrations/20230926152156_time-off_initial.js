// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface, appConfig }) {
    await queryInterface.createTable('time_off_requests', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dates: {
        type: DataTypes.ARRAY(DataTypes.DATEONLY),
        defaultValue: [],
      },
      unitsPerDay: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      status: {
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
  },
  async down({ context: queryInterface, appConfig }) {
    await queryInterface.dropTable('time_off_requests')
  },
}
