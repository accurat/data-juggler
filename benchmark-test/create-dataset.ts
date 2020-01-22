const _ = require('lodash')
const chance = require('chance').Chance()
const { saveAsJSON, getFilesizeBytes, formatBytes } = require('./utils.ts')

const createDate = () => {
  const year = _.random(1900, 2020)
  const month = _.random(1, 12)
  const day = _.random(1, 31)
  const date = `${year}-${month}-${day}`
  return date
}

function createAndSaveDataset(rowsCounter: number, outpathPath: string, filename: string) {
  const dataset = _.times(rowsCounter).map((index: number) => {
    return {
      id: index,
      firstName: chance.first(),
      lastName: chance.last(),
      birthday: createDate(),
      death: createDate(),
      authorCountry: '',
      age: chance.age(),
      gender: chance.gender(),
      cf: chance.cf(),
      cpf: chance.cpf(),
      ssn: chance.ssn(),
      animal: chance.animal(),
      avatarUrl: chance.avatar(),
      city: chance.city(),
      color: chance.color(),
      ip: chance.ip(),
      profession: chance.profession(),
      company: chance.company(),
      email: chance.email(),
      twitter: chance.twitter(),
      address: chance.address(),
      country: chance.country(),
      coordinates: chance.coordinates(),
      songQuote: chance.paragraph(),
      bookQuote: chance.paragraph(),
      hashtag: chance.hashtag(),
      phone: chance.phone(),
      street: chance.street(),
      weekday: chance.weekday(),
    }
  })
  saveAsJSON(outpathPath, filename, dataset)
}

async function createDataset() {
  const filename = 'dataset'
  const rowsCounter = 5000
  const outpathPath = './benchmark-test/datasets/'
  const completePath = `${outpathPath}${filename}.json`
  const dataset = await createAndSaveDataset(rowsCounter, outpathPath, filename)
  const bytes = getFilesizeBytes(completePath)
  console.log(`Created dataset [${formatBytes(bytes)}]: ${completePath}`)
}

createDataset()