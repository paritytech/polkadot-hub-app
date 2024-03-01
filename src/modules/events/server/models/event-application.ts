import { CreationOptional, DataTypes, Model, Sequelize } from 'sequelize'
import { User } from '#modules/users/server/models'
import { sequelize } from '#server/db'
import {
  EventApplication as EventApplicationModel,
  EventApplicationStatus,
} from '../../types'
import { Event } from './event'
import { EventCheckmark } from './event-checkmark'

type EventApplicationCreateFields = Pick<
  EventApplicationModel,
  | 'userId'
  | 'creatorUserId'
  | 'status'
  | 'eventId'
  | 'formId'
  | 'formSubmissionId'
> &
  Partial<EventApplicationModel>

export class EventApplication
  extends Model<EventApplicationModel, EventApplicationCreateFields>
  implements EventApplicationModel
{
  declare id: CreationOptional<string>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare status: EventApplicationStatus
  declare eventId: string
  declare userId: string
  declare creatorUserId: string
  declare formId: string | null
  declare formSubmissionId: string | null
  declare event?: Event

  static async countByEventId(): Promise<Record<string, number>> {
    const entries = (await this.findAll({
      attributes: [
        'eventId',
        [Sequelize.fn('COUNT', Sequelize.col('eventId')), 'count'],
      ],
      group: 'eventId',
    }).then((xs) => xs.map((x) => x.toJSON()))) as unknown[] as Array<{
      eventId: string
      count: number
    }>
    return entries.reduce((acc, x) => ({ ...acc, [x.eventId]: x.count }), {})
  }
}

EventApplication.init(
  {
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
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
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    formId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'forms',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    formSubmissionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'form_submissions',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'EventApplication',
    tableName: 'event_applications',
    timestamps: true,
    indexes: [
      {
        name: 'uniq__userid_eventid',
        fields: ['userId', 'eventId'],
        unique: true,
      },
    ],
  }
)

EventApplication.belongsTo(User, { foreignKey: 'creatorUserId' })

Event.hasMany(EventApplication, { foreignKey: 'eventId' })
EventApplication.belongsTo(Event, { foreignKey: 'eventId' })

Event.hasMany(EventCheckmark, { foreignKey: 'eventId' })
EventCheckmark.belongsTo(Event, { foreignKey: 'eventId' })
