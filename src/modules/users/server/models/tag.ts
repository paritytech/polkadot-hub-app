import { DataTypes, Model, CreationOptional, Op, ModelStatic } from 'sequelize'
import { sequelize } from '#server/db'
import { Tag as TagModel } from '../../types'

type UserCreateFields = Partial<TagModel>

export class Tag extends Model<TagModel, UserCreateFields> implements TagModel {
  declare id: CreationOptional<string>
  declare name: string
  declare altNames: string[]
  declare category: string
  declare order: number
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

Tag.init(
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
  {
    sequelize,
    modelName: 'Tag',
    tableName: 'tags',
    timestamps: true
  }
)
