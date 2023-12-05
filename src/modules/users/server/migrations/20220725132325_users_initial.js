// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'users',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
          },
          role: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          fullName: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          birthday: {
            type: DataTypes.DATEONLY,
            allowNull: true,
          },
          email: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          stealthMode: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
          },
          avatar: {
            type: DataTypes.STRING(1000),
            allowNull: true,
          },
          jobTitle: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          division: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          department: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          team: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          country: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          city: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          contacts: {
            type: DataTypes.JSONB,
            defaultValue: {},
          },
          authIds: {
            type: DataTypes.JSONB,
            defaultValue: {},
          },
          externalIds: {
            type: DataTypes.JSONB,
            defaultValue: {},
          },
          isInitialised: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
          },
          bio: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          geodata: {
            type: DataTypes.JSONB,
            defaultValue: {},
          },
          defaultLocation: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          scheduledToDelete: DataTypes.DATE,
          deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          createdAt: DataTypes.DATE,
          updatedAt: DataTypes.DATE,
        },
        { transaction }
      )

      await queryInterface.createTable(
        'sessions',
        {
          token: {
            type: DataTypes.STRING,
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
          createdAt: DataTypes.DATE,
        },
        { transaction }
      )
    })
  },
  async down({ context: queryInterface }) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('sessions', { transaction })
      await queryInterface.dropTable('users', { transaction })
    })
  },
}
