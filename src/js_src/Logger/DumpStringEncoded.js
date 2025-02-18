import $ from 'jquery' // external global

export function DumpStringEncoded (dumpString) {
  this.dumpString = dumpString
  this.dumper = dumpString.dumper
}

DumpStringEncoded.prototype.dump = function (val, abs) {
  var dumpOpts = this.dumper.getDumpOpts()
  var tagName = dumpOpts.tagName === '__default__'
    ? 'span'
    : dumpOpts.tagName
  var tabs = {}

  if (abs.brief) {
    return tabValues(abs, this.dumper).valRaw
  }

  tabs = this.buildTabsAndPanes(abs)
  dumpOpts.tagName = null

  return $('<' + tagName + '>', {
    class: 'string-encoded tabs-container',
    'data-type-more': abs.typeMore
  }).html('\n' +
    '<nav role="tablist">' +
        tabs.tabs.join('') +
    '</nav>' +
    tabs.panes.join('')
  )[0].outerHTML
}

DumpStringEncoded.prototype.buildTabsAndPanes = function (abs) {
  var tabs = {
    tabs: [],
    panes: []
  }
  var index = 1
  var vals
  do {
    vals = tabValues(abs, this.dumper)
    tabs.tabs.push('<a class="nav-link" data-target=".tab-' + index + '" data-toggle="tab" role="tab">' + vals.labelRaw + '</a>')
    tabs.panes.push('<div class="tab-' + index + ' tab-pane" role="tabpanel">' + vals.valRaw + '</div>')
    index++
    abs = abs.valueDecoded
  } while (this.dumpString.isEncoded(abs))
  tabs.tabs.push('<a class="active nav-link" data-target=".tab-' + index + '" data-toggle="tab" role="tab">' + vals.labelDecoded + '</a>')
  tabs.panes.push('<div class="active tab-' + index + ' tab-pane" role="tabpanel">' + this.dumper.dump(abs) + '</div>')
  return tabs
}

function tabValues (abs, dumper) {
  var dumpOpts = dumper.getDumpOpts()
  var attribs = JSON.parse(JSON.stringify(dumpOpts.attribs))
  attribs.class.push('no-quotes')
  attribs.class.push('t_' + abs.type)
  attribs.class = attribs.class.join(' ')
  if (abs.typeMore === 'base64' && abs.brief) {
    dumpOpts.postDump = function (val) {
      return '<span class="t_keyword">string</span><span class="text-muted">(base64)</span><span class="t_punct colon">:</span> ' + val
    }
  }
  return tabValuesFinish({
    labelDecoded: 'decoded',
    labelRaw: 'raw',
    valRaw: $('<span />', attribs).html(
      dumper.dump(abs.value, { tagName: null })
    )[0].outerHTML
  }, abs, dumper)
}

function tabValuesFinish (vals, abs, dumper) {
  switch (abs.typeMore) {
    case 'base64':
      vals.labelRaw = 'base64'
      if (abs.strlen) {
        vals.valRaw += '<span class="maxlen">&hellip; ' + (abs.strlen - abs.value.length) + ' more bytes (not logged)</span>'
      }
      break
    case 'form':
      vals.labelRaw = 'form'
      break
    case 'json':
      vals.labelRaw = 'json'
      if (abs.prettified || abs.strlen) {
        abs.typeMore = null // unset typeMore to prevent loop
        vals.valRaw = dumper.dump(abs)
        abs.typeMore = 'json'
      }
      break
    case 'serialized':
      vals.labelDecoded = 'unserialized'
      vals.labelRaw = 'serialized'
      break
  }
  return vals
}
