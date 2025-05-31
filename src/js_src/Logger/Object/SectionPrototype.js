import $ from 'zest' // external global

function replaceTokens (str, data) {
  return str.replace(/\{([^}]+)\}/g, (match, key) => {
    return data[key] || match
  })
}

export var sectionPrototype = {
  dumpItems: function (abs, what, cfg) {
    var self = this
    var html = ''
    var classes = JSON.parse(JSON.stringify(abs.extends))
    classes.unshift(abs.className)
    cfg = $.extend({
      groupByInheritance : abs.sort.indexOf('inheritance') === 0,
      objClassName : abs.className,
      phpDocOutput : abs.cfgFlags & this.valDumper.objectDumper.PHPDOC_OUTPUT,
    }, cfg)
    delete abs[what].__debug_key_order__
    if (cfg.groupByInheritance === false) {
      return this.dumpItemsFiltered(abs[what], cfg)
    }
    classes.forEach(function (className) {
      var info = {}
      var items = {}
      var name = ''
      html += [abs.className, 'stdClass'].indexOf(className) < 0
        ? '<dd class="heading">Inherited from ' + self.valDumper.markupIdentifier(className) + '</dd>'
        : ''
      for (name in abs[what]) {
        info = abs[what][name]
        if (!info.declaredLast || info.declaredLast === className) {
            items[name] = info
            delete abs[what][name]
        }
      }
      html += self.dumpItemsFiltered(items, cfg)
    })
    return html
  },

  dumpItemsFiltered: function (items, cfg) {
    var html = ''
    var name = ''
    var info = {}
    var vis = []
    for (name in items) {
      info = items[name]
      if (typeof info.inheritedFrom !== 'undefined') {
        info.declaredLast = info.inheritedFrom // note that only populated if inherited...
                                               //    we don't know where it was declared
        delete info.inheritedFrom
      }
      if (typeof info.overrides !== 'undefined') {
        info.declaredPrev = info.overrides
        delete info.overrides
      }
      info = $.extend({
        declaredLast : null,
        declaredPrev : null,
      }, info)
      vis = typeof info.visibility === 'object'
        ? info.visibility
        : [info.visibility]
      info.isInherited = info.declaredLast && info.declaredLast !== cfg.objClassName
      info.isPrivateAncestor = vis.indexOf('private') >= 0 && info.isInherited
      if (info.isPrivateAncestor) {
          info.isInherited = false
      }
      html += this.dumpItem(name, info, cfg)
    }
    return html
  },

  dumpItem: function (name, info, cfg) {
    var $dd = $('<dd></dd>')
      .html(this.dumpInner(name, info, cfg))
    this.addAttribs($dd, info, cfg)
    return $dd[0].outerHTML
  },

  addAttribs: function ($element, info, cfg) {
    if (cfg.attributeOutput && info.attributes && info.attributes.length) {
      $element.attr('data-attributes', JSON.stringify(info.attributes))
      // $element.attr('data-chars', JSON.stringify(this.valDumper.stringDumper.charHighlight.findChars(JSON.stringify(info.attributes))))
    }
    if (!info.isInherited && info.declaredPrev) {
      $element.attr('data-declared-prev', info.declaredPrev)
    }
    if (info.isInherited && info.declaredLast) {
      $element.attr('data-inherited-from', info.declaredLast)
    }
  },

  magicMethodInfo: function (abs, methods) {
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
   var label = methodsHave.length === 1
      ? replaceTokens(this.valDumper.config.dict.get('object.methods.magic.1'), {
        method: methodsHave[0]
      })
      : replaceTokens(this.valDumper.config.dict.get('object.methods.magic.2'), {
        method1: methodsHave[0],
        method2: methodsHave[1],
      })
    return '<dd class="magic info">' + label + '</dd>'
  },
}
