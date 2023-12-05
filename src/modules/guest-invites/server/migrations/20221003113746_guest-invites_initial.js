// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.createTable('guest_invites', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      office: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      areaId: DataTypes.STRING,
      deskId: DataTypes.STRING,
      creatorUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      dates: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    })
  },
  async down({ context: queryInterface }) {
    await queryInterface.dropTable('guest_invites')
  },
}
