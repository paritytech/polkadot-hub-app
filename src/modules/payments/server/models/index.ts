import { User } from '#modules/users/server/models'
import { Payment } from './payment'

Payment.belongsTo(User, { foreignKey: 'userId' })

export { Payment }
