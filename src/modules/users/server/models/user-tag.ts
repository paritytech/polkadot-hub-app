import { DataTypes, Model, CreationOptional, literal } from 'sequelize'
import { sequelize } from '#server/db'
import { UserTag as UserTagModel } from '../../types'

type UserCreateFields = Partial<UserTagModel>

export class UserTag extends Model<UserTagModel, UserCreateFields> implements UserTagModel {
  declare id: CreationOptional<string>
  declare userId: string
  declare tagId: string
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

UserTag.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: literal('gen_random_uuid()'),
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
  {
    sequelize,
    modelName: 'UserTag',
    tableName: 'user_tags',
    timestamps: true,
  }
)
