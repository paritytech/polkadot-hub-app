import { CreationOptional, DataTypes, Model } from 'sequelize'
import { sequelize } from '#server/db'
import { Form } from '#modules/forms/server/models'
import { User } from '#modules/users/server/models'
import {
  Event as EventModel,
  EventAdminResponse,
  EventApplication,
  EventApplicationStatus,
  EventCheckmark,
  EventPreview,
  EventPublicResponse,
} from '../../types'

type EventCreateFields = Pick<
  EventModel,
  | 'title'
  | 'creatorUserId'
  | 'description'
  | 'allowedRoles'
  | 'visibility'
  | 'offices'
  | 'content'
  | 'startDate'
  | 'endDate'
  | 'location'
  | 'locationLat'
  | 'locationLng'
  | 'coverImageUrl'
  | 'checklist'
  | 'confirmationRule'
  | 'notificationRule'
  | 'responsibleUserIds'
> &
  Partial<EventModel>

export class Event
  extends Model<EventModel, EventCreateFields>
  implements EventModel
{
  declare id: CreationOptional<string>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare creatorUserId: EventModel['creatorUserId']
  declare title: EventModel['title']
  declare description: EventModel['description']
  declare visibility: EventModel['visibility']
  declare allowedRoles: EventModel['allowedRoles']
  declare formId: EventModel['formId']
  declare startDate: EventModel['startDate']
  declare endDate: EventModel['endDate']
  declare mapUrl: EventModel['mapUrl']
  declare address: EventModel['address']
  declare location: EventModel['location']
  declare locationLat: EventModel['locationLat']
  declare locationLng: EventModel['locationLng']
  declare coverImageUrl: EventModel['coverImageUrl']
  declare content: EventModel['content']
  declare checklist: EventModel['checklist']
  declare confirmationRule: EventModel['confirmationRule']
  declare externalIds: EventModel['externalIds']
  declare offices: EventModel['offices']
  declare notificationRule: EventModel['notificationRule']
  declare metadata: EventModel['metadata']
  declare responsibleUserIds: EventModel['responsibleUserIds']

  usePublicView(
    application: EventApplication | null,
    checkmarks: EventCheckmark[],
    form: Form | null
  ): EventPublicResponse {
    const data = this.toJSON()
    return {
      ...data,
      applicationStatus: application?.status || null,
      form: form
        ? {
            duplicationRule: form.duplicationRule,
            visibility: form.visibility,
          }
        : null,
      applicationId: application?.id || null,
      checklist: data.checklist.map((ch) => ({
        ...ch,
        checked: checkmarks.some((chm) => chm.checkboxId === ch.id),
      })),
    }
  }

  usePreviewView(): EventPreview {
    return {
      id: this.id,
      title: this.title,
      formId: this.formId,
    }
  }

  getApplicationStatus(user: User): EventApplicationStatus {
    if (this.confirmationRule === 'auto_confirm') {
      return EventApplicationStatus.Confirmed
    }
    return EventApplicationStatus.Opened
  }
}

Event.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
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
    formId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'forms',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    mapUrl: DataTypes.STRING(1000), // @fixme
    address: DataTypes.STRING(1000), // @fixme
    location: DataTypes.STRING(1000), // @fixme
    locationLat: DataTypes.FLOAT,
    locationLng: DataTypes.FLOAT,
    coverImageUrl: DataTypes.STRING(1000), // @fixme
    content: DataTypes.TEXT,
    checklist: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    confirmationRule: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    notificationRule: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    externalIds: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    offices: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    responsibleUserIds: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'Event',
    tableName: 'events',
    timestamps: true,
  }
)
