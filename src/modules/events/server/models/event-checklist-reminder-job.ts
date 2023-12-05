import { DataTypes, Model, CreationOptional } from 'sequelize'
import { sequelize } from '#server/db'
import { EventChecklistReminderJob as EventChecklistReminderJobModel } from '../../types'


type EventChecklistReminderJobCreateFields = Pick<EventChecklistReminderJobModel, 'userId' | 'eventId'> & Partial<EventChecklistReminderJobModel>

export class EventChecklistReminderJob
  extends Model<EventChecklistReminderJobModel, EventChecklistReminderJobCreateFields>
  implements EventChecklistReminderJobModel
{
  declare id: CreationOptional<string>
  declare userId: string
  declare eventId: string
  declare failed: boolean
  declare metadata: any
  declare createdAt: CreationOptional<Date>
}

EventChecklistReminderJob.init(
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
    failed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'EventChecklistReminderJob',
    tableName: 'event_checklist_reminder_jobs',
    timestamps: true,
    updatedAt: false,
  }
)
