import { DataTypes, Model, CreationOptional } from 'sequelize'
import { sequelize } from '#server/db'
import {
  GuestInvite as GuestInviteModel,
  PublicGuestInvite,
} from '../../types'

type GuestInviteCreateFields = Pick<
  GuestInviteModel,
  'code' | 'email' | 'fullName' | 'status' | 'creatorUserId' | 'office'
> &
  Partial<GuestInviteModel>

export class GuestInvite
  extends Model<GuestInviteModel, GuestInviteCreateFields>
  implements GuestInviteModel
{
  declare id: CreationOptional<string>
  declare creatorUserId: GuestInviteModel['creatorUserId']
  declare code: GuestInviteModel['code']
  declare fullName: GuestInviteModel['fullName']
  declare email: GuestInviteModel['email']
  declare dates: GuestInviteModel['dates']
  declare office: GuestInviteModel['office']
  declare areaId: GuestInviteModel['areaId']
  declare deskId: GuestInviteModel['deskId']
  declare status: GuestInviteModel['status']
  declare createdAt: GuestInviteModel['createdAt']
  declare updatedAt: GuestInviteModel['updatedAt']

  usePublicGuestInviteView(): PublicGuestInvite {
    // TODO: rename
    return {
      code: this.code,
      fullName: this.fullName,
      office: this.office,
    }
  }
}

GuestInvite.init(
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    office: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    areaId: DataTypes.STRING,
    deskId: DataTypes.STRING,
    creatorUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    dates: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'GuestInvite',
    tableName: 'guest_invites',
    timestamps: true,
    indexes: [
      {
        name: 'uniq__useremail_status',
        fields: ['userEmail', 'status'],
        unique: true,
      },
    ],
  }
)
