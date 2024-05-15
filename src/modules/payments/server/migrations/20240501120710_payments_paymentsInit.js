// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface, appConfig }) {
    await queryInterface.createTable(
      'payments',
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
        amount: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        currency: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        reference: {
          type: DataTypes.JSONB,
          defaultValue: [],
        },
        providerReferenceId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        provider: {
          // Stripe/ DOT
          type: DataTypes.STRING,
          allowNull: true,
        },
        purchasedProductReference: {
          type: DataTypes.JSONB,
          defaultValue: {},
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      }
    )

  },
  async down({ context: queryInterface, appConfig }) {
    await queryInterface.dropTable('payments')
  }
}
