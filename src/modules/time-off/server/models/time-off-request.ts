import { DataTypes, Model, CreationOptional } from 'sequelize'
import { sequelize } from '#server/db'
import { TimeOffRequest as TimeOffRequestModel } from '../../types'

type TimeOffRequestModelCreation = Omit<
  TimeOffRequestModel,
  'id' | 'createdAt' | 'updatedAt'
>

export class TimeOffRequest
  extends Model<TimeOffRequestModel, TimeOffRequestModelCreation>
  implements TimeOffRequestModel
{
  declare id: CreationOptional<string>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare status: TimeOffRequestModel['status']
  declare unit: TimeOffRequestModel['unit']
  declare dates: TimeOffRequestModel['dates']
  declare unitsPerDay: TimeOffRequestModel['unitsPerDay']
  declare startDate: TimeOffRequestModel['startDate']
  declare endDate: TimeOffRequestModel['endDate']
  declare userId: TimeOffRequestModel['userId']
  declare externalIds: TimeOffRequestModel['externalIds']
}

TimeOffRequest.init(
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
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dates: {
      type: DataTypes.ARRAY(DataTypes.DATEONLY),
      defaultValue: [],
    },
    unitsPerDay: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    externalIds: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'TimeOffRequest',
    tableName: 'time_off_requests',
    timestamps: true,
  }
)
