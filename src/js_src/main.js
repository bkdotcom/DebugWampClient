import $ from 'zest' // external global
import PubSub from './PubSub.js'
import './prototypeMethods.js' // import for side-effects only
import * as ui from './ui/ui.js'
import * as logger from './Logger/Logger.js'
import { Xdebug } from './Xdebug/Xdebug.js'
import { Config } from './Config.js'
import { SocketWorker as Wamp } from './wamp/SocketWorker.js'

var config = new Config({
  theme: 'auto',
  url: 'ws://127.0.0.1:9090/',
  realm: 'debug',
  fontSize: '1em',
  linkFiles: false,
  linkFilesTemplate: 'subl://open?url=file://%file&line=%line',
}, 'debugWampClient')

initWamp()
var xdebug = initXdebug()

$(function () {
  var hasConnected = false
  var $root = $('#debug-cards')

  /*
    init on #debug-cards vs body so we can stop event propagation before bubbles to body  (ie clipboard.js)
  */
  $root.debugEnhance('init', {
    sidebar: true,
    useLocalStorage: false,
  })

  ui.init(config)
  logger.init($root.data('config'))

  PubSub.subscribe('wamp', function (cmd, data) {
    var logEntry = {}
    if (cmd === 'msg') {
      logEntry = {
        method: data.msg[0],
        args: data.msg[1],
        meta: data.msg[2],
      }
      if (data.topic === 'bdk.debug') {
        logger.processEntry(logEntry)
        if (logEntry.method === 'meta' && logEntry.meta.linkFilesTemplateDefault) {
          config.setDefault({
            linkFiles: true,
            linkFilesTemplate: logEntry.meta.linkFilesTemplateDefault,
          })
        }
      } else if (data.topic === 'bdk.debug.xdebug') {
        xdebug.processEntry(logEntry)
      }
      // myWorker.postMessage('getMsg') // request next msg
      PubSub.publish('wamp', 'getMsg')
    } else if (cmd === 'connectionClosed') {
      $('#alert.connecting').remove()
      if ($('#alert.closed').length) {
        return
      }
      $('#debug-cards').prepend(
        '<div id="alert" class="alert alert-warning alert-dismissible closed">' +
          'Not connected to debug server' +
          '<button type="button" class="btn-close" data-dismiss="alert" aria-label="Close"></button>' +
        '</div>'
      )
      if (!config.haveSavedConfig && !hasConnected) {
        $('#modal-settings').modal('show')
      }
    } else if (cmd === 'connectionOpened') {
      hasConnected = true
      $('#alert').remove()
    }
  })

  // myWorker.postMessage(['setCfg', config.get()])
  // myWorker.postMessage('connectionOpen')
  // console.log('config', config)
  // events.publish('onmessage', 'setCfg', config.get())
  PubSub.publish('wamp', 'connectionOpen')

  PubSub.subscribe('phpDebugConsoleConfig', function (vals) {
    $root.debugEnhance('setConfig', vals)
  })

  config.checkPhpDebugConsole()
})

function initWamp () {
  return new Wamp(PubSub, config)
}

function initXdebug () {
  return new Xdebug(PubSub)
}
