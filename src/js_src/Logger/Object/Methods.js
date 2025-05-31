import $ from 'zest' // external global
import { sectionPrototype } from './SectionPrototype.js'

export function Methods (valDumper) {
  this.valDumper = valDumper
  sectionPrototype.valDumper = valDumper
}

var name
for (name in sectionPrototype) {
  Methods.prototype[name] = sectionPrototype[name]
}

Methods.prototype.addAttribs = function ($element, info, cfg) {
  var classes = {
    debug: false,
    method: true,
    isDeprecated: info.isDeprecated,
    isFinal: info.isFinal,
    isStatic: info.isStatic
  }
  var self = this
  $element.addClass(info.visibility)
    .toggleClass(classes)
  sectionPrototype.addAttribs($element, info, cfg)
  if (info.implements && info.implements.length) {
    $element.attr('data-implements', info.implements)
  }
  if (info.phpDoc && info.phpDoc.deprecated) {
    $element.attr('data-deprecated-desc', this.valDumper.dumpPhpDocStr(info.phpDoc.deprecated[0].desc))
  }
  if (cfg.phpDocOutput && info.phpDoc && info.phpDoc.throws) {
    $element.attr('data-throws', JSON.stringify(info.phpDoc.throws.map(function (throwInfo) {
      return {
        desc: self.valDumper.dumpPhpDocStr(throwInfo.desc),
        type: self.valDumper.dumpPhpDocStr(throwInfo.type),
      }
    })))
  }
}

Methods.prototype.dump = function (abs) {
  var cfg = {
    attributeOutput : abs.cfgFlags & this.valDumper.objectDumper.METHOD_ATTRIBUTE_OUTPUT,
    collect : abs.cfgFlags & this.valDumper.objectDumper.METHOD_COLLECT,
    methodDescOutput : abs.cfgFlags & this.valDumper.objectDumper.METHOD_DESC_OUTPUT,
    output : abs.cfgFlags & this.valDumper.objectDumper.METHOD_OUTPUT,
    paramAttributeOutput : abs.cfgFlags & this.valDumper.objectDumper.PARAM_ATTRIBUTE_OUTPUT,
    phpDocOutput : abs.cfgFlags & this.valDumper.objectDumper.PHPDOC_OUTPUT,
    staticVarOutput : abs.cfgFlags & this.valDumper.objectDumper.METHOD_STATIC_VAR_OUTPUT,
  }
  var html = ''
  if (!cfg.output) {
    return ''
  }
  html = '<dt class="methods">' + this.getLabel(abs) + '</dt>'
  if (!cfg.collect) {
    return html
  }
  return html +
    this.magicMethodInfo(abs, ['__call', '__callStatic']) +
    this.dumpItems(abs, 'methods', cfg)
}

Methods.prototype.dumpInner = function (name, info, cfg) {
  return this.dumpModifiers(info) +
    this.dumpName(name, info, cfg) +
    this.dumpParams(info, cfg) +
    this.dumpReturn(info, cfg) +
    this.dumpStaticVars(info, cfg) +
    (name === '__toString'
      ? '<h3>' + this.valDumper.config.dict.get('object.methods.return-value') + '</h3>' +
          '<ul class="list-unstyled"><li>' +
          this.valDumper.dump(info.returnValue, {
            attribs: {
              class : 'return-value'
            }
          }) +
          '</li></ul>'
      : ''
    )
}

Methods.prototype.dumpModifiers = function (info) {
  var html = ''
  var vis = typeof info.visibility === 'object'
    ? JSON.parse(JSON.stringify(info.visibility))
    : [info.visibility]
  var modifiers = {
    abstract: info.isAbstract,
    final: info.isFinal,
    [vis.join(' ')]: true,
    static: info.isStatic,
  }
  $.each(modifiers, function (isSet, modifier) {
    if (isSet) {
      html += '<span class="t_modifier_' + modifier + '">' + modifier + '</span> '
    }
  })
  return html
}

Methods.prototype.dumpName = function (name, info, cfg) {
  if (typeof info.phpDoc === 'undefined') {
    console.warn('phpDoc missing for method ' + name, info)
  }
  var titleParts = [
    info.phpDoc?.summary || '',
    cfg.methodDescOutput
      ? info.phpDoc?.desc || ''
      : '',
  ]
  var title = titleParts.join("\n\n").trim()
  return ' <span class="t_identifier"' +
    (cfg.phpDocOutput && title !== ''
      ? ' title="' + this.valDumper.dumpPhpDocStr(title).escapeHtml() + '"'
      : ''
    ) +
    '>' + this.valDumper.dumpPhpDocStr(name) + '</span>'
}

Methods.prototype.dumpParams = function (info, cfg) {
  var self = this
  var params = []
  $.each(info.params, function (info) {
    var $param = $('<span />', {
      class: 'parameter'
    })
    info = $.extend({
      desc: null,
      defaultValue: self.valDumper.UNDEFINED
    }, info)
    if (info.isPromoted) {
      $param.addClass('isPromoted')
    }
    if (cfg.paramAttributeOutput && info.attributes && info.attributes.length) {
      $param.attr('data-attributes', JSON.stringify(info.attributes))
    }
    if (typeof info.type === 'string') {
      $param.append(self.valDumper.objectDumper.markupType(info.type) + ' ')
    }
    self.dumpParamName(info, cfg, $param)
    self.dumpParamDefault(info.defaultValue, $param)
    params.push($param[0].outerHTML)
  })
  return '<span class="t_punct">(</span>' +
    params.join('<span class="t_punct">,</span> ') +
    '<span class="t_punct">)</span>'
}

Methods.prototype.dumpParamName = function (info, cfg, $param) {
  var name = info.name
  if (typeof info.isVariadic !== 'undefined') {
    name = [
      info.isPassedByReference ? '&' : '',
      info.isVariadic ? '...' : '',
      '$' + info.name,
    ].join('')
  }
  $param.append('<span class="t_parameter-name"' +
    (cfg.phpDocOutput && info.desc !== null
      ? ' title="' + info.desc.escapeHtml().replace('\n', ' ') + '"'
      : ''
    ) + '>' + this.valDumper.dumpPhpDocStr(name) + '</span>')
}

Methods.prototype.dumpParamDefault = function (defaultValue, $param) {
  if (defaultValue === this.valDumper.UNDEFINED) {
    return
  }
  if (typeof defaultValue === 'string') {
    defaultValue = defaultValue.replace('\n', ' ')
  }
  $param.append(' <span class="t_operator">=</span> ' +
    $(this.valDumper.dump(defaultValue))
      .addClass('t_parameter-default')[0].outerHTML
  )
}

Methods.prototype.dumpReturn = function (info, cfg) {
  var returnType = info.return && info.return.type
  if (!returnType) {
    return ''
  }
  return '<span class="t_punct t_colon">:</span> ' +
    this.valDumper.objectDumper.markupType(returnType, {
      title: cfg.phpDocOutput && info.return.desc !== null
        ? info.return.desc
        : ''
    })
}

Methods.prototype.dumpStaticVars = function (info, cfg) {
  var self = this
  var html = ''
  if (!cfg.staticVarOutput || typeof info.staticVars === 'undefined' || info.staticVars.length < 1) {
      return ''
  }
  html = '<h3>' + this.valDumper.config.dict.get('object.methods.static-variables') + '</h3>'
  html += '<ul class="list-unstyled">'
  $.each(info.staticVars, function (value, name) {
    html += '<li>' +
      self.valDumper.dump(name, {
        addQuotes : false,
        attribs : {
          class : 't_identifier'
        }
      }) +
      '<span class="t_operator">=</span> ' + self.valDumper.dump(value) +
      '</li>'
  })
  html += '</ul>'
  return html
}

Methods.prototype.getLabel = function (abs) {
  var label = Object.keys(abs.methods).length
    ? 'methods'
    : 'no methods'
  if (!(abs.cfgFlags & this.valDumper.objectDumper.METHOD_COLLECT)) {
      label = 'methods <i>not collected</i>'
  }
  return label
}
