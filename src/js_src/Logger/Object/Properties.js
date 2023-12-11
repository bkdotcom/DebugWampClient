import $ from 'jquery' // external global
import { sectionPrototype } from './SectionPrototype.js'

export function Properties (valDumper) {
  this.valDumper = valDumper
}
var name
for (name in sectionPrototype) {
  Properties.prototype[name] = sectionPrototype[name]
}

Properties.prototype.dump = function (abs) {
  var cfg = {
    attributeOutput : abs.cfgFlags & this.valDumper.objectDumper.PROP_ATTRIBUTE_OUTPUT,
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
    isDynamic: info.declaredLast === null &&
      info.valueFrom === 'value' &&
      info.objclassName !== 'stdClass',
    isPromoted: info.isPromoted,
    isReadOnly: info.isReadOnly,
    isStatic: info.isStatic,
    'private-ancestor': info.isPrivateAncestor,
    property: true
  }
  $element.addClass(info.visibility).removeClass('debug')
  $.each(classes, function (classname, useClass) {
    if (useClass) {
      $element.addClass(classname)
    }
  })
  if (cfg.attributeOutput && info.attributes && info.attributes.length) {
    $element.attr('data-attributes', JSON.stringify(info.attributes))
  }
  if (info.isInherited || info.isPrivateAncestor) {
    $element.attr('data-inherited-from', info.declaredLast)
  }
}

Properties.prototype.dumpInner = function (name, info, cfg) {
  name = name.replace('debug.', '')
  return this.dumpModifiers(info) +
    (info.type
      ? ' <span class="t_type">' + info.type + '</span>'
      : ''
    ) +
    ' ' + this.valDumper.dump(name, {
      addQuotes: /[\s\r\n]/.test(name) || name === '',
      attribs: {
        class: 't_identifier',
        title: cfg.phpDocOutput && info.desc
          ? info.desc
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
