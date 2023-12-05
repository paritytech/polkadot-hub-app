// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'room_reservations',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
          },
          creatorUserId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          userIds: {
            type: DataTypes.ARRAY(DataTypes.UUID),
            defaultValue: [],
          },
          status: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          office: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          roomId: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          startDate: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          endDate: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          createdAt: DataTypes.DATE,
          updatedAt: DataTypes.DATE,
        },
        { transaction }
      )
      await queryInterface.createTable(
        'room_display_devices',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
          },
          confirmedByUserId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          confirmedAt: DataTypes.DATE,
          office: DataTypes.STRING,
          roomId: DataTypes.STRING,
          createdAt: DataTypes.DATE,
          updatedAt: DataTypes.DATE,
        },
        { transaction }
      )
    })
  },
  async down({ context: queryInterface }) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('room_reservations', { transaction })
      await queryInterface.dropTable('room_display_devices', { transaction })
    })
  },
}
