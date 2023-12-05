// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface, appConfig }) {
    await queryInterface.createTable('announcements', {
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
      creatorUserId: {
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
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
      scheduledAt: DataTypes.DATE,
      expiresAt: DataTypes.DATE,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    })
  },
  async down({ context: queryInterface, appConfig }) {
    await queryInterface.dropTable('announcements')
  }
}
