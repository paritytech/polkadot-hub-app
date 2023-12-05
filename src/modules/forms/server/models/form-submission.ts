import { CreationOptional, DataTypes, Model, Sequelize } from 'sequelize'
import { sequelize } from '#server/db'
import {
  FormSubmission as FormSubmissionModel,
  PublicFormSubmission,
} from '../../types'

type FormSubmissionCreateFields = Pick<
  FormSubmissionModel,
  'userId' | 'creatorUserId' | 'formId' | 'answers'
> &
  Partial<FormSubmissionModel>

export class FormSubmission
  extends Model<FormSubmissionModel, FormSubmissionCreateFields>
  implements FormSubmissionModel
{
  declare id: CreationOptional<string>
  declare userId: FormSubmissionModel['userId']
  declare creatorUserId: FormSubmissionModel['creatorUserId']
  declare formId: FormSubmissionModel['formId']
  declare answers: FormSubmissionModel['answers']
  declare metadata: FormSubmissionModel['metadata']
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>

  static async countByFormId(): Promise<Record<string, number>> {
    const entries = (await this.findAll({
      attributes: [
        'formId',
        [Sequelize.fn('COUNT', Sequelize.col('formId')), 'count'],
      ],
      group: 'formId',
    }).then((xs) => xs.map((x) => x.toJSON()))) as unknown[] as Array<{
      formId: string
      count: number
    }>
    return entries.reduce((acc, x) => ({ ...acc, [x.formId]: x.count }), {})
  }

  static async findOneForUser(
    formId: string,
    userId: string
  ): Promise<FormSubmission | null> {
    return this.findOne({ where: { formId, userId } })
  }

  usePublicFormSubmissionView(): PublicFormSubmission {
    // TODO: rename
    return {
      id: this.id,
      answers: this.answers,
    }
  }
}

FormSubmission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
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
    formId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'forms',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    answers: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'FormSubmission',
    tableName: 'form_submissions',
    timestamps: true,
  }
)
