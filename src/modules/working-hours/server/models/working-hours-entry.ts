import { DataTypes, Model, CreationOptional, Sequelize } from 'sequelize'
import { sequelize } from '#server/db'
import {
  WorkingHoursEntry as WorkingHoursEntryModel,
  WorkingHoursEntryCreationRequest,
} from '../../types'

type WorkingHoursEntryCreateFields = WorkingHoursEntryCreationRequest &
  Pick<WorkingHoursEntryModel, 'userId'>

export class WorkingHoursEntry
  extends Model<WorkingHoursEntryModel, WorkingHoursEntryCreateFields>
  implements WorkingHoursEntryModel
{
  declare id: CreationOptional<string>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare userId: WorkingHoursEntryModel['userId']
  declare date: WorkingHoursEntryModel['date']
  declare startTime: WorkingHoursEntryModel['startTime']
  declare endTime: WorkingHoursEntryModel['endTime']
}

WorkingHoursEntry.init(
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'WorkingHoursEntry',
    tableName: 'working_hours_entries',
    timestamps: true,
  }
)
