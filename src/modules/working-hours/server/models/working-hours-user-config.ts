import { DataTypes, Model, CreationOptional, Sequelize } from 'sequelize'
import { sequelize } from '#server/db'
import { WorkingHoursUserConfig as WorkingHoursUserConfigModel } from '../../types'

type WorkingHoursUserConfigCreateFields = Pick<
  WorkingHoursUserConfigModel,
  'userId' | 'value'
> &
  Pick<WorkingHoursUserConfigModel, 'userId'>

export class WorkingHoursUserConfig
  extends Model<WorkingHoursUserConfigModel, WorkingHoursUserConfigCreateFields>
  implements WorkingHoursUserConfigModel
{
  declare id: CreationOptional<string>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare userId: WorkingHoursUserConfigModel['userId']
  declare value: WorkingHoursUserConfigModel['value']
}

WorkingHoursUserConfig.init(
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
      unique: true,
    },
    value: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'WorkingHoursUserConfig',
    tableName: 'working_hours_user_configs',
    timestamps: true,
  }
)
