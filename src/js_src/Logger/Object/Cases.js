import $ from 'jquery' // external global
import { sectionPrototype } from './SectionPrototype.js'

export function Cases (valDumper) {
  this.valDumper = valDumper
  sectionPrototype.valDumper = valDumper
}

var name
for (name in sectionPrototype) {
  Cases.prototype[name] = sectionPrototype[name]
}

Cases.prototype.addAttribs = function ($element, info, cfg) {
  $element.addClass('case')
  sectionPrototype.addAttribs($element, info, cfg)
}

Cases.prototype.dump = function (abs) {
  var self = this
  var cfg = {
    attributeOutput : abs.cfgFlags & this.valDumper.objectDumper.CASE_ATTRIBUTE_OUTPUT,
    collect : abs.cfgFlags & this.valDumper.objectDumper.CASE_COLLECT,
    groupByInheritance : false,
    output : abs.cfgFlags & this.valDumper.objectDumper.CASE_OUTPUT,
    phpDocOutput : abs.cfgFlags & this.valDumper.objectDumper.PHPDOC_OUTPUT,
  }
  if (abs.implementsList.indexOf('UnitEnum') < 0) {
    return ''
  }
  if (!cfg.output) {
    return ''
  }
  if (!cfg.collect) {
    return '<dt class="cases">cases <i>not collected</i></dt>'
  }
  if (Object.keys(abs.cases).length < 1) {
    return '<dt class="cases"><i>no cases!</i></dt>'
  }
  return '<dt class="cases">cases</dt>' +
    this.dumpItems(abs, 'cases', cfg)
}

Cases.prototype.dumpInner = function (name, info, cfg) {
  var title = cfg.phpDocOutput
    ? info.phpDoc.summary || info.desc || null
    : null
  var $element = $('<div></div>')
    .html('<span class="t_identifier">' + name + '</span>' +
      (info.value !== this.valDumper.UNDEFINED
        ? ' <span class="t_operator">=</span> ' +
          this.valDumper.dump(info.value)
        : ''
      )
    )
  if (title && title.length) {
    title = this.valDumper.dumpPhpDocStr(title)
    $element.find('.t_identifier').attr('title', title)
  }
  return $element[0].innerHTML
}
