/**
 * Merge defaults with user options
 *
 * @param {Object} defaults Default settings
 * @param {Object} options User options
 * @returns {Object} Merged values of defaults and options
 */
export function extend (defaults, options) {
  var extended = {}
  var i
  var length
  var prop
  for (i = 0, length = arguments.length; i < length; i++) {
    for (prop in arguments[i]) {
      if (Object.prototype.hasOwnProperty.call(arguments[i], prop)) {
        extended[prop] = arguments[i][prop]
      }
    }
  }
  return extended
}
