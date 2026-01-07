import $ from 'zest' // external global
import * as methods from './../Logger/Methods.js'

export function Xdebug (pubSub) {
  var self = this
  var $root = $('#debug-cards')
  this.pubSub = pubSub
  this.contextMsgReceived = null
  this.contextTimer = null
  $root.on('click', '.xdebug-commands .btn[data-cmd]', function () {
    var cmd = $(this).data('cmd')
    var appId = $(this).closest('.card-body').find('.xdebug').data('appId')
    $(this).blur()
    self.sendCmd(appId, cmd)
  })
  $root.on('click', '.xdebug-menu-bar .btn[data-target]', function () {
    var $node = $(this).closest('.card-body').find($(this).data('target'))
    $(this).blur()
    self.scrollIntoView($node)
  })
  $root.on('expanded.debug.array expanded.debug.object', '.max-depth', function (e) {
    var appId = $(this).closest('.card-body').find('.xdebug').data('appId')
    // console.log('xdebug expanded .max-depth', this)
    $(this).find('.array-inner, .object-inner').html(
      '<i class="fa fa-spinner fa-pulse fa-lg"></i>'
    )
    self.sendCmd(
      appId,
      'property_get',
      {
        n: $(this).data('fullname'),
      }
    )
  })
  $root.on('shown.bs.collapse', '.card-body', function (e) {
    var $menuBar = $(this).find('.xdebug-menu-bar')
    self.positionToolbar($menuBar)
  })
  $root.on('endOutput', '.card', function (e) {
    self.remove(this)
  })
}

Xdebug.prototype.sendCmd = function (appId, cmd, args, data) {
  this.pubSub.publish(
    'wamp',
    'publish',
    'bdk.debug.xdebug',
    [appId, cmd, args, data]
  )
}

Xdebug.prototype.positionToolbar = function ($menuBar) {
  var $card = $menuBar.closest('.card')
  $menuBar.style('top',
    (
      $('nav.navbar').outerHeight() +
      $card.find('> .card-header').outerHeight() +
      $card.find('> .card-body > .debug-menu-bar').outerHeight()
    ) + 'px'
  )
}

Xdebug.prototype.processEntry = function (logEntry) {
  var method = logEntry.method
  var meta = logEntry.meta
  var nodeInfo = this.getNodeInfo(meta.appId)
  var $node
  var $node2
  var self = this
  // console.log('Xdebug.processEntry', JSON.parse(JSON.stringify(logEntry)))
  try {
    if (meta.status === 'break') {
      // console.info('received break')
      this.contextMsgReceived = null
      this.contextTimer = setTimeout(function () {
        if (self.contextMsgReceived === null) {
          // console.warn('received break status, but no context')
          // get globals
          self.sendCmd(
            meta.appId,
            'context_get',
            { c: 1 }
          )
          // get local
          self.sendCmd(
            meta.appId,
            'context_get',
            { c: 0 }
          )
        }
      }, 250)
    } else if (meta.command === 'context_get') {
      this.contextMsgReceived = logEntry
      clearTimeout(self.contextTimer)
    }
    if (method === 'xdebug') {
      // if (meta.status === 'stopping') {
      // }
      if (['property_get', 'property_value'].indexOf(meta.command) > -1) {
        $node = methods.methods.default(logEntry, nodeInfo).find('> *') // array = span, object = div
        // find  open .max-depth where data-fullname = meta.fullname
        $node2 = nodeInfo.$node.find('.max-depth.expanded').filter(function (nodeTemp) {
          return $(nodeTemp).data('fullname') === meta.fullname
        })
        $node2.replaceWith($node)
        $node.debugEnhance().debugEnhance('expand')
      }
      return
    }
    $node = methods.methods[method]
      ? methods.methods[method](logEntry, nodeInfo)
      : methods.methods.default(logEntry, nodeInfo)
    if (!$node) {
      return
    }
    if (meta.status === 'break') {
      nodeInfo.$node.html('<li class="m_info" style="display:block; margin: 8px -10px; border-bottom: solid 1px; font-weight:bold;">Xdebug</li>')
      self.scrollIntoView(nodeInfo.$node)
    }
    if (meta.detectFiles) {
      // using attr so can find via css selector
      $node.attr('data-detect-files', meta.detectFiles)
      $node.attr('data-found-files', meta.foundFiles ? meta.foundFiles : [])
    }
    nodeInfo.$node.append($node)
    $node.debugEnhance()
  } catch (err) {
    console.warn('Xdebug.processEntry error', err, logEntry)
  }
}

Xdebug.prototype.getNodeInfo = function (appId) {
  var id = 'xdebug'
  // var $container = $('#' + id)
  var $container = $('#debug-cards .card.working').filter(function () {
    var dataCard = $(this).data() || {}
    var dataXdebug = $(this).find('.xdebug').data() || {}
    if (dataXdebug.appId === appId) {
      // xdebug appId match
      return true
    }
    if (dataCard.meta.processId === appId) {
      // card processId match
      return true
    }
    return false
  }).last()
  var info = {}
  var channelNameRoot = 'general'
  var $xdebug
  var $menuBar
  /*
    Step 1: find or create primary container (card)
  */
  if ($container.length === 0) {
    $container = $('' +
      '<div class="card mb-3 sticky" id="' + id + '">' +
        '<div class="card-header" data-toggle="collapse" data-target="#' + id + ' &gt; .collapse">' +
          '<i class="fa fa-chevron-right"></i>' +
          '<i class="fa fa-times float-right btn-remove-session"></i>' +
          '<div class="card-header-body">' +
            '<h3 class="card-title">xdebug</h3>' +
            // '<i class="fa fa-spinner fa-pulse fa-lg"></i>' +
          '</div>' +
        '</div>' +
        '<div class="bg-white card-body collapse debug debug-enhanced-ui">' +
          '<header class="debug-bar debug-menu-bar">' +
          /*
            '<nav role="tablist">' +
              '<a class="active nav-link" data-target=".' + nameToClassname(channelNameRoot) + '" data-toggle="tab" role="tab"><i class="fa fa-list-ul"></i>Log</a>' +
            '</nav>' +
          */
          '</header>' +
          '<div class="tab-panes">' +
            '<div class="active ' + nameToClassname(channelNameRoot) + ' tab-pane tab-primary" role="tabpanel">' +
              '<div class="sidebar-trigger"></div>' +
              '<div class="tab-body">' +
                '<ul class="debug-log-summary group-body"></ul>' +
                '<ul class="debug-log group-body"></ul>' +
              '</div>' +
            '</div>' +
          '</div>' +
          // '<i class="fa fa-spinner fa-pulse"></i>' +
        '</div>' +
      '</div>'
    )
    $('#debug-cards').append($container)
  }
  /*
    Step 2: find or create xdebug area
  */
  $xdebug = $container.find('.xdebug')
  if ($xdebug.length === 0) {
    $menuBar = $('' +
      '<header class="debug-bar xdebug-menu-bar">' +
        '<div class="btn-toolbar" role="toolbar" aria-label="Xdebug">' +
          '<div class="btn-group xdebug-commands mr-2" role="group" aria-label="Xdebug Commands">' +
            '<button type="button" class="btn btn-secondary" data-cmd="run" title="Run"><i class="fa fa-play"></i></button>' +
            '<button type="button" class="btn btn-secondary" data-cmd="step_into" title="Step Into"><img src="?action=img&amp;src=icon/step_into.svg" style="width:18px; height:18px;" /></button>' +
            '<button type="button" class="btn btn-secondary" data-cmd="step_over" title="Step Over"><img src="?action=img&amp;src=icon/step_over.svg" style="width:18px; height:18px;" /></button>' +
            '<button type="button" class="btn btn-secondary" data-cmd="step_out" title="Step Out"><img src="?action=img&amp;src=icon/step_out.svg" style="width:18px; height:18px;" /></button>' +
            '<button type="button" class="btn btn-secondary" data-cmd="stop" title="Stop Script"><i class="fa fa-stop"></i></button>' +
            '<button type="button" class="btn btn-secondary" data-cmd="detatch" title="Stop Debugging"><i class="fa fa-sign-out"></i></button>' +
          '</div>' +
          '<div class="btn-group" role="group">' +
            '<button type="button" class="btn btn-secondary" data-target=".xdebug" title="Jump to Xdebug Info"><i class="fa fa-link"></i></button>' +
          '</div>' +
         '</div>' +
      '</header>'
    )
    $xdebug = $('<ul class="xdebug group-body"></ul>')
    $xdebug.data('appId', appId)
    $container.find('.debug > header').after($menuBar)
    $container.find('.tab-primary .tab-body').append($xdebug)
    this.positionToolbar($menuBar)
  }

  info = {
    $container: $container,
    $node: $xdebug,
    $toolbar: $container.find('.xdebug-menu-bar'),
  }
  return info
}

Xdebug.prototype.remove = function ($container) {
  $container = $($container)
  $container.find('.xdebug-menu-bar').remove()
  $container.find('.xdebug.group-body').remove()
}

Xdebug.prototype.scrollIntoView = function (node) {
  var toolbarBottom = $(node).closest('.card-body').find('.xdebug-menu-bar')[0].getBoundingClientRect().bottom
  var nodePos
  var adjustY
  node = $(node)[0]
  nodePos = node.getBoundingClientRect()
  adjustY = nodePos.top - toolbarBottom
  /*
  console.warn('scrollIntoView', {
    toolbarBottom: toolbarBottom,
    nodePosTop: nodePos.top,
    adjustY: adjustY
  })
  */
  window.scrollBy(0, adjustY)
}

function nameToClassname (name) {
  return 'debug-tab-' + name.toLowerCase().replace(/\W+/g, '-')
}
