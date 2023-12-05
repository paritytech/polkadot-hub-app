// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'checklists',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
          },
          title: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          type: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          userIds: {
            type: DataTypes.JSONB,
            defaultValue: [],
          },
          items: {
            type: DataTypes.JSONB,
            defaultValue: [],
          },
          visibility: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          allowedRoles: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
            defaultValue: [],
          },
          offices: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: [],
          },
          joinedDate: DataTypes.DATE,
          createdAt: DataTypes.DATE,
          updatedAt: DataTypes.DATE,
        },
        { transaction }
      )
      await queryInterface.createTable(
        'checklist_answers',
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
          checklistId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'checklists',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          answers: {
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
      await queryInterface.dropTable('checklists', { transaction })
      await queryInterface.dropTable('checklist_answers', { transaction })
    })
  },
}
