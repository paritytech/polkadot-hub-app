// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.createTable('profile_questions_answers', {
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
      answers: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    })
  },
  async down({ context: queryInterface }) {
    await queryInterface.dropTable('profile_questions_answers')
  },
}
