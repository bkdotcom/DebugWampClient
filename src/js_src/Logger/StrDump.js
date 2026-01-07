/**
 * Nutshell:  working with strings in Javascript is a PITA
 *
 * No way of knowing if \xED (an invalid utf-8 byte) was passed or \xC3\xAD
 */

/*
eslint
  "no-control-regex": "off",
  "no-extend-native": ["error", { "exceptions": ["String"] }],
  "no-misleading-character-class": "off"
*/

String.prototype.ucfirst = function () {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

String.prototype.padLeft = function (pad, len) {
  var diff = len - this.length
  var i
  var str = ''
  if (diff < 1) {
    return this
  }
  for (i = 0; i < diff; i++) {
    str += pad
  }
  return str + this
}

export var StrDump = function () {
  this.str = ''
  this.bytes = null
}

/**
 * Convert a unicode code point to an array of byte(s)
 *
 * 0x10348 will be converted into [0xF0 0x90 0x8D 0x88]
 *
 * @param integer cp unicode code point
 *
 * @return integer[]
 */
StrDump.prototype.cpToUtf8Bytes = function (cp) {
  if (cp < 0x80) {
    return [
      cp & 0x7F,
    ]
  } else if (cp < 0x800) {
    return [
      ((cp >> 6) & 0x1F) | 0xC0,
      (cp & 0x3F) | 0x80,
    ]
  } else if (cp < 0x10000) {
    return [
      ((cp >> 12) & 0x0F) | 0xE0,
      ((cp >> 6) & 0x3F) | 0x80,
      (cp & 0x3F) | 0x80,
    ]
  }
  return [
    ((cp >> 18) & 0x07) | 0xF0,
    ((cp >> 12) & 0x3F) | 0x80,
    ((cp >> 6) & 0x3F) | 0x80,
    (cp & 0x3F) | 0x80,
  ]
}

StrDump.prototype.dump = function (bytes, sanitize) {
  var curI = 0
  var isUtf8
  var info = {}
  var len
  var curBlockType = 'utf8' // utf8, utf8special, other
  var newBlockType = null
  var curBlockStart = 0 // string offset
  var percentOther = 0
  var strNew = ''
  var strBlock = ''
  this.setBytes(bytes)
  while (this.curI < this.stats.bytesLen) {
    curI = this.curI // store before gets incremented
    isUtf8 = this.isOffsetUtf8(info)
    newBlockType = isUtf8
      ? 'utf8'
      : 'other'
    if (isUtf8) {
      strBlock += info.char
    }
    if (newBlockType !== curBlockType) {
      len = curI - curBlockStart
      this.incStat(curBlockType, len)
      if (curBlockType === 'utf8') {
        if (sanitize) {
          strBlock = strBlock.escapeHtml()
        }
        strNew += strBlock
        strBlock = ''
      } else {
        strNew += this.dumpBlock(this.bytes.slice(curBlockStart, this.curI - 1), curBlockType)
      }
      curBlockStart = curI
      curBlockType = newBlockType
    }
  }
  len = this.stats.bytesLen - curBlockStart
  this.incStat(curBlockType, len)
  percentOther = this.stats.bytesOther / this.stats.bytesLen * 100
  if (percentOther > 33 || this.stats.bytesOther >= 5) {
    strNew = this.dumpBlock(this.bytes, 'other', { prefix: false })
  } else if (curBlockType === 'utf8') {
    if (sanitize) {
      strBlock = strBlock.escapeHtml()
    }
    strNew += strBlock
  } else {
    strNew += this.dumpBlock(this.bytes.slice(curBlockStart, this.stats.bytesLen), curBlockType)
  }
  return strNew
}

StrDump.prototype.bytesToHex = function (bytes, prefix) {
  return Array.prototype.slice.call(bytes).map(function (val) {
    var ret = val.toString(16).padLeft('0', 2)
    if (prefix) {
      ret = prefix + ret
    }
    return ret
  }).join(' ')
}

/**
 * Private method
 */
StrDump.prototype.dumpBlock = function (bytes, blockType, options) {
  var str = ''
  // var title
  options = options || {}
  if (typeof options.prefix === 'undefined') {
    options.prefix = true
  }
  if (blockType === 'other') {
    str = this.bytesToHex(bytes, options.prefix ? '\\x' : '')
    str = '<span class="binary">' + str + '</span>'
  }
  return str
}

/**
 * String.fromCharCode that supports > U+FFFF
 *
 * @param integer code unicode value
 */
StrDump.prototype.fromCodepoint = function (code) {
  if (code > 0xFFFF) {
    code -= 0x10000
    return String.fromCharCode(0xD800 + (code >> 10), 0xDC00 + (code & 0x3FF))
  }
  return String.fromCharCode(code)
}

StrDump.prototype.encodeUTF16toUTF8 = function (str) {
  var bytes = []
  var codepoints = this.utf16ToUnicode(str)
  var i
  var length = codepoints.length
  for (i = 0; i < length; i++) {
    bytes.push.apply(bytes, this.cpToUtf8Bytes(codepoints[i]))
  }
  return bytes
}

/**
 * @return array of codepoints
 *
 * @see http://jonisalonen.com/2012/from-utf-16-to-utf-8-in-javascript/
 * @see https://github.com/dcodeIO/utfx/blob/master/src/utfx.js
 */
StrDump.prototype.utf16ToUnicode = function (str) {
  var i
  var code1 = null
  var code2 = null
  var codes = []
  for (i = 0; i < str.length; i++) {
    code1 = str.charCodeAt(i)
    if (code1 >= 0xD800 && code1 <= 0xDFFF) {
      if (i + 1 < str.length) {
        i++
        code2 = str.charCodeAt(i)
        if (code2 >= 0xDC00 && code2 <= 0xDFFF) {
          codes.push((code1 - 0xD800) * 0x400 + code2 - 0xDC00 + 0x10000)
          code2 = null
          continue
        }
      }
    }
    codes.push(code1)
  }
  if (code2 !== null) {
    codes.push(code2)
  }
  return codes
}

StrDump.prototype.incStat = function (stat, inc) {
  if (stat === 'utf8special') {
    stat = 'bytesSpecial'
  } else {
    stat = 'bytes' + stat.ucfirst()
  }
  this.stats[stat] += inc
}

/**
 * sets
 *   info.char
 *   info.codepoint
 */
StrDump.prototype.isOffsetUtf8 = function (info) {
  var len = this.stats.bytesLen
  var byte1 = this.bytes[this.curI]
  var byte2 = this.curI + 1 < len ? this.bytes[this.curI + 1] : null
  var byte3 = this.curI + 2 < len ? this.bytes[this.curI + 2] : null
  var byte4 = this.curI + 3 < len ? this.bytes[this.curI + 3] : null
  var numBytes = 1
  info.codepoint = null
  info.char = null
  if (byte1 < 0x80) {
    // 0xxxxxxx
    numBytes = 1
  } else if ((byte1 & 0xE0) === 0xC0) {
    // 110xxxxx 10xxxxxx
    if (
      this.curI + 1 >= len ||
      (byte2 & 0xC0) !== 0x80 ||
      (byte1 & 0xFE) === 0xC0 // overlong
    ) {
      this.curI += 1
      return false
    }
    numBytes = 2
  } else if ((byte1 & 0xF0) === 0xE0) {
    // 1110xxxx 10xxxxxx 10xxxxxx
    if (
      this.curI + 2 >= len ||
      (byte2 & 0xC0) !== 0x80 ||
      (byte3 & 0xC0) !== 0x80 ||
      (byte1 === 0xE0 && (byte2 & 0xE0) === 0x80) || // overlong
      (byte1 === 0xED && (byte2 & 0xE0) === 0xA0) // UTF-16 surrogate (U+D800 - U+DFFF)
    ) {
      this.curI += 1
      return false
    }
    numBytes = 3
  } else if ((byte1 & 0xF8) === 0xF0) {
    // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
    if (
      this.curI + 3 >= len ||
      (byte2 & 0xC0) !== 0x80 ||
      (byte3 & 0xC0) !== 0x80 ||
      (byte4 & 0xC0) !== 0x80 ||
      (byte1 === 0xF0 && (byte2 & 0xF0) === 0x80) || // overlong
      (byte1 === 0xF4 && byte2 > 0x8F) ||
      byte1 > 0xF4 // > U+10FFFF
    ) {
      this.curI += 1
      return false
    }
    numBytes = 4
  } else {
    this.curI += 1
    return false
  }
  info.codepoint = this.Utf8BytesToCodePoint(this.bytes, { offset: this.curI })
  info.char = this.fromCodepoint(info.codepoint)
  /*
  console.log({
    curI: this.curI,
    curINew: this.curI + numBytes,
    numBytes: numBytes,
    codepoint: info.codepoint,
    char: info.char,
    isSpecial: info.isSpecial
  })
  */
  this.curI += numBytes
  return true
}

StrDump.prototype.Utf8BytesToCodePoint = function (bytes, offsetObj) {
  var cp = bytes[offsetObj.offset]
  var i
  var numBytes = 1
  var code2
  if (cp >= 0x80) {
    // otherwise 0xxxxxxx
    if (cp < 0xe0) {
      // 110xxxxx
      numBytes = 2
      // cp -= 0xC0
    } else if (cp < 0xf0) {
      // 1110xxxx
      numBytes = 3
      // cp -= 0xE0
    } else if (cp < 0xf8) {
      // 11110xxx
      numBytes = 4
      // cp -= 0xF0
    }
    cp = cp - 192 - (numBytes > 2 ? 32 : 0) - (numBytes > 3 ? 16 : 0)
    for (i = 1; i < numBytes; i++) {
      code2 = bytes[offsetObj.offset + i] - 128 // 10xxxxxx
      cp = cp * 64 + code2
    }
  }
  offsetObj.offset += numBytes
  return cp
}

StrDump.prototype.setBytes = function (bytes) {
  this.curI = 0
  this.bytes = bytes
  this.stats = {
    bytesLen: this.bytes.length,
    bytesOther: 0,
    bytesSpecial: 0, // special UTF-8
    bytesUtf8: 0, // includes ASCII
  }
}

/*
StrDump.prototype.getUtf16Bytes = function (str) {
  var bytes = []
  var char
  var b1
  var b1
  var i
  var l = str.length
  try {
    for(i = 0; i < l; i++) {
      char = str.charCodeAt(i)
      b1 = char >>> 8
      b2 = char & 0xFF
      if (b1) {
        bytes.push(b1)
      }
      bytes.push(b2)
    }
  } catch (e) {
    console.warn('e', e)
  }
  return bytes
}
*/

/**
 * Check UTF-8 string (or single-character) against list of special characters or regular-expressions
 *
 * @param string $str String to check
 *
 * @return boolean
 */
/*
StrDump.prototype.hasSpecial = function (str) {
  var i
  var special
  for (i = 0; i < this.special.length; i++) {
    special = this.special[i]
    if (special instanceof RegExp) {
      if (special.test(str)) {
        return true
      }
    } else if (str.indexOf(special) > -1) {
      return true
    }
  }
  return false
}
*/

/*
StrDump.prototype.bytesToString = function (bytes) {
  var str = ''
  var info = {}
  this.setBytes(bytes)
  while (this.curI < this.stats.bytesLen) {
    this.isOffsetUtf8(info)
    str += info.char
  }
  return str
}
*/
