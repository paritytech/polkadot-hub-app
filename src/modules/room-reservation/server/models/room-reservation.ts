import { DataTypes, Model, CreationOptional } from 'sequelize'
import { sequelize } from '#server/db'
import {
  RoomReservation as RoomReservationModel,
  RoomReservationStatus,
} from '#shared/types'

type RoomReservationCreateFields = Pick<
  RoomReservationModel,
  'startDate' | 'endDate' | 'status' | 'roomId' | 'office'
> &
  Partial<RoomReservationModel>

export class RoomReservation
  extends Model<RoomReservationModel, RoomReservationCreateFields>
  implements RoomReservationModel
{
  declare id: CreationOptional<string>
  declare creatorUserId: string | null
  declare userIds: string[]
  declare status: RoomReservationStatus
  declare office: string
  declare roomId: string
  declare startDate: Date
  declare endDate: Date
  declare createdAt: Date
  declare updatedAt: Date
}

RoomReservation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    creatorUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    userIds: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    office: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roomId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'RoomReservation',
    tableName: 'room_reservations',
    timestamps: true,
  }
)
