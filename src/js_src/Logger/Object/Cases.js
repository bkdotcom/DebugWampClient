import $ from 'jquery' // external global
import { sectionPrototype } from './SectionPrototype.js'

export function Cases (valDumper) {
  this.valDumper = valDumper
}
var name
for (name in sectionPrototype) {
  Cases.prototype[name] = sectionPrototype[name]
}

Cases.prototype.addAttribs = function ($element, info, cfg) {
  $element.addClass('case')
  if (cfg.attributeOutput && info.attributes && info.attributes.length) {
    $element.attr('data-attributes', JSON.stringify(info.attributes))
  }
}

Cases.prototype.dump = function (abs) {
  var self = this
  var cfg = {
    attributeOutput : abs.cfgFlags & this.CASE_ATTRIBUTE_OUTPUT,
    collect : abs.cfgFlags & this.CASE_COLLECT,
    groupByInheritance : false,
    output : abs.cfgFlags & this.CASE_OUTPUT,
    phpDocOutput : abs.cfgFlags & this.PHPDOC_OUTPUT,
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
  if (abs.cases.length === 0) {
    return '<dt class="cases"><i>no cases!</i></dt>'
  }
  return '<dt class="cases">cases</dt>' +
    this.dumpItems(abs, 'cases', cfg)
}

Cases.prototype.dumpInner = function (name, info, cfg) {
  var title = cfg.phpDocOutput
    ? info.desc
    : null
  var $element = $('<div></div>')
    .html('<span class="t_identifier">' + key + '</span>' +
      (info.value !== null
        ? ' <span class="t_operator">=</span> ' +
          self.dumper.dump(info.value)
        : ''
      )
    )
  if (title && title.length) {
    $element.find('.t_identifier').attr('title', title)
  }
  return $element[0].innerHTML
}
