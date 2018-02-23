const toJson = require('./to-json')
const toDex = require('./to-dex')

module.exports = {
    DexData: toJson.DexData,
    convertToJsonFromFile: toJson.readFile,
    convertToJsonFromString: toJson.readText,
    convertToDex: toDex.convert
}
