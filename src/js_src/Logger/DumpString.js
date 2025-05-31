import $ from 'zest' // external global
import base64 from 'base64-arraybuffer'
import { DumpStringBinary } from './DumpStringBinary'
import { DumpStringEncoded } from './DumpStringEncoded'
import { StrDump } from './StrDump.js'
import { CharHighlight } from './CharHighlight.js'

var strDump = new StrDump()

export function DumpString (dump) {
  this.dumper = dump
  this.dumpStringBinary = new DumpStringBinary(this)
  this.dumpEncoded = new DumpStringEncoded(this)
  this.charHighlight = new CharHighlight(this)
}

DumpString.prototype.dump = function (val, abs) {
  var dumpOpts = this.dumper.getDumpOpts()
  if ($.isNumeric(val)) {
    this.dumper.checkTimestamp(val, abs)
  }
  val = abs
    ? this.dumpAbs(abs)
    : this.doDump(val)
  if (!dumpOpts.addQuotes) {
    dumpOpts.attribs.class.push('no-quotes')
  }
  return val
}

DumpString.prototype.doDump = function (val) {
  var opts = this.dumper.getDumpOpts()
  if (opts.sanitize) {
    val = val.escapeHtml()
  }
  if (opts.charHighlight) {
    val = this.charHighlight.highlight(val, opts.charHighlightTrim)
  }
  if (opts.visualWhiteSpace) {
    val = visualWhiteSpace(val)
  }
  return val
}

DumpString.prototype.dumpAbs = function (abs) {
  // console.log('DumpString.dumpAbs', JSON.parse(JSON.stringify(abs)))
  var dumpOpts = this.dumper.getDumpOpts()
  var parsed
  var val
  if (abs.typeMore === 'classname') {
    val = this.dumper.markupIdentifier(abs.value, 'classname')
    parsed = this.dumper.parseTag(val)
    $.extend(dumpOpts.attribs, parsed.attribs)
    return parsed.innerhtml
  }
  val = this.helper(abs.value)
  if (this.isEncoded(abs)) {
    return this.dumpEncoded.dump(val, abs)
  }
  if (abs.typeMore === 'binary') {
    return this.dumpStringBinary.dump(abs)
  }
  if (abs.strlen) {
    val += '<span class="maxlen">&hellip; ' + (abs.strlen - abs.value.length) + ' more bytes (not logged)</span>'
  }
  if (abs.prettifiedTag) {
    dumpOpts.postDump = function (val, dumpOpts) {
      return $('<span />', {
        class: 'value-container',
        'data-type': dumpOpts.type,
        html: '<span class="prettified">(prettified)</span> '
      }).append(val)
    }
  }
  return val
}

DumpString.prototype.dumpAsSubstitution = function (val) {
  // console.warn('dumpAsSubstitution', val)
  var ret = ''
  var diff
  if (typeof val === 'object') {
    if (val.typeMore === 'binary') {
      if (!val.value.length) {
        return 'Binary data not collected'
      }
      ret = this.dumper.parseTag(this.helper(val.value)).innerhtml
      diff = val.strlen - ret.split(' ').length
      if (diff) {
        ret += '[' + diff + ' more bytes (not logged)]'
      }
      return ret
    }
  }
  // we do NOT wrap in <span>...  log('<a href="%s">link</a>', $url)
  return this.dumper.dump(val, {
    tagName: null
  })
}

DumpString.prototype.helper = function (val) {
  var bytes = val.substr(0, 6) === '_b64_:'
    ? new Uint8Array(base64.decode(val.substr(6)))
    : strDump.encodeUTF16toUTF8(val)
  var dumpOpts = this.dumper.getDumpOpts()
  return strDump.dump(bytes, dumpOpts.sanitize)
  /*
  if (dumpOpts.visualWhiteSpace) {
    val = visualWhiteSpace(val)
  }
  return val
  */
}

DumpString.prototype.isEncoded = function (val) {
  return ['base64', 'form', 'json', 'serialized'].indexOf(val.typeMore) > -1
}

/**
 * Add whitespace markup
 *
 * \r, \n, & \t
 *
 * @param string str string which to add whitespace html markup
 *
 * @return string
 */
function visualWhiteSpace (str) {
  var i = 0
  var strBr = ''
  var searchReplacePairs = [
    [/\r/g, '<span class="ws_r"></span>'],
    [/\n/g, '<span class="ws_n"></span>' + strBr + '\n']
  ]
  var length = searchReplacePairs.length
  str = str.replace(/(\r\n|\r|\n)/g, function (match) {
    for (i = 0; i < length; i++) {
      match = match.replace(searchReplacePairs[i][0], searchReplacePairs[i][1])
    }
    return match
  })
    .replace(/(<br \/>)?\n$/g, '')
    .replace(/\t/g, '<span class="ws_t">\t</span>')
  return str
}
