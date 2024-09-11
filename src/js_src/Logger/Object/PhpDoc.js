import $ from 'jquery' // external global

export function PhpDoc (valDumper) {
  this.valDumper = valDumper
}

PhpDoc.prototype.dump = function (abs) {
  var count
  var html = ''
  var i
  var tagData
  var tagName
  var tagEntries
  for (tagName in abs.phpDoc) {
    tagEntries = abs.phpDoc[tagName]
    if (!Array.isArray(tagEntries)) {
      continue
    }
    for (i = 0, count = tagEntries.length; i < count; i++) {
      tagData = tagEntries[i]
      tagData.tagName = tagName
      html += this.dumpTag(tagData)
    }
  }
  if (html.length) {
    html = '<dt>phpDoc</dt>' + html
  }
  return html
}

PhpDoc.prototype.dumpTag = function (tagData) {
  var i
  var tagName = tagData.tagName
  var value = ''
  switch (tagName) {
    case 'author':
      value = this.dumpTagAuthor(tagData)
      break
    case 'link':
    case 'see':
      value = this.dumpTagSeeLink(tagData)
      break
    default:
      delete tagData.tagName
      /*
      for (i in tagData) {
        value += tagData[i] === null
          ? ''
          : tagData[i] + ' '
      }
      */
      value = Object.values(tagData).join(' ')
      value = this.valDumper.dumpPhpDocStr(value)
  }
  return '<dd class="phpDoc phpdoc-' + tagName + '">' +
    '<span class="phpdoc-tag">' + this.valDumper.dumpPhpDocStr(tagName) + '</span>' +
    '<span class="t_operator">:</span> ' +
    value +
    '</dd>'
}

PhpDoc.prototype.dumpTagAuthor = function (tagData) {
  var html = this.valDumper.dumpPhpDocStr(tagData.name)
  if (tagData.email) {
    html += ' &lt;<a href="mailto:' + tagData.email + '">' + this.valDumper.dumpPhpDocStr(tagData.email) + '</a>&gt;'
  }
  if (tagData.desc) {
    // desc is non-standard for author tag
    html += ' ' + this.valDumper.dumpPhpDocStr(tagData.desc)
  }
  return html
}

PhpDoc.prototype.dumpTagSeeLink = function (tagData) {
  var desc = this.valDumper.dumpPhpDocStr(tagData.desc || tagData.uri)
  if (tagData.uri) {
    return '<a href="' + tagData.uri + '" target="_blank">' + desc + '</a>'
  }
  // see tag
  return this.valDumper.markupIdentifier(tagData.fqsen) + (desc ? ' ' + desc : '')
}
