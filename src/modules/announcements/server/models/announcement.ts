import { sequelize } from '#server/db'
import { AnnouncementItem } from '#shared/types'
import { CreationOptional, DataTypes, Model } from 'sequelize'

export class Announcement
  extends Model<AnnouncementItem>
  implements AnnouncementItem
{
  declare id: CreationOptional<string>
  declare title: AnnouncementItem['title']
  declare content: AnnouncementItem['content']
  declare creatorUserId: AnnouncementItem['creatorUserId']
  declare scheduledAt: AnnouncementItem['scheduledAt']
  declare expiresAt: AnnouncementItem['expiresAt']
  declare offices: AnnouncementItem['offices']
  declare allowedRoles: AnnouncementItem['allowedRoles']
  declare visibility: AnnouncementItem['visibility']
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

Announcement.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    content: DataTypes.TEXT,
    offices: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    visibility: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    allowedRoles: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    creatorUserId: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    scheduledAt: DataTypes.DATE,
    expiresAt: DataTypes.DATE,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Announcements',
    tableName: 'announcements',
    timestamps: true,
  }
)
