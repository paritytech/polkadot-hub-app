// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'visits',
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
          status: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          areaId: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          deskId: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          officeId: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
          },
          metadata: {
            type: DataTypes.JSONB,
            defaultValue: {},
          },
          createdAt: DataTypes.DATE,
          updatedAt: DataTypes.DATE,
        },
        { transaction }
      )

      await queryInterface.createTable(
        'visit_reminder_jobs',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
          },
          officeId: {
            type: DataTypes.STRING,
            allowNull: false,
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
          visitId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'visits',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          failed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
          },
          metadata: {
            type: DataTypes.JSONB,
            defaultValue: {},
          },
          createdAt: DataTypes.DATE,
        },
        { transaction }
      )
    })
  },
  async down({ context: queryInterface }) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('visits', { transaction })
      await queryInterface.dropTable('visit_reminder_jobs', { transaction })
    })
  },
}
