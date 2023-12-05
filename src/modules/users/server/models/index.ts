import { User } from './user'
import { Session } from './session'
import { City } from './city'
import { Tag } from './tag'
import { UserTag } from './user-tag'

// FIXME:TODO: make the declaration of model relations more universal
User.belongsToMany(Tag, {
  through: 'user_tags',
  as: 'tags',
  foreignKey: 'userId'
})
Tag.belongsToMany(User, {
  through: 'user_tags',
  as: 'users',
  foreignKey: 'tagId'
})
UserTag.belongsTo(User)
UserTag.belongsTo(Tag)

export {
  User,
  Session,
  City,
  Tag,
  UserTag
}