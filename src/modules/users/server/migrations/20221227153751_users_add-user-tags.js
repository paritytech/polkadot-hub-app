// @ts-check
const fs = require('fs')
const path = require('path')
const uuid = require('uuid')
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'tags',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
          },
          altNames: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: [],
          },
          category: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          order: {
            type: DataTypes.SMALLINT,
            allowNull: true,
            defaultValue: 0,
          },
          createdAt: DataTypes.DATE,
          updatedAt: DataTypes.DATE,
        },
        { transaction }
      )

      await queryInterface.createTable(
        'user_tags',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.literal('gen_random_uuid()'),
            allowNull: false,
            primaryKey: true,
          },
          userId: {
            type: DataTypes.UUID,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          tagId: {
            type: DataTypes.UUID,
            references: {
              model: 'tags',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          createdAt: DataTypes.DATE,
          updatedAt: DataTypes.DATE,
        },
        { transaction }
      )

      const tags = getDefaultTags()
      if (tags.length) {
        await queryInterface.bulkInsert('tags', tags, { transaction })
      }
    })
  },
  async down({ context: queryInterface }) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('user_tags', { transaction })
      await queryInterface.dropTable('tags', { transaction })
    })
  },
}

function getDefaultTags() {
  try {
    const file = fs.readFileSync(
      path.join(__dirname, 'default-tags.json'),
      'utf-8'
    )
    const groups = JSON.parse(file)
    const tags = groups.reduce((acc, g, i) => {
      const date = new Date().toISOString()
      const tags = g.tags.map((t) => ({
        id: uuid.v4(),
        name: t.name,
        altNames: t.altNames || [],
        category: g.category,
        order: i,
        createdAt: date,
        updatedAt: date,
      }))
      return [...acc, ...tags]
    }, [])
    return tags
  } catch (err) {
    console.log('Cannot load default tags')
    return []
  }
}
