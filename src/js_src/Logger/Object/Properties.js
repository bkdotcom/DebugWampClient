import $ from 'jquery' // external global
import { sectionPrototype } from './SectionPrototype.js'
import { versionCompare } from './../../versionCompare.js'

export function Properties (valDumper) {
  this.valDumper = valDumper
  sectionPrototype.valDumper = valDumper
}

var name
for (name in sectionPrototype) {
  Properties.prototype[name] = sectionPrototype[name]
}

Properties.prototype.dump = function (abs) {
  var cfg = {
    attributeOutput : abs.cfgFlags & this.valDumper.objectDumper.PROP_ATTRIBUTE_OUTPUT,
    isDynamicSupport : versionCompare(abs.debugVersion, '3.1') >= 0
  }
  if (abs.isInterface) {
    return ''
  }
  var label = Object.keys(abs.properties).length
    ? 'properties'
    : 'no properties'
  if (abs.viaDebugInfo) {
    label += ' <span class="text-muted">(via __debugInfo)</span>'
  }
  return '<dt class="properties">' + label + '</dt>' +
    this.magicMethodInfo(abs, ['__get', '__set']) +
    this.dumpItems(abs, 'properties', cfg)
}

Properties.prototype.addAttribs = function ($element, info, cfg) {
  var classes = {
    'debug-value': info.valueFrom === 'debug',
    'debuginfo-excluded': info.debugInfoExcluded,
    'debuginfo-value': info.valueFrom === 'debugInfo',
    forceShow: info.forceShow,
    getHook: info.hooks.indexOf('get') > -1,
    isDeprecated: info.isDeprecated,
    isDynamic: info.declaredLast === null &&
      info.valueFrom === 'value' &&
      cfg.objClassName !== 'stdClass' &&
      cfg.isDynamicSupport,
    isEager: info.isEager,
    isFinal: info.isFinal,
    isPromoted: info.isPromoted,
    isReadOnly: info.isReadOnly,
    isStatic: info.isStatic,
    isVirtual: info.isVirtual,
    isWriteOnly: info.isVirtual && info.hooks.indexOf('get') > -1,
    'private-ancestor': info.isPrivateAncestor,
    property: true,
    setHook: info.hooks.indexOf('set') > -1
  }
  var visibility = typeof info.visibility === 'object'
    ? info.visibility.join(' ')
    : info.visibility
  $element.addClass(visibility).removeClass('debug')
  $.each(classes, function (className, useClass) {
    if (useClass) {
      $element.addClass(className)
    }
  })
  sectionPrototype.addAttribs($element, info, cfg)
}

Properties.prototype.dumpInner = function (name, info, cfg) {
  var title = info.phpDoc?.summary || info.desc || null
  name = name.replace('debug.', '')
  return this.dumpModifiers(info) +
    (info.type
      ? this.valDumper.objectDumper.markupType(info.type)
      : ''
    ) +
    ' ' + this.valDumper.dump(name, {
      addQuotes: /[\s\r\n]/.test(name) || name === '',
      attribs: {
        class: 't_identifier',
        title: cfg.phpDocOutput && title
          ? this.valDumper.dumpPhpDocStr(title).escapeHtml()
          : null
      }
    }) +
    (info.value !== this.valDumper.UNDEFINED
      ? ' <span class="t_operator">=</span> ' +
        this.valDumper.dump(info.value)
      : ''
    )
}

Properties.prototype.dumpModifiers = function (info) {
  var html = ''
  var vis = typeof info.visibility === 'object'
    ? info.visibility
    : [info.visibility]
  var modifiers = {}
  info = $.extend({
    isEager: null
  }, info)
  modifiers = $.extend(
    {
      eager: info.isEager,
      final: info.isFinal,
    },
    Object.fromEntries(vis.map(function (key) {
      // array_fill_keys
      return [key, true]
    })),
    {
      readOnly: info.isReadOnly,
      static: info.isStatic,
    }
  )
  $.each(modifiers, function (modifier, incl) {
    var cssClass = 't_modifier_' + modifier
    if (!incl) {
      return
    }
    modifier = modifier.replace('-set', '(set)')
    html += '<span class="' + cssClass + '">' + modifier + '</span> '
  })
  return html
}
