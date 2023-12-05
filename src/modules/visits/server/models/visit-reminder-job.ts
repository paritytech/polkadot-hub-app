import { DataTypes, Model, CreationOptional } from 'sequelize'
import { sequelize } from '#server/db'
import { VisitReminderJob as VisitReminderJobModel } from '../../types'


type VisitReminderJobCreateFields = Pick<VisitReminderJobModel, 'officeId' | 'userId' | 'visitId'> & Partial<VisitReminderJobModel>

export class VisitReminderJob
  extends Model<VisitReminderJobModel, VisitReminderJobCreateFields>
  implements VisitReminderJobModel
{
  declare id: CreationOptional<string>
  declare officeId: string
  declare userId: string
  declare visitId: string
  declare failed: boolean
  declare metadata: any
  declare createdAt: CreationOptional<Date>
}

VisitReminderJob.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    officeId: {
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
    visitId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'visits',
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
    modelName: 'VisitReminderJob',
    tableName: 'visit_reminder_jobs',
    timestamps: true,
    updatedAt: false,
  }
)
