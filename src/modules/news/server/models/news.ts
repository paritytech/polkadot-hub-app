import { CreationOptional, DataTypes, Model } from 'sequelize'
import { sequelize } from '#server/db'
import { NewsItem } from '../../types'

export class News extends Model<NewsItem> implements NewsItem {
  declare id: CreationOptional<string>
  declare title: NewsItem['title']
  declare content: NewsItem['content']
  declare creatorUserId: NewsItem['creatorUserId']
  declare published: NewsItem['published']
  declare publishedAt: NewsItem['publishedAt']
  declare offices: NewsItem['offices']
  declare allowedRoles: NewsItem['allowedRoles']
  declare visibility: NewsItem['visibility']
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

News.init(
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
  },
  {
    sequelize,
    modelName: 'News',
    tableName: 'news',
    timestamps: true,
  }
)
