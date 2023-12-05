import { DataTypes, Model, CreationOptional, Sequelize } from 'sequelize'
import { sequelize } from '#server/db'
import { EventCheckmark as EventCheckmarkModel } from '../../types'

type EventCheckmarkCreateFields = Pick<
  EventCheckmarkModel,
  'userId' | 'eventId' | 'checkboxId'
> &
  Partial<EventCheckmarkModel>

export class EventCheckmark
  extends Model<EventCheckmarkModel, EventCheckmarkCreateFields>
  implements EventCheckmarkModel
{
  declare id: CreationOptional<string>
  declare createdAt: CreationOptional<Date>
  declare eventId: string
  declare userId: string
  declare checkboxId: string
}

EventCheckmark.init(
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
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    checkboxId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'EventCheckmark',
    tableName: 'event_checkmarks',
    timestamps: true,
    updatedAt: false,
  }
)
