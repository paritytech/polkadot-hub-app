// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.createTable('news', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      content: DataTypes.TEXT,
      offices: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      visibility: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      allowedRoles: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      creatorUserId: {
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      published: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      publishedAt: DataTypes.DATE,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    })
  },
  async down({ context: queryInterface }) {
    await queryInterface.dropTable('news')
  },
}
