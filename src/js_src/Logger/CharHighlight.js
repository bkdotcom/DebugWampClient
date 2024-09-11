import $ from 'jquery' // external global

export var CharHighlight = function (dumpString) {
  var self = this
  this.dumpString = dumpString
  fetch('./?action=charData')
    .then(function(response) {
      return response.json()
    }).then(function(charData) {
      self.charData = charData
      self.charRegex = self.buildCharRegex()
    })
}

CharHighlight.prototype.findChars = function (str) {
  if (typeof str !== 'string') {
    return []
  }
  return (str.match(this.charRegex) || []).filter(function (value, index, array) {
    // only return if first occurrence
    return array.indexOf(value) === index
  })
}

CharHighlight.prototype.highlight = function (str) {
  var self = this
  if (typeof str !== 'string') {
    return str
  }
  return str.replace(this.charRegex, function (char) {
    var info = $.extend({
      char: char,
      class: 'unicode',
      codePoint: char.codePointAt(0).toString(16),
      desc: '',
      replaceWith: char,
    }, self.charData[char])
    return $('<span></span>', {
      class: info.class,
      'data-abbr': info.abbr
        ? info.abbr
        : null,
      'data-code-point': info.codePoint,
      title: [
          char.codePointAt(0) < 0x80
            ? '\\x' + info.codePoint.padStart(2, '0')
            : 'U-' + info.codePoint,
          info.desc,
      ].filter(function (val) {
        return val.length > 0
      }).join(': '),
      html: info.replaceWith
    })[0].outerHTML
  })
}

CharHighlight.prototype.buildCharRegex = function () {
  var charList = '[' +  Object.keys(this.charData).join('') + ']'
  var charControl = '[^\\P{C}\\r\\n\\t]'   // \p{C} includes \r, \n, & \t
  var charSeparator = '[^\\P{Z} ]'         // \p{Z} includes space (but not \r, \n, & \t)
  var regExTemp = new RegExp('(' + charControl + '|' + charSeparator + ')', 'ug')
  // remove chars that are covered via character properties regExs
  charList = charList.replace(regExTemp, '')
  return new RegExp('(' + charList + '|' + charControl + '|' + charSeparator + ')', 'ug')
}
