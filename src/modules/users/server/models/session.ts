import { DataTypes, Model, ForeignKey, CreationOptional } from 'sequelize'
import { sequelize } from '#server/db'
import { Session as SessionModel } from '../../types'
import { User } from './user'

type SessionCreateFields = Pick<SessionModel, 'token' | 'userId'>

export class Session
  extends Model<SessionModel, SessionCreateFields>
  implements SessionModel
{
  declare token: string
  declare userId: ForeignKey<User['id']>
  declare createdAt: CreationOptional<Date>
}

Session.init(
  {
    token: {
      type: DataTypes.STRING,
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
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Session',
    tableName: 'sessions',
    timestamps: true,
    updatedAt: false,
  }
)

Session.belongsTo(User, {
  targetKey: 'id',
  foreignKey: 'userId',
})
