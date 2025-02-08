import $ from 'jquery' // external global
import { Table } from './MethodTable.js'
import { Dump } from './Dump.js'

var dump = new Dump()
var subRegex = new RegExp('%' +
  '(?:' +
  '[coO]|' + // c: css, o: obj with max info, O: obj w generic info
  '[+-]?' + // sign specifier
  '(?:[ 0]|\'.)?' + // padding specifier
  '-?' + // alignment specifier
  '\\d*' + // width specifier
  '(?:\\.\\d+)?' + // precision specifier
  '[difs]' +
  ')', 'g')
var table = new Table(dump)

export var methods = {
  alert: function (logEntry, info) {
    var $node = $('<div class="m_alert"></div>')
      .addClass('alert-' + (logEntry.meta.level || logEntry.meta.class))
      // .html(message)
      .attr('data-channel', logEntry.meta.channel) // using attr so can use [data-channel="xxx"] selector
    var dismissible = logEntry.meta.dismissible
    var html = logEntry.args.length > 1
      ? buildEntryNode(logEntry, info).html()
      : dump.dump(logEntry.args[0], {
        sanitize: logEntry.meta.sanitizeFirst,
        tagName: null, // don't wrap value span
        visualWhiteSpace: false,
      })
    $node.html(html)
    if (dismissible) {
      $node.prepend('<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>')
      $node.addClass('alert-dismissible')
    }
    if (logEntry.meta.icon) {
      $node.data('icon', logEntry.meta.icon)
    }
    info.$tabPane.find('> .tab-body > .debug-log-summary').before($node)
    $node.debugEnhance()
  },

  clear: function (logEntry, info) {
    var attribs = {
      class: 'm_clear',
      'data-file': logEntry.meta.file,
      'data-line': logEntry.meta.line
    }
    var channelFilter = function () {
      return $(this).data('channel') === logEntry.meta.channel
    }
    var flags = logEntry.meta.flags
    var i
    var $tabPane = info.$tabPane
    var $curNodeLog
    var $curTreeSummary
    var $curTreeLog
    var $node
    var $remove
    var nodes = info.$node.closest('.tab-pane').data('nodes')
    var stackLen = nodes.length
    processSubstitutions(logEntry)
    for (i = stackLen - 1; i >= 0; i--) {
      $node = nodes[i]
      if ($node.closest('.debug-log-summary').length && !$curTreeSummary) {
        $curTreeSummary = $node.parentsUntil('.debug-log-summary')
          .addBack()
          .prev('.group-header')
          .addBack()
      } else if ($node.closest('.debug-log').length && !$curTreeLog) {
        $curNodeLog = $node
        $curTreeLog = $node.parentsUntil('.debug-log')
          .addBack()
          .prev('.group-header')
          .addBack()
      }
    }
    if (flags.alerts) {
      $tabPane.find('.alert').filter(channelFilter).remove()
    }
    if (flags.summary) {
      $tabPane.find('.debug-log-summary > .m_groupSummary').each(function () {
        $remove = $(this)
          .find('*')
          .not($curTreeSummary)
          .filter(channelFilter)
        if (!flags.summaryErrors) {
          $remove = $remove.not('.m_error, .m_warn')
        }
        $remove.filter('.group-header').not('.enhanced').debugEnhance('expand')
        $remove.remove()
      })
    } else if (flags.summaryErrors) {
      $tabPane.find('.debug-log-summary .m_error, .debug-log-summary .m_warn').filter(channelFilter).remove()
    }
    if (flags.log) {
      $remove = $tabPane
        .find('.debug-log > *, .debug-log .m_group > *')
        .not($curTreeLog)
        .filter(channelFilter)
      if (!flags.logErrors) {
        $remove = $remove.not('.m_error, .m_warn')
      }
      $remove.filter('.group-header').not('.enhanced').debugEnhance('expand')
      $remove.remove()
    } else if (flags.logErrors) {
      $tabPane.find('.debug-log .m_error, .debug-log .m_warn').filter(channelFilter).remove()
    }
    if (!flags.silent) {
      if (info.$node.closest('.debug-log-summary').length) {
        // we're in summary.. let's switch to content
        info.$node = $tabPane.find('.debug-log')
      }
      info.$node = $curNodeLog
      return $('<li>', attribs).html(logEntry.args[0])
    }
  },

  endOutput: function (logEntry, info) {
    var $container = info.$container
    var responseCode = logEntry.meta.responseCode
    $container.removeData('classDefinitions')
    $container.removeClass('working')
    $container.find('.card-header .fa-spinner').remove()
    $container.find('.debug > .fa-spinner').remove()
    if (responseCode && responseCode + '' !== '200') {
      $container.find('.card-title').append(' <span class="label label-default" title="Response Code">' + responseCode + '</span>')
      if (responseCode.toString().match(/^5/)) {
        $container.addClass('bg-danger')
      }
    }
    $container.trigger('endOutput')
  },

  errorNotConsoled: function (logEntry, info) {
    var $container = info.$container
    var $tabPane = info.$tabPane
    var $node = $tabPane.find('.alert.error-summary')
    if (!$node.length) {
      $node = $('<div class="alert alert-error error-summary">' +
        '<h3><i class="fa fa-lg fa-times-circle"></i> Error(s) not consoled</h3>' +
        '<ul class="list-unstyled">' +
        '</ul>' +
        '</div>')
      $tabPane.prepend($node)
    }
    $node = $node.find('ul')
    $node.append(buildEntryNode(logEntry, info))
    if (logEntry.meta.class === 'error') {
      $container
        .addClass('bg-danger')
        .removeClass('bg-warning') // could keep it.. but lets remove ambiguity
      return
    }
    if (!$container.hasClass('bg-danger')) {
      $container.addClass('bg-warning')
    }
  },

  group: function (logEntry, info) {
    var $group = $('<li>', {
      class: 'empty expanded m_group'
    })
    var $groupHeader = groupHeader(logEntry, info)
    var $groupBody = $('<ul>', {
      class: 'group-body'
    })
    var nodes = info.$tabPane.data('nodes')
    if (logEntry.meta.hideIfEmpty) {
      $group.addClass('hide-if-empty')
    }
    if (logEntry.meta.ungroup) {
      $group.addClass('ungroup')
    }
    if (logEntry.meta.level) {
      $groupHeader.addClass('level-' + logEntry.meta.level)
      $groupBody.addClass('level-' + logEntry.meta.level)
    }
    $group
      .append($groupHeader)
      .append($groupBody)
    nodes.push($groupBody)
    return $group
  },

  groupCollapsed: function (logEntry, info) {
    return this.group(logEntry, info).removeClass('expanded')
  },

  groupSummary: function (logEntry, info) {
    // see if priority already exists
    var priority = typeof logEntry.meta.priority !== 'undefined'
      ? logEntry.meta.priority // v2.1
      : logEntry.args[0]
    var $node
    var $tabPane = info.$tabPane
    var nodes = $tabPane.data('nodes')
    $tabPane.find('.debug-log-summary .m_groupSummary').each(function () {
      var priorityCur = $(this).data('priority')
      if (priorityCur === priority) {
        $node = $(this)
        return false // break
      } else if (priority > priorityCur) {
        $node = $('<li>')
          .addClass('m_groupSummary')
          .data('priority', priority)
          .html('<ul class="group-body"></ul>')
        $(this).before($node)
        return false // break
      }
    })
    if (!$node) {
      $node = $('<li>')
        .addClass('m_groupSummary')
        .data('priority', priority)
        .html('<ul class="group-body"></ul>')
      $tabPane
        .find('.debug-log-summary')
        .append($node)
    }
    $node = $node.find('> ul')
    nodes.push($node)
  },

  groupEnd: function (logEntry, info) {
    var $tabPane = info.$tabPane
    var nodes = $tabPane.data('nodes')
    var isSummaryRoot = nodes.length > 1 &&
      info.$node.hasClass('m_groupSummary')
    var $group
    var $toggle
    if (nodes.length > 1) {
      nodes.pop()
    }
    if (isSummaryRoot) {
      return
    }
    $toggle = info.$node.prev()
    $group = $toggle.parent()
    if ($group.hasClass('empty') && $group.hasClass('hide-if-empty')) {
      // console.log('remove', $group)
      // $toggle.remove()
      // info.$currentNode.remove()
      $group.remove()
    } else if ($group.hasClass('ungroup')) {
      var $children = $group.find('> ul.group-body > li')
      var $groupLabel = $group.find('> .group-header > .group-label')
      var $li = $('<li></li>').data($group.data())
      if ($children.length === 0) {
        $group.replaceWith(
          $li.html($groupLabel.html())
        )
      } else if ($children.length === 1 && $children.filter('.m_group').length === 0) {
        $group.replaceWith($children)
      }
    } else if ($group.hasClass('filter-hidden') === false && $group.is(':visible')) {
      // console.log('enhance')
      $group.debugEnhance()
    }
  },

  groupUncollapse: function (logEntry, info) {
    var $groups = info.$node.parentsUntil('.debug-log-summary, .debug-log').add(info.$node).filter('.m_group')
    $groups.addClass('expanded')
  },

  meta: function (logEntry, info) {
    /*
      Information about request
    */
    var $cardHeaderBody = info.$container.find('.card-header .card-header-body')
    var $title = $cardHeaderBody.find('.card-title')
    var date
    var isInit = Object.keys(info.$container.data()).length === 0
    var metaVals = logEntry.args[0]
    var meta = logEntry.meta
    var title = buildTitle(metaVals)
    var k
    var classDefinition
    if (isInit) {
      info.$container.data('classDefinitions', {})
      info.$container.data('meta', $.extend({
        debugVersion: meta.debugVersion,
        requestId: meta.requestId,
      }, metaVals))
    }
    if (meta.channelNameRoot) {
      info.$container.find('.debug').data('channelNameRoot', meta.channelNameRoot)
    }
    if (typeof meta.drawer === 'boolean') {
      info.$container.data('options', {
        drawer: meta.drawer
      })
    }
    if (meta.interface) {
      info.$container.find('.card-header').attr('data-interface', meta.interface)
    }
    if (title !== '') {
      $title.html(title)
    }
    if (metaVals.classDefinitions) {
      for (k in metaVals.classDefinitions) {
        classDefinition = metaVals.classDefinitions[k]
        classDefinition.implementsList = buildImplementsList(classDefinition.implements)
        if (k.substr(0, 6) === '_b64_:') {
          k = atob(k.substr(6))
        }
        info.$container.data('classDefinitions')[k] = classDefinition
      }
    }
    if (metaVals.REQUEST_TIME) {
      date = (new Date(metaVals.REQUEST_TIME * 1000)).toString().replace(/[A-Z]{3}-\d+/, '')
      $cardHeaderBody.prepend('<span class="float-end">' + date + '</span>')
    }
  },

  profileEnd: function (logEntry, info) {
    // var $node = this.table(logEntry, info)
    // return $node.removeClass('m_log').addClass('m_profileEnd')
    return this.table(logEntry, info)
  },

  table: function (logEntry, info) {
    var onBuildRow = []
    if (logEntry.method === 'trace') {
      onBuildRow.push(tableTraceRow)
    }
    if (logEntry.meta.inclContext) {
      onBuildRow.push(tableAddContextRow)
    }
    return $('<li>', { class: 'm_' + logEntry.method })
      .append(table.build(
        logEntry.args[0],
        logEntry.meta,
        onBuildRow,
        info
      ))
  },

  trace: function (logEntry, info) {
    return this.table(logEntry, info)
  },

  default: function (logEntry, info) {
    var attribs = {
      class: 'm_' + logEntry.method
    }
    var $container = info.$container
    var $node
    var method = logEntry.method
    var meta = logEntry.meta
    if (meta.file && meta.channel !== info.channelNameRoot + '.phpError') {
      attribs = $.extend({
        'data-file': meta.file,
        'data-line': meta.line
      }, attribs)
    }
    /*
      update card header to emphasize error
    */
    if (meta.errorCat) {
      attribs.class += ' error-' + meta.errorCat
      if (!meta.isSuppressed) {
        if (method === 'error') {
          // if suppressed, don't update card
          $container
            .addClass('bg-danger')
            .removeClass('bg-warning') // could keep it.. but lets remove ambiguity
        } else if (!$container.hasClass('bg-danger')) {
          $container.addClass('bg-warning')
        }
      }
    }
    if (meta.uncollapse !== undefined) {
      attribs['data-uncollapse'] = JSON.stringify(meta.uncollapse)
    }
    /*
    if (['assert', 'error', 'info', 'log', 'warn'].indexOf(method) > -1 && logEntry.args.length > 1)) {
    }
    */
    /*
      update tab
    */
    if (method === 'error') {
      getTab(info).addClass('has-error')
    } else if (method === 'warn') {
      getTab(info).addClass('has-warn')
    } else if (method === 'assert') {
      getTab(info).addClass('has-assert')
    }
    $node = buildEntryNode(logEntry, info)
    $node.attr(attribs)
    if (meta.trace && meta.trace.length > 1) {
      $node.append(
        $('<ul>', { class: 'list-unstyled no-indent' }).append(
          methods.trace({
            method: 'trace',
            args: [meta.trace],
            meta: meta,
          }, info).attr('data-detect-files', 'true')
        )
      )
      $node.find('.m_trace').debugEnhance()
    } else if (meta.context) {
      // console.log('context', meta.context)
      $node.append(
        buildContext(meta.context, meta.line)
      )
    }
    if ($node.is('.error-fatal')) {
      this.endOutput(logEntry, info)
    }
    return $node
  } // end default
}

function buildContext (context, lineNumber) {
  var keys = Object.keys(context || {}) // .map(function(val){return parseInt(val)}),
  var start = Math.min.apply(null, keys)
  return $('<pre>', {
    class: 'highlight line-numbers',
    'data-line': lineNumber,
    'data-start': start,
    'data-line-offset': start,
  }).append(
    $('<code>', {
      class: 'language-php'
    }).text(Object.values(context).join(''))
  )
}

function buildEntryNode (logEntry, requestInfo) {
  var i
  var glue = ', '
  var glueAfterFirst = true
  var args = logEntry.args
  var numArgs = args.length
  var typeInfo
  var typeMore
  logEntry.meta = $.extend({
    sanitize: true,
    sanitizeFirst: null
  }, logEntry.meta)
  if (logEntry.meta.sanitizeFirst === null) {
    logEntry.meta.sanitizeFirst = logEntry.meta.sanitize
  }
  // console.warn('buildEntryNode', JSON.parse(JSON.stringify(logEntry)))
  if (numArgs > 1) {
    processSubstitutions(logEntry)
    args = logEntry.args
    numArgs = args.length
  }
  if (typeof args[0] === 'string') {
    if (args[0].match(/[=:]\s*$/)) {
      // first arg ends with '=' or ':'
      glueAfterFirst = false
      args[0] = $.trim(args[0]) + ' '
    } else if (numArgs === 2) {
      glue = ' = '
    }
  }
  for (i = 0; i < numArgs; i++) {
    typeInfo = dump.getType(args[i])
    typeMore = typeInfo[1] !== 'abstraction'
      ? typeInfo[1]
      : (args[i].typeMore || null)
    args[i] = dump.dump(args[i], {
      addQuotes: i !== 0 || typeMore === 'numeric',
      requestInfo: requestInfo,
      sanitize: i === 0
        ? logEntry.meta.sanitizeFirst
        : logEntry.meta.sanitize,
      type: typeInfo[0],
      typeMore: typeInfo[1] || null,
      visualWhiteSpace: i !== 0
    })
  }
  return glueAfterFirst
    ? $('<li>').html(args.join(glue))
    : $('<li>').html(args[0] + ' ' + args.slice(1).join(glue))
}

function buildImplementsList(obj) {
  var list = []
  var key
  var val
  for (key in obj) {
    val = obj[key]
    if (typeof val === 'string') {
      list.push(val)
      continue
    }
    list.push(key)
    list = list.concat(buildImplementsList(val))
  }
  return list
}

function buildTitle (metaVals) {
  var title = ''
  if (metaVals.HTTPS === 'on') {
    title += '<i class="fa fa-lock fa-lg"></i> '
  }
  if (metaVals.REQUEST_METHOD) {
    title += metaVals.REQUEST_METHOD + ' '
  }
  if (metaVals.HTTP_HOST) {
    title += '<span class="http-host">' + metaVals.HTTP_HOST + '</span>'
  }
  if (metaVals.REQUEST_URI) {
    title += '<span class="request-uri">' + metaVals.REQUEST_URI + '</span>'
  }
  return title
}

function containsSubstitutions(logEntry)
{
  if (logEntry.args.length < 2 || typeof logEntry.args[0] !== 'string') {
    return false
  }
  return logEntry.args[0].match(subRegex) !== null
}

function getTab (info) {
  var classname = 'debug-tab-' + info.channelNameTop.toLowerCase().replace(/\W+/g, '-')
  return classname === 'debug-tab-general'
    ? $()
    : info.$container.find('.debug-menu-bar .nav-link[data-toggle=tab][data-target=".' + classname + '"]')
}

/**
 * Generates groupHeader HTML
 *
 * @return jQuery obj
 */
function groupHeader (logEntry, requestInfo) {
  var i = 0
  var $header
  var argStr = ''
  var argsAsParams = typeof logEntry.meta.argsAsParams !== 'undefined'
    ? logEntry.meta.argsAsParams
    : true
  var label = logEntry.args.shift()
  label = logEntry.meta.isFuncName
    ? dump.markupIdentifier(label, 'function')
    : dump.dump(label, {
      requestInfo: requestInfo
    }).replace(new RegExp('^<span class="t_string">(.+)</span>$', 's'), '$1')
  for (i = 0; i < logEntry.args.length; i++) {
    logEntry.args[i] = dump.dump(logEntry.args[i], {
      requestInfo: requestInfo,
    })
  }
  argStr = logEntry.args.join(', ')
  if (argsAsParams) {
    argStr = '<span class="group-label">' + label + '(</span>' +
      argStr +
      '<span class="group-label">)</span>'
    argStr = argStr.replace('(</span><span class="group-label">)', '')
  } else {
    argStr = '<span class="group-label">' + label + ':</span> ' +
      argStr
    argStr = argStr.replace(/:<\/span> $/, '</span>')
  }
  $header = $('<div class="group-header">' +
    argStr +
    '</div>')
  if (typeof logEntry.meta.boldLabel === 'undefined' || logEntry.meta.boldLabel) {
    $header.find('.group-label').addClass('font-weight-bold')
  }
  return $header
}

function markupFilePath(filePath, commonPrefix, docRoot) {
  var fileParts = parseFilePath(filePath, commonPrefix, docRoot)
  return (fileParts.docRoot ? '<span class="file-docroot">DOCUMENT_ROOT</span>' : '')
    + (fileParts.relPathCommon ? '<span class="file-basepath">' + dump.dump(fileParts.relPathCommon, {tagName:null}) + '</span>' : '')
    + (fileParts.relPath ? '<span class="file-relpath">' + dump.dump(fileParts.relPath, {tagName:null}) + '</span>' : '')
    + '<span class="file-basename">' + dump.dump(fileParts.baseName, {tagName:null}) + '</span>'
}

function parseFilePath (filePath, commonPrefix, docRoot) {
  var baseName = filePath.match(/[^\/]+$/)[0]
  var containsDocRoot = filePath.indexOf(docRoot) === 0
  var basePath = ''
  var relPath = filePath.slice(0, 0 - baseName.length)
  var maxLen = Math.max.apply(null, [
    commonPrefix ? commonPrefix.length : 0,
    containsDocRoot ? docRoot.length : 0,
  ])
  if (maxLen) {
    basePath = relPath.substring(0, maxLen)
    relPath = relPath.substring(maxLen)
    if (containsDocRoot) {
      basePath = basePath.substring(docRoot.length)
    }
  }
  return {
    docRoot: containsDocRoot ? docRoot : '',
    relPathCommon: basePath,
    relPath: relPath,
    baseName: baseName,
  }
}

/**
 * @param logEntry
 *
 * @return void
 */
function processSubstitutions (logEntry, opts) {
  var args = logEntry.args
  var argLen = args.length
  var index = 0
  var typeCounts = {
    c: 0
  }
  if (containsSubstitutions(logEntry) === false) {
    return
  }
  args[0] = dump.dump(args[0], {
    sanitize: logEntry.meta.sanitizeFirst,
    tagName: null
  })
  args[0] = args[0].replace(subRegex, function (match) {
    var replacement = match
    var type = match.substr(-1)
    index++
    if (index > argLen - 1) {
      return replacement
    }
    if ('di'.indexOf(type) > -1) {
      replacement = parseInt(args[index], 10)
    } else if (type === 'f') {
      replacement = parseFloat(args[index], 10)
    } else if (type === 's') {
      replacement = substitutionAsString(args[index])
    } else if (type === 'c') {
      replacement = ''
      if (typeCounts.c) {
        // close prev
        replacement = '</span>'
      }
      replacement += '<span style="' + args[index].escapeHtml() + '">'
    } else if ('oO'.indexOf(type) > -1) {
      replacement = dump.dump(args[index])
    }
    typeCounts[type] = typeCounts[type]
      ? typeCounts[type] + 1
      : 1
    delete args[index] // sets to undefined
    return replacement
  })
  if (typeCounts.c) {
    args[0] += '</span>'
  }
  logEntry.args = args.filter(function (val) {
    return val !== undefined
  })
  logEntry.meta.sanitizeFirst = false
}

/**
 * Coerce value to string
 *
 * @param mixed $val value
 *
 * @return string
 */
function substitutionAsString (val) {
  var type = dump.getType(val)
  if (type[0] === 'string') {
    return dump.stringDumper.dumpAsSubstitution(val)
  }
  if (type[0] === 'array') {
    delete val.__debug_key_order__
    return '<span class="t_keyword">array</span>' +
      '<span class="t_punct">(</span>' + Object.keys(val).length + '<span class="t_punct">)</span>'
  }
  if (type[0] === 'object') {
    return substitutionObjectAsString(val)
  }
  return dump.dump(val)
}

function substitutionObjectAsString (abs) {
  if (abs.stringified) {
    return abs.stringified
  }
  if (abs.methods.__toString.returnValue) {
    return abs.methods.__toString.returnValue
  }
  return dump.markupIdentifier(val.className, 'classname')
}

function tableAddContextRow ($tr, row, rowInfo, i) {
  // var keys = Object.keys(row.context || {}) // .map(function(val){return parseInt(val)}),
  // var start = Math.min.apply(null, keys)
  if (!rowInfo.context) {
    return $tr
  }
  i = parseInt(i, 10)
  $tr.attr('data-toggle', 'next')
  if (i === 0) {
    $tr.addClass('expanded')
  }
  return [
    $tr,
    $('<tr>', {
      class: 'context',
      style: i === 0
        ? 'display:table-row;'
        : null
    }).append(
      $('<td>', {
        colspan: 4
      }).append(
        [
          buildContext(rowInfo.context, row.line),
          Array.isArray(rowInfo.args) && rowInfo.args.length
            ? '<hr />Arguments = ' + dump.dump(row.args)
            : ''
        ]
      )
    )
  ]
}

function tableTraceRow ($tr, row, rowInfo, i) {
  // var tr = $tr[0].outerHTML
  var docRoot = rowInfo.requestInfo.$container.data('meta').DOCUMENT_ROOT || ''
  var filePath = markupFilePath(row.file, rowInfo.commonFilePrefix, docRoot)
  var method = row.function ? dump.markupIdentifier(row.function, 'method') : ''

  /*
  tr = tr.replace(
    '<td class="t_string">' + row.file + '</td>',
    '<td class="no-quotes t_string">'
      + (fileParts.docRoot ? '<span class="file-docroot">DOCUMENT_ROOT</span>' : '')
      + (fileParts.relPathCommon ? '<span class="file-basepath">' + fileParts.relPathCommon + '</span>' : '')
      + (fileParts.relPath ? '<span class="file-relpath">' + fileParts.relPath + '</span>' : '')
      + '<span class="file-basename">' + fileParts.baseName + '</span>'
      + '</td>'
  )
  if (fileParts.docRoot) {
    tr = tr.replace(
        '<tr>',
        '<tr data-file="' + row.file.escapeHtml() + '">'
    )
  }
  tr = tr.replace(
    '<td class="t_string">' + row.function.escapeHtml() + '</td>',
    '<td class="no-quotes t_identifier t_string">' + dump.markupIdentifier(row.function, 'method') + '</td>'
  )
  */

  $tr.find('td.t_string').eq(0).html(filePath).addClass('no-quotes')
  if (filePath.indexOf('DOCUMENT_ROOT') >= 0) {
    $tr.attr('data-file', row.file)
  }
  $tr.find('td.t_string').eq(1).html(method).addClass('no-quotes t_identifier')

  return $tr
}
