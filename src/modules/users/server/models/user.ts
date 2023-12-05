import {
  CreationOptional,
  DataTypes,
  Filterable,
  FindOptions,
  Model,
  Op,
} from 'sequelize'
import { COUNTRIES } from '#server/constants'
import { sequelize } from '#server/db'
import {
  PublicUserProfile,
  User as UserModel,
  UserCompact,
  UserMe,
  AuthProvider,
  AuthAddressPair,
  AuthExtension,
} from '../../types'
import { Tag } from './tag'
import { appConfig } from '#server/app-config'
import dayjs from 'dayjs'

type UserCreateFields = Pick<UserModel, 'fullName' | 'email' | 'role'> &
  Partial<UserModel>

export class User
  extends Model<UserModel, UserCreateFields>
  implements UserModel
{
  declare id: CreationOptional<string>
  declare role: UserModel['role']
  declare fullName: UserModel['fullName']
  declare birthday: UserModel['birthday']
  declare email: UserModel['email']
  declare stealthMode: UserModel['stealthMode']
  declare avatar: UserModel['avatar']
  declare department: UserModel['department']
  declare team: UserModel['team']
  declare jobTitle: UserModel['jobTitle']
  declare division: UserModel['division']
  declare country: UserModel['country']
  declare city: UserModel['city']
  declare contacts: UserModel['contacts']
  declare bio: UserModel['bio']
  declare externalIds: UserModel['externalIds']
  declare authIds: UserModel['authIds']
  declare geodata: UserModel['geodata']
  declare isInitialised: UserModel['isInitialised']
  declare defaultLocation: UserModel['defaultLocation']
  declare scheduledToDelete: CreationOptional<Date>
  declare deletedAt: CreationOptional<Date>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>

  static findAllByIds(ids: string[]): Promise<User[]> {
    return this.findAllActive({
      where: { id: { [Op.in]: ids } },
    })
  }

  static findAllCompactView(
    where: Filterable<UserModel> = {}
  ): Promise<UserCompact[]> {
    return this.findAllActive({
      ...where,
      attributes: [
        'id',
        'fullName',
        'avatar',
        'email',
        'isInitialised',
        'role',
        'division',
      ],
    })
  }

  useMeView(): UserMe {
    const country = COUNTRIES.find((x) => x.code === this.country) || null
    return { ...this.toJSON(), countryName: country?.name || null }
  }

  // TODO: rename
  usePublicProfileView(
    this: User,
    tags?: Tag[],
    opts?: { forceHideGeoData: boolean }
  ): PublicUserProfile | { countryName: string | null } {
    let countryName: string | null = null
    const hideGeoData =
      opts?.forceHideGeoData || this.geodata?.doNotShareLocation
    if (hideGeoData) {
      this.geodata = {
        doNotShareLocation: hideGeoData,
        coordinates: [0, 0],
        timezone: '',
        gmtOffset: '',
      }
    } else {
      const country = COUNTRIES.find((x) => x.code === this.country) || null
      countryName = country?.name || null
    }
    return {
      id: this.id,
      fullName: this.fullName,
      birthday: this.birthday,
      email: this.email,
      avatar: this.avatar,
      department: this.department,
      team: this.team,
      jobTitle: this.jobTitle,
      country: hideGeoData ? null : this.country,
      countryName: hideGeoData ? null : countryName,
      city: hideGeoData ? null : this.city,
      contacts: this.contacts,
      bio: this.bio,
      geodata: this.geodata,
      defaultLocation: hideGeoData ? null : this.defaultLocation,
      tags,
      role: this.role,
    }
  }

  getAuthAddresses(this: User): string[] {
    const addresses: string[] = []
    for (const provider in this.authIds) {
      for (const extension in this.authIds[provider as AuthProvider]) {
        this.authIds[provider as AuthProvider][
          extension as AuthExtension
        ].forEach((x) => {
          addresses.push(x.address)
        })
      }
    }
    return addresses
  }

  addAuthId(
    this: User,
    provider: AuthProvider,
    extensionName: AuthExtension,
    authId: AuthAddressPair
  ): User {
    const authIds = this.toJSON().authIds
    if (!authIds[provider]) {
      // @todo more general adding of authIds
      authIds[provider] = {
        [AuthExtension.PolkadotJs]: [],
        [AuthExtension.Talisman]: [],
      }
    }
    if (!authIds[provider][extensionName]) {
      authIds[provider][extensionName] = []
    }
    authIds[provider][extensionName].push(authId)
    return this.set('authIds', authIds)
  }

  static async findAllActive(
    options: FindOptions<UserModel> = {}
  ): Promise<User[]> {
    return User.findAll(mergeOptionsNotDeleted(options))
  }

  static async findByPkActive(
    id: string,
    options: Omit<FindOptions<UserModel>, 'where'> = {}
  ): Promise<User | null> {
    return User.findByPk(id, mergeOptionsNotDeleted(options))
  }

  static async findOneActive(
    options: FindOptions<UserModel> = {}
  ): Promise<User | null> {
    return User.findOne(mergeOptionsNotDeleted(options))
  }

  async anonymize(this: User): Promise<User> {
    const shortId = this.id.split('-').reverse()[0]
    return this.set({
      role: appConfig.lowPriorityRole,
      fullName: shortId,
      birthday: null,
      email: `${shortId}@delet.ed`,
      stealthMode: true,
      avatar: null,
      team: null,
      jobTitle: null,
      country: null,
      city: null,
      bio: null,
      externalIds: { matrixRoomId: null },
      authIds: undefined,
      geodata: null,
      isInitialised: false,
      defaultLocation: null,
      deletedAt: dayjs().toDate(),
    }).save()
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    birthday: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stealthMode: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    avatar: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    jobTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    division: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    team: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contacts: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    authIds: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    externalIds: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    isInitialised: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    geodata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    defaultLocation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    scheduledToDelete: DataTypes.DATE,
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
  }
)

const mergeOptionsNotDeleted = (
  options: FindOptions
): FindOptions<UserModel> => {
  const { where = {}, ...other } = options
  return {
    where: {
      deletedAt: null,
      ...where,
    },
    ...other,
  }
}
