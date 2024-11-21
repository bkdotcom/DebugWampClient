import $ from 'jquery' // external global
import { DumpObject } from './dumpObject.js'
import { DumpString } from './dumpString.js'

var dumpOptStack = [
  /*
  {
    attribs
    opts
    postDump
    tagName
    type
    typeMore
  }
  */
]

export var Dump = function () {
  this.objectDumper = new DumpObject(this)
  this.stringDumper = new DumpString(this)
  this.ABSTRACTION = '\x00debug\x00'.parseHex()
  this.NOT_INSPECTED = '\x00notInspected\x00'.parseHex()
  this.RECURSION = '\x00recursion\x00'.parseHex()
  this.UNDEFINED = '\x00undefined\x00'.parseHex()
  this.TYPE_FLOAT_INF = '\x00inf\x00'.parseHex()
  this.TYPE_FLOAT_NAN = '\x00nan\x00'.parseHex()
}

Dump.prototype.checkTimestamp = function (val, abs) {
  var date
  var dumpOpts
  if (typeof abs === 'undefined' || abs.typeMore !== 'timestamp') {
    return
  }
  date = (new Date(val * 1000)).toString()
  dumpOpts = this.getDumpOpts()
  dumpOpts.postDump = function (dumped, opts) {
    if (opts.tagName === 'td') {
      opts.attribs.class = 't_' + opts.type
      return $('<td />', {
        class: 'timestamp value-container',
        title: date,
        html: $('<span />', opts.attribs).html(val)
      })
    }
    return $('<span />', {
      class: 'timestamp value-container',
      title: date,
      html: dumped
    })
  }
}

Dump.prototype.dump = function (val, opts) {
  var $wrap
  var dumpOpts = $.extend({
    addQuotes: true,
    attribs: {
      class: []
    },
    charHighlight: true,
    postDump: null, // set to function
    requestInfo: null,
    sanitize: true,
    tagName: '__default__',
    type: null,
    typeMore: null,
    visualWhiteSpace: true
  }, opts || {})
  var tagName
  var type // = this.getType(val)
  var method // = 'dump' + type[0].ucfirst()
  if (dumpOpts.type === null) {
    type = this.getType(val)
    dumpOpts.type = type[0]
    dumpOpts.typeMore = type[1]
  }
  if (typeof dumpOpts.attribs.class === 'string') {
    dumpOpts.attribs.class = [dumpOpts.attribs.class]
  }
  dumpOptStack.push(dumpOpts)
  method = 'dump' + dumpOpts.type.ucfirst()
  val = dumpOpts.typeMore === 'abstraction'
    ? this.dumpAbstraction(val)
    : this[method](val)
  dumpOpts = dumpOptStack.pop()
  tagName = dumpOpts.tagName
  if (tagName === '__default__') {
    tagName = 'span'
    if (dumpOpts.type === 'object') {
      tagName = 'div'
    }
    dumpOpts.tagName = tagName
  }
  if (tagName) {
    dumpOpts.attribs.class.push('t_' + dumpOpts.type)
    if (dumpOpts.typeMore && dumpOpts.typeMore !== 'abstraction') {
      dumpOpts.attribs['data-type-more'] = dumpOpts.typeMore.replace(/\0/g, '')
    }
    $wrap = $('<' + tagName + ' />')
      .addClass(dumpOpts.attribs.class.join(' '))
    delete dumpOpts.attribs.class
    $wrap.attr(dumpOpts.attribs)
    if (typeof dumpOpts.attribs.style !== 'undefined') {
      // .attr() doesn't apply style when single object passed
      $wrap.attr('style', dumpOpts.attribs.style)
    }
    val = $wrap.html(val)[0].outerHTML
  }
  if (dumpOpts.postDump) {
    val = dumpOpts.postDump(val, dumpOpts)
    if (typeof val === 'object') {
      val = val[0].outerHTML
    }
  }
  return val
}

Dump.prototype.dumpAbstraction = function (abs) {
  var dumpOpts = this.getDumpOpts()
  var k
  var method = 'dump' + abs.type.ucfirst()
  var simpleTypes = [
    'array',
    'bool',
    'float',
    'int',
    'null',
    'string'
  ]
  var value
  dumpOpts.attribs = abs.attribs || {}
  if (dumpOpts.attribs.class === undefined) {
    dumpOpts.attribs.class = []
  }
  for (k in dumpOpts) {
    if (abs[k] !== undefined) {
      dumpOpts[k] = abs[k]
    }
  }
  if (abs.options) {
    $.extend(dumpOpts, abs.options)
  }
  if (simpleTypes.indexOf(abs.type) > -1) {
    value = abs.value
    if (abs.type === 'array') {
      // remove value so not setting as dumpOpt or passing redundantly to dumpXxxx in 2nd param
      delete abs.value
    }
    for (k in abs) {
      if (dumpOpts[k] === undefined) {
        dumpOpts[k] = abs[k]
      }
    }
    dumpOpts.typeMore = abs.typeMore // likely null
    return this[method](value, abs)
  }
  return this[method](abs)
}

Dump.prototype.dumpArray = function (array, abs) {
  var html = ''
  var i
  var key
  var keyShow
  var keys = array.__debug_key_order__ || Object.keys(array)
  var length = keys.length
  var absKeys = typeof abs?.keys === 'object'
    ? abs.keys
    : {}
  var dumpOpts = $.extend({
    asFileTree: false,
    expand: null,
    isMaxDepth: false,
    showListKeys: true
  }, this.getDumpOpts())
  var isList = (function () {
    for (i = 0; i < length; i++) {
      if (parseInt(keys[i], 10) !== i) {
        return false
      }
    }
    return true
  })()
  var showKeys = dumpOpts.showListKeys || !isList
  /*
  console.warn('dumpArray', {
    array: JSON.parse(JSON.stringify(array)),
    dumpOpts: JSON.parse(JSON.stringify(dumpOpts))
  })
  */
  if (dumpOpts.expand !== null) {
    dumpOpts.attribs['data-expand'] = dumpOpts.expand
  }
  if (dumpOpts.asFileTree) {
    dumpOpts.attribs.class.push('array-file-tree')
  }
  if (dumpOpts.isMaxDepth) {
    return '<span class="t_keyword">array</span>' +
        ' <span class="t_maxDepth">*MAX DEPTH*</span>'
  }
  if (length === 0) {
    return '<span class="t_keyword">array</span>' +
        '<span class="t_punct">(</span>\n' +
        '<span class="t_punct">)</span>'
  }
  delete array.__debug_key_order__
  html = '<span class="t_keyword">array</span>' +
    '<span class="t_punct">(</span>\n' +
    '<ul class="array-inner list-unstyled">\n'
  for (i = 0; i < length; i++) {
    key = keys[i]
    keyShow = key
    if (absKeys.hasOwnProperty(key)) {
      keyShow = absKeys[key]
    }
    html += this.dumpArrayValue(keyShow, array[key], showKeys)
  }
  html += '</ul>' +
    '<span class="t_punct">)</span>'
  return html
}

Dump.prototype.dumpArrayValue = function (key, val, withKey) {
  var $key = $('<span></span>')
  if (withKey === false) {
    return this.dump(val, { tagName: 'li' })
  }
  $key
    .addClass('t_key')
    .html(this.dump(key, {
      tagName : null
    }))
  if (/^\d+$/.test(key)) {
    $key.addClass('t_int')
  }
  return '<li>' +
    $key[0].outerHTML +
      '<span class="t_operator">=&gt;</span>' +
      this.dump(val) +
    '</li>'
}

Dump.prototype.dumpBool = function (val) {
  return val ? 'true' : 'false'
}

Dump.prototype.dumpCallable = function (abs) {
  return (!abs.hideType ? '<span class="t_type">callable</span> ' : '') +
    this.markupIdentifier(abs, 'function')
}

Dump.prototype.dumpConst = function (abs) {
  return this.dumpIdentifier({
    backedValue: abs.value,
    type: 'identifier',
    typeMore: 'const',
    value: abs.name,
  })
}

Dump.prototype.dumpFloat = function (val, abs) {
  this.checkTimestamp(val, abs)
  if (val === this.TYPE_FLOAT_INF) {
    return 'INF'
  }
  if (val === this.TYPE_FLOAT_NAN) {
    return 'NaN'
  }
  return val
}

Dump.prototype.dumpIdentifier = function (abs) {
  var dumpOpts = this.getDumpOpts()
  dumpOpts.attribs.title = [undefined, this.UNDEFINED].indexOf(abs.backedValue) < 0
    ? 'value: ' + this.dump(abs.backedValue)
    : null
  return this.markupIdentifier(abs.value, abs.typeMore)
}

Dump.prototype.dumpInt = function (val, abs) {
  return this.dumpFloat(val, abs)
}

Dump.prototype.dumpNotInspected = function () {
  return 'NOT INSPECTED'
}

Dump.prototype.dumpNull = function () {
  return 'null'
}

Dump.prototype.dumpObject = function (abs) {
  var dumpOpts = this.getDumpOpts()
  dumpOpts.attribs['data-accessible'] = abs.scopeClass === abs.className
    ? 'private'
    : 'public'
  return this.objectDumper.dump(abs)
}

Dump.prototype.dumpRecursion = function () {
  return '<span class="t_keyword">array</span> <span class="t_recursion">*RECURSION*</span>'
}

Dump.prototype.dumpResource = function (abs) {
  return abs.value
}

Dump.prototype.dumpString = function (val, abs) {
  return this.stringDumper.dump(val, abs)
}

Dump.prototype.dumpUndefined = function () {
  return ''
}

Dump.prototype.dumpUnknown = function () {
  return '<span class="t_unknown">unknown type</span>'
}

Dump.prototype.dumpPhpDocStr = function (str) {
  if (str === '' || str === undefined || str === null) {
    return ''
  }
  return this.dump(str, {
    sanitize: false,
    tagName: null,
    type: 'string',
    visualWhiteSpace: false,
  })
}

Dump.prototype.getClassDefinition = function (name) {
  return JSON.parse(JSON.stringify(
    this.getRequestInfo().$container.data('classDefinitions')[name]
  ))
}

Dump.prototype.getRequestInfo = function () {
  return dumpOptStack[0].requestInfo
}

Dump.prototype.getDumpOpts = function () {
  return dumpOptStack[dumpOptStack.length - 1]
}

Dump.prototype.getType = function (val) {
  if (val === null) {
    return ['null', null]
  }
  if (typeof val === 'boolean') {
    return ['bool', val ? 'true' : 'false']
  }
  if (typeof val === 'string') {
    if (val === this.NOT_INSPECTED) {
      return ['notInspected', null]
    }
    if (val === this.RECURSION) {
      return ['recursion', null]
    }
    if (val === this.UNDEFINED) {
      return ['undefined', null]
    }
    if ($.isNumeric(val)) {
      return ['string', 'numeric']
    }
    return ['string', null]
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return ['int', null]
    }
    return ['float', null]
  }
  if (typeof val === 'object') { // already checked for null
    if (val.debug === this.ABSTRACTION) {
      return [val.type, 'abstraction']
    }
    return ['array', null]
  }
  if (typeof val === 'undefined') {
    return ['undefined', null]
  }
}

Dump.prototype.parseIdentifier = function (val, what) {
  var matches = [] // str.match()
  var regExp = new RegExp('^(.+)(::|->)(.+)$', 'u')
  var parts = {
    className: '',
    identifier: '',
    namespace: '',
    operator: '',
  }
  if (typeof val === 'object' && val.debug === this.ABSTRACTION) {
    val = val.value
  }
  parts.className = val
  if (Array.isArray(val)) {
    parts.className = val[0]
    parts.identifier = val[1]
    parts.operator = '::'
  } else if (matches = val.match(regExp)) {
    parts.className = matches[1]
    parts.operator = matches[2]
    parts.identifier = matches[3]
  } else if (['const', 'function'].indexOf(what) > -1) {
    matches = val.match(/^(.+\\)?(.+)$/)
    parts.className = ''
    parts.identifier = matches[2]
    parts.namespace = matches[1]
  }
  return parts
}

Dump.prototype.markupIdentifier = function (val, what, tag, attribs) {
  var parts = this.parseIdentifier(val, what)
  var split = []
  what = what || 'classname'
  tag = tag || 'span'
  attribs = attribs || {}

  if (parts.className) {
    parts.className = this.dumpPhpDocStr(parts.className)
    split = parts.className.split('\\')
    if (split.length > 1) {
      parts.className = split.pop()
      parts.className = '<span class="namespace">' + split.join('\\') + '\\</span>' +
        parts.className
    }
    attribs.class = 'classname'
    parts.className = $('<' + tag + '/>', attribs).html(parts.className)[0].outerHTML
  } else if (parts.namespace) {
    attribs.class = 'namespace'
    parts.className = $('<' + tag + '/>', attribs).html(parts.namespace)[0].outerHTML
  }
  if (parts.operator) {
    parts.operator = '<span class="t_operator">' + parts.operator.escapeHtml() + '</span>'
  }
  if (parts.identifier) {
    parts.identifier = this.dumpPhpDocStr(parts.identifier)
    parts.identifier = '<span class="t_name">' + parts.identifier + '</span>'
  }
  return [parts.className, parts.identifier].filter(function (val) {
    return val !== ''
  }).join(parts.operator)
}

Dump.prototype.parseTag = function parseTag (html) {
  var $node = $(html)
  var parsed = {
    tag: $node[0].tagName.toLowerCase(),
    attribs: {},
    innerhtml: $node[0].innerHTML
  }
  $.each($node[0].attributes, function () {
    if (this.specified) {
      parsed.attribs[this.name] = this.value
    }
  })
  parsed.attribs.class = parsed.attribs.class
    ? parsed.attribs.class.split(' ')
    : []
  return parsed
}
