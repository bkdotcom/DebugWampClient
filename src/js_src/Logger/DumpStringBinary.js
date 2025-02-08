function chunkSplit(str, length, separator) {
  if (typeof separator === 'undefined') {
    separator = '\n'
  }
  return str.match(new RegExp('.{1,' + length + '}', 'g')).map(function (chunk) {
    return chunk + separator
  }).join('')
}

export function DumpStringBinary (dumpString) {
  this.dumpString = dumpString
  // this.dumpEncoded = new DumpStringEncoded(this)
  // this.charHighlight = new CharHighlight(this)
}

DumpStringBinary.prototype.dump = function (abs) {
  var dumpOpts = this.dumpString.dumper.getDumpOpts()
  var tagName = dumpOpts.tagName
  var str = this.dumpBasic(abs)
  var strLenDiff = abs.strlen - abs.strlenValue
  if (abs.strlenValue && strLenDiff) {
      str += '<span class="maxlen">&hellip; ' + strLenDiff + ' more bytes (not logged)</span>'
  }
  if (abs.brief) {
      return this.dumpBrief(str, abs)
  }
  if (abs.percentBinary > 33 || abs.contentType) {
      dumpOpts.postDump = this.dumpPost(abs, tagName)
  }
  return str
}

DumpStringBinary.prototype.dumpBasic = function (abs) {
  var self = this
  if (abs.strlenValue === 0) {
    return ''
  }
  return typeof abs.chunks !== 'undefined'
    ? abs.chunks.map(function (chunk) {
        return chunk[0] === 'utf8'
          ? self.dumpString.dump(chunk[1])
          : '<span class="binary">\\x' + chunk[1].replace(' ', ' \\x') + '</span>'
      }).join('')
    : '<span class="binary">'
        + chunkSplit(abs.value, 3 * 32, '<br />').slice(0, -6)
        + '</span>'
}

DumpStringBinary.prototype.dumpBrief = function (str, abs) {
    // @todo display bytes
    return abs.contentType
      ? '<span class="t_keyword">string</span>' +
          '<span class="text-muted">(' + abs.contentType + ')</span><span class="t_punct colon">:</span> '
      : str
}

DumpStringBinary.prototype.dumpPost = function (abs, tagName) {
  var self = this
  return function (str) {
    var parsed = self.dumpString.dumper.parseTag(str)
    var lis = []
    if (parsed.tag === 'td') {
      str = parsed.innerhtml
    }
    if (abs.contentType) {
      lis.push('<li>mime type = <span class="content-type t_string">' + abs.contentType + '</span></li>')
    }
    lis.push('<li>size = <span class="t_int">' + abs.strlen + '</span></li>')
    lis.push(abs.value.length
      ? '<li class="t_string">' + str + '</li>'
      : '<li>Binary data not collected</li>')
    str = '<span class="t_keyword">string</span><span class="text-muted">(binary)</span>' +
      '<ul class="list-unstyled value-container" data-type="' + abs.type + '" data-type-more="binary">' +
         lis.join('\n') +
      '</ul>'
    if (tagName === 'td') {
      str = '<td>' + str + '</td>'
    }
    return str
  }
}
