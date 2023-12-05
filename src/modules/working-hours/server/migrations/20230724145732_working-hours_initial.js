// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface, appConfig }) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'working_hours_entries',
        {
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
          date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
          },
          startTime: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          endTime: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          createdAt: DataTypes.DATE,
          updatedAt: DataTypes.DATE,
        },
        { transaction }
      )

      await queryInterface.createTable(
        'default_working_hours_entries',
        {
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
          startTime: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          endTime: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          createdAt: DataTypes.DATE,
          updatedAt: DataTypes.DATE,
        },
        { transaction }
      )

      await queryInterface.createTable(
        'working_hours_user_configs',
        {
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
            unique: true,
          },
          value: {
            type: DataTypes.JSONB,
            defaultValue: {},
          },
          createdAt: DataTypes.DATE,
          updatedAt: DataTypes.DATE,
        },
        { transaction }
      )
    })
  },
  async down({ context: queryInterface, appConfig }) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('working_hours_user_configs', {
        transaction,
      })
      await queryInterface.dropTable('default_working_hours_entries', {
        transaction,
      })
      await queryInterface.dropTable('working_hours_entries', { transaction })
    })
  },
}
