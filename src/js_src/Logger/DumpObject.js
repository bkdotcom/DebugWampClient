import $ from 'zest' // external global
import mergeWith from 'lodash/mergeWith'
import { Cases } from './Object/Cases.js'
import { Constants } from './Object/Constants.js'
import { Methods } from './Object/Methods.js'
import { PhpDoc } from './Object/PhpDoc.js'
import { Properties } from './Object/Properties.js'
import { versionCompare } from './../versionCompare.js'

export function DumpObject (dump) {
  this.dumper = dump
  this.cases = new Cases(this.dumper)
  this.constants = new Constants(this.dumper)
  this.methods = new Methods(this.dumper)
  this.properties = new Properties(this.dumper)
  this.phpDoc = new PhpDoc(this.dumper)

  this.sectionDumpers = {
    attributes : this.dumpAttributes.bind(this),
    cases : this.cases.dump.bind(this.cases),
    constants : this.constants.dump.bind(this.constants),
    extends : this.dumpExtends.bind(this),
    implements : this.dumpImplements.bind(this),
    methods : this.methods.dump.bind(this.methods),
    phpDoc : this.phpDoc.dump.bind(this.phpDoc),
    properties : this.properties.dump.bind(this.properties),
  }

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
  this.METHOD_STATIC_VAR_OUTPUT = 16777216 // 2^24
  this.PARAM_ATTRIBUTE_OUTPUT = 2097152

  this.phpDocTypes = [
    'array','bool','callable','float','int','iterable','null','object','string',
    '$this','self','static',
    'array-key','double','false','mixed','non-empty-array','resource','scalar','true','void',
    'key-of', 'value-of',
    'callable-string', 'class-string', 'literal-string', 'numeric-string', 'non-empty-string',
    'negative-int', 'positive-int',
    'int-mask', 'int-mask-of',
  ]

}

function sort(obj, sortBy) {
  var count
  var i
  var name
  var objNew = {}
  var sortInfo = []
  var sortVisOrder = ['public', 'magic', 'magic-read', 'magic-write', 'protected', 'private', 'debug']
  var vis
  for (name in obj) {
    if (name === '__construct') {
      sortInfo.push({
        name: name,
        nameSort: "\x00",
        visibility: 0,
      })
      continue
    }
    vis = Array.isArray(obj[name].visibility)
      ? obj[name].visibility[0]
      : obj[name].visibility
    sortInfo.push({
      name: name,
      nameSort: name,
      vis: sortVisOrder.indexOf(vis),
    })
  }
  sortBy = sortBy.split(/[,\s]+/)
  sortInfo.sort(function (itemA, itemB) {
    var ret = 0
    for (i = 0, count = sortBy.length; i < count; i++) {
      if (['visibility', 'vis'].indexOf(sortBy[i]) > -1) {
        if (itemA.vis < itemB.vis) {
          ret = -1
        } else if (itemA.vis > itemB.vis) {
          ret = 1
        }
      } else if (sortBy[i] === 'name') {
        ret = itemA.nameSort.localeCompare(itemB.nameSort)
      }
      if (ret !== 0) {
        break
      }
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
  var html = ''
  var strClassName = ''
  var dumpOpts = this.dumper.getDumpOpts()
  var $container = this.dumper.getRequestInfo().$container
  try {
    abs.debugVersion = $container.data('meta').debugVersion
    if (typeof abs.cfgFlags === 'undefined') {
      abs.cfgFlags = 0x1FFFFFF & ~this.BRIEF
    }
    abs = this.mergeInherited(abs)
    if (typeof abs.sort === 'undefined') {
      abs.sort = 'vis name'
    } else if (abs.sort === 'visibility' && versionCompare(abs.debugVersion, '3.2') === -1) {
      abs.sort = 'vis name'
    }
    if (typeof abs.implementsList === 'undefined') {
      // PhpDebugConsole < 3.1
      abs.implementsList = abs.implements
    }
    strClassName = this.dumpClassName(abs)
    if (abs.isRecursion) {
      return strClassName +
        ' <span class="t_recursion">*RECURSION*</span>'
    }
    if (abs.isMaxDepth) {
      return strClassName +
        ' <span class="t_maxDepth">*MAX DEPTH*</span>'
    }
    if (abs.isExcluded) {
      return strClassName +
        ' <span class="excluded">(not inspected)</span>'
    }
    if (abs.cfgFlags & this.BRIEF && abs.implementsList.indexOf('UnitEnum') > -1) {
      return strClassName
    }
    if (abs.sort.indexOf('inheritance') === 0) {
      dumpOpts.attribs.class.push('groupByInheritance')
    }
    html = this.dumpToString(abs) +
      strClassName +
      '<dl class="object-inner">' +
        this.dumpInner(abs) +
      '</dl>'
  } catch (e) {
    console.warn('e', e)
  }
  return html
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
  $.each(abs.attributes, function (attribute) {
    args = []
    html += '<dd class="attribute">'
    html += self.dumper.markupIdentifier(attribute.name)
    if (Object.keys(attribute.arguments).length) {
      $.each(attribute.arguments, function (val, name) {
        args.push(
          (name.match(/^\d+$/) === null
            ? '<span class="t_parameter-name">' + self.dumper.dumpPhpDocStr(name) + '</span><span class="t_punct">:</span>'
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

DumpObject.prototype.dumpClassName = function (abs) {
  var phpDoc = abs.phpDoc || {}
  var phpDocOut = abs.cfgFlags & this.PHPDOC_OUTPUT
  var isEnum = abs.implementsList.indexOf('UnitEnum') > -1
  var title = isEnum && typeof abs.properties.value !== 'undefined'
    ? 'value: ' + abs.properties.value.value
    : ''
  if (phpDocOut) {
    phpDoc = ((phpDoc.summary || '') + '\n\n' + (phpDoc.desc || '')).trim()
    title = title + "\n\n" + this.dumper.dumpPhpDocStr(phpDoc)
  }
  return this.dumper.dump({
    attribs: {
      title: title.trim(),
    },
    debug: this.dumper.ABSTRACTION,
    type: 'identifier',
    typeMore: isEnum ? 'const' : 'classname',
    value: isEnum
      ? abs.className + '::' + abs.properties.name.value
      : abs.className,
  })
}

DumpObject.prototype.dumpExtends = function (abs) {
  var self = this
  return abs.extends && abs.extends.length
    ? '<dt>extends</dt>' +
        abs.extends.map(function (className) {
          return '<dd class="extends t_identifier">' + self.dumper.markupIdentifier(className, 'classname') + '</dd>'
        }).join('')
    : ''
}

DumpObject.prototype.dumpImplements = function (abs) {
  if (!abs.implementsList.length) {
    return ''
  }
  if (typeof abs.interfacesCollapse === 'undefined') {
    // PhpDebugConsole < 3.2
    abs.interfacesCollapse = ['ArrayAccess', 'BackedEnum', 'Countable', 'Iterator', 'IteratorAggregate', 'UnitEnum']
  }
  return '<dt>implements</dt>' +
    '<dd class="implements">' + this.buildImplementsTree(abs.implements, abs.interfacesCollapse) + '</dd>'
}

DumpObject.prototype.dumpInner = function (abs) {
  var self = this
  var html = this.dumpModifiers(abs)
  if (typeof abs.sectionOrder === 'undefined') {
    // PhpDebugConsole < 3.2
    abs.sectionOrder = ['attributes', 'extends', 'implements', 'constants', 'cases', 'properties', 'methods', 'phpDoc']
  }
  abs.sectionOrder.forEach(function (sectionName) {
    html += self.sectionDumpers[sectionName](abs)
  })
  return html
}

DumpObject.prototype.dumpModifiers = function (abs) {
  var modifiers = {
    abstract: abs.isAbstract,
    final: abs.isFinal,
    interface: abs.isInterface,
    lazy: abs.isLazy,
    readonly: abs.isReadOnly,
    trait: abs.isTrait,
  }
  var haveModifier = false
  var html = '<dt class="modifiers">modifiers</dt>'
  $.each(modifiers, function (isSet, modifier) {
    if (isSet) {
      haveModifier = true
      html += '<dd class="t_modifier_' + modifier + '">' + modifier + '</dd>'
    }
  })
  return haveModifier
    ? html
    : ''
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

DumpObject.prototype.buildImplementsTree = function (implementsObj, interfacesCollapse) {
  var html = '<ul class="list-unstyled">'
  var iface
  var $span
  var k
  for (k in implementsObj) {
      iface = typeof implementsObj[k] === 'string'
        ? implementsObj[k]
        : k
      $span = $('<span />', {
        class: 'interface t_identifier',
        html: this.dumper.markupIdentifier(iface, 'classname')
      })
      if (interfacesCollapse.indexOf(iface) > -1) {
        $span.addClass('toggle-off')
      }
      html += '<li>' +
        $span[0].outerHTML +
        (typeof implementsObj[k] === 'object'
           ? this.buildImplementsTree(implementsObj[k], interfacesCollapse)
           : ''
        ) +
        '</li>'
  }
  html += '</ul>'
  return html
}

DumpObject.prototype.markupType = function (type, attribs) {
  var self = this
  type = type.replace(/(?:(\$this|[-\w\[\]'"\\]+:?)|([\(\)<>\{\},\|&]))/g, function (match, p1, p2) {
    return p1
      ? self.markupTypePart(p1)
      : '<span class="t_punct">' + p2.escapeHtml() + '</span>'
  })
  if (typeof attribs === 'undefined') {
    return type
  }
  attribs = Object.fromEntries(
    Object.entries(attribs).filter(function (entry) {
      return typeof entry[1] === 'string' && entry[1].length > 0
    })
  )
  if (Object.keys(attribs).length > 0) {
    type = $('<span></span>').attr(attribs).html(type)[0].outerHTML
  }
  return type
}

DumpObject.prototype.markupTypePart = function (type) {
  var arrayCount = 0
  var strlen = 0
  var matches = type.match(/(\[\])+$/)
  if (matches) {
    strlen = matches[0].length
    arrayCount = strlen / 2
    type = type.substr(0, 0 - strlen)
  }
  if (type.match(/^\d+$/)) {
    return '<span class="t_type">' + type + '</span>'
  }
  if (type.substr(-1) === ':') {
    // array "shape" key
    type = type.replace(/^[:'"]+|[:'"]$/g, '')
    return '<span class="t_string">' + type + '</span><span class="t_punct">:</span>'
  }
  if (type.match(/^['"]/)) {
    type = type.replace(/^['"]+|['"]$/g, '')
    return '<span class="t_string t_type">' + type + '</span>'
  }
  if (this.phpDocTypes.indexOf(type) < 0) {
    type = this.dumper.markupIdentifier(type)
  }
  if (arrayCount > 0) {
    type += '<span class="t_punct">' + '[]'.repeat(arrayCount) + '</span>'
  }
  return '<span class="t_type">' + type + '</span>'
}

DumpObject.prototype.mergeInherited = function (abs) {
  var count
  var i = 0
  var inherited
  var noInherit = ['attributes', 'cases', 'constants', 'methods', 'properties']
  if (abs.classDefinition) {
    // PhpDebugConsole < 3.2
    abs.inheritsFrom = abs.classDefinition
  }
  while (abs.inheritsFrom) {
    inherited = this.dumper.getClassDefinition(abs.inheritsFrom)
    if (abs.isRecursion || abs.isExcluded) {
      for (i = 0, count = noInherit.length; i < count; i++) {
        inherited[noInherit[i]] = {}
      }
    }
    abs = JSON.parse(JSON.stringify(mergeWith({}, inherited, abs, function (objValue, srcValue) {
      if (objValue === null || srcValue === null) {
        return
      }
      if (typeof srcValue === 'object' && typeof objValue === 'object' && Object.keys(objValue).length === 0) {
        return srcValue
      }
    })))
    abs.inheritsFrom = inherited.inheritsFrom
  }
  for (i = 0, count = noInherit.length; i < count; i++) {
    if (typeof abs[noInherit[i]] === 'undefined') {
      abs[noInherit[i]] = {}
    }
    abs[noInherit[i]] = sort(abs[noInherit[i]], abs.sort)
  }
  return abs
}
