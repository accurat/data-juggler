const pify = require('pify')
const fs = pify(require('fs-extra'))

module.exports = {
  /**
   * Save the data array of objects to json.
   */
  saveAsJSON: function(outputPath, filename, data) {
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath)
    }
    const outputPathWithFilename = `${outputPath}${filename}.json`
    fs.writeFileSync(outputPathWithFilename, JSON.stringify(data))
  },
}
