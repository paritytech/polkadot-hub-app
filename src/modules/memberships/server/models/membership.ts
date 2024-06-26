import { sequelize } from '#server/db'
import { Membership as MembershipModel } from '#shared/types'
import { CreationOptional, DataTypes, Model } from 'sequelize'

type MembershipCreateFields = Pick<
  MembershipModel,
  | 'creatorUserId'
  | 'editedByUserId'
  | 'title'
  | 'description'
  | 'price'
  | 'currency'
  | 'durationInDays'
  | 'nftCollectionId'
  | 'image'
>

// @todo add active
// @todo add type (casual, fixed, flexible, etc ) ??

export class Membership
  extends Model<MembershipModel, MembershipCreateFields>
  implements MembershipModel
{
  declare id: CreationOptional<string>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare creatorUserId: MembershipModel['creatorUserId']
  declare editedByUserId: MembershipModel['editedByUserId']
  declare title: MembershipModel['title']
  declare description: MembershipModel['description']
  declare price: MembershipModel['price']
  declare image: MembershipModel['image']
  declare currency: MembershipModel['currency']
  declare durationInDays: MembershipModel['durationInDays']
  declare nftCollectionId: MembershipModel['nftCollectionId']
  declare offices: MembershipModel['offices']
}

Membership.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    creatorUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    editedByUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: DataTypes.TEXT,
    price: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nftCollectionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    durationInDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    offices: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'Membership',
    tableName: 'memberships',
    timestamps: true,
  }
)
