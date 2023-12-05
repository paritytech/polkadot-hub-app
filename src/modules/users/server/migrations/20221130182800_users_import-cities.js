// @ts-check
const https = require('https')
const uuid = require('uuid')
const { DataTypes } = require('sequelize')

const FILE_URL =
  'https://gist.githubusercontent.com/ba1uev/afbb4051bffb67cb18783a67087a6e09/raw/de9b2f6ec360600a4647f3e54e208898bca77622/cities'

module.exports = {
  async up({ context: queryInterface, appConfig }) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'cities',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          asciiName: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          altNames: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
            defaultValue: [],
          },
          countryCode: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          timezone: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          coordinates: {
            type: DataTypes.ARRAY(DataTypes.FLOAT),
            allowNull: false,
            defaultValue: [0, 0],
          },
        },
        { transaction }
      )

      let cities = []
      try {
        console.log('Downloading cities.csv file. Please wait...')
        const file = await fetchFile(FILE_URL)
        cities = parseFile(file)
        console.log(`Download completed: ${cities.length} cities.`)
      } catch (err) {
        console.log(
          `Unable to download the cities.csv file. The cities will not be added to the database.`
        )
      }
      if (!cities.length) return

      const batchSize = 1e3
      const batchesNumber = Math.ceil(cities.length / batchSize)
      for (let i = 0; i < batchesNumber; i++) {
        const batch = cities.slice(i * batchSize, i * batchSize + batchSize)
        console.log(`👉 inserting cities: ${i + 1}/${batchesNumber}`)
        await queryInterface.bulkInsert('cities', batch, { transaction })
      }
    })
  },
  async down({ context: queryInterface }) {
    await queryInterface.dropTable('cities')
  },
}

function fetchFile(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const dataChunks = []
        if (res.statusCode && res.statusCode >= 400) {
          reject(res.statusCode)
          return
        }
        res.on('data', (chunk) => {
          dataChunks.push(chunk)
        })
        res.on('end', () => {
          const result = Buffer.concat(dataChunks).toString('utf-8')
          resolve(result)
        })
      })
      .on('error', (err) => {
        console.error('Error downloading file:', err.message)
      })
  })
}

function parseFile(rawString) {
  const lines = rawString.split('\n')
  const fields = lines[0].split(';')
  const data = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].split(';')
    const datum = {}
    fields.forEach((field, fieldIndex) => {
      datum[field] = line[fieldIndex]
    })
    data.push({
      id: uuid.v4(),
      name: datum.name,
      asciiName: datum.asciiName,
      countryCode: datum.countryCode,
      timezone: datum.timezone,
      altNames: parseArray(datum['altNames']),
      coordinates: parseArray(datum['coordinates']).map(parseFloat),
    })
  }
  return data
}

function parseArray(x) {
  return (x || '').split(',')
}
