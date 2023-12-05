// @ts-check
const { Sequelize, DataTypes } = require('sequelize')

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'events',
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
          mapUrl: DataTypes.STRING(1000),
          address: DataTypes.STRING(1000),
          location: DataTypes.STRING(1000),
          locationLat: DataTypes.FLOAT,
          locationLng: DataTypes.FLOAT,
          coverImageUrl: DataTypes.STRING(1000),
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
        { transaction }
      )
      await queryInterface.createTable(
        'event_applications',
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
          userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'CASCADE',
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
          eventId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'events',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          formId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
              model: 'forms',
              key: 'id',
            },
            onDelete: 'SET NULL',
          },
          formSubmissionId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
              model: 'form_submissions',
              key: 'id',
            },
            onDelete: 'SET NULL',
          },
          createdAt: DataTypes.DATE,
          updatedAt: DataTypes.DATE,
        },
        { transaction }
      )
      await queryInterface.addIndex('event_applications', {
        name: 'uniq__userid_eventid',
        fields: ['userId', 'eventId'],
        unique: true,
        transaction,
      })
      await queryInterface.createTable(
        'event_checkmarks',
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
          eventId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'events',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          checkboxId: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          createdAt: DataTypes.DATE,
        },
        { transaction }
      )
      await queryInterface.createTable(
        'event_checklist_reminder_jobs',
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
          eventId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'events',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          failed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
          },
          metadata: {
            type: DataTypes.JSONB,
            defaultValue: {},
          },
          createdAt: DataTypes.DATE,
        },
        { transaction }
      )
    })
  },
  async down({ context: queryInterface }) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('event_checklist_reminder_jobs', {
        transaction,
      })
      await queryInterface.dropTable('event_checkmarks', { transaction })
      await queryInterface.dropTable('event_applications', { transaction })
      await queryInterface.dropTable('events', { transaction })
    })
  },
}
