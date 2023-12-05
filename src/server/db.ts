import { Sequelize } from 'sequelize'
import config from './config'

export const sequelize = new Sequelize(config.databaseUri, {
  logging: config.logDbQueries ? console.log : false,
})
