import { DataTypes, Model, CreationOptional } from 'sequelize'
import { sequelize } from '#server/db'
import { PublicHoliday as PublicHolidayModel } from '../../types'

type PublicHolidayModelCreation = Omit<
  PublicHolidayModel,
  'id' | 'createdAt' | 'updatedAt'
>

export class PublicHoliday
  extends Model<PublicHolidayModel, PublicHolidayModelCreation>
  implements PublicHolidayModel
{
  declare id: CreationOptional<PublicHolidayModel['id']>
  declare name: PublicHolidayModel['name']
  declare date: PublicHolidayModel['date']
  declare calendarId: PublicHolidayModel['calendarId']
  declare externalIds: PublicHolidayModel['externalIds']
  declare createdAt: CreationOptional<PublicHolidayModel['createdAt']>
  declare updatedAt: CreationOptional<PublicHolidayModel['updatedAt']>
}

PublicHoliday.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    calendarId: {
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
    modelName: 'PublicHoliday',
    tableName: 'public_holidays',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['date', 'calendarId'],
      },
    ],
  }
)
