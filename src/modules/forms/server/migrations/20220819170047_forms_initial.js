// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'forms',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
          },
          visibility: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          allowedRoles: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: [],
            allowNull: false,
          },
          duplicationRule: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          title: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
          },
          description: DataTypes.TEXT,
          content: {
            type: DataTypes.JSONB,
            defaultValue: [],
          },
          metadataFields: {
            type: DataTypes.JSONB,
            defaultValue: [],
          },
          creatorUserId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          responsibleUserIds: {
            type: DataTypes.ARRAY(DataTypes.UUID),
            defaultValue: [],
          },
          createdAt: DataTypes.DATE,
          updatedAt: DataTypes.DATE,
        },
        { transaction }
      )
      await queryInterface.createTable(
        'form_submissions',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
          },
          userId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'CASCADE',
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
          formId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'forms',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          answers: {
            type: DataTypes.JSONB,
            defaultValue: [],
          },
          metadata: {
            type: DataTypes.JSONB,
            defaultValue: [],
          },
          createdAt: DataTypes.DATE,
          updatedAt: DataTypes.DATE,
        },
        { transaction }
      )
    })
  },
  async down({ context: queryInterface }) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('form_submissions', { transaction })
      await queryInterface.dropTable('forms', { transaction })
    })
  },
}
