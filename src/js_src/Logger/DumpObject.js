import $ from 'jquery' // external global
import mergeWith from 'lodash/mergeWith'

export function DumpObject (dump) {
  this.dumper = dump

  // GENERAL
  this.PHPDOC_OUTPUT = 2
  this.OBJ_ATTRIBUTE_OUTPUT = 8
  this.BRIEF = 4194304

  // CONSTANTS
  this.CONST_COLLECT = 32
  this.CONST_OUTPUT = 64
  this.CONST_ATTRIBUTE_OUTPUT = 256

  // CASE
  this.CASE_COLLECT = 512
  this.CASE_OUTPUT = 1024
  this.CASE_ATTRIBUTE_OUTPUT = 4096

  // PROPERTIES
  this.PROP_ATTRIBUTE_OUTPUT = 16384

  // METHODS
  this.METHOD_COLLECT = 32768
  this.METHOD_OUTPUT = 65536
  this.METHOD_ATTRIBUTE_OUTPUT = 262144
  this.METHOD_DESC_OUTPUT = 524288
  this.PARAM_ATTRIBUTE_OUTPUT = 2097152
}

function sort(obj, sortBy) {
  var count
  var i
  var name
  var objNew = {}
  var sortInfo = []
  var sortVisOrder = ['public', 'magic', 'magic-read', 'magic-write', 'protected', 'private', 'debug']
  for (name in obj) {
    sortInfo.push({
      name: name,
      visibility: obj[name].visibility
    })
  }
  sortInfo.sort(function (itemA, itemB) {
    var ret = 0;
    if (itemA.name === '__construct') {
      return -1
    } else if (itemB.name === '__construct') {
      return 1
    }
    if (sortBy === 'visibility') {
      if (sortVisOrder.indexOf(itemA.visibility) < sortVisOrder.indexOf(itemB.visibility)) {
        ret = -1
      } else if (sortVisOrder.indexOf(itemA.visibility) > sortVisOrder.indexOf(itemB.visibility)) {
        ret = 1
      }
    }
    if (ret === 0 && ['name', 'visibility'].indexOf(sortBy) > -1) {
      ret = itemA.name.localeCompare(itemB.name)
    }
    return ret
  })
  for (i = 0, count = sortInfo.length; i < count; i++) {
    name = sortInfo[i].name
    objNew[name] = obj[name]
  }
  return objNew
}

DumpObject.prototype.dump = function (abs) {
  // console.info('dumpObject', abs)
  var classDefinition
  var html = ''
  var i = 0
  var count
  var self = this
  var strClassname = ''
  var noInherit = ['attributes', 'cases', 'constants', 'methods', 'properties']
  try {
    classDefinition = this.dumper.getClassDefinition(abs.classDefinition)
    if (abs.isRecursion || abs.isExcluded) {
      for (i = 0; i < noInherit.length; i++) {
        classDefinition[noInherit[i]] = {}
      }
    }
    abs = JSON.parse(JSON.stringify(mergeWith({}, classDefinition, abs, function (objValue, srcValue) {
      if (objValue === null || srcValue === null) {
        return
      }
      if (typeof objValue === 'object' && Object.keys(objValue).length === 0 && typeof srcValue === 'object') {
        return srcValue
      }
    })))
    for (i = 0, count = noInherit.length; i < count; i++) {
      if (Object.keys(abs[noInherit[i]]).length < 2) {
        continue
      }
      abs[noInherit[i]] = sort(abs[noInherit[i]], abs.sort)
    }
    if (typeof abs.cfgFlags === 'undefined') {
      abs.cfgFlags = 0x3FFFFF // 21 bits
    }
    strClassname = this.dumpClassname(abs)
    if (abs.isRecursion) {
      return strClassname +
        ' <span class="t_recursion">*RECURSION*</span>'
    }
    if (abs.isMaxDepth) {
      return strClassname +
        ' <span class="t_maxDepth">*MAX DEPTH*</span>'
    }
    if (abs.isExcluded) {
      return strClassname +
        ' <span class="excluded">(not inspected)</span>'
    }
    if (abs.cfgFlags & this.BRIEF && abs.implements.indexOf('UnitEnum') > -1) {
      return strClassname
    }
    html = this.dumpToString(abs) +
      strClassname +
      '<dl class="object-inner">' +
        (abs.isFinal
          ? '<dt class="t_modifier_final">final</dt>'
          : ''
        ) +
        (abs.extends && abs.extends.length
          ? '<dt>extends</dt>' +
            abs.extends.map(function (classname) {
              return '<dd class="extends">' + self.dumper.markupIdentifier(classname) + '</dd>'
            }).join('')
          : ''
        ) +
        (abs.implements && abs.implements.length
          ? '<dt>implements</dt>' +
            '<dd class="interface">' + abs.implements.join('</dd><dd class="interface">') + '</dd>'
          : ''
        ) +
        this.dumpAttributes(abs) +
        this.dumpConstants(abs) +
        this.dumpCases(abs) +
        this.dumpProperties(abs, { viaDebugInfo: abs.viaDebugInfo }) +
        this.dumpMethods(abs) +
        this.dumpPhpDoc(abs) +
      '</dl>'
  } catch (e) {
    console.warn('e', e)
  }
  return html
}

DumpObject.prototype.dumpClassname = function (abs) {
  var phpDoc = abs.phpDoc || {}
  var strClassname = abs.className
  var title = ((phpDoc.summary || '') + '\n\n' + (phpDoc.desc || '')).trim()
  var phpDocOut = abs.cfgFlags & this.PHPDOC_OUTPUT
  var $span
  if (abs.implements.indexOf('UnitEnum') > -1) {
    // strClassname += '::' + abs.properties.name.value
    $span = $('<span />', {
      class: 't_const',
      html: this.dumper.markupIdentifier(strClassname + '::' + abs.properties.name.value)
    })
    if (title && title.length) {
      $span.attr('title', title)
    }
    return $span[0].outerHTML
  }
  return this.dumper.markupIdentifier(strClassname, {
    title: phpDocOut && title.length ? title : null
  })
}

DumpObject.prototype.dumpToString = function (abs) {
  // var objToString = ''
  var val = ''
  var len
  var title
  var valAppend = ''
  var $toStringDump
  if (typeof abs.stringified !== 'undefined' && abs.stringified !== null) {
    val = abs.stringified
  } else if (typeof abs.methods.__toString !== 'undefined' && abs.methods.__toString.returnValue) {
    val = abs.methods.__toString.returnValue
  }
  if (typeof val === 'object') {
    len = val.strlen
    val = val.value
  } else {
    len = val.length
  }
  if (len === 0) {
    return ''
  }
  if (len > 100) {
    val = val.substring(0, 100)
    valAppend = '&hellip; <i>(' + (len - 100) + ' more bytes)</i>'
  }
  $toStringDump = $(this.dumper.dump(val))
  title = (!abs.stringified ? '__toString() : ' : '') + $toStringDump.prop('title')
  if (title === '__toString() : ') {
    title = '__toString()'
  }
  return '<span class="' + $toStringDump.prop('class') + ' t_stringified" ' +
    (title.length ? 'title="' + title + '"' : '') +
    '>' +
    $toStringDump.html() +
    valAppend +
    '</span> '
}

DumpObject.prototype.dumpAttributes = function (abs) {
  var html = ''
  var self = this
  var args = []
  if (abs.attributes === undefined) {
    return ''
  }
  if ((abs.cfgFlags & this.OBJ_ATTRIBUTE_OUTPUT) !== this.OBJ_ATTRIBUTE_OUTPUT) {
    return ''
  }
  $.each(abs.attributes, function (key, attribute) {
    args = []
    html += '<dd class="attribute">'
    html += self.dumper.markupIdentifier(attribute.name)
    if (Object.keys(attribute.arguments).length) {
      $.each(attribute.arguments, function (i, val) {
        args.push(
          (i.match(/^\d+$/) === null
            ? '<span class="t_parameter-name">' + i + '</span><span class="t_punct">:</span>'
            : '') +
          self.dumper.dump(val)
        )
      })
      html += '<span class="t_punct">(</span>' +
        args.join('<span class="t_punct">,</span> ') +
        '<span class="t_punct">)</span>'
    }
    html += '</dd>'
  })
  return html.length
    ? '<dt class="attributes">attributes</dt>' + html
    : ''
}

DumpObject.prototype.dumpCases = function (abs) {
  var html = ''
  var self = this
  var $dd
  var attributeOut = abs.cfgFlags & this.CASE_ATTRIBUTE_OUTPUT
  var caseCollect = abs.cfgFlags & this.CASE_COLLECT
  var caseOut = abs.cfgFlags & this.CASE_OUTPUT
  var phpDocOut = abs.cfgFlags & this.PHPDOC_OUTPUT
  if (abs.implements.indexOf('UnitEnum') < 0) {
    return ''
  }
  if (!caseOut) {
    return ''
  }
  if (!caseCollect) {
    return '<dt class="cases">cases <i>not collected</i></dt>'
  }
  if (abs.cases.length === 0) {
    return '<dt class="cases"><i>no cases!</i></dt>'
  }
  html = '<dt class="cases">cases</dt>'
  $.each(abs.cases, function (key, info) {
    var title = phpDocOut
      ? info.desc
      : null
    $dd = $('<dd class="case">' +
      '<span class="t_identifier">' + key + '</span>' +
      (info.value !== null
        ? ' <span class="t_operator">=</span> ' +
          self.dumper.dump(info.value)
        : ''
      ) +
      '</dd>'
    )
    if (title && title.length) {
      $dd.find('.t_identifier').attr('title', title)
    }
    if (attributeOut && info.attributes && info.attributes.length) {
      $dd.attr('data-attributes', JSON.stringify(info.attributes))
    }
    html += $dd[0].outerHTML
  })
  return html
}

DumpObject.prototype.dumpConstants = function (abs) {
  var html = ''
  var self = this
  var constCollect = abs.cfgFlags & this.CONST_COLLECT
  var attributeOut = abs.cfgFlags & this.CONST_ATTRIBUTE_OUTPUT
  var constOut = abs.cfgFlags & this.CONST_OUTPUT
  var phpDocOut = abs.cfgFlags & this.PHPDOC_OUTPUT
  var name
  var info
  if (!constOut) {
    return ''
  }
  if (!constCollect) {
    return '<dt class="constants">constants <i>not collected</i></dt>'
  }
  if (!abs.constants) {
    return ''
  }
  html = '<dt class="constants">constants</dt>'
  for (name in abs.constants) {
    info = abs.constants[name]
    var $dd = $('<dd class="constant"></dd>').addClass(info.visibility)
    var vis = typeof info.visibility === 'object'
      ? info.visibility
      : [info.visibility]
    var isInherited = info.declaredLast && info.declaredLast !== abs.className
    var isPrivateAncestor = $.inArray('private', vis) >= 0 && isInherited
    var classes = {
      inherited: isInherited && !isPrivateAncestor,
      isFinal: info.isFinal,
      'private-ancestor': isPrivateAncestor
    }
    $dd.html(
      self.dumpConstantModifiers(info) +
      '<span class="t_identifier"' + (phpDocOut && info.desc ? ' title="' + info.desc.escapeHtml() + '"' : '') + '>' + name + '</span> ' +
      '<span class="t_operator">=</span> ' +
      self.dumper.dump(info.value)
    )
    $.each(classes, function (classname, useClass) {
      if (useClass) {
        $dd.addClass(classname)
      }
    })
    if (attributeOut && info.attributes && info.attributes.length) {
      $dd.attr('data-attributes', JSON.stringify(info.attributes))
    }
    if (isInherited || isPrivateAncestor) {
      $dd.attr('data-inherited-from', info.declaredLast)
    }
    html += $dd[0].outerHTML
  }
  return html
}

DumpObject.prototype.dumpConstantModifiers = function (info) {
  var html = ''
  var vis = typeof info.visibility === 'object'
    ? info.visibility
    : [info.visibility]
  var modifiers = JSON.parse(JSON.stringify(vis))
  if (info.isFinal) {
    modifiers.push('final')
  }
  $.each(modifiers, function (i, modifier) {
    html += '<span class="t_modifier_' + modifier + '">' + modifier + '</span> '
  })
  return html
}

DumpObject.prototype.dumpPhpDoc = function (abs) {
  var count
  var html = ''
  var i
  var i2
  var info
  var key
  var tagEntries
  var value
  for (key in abs.phpDoc) {
    tagEntries = abs.phpDoc[key]
    if (!Array.isArray(tagEntries)) {
      continue
    }
    for (i = 0, count = tagEntries.length; i < count; i++) {
      info = tagEntries[i]
      if (key === 'author') {
        value = info.name
        if (info.email) {
          value += ' &lt;<a href="mailto:' + info.email + '">' + info.email + '</a>&gt;'
        }
        if (info.desc) {
          value += ' ' + info.desc.escapeHtml()
        }
      } else if (key === 'link') {
        value = '<a href="' + info.uri + '" target="_blank">' +
          (info.desc || info.uri).escapeHtml() +
          '</a>'
      } else if (key === 'see' && info.uri) {
        value = '<a href="' + info.uri + '" target="_blank">' +
          (info.desc || info.uri).escapeHtml() +
          '</a>'
      } else {
        value = ''
        for (i2 in info) {
          value += info[i2] === null
            ? ''
            : info[i2].escapeHtml() + ' '
        }
      }
      html += '<dd class="phpDoc phpdoc-' + key + '">' +
        '<span class="phpdoc-tag">' + key + '</span>' +
        '<span class="t_operator">:</span> ' +
        value +
        '</dd>'
    }
  }
  if (html.length) {
    html = '<dt>phpDoc</dt>' + html
  }
  return html
}

DumpObject.prototype.dumpProperties = function (abs, meta) {
  var html = ''
  var label = Object.keys(abs.properties).length
    ? 'properties'
    : 'no properties'
  var phpDocOut = abs.cfgFlags & this.PHPDOC_OUTPUT
  var attributeOut = abs.cfgFlags & this.PROP_ATTRIBUTE_OUTPUT
  var self = this
  var name
  var info
  if (meta.viaDebugInfo) {
    label += ' <span class="text-muted">(via __debugInfo)</span>'
  }
  html = '<dt class="properties">' + label + '</dt>'
  html += magicMethodInfo(abs, ['__get', '__set'])
  for (name in abs.properties) {
    info = abs.properties[name]
    var $dd = $('<dd></dd>').addClass(info.visibility).removeClass('debug')
    var vis = typeof info.visibility === 'object'
      ? info.visibility
      : [info.visibility]
    var isInherited = info.declaredLast && info.declaredLast !== abs.className
    var isPrivateAncestor = $.inArray('private', vis) >= 0 && isInherited
    var classes = {
      'debug-value': info.valueFrom === 'debug',
      'debuginfo-excluded': info.debugInfoExcluded,
      'debuginfo-value': info.valueFrom === 'debugInfo',
      forceShow: info.forceShow,
      inherited: isInherited && !isPrivateAncestor,
      isDynamic: info.declaredLast === null &&
        info.valueFrom === 'value' &&
        abs.className !== 'stdClass',
      isPromoted: info.isPromoted,
      isReadOnly: info.isReadOnly,
      isStatic: info.isStatic,
      'private-ancestor': isPrivateAncestor,
      property: true
    }
    name = name.replace('debug.', '')
    $dd.html(
      self.dumpPropertyModifiers(info) +
      (info.type
        ? ' <span class="t_type">' + info.type + '</span>'
        : ''
      ) +
      ' ' + self.dumper.dump(name, {
        addQuotes: /[\s\r\n]/.test(name) || name === '',
        attribs: {
          class: ['t_identifier'],
          title: phpDocOut && info.desc
            ? info.desc
            : null
        }
      }) +
      (info.value !== self.dumper.UNDEFINED
        ? ' <span class="t_operator">=</span> ' +
          self.dumper.dump(info.value)
        : ''
      )
    )
    $.each(classes, function (classname, useClass) {
      if (useClass) {
        $dd.addClass(classname)
      }
    })
    if (attributeOut && info.attributes && info.attributes.length) {
      $dd.attr('data-attributes', JSON.stringify(info.attributes))
    }
    if (isInherited || isPrivateAncestor) {
      $dd.attr('data-inherited-from', info.declaredLast)
    }
    html += $dd[0].outerHTML
  }
  return html
}

DumpObject.prototype.dumpPropertyModifiers = function (info) {
  var html = ''
  var vis = typeof info.visibility === 'object'
    ? info.visibility
    : [info.visibility]
  var modifiers = JSON.parse(JSON.stringify(vis))
  if (info.isReadOnly) {
    modifiers.push('readonly')
  }
  if (info.isStatic) {
    modifiers.push('static')
  }
  $.each(modifiers, function (i, modifier) {
    html += '<span class="t_modifier_' + modifier + '">' + modifier + '</span> '
  })
  return html
}

DumpObject.prototype.dumpMethods = function (abs) {
  var self = this
  var html = ''
  var label = Object.keys(abs.methods).length
    ? 'methods'
    : 'no methods'
  var methodCollect = abs.cfgFlags & this.METHOD_COLLECT
  var attributeOut = abs.cfgFlags & this.METHOD_ATTRIBUTE_OUTPUT
  var paramAttributeOut = abs.cfgFlags & this.PARAM_ATTRIBUTE_OUTPUT
  var methodOut = abs.cfgFlags & this.METHOD_OUTPUT
  var phpDocOut = abs.cfgFlags & this.PHPDOC_OUTPUT
  var name
  var info
  if (!methodOut) {
    return ''
  }
  if (!methodCollect) {
    return '<dt class="methdos">methods not collected</dt>'
  }
  html = '<dt class="methods">' + label + '</dt>'
  html += magicMethodInfo(abs, ['__call', '__callStatic'])
  for (name in abs.methods) {
    info = abs.methods[name]
    var $dd = $('<dd class="method"></dd>').addClass(info.visibility)
    var isInherited = info.declaredLast && info.declaredLast !== abs.className
    var paramStr = self.dumpMethodParams(info.params, {
      attributeOut: paramAttributeOut,
      phpDocOut: phpDocOut
    })
    var classes = {
      inherited: isInherited,
      isDeprecated: info.isDeprecated,
      isFinal: info.isFinal,
      isStatic: info.isStatic
    }
    $.each(classes, function (classname, useClass) {
      if (useClass) {
        $dd.addClass(classname)
      }
    })
    $dd.html(
      self.dumpMethodModifiers(info) +
      ' <span class="t_identifier"' +
        (phpDocOut && info.phpDoc && info.phpDoc.summary !== null
          ? ' title="' + info.phpDoc.summary.escapeHtml() + '"'
          : ''
        ) +
        '>' + name + '</span>' +
      '<span class="t_punct">(</span>' + paramStr + '<span class="t_punct">)</span>' +
      self.dumpMethodReturn(info, { phpDocOut: phpDocOut }) +
      (name === '__toString'
        ? '<br />' + self.dumper.dump(info.returnValue)
        : ''
      ) +
      '</dd>'
    )
    if (attributeOut && info.attributes && info.attributes.length) {
      $dd.attr('data-attributes', JSON.stringify(info.attributes))
    }
    if (info.implements && info.implements.length) {
      $dd.attr('data-implements', info.implements)
    }
    if (isInherited) {
      $dd.attr('data-inherited-from', info.declaredLast)
    }
    if (info.phpDoc && info.phpDoc.deprecated) {
      $dd.attr('data-deprecated-desc', info.phpDoc.deprecated[0].desc)
    }
    html += $dd[0].outerHTML
  }
  return html
}

DumpObject.prototype.dumpMethodModifiers = function (info) {
  var html = ''
  var vis = typeof info.visibility === 'object'
    ? info.visibility
    : [info.visibility]
  var modifiers = JSON.parse(JSON.stringify(vis))
  if (info.isFinal) {
    modifiers.push('final')
  }
  if (info.isStatic) {
    modifiers.push('static')
  }
  $.each(modifiers, function (i, modifier) {
    html += '<span class="t_modifier_' + modifier + '">' + modifier + '</span> '
  })
  return html
}

DumpObject.prototype.dumpMethodParams = function (params, opts) {
  var $param
  var defaultValue
  var self = this
  $.each(params, function (i, info) {
    $param = $('<span />', {
      class: 'parameter'
    })
    info = $.extend({
      desc: null,
      defaultValue: self.dumper.UNDEFINED
    }, info)
    if (info.isPromoted) {
      $param.addClass('isPromoted')
    }
    if (opts.attributeOut && info.attributes && info.attributes.length) {
      $param.attr('data-attributes', JSON.stringify(info.attributes))
    }
    if (typeof info.type === 'string') {
      $param.append('<span class="t_type">' + info.type + '</span> ')
    }
    $param.append('<span class="t_parameter-name"' +
      (opts.phpDocOut && info.desc !== null
        ? ' title="' + info.desc.escapeHtml().replace('\n', ' ') + '"'
        : ''
      ) + '>' + info.name.escapeHtml() + '</span>')
    if (info.defaultValue !== self.dumper.UNDEFINED) {
      defaultValue = info.defaultValue
      if (typeof defaultValue === 'string') {
        defaultValue = defaultValue.replace('\n', ' ')
      }
      $param.append(' <span class="t_operator">=</span> ' +
        $(self.dumper.dump(defaultValue))
          .addClass('t_parameter-default')[0].outerHTML
      )
    }
    params[i] = $param[0].outerHTML
  })
  return params
    ? params.join('<span class="t_punct">,</span> ')
    : ''
}

DumpObject.prototype.dumpMethodReturn = function (info, opts) {
  var returnType = info.return && info.return.type
  if (!returnType) {
    return ''
  }
  return '<span class="t_punct t_colon">:</span> ' +
     ' <span class="t_type"' +
    (opts.phpDocOut && info.return.desc !== null
      ? ' title="' + info.return.desc.escapeHtml() + '"'
      : ''
    ) +
    '>' + returnType + '</span>'
}

function magicMethodInfo (abs, methods) {
  var i = 0
  var methodsHave = []
  var method
  for (i = 0; i < methods.length; i++) {
    method = methods[i]
    if (abs.methods[method]) {
      methodsHave.push('<code>' + method + '</code>')
    }
  }
  if (methodsHave.length < 1) {
    return ''
  }
  methods = methodsHave.join(' and ')
  methods = methodsHave.length === 1
    ? 'a ' + methods + ' method'
    : methods + ' methods'
  return '<dd class="magic info">This object has ' + methods + '</dd>'
}
