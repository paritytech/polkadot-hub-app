import { DataTypes, Model, CreationOptional } from 'sequelize'
import { sequelize } from '#server/db'
import {
  DefaultWorkingHoursEntry as DefaultWorkingHoursEntryModel,
  DefaultWorkingHoursEntryCreationRequest,
} from '../../types'

type DefaultWorkingHoursEntryCreateFields =
  DefaultWorkingHoursEntryCreationRequest &
    Pick<DefaultWorkingHoursEntryModel, 'userId'>

export class DefaultWorkingHoursEntry
  extends Model<
    DefaultWorkingHoursEntryModel,
    DefaultWorkingHoursEntryCreateFields
  >
  implements DefaultWorkingHoursEntryModel
{
  declare id: CreationOptional<string>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare userId: DefaultWorkingHoursEntryModel['userId']
  declare startTime: DefaultWorkingHoursEntryModel['startTime']
  declare endTime: DefaultWorkingHoursEntryModel['endTime']
}

DefaultWorkingHoursEntry.init(
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
    modelName: 'DefaultDefaultWorkingHoursEntry',
    tableName: 'default_working_hours_entries',
    timestamps: true,
  }
)
