import $ from 'jquery' // external global
import * as methods from './../Logger/Methods.js'

export function Xdebug(pubSub) {
	var self = this;
	console.warn('Xdebug init');
	this.pubSub = pubSub
	$('body').on('click', '.xdebug-commands .btn[data-cmd]', function () {
		var cmd = $(this).data('cmd')
		console.warn('clicked', cmd)
		self.pubSub.publish('wamp', 'publish', 'bdk.debug.xdebug', [cmd])
    $(this).blur();
	})
  $('body').on('shown.bs.collapse', '.card-body', function (e) {
    var $menuBar = $(this).find('.xdebug-menu-bar')
    self.positionToolbar($menuBar)
  })
}

Xdebug.prototype.positionToolbar = function($menuBar) {
  console.warn('positionToolbar', $menuBar)
  var $card = $menuBar.closest('.card')
  console.warn({
    navbarHeight: $('nav.navbar').outerHeight(),
    cardHeaderOuterHeight: $card.find('> .card-header').outerHeight(),
    debugMenuBarOuterHeight: $card.find('> .card-body > .debug-menu-bar').outerHeight()
  })
  $menuBar.css('top',
    (
      $('nav.navbar').outerHeight() +
      $card.find('> .card-header').outerHeight() +
      $card.find('> .card-body > .debug-menu-bar').outerHeight()
    ) + 'px'
  )
}

Xdebug.prototype.processEntry = function (logEntry) {
  console.log('Xdebug.processEntry', JSON.parse(JSON.stringify(logEntry)));
  var info = this.getNodeInfo()
  var method = logEntry.method
  var meta = logEntry.meta
  var $node
  try {
	  if (methods.methods[method]) {
	    $node = methods.methods[method](logEntry, info)
	  } else {
	    $node = methods.methods.default(logEntry, info)
	  }
    if (!$node) {
      return
    }
    if (meta.detectFiles) {
      // using attr so can find via css selector
      $node.attr('data-detect-files', meta.detectFiles)
      $node.attr('data-found-files', meta.foundFiles ? meta.foundFiles : [])
    }
    info.$node.append($node)
  } catch (err) {
    console.warn('Xdebug.processEntry error', err)
    console.log('logEntry', logEntry)
  }
}

Xdebug.prototype.getNodeInfo = function () {
  var id = 'xdebug'
  // var $container = $('#' + id)
  var $container = $('#debug-cards .card.working').filter(function () {
    var data = $(this).data()
    console.warn('data', data)
    return true
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
        '<div class="btn-group xdebug-commands" role="group" aria-label="Xdebug Commands">' +
          '<button type="button" class="btn btn-secondary" data-cmd="run" title="Run"><i class="fa fa-play"></i></button>' +
          '<button type="button" class="btn btn-secondary" data-cmd="step_into" title="Step Into"><img src="?action=img&amp;src=icon/step_into.svg" style="width:18px; height:18px;" /></button>' +
          '<button type="button" class="btn btn-secondary" data-cmd="step_over" title="Step Over"><img src="?action=img&amp;src=icon/step_over.svg" style="width:18px; height:18px;" /></button>' +
          '<button type="button" class="btn btn-secondary" data-cmd="step_out" title="Step Out"><img src="?action=img&amp;src=icon/step_out.svg" style="width:18px; height:18px;" /></button>' +
          '<button type="button" class="btn btn-secondary" data-cmd="stop" title="Stop Script"><i class="fa fa-stop"></i></button>' +
          '<button type="button" class="btn btn-secondary" data-cmd="detatch" title="Stop Debugging"><i class="fa fa-sign-out"></i></button>' +
        '</div>' +
      '</header>'
    )
    $xdebug = $('<ul class="xdebug group-body"></ul>')
    $container.find('.debug > header').after($menuBar)
    $container.find('.tab-primary .tab-body').append($xdebug)
    this.positionToolbar($menuBar)
  }

  info = {
    $container: $container,
    $node: $xdebug
    // $tabPane: null,
    // channelName: channelName,
    // channelNameRoot: channelNameRoot,
    // channelNameTop: channelSplit.shift(), // ie channelName of tab
    // channels: []
  }
  return info
}

function nameToClassname (name) {
  return 'debug-tab-' + name.toLowerCase().replace(/\W+/g, '-')
}
