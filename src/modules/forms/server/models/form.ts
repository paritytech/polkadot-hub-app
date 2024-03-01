import { DataTypes, Model, CreationOptional } from 'sequelize'
import { sequelize } from '#server/db'
import {
  Form as FormModel,
  PublicForm,
  FormData,
  FormSubmissionAnswer,
  FormBlock,
} from '../../types'

type FormCreateFields = Pick<
  FormModel,
  | 'title'
  | 'description'
  | 'content'
  | 'visibility'
  | 'allowedRoles'
  | 'duplicationRule'
  | 'creatorUserId'
  | 'responsibleUserIds'
> &
  Partial<FormModel>

export class Form
  extends Model<FormModel, FormCreateFields>
  implements FormModel
{
  declare id: CreationOptional<string>
  declare visibility: FormModel['visibility']
  declare allowedRoles: FormModel['allowedRoles']
  declare duplicationRule: FormModel['duplicationRule']
  declare title: FormModel['title']
  declare description: FormModel['description']
  declare content: FormModel['content']
  declare metadataFields: FormModel['metadataFields']
  declare creatorUserId: FormModel['creatorUserId']
  declare responsibleUserIds: FormModel['responsibleUserIds']
  declare purgeSubmissionsAfterDays: FormModel['purgeSubmissionsAfterDays']
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>

  usePublicFormView(): PublicForm {
    // TODO: rename
    return {
      id: this.id,
      title: this.title,
      duplicationRule: this.duplicationRule,
      content: this.content,
      visibility: this.visibility,
    }
  }

  listInputBlocks(): FormBlock[] {
    return this.content
      .map((x) => x.blocks)
      .flat()
      .filter((x) => x.type === 'input')
  }

  formatAnswers(answers: FormData): FormSubmissionAnswer[] {
    const blocks = this.content
      .map((x) => x.blocks)
      .flat()
      .filter((x) => x.type === 'input')
    const result: FormSubmissionAnswer[] = []
    blocks.forEach((block) => {
      if (answers.hasOwnProperty(block.id)) {
        result.push({
          id: block.id,
          question: block.title || '',
          value: answers[block.id],
        })
      }
    })
    return result
  }
}

Form.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    visibility: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    allowedRoles: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false,
    },
    duplicationRule: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: DataTypes.TEXT,
    content: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    metadataFields: {
      type: DataTypes.JSONB,
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
    responsibleUserIds: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
    },
    purgeSubmissionsAfterDays: DataTypes.INTEGER,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Form',
    tableName: 'forms',
    timestamps: true,
  }
)
