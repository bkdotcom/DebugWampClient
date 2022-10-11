import $ from 'jquery' // external global

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

DumpObject.prototype.dump = function (abs) {
  // console.info('dumpObject', abs)
  var html = ''
  var strClassname = ''
  if (typeof abs.cfgFlags === 'undefined') {
    abs.cfgFlags = 0x3FFFFF // 21 bits
  }
  strClassname = this.dumpClassname(abs)
  if (abs.isMaxDepth) {
    this.dumper.getDumpOpts().attribs.class.push('max-depth')
  }
  if (abs.isRecursion) {
    return strClassname +
      ' <span class="t_recursion">*RECURSION*</span>'
  } else if (abs.isExcluded) {
    return strClassname +
      ' <span class="excluded">(not inspected)</span>'
  } else if (abs.cfgFlags & this.BRIEF && abs.implements.indexOf('UnitEnum') > -1) {
    return strClassname
  }
  try {
    // console.log('obj abs', abs)
    html = this.dumpToString(abs) +
      strClassname +
      '<dl class="object-inner">' +
        (abs.isFinal
          ? '<dt class="t_modifier_final">final</dt>'
          : ''
        ) +
        (abs.extends && abs.extends.length
          ? '<dt>extends</dt>' +
            '<dd class="extends">' + abs.extends.join('</dd><dd class="extends">') + '</dd>'
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
  // var $dd
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
  var $dd
  var constCollect = abs.cfgFlags & this.CONST_COLLECT
  var attributeOut = abs.cfgFlags & this.CONST_ATTRIBUTE_OUTPUT
  var constOut = abs.cfgFlags & this.CONST_OUTPUT
  var phpDocOut = abs.cfgFlags & this.PHPDOC_OUTPUT
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
  $.each(abs.constants, function (key, info) {
    $dd = $('<dd class="constant ' + info.visibility + '">' +
      '<span class="t_modifier_' + info.visibility + '">' + info.visibility + '</span> ' +
      (info.isFinal
        ? '<span class="t_modifier_final">final</span> '
        : ''
      ) +
      '<span class="t_identifier"' + (phpDocOut && info.desc ? ' title="' + info.desc.escapeHtml() + '"' : '') + '>' + key + '</span> ' +
      '<span class="t_operator">=</span> ' +
      self.dumper.dump(info.value) +
      '</dd>')
    if (attributeOut && info.attributes && info.attributes.length) {
      $dd.attr('data-attributes', JSON.stringify(info.attributes))
    }
    html += $dd[0].outerHTML
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
  var properties = abs.properties
  var label = Object.keys(properties).length
    ? 'properties'
    : 'no properties'
  var phpDocOut = abs.cfgFlags & this.PHPDOC_OUTPUT
  var attributeOut = abs.cfgFlags & this.PROP_ATTRIBUTE_OUTPUT
  var self = this
  if (meta.viaDebugInfo) {
    label += ' <span class="text-muted">(via __debugInfo)</span>'
  }
  html = '<dt class="properties">' + label + '</dt>'
  html += magicMethodInfo(abs, ['__get', '__set'])
  $.each(properties, function (name, info) {
    // console.info('property info', info)
    var $dd
    var isPrivateAncestor = $.inArray('private', info.visibility) >= 0 && info.inheritedFrom
    var classes = {
      'debug-value': info.valueFrom === 'debug',
      'debuginfo-excluded': info.debugInfoExcluded,
      'debuginfo-value': info.valueFrom === 'debugInfo',
      forceShow: info.forceShow,
      inherited: typeof info.inheritedFrom === 'string',
      isPromoted: info.isPromoted,
      isReadOnly: info.isReadOnly,
      isStatic: info.isStatic,
      'private-ancestor': info.isPrivateAncestor,
      property: true
    }
    name = name.replace('debug.', '')
    if (typeof info.visibility !== 'object') {
      info.visibility = [info.visibility]
    }
    classes[info.visibility.join(' ')] = $.inArray('debug', info.visibility) < 0
    $dd = $('<dd>' +
      self.dumpPropertyModifiers(info) +
      (isPrivateAncestor
        ? ' (<i>' + info.inheritedFrom + '</i>)'
        : ''
      ) +
      (info.type
        ? ' <span class="t_type">' + info.type + '</span>'
        : ''
      ) +
      ' <span class="t_identifier"' +
        (phpDocOut && info.desc
          ? ' title="' + info.desc.escapeHtml() + '"'
          : ''
        ) +
        '>' + name + '</span>' +
      (info.value !== self.dumper.UNDEFINED
        ? ' <span class="t_operator">=</span> ' +
          self.dumper.dump(info.value)
        : ''
      ) +
      '</dd>'
    )
    if (attributeOut && info.attributes && info.attributes.length) {
      $dd.attr('data-attributes', JSON.stringify(info.attributes))
    }
    if (info.inheritedFrom) {
      $dd.attr('data-inherited-from', info.inheritedFrom)
    }
    $.each(classes, function (classname, useClass) {
      if (useClass) {
        $dd.addClass(classname)
      }
    })
    html += $dd[0].outerHTML
  })
  return html
}

DumpObject.prototype.dumpPropertyModifiers = function (info) {
  var html = ''
  var modifiers = JSON.parse(JSON.stringify(info.visibility))
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
  if (!methodOut) {
    return ''
  }
  if (!methodCollect) {
    return '<dt class="methdos">methods not collected</dt>'
  }
  html = '<dt class="methods">' + label + '</dt>'
  html += magicMethodInfo(abs, ['__call', '__callStatic'])
  $.each(abs.methods, function (k, info) {
    var $dd = $('<dd class="method"></dd>').addClass(info.visibility)
    var modifiers = []
    var paramStr = self.dumpMethodParams(info.params, {
      attributeOut: paramAttributeOut,
      phpDocOut: phpDocOut
    })
    var returnType = ''
    if (info.isFinal) {
      $dd.addClass('final')
      modifiers.push('<span class="t_modifier_final">final</span>')
    }
    modifiers.push('<span class="t_modifier_' + info.visibility + '">' + info.visibility + '</span>')
    if (info.isStatic) {
      modifiers.push('<span class="t_modifier_static">static</span>')
    }
    if (info.return && info.return.type) {
      returnType = ' <span class="t_type"' +
        (phpDocOut && info.return.desc !== null
          ? ' title="' + info.return.desc.escapeHtml() + '"'
          : ''
        ) +
        '>' + info.return.type + '</span>'
    }
    $dd.html(
      modifiers.join(' ') +
      returnType +
      ' <span class="t_identifier"' +
        (phpDocOut && info.phpDoc && info.phpDoc.summary !== null
          ? ' title="' + info.phpDoc.summary.escapeHtml() + '"'
          : ''
        ) +
        '>' + k + '</span>' +
      '<span class="t_punct">(</span>' + paramStr + '<span class="t_punct">)</span>' +
      (k === '__toString'
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
    if (info.inheritedFrom) {
      $dd.attr('data-inherited-from', info.inheritedFrom)
    }
    if (info.phpDoc && info.phpDoc.deprecated) {
      $dd.attr('data-deprecated-desc', info.phpDoc.deprecated[0].desc)
    }
    if (info.inheritedFrom) {
      $dd.addClass('inherited')
    }
    if (info.isDeprecated) {
      $dd.addClass('deprecated')
    }
    html += $dd[0].outerHTML
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
