const pify = require('pify')
const fs = pify(require('fs-extra'))

module.exports = {
  /**
   * Save the data array of objects to json.
   */
  saveAsJSON: function(outputPath: string, filename: string, dataset: any) {
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath)
    }
    const outputPathWithFilename = `${outputPath}${filename}.json`
    fs.writeFileSync(outputPathWithFilename, JSON.stringify(dataset))
  },

  /**
   * Format ms to 'h m s ms'.
   */
  formatMs: function(ms: number) {
    const milliseconds = Math.floor((ms % 1000) / 100)
    let seconds = Math.floor((ms / 1000) % 60)
    let minutes = Math.floor((ms / (1000 * 60)) % 60)
    let hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
  
    hours = (hours < 10) ? 0 + hours : hours
    minutes = (minutes < 10) ? 0 + minutes : minutes
    seconds = (seconds < 10) ? 0 + seconds : seconds
  
    return `${hours}h ${minutes}m ${seconds}s ${milliseconds}ms`
  },

  /**
   * Return file weight in bytes.
   */
  getFilesizeBytes: function(filename: string) {
    const stats = fs.statSync(filename)
    return stats.size
  },

  /**
   * Returns formatted bytes.
   */
  formatBytes: function(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const dm = decimals < 0 ? 0 : decimals
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }
}