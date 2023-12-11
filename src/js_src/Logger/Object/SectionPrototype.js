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
    if (cfg.groupByInheritance === false) {
      return this.dumpItemsFiltered(abs[what], cfg)
    }
    classes.forEach(function (classname) {
      var info = {}
      var items = {}
      var name = ''
      html += [abs.className, 'stdClass'].indexOf(classname) < 0
        ? '<dd class="heading">Inherited from ' + self.valDumper.markupIdentifier(classname) + '</dd>'
        : ''
      for (name in abs[what]) {
        info = abs[what][name]
        if (!info.declaredLast || info.declaredLast === classname) {
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
      info = $.extend({
        declaredLast : null,
        declaredPrev : null,
        objClassName : cfg.objClassName,  // used by Properties to determine "isDynamic"
      }, items[name])
      vis = typeof info.visibility === 'object'
        ? info.visibility
        : [info.visibility]
      info.isInherited = info.declaredLast && info.declaredLast !== info.objClassName
      info.isPrivateAncestor = $.inArray('private', vis) >= 0 && info.isInherited
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
    methods = methodsHave.join(' and ')
    methods = methodsHave.length === 1
      ? 'a ' + methods + ' method'
      : methods + ' methods'
    return '<dd class="magic info">This object has ' + methods + '</dd>'
  },
}
