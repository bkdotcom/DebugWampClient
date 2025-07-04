import $ from 'zest' // external global
import { sectionPrototype } from './SectionPrototype.js'

export function Constants (valDumper) {
  this.valDumper = valDumper
  sectionPrototype.valDumper = valDumper
}

var name
for (name in sectionPrototype) {
  Constants.prototype[name] = sectionPrototype[name]
}

Constants.prototype.addAttribs = function ($element, info, cfg) {
  var classes = {
    constant: true,
    debug: false,
    isFinal: info.isFinal,
    'private-ancestor': info.isPrivateAncestor,
  }
  $element.addClass(info.visibility)
    .toggleClass(classes)
  sectionPrototype.addAttribs($element, info, cfg)
}

Constants.prototype.dump = function (abs) {
  var cfg = {
    collect: abs.cfgFlags & this.valDumper.objectDumper.CONST_COLLECT,
    attributeOutput: abs.cfgFlags & this.valDumper.objectDumper.CONST_ATTRIBUTE_OUTPUT,
    output: abs.cfgFlags & this.valDumper.objectDumper.CONST_OUTPUT,
  }
  if (!cfg.output) {
    return ''
  }
  if (!cfg.collect) {
    return '<dt class="constants">constants <i>not collected</i></dt>'
  }
  if (Object.keys(abs.constants).length < 1) {
    return ''
  }
  return '<dt class="constants">constants</dt>' +
    this.dumpItems(abs, 'constants', cfg)
}

Constants.prototype.dumpInner = function (name, info, cfg) {
  var title = info.phpDoc?.summary || info.desc || null
  return this.dumpModifiers(info) +
    '<span class="t_identifier"' +
      (cfg.phpDocOutput && title
        ? ' title="' + this.valDumper.dumpPhpDocStr(title).escapeHtml() + '"'
        : '') +
      '>' +
      this.valDumper.dump(name, { addQuotes: false }) +
    '</span> ' +
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
  $.each(modifiers, function (modifier) {
    html += '<span class="t_modifier_' + modifier + '">' + modifier + '</span> '
  })
  return html
}
