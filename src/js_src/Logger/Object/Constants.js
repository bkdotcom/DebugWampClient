import $ from 'jquery' // external global
import { sectionPrototype } from './SectionPrototype.js'

export function Constants (valDumper) {
  this.valDumper = valDumper
}
var name
for (name in sectionPrototype) {
  Constants.prototype[name] = sectionPrototype[name]
}

Constants.prototype.addAttribs = function ($element, info, cfg) {
  var classes = {
    constant: true,
    isFinal: info.isFinal,
    'private-ancestor': info.isPrivateAncestor
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

Constants.prototype.dump = function (abs) {
  var cfg = {
    collect : abs.cfgFlags & this.valDumper.objectDumper.CONST_COLLECT,
    attributeOutput : abs.cfgFlags & this.valDumper.objectDumper.CONST_ATTRIBUTE_OUTPUT,
    output : abs.cfgFlags & this.valDumper.objectDumper.CONST_OUTPUT,
  }
  if (!cfg.output) {
    return ''
  }
  if (!cfg.collect) {
    return '<dt class="constants">constants <i>not collected</i></dt>'
  }
  if (!abs.constants.length) {
    return ''
  }
  return '<dt class="constants">constants</dt>' +
    this.dumpItems(abs, 'constants', cfg)
}

Constants.prototype.dumpInner = function (name, info, cfg) {
  return this.dumpModifiers(info) +
    '<span class="t_identifier"' + (cfg.phpDocOutput && info.desc ? ' title="' + info.desc.escapeHtml() + '"' : '') + '>' + name + '</span> ' +
    '<span class="t_operator">=</span> ' +
    this.valDumper.dump(info.value)
}

Constants.prototype.dumpModifiers = function (info) {
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

