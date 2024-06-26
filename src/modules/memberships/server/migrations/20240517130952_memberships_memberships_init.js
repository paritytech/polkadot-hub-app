// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface, appConfig }) {
    await queryInterface.createTable(
      'memberships',
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
          unique: true,
        },
        description: DataTypes.TEXT,
        price: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        currency: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        nftCollectionId: {
          type: DataTypes.STRING,
          allowNull: false,
        },       
         image: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        durationInDays: {
          type: DataTypes.INTEGER,
          allowNull: false,
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
        editedByUserId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        offices: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          defaultValue: [],
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      }
     )
  },
  async down({ context: queryInterface, appConfig }) {
    // await queryInterface.sequelize.transaction(async (transaction) => {})
    // await queryInterface.dropTable('table_name')
    // await queryInterface.removeColumn('table_name', 'column_name')
  }
}
