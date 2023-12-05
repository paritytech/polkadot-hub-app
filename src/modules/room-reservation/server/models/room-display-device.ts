import { DataTypes, Model, CreationOptional } from 'sequelize'
import { sequelize } from '#server/db'
import { RoomDisplayDevice as RoomDisplayDeviceModel } from '#shared/types'

export class RoomDisplayDevice
  extends Model<RoomDisplayDeviceModel>
  implements RoomDisplayDeviceModel
{
  declare id: CreationOptional<string>
  declare confirmedByUserId: string
  declare confirmedAt: Date
  declare office: string
  declare roomId: string
  declare createdAt: Date
  declare updatedAt: Date
}

RoomDisplayDevice.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    confirmedByUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    confirmedAt: DataTypes.DATE,
    office: DataTypes.STRING,
    roomId: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'RoomDisplayDevice',
    tableName: 'room_display_devices',
    timestamps: true,
  }
)
