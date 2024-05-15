import { CreationOptional, DataTypes, Model } from 'sequelize'
import { sequelize } from '#server/db'
import { PaymentItem, PaymentItemCreateFields } from '#shared/types'

export class Payment
  extends Model<PaymentItem, PaymentItemCreateFields>
  implements PaymentItem
{
  declare id: CreationOptional<string>
  declare userId: PaymentItem['userId']
  declare status: PaymentItem['status']
  declare currency: PaymentItem['currency']
  declare amount: PaymentItem['amount']
  declare reference: PaymentItem['reference']
  declare providerReferenceId: PaymentItem['providerReferenceId']
  declare purchasedProductReference: PaymentItem['purchasedProductReference']
  declare provider: PaymentItem['provider']
  // declare allowedRoles: PaymentItem['allowedRoles']
  // declare visibility: PaymentItem['visibility']
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

Payment.init(
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
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
    },
    reference: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    provider: {
      // Stripe/ DOT
      type: DataTypes.STRING,
      allowNull: false,
    },
    providerReferenceId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
    purchasedProductReference: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    // visibility: {
    //   type: DataTypes.STRING,
    //   allowNull: false,
    // },
    // allowedRoles: {
    //   type: DataTypes.ARRAY(DataTypes.STRING),
    //   defaultValue: [],
    //   allowNull: false,
    // },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true,
  }
)
