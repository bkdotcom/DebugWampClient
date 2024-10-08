(function ($$1) {
  'use strict';

  $$1 = $$1 && Object.prototype.hasOwnProperty.call($$1, 'default') ? $$1['default'] : $$1;

  var PubSub = (function () {
    var topics = {};
    var hOP = topics.hasOwnProperty;
    return {
      publish: function (topic, args) {
        // If the topic doesn't exist, or there's no listeners in queue, just leave
        // console.info('publish', topic, args)
        if (!hOP.call(topics, topic)) {
          return
        }
        // Cycle through topics queue, fire!
        args = Array.prototype.slice.call(arguments, 1);
        topics[topic].forEach(function (item) {
          // item(info !== undefined ? info : {})
          item.apply(this, args);
        });
      },
      subscribe: function (topic, listener) {
        // Create the topic's object if not yet created
        if (!hOP.call(topics, topic)) {
          topics[topic] = [];
        }
        // Add the listener to queue
        var index = topics[topic].push(listener) - 1;
        // Provide handle back for removal of topic
        return {
          remove: function () {
            delete topics[topic][index];
          }
        }
      }
    }
  })();

  /*
  eslint no-extend-native: ["error", { "exceptions": ["String"] }]
  */

  Number.isSafeInteger = Number.isSafeInteger || function (value) {
    return Number.isInteger(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER
  };

  Number.isInteger = Number.isInteger || function (nVal) {
    return typeof nVal === 'number' &&
      isFinite(nVal) &&
      nVal > -9007199254740992 && nVal < 9007199254740992 &&
      Math.floor(nVal) === nVal
  };

  if (!Array.isArray) {
    Array.isArray = function (arg) {
      return Object.prototype.toString.call(arg) === '[object Array]'
    };
  }

  if (!String.prototype.trim) {
    String.prototype.trim = function () {
      return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
    };
  }
  if (!Object.keys) {
    Object.keys = function (o) {
      if (o !== Object(o)) {
        throw new TypeError('Object.keys called on a non-object')
      }
      var k = [];
      var p;
      for (p in o) {
        if (Object.prototype.hasOwnProperty.call(o, p)) {
          k.push(p);
        }
      }
      return k
    };
  }

  String.prototype.escapeHtml = function () {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return this.replace(/[&<>"']/g, function (m) { return map[m] })
  };

  String.prototype.parseHex = function () {
    return this.replace(/\\x([A-F0-9]{2})/gi, function (a, b) {
      return String.fromCharCode(parseInt(b, 16))
    })
  };

  String.prototype.ucfirst = function () {
    return this.charAt(0).toUpperCase() + this.slice(1)
  };

  function findCssRule (stylesheet, selector) {
    var rules = stylesheet.cssRules;
    var len = rules.length;
    var i;
    var rule;
    for (i = 0; i < len; i++) {
      rule = rules[i];
      if (rule.selectorText === selector) {
        return rule
      }
    }
    // not found -> create
    stylesheet.insertRule(selector + ' {  }');
    return stylesheet.cssRules[0]
  }

  function updateCssProperty (stylesheet, selector, rule, value) {
    // console.log('updateCssProperty', stylesheet)
    var sheet = typeof stylesheet === 'string'
      ? document.getElementById(stylesheet).sheet
      : stylesheet;
    var cssRule = findCssRule(sheet, selector);
    var ruleCamel = rule.replace(/-([a-z])/g, function (matach, p1) {
      return p1.toUpperCase()
    });
    cssRule.style[ruleCamel] = value;
  }

  function init (config) {
    $$1('#link-files').on('change', function () {
      var isChecked = $$1(this).prop('checked');
      var $templateGroup = $$1('#link-files-template').closest('.form-group');
      isChecked
        ? $templateGroup.slideDown()
        : $templateGroup.slideUp();
    }).trigger('change');

    $$1('#modal-settings').on('submit', function (e) {
      e.preventDefault();
      config.set({
        url: $$1('#wsUrl').val(),
        realm: $$1('#realm').val(),
        fontSize: $$1('#font-size').val(),
        linkFiles: $$1('#link-files').prop('checked'),
        linkFilesTemplate: $$1('#link-files-template').val()
      });
      $$1(this).modal('hide');
    });

    $$1('#modal-settings').on('hide.bs.modal', function (e) {
      updateCssProperty('wampClientCss', '#debug-cards', 'font-size', config.get('fontSize'));
    });

    $$1('#modal-settings').on('show.bs.modal', function (e) {
      $$1('#wsUrl').val(config.get('url'));
      $$1('#realm').val(config.get('realm'));
      $$1('#font-size').val(config.get('fontSize'));
      $$1('#link-files').prop('checked', config.get('linkFiles')).trigger('change');
      $$1('#link-files-template').val(config.get('linkFilesTemplate'));
    });
  }

  var classCollapsed = 'fa-chevron-right';
  var classExpanded = 'fa-chevron-down';
  var timeoutHandler;
  var navbarHeight; // = $('nav.navbar').outerHeight()
  var $cardsInViewport = $$1();

  function init$1 (config) {
    var io = new IntersectionObserver(
      function (entries) {
        // console.log('IntersectionObserver update', entries)
        var i;
        var len = entries.length;
        var entry;
        for (i = 0; i < len; i++) {
          entry = entries[i];
          if (entry.isIntersecting === false) {
            // console.log('no longer visible', entry.target)
            $cardsInViewport = $cardsInViewport.not(entry.target);
            continue
          }
          // console.log('now visible', entry.target)
          $cardsInViewport = $cardsInViewport.add(entry.target);
        }
        // console.log('open cardsInViewport', $cardsInViewport.filter('.expanded').length, $cardsInViewport.filter('.expanded'))
      },
      {
        // options
        rootMargin: '-39px 0px 0px 0px'
      }
    );

    $$1('.navbar .clear').on('click', function () {
      console.time('clear');
      $$1('#debug-cards > .card').not('.working').trigger('removed.debug.card');
      console.timeEnd('clear');
    });

    $$1('#debug-cards').on('added.debug.card', function (e) {
      // console.warn('card added', e.target, e)
      io.observe(e.target);
    });
    $$1('#debug-cards').on('removed.debug.card', function (e) {
      // console.warn('card removed', e.target, e)
      var $card = $$1(e.target);
      io.unobserve(e.target);
      $cardsInViewport = $cardsInViewport.not(e.target);
      if ($card.hasClass('working')) {
        console.warn('removed working session:' + $card.prop('id'));
      }
      $card.remove();
    });

    $$1('body').on('mouseup', function (e) {
      if (timeoutHandler) {
        e.preventDefault();
        clearInterval(timeoutHandler);
        timeoutHandler = null;
      }
    });

    // test for long-press of main clear button
    $$1('.clear').on('mousedown', function (e) {
      timeoutHandler = setTimeout(function () {
        // has been long pressed (3 seconds)
        // clear all (incl working)
        $$1('#debug-cards > .card').trigger('removed.debug.card');
      }, 2000);
    });

    $$1('body').on('shown.bs.collapse hidden.bs.collapse', '.card-body', function (e) {
      var $cardBody = $$1(this);
      var $card = $cardBody.closest('.card');
      var $cardHeader = $card.find('> .card-header');
      var $icon = $card.find('.card-header .' + classCollapsed + ', .card-header .' + classExpanded);
      $icon.toggleClass(classExpanded + ' ' + classCollapsed);
      $card.toggleClass('expanded');
      if (e.type === 'shown') {
        $cardHeader.css('top', navbarHeight + 'px');
        $cardBody.find('> .debug-menu-bar').css('top', (
          navbarHeight +
          $cardHeader.outerHeight()
        ) + 'px');
        // event listener will call .debugEnhance() on relevant elements
        $cardBody.find('> .tab-panes > .tab-pane.active').trigger('shown.debug.tab');
      }
    });

    // close btn on card-header clicked
    $$1('body').on('click', '.btn-remove-session', function (e) {
      $$1(this).closest('.card').trigger('removed.debug.card');
    });

    $$1(window).on('scroll', debounce(function () {
      // console.group('scroll')
      $cardsInViewport.filter('.expanded').each(function () {
        positionSidebar($$1(this));
      });
      // console.groupEnd()
    }, 50));

    $$1('body').on('open.debug.sidebar', function (e) {
      // console.warn('open.debug.sidebar')
      var $sidebar = $$1(e.target);
      var $card = $sidebar.closest('.card');
      var sidebarContentHeight = $sidebar.find('.sidebar-content').height();
      // var minHeight = Math.max(sidebarContentHeight + 8, 200)
      $card.find('.card-body > .tab-panes > .tab-pane').css({
        minHeight: sidebarContentHeight + 'px'
      });
      positionSidebar($card);
      $$1('body').on('click', onBodyClick);
    });

    $$1('body').on('close.debug.sidebar', function (e) {
      // remove minHeight
      var $card = $$1(e.target).closest('.card');
      positionSidebar($card);
      // $card.find('.card-body .tab-pane').attr('style', '')
      $$1('body').off('click', onBodyClick);
    });

    $$1('body').on('click', '.card-header[data-toggle=collapse]', function () {
      var $target = $$1($$1(this).data('target'));
      navbarHeight = $$1('nav.navbar').outerHeight();
      $target.collapse('toggle');
    });

    /*
    $('body').on('click', '.sidebar-tab', function (e){
      var $card = $(e.target).closest('.card')
      var sidebarIsOpen = $card.find('.debug-sidebar.show').length > 0
      $card.debugEnhance('sidebar', sidebarIsOpen ? 'close' : 'open')
    })
    */

    $$1('body').on('mouseenter', '.sidebar-trigger', function () {
      $$1(this).closest('.card').debugEnhance('sidebar', 'open');
    });

    $$1('body').on('mouseleave', '.debug-sidebar', function () {
      $$1(this).closest('.card').debugEnhance('sidebar', 'close');
    });

    updateCssProperty('wampClientCss', '.debug', 'font-size', 'inherit');
    updateCssProperty('wampClientCss', '#debug-cards', 'font-size', config.get('fontSize'));

    init(config);

    // note:  navbar may not yet be at final height
    navbarHeight = $$1('nav.navbar').outerHeight();
  }

  function debounce (fn, ms) {
    // Avoid wrapping in `setTimeout` if ms is 0 anyway
    if (ms === 0) {
      return fn
    }

    var timeout;
    return function (arg) {
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        fn(arg);
      }, ms);
    }
  }

  function onBodyClick (e) {
    if ($$1(e.target).closest('.debug-sidebar').length === 0) {
      $$1('.debug-sidebar.show').closest('.card').debugEnhance('sidebar', 'close');
    }
  }

  function positionSidebar ($card) {
    var $cardBody = $card.find('.card-body');
    var $sidebar = $card.find('.debug-sidebar');
    // var scrollTop = $(window).scrollTop()
    var cardOffset = $card[0].getBoundingClientRect().top;
    var isSticky = cardOffset <= navbarHeight;
    // for height calculations, we will consider menubar as part of header vs body
    var menubarHeight = $cardBody.find('> .debug-menu-bar').outerHeight();
    var bodyHeight = $cardBody.outerHeight() - menubarHeight;
    var bodyOffset = $cardBody[0].getBoundingClientRect().top + menubarHeight;
    var headerHeight = bodyOffset - cardOffset + menubarHeight;
    // var headerHeight = $card.find('> .card-header').outerHeight() + menubarHeight
    var heightVis = bodyOffset + bodyHeight - headerHeight;
    var heightHidden = bodyHeight - heightVis;
    var contentHeight = $sidebar.find('.sidebar-content').height();
    // var sidebarTopFixed = navbarHeight + headerHeight
    var sidebarTop = heightHidden + (parseInt($$1('body').css('paddingTop')) - navbarHeight);

    $sidebar.attr('style', '');
    if (isSticky) {
      if (contentHeight > heightVis && $sidebar.hasClass('show')) {
        sidebarTop -= contentHeight - heightVis + 8;
      }
      $sidebar.css({
        // position: 'fixed', // sticky would be nice, but still visible when docked off to the left
        // top: topSidebarFixed + 'px', // position: fixed
        top: sidebarTop + 'px' // position absolute
        // height: heightVis + 'px'
      });
    }
  }

  var $table;

  function Table (dump) {
    this.dump = dump;
  }

  Table.prototype.build = function (rows, meta, onBuildRow) {
    // console.warn('Table.build', meta, classname)
    meta = $$1.extend({
      attribs: {
        class: [
          'table-bordered',
          meta.sortable ? 'sortable' : null,
          meta.inclContext ? 'trace-context' : null
        ]
      },
      caption: '',
      tableInfo: {}
    }, meta);
    if (meta.caption === null) {
      meta.caption = '';
    }
    $table = $$1('<table>' +
      '<caption>' + meta.caption.escapeHtml() + '</caption>' +
      '<thead><tr><th>&nbsp;</th></tr></thead>' +
      '<tbody></tbody>' +
      '</table>'
    )
      .addClass(meta.attribs.class.join(' '));
    this.buildHeader(meta.tableInfo);
    this.buildBody(rows, meta.tableInfo, onBuildRow);
    this.buildFooter(meta.tableInfo);
    return $table
  };

  Table.prototype.buildBody = function (rows, tableInfo, onBuildRow) {
    var i;
    var length;
    var i2;
    var length2;
    var parsed;
    var rowKeys = rows.__debug_key_order__ || Object.keys(rows);
    var rowKey;
    var key;
    var row;
    var rowInfo;
    var $tbody = $table.find('> tbody');
    var $tr;
    delete rows.__debug_key_order__;
    for (i = 0, length = rowKeys.length; i < length; i++) {
      rowKey = rowKeys[i];
      row = rows[rowKey];
      rowInfo = typeof tableInfo.rows[rowKey] !== 'undefined'
        ? tableInfo.rows[rowKey]
        : {};
      if (rowInfo.key) {
        rowKey = rowInfo.key;
      }
      // using for in, so every key will be a string
      //  check if actually an integer
      if (typeof rowKey === 'string' && rowKey.match(/^\d+$/) && Number.isSafeInteger(rowKey)) {
        rowKey = parseInt(rowKey, 10);
      }
      parsed = this.dump.parseTag(this.dump.dump(rowKey));
      $tr = $$1('<tr></tr>', rowInfo.attribs || {})
        .append(
          $$1('<th scope="row" class="t_key text-right"></th>')
            .addClass(/^\d+$/.test(rowKey) ? 't_int' : parsed.attribs.class.join(' '))
            .html(parsed.innerhtml)
        );

      if (tableInfo.haveObjRow) {
        $tr.append(
          rowInfo.class
            ? $$1(this.dump.markupIdentifier(rowInfo.class, 'classname', 'td'))
              .attr('title', rowInfo.summary)
            : '<td class="t_undefined"></td>'
        );
      }
      for (i2 = 0, length2 = tableInfo.columns.length; i2 < length2; i2++) {
        key = tableInfo.columns[i2].key;
        /*
        parsed = this.dump.parseTag(this.dump.dump(row[key], true))
        parsed.attribs.class = parsed.attribs.class.join(' ')
        $tr.append(
          $('<td />').html(parsed.innerhtml).attr(parsed.attribs)
        )
        */
        $tr.append(this.dump.dump(row[key], { tagName: 'td' }));
      }
      if (onBuildRow) {
        $tr = onBuildRow($tr, row, rowInfo, rowKey);
      }
      $tbody.append($tr);
    }
  };

  /*
    Add totals (tfoot)
  */
  Table.prototype.buildFooter = function (tableInfo) {
    var cells = [];
    var colHasTotal;
    var haveTotal = false;
    var i;
    var info;
    var length = tableInfo.columns.length;
    for (i = 0; i < length; i++) {
      info = tableInfo.columns[i];
      colHasTotal = typeof info.total !== 'undefined';
      haveTotal = haveTotal || colHasTotal;
      if (colHasTotal) {
        info.total = parseFloat(info.total.toFixed(6), 10);
        cells.push(this.dump.dump(info.total, { tagName: 'td' }));
        continue
      }
      cells.push('<td></td>');
    }
    if (haveTotal) {
      $table.append('<tfoot>' +
        '<tr><td>&nbsp;</td>' +
          (tableInfo.haveObjRow ? '<td>&nbsp;</td>' : '') +
          cells.join('') +
        '</tr>' +
        '</tfoot>'
      );
    }
  };

  Table.prototype.buildHeader = function (tableInfo) {
    var i;
    var info;
    var label;
    var length = tableInfo.columns.length;
    var $theadTr = $table.find('thead tr');
    if (tableInfo.haveObjRow) {
      $theadTr.append('<th>&nbsp;</th>');
    }
    for (i = 0; i < length; i++) {
      info = tableInfo.columns[i];
      label = info.key;
      if (typeof info.class !== 'undefined') {
        label += ' ' + this.dump.markupIdentifier(info.class, 'classname');
      }
      $theadTr.append(
        $$1('<th scope="col"></th>').html(label)
      );
    }
  };

  /**
   * Removes all key-value entries from the list cache.
   *
   * @private
   * @name clear
   * @memberOf ListCache
   */
  function listCacheClear() {
    this.__data__ = [];
    this.size = 0;
  }

  var _listCacheClear = listCacheClear;

  /**
   * Performs a
   * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * comparison between two values to determine if they are equivalent.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   * @example
   *
   * var object = { 'a': 1 };
   * var other = { 'a': 1 };
   *
   * _.eq(object, object);
   * // => true
   *
   * _.eq(object, other);
   * // => false
   *
   * _.eq('a', 'a');
   * // => true
   *
   * _.eq('a', Object('a'));
   * // => false
   *
   * _.eq(NaN, NaN);
   * // => true
   */
  function eq(value, other) {
    return value === other || (value !== value && other !== other);
  }

  var eq_1 = eq;

  /**
   * Gets the index at which the `key` is found in `array` of key-value pairs.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} key The key to search for.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function assocIndexOf(array, key) {
    var length = array.length;
    while (length--) {
      if (eq_1(array[length][0], key)) {
        return length;
      }
    }
    return -1;
  }

  var _assocIndexOf = assocIndexOf;

  /** Used for built-in method references. */
  var arrayProto = Array.prototype;

  /** Built-in value references. */
  var splice = arrayProto.splice;

  /**
   * Removes `key` and its value from the list cache.
   *
   * @private
   * @name delete
   * @memberOf ListCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function listCacheDelete(key) {
    var data = this.__data__,
        index = _assocIndexOf(data, key);

    if (index < 0) {
      return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    --this.size;
    return true;
  }

  var _listCacheDelete = listCacheDelete;

  /**
   * Gets the list cache value for `key`.
   *
   * @private
   * @name get
   * @memberOf ListCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function listCacheGet(key) {
    var data = this.__data__,
        index = _assocIndexOf(data, key);

    return index < 0 ? undefined : data[index][1];
  }

  var _listCacheGet = listCacheGet;

  /**
   * Checks if a list cache value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf ListCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function listCacheHas(key) {
    return _assocIndexOf(this.__data__, key) > -1;
  }

  var _listCacheHas = listCacheHas;

  /**
   * Sets the list cache `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf ListCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the list cache instance.
   */
  function listCacheSet(key, value) {
    var data = this.__data__,
        index = _assocIndexOf(data, key);

    if (index < 0) {
      ++this.size;
      data.push([key, value]);
    } else {
      data[index][1] = value;
    }
    return this;
  }

  var _listCacheSet = listCacheSet;

  /**
   * Creates an list cache object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function ListCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  // Add methods to `ListCache`.
  ListCache.prototype.clear = _listCacheClear;
  ListCache.prototype['delete'] = _listCacheDelete;
  ListCache.prototype.get = _listCacheGet;
  ListCache.prototype.has = _listCacheHas;
  ListCache.prototype.set = _listCacheSet;

  var _ListCache = ListCache;

  /**
   * Removes all key-value entries from the stack.
   *
   * @private
   * @name clear
   * @memberOf Stack
   */
  function stackClear() {
    this.__data__ = new _ListCache;
    this.size = 0;
  }

  var _stackClear = stackClear;

  /**
   * Removes `key` and its value from the stack.
   *
   * @private
   * @name delete
   * @memberOf Stack
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function stackDelete(key) {
    var data = this.__data__,
        result = data['delete'](key);

    this.size = data.size;
    return result;
  }

  var _stackDelete = stackDelete;

  /**
   * Gets the stack value for `key`.
   *
   * @private
   * @name get
   * @memberOf Stack
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function stackGet(key) {
    return this.__data__.get(key);
  }

  var _stackGet = stackGet;

  /**
   * Checks if a stack value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Stack
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function stackHas(key) {
    return this.__data__.has(key);
  }

  var _stackHas = stackHas;

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function commonjsRequire () {
  	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
  }

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

  var _freeGlobal = freeGlobal;

  /** Detect free variable `self`. */
  var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

  /** Used as a reference to the global object. */
  var root = _freeGlobal || freeSelf || Function('return this')();

  var _root = root;

  /** Built-in value references. */
  var Symbol$1 = _root.Symbol;

  var _Symbol = Symbol$1;

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var nativeObjectToString = objectProto.toString;

  /** Built-in value references. */
  var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

  /**
   * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the raw `toStringTag`.
   */
  function getRawTag(value) {
    var isOwn = hasOwnProperty.call(value, symToStringTag),
        tag = value[symToStringTag];

    try {
      value[symToStringTag] = undefined;
      var unmasked = true;
    } catch (e) {}

    var result = nativeObjectToString.call(value);
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag] = tag;
      } else {
        delete value[symToStringTag];
      }
    }
    return result;
  }

  var _getRawTag = getRawTag;

  /** Used for built-in method references. */
  var objectProto$1 = Object.prototype;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var nativeObjectToString$1 = objectProto$1.toString;

  /**
   * Converts `value` to a string using `Object.prototype.toString`.
   *
   * @private
   * @param {*} value The value to convert.
   * @returns {string} Returns the converted string.
   */
  function objectToString(value) {
    return nativeObjectToString$1.call(value);
  }

  var _objectToString = objectToString;

  /** `Object#toString` result references. */
  var nullTag = '[object Null]',
      undefinedTag = '[object Undefined]';

  /** Built-in value references. */
  var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;

  /**
   * The base implementation of `getTag` without fallbacks for buggy environments.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  function baseGetTag(value) {
    if (value == null) {
      return value === undefined ? undefinedTag : nullTag;
    }
    return (symToStringTag$1 && symToStringTag$1 in Object(value))
      ? _getRawTag(value)
      : _objectToString(value);
  }

  var _baseGetTag = baseGetTag;

  /**
   * Checks if `value` is the
   * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
   * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(_.noop);
   * // => true
   *
   * _.isObject(null);
   * // => false
   */
  function isObject(value) {
    var type = typeof value;
    return value != null && (type == 'object' || type == 'function');
  }

  var isObject_1 = isObject;

  /** `Object#toString` result references. */
  var asyncTag = '[object AsyncFunction]',
      funcTag = '[object Function]',
      genTag = '[object GeneratorFunction]',
      proxyTag = '[object Proxy]';

  /**
   * Checks if `value` is classified as a `Function` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a function, else `false`.
   * @example
   *
   * _.isFunction(_);
   * // => true
   *
   * _.isFunction(/abc/);
   * // => false
   */
  function isFunction(value) {
    if (!isObject_1(value)) {
      return false;
    }
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 9 which returns 'object' for typed arrays and other constructors.
    var tag = _baseGetTag(value);
    return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
  }

  var isFunction_1 = isFunction;

  /** Used to detect overreaching core-js shims. */
  var coreJsData = _root['__core-js_shared__'];

  var _coreJsData = coreJsData;

  /** Used to detect methods masquerading as native. */
  var maskSrcKey = (function() {
    var uid = /[^.]+$/.exec(_coreJsData && _coreJsData.keys && _coreJsData.keys.IE_PROTO || '');
    return uid ? ('Symbol(src)_1.' + uid) : '';
  }());

  /**
   * Checks if `func` has its source masked.
   *
   * @private
   * @param {Function} func The function to check.
   * @returns {boolean} Returns `true` if `func` is masked, else `false`.
   */
  function isMasked(func) {
    return !!maskSrcKey && (maskSrcKey in func);
  }

  var _isMasked = isMasked;

  /** Used for built-in method references. */
  var funcProto = Function.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString = funcProto.toString;

  /**
   * Converts `func` to its source code.
   *
   * @private
   * @param {Function} func The function to convert.
   * @returns {string} Returns the source code.
   */
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString.call(func);
      } catch (e) {}
      try {
        return (func + '');
      } catch (e) {}
    }
    return '';
  }

  var _toSource = toSource;

  /**
   * Used to match `RegExp`
   * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
   */
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

  /** Used to detect host constructors (Safari). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used for built-in method references. */
  var funcProto$1 = Function.prototype,
      objectProto$2 = Object.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString$1 = funcProto$1.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

  /** Used to detect if a method is native. */
  var reIsNative = RegExp('^' +
    funcToString$1.call(hasOwnProperty$1).replace(reRegExpChar, '\\$&')
    .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
  );

  /**
   * The base implementation of `_.isNative` without bad shim checks.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a native function,
   *  else `false`.
   */
  function baseIsNative(value) {
    if (!isObject_1(value) || _isMasked(value)) {
      return false;
    }
    var pattern = isFunction_1(value) ? reIsNative : reIsHostCtor;
    return pattern.test(_toSource(value));
  }

  var _baseIsNative = baseIsNative;

  /**
   * Gets the value at `key` of `object`.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */
  function getValue(object, key) {
    return object == null ? undefined : object[key];
  }

  var _getValue = getValue;

  /**
   * Gets the native function at `key` of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {string} key The key of the method to get.
   * @returns {*} Returns the function if it's native, else `undefined`.
   */
  function getNative(object, key) {
    var value = _getValue(object, key);
    return _baseIsNative(value) ? value : undefined;
  }

  var _getNative = getNative;

  /* Built-in method references that are verified to be native. */
  var Map = _getNative(_root, 'Map');

  var _Map = Map;

  /* Built-in method references that are verified to be native. */
  var nativeCreate = _getNative(Object, 'create');

  var _nativeCreate = nativeCreate;

  /**
   * Removes all key-value entries from the hash.
   *
   * @private
   * @name clear
   * @memberOf Hash
   */
  function hashClear() {
    this.__data__ = _nativeCreate ? _nativeCreate(null) : {};
    this.size = 0;
  }

  var _hashClear = hashClear;

  /**
   * Removes `key` and its value from the hash.
   *
   * @private
   * @name delete
   * @memberOf Hash
   * @param {Object} hash The hash to modify.
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function hashDelete(key) {
    var result = this.has(key) && delete this.__data__[key];
    this.size -= result ? 1 : 0;
    return result;
  }

  var _hashDelete = hashDelete;

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED = '__lodash_hash_undefined__';

  /** Used for built-in method references. */
  var objectProto$3 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

  /**
   * Gets the hash value for `key`.
   *
   * @private
   * @name get
   * @memberOf Hash
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function hashGet(key) {
    var data = this.__data__;
    if (_nativeCreate) {
      var result = data[key];
      return result === HASH_UNDEFINED ? undefined : result;
    }
    return hasOwnProperty$2.call(data, key) ? data[key] : undefined;
  }

  var _hashGet = hashGet;

  /** Used for built-in method references. */
  var objectProto$4 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

  /**
   * Checks if a hash value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Hash
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function hashHas(key) {
    var data = this.__data__;
    return _nativeCreate ? (data[key] !== undefined) : hasOwnProperty$3.call(data, key);
  }

  var _hashHas = hashHas;

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

  /**
   * Sets the hash `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Hash
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the hash instance.
   */
  function hashSet(key, value) {
    var data = this.__data__;
    this.size += this.has(key) ? 0 : 1;
    data[key] = (_nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
    return this;
  }

  var _hashSet = hashSet;

  /**
   * Creates a hash object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Hash(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  // Add methods to `Hash`.
  Hash.prototype.clear = _hashClear;
  Hash.prototype['delete'] = _hashDelete;
  Hash.prototype.get = _hashGet;
  Hash.prototype.has = _hashHas;
  Hash.prototype.set = _hashSet;

  var _Hash = Hash;

  /**
   * Removes all key-value entries from the map.
   *
   * @private
   * @name clear
   * @memberOf MapCache
   */
  function mapCacheClear() {
    this.size = 0;
    this.__data__ = {
      'hash': new _Hash,
      'map': new (_Map || _ListCache),
      'string': new _Hash
    };
  }

  var _mapCacheClear = mapCacheClear;

  /**
   * Checks if `value` is suitable for use as unique object key.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
   */
  function isKeyable(value) {
    var type = typeof value;
    return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
      ? (value !== '__proto__')
      : (value === null);
  }

  var _isKeyable = isKeyable;

  /**
   * Gets the data for `map`.
   *
   * @private
   * @param {Object} map The map to query.
   * @param {string} key The reference key.
   * @returns {*} Returns the map data.
   */
  function getMapData(map, key) {
    var data = map.__data__;
    return _isKeyable(key)
      ? data[typeof key == 'string' ? 'string' : 'hash']
      : data.map;
  }

  var _getMapData = getMapData;

  /**
   * Removes `key` and its value from the map.
   *
   * @private
   * @name delete
   * @memberOf MapCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function mapCacheDelete(key) {
    var result = _getMapData(this, key)['delete'](key);
    this.size -= result ? 1 : 0;
    return result;
  }

  var _mapCacheDelete = mapCacheDelete;

  /**
   * Gets the map value for `key`.
   *
   * @private
   * @name get
   * @memberOf MapCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function mapCacheGet(key) {
    return _getMapData(this, key).get(key);
  }

  var _mapCacheGet = mapCacheGet;

  /**
   * Checks if a map value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf MapCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function mapCacheHas(key) {
    return _getMapData(this, key).has(key);
  }

  var _mapCacheHas = mapCacheHas;

  /**
   * Sets the map `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf MapCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the map cache instance.
   */
  function mapCacheSet(key, value) {
    var data = _getMapData(this, key),
        size = data.size;

    data.set(key, value);
    this.size += data.size == size ? 0 : 1;
    return this;
  }

  var _mapCacheSet = mapCacheSet;

  /**
   * Creates a map cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function MapCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  // Add methods to `MapCache`.
  MapCache.prototype.clear = _mapCacheClear;
  MapCache.prototype['delete'] = _mapCacheDelete;
  MapCache.prototype.get = _mapCacheGet;
  MapCache.prototype.has = _mapCacheHas;
  MapCache.prototype.set = _mapCacheSet;

  var _MapCache = MapCache;

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200;

  /**
   * Sets the stack `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Stack
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the stack cache instance.
   */
  function stackSet(key, value) {
    var data = this.__data__;
    if (data instanceof _ListCache) {
      var pairs = data.__data__;
      if (!_Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
        pairs.push([key, value]);
        this.size = ++data.size;
        return this;
      }
      data = this.__data__ = new _MapCache(pairs);
    }
    data.set(key, value);
    this.size = data.size;
    return this;
  }

  var _stackSet = stackSet;

  /**
   * Creates a stack cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Stack(entries) {
    var data = this.__data__ = new _ListCache(entries);
    this.size = data.size;
  }

  // Add methods to `Stack`.
  Stack.prototype.clear = _stackClear;
  Stack.prototype['delete'] = _stackDelete;
  Stack.prototype.get = _stackGet;
  Stack.prototype.has = _stackHas;
  Stack.prototype.set = _stackSet;

  var _Stack = Stack;

  var defineProperty = (function() {
    try {
      var func = _getNative(Object, 'defineProperty');
      func({}, '', {});
      return func;
    } catch (e) {}
  }());

  var _defineProperty = defineProperty;

  /**
   * The base implementation of `assignValue` and `assignMergeValue` without
   * value checks.
   *
   * @private
   * @param {Object} object The object to modify.
   * @param {string} key The key of the property to assign.
   * @param {*} value The value to assign.
   */
  function baseAssignValue(object, key, value) {
    if (key == '__proto__' && _defineProperty) {
      _defineProperty(object, key, {
        'configurable': true,
        'enumerable': true,
        'value': value,
        'writable': true
      });
    } else {
      object[key] = value;
    }
  }

  var _baseAssignValue = baseAssignValue;

  /**
   * This function is like `assignValue` except that it doesn't assign
   * `undefined` values.
   *
   * @private
   * @param {Object} object The object to modify.
   * @param {string} key The key of the property to assign.
   * @param {*} value The value to assign.
   */
  function assignMergeValue(object, key, value) {
    if ((value !== undefined && !eq_1(object[key], value)) ||
        (value === undefined && !(key in object))) {
      _baseAssignValue(object, key, value);
    }
  }

  var _assignMergeValue = assignMergeValue;

  /**
   * Creates a base function for methods like `_.forIn` and `_.forOwn`.
   *
   * @private
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {Function} Returns the new base function.
   */
  function createBaseFor(fromRight) {
    return function(object, iteratee, keysFunc) {
      var index = -1,
          iterable = Object(object),
          props = keysFunc(object),
          length = props.length;

      while (length--) {
        var key = props[fromRight ? length : ++index];
        if (iteratee(iterable[key], key, iterable) === false) {
          break;
        }
      }
      return object;
    };
  }

  var _createBaseFor = createBaseFor;

  /**
   * The base implementation of `baseForOwn` which iterates over `object`
   * properties returned by `keysFunc` and invokes `iteratee` for each property.
   * Iteratee functions may exit iteration early by explicitly returning `false`.
   *
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @param {Function} keysFunc The function to get the keys of `object`.
   * @returns {Object} Returns `object`.
   */
  var baseFor = _createBaseFor();

  var _baseFor = baseFor;

  var _cloneBuffer = createCommonjsModule(function (module, exports) {
  /** Detect free variable `exports`. */
  var freeExports =  exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Built-in value references. */
  var Buffer = moduleExports ? _root.Buffer : undefined,
      allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined;

  /**
   * Creates a clone of  `buffer`.
   *
   * @private
   * @param {Buffer} buffer The buffer to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Buffer} Returns the cloned buffer.
   */
  function cloneBuffer(buffer, isDeep) {
    if (isDeep) {
      return buffer.slice();
    }
    var length = buffer.length,
        result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

    buffer.copy(result);
    return result;
  }

  module.exports = cloneBuffer;
  });

  /** Built-in value references. */
  var Uint8Array$1 = _root.Uint8Array;

  var _Uint8Array = Uint8Array$1;

  /**
   * Creates a clone of `arrayBuffer`.
   *
   * @private
   * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
   * @returns {ArrayBuffer} Returns the cloned array buffer.
   */
  function cloneArrayBuffer(arrayBuffer) {
    var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
    new _Uint8Array(result).set(new _Uint8Array(arrayBuffer));
    return result;
  }

  var _cloneArrayBuffer = cloneArrayBuffer;

  /**
   * Creates a clone of `typedArray`.
   *
   * @private
   * @param {Object} typedArray The typed array to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the cloned typed array.
   */
  function cloneTypedArray(typedArray, isDeep) {
    var buffer = isDeep ? _cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
    return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
  }

  var _cloneTypedArray = cloneTypedArray;

  /**
   * Copies the values of `source` to `array`.
   *
   * @private
   * @param {Array} source The array to copy values from.
   * @param {Array} [array=[]] The array to copy values to.
   * @returns {Array} Returns `array`.
   */
  function copyArray(source, array) {
    var index = -1,
        length = source.length;

    array || (array = Array(length));
    while (++index < length) {
      array[index] = source[index];
    }
    return array;
  }

  var _copyArray = copyArray;

  /** Built-in value references. */
  var objectCreate = Object.create;

  /**
   * The base implementation of `_.create` without support for assigning
   * properties to the created object.
   *
   * @private
   * @param {Object} proto The object to inherit from.
   * @returns {Object} Returns the new object.
   */
  var baseCreate = (function() {
    function object() {}
    return function(proto) {
      if (!isObject_1(proto)) {
        return {};
      }
      if (objectCreate) {
        return objectCreate(proto);
      }
      object.prototype = proto;
      var result = new object;
      object.prototype = undefined;
      return result;
    };
  }());

  var _baseCreate = baseCreate;

  /**
   * Creates a unary function that invokes `func` with its argument transformed.
   *
   * @private
   * @param {Function} func The function to wrap.
   * @param {Function} transform The argument transform.
   * @returns {Function} Returns the new function.
   */
  function overArg(func, transform) {
    return function(arg) {
      return func(transform(arg));
    };
  }

  var _overArg = overArg;

  /** Built-in value references. */
  var getPrototype = _overArg(Object.getPrototypeOf, Object);

  var _getPrototype = getPrototype;

  /** Used for built-in method references. */
  var objectProto$5 = Object.prototype;

  /**
   * Checks if `value` is likely a prototype object.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
   */
  function isPrototype(value) {
    var Ctor = value && value.constructor,
        proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$5;

    return value === proto;
  }

  var _isPrototype = isPrototype;

  /**
   * Initializes an object clone.
   *
   * @private
   * @param {Object} object The object to clone.
   * @returns {Object} Returns the initialized clone.
   */
  function initCloneObject(object) {
    return (typeof object.constructor == 'function' && !_isPrototype(object))
      ? _baseCreate(_getPrototype(object))
      : {};
  }

  var _initCloneObject = initCloneObject;

  /**
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */
  function isObjectLike(value) {
    return value != null && typeof value == 'object';
  }

  var isObjectLike_1 = isObjectLike;

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]';

  /**
   * The base implementation of `_.isArguments`.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   */
  function baseIsArguments(value) {
    return isObjectLike_1(value) && _baseGetTag(value) == argsTag;
  }

  var _baseIsArguments = baseIsArguments;

  /** Used for built-in method references. */
  var objectProto$6 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$4 = objectProto$6.hasOwnProperty;

  /** Built-in value references. */
  var propertyIsEnumerable = objectProto$6.propertyIsEnumerable;

  /**
   * Checks if `value` is likely an `arguments` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   *  else `false`.
   * @example
   *
   * _.isArguments(function() { return arguments; }());
   * // => true
   *
   * _.isArguments([1, 2, 3]);
   * // => false
   */
  var isArguments = _baseIsArguments(function() { return arguments; }()) ? _baseIsArguments : function(value) {
    return isObjectLike_1(value) && hasOwnProperty$4.call(value, 'callee') &&
      !propertyIsEnumerable.call(value, 'callee');
  };

  var isArguments_1 = isArguments;

  /**
   * Checks if `value` is classified as an `Array` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an array, else `false`.
   * @example
   *
   * _.isArray([1, 2, 3]);
   * // => true
   *
   * _.isArray(document.body.children);
   * // => false
   *
   * _.isArray('abc');
   * // => false
   *
   * _.isArray(_.noop);
   * // => false
   */
  var isArray = Array.isArray;

  var isArray_1 = isArray;

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER = 9007199254740991;

  /**
   * Checks if `value` is a valid array-like length.
   *
   * **Note:** This method is loosely based on
   * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
   * @example
   *
   * _.isLength(3);
   * // => true
   *
   * _.isLength(Number.MIN_VALUE);
   * // => false
   *
   * _.isLength(Infinity);
   * // => false
   *
   * _.isLength('3');
   * // => false
   */
  function isLength(value) {
    return typeof value == 'number' &&
      value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
  }

  var isLength_1 = isLength;

  /**
   * Checks if `value` is array-like. A value is considered array-like if it's
   * not a function and has a `value.length` that's an integer greater than or
   * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
   * @example
   *
   * _.isArrayLike([1, 2, 3]);
   * // => true
   *
   * _.isArrayLike(document.body.children);
   * // => true
   *
   * _.isArrayLike('abc');
   * // => true
   *
   * _.isArrayLike(_.noop);
   * // => false
   */
  function isArrayLike(value) {
    return value != null && isLength_1(value.length) && !isFunction_1(value);
  }

  var isArrayLike_1 = isArrayLike;

  /**
   * This method is like `_.isArrayLike` except that it also checks if `value`
   * is an object.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an array-like object,
   *  else `false`.
   * @example
   *
   * _.isArrayLikeObject([1, 2, 3]);
   * // => true
   *
   * _.isArrayLikeObject(document.body.children);
   * // => true
   *
   * _.isArrayLikeObject('abc');
   * // => false
   *
   * _.isArrayLikeObject(_.noop);
   * // => false
   */
  function isArrayLikeObject(value) {
    return isObjectLike_1(value) && isArrayLike_1(value);
  }

  var isArrayLikeObject_1 = isArrayLikeObject;

  /**
   * This method returns `false`.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {boolean} Returns `false`.
   * @example
   *
   * _.times(2, _.stubFalse);
   * // => [false, false]
   */
  function stubFalse() {
    return false;
  }

  var stubFalse_1 = stubFalse;

  var isBuffer_1 = createCommonjsModule(function (module, exports) {
  /** Detect free variable `exports`. */
  var freeExports =  exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Built-in value references. */
  var Buffer = moduleExports ? _root.Buffer : undefined;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

  /**
   * Checks if `value` is a buffer.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
   * @example
   *
   * _.isBuffer(new Buffer(2));
   * // => true
   *
   * _.isBuffer(new Uint8Array(2));
   * // => false
   */
  var isBuffer = nativeIsBuffer || stubFalse_1;

  module.exports = isBuffer;
  });

  /** `Object#toString` result references. */
  var objectTag = '[object Object]';

  /** Used for built-in method references. */
  var funcProto$2 = Function.prototype,
      objectProto$7 = Object.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString$2 = funcProto$2.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty$5 = objectProto$7.hasOwnProperty;

  /** Used to infer the `Object` constructor. */
  var objectCtorString = funcToString$2.call(Object);

  /**
   * Checks if `value` is a plain object, that is, an object created by the
   * `Object` constructor or one with a `[[Prototype]]` of `null`.
   *
   * @static
   * @memberOf _
   * @since 0.8.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   * }
   *
   * _.isPlainObject(new Foo);
   * // => false
   *
   * _.isPlainObject([1, 2, 3]);
   * // => false
   *
   * _.isPlainObject({ 'x': 0, 'y': 0 });
   * // => true
   *
   * _.isPlainObject(Object.create(null));
   * // => true
   */
  function isPlainObject(value) {
    if (!isObjectLike_1(value) || _baseGetTag(value) != objectTag) {
      return false;
    }
    var proto = _getPrototype(value);
    if (proto === null) {
      return true;
    }
    var Ctor = hasOwnProperty$5.call(proto, 'constructor') && proto.constructor;
    return typeof Ctor == 'function' && Ctor instanceof Ctor &&
      funcToString$2.call(Ctor) == objectCtorString;
  }

  var isPlainObject_1 = isPlainObject;

  /** `Object#toString` result references. */
  var argsTag$1 = '[object Arguments]',
      arrayTag = '[object Array]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag = '[object Error]',
      funcTag$1 = '[object Function]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      objectTag$1 = '[object Object]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      weakMapTag = '[object WeakMap]';

  var arrayBufferTag = '[object ArrayBuffer]',
      dataViewTag = '[object DataView]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
  typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
  typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
  typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
  typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag$1] = typedArrayTags[arrayTag] =
  typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
  typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
  typedArrayTags[errorTag] = typedArrayTags[funcTag$1] =
  typedArrayTags[mapTag] = typedArrayTags[numberTag] =
  typedArrayTags[objectTag$1] = typedArrayTags[regexpTag] =
  typedArrayTags[setTag] = typedArrayTags[stringTag] =
  typedArrayTags[weakMapTag] = false;

  /**
   * The base implementation of `_.isTypedArray` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   */
  function baseIsTypedArray(value) {
    return isObjectLike_1(value) &&
      isLength_1(value.length) && !!typedArrayTags[_baseGetTag(value)];
  }

  var _baseIsTypedArray = baseIsTypedArray;

  /**
   * The base implementation of `_.unary` without support for storing metadata.
   *
   * @private
   * @param {Function} func The function to cap arguments for.
   * @returns {Function} Returns the new capped function.
   */
  function baseUnary(func) {
    return function(value) {
      return func(value);
    };
  }

  var _baseUnary = baseUnary;

  var _nodeUtil = createCommonjsModule(function (module, exports) {
  /** Detect free variable `exports`. */
  var freeExports =  exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Detect free variable `process` from Node.js. */
  var freeProcess = moduleExports && _freeGlobal.process;

  /** Used to access faster Node.js helpers. */
  var nodeUtil = (function() {
    try {
      // Use `util.types` for Node.js 10+.
      var types = freeModule && freeModule.require && freeModule.require('util').types;

      if (types) {
        return types;
      }

      // Legacy `process.binding('util')` for Node.js < 10.
      return freeProcess && freeProcess.binding && freeProcess.binding('util');
    } catch (e) {}
  }());

  module.exports = nodeUtil;
  });

  /* Node.js helper references. */
  var nodeIsTypedArray = _nodeUtil && _nodeUtil.isTypedArray;

  /**
   * Checks if `value` is classified as a typed array.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   * @example
   *
   * _.isTypedArray(new Uint8Array);
   * // => true
   *
   * _.isTypedArray([]);
   * // => false
   */
  var isTypedArray = nodeIsTypedArray ? _baseUnary(nodeIsTypedArray) : _baseIsTypedArray;

  var isTypedArray_1 = isTypedArray;

  /**
   * Gets the value at `key`, unless `key` is "__proto__" or "constructor".
   *
   * @private
   * @param {Object} object The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */
  function safeGet(object, key) {
    if (key === 'constructor' && typeof object[key] === 'function') {
      return;
    }

    if (key == '__proto__') {
      return;
    }

    return object[key];
  }

  var _safeGet = safeGet;

  /** Used for built-in method references. */
  var objectProto$8 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$6 = objectProto$8.hasOwnProperty;

  /**
   * Assigns `value` to `key` of `object` if the existing value is not equivalent
   * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * for equality comparisons.
   *
   * @private
   * @param {Object} object The object to modify.
   * @param {string} key The key of the property to assign.
   * @param {*} value The value to assign.
   */
  function assignValue(object, key, value) {
    var objValue = object[key];
    if (!(hasOwnProperty$6.call(object, key) && eq_1(objValue, value)) ||
        (value === undefined && !(key in object))) {
      _baseAssignValue(object, key, value);
    }
  }

  var _assignValue = assignValue;

  /**
   * Copies properties of `source` to `object`.
   *
   * @private
   * @param {Object} source The object to copy properties from.
   * @param {Array} props The property identifiers to copy.
   * @param {Object} [object={}] The object to copy properties to.
   * @param {Function} [customizer] The function to customize copied values.
   * @returns {Object} Returns `object`.
   */
  function copyObject(source, props, object, customizer) {
    var isNew = !object;
    object || (object = {});

    var index = -1,
        length = props.length;

    while (++index < length) {
      var key = props[index];

      var newValue = customizer
        ? customizer(object[key], source[key], key, object, source)
        : undefined;

      if (newValue === undefined) {
        newValue = source[key];
      }
      if (isNew) {
        _baseAssignValue(object, key, newValue);
      } else {
        _assignValue(object, key, newValue);
      }
    }
    return object;
  }

  var _copyObject = copyObject;

  /**
   * The base implementation of `_.times` without support for iteratee shorthands
   * or max array length checks.
   *
   * @private
   * @param {number} n The number of times to invoke `iteratee`.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the array of results.
   */
  function baseTimes(n, iteratee) {
    var index = -1,
        result = Array(n);

    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }

  var _baseTimes = baseTimes;

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER$1 = 9007199254740991;

  /** Used to detect unsigned integer values. */
  var reIsUint = /^(?:0|[1-9]\d*)$/;

  /**
   * Checks if `value` is a valid array-like index.
   *
   * @private
   * @param {*} value The value to check.
   * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
   * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
   */
  function isIndex(value, length) {
    var type = typeof value;
    length = length == null ? MAX_SAFE_INTEGER$1 : length;

    return !!length &&
      (type == 'number' ||
        (type != 'symbol' && reIsUint.test(value))) &&
          (value > -1 && value % 1 == 0 && value < length);
  }

  var _isIndex = isIndex;

  /** Used for built-in method references. */
  var objectProto$9 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$7 = objectProto$9.hasOwnProperty;

  /**
   * Creates an array of the enumerable property names of the array-like `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @param {boolean} inherited Specify returning inherited property names.
   * @returns {Array} Returns the array of property names.
   */
  function arrayLikeKeys(value, inherited) {
    var isArr = isArray_1(value),
        isArg = !isArr && isArguments_1(value),
        isBuff = !isArr && !isArg && isBuffer_1(value),
        isType = !isArr && !isArg && !isBuff && isTypedArray_1(value),
        skipIndexes = isArr || isArg || isBuff || isType,
        result = skipIndexes ? _baseTimes(value.length, String) : [],
        length = result.length;

    for (var key in value) {
      if ((inherited || hasOwnProperty$7.call(value, key)) &&
          !(skipIndexes && (
             // Safari 9 has enumerable `arguments.length` in strict mode.
             key == 'length' ||
             // Node.js 0.10 has enumerable non-index properties on buffers.
             (isBuff && (key == 'offset' || key == 'parent')) ||
             // PhantomJS 2 has enumerable non-index properties on typed arrays.
             (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
             // Skip index properties.
             _isIndex(key, length)
          ))) {
        result.push(key);
      }
    }
    return result;
  }

  var _arrayLikeKeys = arrayLikeKeys;

  /**
   * This function is like
   * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * except that it includes inherited enumerable properties.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function nativeKeysIn(object) {
    var result = [];
    if (object != null) {
      for (var key in Object(object)) {
        result.push(key);
      }
    }
    return result;
  }

  var _nativeKeysIn = nativeKeysIn;

  /** Used for built-in method references. */
  var objectProto$a = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$8 = objectProto$a.hasOwnProperty;

  /**
   * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function baseKeysIn(object) {
    if (!isObject_1(object)) {
      return _nativeKeysIn(object);
    }
    var isProto = _isPrototype(object),
        result = [];

    for (var key in object) {
      if (!(key == 'constructor' && (isProto || !hasOwnProperty$8.call(object, key)))) {
        result.push(key);
      }
    }
    return result;
  }

  var _baseKeysIn = baseKeysIn;

  /**
   * Creates an array of the own and inherited enumerable property names of `object`.
   *
   * **Note:** Non-object values are coerced to objects.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Object
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.keysIn(new Foo);
   * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
   */
  function keysIn(object) {
    return isArrayLike_1(object) ? _arrayLikeKeys(object, true) : _baseKeysIn(object);
  }

  var keysIn_1 = keysIn;

  /**
   * Converts `value` to a plain object flattening inherited enumerable string
   * keyed properties of `value` to own properties of the plain object.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Lang
   * @param {*} value The value to convert.
   * @returns {Object} Returns the converted plain object.
   * @example
   *
   * function Foo() {
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.assign({ 'a': 1 }, new Foo);
   * // => { 'a': 1, 'b': 2 }
   *
   * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
   * // => { 'a': 1, 'b': 2, 'c': 3 }
   */
  function toPlainObject(value) {
    return _copyObject(value, keysIn_1(value));
  }

  var toPlainObject_1 = toPlainObject;

  /**
   * A specialized version of `baseMerge` for arrays and objects which performs
   * deep merges and tracks traversed objects enabling objects with circular
   * references to be merged.
   *
   * @private
   * @param {Object} object The destination object.
   * @param {Object} source The source object.
   * @param {string} key The key of the value to merge.
   * @param {number} srcIndex The index of `source`.
   * @param {Function} mergeFunc The function to merge values.
   * @param {Function} [customizer] The function to customize assigned values.
   * @param {Object} [stack] Tracks traversed source values and their merged
   *  counterparts.
   */
  function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
    var objValue = _safeGet(object, key),
        srcValue = _safeGet(source, key),
        stacked = stack.get(srcValue);

    if (stacked) {
      _assignMergeValue(object, key, stacked);
      return;
    }
    var newValue = customizer
      ? customizer(objValue, srcValue, (key + ''), object, source, stack)
      : undefined;

    var isCommon = newValue === undefined;

    if (isCommon) {
      var isArr = isArray_1(srcValue),
          isBuff = !isArr && isBuffer_1(srcValue),
          isTyped = !isArr && !isBuff && isTypedArray_1(srcValue);

      newValue = srcValue;
      if (isArr || isBuff || isTyped) {
        if (isArray_1(objValue)) {
          newValue = objValue;
        }
        else if (isArrayLikeObject_1(objValue)) {
          newValue = _copyArray(objValue);
        }
        else if (isBuff) {
          isCommon = false;
          newValue = _cloneBuffer(srcValue, true);
        }
        else if (isTyped) {
          isCommon = false;
          newValue = _cloneTypedArray(srcValue, true);
        }
        else {
          newValue = [];
        }
      }
      else if (isPlainObject_1(srcValue) || isArguments_1(srcValue)) {
        newValue = objValue;
        if (isArguments_1(objValue)) {
          newValue = toPlainObject_1(objValue);
        }
        else if (!isObject_1(objValue) || isFunction_1(objValue)) {
          newValue = _initCloneObject(srcValue);
        }
      }
      else {
        isCommon = false;
      }
    }
    if (isCommon) {
      // Recursively merge objects and arrays (susceptible to call stack limits).
      stack.set(srcValue, newValue);
      mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
      stack['delete'](srcValue);
    }
    _assignMergeValue(object, key, newValue);
  }

  var _baseMergeDeep = baseMergeDeep;

  /**
   * The base implementation of `_.merge` without support for multiple sources.
   *
   * @private
   * @param {Object} object The destination object.
   * @param {Object} source The source object.
   * @param {number} srcIndex The index of `source`.
   * @param {Function} [customizer] The function to customize merged values.
   * @param {Object} [stack] Tracks traversed source values and their merged
   *  counterparts.
   */
  function baseMerge(object, source, srcIndex, customizer, stack) {
    if (object === source) {
      return;
    }
    _baseFor(source, function(srcValue, key) {
      stack || (stack = new _Stack);
      if (isObject_1(srcValue)) {
        _baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
      }
      else {
        var newValue = customizer
          ? customizer(_safeGet(object, key), srcValue, (key + ''), object, source, stack)
          : undefined;

        if (newValue === undefined) {
          newValue = srcValue;
        }
        _assignMergeValue(object, key, newValue);
      }
    }, keysIn_1);
  }

  var _baseMerge = baseMerge;

  /**
   * This method returns the first argument it receives.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Util
   * @param {*} value Any value.
   * @returns {*} Returns `value`.
   * @example
   *
   * var object = { 'a': 1 };
   *
   * console.log(_.identity(object) === object);
   * // => true
   */
  function identity(value) {
    return value;
  }

  var identity_1 = identity;

  /**
   * A faster alternative to `Function#apply`, this function invokes `func`
   * with the `this` binding of `thisArg` and the arguments of `args`.
   *
   * @private
   * @param {Function} func The function to invoke.
   * @param {*} thisArg The `this` binding of `func`.
   * @param {Array} args The arguments to invoke `func` with.
   * @returns {*} Returns the result of `func`.
   */
  function apply(func, thisArg, args) {
    switch (args.length) {
      case 0: return func.call(thisArg);
      case 1: return func.call(thisArg, args[0]);
      case 2: return func.call(thisArg, args[0], args[1]);
      case 3: return func.call(thisArg, args[0], args[1], args[2]);
    }
    return func.apply(thisArg, args);
  }

  var _apply = apply;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeMax = Math.max;

  /**
   * A specialized version of `baseRest` which transforms the rest array.
   *
   * @private
   * @param {Function} func The function to apply a rest parameter to.
   * @param {number} [start=func.length-1] The start position of the rest parameter.
   * @param {Function} transform The rest array transform.
   * @returns {Function} Returns the new function.
   */
  function overRest(func, start, transform) {
    start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
    return function() {
      var args = arguments,
          index = -1,
          length = nativeMax(args.length - start, 0),
          array = Array(length);

      while (++index < length) {
        array[index] = args[start + index];
      }
      index = -1;
      var otherArgs = Array(start + 1);
      while (++index < start) {
        otherArgs[index] = args[index];
      }
      otherArgs[start] = transform(array);
      return _apply(func, this, otherArgs);
    };
  }

  var _overRest = overRest;

  /**
   * Creates a function that returns `value`.
   *
   * @static
   * @memberOf _
   * @since 2.4.0
   * @category Util
   * @param {*} value The value to return from the new function.
   * @returns {Function} Returns the new constant function.
   * @example
   *
   * var objects = _.times(2, _.constant({ 'a': 1 }));
   *
   * console.log(objects);
   * // => [{ 'a': 1 }, { 'a': 1 }]
   *
   * console.log(objects[0] === objects[1]);
   * // => true
   */
  function constant(value) {
    return function() {
      return value;
    };
  }

  var constant_1 = constant;

  /**
   * The base implementation of `setToString` without support for hot loop shorting.
   *
   * @private
   * @param {Function} func The function to modify.
   * @param {Function} string The `toString` result.
   * @returns {Function} Returns `func`.
   */
  var baseSetToString = !_defineProperty ? identity_1 : function(func, string) {
    return _defineProperty(func, 'toString', {
      'configurable': true,
      'enumerable': false,
      'value': constant_1(string),
      'writable': true
    });
  };

  var _baseSetToString = baseSetToString;

  /** Used to detect hot functions by number of calls within a span of milliseconds. */
  var HOT_COUNT = 800,
      HOT_SPAN = 16;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeNow = Date.now;

  /**
   * Creates a function that'll short out and invoke `identity` instead
   * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
   * milliseconds.
   *
   * @private
   * @param {Function} func The function to restrict.
   * @returns {Function} Returns the new shortable function.
   */
  function shortOut(func) {
    var count = 0,
        lastCalled = 0;

    return function() {
      var stamp = nativeNow(),
          remaining = HOT_SPAN - (stamp - lastCalled);

      lastCalled = stamp;
      if (remaining > 0) {
        if (++count >= HOT_COUNT) {
          return arguments[0];
        }
      } else {
        count = 0;
      }
      return func.apply(undefined, arguments);
    };
  }

  var _shortOut = shortOut;

  /**
   * Sets the `toString` method of `func` to return `string`.
   *
   * @private
   * @param {Function} func The function to modify.
   * @param {Function} string The `toString` result.
   * @returns {Function} Returns `func`.
   */
  var setToString = _shortOut(_baseSetToString);

  var _setToString = setToString;

  /**
   * The base implementation of `_.rest` which doesn't validate or coerce arguments.
   *
   * @private
   * @param {Function} func The function to apply a rest parameter to.
   * @param {number} [start=func.length-1] The start position of the rest parameter.
   * @returns {Function} Returns the new function.
   */
  function baseRest(func, start) {
    return _setToString(_overRest(func, start, identity_1), func + '');
  }

  var _baseRest = baseRest;

  /**
   * Checks if the given arguments are from an iteratee call.
   *
   * @private
   * @param {*} value The potential iteratee value argument.
   * @param {*} index The potential iteratee index or key argument.
   * @param {*} object The potential iteratee object argument.
   * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
   *  else `false`.
   */
  function isIterateeCall(value, index, object) {
    if (!isObject_1(object)) {
      return false;
    }
    var type = typeof index;
    if (type == 'number'
          ? (isArrayLike_1(object) && _isIndex(index, object.length))
          : (type == 'string' && index in object)
        ) {
      return eq_1(object[index], value);
    }
    return false;
  }

  var _isIterateeCall = isIterateeCall;

  /**
   * Creates a function like `_.assign`.
   *
   * @private
   * @param {Function} assigner The function to assign values.
   * @returns {Function} Returns the new assigner function.
   */
  function createAssigner(assigner) {
    return _baseRest(function(object, sources) {
      var index = -1,
          length = sources.length,
          customizer = length > 1 ? sources[length - 1] : undefined,
          guard = length > 2 ? sources[2] : undefined;

      customizer = (assigner.length > 3 && typeof customizer == 'function')
        ? (length--, customizer)
        : undefined;

      if (guard && _isIterateeCall(sources[0], sources[1], guard)) {
        customizer = length < 3 ? undefined : customizer;
        length = 1;
      }
      object = Object(object);
      while (++index < length) {
        var source = sources[index];
        if (source) {
          assigner(object, source, index, customizer);
        }
      }
      return object;
    });
  }

  var _createAssigner = createAssigner;

  /**
   * This method is like `_.merge` except that it accepts `customizer` which
   * is invoked to produce the merged values of the destination and source
   * properties. If `customizer` returns `undefined`, merging is handled by the
   * method instead. The `customizer` is invoked with six arguments:
   * (objValue, srcValue, key, object, source, stack).
   *
   * **Note:** This method mutates `object`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Object
   * @param {Object} object The destination object.
   * @param {...Object} sources The source objects.
   * @param {Function} customizer The function to customize assigned values.
   * @returns {Object} Returns `object`.
   * @example
   *
   * function customizer(objValue, srcValue) {
   *   if (_.isArray(objValue)) {
   *     return objValue.concat(srcValue);
   *   }
   * }
   *
   * var object = { 'a': [1], 'b': [2] };
   * var other = { 'a': [3], 'b': [4] };
   *
   * _.mergeWith(object, other, customizer);
   * // => { 'a': [1, 3], 'b': [2, 4] }
   */
  var mergeWith = _createAssigner(function(object, source, srcIndex, customizer) {
    _baseMerge(object, source, srcIndex, customizer);
  });

  var mergeWith_1 = mergeWith;

  var sectionPrototype = {
    dumpItems: function (abs, what, cfg) {
      var self = this;
      var html = '';
      var classes = JSON.parse(JSON.stringify(abs.extends));
      classes.unshift(abs.className);
      cfg = $.extend({
        groupByInheritance : abs.sort.indexOf('inheritance') === 0,
        objClassName : abs.className,
        phpDocOutput : abs.cfgFlags & this.valDumper.objectDumper.PHPDOC_OUTPUT,
      }, cfg);
      delete abs[what].__debug_key_order__;
      if (cfg.groupByInheritance === false) {
        return this.dumpItemsFiltered(abs[what], cfg)
      }
      classes.forEach(function (className) {
        var info = {};
        var items = {};
        var name = '';
        html += [abs.className, 'stdClass'].indexOf(className) < 0
          ? '<dd class="heading">Inherited from ' + self.valDumper.markupIdentifier(className) + '</dd>'
          : '';
        for (name in abs[what]) {
          info = abs[what][name];
          if (!info.declaredLast || info.declaredLast === className) {
              items[name] = info;
              delete abs[what][name];
          }
        }
        html += self.dumpItemsFiltered(items, cfg);
      });
      return html
    },

    dumpItemsFiltered: function (items, cfg) {
      var html = '';
      var name = '';
      var info = {};
      var vis = [];
      for (name in items) {
        info = items[name];
        if (typeof info.inheritedFrom !== 'undefined') {
          info.declaredLast = info.inheritedFrom; // note that only populated if inherited...
                                                 //    we don't know where it was declared
          delete info.inheritedFrom;
        }
        if (typeof info.overrides !== 'undefined') {
          info.declaredPrev = info.overrides;
          delete info.overrides;
        }
        info = $.extend({
          declaredLast : null,
          declaredPrev : null,
        }, info);
        vis = typeof info.visibility === 'object'
          ? info.visibility
          : [info.visibility];
        info.isInherited = info.declaredLast && info.declaredLast !== cfg.objClassName;
        info.isPrivateAncestor = $.inArray('private', vis) >= 0 && info.isInherited;
        if (info.isPrivateAncestor) {
            info.isInherited = false;
        }
        html += this.dumpItem(name, info, cfg);
      }
      return html
    },

    dumpItem: function (name, info, cfg) {
      var $dd = $('<dd></dd>')
        .html(this.dumpInner(name, info, cfg));
      this.addAttribs($dd, info, cfg);
      return $dd[0].outerHTML
    },

    addAttribs: function ($element, info, cfg) {
      if (cfg.attributeOutput && info.attributes && info.attributes.length) {
        $element.attr('data-attributes', JSON.stringify(info.attributes));
        // $element.attr('data-chars', JSON.stringify(this.valDumper.stringDumper.charHighlight.findChars(JSON.stringify(info.attributes))))
      }
      if (!info.isInherited && info.declaredPrev) {
        $element.attr('data-declared-prev', info.declaredPrev);
      }
      if (info.isInherited && info.declaredLast) {
        $element.attr('data-inherited-from', info.declaredLast);
      }
    },

    magicMethodInfo: function (abs, methods) {
      var i = 0;
      var methodsHave = [];
      var method;
      for (i = 0; i < methods.length; i++) {
        method = methods[i];
        if (abs.methods[method]) {
          methodsHave.push('<code>' + method + '</code>');
        }
      }
      if (methodsHave.length < 1) {
        return ''
      }
      methods = methodsHave.join(' and ');
      methods = methodsHave.length === 1
        ? 'a ' + methods + ' method'
        : methods + ' methods';
      return '<dd class="magic info">This object has ' + methods + '</dd>'
    },
  };

  function Cases (valDumper) {
    this.valDumper = valDumper;
    sectionPrototype.valDumper = valDumper;
  }

  var name;
  for (name in sectionPrototype) {
    Cases.prototype[name] = sectionPrototype[name];
  }

  Cases.prototype.addAttribs = function ($element, info, cfg) {
    $element.addClass('case');
    sectionPrototype.addAttribs($element, info, cfg);
  };

  Cases.prototype.dump = function (abs) {
    var cfg = {
      attributeOutput : abs.cfgFlags & this.valDumper.objectDumper.CASE_ATTRIBUTE_OUTPUT,
      collect : abs.cfgFlags & this.valDumper.objectDumper.CASE_COLLECT,
      groupByInheritance : false,
      output : abs.cfgFlags & this.valDumper.objectDumper.CASE_OUTPUT,
      phpDocOutput : abs.cfgFlags & this.valDumper.objectDumper.PHPDOC_OUTPUT,
    };
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
  };

  Cases.prototype.dumpInner = function (name, info, cfg) {
    var title = cfg.phpDocOutput
      ? info.desc
      : null;
    var $element = $$1('<div></div>')
      .html('<span class="t_identifier">' + name + '</span>' +
        (info.value !== this.valDumper.UNDEFINED
          ? ' <span class="t_operator">=</span> ' +
            this.valDumper.dump(info.value)
          : ''
        )
      );
    if (title && title.length) {
      $element.find('.t_identifier').attr('title', title);
    }
    return $element[0].innerHTML
  };

  function Constants (valDumper) {
    this.valDumper = valDumper;
    sectionPrototype.valDumper = valDumper;
  }

  var name$1;
  for (name$1 in sectionPrototype) {
    Constants.prototype[name$1] = sectionPrototype[name$1];
  }

  Constants.prototype.addAttribs = function ($element, info, cfg) {
    var classes = {
      constant: true,
      isFinal: info.isFinal,
      'private-ancestor': info.isPrivateAncestor
    };
    $element.addClass(info.visibility).removeClass('debug');
    $$1.each(classes, function (classname, useClass) {
      if (useClass) {
        $element.addClass(classname);
      }
    });
    sectionPrototype.addAttribs($element, info, cfg);
  };

  Constants.prototype.dump = function (abs) {
    var cfg = {
      collect : abs.cfgFlags & this.valDumper.objectDumper.CONST_COLLECT,
      attributeOutput : abs.cfgFlags & this.valDumper.objectDumper.CONST_ATTRIBUTE_OUTPUT,
      output : abs.cfgFlags & this.valDumper.objectDumper.CONST_OUTPUT,
    };
    if (!cfg.output) {
      return ''
    }
    if (!cfg.collect) {
      return '<dt class="constants">constants <i>not collected</i></dt>'
    }
    if (Object.keys(abs.constants).length < 1) {
      return ''
    }
    return '<dt class="constants">constants</dt>' +
      this.dumpItems(abs, 'constants', cfg)
  };

  Constants.prototype.dumpInner = function (name, info, cfg) {
    var title = info.phpDoc?.summary || info.desc || null;
    return this.dumpModifiers(info) +
      '<span class="t_identifier"' + (cfg.phpDocOutput && title
          ? ' title="' + this.valDumper.dumpPhpDocStr(title).escapeHtml() + '"'
          : '') + '>' +
        this.valDumper.dump(name, {addQuotes: false}) +
      '</span> ' +
      '<span class="t_operator">=</span> ' +
      this.valDumper.dump(info.value)
  };

  Constants.prototype.dumpModifiers = function (info) {
    var html = '';
    var vis = typeof info.visibility === 'object'
      ? info.visibility
      : [info.visibility];
    var modifiers = JSON.parse(JSON.stringify(vis));
    if (info.isFinal) {
      modifiers.push('final');
    }
    $$1.each(modifiers, function (i, modifier) {
      html += '<span class="t_modifier_' + modifier + '">' + modifier + '</span> ';
    });
    return html
  };

  function Methods (valDumper) {
    this.valDumper = valDumper;
    sectionPrototype.valDumper = valDumper;
  }

  var name$2;
  for (name$2 in sectionPrototype) {
    Methods.prototype[name$2] = sectionPrototype[name$2];
  }

  Methods.prototype.addAttribs = function ($element, info, cfg) {
    var classes = {
      method: true,
      isDeprecated: info.isDeprecated,
      isFinal: info.isFinal,
      isStatic: info.isStatic
    };
    var self = this;
    $element.addClass(info.visibility).removeClass('debug');
    $$1.each(classes, function (className, useClass) {
      if (useClass) {
        $element.addClass(className);
      }
    });
    sectionPrototype.addAttribs($element, info, cfg);
    if (info.implements && info.implements.length) {
      $element.attr('data-implements', info.implements);
    }
    if (info.phpDoc && info.phpDoc.deprecated) {
      $element.attr('data-deprecated-desc', this.valDumper.dumpPhpDocStr(info.phpDoc.deprecated[0].desc));
    }
    if (cfg.phpDocOutput && info.phpDoc && info.phpDoc.throws) {
      $element.attr('data-throws', JSON.stringify(info.phpDoc.throws.map(function (throwInfo) {
        return {
          desc: self.valDumper.dumpPhpDocStr(throwInfo.desc),
          type: self.valDumper.dumpPhpDocStr(throwInfo.type),
        }
      })));
    }
  };

  Methods.prototype.dump = function (abs) {
    var cfg = {
      attributeOutput : abs.cfgFlags & this.valDumper.objectDumper.METHOD_ATTRIBUTE_OUTPUT,
      collect : abs.cfgFlags & this.valDumper.objectDumper.METHOD_COLLECT,
      methodDescOutput : abs.cfgFlags & this.valDumper.objectDumper.METHOD_DESC_OUTPUT,
      output : abs.cfgFlags & this.valDumper.objectDumper.METHOD_OUTPUT,
      paramAttributeOutput : abs.cfgFlags & this.valDumper.objectDumper.PARAM_ATTRIBUTE_OUTPUT,
      phpDocOutput : abs.cfgFlags & this.valDumper.objectDumper.PHPDOC_OUTPUT,
      staticVarOutput : abs.cfgFlags & this.valDumper.objectDumper.METHOD_STATIC_VAR_OUTPUT,
    };
    var html = '';
    if (!cfg.output) {
      return ''
    }
    html = '<dt class="methods">' + this.getLabel(abs) + '</dt>';
    if (!cfg.collect) {
      return html
    }
    return html +
      this.magicMethodInfo(abs, ['__call', '__callStatic']) +
      this.dumpItems(abs, 'methods', cfg)
  };

  Methods.prototype.dumpInner = function (name, info, cfg) {
    return this.dumpModifiers(info) +
      this.dumpName(name, info, cfg) +
      this.dumpParams(info, cfg) +
      this.dumpReturn(info, cfg) +
      this.dumpStaticVars(info, cfg) +
      (name === '__toString'
        ? '<h3>return value</h3>' +
            '<ul class="list-unstyled"><li>' +
            this.valDumper.dump(info.returnValue, {
              attribs: {
                class : 'return-value'
              }
            }) +
            '</li></ul>'
        : ''
      )
  };

  Methods.prototype.dumpModifiers = function (info) {
    var html = '';
    var vis = typeof info.visibility === 'object'
      ? JSON.parse(JSON.stringify(info.visibility))
      : [info.visibility];
    var modifiers = {
      abstract: info.isAbstract,
      final: info.isFinal,
      [vis.join(' ')]: true,
      static: info.isStatic,
    };
    /*
    if (info.isAbstract) {
      modifiers.push('abstract')
    }
    if (info.isFinal) {
      modifiers.push('final')
    }
    modifiers.push(vis.join('  '))
    if (info.isStatic) {
      modifiers.push('static')
    }
    */
    $$1.each(modifiers, function (modifier, isSet) {
      if (isSet) {
        html += '<span class="t_modifier_' + modifier + '">' + modifier + '</span> ';
      }
    });
    return html
  };

  Methods.prototype.dumpName = function (name, info, cfg) {
    if (typeof info.phpDoc === 'undefined') {
      console.warn('phpDoc missing for method ' + name, info);
    }
    var titleParts = [
      info.phpDoc?.summary || '',
      cfg.methodDescOutput
        ? info.phpDoc?.desc || ''
        : '',
    ];
    var title = titleParts.join("\n\n").trim();
    return ' <span class="t_identifier"' +
      (cfg.phpDocOutput && title !== ''
        ? ' title="' + this.valDumper.dumpPhpDocStr(title).escapeHtml() + '"'
        : ''
      ) +
      '>' + this.valDumper.dumpPhpDocStr(name) + '</span>'
  };

  Methods.prototype.dumpParams = function (info, cfg) {
    var self = this;
    var params = [];
    $$1.each(info.params, function (i, info) {
      var $param = $$1('<span />', {
        class: 'parameter'
      });
      info = $$1.extend({
        desc: null,
        defaultValue: self.valDumper.UNDEFINED
      }, info);
      if (info.isPromoted) {
        $param.addClass('isPromoted');
      }
      if (cfg.paramAttributeOutput && info.attributes && info.attributes.length) {
        $param.attr('data-attributes', JSON.stringify(info.attributes));
      }
      if (typeof info.type === 'string') {
        $param.append(self.valDumper.objectDumper.markupType(info.type) + ' ');
      }
      self.dumpParamName(info, cfg, $param);
      self.dumpParamDefault(info.defaultValue, $param);
      params.push($param[0].outerHTML);
    });
    return '<span class="t_punct">(</span>' +
      params.join('<span class="t_punct">,</span> ') +
      '<span class="t_punct">)</span>'
  };

  Methods.prototype.dumpParamName = function (info, cfg, $param) {
    var name = info.name;
    if (typeof info.isVariadic !== 'undefined') {
      name = [
        info.isPassedByReference ? '&' : '',
        info.isVariadic ? '...' : '',
        '$' + info.name,
      ].join('');
    }
    $param.append('<span class="t_parameter-name"' +
      (cfg.phpDocOutput && info.desc !== null
        ? ' title="' + info.desc.escapeHtml().replace('\n', ' ') + '"'
        : ''
      ) + '>' + this.valDumper.dumpPhpDocStr(name) + '</span>');
  };

  Methods.prototype.dumpParamDefault = function (defaultValue, $param) {
    if (defaultValue === this.valDumper.UNDEFINED) {
      return
    }
    if (typeof defaultValue === 'string') {
      defaultValue = defaultValue.replace('\n', ' ');
    }
    $param.append(' <span class="t_operator">=</span> ' +
      $$1(this.valDumper.dump(defaultValue))
        .addClass('t_parameter-default')[0].outerHTML
    );
  };

  Methods.prototype.dumpReturn = function (info, cfg) {
    var returnType = info.return && info.return.type;
    if (!returnType) {
      return ''
    }
    return '<span class="t_punct t_colon">:</span> ' +
      this.valDumper.objectDumper.markupType(returnType, {
        title: cfg.phpDocOutput && info.return.desc !== null
          ? info.return.desc
          : ''
      })
  };

  Methods.prototype.dumpStaticVars = function (info, cfg) {
    var self = this;
    var html = '';
    if (!cfg.staticVarOutput || typeof info.staticVars === 'undefined' || info.staticVars.length < 1) {
        return ''
    }
    html = '<h3>static variables</h3>';
    html += '<ul class="list-unstyled">';
    $$1.each(info.staticVars, function (name, value) {
      html += '<li>' +
        self.valDumper.dump(name, {
          addQuotes : false,
          attribs : {
            class : 't_identifier'
          }
        }) +
        '<span class="t_operator">=</span> ' + self.valDumper.dump(value) +
        '</li>';
    });
    html += '</ul>';
    return html
  };

  Methods.prototype.getLabel = function (abs) {
    var label = Object.keys(abs.methods).length
      ? 'methods'
      : 'no methods';
    if (!(abs.cfgFlags & this.valDumper.objectDumper.METHOD_COLLECT)) {
        label = 'methods <i>not collected</i>';
    }
    return label
  };

  function PhpDoc (valDumper) {
    this.valDumper = valDumper;
  }

  PhpDoc.prototype.dump = function (abs) {
    var count;
    var html = '';
    var i;
    var tagData;
    var tagName;
    var tagEntries;
    for (tagName in abs.phpDoc) {
      tagEntries = abs.phpDoc[tagName];
      if (!Array.isArray(tagEntries)) {
        continue
      }
      for (i = 0, count = tagEntries.length; i < count; i++) {
        tagData = tagEntries[i];
        tagData.tagName = tagName;
        html += this.dumpTag(tagData);
      }
    }
    if (html.length) {
      html = '<dt>phpDoc</dt>' + html;
    }
    return html
  };

  PhpDoc.prototype.dumpTag = function (tagData) {
    var tagName = tagData.tagName;
    var value = '';
    switch (tagName) {
      case 'author':
        value = this.dumpTagAuthor(tagData);
        break
      case 'link':
      case 'see':
        value = this.dumpTagSeeLink(tagData);
        break
      default:
        delete tagData.tagName;
        /*
        for (i in tagData) {
          value += tagData[i] === null
            ? ''
            : tagData[i] + ' '
        }
        */
        value = Object.values(tagData).join(' ');
        value = this.valDumper.dumpPhpDocStr(value);
    }
    return '<dd class="phpDoc phpdoc-' + tagName + '">' +
      '<span class="phpdoc-tag">' + this.valDumper.dumpPhpDocStr(tagName) + '</span>' +
      '<span class="t_operator">:</span> ' +
      value +
      '</dd>'
  };

  PhpDoc.prototype.dumpTagAuthor = function (tagData) {
    var html = this.valDumper.dumpPhpDocStr(tagData.name);
    if (tagData.email) {
      html += ' &lt;<a href="mailto:' + tagData.email + '">' + this.valDumper.dumpPhpDocStr(tagData.email) + '</a>&gt;';
    }
    if (tagData.desc) {
      // desc is non-standard for author tag
      html += ' ' + this.valDumper.dumpPhpDocStr(tagData.desc);
    }
    return html
  };

  PhpDoc.prototype.dumpTagSeeLink = function (tagData) {
    var desc = this.valDumper.dumpPhpDocStr(tagData.desc || tagData.uri);
    if (tagData.uri) {
      return '<a href="' + tagData.uri + '" target="_blank">' + desc + '</a>'
    }
    // see tag
    return this.valDumper.markupIdentifier(tagData.fqsen) + (desc ? ' ' + desc : '')
  };

  function versionCompare (v1, v2) {
    var v1parts = v1.split('.');
    var v2parts = v2.split('.');

    function isValidPart(x) {
      return ( /^\d+$/).test(x)
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
      return NaN
    }

    {
      while (v1parts.length < v2parts.length) {
        v1parts.push('0');
      }
      while (v2parts.length < v1parts.length) {
        v2parts.push('0');
      }
    }

    {
      v1parts = v1parts.map(Number);
      v2parts = v2parts.map(Number);
    }

    for (var i = 0; i < v1parts.length; ++i) {
      if (v2parts.length === i) {
        return 1
      }
      if (v1parts[i] === v2parts[i]) {
        continue
      } else if (v1parts[i] > v2parts[i]) {
        return 1
      } else {
        return -1
      }
    }

    if (v1parts.length != v2parts.length) {
      return -1
    }

    return 0
  }

  function Properties (valDumper) {
    this.valDumper = valDumper;
    sectionPrototype.valDumper = valDumper;
  }

  var name$3;
  for (name$3 in sectionPrototype) {
    Properties.prototype[name$3] = sectionPrototype[name$3];
  }

  Properties.prototype.dump = function (abs) {
    var cfg = {
      attributeOutput : abs.cfgFlags & this.valDumper.objectDumper.PROP_ATTRIBUTE_OUTPUT,
      isDynamicSupport : versionCompare(abs.debugVersion, '3.1') >= 0
    };
    if (abs.isInterface) {
      return ''
    }
    var label = Object.keys(abs.properties).length
      ? 'properties'
      : 'no properties';
    if (abs.viaDebugInfo) {
      label += ' <span class="text-muted">(via __debugInfo)</span>';
    }
    return '<dt class="properties">' + label + '</dt>' +
      this.magicMethodInfo(abs, ['__get', '__set']) +
      this.dumpItems(abs, 'properties', cfg)
  };

  Properties.prototype.addAttribs = function ($element, info, cfg) {
    var classes = {
      'debug-value': info.valueFrom === 'debug',
      'debuginfo-excluded': info.debugInfoExcluded,
      'debuginfo-value': info.valueFrom === 'debugInfo',
      forceShow: info.forceShow,
      getHook: info.hooks.indexOf('get') > -1,
      isDeprecated: info.isDeprecated,
      isDynamic: info.declaredLast === null &&
        info.valueFrom === 'value' &&
        cfg.objClassName !== 'stdClass' &&
        cfg.isDynamicSupport,
      isPromoted: info.isPromoted,
      isReadOnly: info.isReadOnly,
      isStatic: info.isStatic,
      isVirtual: info.isVirtual,
      isWriteOnly: info.isVirtual && info.hooks.indexOf('get') > -1,
      'private-ancestor': info.isPrivateAncestor,
      property: true,
      setHook: info.hooks.indexOf('set') > -1
    };
    $element.addClass(info.visibility).removeClass('debug');
    $$1.each(classes, function (classname, useClass) {
      if (useClass) {
        $element.addClass(classname);
      }
    });
    sectionPrototype.addAttribs($element, info, cfg);
  };

  Properties.prototype.dumpInner = function (name, info, cfg) {
    var title = info.phpDoc?.summary || info.desc || null;
    name = name.replace('debug.', '');
    return this.dumpModifiers(info) +
      (info.type
        ? ' <span class="t_type">' + info.type + '</span>'
        : ''
      ) +
      ' ' + this.valDumper.dump(name, {
        addQuotes: /[\s\r\n]/.test(name) || name === '',
        attribs: {
          class: 't_identifier',
          title: cfg.phpDocOutput && title
            ? this.valDumper.dumpPhpDocStr(title).escapeHtml()
            : null
        }
      }) +
      (info.value !== this.valDumper.UNDEFINED
        ? ' <span class="t_operator">=</span> ' +
          this.valDumper.dump(info.value)
        : ''
      )
  };

  Properties.prototype.dumpModifiers = function (info) {
    var html = '';
    var vis = typeof info.visibility === 'object'
      ? info.visibility
      : [info.visibility];
    var modifiers = JSON.parse(JSON.stringify(vis));
    if (info.isReadOnly) {
      modifiers.push('readonly');
    }
    if (info.isStatic) {
      modifiers.push('static');
    }
    $$1.each(modifiers, function (i, modifier) {
      html += '<span class="t_modifier_' + modifier + '">' + modifier + '</span> ';
    });
    return html
  };

  function DumpObject (dump) {
    this.dumper = dump;
    this.cases = new Cases(this.dumper);
    this.constants = new Constants(this.dumper);
    this.methods = new Methods(this.dumper);
    this.properties = new Properties(this.dumper);
    this.phpDoc = new PhpDoc(this.dumper);

    this.sectionDumpers = {
      attributes : this.dumpAttributes.bind(this),
      cases : this.cases.dump.bind(this.cases),
      constants : this.constants.dump.bind(this.constants),
      extends : this.dumpExtends.bind(this),
      implements : this.dumpImplements.bind(this),
      methods : this.methods.dump.bind(this.methods),
      phpDoc : this.phpDoc.dump.bind(this.phpDoc),
      properties : this.properties.dump.bind(this.properties),
    };

    // GENERAL
    this.PHPDOC_OUTPUT = 2;
    this.OBJ_ATTRIBUTE_OUTPUT = 8;
    this.BRIEF = 4194304;

    // CONSTANTS
    this.CONST_COLLECT = 32;
    this.CONST_OUTPUT = 64;
    this.CONST_ATTRIBUTE_OUTPUT = 256;

    // CASE
    this.CASE_COLLECT = 512;
    this.CASE_OUTPUT = 1024;
    this.CASE_ATTRIBUTE_OUTPUT = 4096;

    // PROPERTIES
    this.PROP_ATTRIBUTE_OUTPUT = 16384;

    // METHODS
    this.METHOD_COLLECT = 32768;
    this.METHOD_OUTPUT = 65536;
    this.METHOD_ATTRIBUTE_OUTPUT = 262144;
    this.METHOD_DESC_OUTPUT = 524288;
    this.METHOD_STATIC_VAR_OUTPUT = 16777216; // 2^24
    this.PARAM_ATTRIBUTE_OUTPUT = 2097152;

    this.phpDocTypes = [
      'array','bool','callable','float','int','iterable','null','object','string',
      '$this','self','static',
      'array-key','double','false','mixed','non-empty-array','resource','scalar','true','void',
      'key-of', 'value-of',
      'callable-string', 'class-string', 'literal-string', 'numeric-string', 'non-empty-string',
      'negative-int', 'positive-int',
      'int-mask', 'int-mask-of',
    ];

  }

  function sort(obj, sortBy) {
    var count;
    var i;
    var name;
    var objNew = {};
    var sortInfo = [];
    var sortVisOrder = ['public', 'magic', 'magic-read', 'magic-write', 'protected', 'private', 'debug'];
    var vis;
    for (name in obj) {
      if (name === '__construct') {
        sortInfo.push({
          name: name,
          nameSort: "\x00",
          visibility: 0,
        });
        continue
      }
      vis = Array.isArray(obj[name].visibility)
        ? obj[name].visibility[0]
        : obj[name].visibility;
      sortInfo.push({
        name: name,
        nameSort: name,
        vis: sortVisOrder.indexOf(vis),
      });
    }
    sortBy = sortBy.split(/[,\s]+/);
    sortInfo.sort(function (itemA, itemB) {
      var ret = 0;
      for (i = 0, count = sortBy.length; i < count; i++) {
        if (['visibility', 'vis'].indexOf(sortBy[i]) > -1) {
          if (itemA.vis < itemB.vis) {
            ret = -1;
          } else if (itemA.vis > itemB.vis) {
            ret = 1;
          }
        } else if (sortBy[i] === 'name') {
          ret = itemA.nameSort.localeCompare(itemB.nameSort);
        }
        if (ret !== 0) {
          break
        }
      }
      return ret
    });
    for (i = 0, count = sortInfo.length; i < count; i++) {
      name = sortInfo[i].name;
      objNew[name] = obj[name];
    }
    return objNew
  }

  DumpObject.prototype.dump = function (abs) {
    // console.info('dumpObject', abs)
    var html = '';
    var strClassName = '';
    var dumpOpts = this.dumper.getDumpOpts();
    try {
      abs.debugVersion = this.dumper.getRequestInfo().$container.data('meta').debugVersion;
      if (typeof abs.cfgFlags === 'undefined') {
        abs.cfgFlags = 0x1FFFFFF & ~this.BRIEF;
      }
      abs = this.mergeInherited(abs);
      if (typeof abs.sort === 'undefined') {
        abs.sort = 'vis name';
      } else if (abs.sort === 'visibility' && versionCompare(abs.debugVersion, '3.2') === -1) {
        abs.sort = 'vis name';
      }
      if (typeof abs.implementsList === 'undefined') {
        // PhpDebugConsole < 3.1
        abs.implementsList = abs.implements;
      }
      strClassName = this.dumpClassName(abs);
      if (abs.isRecursion) {
        return strClassName +
          ' <span class="t_recursion">*RECURSION*</span>'
      }
      if (abs.isMaxDepth) {
        return strClassName +
          ' <span class="t_maxDepth">*MAX DEPTH*</span>'
      }
      if (abs.isExcluded) {
        return strClassName +
          ' <span class="excluded">(not inspected)</span>'
      }
      if (abs.cfgFlags & this.BRIEF && abs.implementsList.indexOf('UnitEnum') > -1) {
        return strClassName
      }
      if (abs.sort.indexOf('inheritance') === 0) {
        dumpOpts.attribs.class.push('groupByInheritance');
      }
      html = this.dumpToString(abs) +
        strClassName +
        '<dl class="object-inner">' +
          this.dumpInner(abs) +
        '</dl>';
    } catch (e) {
      console.warn('e', e);
    }
    return html
  };

  DumpObject.prototype.dumpAttributes = function (abs) {
    var html = '';
    var self = this;
    var args = [];
    if (abs.attributes === undefined) {
      return ''
    }
    if ((abs.cfgFlags & this.OBJ_ATTRIBUTE_OUTPUT) !== this.OBJ_ATTRIBUTE_OUTPUT) {
      return ''
    }
    $$1.each(abs.attributes, function (key, attribute) {
      args = [];
      html += '<dd class="attribute">';
      html += self.dumper.markupIdentifier(attribute.name);
      if (Object.keys(attribute.arguments).length) {
        $$1.each(attribute.arguments, function (name, val) {
          args.push(
            (name.match(/^\d+$/) === null
              ? '<span class="t_parameter-name">' + self.dumper.dumpPhpDocStr(name) + '</span><span class="t_punct">:</span>'
              : '') +
            self.dumper.dump(val)
          );
        });
        html += '<span class="t_punct">(</span>' +
          args.join('<span class="t_punct">,</span> ') +
          '<span class="t_punct">)</span>';
      }
      html += '</dd>';
    });
    return html.length
      ? '<dt class="attributes">attributes</dt>' + html
      : ''
  };

  DumpObject.prototype.dumpClassName = function (abs) {
    var phpDoc = abs.phpDoc || {};
    var strClassName = abs.className;
    var title = this.dumper.dumpPhpDocStr(((phpDoc.summary || '') + '\n\n' + (phpDoc.desc || '')).trim());
    var phpDocOut = abs.cfgFlags & this.PHPDOC_OUTPUT;
    var $span;
    if (abs.implementsList.indexOf('UnitEnum') > -1) {
      // strClassName += '::' + abs.properties.name.value
      $span = $$1('<span />', {
        class: 't_const',
        html: this.dumper.markupIdentifier(strClassName + '::' + abs.properties.name.value)
      });
      if (title && title.length) {
        $span.attr('title', title);
      }
      return $span[0].outerHTML
    }
    return this.dumper.markupIdentifier(strClassName, 'classname', 'span', {
      title: phpDocOut && title.length ? title : null
    })
  };

  DumpObject.prototype.dumpExtends = function (abs) {
    var self = this;
    return abs.extends && abs.extends.length
      ? '<dt>extends</dt>' +
          abs.extends.map(function (className) {
            return '<dd class="extends">' + self.dumper.markupIdentifier(className, 'classname') + '</dd>'
          }).join('')
      : ''
  };

  DumpObject.prototype.dumpImplements = function (abs) {
    if (!abs.implementsList.length) {
      return ''
    }
    if (typeof abs.interfacesCollapse === 'undefined') {
      // PhpDebugConsole < 3.2
      abs.interfacesCollapse = ['ArrayAccess', 'BackedEnum', 'Countable', 'Iterator', 'IteratorAggregate', 'UnitEnum'];
    }
    return '<dt>implements</dt>' +
      '<dd class="implements">' + this.buildImplementsTree(abs.implements, abs.interfacesCollapse) + '</dd>'
  };

  DumpObject.prototype.dumpInner = function (abs) {
    var self = this;
    var html = this.dumpModifiers(abs);
    if (typeof abs.sectionOrder === 'undefined') {
      // PhpDebugConsole < 3.2
      abs.sectionOrder = ['attributes', 'extends', 'implements', 'constants', 'cases', 'properties', 'methods', 'phpDoc'];
    }
    abs.sectionOrder.forEach(function (sectionName) {
      html += self.sectionDumpers[sectionName](abs);
    });
    return html
  };

  DumpObject.prototype.dumpModifiers = function (abs) {
    var modifiers = {
      abstract: abs.isAbstract,
      final: abs.isFinal,
      interface: abs.isInterface,
      readonly: abs.isReadOnly,
      trait: abs.isTrait,
    };
    var haveModifier = false;
    var html = '<dt class="modifiers">modifiers</dt>';
    /*
    if (abs.isFinal) {
      modifiers.push('final')
    }
    if (abs.isReadOnly) {
      modifiers.push('readonly')
    }
    if (modifiers.length === 0) {
      return ''
    }
    */
    $$1.each(modifiers, function (modifier, isSet) {
      if (isSet) {
        haveModifier = true;
        html += '<dd class="t_modifier_' + modifier + '">' + modifier + '</dd>';
      }
    });
    return haveModifier
      ? html
      : ''
  };

  DumpObject.prototype.dumpToString = function (abs) {
    // var objToString = ''
    var val = '';
    var len;
    var title;
    var valAppend = '';
    var $toStringDump;
    if (typeof abs.stringified !== 'undefined' && abs.stringified !== null) {
      val = abs.stringified;
    } else if (typeof abs.methods.__toString !== 'undefined' && abs.methods.__toString.returnValue) {
      val = abs.methods.__toString.returnValue;
    }
    if (typeof val === 'object') {
      len = val.strlen;
      val = val.value;
    } else {
      len = val.length;
    }
    if (len === 0) {
      return ''
    }
    if (len > 100) {
      val = val.substring(0, 100);
      valAppend = '&hellip; <i>(' + (len - 100) + ' more bytes)</i>';
    }
    $toStringDump = $$1(this.dumper.dump(val));
    title = (!abs.stringified ? '__toString() : ' : '') + $toStringDump.prop('title');
    if (title === '__toString() : ') {
      title = '__toString()';
    }
    return '<span class="' + $toStringDump.prop('class') + ' t_stringified" ' +
      (title.length ? 'title="' + title + '"' : '') +
      '>' +
      $toStringDump.html() +
      valAppend +
      '</span> '
  };

  DumpObject.prototype.buildImplementsTree = function (implementsObj, interfacesCollapse) {
    var html = '<ul class="list-unstyled">';
    var iface;
    var $span;
    var k;
    for (k in implementsObj) {
        iface = typeof implementsObj[k] === 'string'
          ? implementsObj[k]
          : k;
        $span = $$1('<span />', {
          class: 'interface',
          html: this.dumper.markupIdentifier(iface, 'classname')
        });
        if (interfacesCollapse.indexOf(iface) > -1) {
          $span.addClass('toggle-off');
        }
        html += '<li>' +
          $span[0].outerHTML +
          (typeof implementsObj[k] === 'object'
             ? this.buildImplementsTree(implementsObj[k], interfacesCollapse)
             : ''
          ) +
          '</li>';
    }
    html += '</ul>';
    return html
  };

  DumpObject.prototype.markupType = function (type, attribs) {
    var self = this;
    type = type.replace(/(?:(\$this|[-\w\[\]'"\\]+:?)|([\(\)<>\{\},\|&]))/g, function (match, p1, p2) {
      return p1
        ? self.markupTypePart(p1)
        : '<span class="t_punct">' + p2.escapeHtml() + '</span>'
    });
    if (typeof attribs === 'undefined') {
      return type
    }
    attribs = Object.fromEntries(
      Object.entries(attribs).filter(function (entry) {
        return typeof entry[1] === 'string' && entry[1].length > 0
      })
    );
    if (Object.keys(attribs).length > 0) {
      type = $$1('<span></span>').attr(attribs).html(type)[0].outerHTML;
    }
    return type
  };

  DumpObject.prototype.markupTypePart = function (type) {
    var arrayCount = 0;
    var strlen = 0;
    var matches = type.match(/(\[\])+$/);
    if (matches) {
      strlen = matches[0].length;
      arrayCount = strlen / 2;
      type = type.substr(0, 0 - strlen);
    }
    if (type.match(/^\d+$/)) {
      return '<span class="t_type">' + type + '</span>'
    }
    if (type.substr(-1) === ':') {
      // array "shape" key
      type = type.replace(/^[:'"]+|[:'"]$/g, '');
      return '<span class="t_string">' + type + '</span><span class="t_punct">:</span>'
    }
    if (type.match(/^['"]/)) {
      type = type.replace(/^['"]+|['"]$/g, '');
      return '<span class="t_string t_type">' + type + '</span>'
    }
    if (this.phpDocTypes.indexOf(type) < 0) {
      type = this.dumper.markupIdentifier(type);
    }
    if (arrayCount > 0) {
      type += '<span class="t_punct">' + '[]'.repeat(arrayCount) + '</span>';
    }
    return '<span class="t_type">' + type + '</span>'
  };

  DumpObject.prototype.mergeInherited = function (abs) {
    var count;
    var i = 0;
    var inherited;
    var noInherit = ['attributes', 'cases', 'constants', 'methods', 'properties'];
    if (abs.classDefinition) {
      // PhpDebugConsole < 3.2
      abs.inheritsFrom = abs.classDefinition;
    }
    while (abs.inheritsFrom) {
      inherited = this.dumper.getClassDefinition(abs.inheritsFrom);
      if (abs.isRecursion || abs.isExcluded) {
        for (i = 0, count = noInherit.length; i < count; i++) {
          inherited[noInherit[i]] = {};
        }
      }
      abs = JSON.parse(JSON.stringify(mergeWith_1({}, inherited, abs, function (objValue, srcValue) {
        if (objValue === null || srcValue === null) {
          return
        }
        if (typeof srcValue === 'object' && typeof objValue === 'object' && Object.keys(objValue).length === 0) {
          return srcValue
        }
      })));
      abs.inheritsFrom = inherited.inheritsFrom;
    }
    for (i = 0, count = noInherit.length; i < count; i++) {
      if (typeof abs[noInherit[i]] === 'undefined') {
        abs[noInherit[i]] = {};
      }
      abs[noInherit[i]] = sort(abs[noInherit[i]], abs.sort);
    }
    return abs
  };

  var base64Arraybuffer = createCommonjsModule(function (module, exports) {
  /*
   * base64-arraybuffer
   * https://github.com/niklasvh/base64-arraybuffer
   *
   * Copyright (c) 2012 Niklas von Hertzen
   * Licensed under the MIT license.
   */
  (function(){

    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    // Use a lookup table to find the index.
    var lookup = new Uint8Array(256);
    for (var i = 0; i < chars.length; i++) {
      lookup[chars.charCodeAt(i)] = i;
    }

    exports.encode = function(arraybuffer) {
      var bytes = new Uint8Array(arraybuffer),
      i, len = bytes.length, base64 = "";

      for (i = 0; i < len; i+=3) {
        base64 += chars[bytes[i] >> 2];
        base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
        base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
        base64 += chars[bytes[i + 2] & 63];
      }

      if ((len % 3) === 2) {
        base64 = base64.substring(0, base64.length - 1) + "=";
      } else if (len % 3 === 1) {
        base64 = base64.substring(0, base64.length - 2) + "==";
      }

      return base64;
    };

    exports.decode =  function(base64) {
      var bufferLength = base64.length * 0.75,
      len = base64.length, i, p = 0,
      encoded1, encoded2, encoded3, encoded4;

      if (base64[base64.length - 1] === "=") {
        bufferLength--;
        if (base64[base64.length - 2] === "=") {
          bufferLength--;
        }
      }

      var arraybuffer = new ArrayBuffer(bufferLength),
      bytes = new Uint8Array(arraybuffer);

      for (i = 0; i < len; i+=4) {
        encoded1 = lookup[base64.charCodeAt(i)];
        encoded2 = lookup[base64.charCodeAt(i+1)];
        encoded3 = lookup[base64.charCodeAt(i+2)];
        encoded4 = lookup[base64.charCodeAt(i+3)];

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
      }

      return arraybuffer;
    };
  })();
  });
  var base64Arraybuffer_1 = base64Arraybuffer.encode;
  var base64Arraybuffer_2 = base64Arraybuffer.decode;

  function chunkSplit(str, length, separator) {
    if (typeof separator === 'undefined') {
      separator = '\n';
    }
    return str.match(new RegExp('.{1,' + length + '}', 'g')).map(function (chunk) {
      return chunk + separator
    }).join('')
  }

  function DumpStringBinary (dumpString) {
    this.dumpString = dumpString;
    // this.dumpEncoded = new DumpStringEncoded(this)
    // this.charHighlight = new CharHighlight(this)
  }

  DumpStringBinary.prototype.dump = function (abs) {
    var dumpOpts = this.dumpString.dumper.getDumpOpts();
    var tagName = dumpOpts.tagName;
    var str = this.dumpBasic(abs);
    var strLenDiff = abs.strlen - abs.strlenValue;
    if (abs.strlenValue && strLenDiff) {
        str += '<span class="maxlen">&hellip; ' + strLenDiff + ' more bytes (not logged)</span>';
    }
    if (abs.brief) {
        return this.dumpBrief(str, abs)
    }
    if (abs.percentBinary > 33 || abs.contentType) {
        dumpOpts.postDump = this.dumpPost(abs, tagName);
    }
    return str
  };

  DumpStringBinary.prototype.dumpBasic = function (abs) {
    var self = this;
    if (abs.strlenValue === 0) {
      return ''
    }
    return typeof abs.chunks !== 'undefined'
      ? abs.chunks.map(function (chunk) {
          return chunk[0] === 'utf8'
            ? self.dumpString.dump(chunk[1])
            : '<span class="binary">\\x' + chunk[1].replace(' ', ' \\x') + '</span>'
        }).join('')
      : '<span class="binary">'
          + chunkSplit(abs.value, 3 * 32, '<br />').substring(0, -6)
          + '</span>'
  };

  DumpStringBinary.prototype.dumpBrief = function (str, abs) {
      // @todo display bytes
      return abs.contentType
        ? '<span class="t_keyword">string</span>' +
            '<span class="text-muted">(' + abs.contentType + ')</span><span class="t_punct colon">:</span> '
        : str
  };

  DumpStringBinary.prototype.dumpPost = function (abs, tagName) {
    return function (str) {
      var lis = [];
      if (abs.contentType) {
        lis.push('<li>mime type = <span class="content-type t_string">' + abs.contentType + '</span></li>');
      }
      lis.push('<li>size = <span class="t_int">' + abs.strlen + '</span></li>');
      lis.push(abs.value.length
        ? '<li class="t_string">' + str + '</li>'
        : '<li>Binary data not collected</li>');
      str = '<span class="t_keyword">string</span><span class="text-muted">(binary)</span>' +
        '<ul class="list-unstyled value-container" data-type="' + abs.type + '" data-type-more="binary">' +
           lis.join('\n') +
        '</ul>';
      if (tagName === 'td') {
        str = '<td>' + str + '</td>';
      }
      return str
    }
  };

  function DumpStringEncoded (dumpString) {
    this.dumpString = dumpString;
    this.dumper = dumpString.dumper;
  }

  DumpStringEncoded.prototype.dump = function (val, abs) {
    var dumpOpts = this.dumper.getDumpOpts();
    var tagName = dumpOpts.tagName === '__default__'
      ? 'span'
      : dumpOpts.tagName;
    var tabs = {};

    if (abs.brief) {
      return tabValues(abs, this.dumper).valRaw
    }

    tabs = this.buildTabsAndPanes(abs);
    dumpOpts.tagName = null;

    return $$1('<' + tagName + '>', {
      class: 'string-encoded tabs-container',
      'data-type-more': abs.typeMore
    }).html('\n' +
      '<nav role="tablist">' +
          tabs.tabs.join('') +
      '</nav>' +
      tabs.panes.join('')
    )[0].outerHTML
  };

  DumpStringEncoded.prototype.buildTabsAndPanes = function (abs) {
    var tabs = {
      tabs: [],
      panes: []
    };
    var index = 1;
    var vals;
    do {
      vals = tabValues(abs, this.dumper);
      tabs.tabs.push('<a class="nav-link" data-target=".tab-' + index + '" data-toggle="tab" role="tab">' + vals.labelRaw + '</a>');
      tabs.panes.push('<div class="tab-' + index + ' tab-pane" role="tabpanel">' + vals.valRaw + '</div>');
      index++;
      abs = abs.valueDecoded;
    } while (this.dumpString.isEncoded(abs))
    tabs.tabs.push('<a class="active nav-link" data-target=".tab-' + index + '" data-toggle="tab" role="tab">' + vals.labelDecoded + '</a>');
    tabs.panes.push('<div class="active tab-' + index + ' tab-pane" role="tabpanel">' + this.dumper.dump(abs) + '</div>');
    return tabs
  };

  function tabValues (abs, dumper) {
    var dumpOpts = dumper.getDumpOpts();
    var attribs = JSON.parse(JSON.stringify(dumpOpts.attribs));
    attribs.class.push('no-quotes');
    attribs.class.push('t_' + abs.type);
    attribs.class = attribs.class.join(' ');
    if (abs.typeMore === 'base64' && abs.brief) {
      dumpOpts.postDump = function (val) {
        return '<span class="t_keyword">string</span><span class="text-muted">(base64)</span><span class="t_punct colon">:</span> ' + val
      };
    }
    return tabValuesFinish({
      labelDecoded: 'decoded',
      labelRaw: 'raw',
      valRaw: $$1('<span />', attribs).html(
        dumper.dump(abs.value, { tagName: null })
      )[0].outerHTML
    }, abs, dumper)
  }

  function tabValuesFinish (vals, abs, dumper) {
    switch (abs.typeMore) {
      case 'base64':
        // vals.labelDecoded = 'decoded'
        vals.labelRaw = 'base64';
        if (abs.strlen) {
          vals.valRaw += '<span class="maxlen">&hellip; ' + (abs.strlen - abs.value.length) + ' more bytes (not logged)</span>';
        }
        break
      case 'json':
        // vals.labelDecoded = 'decoded'
        vals.labelRaw = 'json';
        if (abs.prettified || abs.strlen) {
          abs.typeMore = null; // unset typeMore to prevent loop
          vals.valRaw = dumper.dump(abs);
          abs.typeMore = 'json';
        }
        break
      case 'serialized':
        vals.labelDecoded = 'unserialized';
        vals.labelRaw = 'serialized';
        break
    }
    return vals
  }

  /**
   * Nutshell:  working with strings in Javascript is a PITA
   *
   * No way of knowing if \xED (an invalid utf-8 byte) was passed or \xC3\xAD
   */

  /*
  eslint
    "no-control-regex": "off",
    "no-extend-native": ["error", { "exceptions": ["String"] }],
    "no-misleading-character-class": "off"
  */

  String.prototype.ucfirst = function () {
    return this.charAt(0).toUpperCase() + this.slice(1)
  };

  String.prototype.padLeft = function (pad, len) {
    var diff = len - this.length;
    var i;
    var str = '';
    if (diff < 1) {
      return this
    }
    for (i = 0; i < diff; i++) {
      str += pad;
    }
    return str + this
  };

  var StrDump = function () {
    this.str = '';
    this.bytes = null;
  };

  /**
   * Convert a unicode code point to an array of byte(s)
   *
   * 0x10348 will be converted into [0xF0 0x90 0x8D 0x88]
   *
   * @param integer cp unicode code point
   *
   * @return integer[]
   */
  StrDump.prototype.cpToUtf8Bytes = function (cp) {
    if (cp < 0x80) {
      return [
        cp & 0x7F
      ]
    } else if (cp < 0x800) {
      return [
        ((cp >> 6) & 0x1F) | 0xC0,
        (cp & 0x3F) | 0x80
      ]
    } else if (cp < 0x10000) {
      return [
        ((cp >> 12) & 0x0F) | 0xE0,
        ((cp >> 6) & 0x3F) | 0x80,
        (cp & 0x3F) | 0x80
      ]
    }
    return [
      ((cp >> 18) & 0x07) | 0xF0,
      ((cp >> 12) & 0x3F) | 0x80,
      ((cp >> 6) & 0x3F) | 0x80,
      (cp & 0x3F) | 0x80
    ]
  };

  StrDump.prototype.dump = function (bytes, sanitize) {
    var curI = 0;
    var isUtf8;
    var info = {};
    var len;
    var curBlockType = 'utf8'; // utf8, utf8special, other
    var newBlockType = null;
    var curBlockStart = 0; // string offset
    var percentOther = 0;
    var strNew = '';
    var strBlock = '';
    this.setBytes(bytes);
    while (this.curI < this.stats.bytesLen) {
      curI = this.curI; // store before gets incremented
      isUtf8 = this.isOffsetUtf8(info);
      newBlockType = isUtf8
        ? 'utf8'
        : 'other';
      if (isUtf8) {
        strBlock += info.char;
      }
      if (newBlockType !== curBlockType) {
        len = curI - curBlockStart;
        this.incStat(curBlockType, len);
        if (curBlockType === 'utf8') {
          if (sanitize) {
            strBlock = strBlock.escapeHtml();
          }
          strNew += strBlock;
          strBlock = '';
        } else {
          strNew += this.dumpBlock(this.bytes.slice(curBlockStart, this.curI - 1), curBlockType);
        }
        curBlockStart = curI;
        curBlockType = newBlockType;
      }
    }
    len = this.stats.bytesLen - curBlockStart;
    this.incStat(curBlockType, len);
    percentOther = this.stats.bytesOther / this.stats.bytesLen * 100;
    if (percentOther > 33 || this.stats.bytesOther >= 5) {
      strNew = this.dumpBlock(this.bytes, 'other', { prefix: false });
    } else if (curBlockType === 'utf8') {
      if (sanitize) {
        strBlock = strBlock.escapeHtml();
      }
      strNew += strBlock;
    } else {
      strNew += this.dumpBlock(this.bytes.slice(curBlockStart, this.stats.bytesLen), curBlockType);
    }
    return strNew
  };

  StrDump.prototype.bytesToHex = function (bytes, prefix) {
    return Array.prototype.slice.call(bytes).map(function (val) {
      var ret = val.toString(16).padLeft('0', 2);
      if (prefix) {
        ret = prefix + ret;
      }
      return ret
    }).join(' ')
  };

  /**
   * Private method
   */
  StrDump.prototype.dumpBlock = function (bytes, blockType, options) {
    var str = '';
    // var title
    options = options || {};
    if (typeof options.prefix === 'undefined') {
      options.prefix = true;
    }
    if (blockType === 'other') {
      str = this.bytesToHex(bytes, options.prefix ? '\\x' : '');
      str = '<span class="binary">' + str + '</span>';
    }
    return str
  };

  /**
   * String.fromCharCode that supports > U+FFFF
   *
   * @param integer code unicode value
   */
  StrDump.prototype.fromCodepoint = function (code) {
    if (code > 0xFFFF) {
      code -= 0x10000;
      return String.fromCharCode(0xD800 + (code >> 10), 0xDC00 + (code & 0x3FF))
    } else {
      return String.fromCharCode(code)
    }
  };

  StrDump.prototype.encodeUTF16toUTF8 = function (str) {
    var bytes = [];
    var codepoints = this.utf16ToUnicode(str);
    var i;
    var length = codepoints.length;
    for (i = 0; i < length; i++) {
      bytes.push.apply(bytes, this.cpToUtf8Bytes(codepoints[i]));
    }
    return bytes
  };

  /**
   * @return array of codepoints
   *
   * @see http://jonisalonen.com/2012/from-utf-16-to-utf-8-in-javascript/
   * @see https://github.com/dcodeIO/utfx/blob/master/src/utfx.js
   */
  StrDump.prototype.utf16ToUnicode = function (str) {
    var i;
    var code1 = null;
    var code2 = null;
    var codes = [];
    for (i = 0; i < str.length; i++) {
      code1 = str.charCodeAt(i);
      if (code1 >= 0xD800 && code1 <= 0xDFFF) {
        if (i + 1 < str.length) {
          i++;
          code2 = str.charCodeAt(i);
          if (code2 >= 0xDC00 && code2 <= 0xDFFF) {
            codes.push((code1 - 0xD800) * 0x400 + code2 - 0xDC00 + 0x10000);
            code2 = null;
            continue
          }
        }
      }
      codes.push(code1);
    }
    if (code2 !== null) {
      codes.push(code2);
    }
    return codes
  };

  StrDump.prototype.incStat = function (stat, inc) {
    if (stat === 'utf8special') {
      stat = 'bytesSpecial';
    } else {
      stat = 'bytes' + stat.ucfirst();
    }
    this.stats[stat] += inc;
  };

  /**
   * sets
   *   info.char
   *   info.codepoint
   */
  StrDump.prototype.isOffsetUtf8 = function (info) {
    var len = this.stats.bytesLen;
    var byte1 = this.bytes[this.curI];
    var byte2 = this.curI + 1 < len ? this.bytes[this.curI + 1] : null;
    var byte3 = this.curI + 2 < len ? this.bytes[this.curI + 2] : null;
    var byte4 = this.curI + 3 < len ? this.bytes[this.curI + 3] : null;
    var numBytes = 1;
    info.codepoint = null;
    info.char = null;
    if (byte1 < 0x80) {
      // 0xxxxxxx
      numBytes = 1;
    } else if ((byte1 & 0xE0) === 0xC0) {
      // 110xxxxx 10xxxxxx
      if (
        this.curI + 1 >= len ||
        (byte2 & 0xC0) !== 0x80 ||
        (byte1 & 0xFE) === 0xC0 // overlong
      ) {
        this.curI += 1;
        return false
      }
      numBytes = 2;
    } else if ((byte1 & 0xF0) === 0xE0) {
      // 1110xxxx 10xxxxxx 10xxxxxx
      if (
        this.curI + 2 >= len ||
        (byte2 & 0xC0) !== 0x80 ||
        (byte3 & 0xC0) !== 0x80 ||
        (byte1 === 0xE0 && (byte2 & 0xE0) === 0x80) || // overlong
        (byte1 === 0xED && (byte2 & 0xE0) === 0xA0) // UTF-16 surrogate (U+D800 - U+DFFF)
      ) {
        this.curI += 1;
        return false
      }
      numBytes = 3;
    } else if ((byte1 & 0xF8) === 0xF0) {
      // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
      if (
        this.curI + 3 >= len ||
        (byte2 & 0xC0) !== 0x80 ||
        (byte3 & 0xC0) !== 0x80 ||
        (byte4 & 0xC0) !== 0x80 ||
        (byte1 === 0xF0 && (byte2 & 0xF0) === 0x80) || // overlong
        (byte1 === 0xF4 && byte2 > 0x8F) ||
        byte1 > 0xF4 // > U+10FFFF
      ) {
        this.curI += 1;
        return false
      }
      numBytes = 4;
    } else {
      this.curI += 1;
      return false
    }
    info.codepoint = this.Utf8BytesToCodePoint(this.bytes, { offset: this.curI });
    info.char = this.fromCodepoint(info.codepoint);
    /*
    console.log({
      curI: this.curI,
      curINew: this.curI + numBytes,
      numBytes: numBytes,
      codepoint: info.codepoint,
      char: info.char,
      isSpecial: info.isSpecial
    })
    */
    this.curI += numBytes;
    return true
  };

  StrDump.prototype.Utf8BytesToCodePoint = function (bytes, offsetObj) {
    var cp = bytes[offsetObj.offset];
    var i;
    var numBytes = 1;
    var code2;
    if (cp >= 0x80) {
      // otherwise 0xxxxxxx
      if (cp < 0xe0) {
        // 110xxxxx
        numBytes = 2;
        // cp -= 0xC0
      } else if (cp < 0xf0) {
        // 1110xxxx
        numBytes = 3;
        // cp -= 0xE0
      } else if (cp < 0xf8) {
        // 11110xxx
        numBytes = 4;
        // cp -= 0xF0
      }
      cp = cp - 192 - (numBytes > 2 ? 32 : 0) - (numBytes > 3 ? 16 : 0);
      for (i = 1; i < numBytes; i++) {
        code2 = bytes[offsetObj.offset + i] - 128; // 10xxxxxx
        cp = cp * 64 + code2;
      }
    }
    offsetObj.offset += numBytes;
    return cp
  };

  StrDump.prototype.setBytes = function (bytes) {
    this.curI = 0;
    this.bytes = bytes;
    this.stats = {
      bytesLen: this.bytes.length,
      bytesOther: 0,
      bytesSpecial: 0, // special UTF-8
      bytesUtf8: 0 // includes ASCII
    };
  };

  /*
  StrDump.prototype.getUtf16Bytes = function (str) {
    var bytes = []
    var char
    var b1
    var b1
    var i
    var l = str.length
    try {
      for(i = 0; i < l; i++) {
        char = str.charCodeAt(i)
        b1 = char >>> 8
        b2 = char & 0xFF
        if (b1) {
          bytes.push(b1)
        }
        bytes.push(b2)
      }
    } catch (e) {
      console.warn('e', e)
    }
    return bytes
  }
  */

  /**
   * Check UTF-8 string (or single-character) against list of special characters or regular-expressions
   *
   * @param string $str String to check
   *
   * @return boolean
   */
  /*
  StrDump.prototype.hasSpecial = function (str) {
    var i
    var special
    for (i = 0; i < this.special.length; i++) {
      special = this.special[i]
      if (special instanceof RegExp) {
        if (special.test(str)) {
          return true
        }
      } else if (str.indexOf(special) > -1) {
        return true
      }
    }
    return false
  }
  */

  /*
  StrDump.prototype.bytesToString = function (bytes) {
    var str = ''
    var info = {}
    this.setBytes(bytes)
    while (this.curI < this.stats.bytesLen) {
      this.isOffsetUtf8(info)
      str += info.char
    }
    return str
  }
  */

  var CharHighlight = function (dumpString) {
    var self = this;
    this.dumpString = dumpString;
    fetch('./?action=charData')
      .then(function(response) {
        return response.json()
      }).then(function(charData) {
        self.charData = charData;
        self.charRegex = self.buildCharRegex();
      });
  };

  CharHighlight.prototype.findChars = function (str) {
    if (typeof str !== 'string') {
      return []
    }
    return (str.match(this.charRegex) || []).filter(function (value, index, array) {
      // only return if first occurrence
      return array.indexOf(value) === index
    })
  };

  CharHighlight.prototype.highlight = function (str) {
    var self = this;
    if (typeof str !== 'string') {
      return str
    }
    return str.replace(this.charRegex, function (char) {
      var info = $$1.extend({
        char: char,
        class: 'unicode',
        codePoint: char.codePointAt(0).toString(16),
        desc: '',
        replaceWith: char,
      }, self.charData[char]);
      return $$1('<span></span>', {
        class: info.class,
        'data-abbr': info.abbr
          ? info.abbr
          : null,
        'data-code-point': info.codePoint,
        title: [
            char.codePointAt(0) < 0x80
              ? '\\x' + info.codePoint.padStart(2, '0')
              : 'U-' + info.codePoint,
            info.desc,
        ].filter(function (val) {
          return val.length > 0
        }).join(': '),
        html: info.replaceWith
      })[0].outerHTML
    })
  };

  CharHighlight.prototype.buildCharRegex = function () {
    var charList = '[' +  Object.keys(this.charData).join('') + ']';
    var charControl = '[^\\P{C}\\r\\n\\t]';   // \p{C} includes \r, \n, & \t
    var charSeparator = '[^\\P{Z} ]';         // \p{Z} includes space (but not \r, \n, & \t)
    var regExTemp = new RegExp('(' + charControl + '|' + charSeparator + ')', 'ug');
    // remove chars that are covered via character properties regExs
    charList = charList.replace(regExTemp, '');
    return new RegExp('(' + charList + '|' + charControl + '|' + charSeparator + ')', 'ug')
  };

  var strDump = new StrDump();

  function DumpString (dump) {
    this.dumper = dump;
    this.dumpStringBinary = new DumpStringBinary(this);
    this.dumpEncoded = new DumpStringEncoded(this);
    this.charHighlight = new CharHighlight(this);
  }

  DumpString.prototype.dump = function (val, abs) {
    var dumpOpts = this.dumper.getDumpOpts();
    if ($$1.isNumeric(val)) {
      this.dumper.checkTimestamp(val, abs);
    }
    val = abs
      ? this.dumpAbs(abs)
      : this.doDump(val);
    if (!dumpOpts.addQuotes) {
      dumpOpts.attribs.class.push('no-quotes');
    }
    return val
  };

  DumpString.prototype.doDump = function (val) {
    var opts = this.dumper.getDumpOpts();
    if (opts.sanitize) {
      val = val.escapeHtml();
    }
    if (opts.charHighlight) {
      val = this.charHighlight.highlight(val);
    }
    if (opts.visualWhiteSpace) {
      val = visualWhiteSpace(val);
    }
    return val
  };

  DumpString.prototype.dumpAbs = function (abs) {
    // console.log('DumpString.dumpAbs', JSON.parse(JSON.stringify(abs)))
    var dumpOpts = this.dumper.getDumpOpts();
    var parsed;
    var val;
    if (abs.typeMore === 'classname') {
      val = this.dumper.markupIdentifier(abs.value, 'classname');
      parsed = this.dumper.parseTag(val);
      $$1.extend(dumpOpts.attribs, parsed.attribs);
      return parsed.innerhtml
    }
    val = this.helper(abs.value);
    if (this.isEncoded(abs)) {
      return this.dumpEncoded.dump(val, abs)
    }
    if (abs.typeMore === 'binary') {
      return this.dumpStringBinary.dump(abs)
    }
    if (abs.strlen) {
      val += '<span class="maxlen">&hellip; ' + (abs.strlen - abs.value.length) + ' more bytes (not logged)</span>';
    }
    if (abs.prettifiedTag) {
      dumpOpts.postDump = function (val, dumpOpts) {
        return $$1('<span />', {
          class: 'value-container',
          'data-type': dumpOpts.type,
          html: '<span class="prettified">(prettified)</span> '
        }).append(val)
      };
    }
    return val
  };

  DumpString.prototype.dumpAsSubstitution = function (val) {
    // console.warn('dumpAsSubstitution', val)
    var ret = '';
    var diff;
    if (typeof val === 'object') {
      if (val.typeMore === 'binary') {
        if (!val.value.length) {
          return 'Binary data not collected'
        }
        ret = this.dumper.parseTag(this.helper(val.value)).innerhtml;
        diff = val.strlen - ret.split(' ').length;
        if (diff) {
          ret += '[' + diff + ' more bytes (not logged)]';
        }
        return ret
      }
    }
    // we do NOT wrap in <span>...  log('<a href="%s">link</a>', $url)
    return this.dumper.dump(val, {
      tagName: null
    })
  };

  DumpString.prototype.helper = function (val) {
    var bytes = val.substr(0, 6) === '_b64_:'
      ? new Uint8Array(base64Arraybuffer.decode(val.substr(6)))
      : strDump.encodeUTF16toUTF8(val);
    var dumpOpts = this.dumper.getDumpOpts();
    return strDump.dump(bytes, dumpOpts.sanitize)
    /*
    if (dumpOpts.visualWhiteSpace) {
      val = visualWhiteSpace(val)
    }
    return val
    */
  };

  DumpString.prototype.isEncoded = function (val) {
    return ['base64', 'json', 'serialized'].indexOf(val.typeMore) > -1
  };

  /**
   * Add whitespace markup
   *
   * \r, \n, & \t
   *
   * @param string str string which to add whitespace html markup
   *
   * @return string
   */
  function visualWhiteSpace (str) {
    var i = 0;
    var strBr = '';
    var searchReplacePairs = [
      [/\r/g, '<span class="ws_r"></span>'],
      [/\n/g, '<span class="ws_n"></span>' + strBr + '\n']
    ];
    var length = searchReplacePairs.length;
    str = str.replace(/(\r\n|\r|\n)/g, function (match) {
      for (i = 0; i < length; i++) {
        match = match.replace(searchReplacePairs[i][0], searchReplacePairs[i][1]);
      }
      return match
    })
      .replace(/(<br \/>)?\n$/g, '')
      .replace(/\t/g, '<span class="ws_t">\t</span>');
    return str
  }

  var dumpOptStack = [
    /*
    {
      attribs
      opts
      postDump
      tagName
      type
      typeMore
    }
    */
  ];

  var Dump = function () {
    this.objectDumper = new DumpObject(this);
    this.stringDumper = new DumpString(this);
    this.ABSTRACTION = '\x00debug\x00'.parseHex();
    this.NOT_INSPECTED = '\x00notInspected\x00'.parseHex();
    this.RECURSION = '\x00recursion\x00'.parseHex();
    this.UNDEFINED = '\x00undefined\x00'.parseHex();
    this.TYPE_FLOAT_INF = '\x00inf\x00'.parseHex();
    this.TYPE_FLOAT_NAN = '\x00nan\x00'.parseHex();
  };

  Dump.prototype.checkTimestamp = function (val, abs) {
    var date;
    var dumpOpts;
    if (typeof abs === 'undefined' || abs.typeMore !== 'timestamp') {
      return
    }
    date = (new Date(val * 1000)).toString();
    dumpOpts = this.getDumpOpts();
    dumpOpts.postDump = function (dumped, opts) {
      if (opts.tagName === 'td') {
        opts.attribs.class = 't_' + opts.type;
        return $$1('<td />', {
          class: 'timestamp value-container',
          title: date,
          html: $$1('<span />', opts.attribs).html(val)
        })
      }
      return $$1('<span />', {
        class: 'timestamp value-container',
        title: date,
        html: dumped
      })
    };
  };

  Dump.prototype.dump = function (val, opts) {
    var $wrap;
    var dumpOpts = $$1.extend({
      addQuotes: true,
      attribs: {
        class: []
      },
      charHighlight: true,
      postDump: null, // set to function
      requestInfo: null,
      sanitize: true,
      tagName: '__default__',
      type: null,
      typeMore: null,
      visualWhiteSpace: true
    }, opts || {});
    var tagName;
    var type; // = this.getType(val)
    var method; // = 'dump' + type[0].ucfirst()
    if (dumpOpts.type === null) {
      type = this.getType(val);
      dumpOpts.type = type[0];
      dumpOpts.typeMore = type[1];
    }
    if (typeof dumpOpts.attribs.class === 'string') {
      dumpOpts.attribs.class = [dumpOpts.attribs.class];
    }
    dumpOptStack.push(dumpOpts);
    method = 'dump' + dumpOpts.type.ucfirst();
    val = dumpOpts.typeMore === 'abstraction'
      ? this.dumpAbstraction(val)
      : this[method](val);
    dumpOpts = dumpOptStack.pop();
    tagName = dumpOpts.tagName;
    if (tagName === '__default__') {
      tagName = 'span';
      if (dumpOpts.type === 'object') {
        tagName = 'div';
      }
      dumpOpts.tagName = tagName;
    }
    if (tagName) {
      dumpOpts.attribs.class.push('t_' + dumpOpts.type);
      if (dumpOpts.typeMore && dumpOpts.typeMore !== 'abstraction') {
        dumpOpts.attribs['data-type-more'] = dumpOpts.typeMore.replace(/\0/g, '');
      }
      $wrap = $$1('<' + tagName + ' />')
        .addClass(dumpOpts.attribs.class.join(' '));
      delete dumpOpts.attribs.class;
      $wrap.attr(dumpOpts.attribs);
      if (typeof dumpOpts.attribs.style !== 'undefined') {
        // .attr() doesn't apply style when single object passed
        $wrap.attr('style', dumpOpts.attribs.style);
      }
      val = $wrap.html(val)[0].outerHTML;
    }
    if (dumpOpts.postDump) {
      val = dumpOpts.postDump(val, dumpOpts);
      if (typeof val === 'object') {
        val = val[0].outerHTML;
      }
    }
    return val
  };

  Dump.prototype.dumpAbstraction = function (abs) {
    var dumpOpts = this.getDumpOpts();
    var k;
    var method = 'dump' + abs.type.ucfirst();
    var simpleTypes = [
      'array',
      'bool',
      'float',
      'int',
      'null',
      'string'
    ];
    var value;
    dumpOpts.attribs = abs.attribs || {};
    if (dumpOpts.attribs.class === undefined) {
      dumpOpts.attribs.class = [];
    }
    for (k in dumpOpts) {
      if (abs[k] !== undefined) {
        dumpOpts[k] = abs[k];
      }
    }
    if (abs.options) {
      $$1.extend(dumpOpts, abs.options);
    }
    if (simpleTypes.indexOf(abs.type) > -1) {
      value = abs.value;
      if (abs.type === 'array') {
        // remove value so not setting as dumpOpt or passing redundantly to dumpXxxx in 2nd param
        delete abs.value;
      }
      for (k in abs) {
        if (dumpOpts[k] === undefined) {
          dumpOpts[k] = abs[k];
        }
      }
      dumpOpts.typeMore = abs.typeMore; // likely null
      return this[method](value, abs)
    }
    return this[method](abs)
  };

  Dump.prototype.dumpArray = function (array, abs) {
    var html = '';
    var i;
    var key;
    var keyShow;
    var keys = array.__debug_key_order__ || Object.keys(array);
    var length = keys.length;
    var absKeys = typeof abs?.keys === 'object'
      ? abs.keys
      : {};
    var dumpOpts = $$1.extend({
      asFileTree: false,
      expand: null,
      isMaxDepth: false,
      showListKeys: true
    }, this.getDumpOpts());
    var isList = (function () {
      for (i = 0; i < length; i++) {
        if (parseInt(keys[i], 10) !== i) {
          return false
        }
      }
      return true
    })();
    var showKeys = dumpOpts.showListKeys || !isList;
    /*
    console.warn('dumpArray', {
      array: JSON.parse(JSON.stringify(array)),
      dumpOpts: JSON.parse(JSON.stringify(dumpOpts))
    })
    */
    if (dumpOpts.expand !== null) {
      dumpOpts.attribs['data-expand'] = dumpOpts.expand;
    }
    if (dumpOpts.asFileTree) {
      dumpOpts.attribs.class.push('array-file-tree');
    }
    if (dumpOpts.isMaxDepth) {
      return '<span class="t_keyword">array</span>' +
          ' <span class="t_maxDepth">*MAX DEPTH*</span>'
    }
    if (length === 0) {
      return '<span class="t_keyword">array</span>' +
          '<span class="t_punct">(</span>\n' +
          '<span class="t_punct">)</span>'
    }
    delete array.__debug_key_order__;
    html = '<span class="t_keyword">array</span>' +
      '<span class="t_punct">(</span>\n' +
      '<ul class="array-inner list-unstyled">\n';
    for (i = 0; i < length; i++) {
      key = keys[i];
      keyShow = key;
      if (absKeys.hasOwnProperty(key)) {
        keyShow = absKeys[key];
      }
      html += this.dumpArrayValue(keyShow, array[key], showKeys);
    }
    html += '</ul>' +
      '<span class="t_punct">)</span>';
    return html
  };

  Dump.prototype.dumpArrayValue = function (key, val, withKey) {
    var $key = $$1('<span></span>');
    if (withKey === false) {
      return this.dump(val, { tagName: 'li' })
    }
    $key
      .addClass('t_key')
      .html(this.dump(key, {
        tagName : null
      }));
    if (/^\d+$/.test(key)) {
      $key.addClass('t_int');
    }
    return '<li>' +
      $key[0].outerHTML +
        '<span class="t_operator">=&gt;</span>' +
        this.dump(val) +
      '</li>'
  };

  Dump.prototype.dumpBool = function (val) {
    return val ? 'true' : 'false'
  };

  Dump.prototype.dumpCallable = function (abs) {
    return (!abs.hideType ? '<span class="t_type">callable</span> ' : '') +
      this.markupIdentifier(abs, 'function')
  };

  Dump.prototype.dumpConst = function (abs) {
    var dumpOpts = this.getDumpOpts();
    dumpOpts.attribs.title = abs.value !== this.UNDEFINED
      ? 'value: ' + this.dump(abs.value)
      : null;
    return this.markupIdentifier(abs.name, 'const')
  };

  Dump.prototype.dumpFloat = function (val, abs) {
    this.checkTimestamp(val, abs);
    if (val === this.TYPE_FLOAT_INF) {
      return 'INF'
    }
    if (val === this.TYPE_FLOAT_NAN) {
      return 'NaN'
    }
    return val
  };

  Dump.prototype.dumpInt = function (val, abs) {
    return this.dumpFloat(val, abs)
  };

  Dump.prototype.dumpNotInspected = function () {
    return 'NOT INSPECTED'
  };

  Dump.prototype.dumpNull = function () {
    return 'null'
  };

  Dump.prototype.dumpObject = function (abs) {
    var dumpOpts = this.getDumpOpts();
    dumpOpts.attribs['data-accessible'] = abs.scopeClass === abs.className
      ? 'private'
      : 'public';
    return this.objectDumper.dump(abs)
  };

  Dump.prototype.dumpRecursion = function () {
    return '<span class="t_keyword">array</span> <span class="t_recursion">*RECURSION*</span>'
  };

  Dump.prototype.dumpResource = function (abs) {
    return abs.value
  };

  Dump.prototype.dumpString = function (val, abs) {
    return this.stringDumper.dump(val, abs)
  };

  Dump.prototype.dumpUndefined = function () {
    return ''
  };

  Dump.prototype.dumpUnknown = function () {
    return '<span class="t_unknown">unknown type</span>'
  };

  Dump.prototype.dumpPhpDocStr = function (str) {
    if (str === '' || str === undefined || str === null) {
      return ''
    }
    return this.dump(str, {
      sanitize: false,
      tagName: null,
      type: 'string',
      visualWhiteSpace: false,
    })
  };

  Dump.prototype.getClassDefinition = function (name) {
    return JSON.parse(JSON.stringify(
      this.getRequestInfo().$container.data('classDefinitions')[name]
    ))
  };

  Dump.prototype.getRequestInfo = function () {
    return dumpOptStack[0].requestInfo
  };

  Dump.prototype.getDumpOpts = function () {
    return dumpOptStack[dumpOptStack.length - 1]
  };

  Dump.prototype.getType = function (val) {
    if (val === null) {
      return ['null', null]
    }
    if (typeof val === 'boolean') {
      return ['bool', val ? 'true' : 'false']
    }
    if (typeof val === 'string') {
      if (val === this.NOT_INSPECTED) {
        return ['notInspected', null]
      }
      if (val === this.RECURSION) {
        return ['recursion', null]
      }
      if (val === this.UNDEFINED) {
        return ['undefined', null]
      }
      if ($$1.isNumeric(val)) {
        return ['string', 'numeric']
      }
      return ['string', null]
    }
    if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        return ['int', null]
      }
      return ['float', null]
    }
    if (typeof val === 'object') { // already checked for null
      if (val.debug === this.ABSTRACTION) {
        return [val.type, 'abstraction']
      }
      return ['array', null]
    }
    if (typeof val === 'undefined') {
      return ['undefined', null]
    }
  };

  Dump.prototype.parseIdentifier = function (val, what) {
    var matches = []; // str.match()
    var regExp = new RegExp('^(.+)(::|->)(.+)$', 'u');
    var parts = {
      className: '',
      identifier: '',
      namespace: '',
      operator: '',
    };
    if (typeof val === 'object' && val.debug === this.ABSTRACTION) {
      val = val.value;
    }
    parts.className = val;
    if (Array.isArray(val)) {
      parts.className = val[0];
      parts.identifier = val[1];
      parts.operator = '::';
    } else if (matches = val.match(regExp)) {
      parts.className = matches[1];
      parts.operator = matches[2];
      parts.identifier = matches[3];
    } else if (['const', 'function'].indexOf(what) > -1) {
      matches = val.match(/^(.+\\)?(.+)$/);
      parts.className = '';
      parts.identifier = matches[2];
      parts.namespace = matches[1];
    }
    return parts
  };

  Dump.prototype.markupIdentifier = function (val, what, tag, attribs) {
    var parts = this.parseIdentifier(val, what);
    var split = [];
    what = what || 'classname';
    tag = tag || 'span';
    attribs = attribs || {};

    if (parts.className) {
      parts.className = this.dumpPhpDocStr(parts.className);
      split = parts.className.split('\\');
      if (split.length > 1) {
        parts.className = split.pop();
        parts.className = '<span class="namespace">' + split.join('\\') + '\\</span>' +
          parts.className;
      }
      attribs.class = 'classname';
      parts.className = $$1('<' + tag + '/>', attribs).html(parts.className)[0].outerHTML;
    } else if (parts.namespace) {
      attribs.class = 'namespace';
      parts.className = $$1('<' + tag + '/>', attribs).html(parts.namespace)[0].outerHTML;
    }
    if (parts.operator) {
      parts.operator = '<span class="t_operator">' + parts.operator.escapeHtml() + '</span>';
    }
    if (parts.identifier) {
      parts.identifier = this.dumpPhpDocStr(parts.identifier);
      parts.identifier = '<span class="t_identifier">' + parts.identifier + '</span>';
    }
    return [parts.className, parts.identifier].filter(function (val) {
      return val !== ''
    }).join(parts.operator)
  };

  Dump.prototype.parseTag = function parseTag (html) {
    var $node = $$1(html);
    var parsed = {
      tag: $node[0].tagName.toLowerCase(),
      attribs: {},
      innerhtml: $node[0].innerHTML
    };
    $$1.each($node[0].attributes, function () {
      if (this.specified) {
        parsed.attribs[this.name] = this.value;
      }
    });
    parsed.attribs.class = parsed.attribs.class
      ? parsed.attribs.class.split(' ')
      : [];
    return parsed
  };

  var dump = new Dump();
  var table = new Table(dump);

  var methods = {
    alert: function (logEntry, info) {
      var message;
      var level = logEntry.meta.level || logEntry.meta.class;
      var dismissible = logEntry.meta.dismissible;
      var $node = $$1('<div class="m_alert"></div>')
        .addClass('alert-' + level)
        // .html(message)
        .attr('data-channel', logEntry.meta.channel); // using attr so can use [data-channel="xxx"] selector
      if (logEntry.args.length > 1) {
        processSubstitutions(logEntry);
      }
      message = logEntry.args[0];
      $node.html(message);
      if (dismissible) {
        $node.prepend('<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
          '<span aria-hidden="true">&times;</span>' +
          '</button>');
        $node.addClass('alert-dismissible');
      }
      if (logEntry.meta.icon) {
        $node.data('icon', logEntry.meta.icon);
      }
      info.$tabPane.find('> .tab-body > .debug-log-summary').before($node);
      $node.debugEnhance();
    },
    clear: function (logEntry, info) {
      var attribs = {
        class: 'm_clear',
        'data-file': logEntry.meta.file,
        'data-line': logEntry.meta.line
      };
      var channelFilter = function () {
        return $$1(this).data('channel') === logEntry.meta.channel
      };
      var flags = logEntry.meta.flags;
      var i;
      var $tabPane = info.$tabPane;
      var $curNodeLog;
      var $curTreeSummary;
      var $curTreeLog;
      var $node;
      var $remove;
      var nodes = info.$node.closest('.tab-pane').data('nodes');
      var stackLen = nodes.length;
      processSubstitutions(logEntry);
      for (i = stackLen - 1; i >= 0; i--) {
        $node = nodes[i];
        if ($node.closest('.debug-log-summary').length && !$curTreeSummary) {
          $curTreeSummary = $node.parentsUntil('.debug-log-summary')
            .addBack()
            .prev('.group-header')
            .addBack();
        } else if ($node.closest('.debug-log').length && !$curTreeLog) {
          $curNodeLog = $node;
          $curTreeLog = $node.parentsUntil('.debug-log')
            .addBack()
            .prev('.group-header')
            .addBack();
        }
      }
      if (flags.alerts) {
        $tabPane.find('.alert').filter(channelFilter).remove();
      }
      if (flags.summary) {
        $tabPane.find('.debug-log-summary > .m_groupSummary').each(function () {
          $remove = $$1(this)
            .find('*')
            .not($curTreeSummary)
            .filter(channelFilter);
          if (!flags.summaryErrors) {
            $remove = $remove.not('.m_error, .m_warn');
          }
          $remove.filter('.group-header').not('.enhanced').debugEnhance('expand');
          $remove.remove();
        });
      } else if (flags.summaryErrors) {
        $tabPane.find('.debug-log-summary .m_error, .debug-log-summary .m_warn').filter(channelFilter).remove();
      }
      if (flags.log) {
        $remove = $tabPane
          .find('.debug-log > *, .debug-log .m_group > *')
          .not($curTreeLog)
          .filter(channelFilter);
        if (!flags.logErrors) {
          $remove = $remove.not('.m_error, .m_warn');
        }
        $remove.filter('.group-header').not('.enhanced').debugEnhance('expand');
        $remove.remove();
      } else if (flags.logErrors) {
        $tabPane.find('.debug-log .m_error, .debug-log .m_warn').filter(channelFilter).remove();
      }
      if (!flags.silent) {
        if (info.$node.closest('.debug-log-summary').length) {
          // we're in summary.. let's switch to content
          info.$node = $tabPane.find('.debug-log');
        }
        info.$node = $curNodeLog;
        return $$1('<li>', attribs).html(logEntry.args[0])
      }
    },
    endOutput: function (logEntry, info) {
      var $container = info.$container;
      var responseCode = logEntry.meta.responseCode;
      $container.removeData('classDefinitions');
      $container.removeClass('working');
      $container.find('.card-header .fa-spinner').remove();
      $container.find('.debug > .fa-spinner').remove();
      if (responseCode && responseCode + '' !== '200') {
        $container.find('.card-title').append(' <span class="label label-default" title="Response Code">' + responseCode + '</span>');
        if (responseCode.toString().match(/^5/)) {
          $container.addClass('bg-danger');
        }
      }
      $container.trigger('endOutput');
    },
    errorNotConsoled: function (logEntry, info) {
      var $container = info.$container;
      var $tabPane = info.$tabPane;
      var $node = $tabPane.find('.alert.error-summary');
      if (!$node.length) {
        $node = $$1('<div class="alert alert-error error-summary">' +
          '<h3><i class="fa fa-lg fa-times-circle"></i> Error(s) not consoled</h3>' +
          '<ul class="list-unstyled">' +
          '</ul>' +
          '</div>');
        $tabPane.prepend($node);
      }
      $node = $node.find('ul');
      $node.append(buildEntryNode(logEntry, info));
      if (logEntry.meta.class === 'error') {
        $container
          .addClass('bg-danger')
          .removeClass('bg-warning'); // could keep it.. but lets remove ambiguity
        return
      }
      if (!$container.hasClass('bg-danger')) {
        $container.addClass('bg-warning');
      }
    },
    group: function (logEntry, info) {
      var $group = $$1('<li>', {
        class: 'empty expanded m_group'
      });
      var $groupHeader = groupHeader(logEntry, info);
      var $groupBody = $$1('<ul>', {
        class: 'group-body'
      });
      var nodes = info.$tabPane.data('nodes');
      if (logEntry.meta.hideIfEmpty) {
        $group.addClass('hide-if-empty');
      }
      if (logEntry.meta.ungroup) {
        $group.addClass('ungroup');
      }
      if (logEntry.meta.level) {
        $groupHeader.addClass('level-' + logEntry.meta.level);
        $groupBody.addClass('level-' + logEntry.meta.level);
      }
      $group
        .append($groupHeader)
        .append($groupBody);
      nodes.push($groupBody);
      return $group
    },
    groupCollapsed: function (logEntry, info) {
      return this.group(logEntry, info).removeClass('expanded')
    },
    groupSummary: function (logEntry, info) {
      // see if priority already exists
      var priority = typeof logEntry.meta.priority !== 'undefined'
        ? logEntry.meta.priority // v2.1
        : logEntry.args[0];
      var $node;
      var $tabPane = info.$tabPane;
      var nodes = $tabPane.data('nodes');
      $tabPane.find('.debug-log-summary .m_groupSummary').each(function () {
        var priorityCur = $$1(this).data('priority');
        if (priorityCur === priority) {
          $node = $$1(this);
          return false // break
        } else if (priority > priorityCur) {
          $node = $$1('<li>')
            .addClass('m_groupSummary')
            .data('priority', priority)
            .html('<ul class="group-body"></ul>');
          $$1(this).before($node);
          return false // break
        }
      });
      if (!$node) {
        $node = $$1('<li>')
          .addClass('m_groupSummary')
          .data('priority', priority)
          .html('<ul class="group-body"></ul>');
        $tabPane
          .find('.debug-log-summary')
          .append($node);
      }
      $node = $node.find('> ul');
      nodes.push($node);
    },
    groupEnd: function (logEntry, info) {
      var $tabPane = info.$tabPane;
      var nodes = $tabPane.data('nodes');
      var isSummaryRoot = nodes.length > 1 &&
        info.$node.hasClass('m_groupSummary');
      var $group;
      var $toggle;
      if (nodes.length > 1) {
        nodes.pop();
      }
      if (isSummaryRoot) {
        return
      }
      $toggle = info.$node.prev();
      $group = $toggle.parent();
      if ($group.hasClass('empty') && $group.hasClass('hide-if-empty')) {
        // console.log('remove', $group)
        // $toggle.remove()
        // info.$currentNode.remove()
        $group.remove();
      } else if ($group.hasClass('ungroup')) {
        var $children = $group.find('> ul.group-body > li');
        var $groupLabel = $group.find('> .group-header > .group-label');
        var $li = $$1('<li></li>').data($group.data());
        if ($children.length === 0) {
          $group.replaceWith(
            $li.html($groupLabel.html())
          );
        } else if ($children.length === 1 && $children.filter('.m_group').length === 0) {
          $group.replaceWith($children);
        }
      } else if ($group.hasClass('filter-hidden') === false && $group.is(':visible')) {
        // console.log('enhance')
        $group.debugEnhance();
      }
    },
    groupUncollapse: function (logEntry, info) {
      var $groups = info.$node.parentsUntil('.debug-log-summary, .debug-log').add(info.$node).filter('.m_group');
      $groups.addClass('expanded');
    },
    meta: function (logEntry, info) {
      /*
        Information about request
      */
      var $cardHeaderBody = info.$container.find('.card-header .card-header-body');
      var $title = $cardHeaderBody.find('.card-title');
      var date;
      var isInit = Object.keys(info.$container.data()).length === 0;
      var metaVals = logEntry.args[0];
      var meta = logEntry.meta;
      var title = buildTitle(metaVals);
      var k;
      var classDefinition;
      if (isInit) {
        info.$container.data('classDefinitions', {});
        info.$container.data('meta', $$1.extend({
          debugVersion: meta.debugVersion,
          requestId: meta.requestId,
        }, metaVals));
      }
      if (meta.channelNameRoot) {
        info.$container.find('.debug').data('channelNameRoot', meta.channelNameRoot);
      }
      if (typeof meta.drawer === 'boolean') {
        info.$container.data('options', {
          drawer: meta.drawer
        });
      }
      if (meta.interface) {
        info.$container.find('.card-header').attr('data-interface', meta.interface);
      }
      if (title !== '') {
        $title.html(title);
      }
      if (metaVals.classDefinitions) {
        for (k in metaVals.classDefinitions) {
          classDefinition = metaVals.classDefinitions[k];
          classDefinition.implementsList = buildImplementsList(classDefinition.implements);
          if (k.substr(0, 6) === '_b64_:') {
            k = atob(k.substr(6));
          }
          info.$container.data('classDefinitions')[k] = classDefinition;
        }
      }
      if (metaVals.REQUEST_TIME) {
        date = (new Date(metaVals.REQUEST_TIME * 1000)).toString().replace(/[A-Z]{3}-\d+/, '');
        $cardHeaderBody.prepend('<span class="float-right">' + date + '</span>');
      }
    },
    profileEnd: function (logEntry, info) {
      // var $node = this.table(logEntry, info)
      // return $node.removeClass('m_log').addClass('m_profileEnd')
      return this.table(logEntry, info)
    },
    table: function (logEntry, info) {
      var $table = table.build(
        logEntry.args[0],
        logEntry.meta,
        logEntry.meta.inclContext
          ? tableAddContextRow
          : null
      );
      return $$1('<li>', { class: 'm_' + logEntry.method }).append($table)
    },
    trace: function (logEntry, info) {
      return this.table(logEntry, info)
    },
    default: function (logEntry, info) {
      var attribs = {
        class: 'm_' + logEntry.method
      };
      var $container = info.$container;
      var $node;
      var method = logEntry.method;
      var meta = logEntry.meta;
      if (meta.file && meta.channel !== info.channelNameRoot + '.phpError') {
        attribs = $$1.extend({
          'data-file': meta.file,
          'data-line': meta.line
        }, attribs);
      }
      /*
        update card header to emphasize error
      */
      if (meta.errorCat) {
        // console.warn('errorCat', meta.errorCat)
        attribs.class += ' error-' + meta.errorCat;
        if (!meta.isSuppressed) {
          if (method === 'error') {
            // if suppressed, don't update card
            $container
              .addClass('bg-danger')
              .removeClass('bg-warning'); // could keep it.. but lets remove ambiguity
          } else if (!$container.hasClass('bg-danger')) {
            $container.addClass('bg-warning');
          }
        }
      }
      if (meta.uncollapse !== undefined) {
        attribs['data-uncollapse'] = JSON.stringify(meta.uncollapse);
      }
      if (['assert', 'error', 'info', 'log', 'warn'].indexOf(method) > -1 && logEntry.args.length > 1) {
        /*
          update tab
        */
        if (method === 'error') {
          getTab(info).addClass('has-error');
        } else if (method === 'warn') {
          getTab(info).addClass('has-warn');
        } else if (method === 'assert') {
          getTab(info).addClass('has-assert');
        }
        processSubstitutions(logEntry);
      }
      $node = buildEntryNode(logEntry, info);
      $node.attr(attribs);
      if (meta.trace && meta.trace.length > 1) {
        $node.append(
          $$1('<ul>', { class: 'list-unstyled no-indent' }).append(
            methods.trace({
              method: 'trace',
              args: [meta.trace],
              meta: meta
            }).attr('data-detect-files', 'true')
          )
        );
        $node.find('.m_trace').debugEnhance();
      } else if (meta.context) {
        // console.log('context', meta.context)
        $node.append(
          buildContext(meta.context, meta.line)
        );
      }
      if ($node.is('.error-fatal')) {
        this.endOutput(logEntry, info);
      }
      return $node
    } // end default
  };

  function buildImplementsList(obj) {
    var list = [];
    var key;
    var val;
    for (key in obj) {
      val = obj[key];
      if (typeof val === 'string') {
        list.push(val);
        continue
      }
      list.push(key);
      list = list.concat(buildImplementsList(val));
    }
    return list
  }

  function buildTitle (metaVals) {
    var title = '';
    if (metaVals.HTTPS === 'on') {
      title += '<i class="fa fa-lock fa-lg"></i> ';
    }
    if (metaVals.REQUEST_METHOD) {
      title += metaVals.REQUEST_METHOD + ' ';
    }
    if (metaVals.HTTP_HOST) {
      title += '<span class="http-host">' + metaVals.HTTP_HOST + '</span>';
    }
    if (metaVals.REQUEST_URI) {
      title += '<span class="request-uri">' + metaVals.REQUEST_URI + '</span>';
    }
    return title
  }

  function buildContext (context, lineNumber) {
    var keys = Object.keys(context || {}); // .map(function(val){return parseInt(val)}),
    var start = Math.min.apply(null, keys);
    return $$1('<pre>', {
      class: 'highlight line-numbers',
      'data-line': lineNumber,
      'data-start': start
    }).append(
      $$1('<code>', {
        class: 'language-php'
      }).text(Object.values(context).join(''))
    )
  }

  function tableAddContextRow ($tr, row, rowInfo, i) {
    // var keys = Object.keys(row.context || {}) // .map(function(val){return parseInt(val)}),
    // var start = Math.min.apply(null, keys)
    if (!rowInfo.context) {
      return $tr
    }
    i = parseInt(i, 10);
    $tr.attr('data-toggle', 'next');
    if (i === 0) {
      $tr.addClass('expanded');
    }
    return [
      $tr,
      $$1('<tr>', {
        class: 'context',
        style: i === 0
          ? 'display:table-row;'
          : null
      }).append(
        $$1('<td>', {
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

  function buildEntryNode (logEntry, requestInfo) {
    var i;
    var glue = ', ';
    var glueAfterFirst = true;
    var args = logEntry.args;
    var numArgs = args.length;
    var meta = $$1.extend({
      sanitize: true,
      sanitizeFirst: null
    }, logEntry.meta);
    var typeInfo;
    var typeMore;
    if (meta.sanitizeFirst === null) {
      meta.sanitizeFirst = meta.sanitize;
    }
    if (typeof args[0] === 'string') {
      if (args[0].match(/[=:]\s*$/)) {
        // first arg ends with '=' or ':'
        glueAfterFirst = false;
        args[0] = $$1.trim(args[0]) + ' ';
      } else if (numArgs === 2) {
        glue = ' = ';
      }
    }
    for (i = 0; i < numArgs; i++) {
      typeInfo = dump.getType(args[i]);
      typeMore = typeInfo[1] !== 'abstraction'
        ? typeInfo[1]
        : (args[i].typeMore || null);
      args[i] = dump.dump(args[i], {
        addQuotes: i !== 0 || typeMore === 'numeric',
        requestInfo: requestInfo,
        sanitize: i === 0
          ? meta.sanitizeFirst
          : meta.sanitize,
        type: typeInfo[0],
        typeMore: typeInfo[1] || null,
        visualWhiteSpace: i !== 0
      });
    }
    return glueAfterFirst
      ? $$1('<li>').html(args.join(glue))
      : $$1('<li>').html(args[0] + ' ' + args.slice(1).join(glue))
  }

  function getTab (info) {
    var classname = 'debug-tab-' + info.channelNameTop.toLowerCase().replace(/\W+/g, '-');
    return classname === 'debug-tab-general'
      ? $$1()
      : info.$container.find('.debug-menu-bar .nav-link[data-toggle=tab][data-target=".' + classname + '"]')
  }

  /**
   * Generates groupHeader HTML
   *
   * @return jQuery obj
   */
  function groupHeader (logEntry, requestInfo) {
    var i = 0;
    var $header;
    var argStr = '';
    var argsAsParams = typeof logEntry.meta.argsAsParams !== 'undefined'
      ? logEntry.meta.argsAsParams
      : true;
    var label = logEntry.args.shift();
    label = logEntry.meta.isFuncName
      ? dump.markupIdentifier(label, 'function')
      : dump.dump(label).replace(new RegExp('^<span class="t_string">(.+)</span>$', 's'), '$1');
    for (i = 0; i < logEntry.args.length; i++) {
      logEntry.args[i] = dump.dump(logEntry.args[i], {
        requestInfo: requestInfo,
      });
    }
    argStr = logEntry.args.join(', ');
    if (argsAsParams) {
      argStr = '<span class="group-label">' + label + '(</span>' +
        argStr +
        '<span class="group-label">)</span>';
      argStr = argStr.replace('(</span><span class="group-label">)', '');
    } else {
      argStr = '<span class="group-label">' + label + ':</span> ' +
        argStr;
      argStr = argStr.replace(/:<\/span> $/, '</span>');
    }
    $header = $$1('<div class="group-header">' +
      argStr +
      '</div>');
    if (typeof logEntry.meta.boldLabel === 'undefined' || logEntry.meta.boldLabel) {
      $header.find('.group-label').addClass('font-weight-bold');
    }
    return $header
  }

  /**
   * @param logEntry
   *
   * @return void
   */
  function processSubstitutions (logEntry, opts) {
    var subRegex = '%' +
      '(?:' +
      '[coO]|' + // c: css, o: obj with max info, O: obj w generic info
      '[+-]?' + // sign specifier
      '(?:[ 0]|\'.)?' + // padding specifier
      '-?' + // alignment specifier
      '\\d*' + // width specifier
      '(?:\\.\\d+)?' + // precision specifier
      '[difs]' +
      ')';
    var args = logEntry.args;
    var argLen = args.length;
    var hasSubs = false;
    var index = 0;
    var typeCounts = {
      c: 0
    };
    if (typeof args[0] !== 'string' || argLen < 2) {
      return
    }
    subRegex = new RegExp(subRegex, 'g');
    args[0] = args[0].replace(subRegex, function (match) {
      var replacement = match;
      var type = match.substr(-1);
      index++;
      if (index > argLen - 1) {
        return replacement
      }
      if ('di'.indexOf(type) > -1) {
        replacement = parseInt(args[index], 10);
      } else if (type === 'f') {
        replacement = parseFloat(args[index], 10);
      } else if (type === 's') {
        replacement = substitutionAsString(args[index]);
      } else if (type === 'c') {
        replacement = '';
        if (typeCounts.c) {
          // close prev
          replacement = '</span>';
        }
        replacement += '<span style="' + args[index].escapeHtml() + '">';
      } else if ('oO'.indexOf(type) > -1) {
        replacement = dump.dump(args[index]);
      }
      typeCounts[type] = typeCounts[type]
        ? typeCounts[type] + 1
        : 1;
      delete args[index]; // sets to undefined
      return replacement
    });
    // using reduce to perform an array_sum
    hasSubs = Object.values(typeCounts).reduce(function (acc, val) { return acc + val }, 0) > 0;
    if (hasSubs) {
      if (typeCounts.c) {
        args[0] += '</span>';
      }
      logEntry.args = args.filter(function (val) {
        return val !== undefined
      });
      logEntry.meta.sanitizeFirst = false;
    }
  }

  /**
   * Coerce value to string
   *
   * @param mixed $val value
   *
   * @return string
   */
  function substitutionAsString (val) {
    var type = dump.getType(val);
    if (type[0] === 'string') {
      return dump.stringDumper.dumpAsSubstitution(val)
    }
    if (type[0] === 'array') {
      delete val.__debug_key_order__;
      return '<span class="t_keyword">array</span>' +
        '<span class="t_punct">(</span>' + Object.keys(val).length + '<span class="t_punct">)</span>'
    }
    if (type[0] === 'object') {
      return dump.markupIdentifier(val.className, 'classname')
    }
    return dump.dump(val)
  }

  function processEntry (logEntry) {
    // console.log(JSON.parse(JSON.stringify(logEntry)))
    var meta = logEntry.meta;
    var info = getNodeInfo(meta);
    var channelsTab = info.channels.filter(function (channelInfo) {
      return channelInfo.name === info.channelNameTop || channelInfo.name.indexOf(info.channelNameTop + '.') === 0
    });
    var $node;

    try {
      $node = buildLogEntryNode(logEntry, info);
      updateSidebar(logEntry, info, $node !== false);
      if (!$node) {
        return
      }
      if (meta.attribs && meta.attribs.class && meta.attribs.class === 'php-shutdown') {
        info.$node = info.$container.find('> .debug > .tab-panes > .tab-primary > .tab-body > .debug-log.group-body');
      }
      info.$node.append($node);
      $node.attr('data-channel', meta.channel); // using attr so can use [data-channel="xxx"] selector
      if (meta.attribs && Object.keys(meta.attribs).length) {
        if (meta.attribs.class) {
          $node.addClass(Array.isArray(meta.attribs.class) ? meta.attribs.class.join(' ') : meta.attribs.class);
          delete meta.attribs.class;
        }
        if (meta.attribs.id) {
          meta.attribs.id = buildId(meta);
        }
        $node.attr(meta.attribs);
      }
      if (meta.icon) {
        $node.data('icon', meta.icon);
      }
      if (
        channelsTab.length > 1 &&
        info.channelName !== info.channelNameRoot + '.phpError' &&
        !info.$container.find('.channels input[value="' + info.channelName + '"]').prop('checked')
      ) {
        $node.addClass('filter-hidden');
      }
      if (meta.detectFiles) {
        // using attr so can find via css selector
        $node.attr('data-detect-files', meta.detectFiles);
        $node.attr('data-found-files', meta.foundFiles ? meta.foundFiles : []);
      }
      $node.parent().closest('.m_group.empty').removeClass('empty').trigger('updated.debug.group');
      if ($node.hasClass('filter-hidden') === false && $node.is(':visible')) {
        $node.debugEnhance();
      }
    } catch (err) {
      console.warn('Logger.processEntry error', err);
      console.log('logEntry', logEntry);
    }
  }

  function buildLogEntryNode (logEntry, info) {
    var method = logEntry.method;
    var $node;
    var i;
    if (logEntry.meta.format === 'html') {
      if (typeof logEntry.args === 'object') {
        $node = $$1('<li />', { class: 'm_' + method });
        for (i = 0; i < logEntry.args.length; i++) {
          $node.append(logEntry.args[i]);
        }
        return $node
      }
      $node = $$1(logEntry.args);
      if (!$node.is('.m_' + method)) {
        $node = $$1('<li />', { class: 'm_' + method }).html(logEntry.args);
      }
      return $node
    }
    if (methods[method]) {
      return methods[method](logEntry, info)
    }
    return methods.default(logEntry, info)
  }

  function getNodeInfo (meta) {
    var $container = $$1('#' + meta.requestId);
    var $debug;
    var $node;
    var $tabPane;
    var channelNameRoot = $container.find('.debug').data('channelNameRoot') || meta.channelNameRoot || 'general';
    var channelName = meta.channel || channelNameRoot;
    var channelSplit = channelName.split('.');
    var info = {
      $container: $container,
      $node: null,
      $tabPane: null,
      channelName: channelName,
      channelNameRoot: channelNameRoot,
      channelNameTop: channelSplit.shift(), // ie channelName of tab
      channels: []
    };
    if ($container.length) {
      $tabPane = getTabPane(info, meta);
      $node = $tabPane.data('nodes').slice(-1)[0] || $tabPane.find('> .debug-log');
      if (meta.appendGroup) {
        $node = $tabPane.find('#' + buildId(meta, meta.appendGroup) + ' > .group-body');
      }
    } else {
      // create
      //   header and card are separate so we can sticky the header
      $container = $$1('' +
        '<div class="card mb-3 sticky working" id="' + meta.requestId + '">' +
          '<div class="card-header" data-toggle="collapse" data-target="#' + meta.requestId + ' &gt; .collapse">' +
            '<i class="fa fa-chevron-right"></i>' +
            '<i class="fa fa-times float-right btn-remove-session"></i>' +
            '<div class="card-header-body">' +
              '<h3 class="card-title">Building Request&hellip;</h3>' +
              '<i class="fa fa-spinner fa-pulse fa-lg"></i>' +
            '</div>' +
          '</div>' +
          '<div class="bg-white card-body collapse debug debug-enhanced-ui">' +
            '<header class="debug-bar debug-menu-bar">' +
              '<nav role="tablist">' +
                '<a class="active nav-link" data-target=".' + nameToClassname(channelNameRoot) + '" data-toggle="tab" role="tab"><i class="fa fa-list-ul"></i>Log</a>' +
              '</nav>' +
            '</header>' +
            '<div class="tab-panes">' +
              '<div class="active ' + nameToClassname(channelNameRoot) + ' tab-pane tab-primary" role="tabpanel">' +
                '<div class="sidebar-trigger"></div>' +
                '<div class="tab-body">' +
                  '<ul class="debug-log-summary group-body"></ul>' +
                  '<hr />' +
                  '<ul class="debug-log group-body"></ul>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<i class="fa fa-spinner fa-pulse"></i>' +
          '</div>' +
        '</div>'
      );
      $debug = $container.find('.debug');
      $debug.data('channels', []);
      $debug.data('channelNameRoot', channelNameRoot);
      $debug.debugEnhance('sidebar', 'add');
      $debug.debugEnhance('sidebar', 'close');
      // $debug.find('nav').data('tabPanes', $debug.find('.tab-panes'))
      $debug.find('.debug-sidebar .sidebar-toggle').html('<i class="fa fa-lg fa-filter"></i>');
      $tabPane = $debug.find('.tab-primary');
      $node = $tabPane.find('.debug-log');
      $tabPane.data('nodes', [
        $node
      ]);
      $tabPane.data('options', {
        sidebar: true
      });
      $$1('#debug-cards').append($container);
      $container.trigger('added.debug.card');
    }
    $$1.extend(info, {
      $container: $container,
      $node: $node,
      $tabPane: $tabPane,
      channels: $container.find('.debug').data('channels')
    });
    addChannel(info, meta);
    return info
  }

  function addChannel (info, meta) {
    var $container = info.$container;
    var $channels = $container.find('.channels');
    var channelsChecked = [];
    var channelsTab;
    var $ul;
    if (info.channelName === info.channelNameRoot + '.phpError' || haveChannel(info.channelName, info.channels)) {
      return false
    }
    /*
    console.info('adding channel', {
      name: info.channelName,
      icon: meta.channelIcon,
      show: meta.channelShow
    })
    */
    info.channels.push({
      name: info.channelName,
      icon: meta.channelIcon,
      show: meta.channelShow
    });
    if (info.channelName !== info.channelNameRoot && info.channelName.indexOf(info.channelNameRoot + '.') !== 0) {
      // not main tab
      return true
    }

    /*
      only interested in main tab's channels
    */
    channelsTab = info.channels.filter(function (channel) {
      return channel.name === info.channelNameRoot || channel.name.indexOf(info.channelNameRoot + '.') === 0
    });
    if (channelsTab.length < 2) {
      return true
    }
    /*
      Two or more channels
    */
    if (channelsTab.length === 2) {
      // checkboxes weren't added when there was only one...
      channelsChecked.push(channelsTab[0].name);
    }
    if (meta.channelShow) {
      channelsChecked.push(info.channelName);
    }
    $channels.find('input:checked').each(function () {
      channelsChecked.push($$1(this).val());
    });
    $ul = $$1().debugEnhance('buildChannelList', channelsTab, info.channelNameRoot, channelsChecked);

    $channels.find('> ul').replaceWith($ul);
    $channels.show();
    $container.find('.debug').trigger('channelAdded.debug');
    return true
  }

  function addError (logEntry, info) {
    // console.log('addError', logEntry)
    var $filters = info.$container.find('.debug-sidebar .debug-filters');
    var $ul = $filters.find('.php-errors').show().find('> ul');
    var $input = $ul.find('input[value=' + logEntry.meta.errorCat + ']');
    var $label = $input.closest('label');
    var $badge = $label.find('.badge');
    var order = ['fatal', 'warning', 'deprecated', 'notice', 'strict'];
    var count = 1;
    var i = 0;
    var rows = [];
    if ($input.length) {
      count = $input.data('count') + 1;
      $input.data('count', count);
      $badge.text(count);
    } else {
      $ul.append(
        $$1('<li>'
        ).append(
          $$1('<label>', {
            class: 'toggle active'
          }).append(
            $$1('<input>', {
              type: 'checkbox',
              checked: true,
              'data-toggle': 'error',
              'data-count': 1,
              value: logEntry.meta.errorCat
            })
          ).append(
            logEntry.meta.errorCat + ' <span class="badge">' + 1 + '</span>'
          )
        )
      );
      rows = $ul.find('> li');
      rows.sort(function (liA, liB) {
        var liAindex = order.indexOf($$1(liA).find('input').val());
        var liBindex = order.indexOf($$1(liB).find('input').val());
        return liAindex > liBindex ? 1 : -1
      });
      for (i = 0; i < rows.length; ++i) {
        $ul.append(rows[i]); // append each row in order (which moves)
      }
    }
  }

  function addTab (info, $link) {
    // console.warn('insertTab', $link.text(), $link.data('sort'))
    var $navLinks = info.$container.find('.debug-menu-bar').removeClass('hide').find('.nav-link');
    var length = $navLinks.length;
    var sort = $link.data('sort');
    var text = $link.text().trim();
    $navLinks.each(function (i, node) {
      var $navLink = $$1(this);
      var curSort = $navLink.data('sort');
      var curText = $navLink.text().trim();
      var cmp = (function () {
        if (curSort === undefined || sort < curSort) {
          // place somewhere after cur
          return -1 // continue
        }
        if (sort > curSort) {
          return 1
        }
        return curText.localeCompare(text)
      })();
      if (cmp > 0) {
        $$1(this).before($link);
        return false // break
      }
      if (i + 1 === length) {
        // we're on last tab..  insert now or never
        $$1(this).after($link);
      }
    });
  }

  function getTabPane (info, meta) {
    // console.log('getTabPane', info.channelNameTop, info.$container.data('channelNameRoot'))
    var classname = nameToClassname(info.channelNameTop);
    var $tabPanes = info.$container.find('> .debug > .tab-panes');
    var $tabPane = $tabPanes.find('> .' + classname);
    var $link;
    if ($tabPane.length) {
      return $tabPane
    }
    meta.channelSort = meta.channelSort || 0;
    $link = $$1('<a>', {
      class: 'nav-link',
      'data-sort': meta.channelSort,
      'data-target': '.' + classname,
      'data-toggle': 'tab',
      role: 'tab',
      html: info.channelNameTop
    });
    if (meta.channelIcon) {
      $link.prepend(
        meta.channelIcon.match('<')
          ? $$1(meta.channelIcon)
          : $$1('<i>').addClass(meta.channelIcon)
      );
    }
    addTab(info, $link);
    $tabPane = $$1('<div>', {
      class: 'tab-pane ' + classname,
      role: 'tabpanel'
    })
      .append($$1('<div>', {
        class: 'tab-body',
        html: '<ul class="debug-log-summary group-body"></ul>' +
          '<hr />' +
          '<ul class="debug-log group-body"></ul>'
      }));
    $tabPane.data('nodes', [$tabPane.find('.debug-log')]);
    $tabPanes.append($tabPane);
    return $tabPane
  }

  function updateSidebar (logEntry, info, haveNode) {
    var filterVal = null;
    var method = logEntry.method;
    var $filters = info.$container.find('.debug-sidebar .debug-filters');

    if (['groupSummary', 'groupEnd'].indexOf(method) > -1) {
      return
    }
    /*
      Update error filters
    */
    if (['error', 'warn'].indexOf(method) > -1 && logEntry.meta.channel === info.channelNameRoot + '.phpError') {
      addError(logEntry, info);
      return
    }
    /*
      Update method filter
    */
    if (['alert', 'error', 'warn', 'info'].indexOf(method) > -1) {
      filterVal = method;
    } else if (method === 'group' && logEntry.meta.level) {
      filterVal = logEntry.meta.level;
    } else if (haveNode) {
      filterVal = 'other';
    }
    if (filterVal) {
      $filters.find('input[data-toggle=method][value=' + filterVal + ']')
        .closest('label')
        .removeClass('disabled');
    }
    /*
      Show "Expand All Groups" button
    */
    if (method === 'group' && info.$tabPane.find('.m_group').length > 2) {
      info.$container.find('.debug-sidebar .expand-all').show();
    }
  }

  function nameToClassname (name) {
    return 'debug-tab-' + name.toLowerCase().replace(/\W+/g, '-')
  }

  function haveChannel (channelName, channels) {
    // channels.indexOf(channelName) > -1
    var i;
    var len = channels.length;
    var channel;
    for (i = 0; i < len; i++) {
      channel = channels[i];
      if (channel.name === channelName) {
        return true
      }
    }
    return false
  }

  function buildId (meta, id) {
    id = id || meta.attribs.id;
    id = id.replace(/\W+/g, '-');
    if (id.indexOf(meta.requestId) !== 0) {
      id = meta.requestId + '_' + id;
    }
    return id
  }

  function Xdebug(pubSub) {
  	var self = this;
    var $root = $$1('#debug-cards');
  	this.pubSub = pubSub;
    this.contextMsgReceived = null;
    this.contextTimer = null;
  	$root.on('click', '.xdebug-commands .btn[data-cmd]', function () {
  		var cmd = $$1(this).data('cmd');
      var appId = $$1(this).closest('.card-body').find('.xdebug').data('appId');
      $$1(this).blur();
      self.sendCmd(appId, cmd);
  	});
    $root.on('click', '.xdebug-menu-bar .btn[data-target]', function () {
      var $node = $$1(this).closest('.card-body').find($$1(this).data('target'));
      $$1(this).blur();
      self.scrollIntoView($node);
    });
    $root.on('expanded.debug.array expanded.debug.object', '.max-depth', function (e) {
      var appId = $$1(this).closest('.card-body').find('.xdebug').data('appId');
      // console.log('xdebug expanded .max-depth', this)
      $$1(this).find('.array-inner, .object-inner').html(
        '<i class="fa fa-spinner fa-pulse fa-lg"></i>'
      );
      self.sendCmd(
        appId,
        'property_get',
        {
          n: $$1(this).data('fullname')
        }
      );
    });
    $root.on('shown.bs.collapse', '.card-body', function (e) {
      var $menuBar = $$1(this).find('.xdebug-menu-bar');
      self.positionToolbar($menuBar);
    });
    $root.on('endOutput', '.card', function (e) {
      self.remove(this);
    });
  }

  Xdebug.prototype.sendCmd = function (appId, cmd, args, data) {
      this.pubSub.publish(
        'wamp',
        'publish',
        'bdk.debug.xdebug',
        [appId, cmd, args, data]
      );
  };

  Xdebug.prototype.positionToolbar = function($menuBar) {
    var $card = $menuBar.closest('.card');
    $menuBar.css('top',
      (
        $$1('nav.navbar').outerHeight() +
        $card.find('> .card-header').outerHeight() +
        $card.find('> .card-body > .debug-menu-bar').outerHeight()
      ) + 'px'
    );
  };

  Xdebug.prototype.processEntry = function (logEntry) {
    var method = logEntry.method;
    var meta = logEntry.meta;
    var nodeInfo = this.getNodeInfo(meta.appId);
    var $node;
    var $node2;
    var self = this;
    // console.log('Xdebug.processEntry', JSON.parse(JSON.stringify(logEntry)))
    try {
      if (meta.status === 'break') {
        // console.info('received break')
        this.contextMsgReceived = null;
        this.contextTimer = setTimeout(function () {
          if (self.contextMsgReceived === null) {
            // console.warn('received break status, but no context')
            // get globals
            self.sendCmd(
              meta.appId,
              'context_get',
              { c: 1 }
            );
            // get local
            self.sendCmd(
              meta.appId,
              'context_get',
              { c: 0 }
            );
          }
        }, 250);
      } else if (meta.command === 'context_get') {
        this.contextMsgReceived = logEntry;
        clearTimeout(self.contextTimer);
      }
      if (method === 'xdebug') {
        // if (meta.status === 'stopping') {
        // }
        if (['property_get', 'property_value'].indexOf(meta.command) > -1) {
          $node = methods.default(logEntry, nodeInfo).find('> *'); // array = span, object = div
          // find  open .max-depth where data-fullname = meta.fullname
          $node2 = nodeInfo.$node.find('.max-depth.expanded').filter(function (i, nodeTemp) {
            return $$1(nodeTemp).data('fullname') === meta.fullname
          });
          $node2.replaceWith($node);
          $node.debugEnhance().debugEnhance('expand');
        }
        return
      }
      $node = methods[method]
        ? methods[method](logEntry, nodeInfo)
        : methods.default(logEntry, nodeInfo);
      if (!$node) {
        return
      }
      if (meta.status === 'break') {
        nodeInfo.$node.html('<li class="m_info" style="display:block; margin: 8px -10px; border-bottom: solid 1px; font-weight:bold;">Xdebug</li>');
        self.scrollIntoView(nodeInfo.$node);
      }
      if (meta.detectFiles) {
        // using attr so can find via css selector
        $node.attr('data-detect-files', meta.detectFiles);
        $node.attr('data-found-files', meta.foundFiles ? meta.foundFiles : []);
      }
      nodeInfo.$node.append($node);
      $node.debugEnhance();
    } catch (err) {
      console.warn('Xdebug.processEntry error', err, logEntry);
    }
  };

  Xdebug.prototype.getNodeInfo = function (appId) {
    var id = 'xdebug';
    // var $container = $('#' + id)
    var $container = $$1('#debug-cards .card.working').filter(function () {
      var dataCard = $$1(this).data() || {};
      var dataXdebug = $$1(this).find('.xdebug').data() || {};
      if (dataXdebug.appId === appId) {
        // xdebug appId match
        return true
      }
      if (dataCard.meta.processId == appId) {
        // card processId match
        return true
      }
      return false
    }).last();
    var info = {};
    var channelNameRoot = 'general';
    var $xdebug;
    var $menuBar;
    /*
      Step 1: find or create primary container (card)
    */
    if ($container.length === 0) {
      $container = $$1('' +
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
              '<div class="active ' + nameToClassname$1(channelNameRoot) + ' tab-pane tab-primary" role="tabpanel">' +
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
      );
  	  $$1('#debug-cards').append($container);
    }
    /*
      Step 2: find or create xdebug area
    */
    $xdebug = $container.find('.xdebug');
    if ($xdebug.length === 0) {
      $menuBar = $$1('' +
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
      );
      $xdebug = $$1('<ul class="xdebug group-body"></ul>');
      $xdebug.data('appId', appId);
      $container.find('.debug > header').after($menuBar);
      $container.find('.tab-primary .tab-body').append($xdebug);
      this.positionToolbar($menuBar);
    }

    info = {
      $container: $container,
      $node: $xdebug,
      $toolbar: $container.find('.xdebug-menu-bar')
    };
    return info
  };

  Xdebug.prototype.remove = function ($container) {
    $container = $$1($container);
    $container.find('.xdebug-menu-bar').remove();
    $container.find('.xdebug.group-body').remove();
  };

  Xdebug.prototype.scrollIntoView = function (node) {
    var toolbarBottom = $$1(node).closest('.card-body').find('.xdebug-menu-bar')[0].getBoundingClientRect().bottom;
    var nodePos;
    var adjustY;
    node = $$1(node)[0];
    nodePos = node.getBoundingClientRect();
    adjustY = nodePos.top - toolbarBottom;
    /*
    console.warn('scrollIntoView', {
      toolbarBottom: toolbarBottom,
      nodePosTop: nodePos.top,
      adjustY: adjustY
    })
    */
    window.scrollBy(0, adjustY);
  };

  function nameToClassname$1 (name) {
    return 'debug-tab-' + name.toLowerCase().replace(/\W+/g, '-')
  }

  /**
   * Merge defaults with user options
   *
   * @param {Object} defaults Default settings
   * @param {Object} options User options
   * @returns {Object} Merged values of defaults and options
   */
  function extend (defaults, options) {
    var extended = {};
    var i;
    var length;
    var prop;
    for (i = 0, length = arguments.length; i < length; i++) {
      for (prop in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], prop)) {
          extended[prop] = arguments[i][prop];
        }
      }
    }
    return extended
  }

  var phpDebugConsoleKeys = ['linkFiles', 'linkFilesTemplate'];

  function Config (defaults, localStorageKey) {
    var storedConfig = getLocalStorageItem(localStorageKey);
    this.defaults = defaults;
    this.config = extend({}, defaults, storedConfig || {});
    this.localStorageKey = localStorageKey;
    this.haveSavedConfig = typeof storedConfig === 'object';
  }

  Config.prototype.get = function (key) {
    if (typeof key === 'undefined') {
      return JSON.parse(JSON.stringify(this.config))
    }
    return typeof this.config[key] !== 'undefined'
      ? this.config[key]
      : null
  };

  /*
  Config.prototype.isDefault = function (key)
  {
    return this.config[key] === this.defaults[key]
  }
  */

  Config.prototype.set = function (key, val) {
    var configWas = JSON.parse(JSON.stringify(this.config));
    var k;
    var setVals = {};
    if (typeof key === 'object') {
      setVals = key;
    } else {
      setVals[key] = val;
    }

    for (k in setVals) {
      this.config[k] = setVals[k];
    }

    if (this.config.url !== configWas.url || this.config.realm !== configWas.realm) {
      // connection options changed
      PubSub.publish('onmessage', 'connectionClose');
      PubSub.publish('onmessage', 'connectionOpen');
    }

    this.checkPhpDebugConsole(setVals);
    setVals = {};
    for (k in this.config) {
      if (this.config[k] !== this.defaults[k]) {
        setVals[k] = this.config[k];
      }
    }
    setLocalStorageItem(this.localStorageKey, setVals);
    this.haveSavedConfig = true;
  };

  Config.prototype.setDefault = function (key, val) {
    var setVals = {};
    var storedConfig = getLocalStorageItem(this.localStorageKey) || {};
    var k;
    if (typeof key === 'object') {
      setVals = key;
    } else {
      setVals[key] = val;
    }
    for (k in setVals) {
      this.defaults[k] = setVals[k];
    }
    this.config = extend({}, this.defaults, storedConfig || {});
    this.checkPhpDebugConsole(this.config);
  };

  /**
   * publish phpDebugConsoleConfig if obj contains phpDebugConsole settings
   *
   * @param object vals config values
   *
   * @return void
   */
  Config.prototype.checkPhpDebugConsole = function (vals) {
    // console.log('checkPhpDebugConsole', vals)
    var count;
    var i;
    var key;
    var dbVals = {};
    var haveDbVal = false;
    if (vals === undefined) {
      vals = this.config;
    }
    for (i = 0, count = phpDebugConsoleKeys.length; i < count; i++) {
      key = phpDebugConsoleKeys[i];
      // console.log('key', key)
      if (typeof vals[key] !== 'undefined') {
        dbVals[key] = vals[key];
        haveDbVal = true;
      }
    }
    if (haveDbVal) {
      PubSub.publish('phpDebugConsoleConfig', {
        linkFiles: this.config.linkFiles,
        linkFilesTemplate: this.config.linkFilesTemplate
      });
    }
  };

  function setLocalStorageItem (key, val) {
    if (val === null) {
      localStorage.removeItem(key);
      return
    }
    if (typeof val !== 'string') {
      val = JSON.stringify(val);
    }
    localStorage.setItem(key, val);
  }

  function getLocalStorageItem (key) {
    var val = localStorage.getItem(key);
    if (typeof val !== 'string' || val.length < 1) {
      return null
    } else {
      try {
        return JSON.parse(val)
      } catch (e) {
        return val
      }
    }
  }

  /*

  Queue.js

  A function to represent a queue

  Created by Stephen Morley - http://code.stephenmorley.org/ - and released under
  the terms of the CC0 1.0 Universal legal code:

  http://creativecommons.org/publicdomain/zero/1.0/legalcode

  */

  /* Creates a new queue. A queue is a first-in-first-out (FIFO) data structure -
   * items are added to the end of the queue and removed from the front.
   */
  function Queue () {
    // initialise the queue and offset
    var queue = [];
    var offset = 0;

    // Returns the length of the queue.
    this.getLength = function () {
      return (queue.length - offset)
    };

    // Returns true if the queue is empty, and false otherwise.
    this.isEmpty = function () {
      return queue.length === 0
    };

    /**
     * Returns the item at the front of the queue (without dequeuing it). If the
     * queue is empty then undefined is returned.
     */
    this.peek = function () {
      return (queue.length > 0 ? queue[offset] : undefined)
    };

    /**
     * Enqueues the specified item. The parameter is:
     *
     * item - the item to enqueue
     */
    this.push = function (item) {
      queue.push(item);
    };

    /**
     * Dequeues an item and returns it. If the queue is empty, the value
     * 'undefined' is returned.
     */
    this.shift = function () {
      // if the queue is empty, return immediately
      if (queue.length === 0) {
        return undefined
      }

      // store the item at the front of the queue
      var item = queue[offset];

      // increment the offset and remove the free space if necessary
      if (++offset * 2 >= queue.length) {
        queue = queue.slice(offset);
        offset = 0;
      }

      // return the dequeued item
      return item
    };
  }

  var autobahn_min = createCommonjsModule(function (module, exports) {
  /*

   Counter block mode compatible with  Dr Brian Gladman fileenc.c
   derived from CryptoJS.mode.CTR
   Jan Hruby jhruby.web@gmail.com

   (c) 2012 by C?dric Mesnil. All rights reserved.

   Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

       - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
       - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   The buffer module from node.js, for the browser.

   @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
   @license  MIT
   The buffer module from node.js, for the browser.

   @author   Feross Aboukhadijeh <https://feross.org>
   @license  MIT
   Determine if an object is a Buffer

   @author   Feross Aboukhadijeh <https://feross.org>
   @license  MIT
   MIT License (c) copyright 2013-2014 original author or authors  MIT License (c) copyright 2010-2014 original author or authors */
  var $jscomp=$jscomp||{};$jscomp.scope={};$jscomp.arrayIteratorImpl=function(e){var n=0;return function(){return n<e.length?{done:!1,value:e[n++]}:{done:!0}}};$jscomp.arrayIterator=function(e){return {next:$jscomp.arrayIteratorImpl(e)}};$jscomp.ASSUME_ES5=!1;$jscomp.ASSUME_NO_NATIVE_MAP=!1;$jscomp.ASSUME_NO_NATIVE_SET=!1;$jscomp.defineProperty=$jscomp.ASSUME_ES5||"function"==typeof Object.defineProperties?Object.defineProperty:function(e,n,k){e!=Array.prototype&&e!=Object.prototype&&(e[n]=k.value);};
  $jscomp.getGlobal=function(e){return "undefined"!=typeof window&&window===e?e:"undefined"!=typeof commonjsGlobal&&null!=commonjsGlobal?commonjsGlobal:e};$jscomp.global=$jscomp.getGlobal(commonjsGlobal);$jscomp.SYMBOL_PREFIX="jscomp_symbol_";$jscomp.initSymbol=function(){$jscomp.initSymbol=function(){};$jscomp.global.Symbol||($jscomp.global.Symbol=$jscomp.Symbol);};$jscomp.Symbol=function(){var e=0;return function(n){return $jscomp.SYMBOL_PREFIX+(n||"")+e++}}();
  $jscomp.initSymbolIterator=function(){$jscomp.initSymbol();var e=$jscomp.global.Symbol.iterator;e||(e=$jscomp.global.Symbol.iterator=$jscomp.global.Symbol("iterator"));"function"!=typeof Array.prototype[e]&&$jscomp.defineProperty(Array.prototype,e,{configurable:!0,writable:!0,value:function(){return $jscomp.iteratorPrototype($jscomp.arrayIteratorImpl(this))}});$jscomp.initSymbolIterator=function(){};};
  $jscomp.initSymbolAsyncIterator=function(){$jscomp.initSymbol();var e=$jscomp.global.Symbol.asyncIterator;e||(e=$jscomp.global.Symbol.asyncIterator=$jscomp.global.Symbol("asyncIterator"));$jscomp.initSymbolAsyncIterator=function(){};};$jscomp.iteratorPrototype=function(e){$jscomp.initSymbolIterator();e={next:e};e[$jscomp.global.Symbol.iterator]=function(){return this};return e};
  $jscomp.makeIterator=function(e){var n="undefined"!=typeof Symbol&&Symbol.iterator&&e[Symbol.iterator];return n?n.call(e):$jscomp.arrayIterator(e)};$jscomp.polyfill=function(e,n,k,b){if(n){k=$jscomp.global;e=e.split(".");for(b=0;b<e.length-1;b++){var a=e[b];a in k||(k[a]={});k=k[a];}e=e[e.length-1];b=k[e];n=n(b);n!=b&&null!=n&&$jscomp.defineProperty(k,e,{configurable:!0,writable:!0,value:n});}};$jscomp.FORCE_POLYFILL_PROMISE=!1;
  $jscomp.polyfill("Promise",function(e){function n(){this.batch_=null;}function k(c){return c instanceof a?c:new a(function(a,d){a(c);})}if(e&&!$jscomp.FORCE_POLYFILL_PROMISE)return e;n.prototype.asyncExecute=function(a){null==this.batch_&&(this.batch_=[],this.asyncExecuteBatch_());this.batch_.push(a);return this};n.prototype.asyncExecuteBatch_=function(){var a=this;this.asyncExecuteFunction(function(){a.executeBatch_();});};var b=$jscomp.global.setTimeout;n.prototype.asyncExecuteFunction=function(a){b(a,
  0);};n.prototype.executeBatch_=function(){for(;this.batch_&&this.batch_.length;){var a=this.batch_;this.batch_=[];for(var b=0;b<a.length;++b){var d=a[b];a[b]=null;try{d();}catch(v){this.asyncThrow_(v);}}}this.batch_=null;};n.prototype.asyncThrow_=function(a){this.asyncExecuteFunction(function(){throw a;});};var a=function(a){this.state_=0;this.result_=void 0;this.onSettledCallbacks_=[];var c=this.createResolveAndReject_();try{a(c.resolve,c.reject);}catch(d){c.reject(d);}};a.prototype.createResolveAndReject_=
  function(){function a(a){return function(c){d||(d=!0,a.call(b,c));}}var b=this,d=!1;return {resolve:a(this.resolveTo_),reject:a(this.reject_)}};a.prototype.resolveTo_=function(c){if(c===this)this.reject_(new TypeError("A Promise cannot resolve to itself"));else if(c instanceof a)this.settleSameAsPromise_(c);else {a:switch(typeof c){case "object":var b=null!=c;break a;case "function":b=!0;break a;default:b=!1;}b?this.resolveToNonPromiseObj_(c):this.fulfill_(c);}};a.prototype.resolveToNonPromiseObj_=function(a){var c=
  void 0;try{c=a.then;}catch(d){this.reject_(d);return}"function"==typeof c?this.settleSameAsThenable_(c,a):this.fulfill_(a);};a.prototype.reject_=function(a){this.settle_(2,a);};a.prototype.fulfill_=function(a){this.settle_(1,a);};a.prototype.settle_=function(a,b){if(0!=this.state_)throw Error("Cannot settle("+a+", "+b+"): Promise already settled in state"+this.state_);this.state_=a;this.result_=b;this.executeOnSettledCallbacks_();};a.prototype.executeOnSettledCallbacks_=function(){if(null!=this.onSettledCallbacks_){for(var a=
  0;a<this.onSettledCallbacks_.length;++a)h.asyncExecute(this.onSettledCallbacks_[a]);this.onSettledCallbacks_=null;}};var h=new n;a.prototype.settleSameAsPromise_=function(a){var c=this.createResolveAndReject_();a.callWhenSettled_(c.resolve,c.reject);};a.prototype.settleSameAsThenable_=function(a,b){var c=this.createResolveAndReject_();try{a.call(b,c.resolve,c.reject);}catch(v){c.reject(v);}};a.prototype.then=function(c,b){function d(a,c){return "function"==typeof a?function(c){try{f(a(c));}catch(y){h(y);}}:
  c}var f,h,w=new a(function(a,c){f=a;h=c;});this.callWhenSettled_(d(c,f),d(b,h));return w};a.prototype.catch=function(a){return this.then(void 0,a)};a.prototype.callWhenSettled_=function(a,b){function c(){switch(f.state_){case 1:a(f.result_);break;case 2:b(f.result_);break;default:throw Error("Unexpected state: "+f.state_);}}var f=this;null==this.onSettledCallbacks_?h.asyncExecute(c):this.onSettledCallbacks_.push(c);};a.resolve=k;a.reject=function(c){return new a(function(a,b){b(c);})};a.race=function(c){return new a(function(a,
  b){for(var d=$jscomp.makeIterator(c),f=d.next();!f.done;f=d.next())k(f.value).callWhenSettled_(a,b);})};a.all=function(c){var b=$jscomp.makeIterator(c),d=b.next();return d.done?k([]):new a(function(a,c){function f(c){return function(b){l[c]=b;r--;0==r&&a(l);}}var l=[],r=0;do l.push(void 0),r++,k(d.value).callWhenSettled_(f(l.length-1),c),d=b.next();while(!d.done)})};return a},"es6","es3");
  $jscomp.iteratorFromArray=function(e,n){$jscomp.initSymbolIterator();e instanceof String&&(e+="");var k=0,b={next:function(){if(k<e.length){var a=k++;return {value:n(a,e[a]),done:!1}}b.next=function(){return {done:!0,value:void 0}};return b.next()}};b[Symbol.iterator]=function(){return b};return b};$jscomp.polyfill("Array.prototype.keys",function(e){return e?e:function(){return $jscomp.iteratorFromArray(this,function(e){return e})}},"es6","es3");
  $jscomp.polyfill("Number.isFinite",function(e){return e?e:function(e){return "number"!==typeof e?!1:!isNaN(e)&&Infinity!==e&&-Infinity!==e}},"es6","es3");$jscomp.polyfill("Number.isInteger",function(e){return e?e:function(e){return Number.isFinite(e)?e===Math.floor(e):!1}},"es6","es3");
  $jscomp.checkStringArgs=function(e,n,k){if(null==e)throw new TypeError("The 'this' value for String.prototype."+k+" must not be null or undefined");if(n instanceof RegExp)throw new TypeError("First argument to String.prototype."+k+" must not be a regular expression");return e+""};
  $jscomp.polyfill("String.prototype.startsWith",function(e){return e?e:function(e,k){var b=$jscomp.checkStringArgs(this,e,"startsWith");e+="";var a=b.length,h=e.length;k=Math.max(0,Math.min(k|0,b.length));for(var c=0;c<h&&k<a;)if(b[k++]!=e[c++])return !1;return c>=h}},"es6","es3");
  $jscomp.polyfill("Array.prototype.fill",function(e){return e?e:function(e,k,b){var a=this.length||0;0>k&&(k=Math.max(0,a+k));if(null==b||b>a)b=a;b=Number(b);0>b&&(b=Math.max(0,a+b));for(k=Number(k||0);k<b;k++)this[k]=e;return this}},"es6","es3");$jscomp.polyfill("Object.getOwnPropertySymbols",function(e){return e?e:function(){return []}},"es6","es5");
  $jscomp.polyfill("Reflect.ownKeys",function(e){return e?e:function(e){var k=[],b=Object.getOwnPropertyNames(e);e=Object.getOwnPropertySymbols(e);for(var a=0;a<b.length;a++)("jscomp_symbol_"==b[a].substring(0,14)?e:k).push(b[a]);return k.concat(e)}},"es6","es5");
  (function(e){module.exports=e();})(function(){return function(){function e(n,k,b){function a(c,d){if(!k[c]){if(!n[c]){var f="function"==typeof commonjsRequire&&commonjsRequire;if(!d&&f)return f(c,!0);if(h)return h(c,!0);d=Error("Cannot find module '"+c+"'");throw d.code="MODULE_NOT_FOUND",
  d;}d=k[c]={exports:{}};n[c][0].call(d.exports,function(b){return a(n[c][1][b]||b)},d,d.exports,e,n,k,b);}return k[c].exports}for(var h="function"==typeof commonjsRequire&&commonjsRequire,c=0;c<b.length;c++)a(b[c]);return a}return e}()({1:[function(e,n,k){var b=e("crypto-js");k.sign=function(a,h){return b.HmacSHA256(h,a).toString(b.enc.Base64)};k.derive_key=function(a,h,c,f){return b.PBKDF2(a,h,{keySize:(f||32)/4,iterations:c||1E3,hasher:b.algo.SHA256}).toString(b.enc.Base64)};},{"crypto-js":40}],2:[function(e,n,k){function b(a,
  b){b=c.htob(b.challenge);a=h.sign.detached(b,a.secretKey);return c.btoh(a)+c.btoh(b)}function a(a){return c.btoh(a.publicKey)}var h=e("tweetnacl"),c=e("../util.js"),f=e("../log.js"),d=e("../connection.js");k.load_private_key=function(a,b){var d=c.atob(localStorage.getItem(a));!d||b?(d=h.randomBytes(h.sign.seedLength),localStorage.setItem(a,c.btoa(d)),f.debug('new key seed "'+a+'" saved to local storage!')):f.debug('key seed "'+a+'" loaded from local storage!');return h.sign.keyPair.fromSeed(d)};k.delete_private_key=
  function(a){for(var b=0;5>b;++b)seed=h.randomBytes(h.sign.seedLength),localStorage.setItem(a,c.btoa(seed)),localStorage.setItem(a,""),localStorage.setItem(a,null);};k.sign_challenge=b;k.public_key=a;k.create_connection=function(c){var f=c.url,h=c.realm,l=c.authid,r=c.pkey,x=c.activation_code,v=c.request_new_activation_code,m=c.serializers;c.debug&&(console.log(f),console.log(h),console.log(l),console.log(r),console.log(x),console.log(v),console.log(m));authextra={pubkey:a(r),trustroot:null,challenge:null,
  channel_binding:null,activation_code:x,request_new_activation_code:v};return new d.Connection({url:f,realm:h,authid:l,authmethods:["cryptosign"],onchallenge:function(a,c,d){if("cryptosign"==c)return b(r,d);throw "don't know how to authenticate using '"+c+"'";},authextra:authextra,serializers:c.serializers})};},{"../connection.js":6,"../log.js":7,"../util.js":21,tweetnacl:89}],3:[function(e,n,k){e("when");e("when/function");k.auth=function(b,a,h){var c=b.defer();navigator.id.watch({loggedInUser:a,onlogin:function(a){c.resolve(a);},
  onlogout:function(){b.leave("wamp.close.logout");}});return c.promise.then?c.promise:c};},{when:117,"when/function":93}],4:[function(e,n,k){var b="undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{};e("./polyfill.js");n=e("../package.json");var a=e("when"),h=e("msgpack5"),c=e("cbor"),f=e("tweetnacl");"AUTOBAHN_DEBUG"in b&&AUTOBAHN_DEBUG&&(e("when/monitor/console"),"console"in b&&console.log("AutobahnJS debug enabled"));b=e("./util.js");var d=e("./log.js"),
  v=e("./session.js"),u=e("./connection.js"),w=e("./configure.js"),l=e("./serializer.js"),r=e("./auth/persona.js"),x=e("./auth/cra.js");e=e("./auth/cryptosign.js");k.version=n.version;k.transports=w.transports;k.Connection=u.Connection;k.Session=v.Session;k.Invocation=v.Invocation;k.Event=v.Event;k.Result=v.Result;k.Error=v.Error;k.Subscription=v.Subscription;k.Registration=v.Registration;k.Publication=v.Publication;k.serializer=l;k.auth_persona=r.auth;k.auth_cra=x;k.auth_cryptosign=e;k.when=a;k.msgpack=
  h;k.cbor=c;k.nacl=f;k.util=b;k.log=d;},{"../package.json":118,"./auth/cra.js":1,"./auth/cryptosign.js":2,"./auth/persona.js":3,"./configure.js":5,"./connection.js":6,"./log.js":7,"./polyfill.js":8,"./serializer.js":16,"./session.js":17,"./util.js":21,cbor:28,msgpack5:71,tweetnacl:89,when:117,"when/monitor/console":115}],5:[function(e,n,k){function b(){this._repository={};}b.prototype.register=function(a,c){this._repository[a]=c;};b.prototype.isRegistered=function(a){return this._repository[a]?!0:!1};
  b.prototype.get=function(a){if(void 0!==this._repository[a])return this._repository[a];throw "no such transport: "+a;};b.prototype.list=function(){var a=[],c;for(c in this._repository)a.push(c);return a};n=new b;var a=e("./transport/websocket.js");n.register("websocket",a.Factory);a=e("./transport/longpoll.js");n.register("longpoll",a.Factory);e=e("./transport/rawsocket.js");n.register("rawsocket",e.Factory);k.transports=n;},{"./transport/longpoll.js":18,"./transport/rawsocket.js":19,"./transport/websocket.js":20}],
  6:[function(e,n,k){(function(b){var a=e("when"),h=e("./session.js"),c=e("./util.js"),f=e("./log.js"),d=e("./autobahn.js"),v=function(c){(this._options=c)&&c.use_es6_promises?"Promise"in b?this._defer=function(){var a={};a.promise=new Promise(function(c,b){a.resolve=c;a.reject=b;});return a}:(f.debug("Warning: ES6 promises requested, but not found! Falling back to whenjs."),this._defer=a.defer):this._defer=c&&c.use_deferred?c.use_deferred:a.defer;this._options.transports||(this._options.transports=
  [{type:"websocket",url:this._options.url,tlsConfiguration:this._options.tlsConfiguration}]);this._transport_factories=[];this._init_transport_factories();this._session_close_message=this._session_close_reason=this._session=null;this._retry_if_unreachable=void 0!==this._options.retry_if_unreachable?this._options.retry_if_unreachable:!0;this._max_retries="undefined"!==typeof this._options.max_retries?this._options.max_retries:15;this._initial_retry_delay=this._options.initial_retry_delay||1.5;this._max_retry_delay=
  this._options.max_retry_delay||300;this._retry_delay_growth=this._options.retry_delay_growth||1.5;this._retry_delay_jitter=this._options.retry_delay_jitter||.1;this._connect_successes=0;this._retry=!1;this._retry_count=0;this._retry_delay=this._initial_retry_delay;this._is_retrying=!1;this._retry_timer=null;};v.prototype._create_transport=function(){for(var a=0;a<this._transport_factories.length;++a){var b=this._transport_factories[a];f.debug("trying to create WAMP transport of type: "+b.type);try{var d=
  b.create();if(d)return f.debug("using WAMP transport type: "+b.type),d}catch(r){c.handle_error(this._options.on_internal_error,r,"could not create WAMP transport '"+b.type+"': ");}}f.warn("could not create any WAMP transport");return null};v.prototype._init_transport_factories=function(){var a;c.assert(this._options.transports,"No transport.factory specified");for(var b=0;b<this._options.transports.length;++b){var l=this._options.transports[b];l.url||(l.url=this._options.url);l.serializers||(l.serializers=
  this._options.serializers);l.protocols||(l.protocols=this._options.protocols);c.assert(l.type,"No transport.type specified");c.assert("string"===typeof l.type,"transport.type must be a string");try{if(a=d.transports.get(l.type)){var f=new a(l);this._transport_factories.push(f);}}catch(x){c.handle_error(this._options.on_internal_error,x);}}};v.prototype._autoreconnect_reset_timer=function(){this._retry_timer&&clearTimeout(this._retry_timer);this._retry_timer=null;};v.prototype._autoreconnect_reset=function(){this._autoreconnect_reset_timer();
  this._retry_count=0;this._retry_delay=this._initial_retry_delay;this._is_retrying=!1;};v.prototype._autoreconnect_advance=function(){this._retry_delay_jitter&&(this._retry_delay=c.rand_normal(this._retry_delay,this._retry_delay*this._retry_delay_jitter));this._retry_delay>this._max_retry_delay&&(this._retry_delay=this._max_retry_delay);this._retry_count+=1;var a=this._retry&&(-1===this._max_retries||this._retry_count<=this._max_retries)?{count:this._retry_count,delay:this._retry_delay,will_retry:!0}:
  {count:null,delay:null,will_retry:!1};this._retry_delay_growth&&(this._retry_delay*=this._retry_delay_growth);return a};v.prototype.open=function(){function a(){try{b._transport=b._create_transport();}catch(l){c.handle_error(b._options.on_internal_error,l);}if(b._transport)b._session=new h.Session(b._transport,b._defer,b._options.onchallenge,b._options.on_user_error,b._options.on_internal_error),b._session_close_reason=null,b._session_close_message=null,b._transport.onopen=function(){b._autoreconnect_reset();
  b._connect_successes+=1;b._session.join(b._options.realm,b._options.authmethods,b._options.authid,b._options.authextra);},b._session.onjoin=function(a){if(b.onopen)try{a.transport=b._transport.info,b.onopen(b._session,a);}catch(r){c.handle_error(b._options.on_user_error,r,"Exception raised from app code while firing Connection.onopen()");}},b._session.onleave=function(a,c){b._session_close_reason=a;b._session_close_message=c.message||"";b._retry=!1;b._transport.close();},b._transport.onclose=function(d){b._autoreconnect_reset_timer();
  b._transport=null;0===b._connect_successes?(d="unreachable",b._retry_if_unreachable||(b._retry=!1)):d=d.wasClean?"closed":"lost";var l=b._autoreconnect_advance();if(b.onclose){var h={reason:b._session_close_reason,message:b._session_close_message,retry_delay:l.delay,retry_count:l.count,will_retry:l.will_retry};try{var u=b.onclose(d,h);}catch(m){c.handle_error(b._options.on_user_error,m,"Exception raised from app code while firing Connection.onclose()");}}b._session&&(b._session._id=null,b._session=
  null,b._session_close_reason=null,b._session_close_message=null);b._retry&&!u&&(l.will_retry?(b._is_retrying=!0,f.debug("retrying in "+l.delay+" s"),b._retry_timer=setTimeout(a,1E3*l.delay)):f.debug("giving up trying to reconnect"));};else if(b._retry=!1,b.onclose)b.onclose("unsupported",{reason:null,message:null,retry_delay:null,retry_count:null,will_retry:!1});}var b=this;if(b._transport)throw "connection already open (or opening)";b._autoreconnect_reset();b._retry=!0;a();};v.prototype.close=function(a,
  b){if(!this._transport&&!this._is_retrying)throw "connection already closed";this._retry=!1;this._session&&this._session.isOpen?this._session.leave(a,b):this._transport&&this._transport.close();};Object.defineProperty(v.prototype,"defer",{get:function(){return this._defer}});Object.defineProperty(v.prototype,"session",{get:function(){return this._session}});Object.defineProperty(v.prototype,"isOpen",{get:function(){return this._session&&this._session.isOpen?!0:!1}});Object.defineProperty(v.prototype,
  "isConnected",{get:function(){return this._transport?!0:!1}});Object.defineProperty(v.prototype,"transport",{get:function(){return this._transport?this._transport:{info:{type:"none",url:null,protocol:null}}}});Object.defineProperty(v.prototype,"isRetrying",{get:function(){return this._is_retrying}});k.Connection=v;}).call(this,"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{});},{"./autobahn.js":4,"./log.js":7,"./session.js":17,"./util.js":21,when:117}],
  7:[function(e,n,k){(function(b){var a=function(){};"AUTOBAHN_DEBUG"in b&&AUTOBAHN_DEBUG&&"console"in b&&(a=function(){console.log.apply(console,arguments);});b=console.warn;k.debug=a;k.warn=b;}).call(this,"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{});},{}],8:[function(e,n,k){e("./polyfill/object.js");e("./polyfill/array.js");e("./polyfill/string.js");e("./polyfill/function.js");e("./polyfill/console.js");e("./polyfill/typedarray.js");e("./polyfill/json.js");},
  {"./polyfill/array.js":9,"./polyfill/console.js":10,"./polyfill/function.js":11,"./polyfill/json.js":12,"./polyfill/object.js":13,"./polyfill/string.js":14,"./polyfill/typedarray.js":15}],9:[function(e,n,k){"function"!==typeof Array.prototype.reduce&&(Array.prototype.reduce=function(b){if(null===this||"undefined"===typeof this)throw new TypeError("Array.prototype.reduce called on null or undefined");if("function"!==typeof b)throw new TypeError(b+" is not a function");var a=Object(this);var h=a.length>>>
  0;var c=0;if(2<=arguments.length)var f=arguments[1];else {for(;c<h&&!c in a;)c++;if(c>=h)throw new TypeError("Reduce of empty array with no initial value");f=a[c++];}for(;c<h;c++)c in a&&(f=b(f,a[c],c,a));return f});"indexOf"in Array.prototype||(Array.prototype.indexOf=function(b,a){void 0===a&&(a=0);0>a&&(a+=this.length);0>a&&(a=0);for(var h=this.length;a<h;a++)if(a in this&&this[a]===b)return a;return -1});"lastIndexOf"in Array.prototype||(Array.prototype.lastIndexOf=function(b,a){void 0===a&&(a=this.length-
  1);0>a&&(a+=this.length);a>this.length-1&&(a=this.length-1);for(a++;0<a--;)if(a in this&&this[a]===b)return a;return -1});"forEach"in Array.prototype||(Array.prototype.forEach=function(b,a){for(var h=0,c=this.length;h<c;h++)h in this&&b.call(a,this[h],h,this);});"map"in Array.prototype||(Array.prototype.map=function(b,a){for(var h=Array(this.length),c=0,f=this.length;c<f;c++)c in this&&(h[c]=b.call(a,this[c],c,this));return h});"filter"in Array.prototype||(Array.prototype.filter=function(b,a){for(var h=
  [],c,f=0,d=this.length;f<d;f++)f in this&&b.call(a,c=this[f],f,this)&&h.push(c);return h});"every"in Array.prototype||(Array.prototype.every=function(b,a){for(var h=0,c=this.length;h<c;h++)if(h in this&&!b.call(a,this[h],h,this))return !1;return !0});"some"in Array.prototype||(Array.prototype.some=function(b,a){for(var h=0,c=this.length;h<c;h++)if(h in this&&b.call(a,this[h],h,this))return !0;return !1});"function"!==typeof Array.prototype.reduceRight&&(Array.prototype.reduceRight=function(b){if(null===
  this||"undefined"===typeof this)throw new TypeError("Array.prototype.reduce called on null or undefined");if("function"!==typeof b)throw new TypeError(b+" is not a function");var a=Object(this),h=(a.length>>>0)-1;if(2<=arguments.length)var c=arguments[1];else {for(;0<=h&&!h in a;)h--;if(0>h)throw new TypeError("Reduce of empty array with no initial value");c=a[h--];}for(;0<=h;h--)h in a&&(c=b(c,a[h],h,a));return c});},{}],10:[function(e,n,k){(function(b){b||(b=window.console={log:function(a,b,c,f,d){},
  info:function(a,b,c,f,d){},warn:function(a,b,c,f,d){},error:function(a,b,c,f,d){},assert:function(a,b){}});"object"===typeof b.log&&(b.log=Function.prototype.call.bind(b.log,b),b.info=Function.prototype.call.bind(b.info,b),b.warn=Function.prototype.call.bind(b.warn,b),b.error=Function.prototype.call.bind(b.error,b),b.debug=Function.prototype.call.bind(b.info,b));"group"in b||(b.group=function(a){b.info("\n--- "+a+" ---\n");});"groupEnd"in b||(b.groupEnd=function(){b.log("\n");});"assert"in b||(b.assert=
  function(a,b){if(!a)try{throw Error("assertion failed: "+b);}catch(c){setTimeout(function(){throw c;},0);}});"time"in b||function(){var a={};b.time=function(b){a[b]=(new Date).getTime();};b.timeEnd=function(h){var c=(new Date).getTime();b.info(h+": "+(h in a?c-a[h]:0)+"ms");};}();})("undefined"!==typeof console?console:void 0);},{}],11:[function(e,n,k){Function.prototype.bind||(Function.prototype.bind=function(b){var a=this,h=Array.prototype.slice.call(arguments,1);return function(){return a.apply(b,Array.prototype.concat.apply(h,
  arguments))}});},{}],12:[function(e,n,k){"object"!==typeof JSON&&(JSON={});(function(){function b(a){return 10>a?"0"+a:a}function a(a){v.lastIndex=0;return v.test(a)?'"'+a.replace(v,function(a){var b=u[a];return "string"===typeof b?b:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+a+'"'}function h(b,r){var l=c,u=r[b];u&&"object"===typeof u&&"function"===typeof u.toJSON&&(u=u.toJSON(b));"function"===typeof d&&(u=d.call(r,b,u));switch(typeof u){case "string":return a(u);case "number":return isFinite(u)?
  String(u):"null";case "boolean":case "null":return String(u);case "object":if(!u)return "null";c+=f;var m=[];if("[object Array]"===Object.prototype.toString.apply(u)){var B=u.length;for(b=0;b<B;b+=1)m[b]=h(b,u)||"null";r=0===m.length?"[]":c?"[\n"+c+m.join(",\n"+c)+"\n"+l+"]":"["+m.join(",")+"]";c=l;return r}if(d&&"object"===typeof d)for(B=d.length,b=0;b<B;b+=1){if("string"===typeof d[b]){var g=d[b];(r=h(g,u))&&m.push(a(g)+(c?": ":":")+r);}}else for(g in u)Object.prototype.hasOwnProperty.call(u,g)&&
  (r=h(g,u))&&m.push(a(g)+(c?": ":":")+r);r=0===m.length?"{}":c?"{\n"+c+m.join(",\n"+c)+"\n"+l+"}":"{"+m.join(",")+"}";c=l;return r}}"function"!==typeof Date.prototype.toJSON&&(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+b(this.getUTCMonth()+1)+"-"+b(this.getUTCDate())+"T"+b(this.getUTCHours())+":"+b(this.getUTCMinutes())+":"+b(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(){return this.valueOf()});
  var c,f,d;if("function"!==typeof JSON.stringify){var v=/[\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;var u={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"};JSON.stringify=function(a,b,x){var l;f=c="";if("number"===typeof x)for(l=0;l<x;l+=1)f+=" ";else "string"===typeof x&&(f=x);if((d=b)&&"function"!==typeof b&&("object"!==typeof b||"number"!==typeof b.length))throw Error("JSON.stringify");return h("",
  {"":a})};}if("function"!==typeof JSON.parse){var e=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;JSON.parse=function(a,b){function c(a,d){var m,g=a[d];if(g&&"object"===typeof g)for(m in g)if(Object.prototype.hasOwnProperty.call(g,m)){var l=c(g,m);void 0!==l?g[m]=l:delete g[m];}return b.call(a,d,g)}a=String(a);e.lastIndex=0;e.test(a)&&(a=a.replace(e,function(a){return "\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(a.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
  "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return a=eval("("+a+")"),"function"===typeof b?c({"":a},""):a;throw new SyntaxError("JSON.parse");};}})();k.JSON=JSON;},{}],13:[function(e,n,k){Object.create||(Object.create=function(){function b(){}return function(a){if(1!=arguments.length)throw Error("Object.create implementation only accepts one parameter.");b.prototype=a;return new b}}());Object.keys||(Object.keys=function(){var b=
  Object.prototype.hasOwnProperty,a=!{toString:null}.propertyIsEnumerable("toString"),h="toString toLocaleString valueOf hasOwnProperty isPrototypeOf propertyIsEnumerable constructor".split(" "),c=h.length;return function(f){if("object"!==typeof f&&("function"!==typeof f||null===f))throw new TypeError("Object.keys called on non-object");var d=[],v;for(v in f)b.call(f,v)&&d.push(v);if(a)for(v=0;v<c;v++)b.call(f,h[v])&&d.push(h[v]);return d}}());},{}],14:[function(e,n,k){"trim"in String.prototype||(String.prototype.trim=
  function(){return this.replace(/^\s+/,"").replace(/\s+$/,"")});},{}],15:[function(e,n,k){"undefined"===typeof Uint8Array&&function(b,a){function h(a){switch(typeof a){case "undefined":return "undefined";case "boolean":return "boolean";case "number":return "number";case "string":return "string";default:return null===a?"null":"object"}}function c(a){return Object.prototype.toString.call(a).replace(/^\[object *|\]$/g,"")}function f(a){return "function"===typeof a}function d(a){if(null===a||void 0===a)throw TypeError();
  return Object(a)}function v(a){function b(b){Object.defineProperty(a,b,{get:function(){return a._getter(b)},set:function(c){a._setter(b,c);},enumerable:!0,configurable:!1});}if(1E5<a.length)throw RangeError("Array too large for polyfill");var c;for(c=0;c<a.length;c+=1)b(c);}function u(a,b){b=32-b;return a<<b>>b}function e(a,b){b=32-b;return a<<b>>>b}function l(a){return [a&255]}function r(a){return u(a[0],8)}function x(a){return [a&255]}function y(a){return e(a[0],8)}function m(a){a=da(Number(a));return [0>
  a?0:255<a?255:a&255]}function B(a){return [a>>8&255,a&255]}function g(a){return u(a[0]<<8|a[1],16)}function q(a){return [a>>8&255,a&255]}function M(a){return e(a[0]<<8|a[1],16)}function P(a){return [a>>24&255,a>>16&255,a>>8&255,a&255]}function k(a){return u(a[0]<<24|a[1]<<16|a[2]<<8|a[3],32)}function E(a){return [a>>24&255,a>>16&255,a>>8&255,a&255]}function F(a){return e(a[0]<<24|a[1]<<16|a[2]<<8|a[3],32)}function G(a,b,c){function d(a){var b=p(a);a-=b;return .5>a?b:.5<a?b+1:b%2?b+1:b}var g=(1<<b-1)-1;
  if(a!==a){var m=(1<<b)-1;var l=Z(2,c-1);var f=0;}else Infinity===a||-Infinity===a?(m=(1<<b)-1,l=0,f=0>a?1:0):0===a?(l=m=0,f=-Infinity===1/a?1:0):(f=0>a,a=t(a),a>=Z(2,1-g)?(m=fa(p(S(a)/z),1023),l=d(a/Z(2,m)*Z(2,c)),2<=l/Z(2,c)&&(m+=1,l=1),m>g?(m=(1<<b)-1,l=0):(m+=g,l-=Z(2,c))):(m=0,l=d(a/Z(2,1-g-c))));for(a=[];c;--c)a.push(l%2?1:0),l=p(l/2);for(c=b;c;--c)a.push(m%2?1:0),m=p(m/2);a.push(f?1:0);a.reverse();b=a.join("");for(f=[];b.length;)f.push(parseInt(b.substring(0,8),2)),b=b.substring(8);return f}
  function A(a,b,c){var d=[],p,t;for(p=a.length;p;--p){var g=a[p-1];for(t=8;t;--t)d.push(g%2?1:0),g>>=1;}d.reverse();t=d.join("");a=(1<<b-1)-1;d=parseInt(t.substring(0,1),2)?-1:1;p=parseInt(t.substring(1,1+b),2);t=parseInt(t.substring(1+b),2);return p===(1<<b)-1?0!==t?NaN:Infinity*d:0<p?d*Z(2,p-a)*(1+t/Z(2,c)):0!==t?d*Z(2,-(a-1))*(t/Z(2,c)):0>d?-0:0}function n(a){return A(a,11,52)}function N(a){return G(a,11,52)}function C(a){return A(a,8,23)}function X(a){return G(a,8,23)}var z=Math.LN2,t=Math.abs,
  p=Math.floor,S=Math.log,ba=Math.max,fa=Math.min,Z=Math.pow,da=Math.round;(function(){var a=Object.defineProperty;try{var b=Object.defineProperty({},"x",{});}catch(R){b=!1;}a&&b||(Object.defineProperty=function(b,c,d){if(a)try{return a(b,c,d)}catch(V){}if(b!==Object(b))throw TypeError("Object.defineProperty called on non-object");Object.prototype.__defineGetter__&&"get"in d&&Object.prototype.__defineGetter__.call(b,c,d.get);Object.prototype.__defineSetter__&&"set"in d&&Object.prototype.__defineSetter__.call(b,
  c,d.set);"value"in d&&(b[c]=d.value);return b});})();(function(){function S(a){a>>=0;if(0>a)throw RangeError("ArrayBuffer size is not a small enough positive integer.");Object.defineProperty(this,"byteLength",{value:a});Object.defineProperty(this,"_bytes",{value:Array(a)});for(var b=0;b<a;b+=1)this._bytes[b]=0;}function u(){if(!arguments.length||"object"!==typeof arguments[0])return function(a){a>>=0;if(0>a)throw RangeError("length is not a small enough positive integer.");Object.defineProperty(this,
  "length",{value:a});Object.defineProperty(this,"byteLength",{value:a*this.BYTES_PER_ELEMENT});Object.defineProperty(this,"buffer",{value:new S(this.byteLength)});Object.defineProperty(this,"byteOffset",{value:0});}.apply(this,arguments);if(1<=arguments.length&&"object"===h(arguments[0])&&arguments[0]instanceof u)return function(a){if(this.constructor!==a.constructor)throw TypeError();var b=a.length*this.BYTES_PER_ELEMENT;Object.defineProperty(this,"buffer",{value:new S(b)});Object.defineProperty(this,
  "byteLength",{value:b});Object.defineProperty(this,"byteOffset",{value:0});Object.defineProperty(this,"length",{value:a.length});for(b=0;b<this.length;b+=1)this._setter(b,a._getter(b));}.apply(this,arguments);if(1<=arguments.length&&"object"===h(arguments[0])&&!(arguments[0]instanceof u)&&!(arguments[0]instanceof S||"ArrayBuffer"===c(arguments[0])))return function(a){var b=a.length*this.BYTES_PER_ELEMENT;Object.defineProperty(this,"buffer",{value:new S(b)});Object.defineProperty(this,"byteLength",
  {value:b});Object.defineProperty(this,"byteOffset",{value:0});Object.defineProperty(this,"length",{value:a.length});for(b=0;b<this.length;b+=1)this._setter(b,Number(a[b]));}.apply(this,arguments);if(1<=arguments.length&&"object"===h(arguments[0])&&(arguments[0]instanceof S||"ArrayBuffer"===c(arguments[0])))return function(a,b,c){b>>>=0;if(b>a.byteLength)throw RangeError("byteOffset out of range");if(b%this.BYTES_PER_ELEMENT)throw RangeError("buffer length minus the byteOffset is not a multiple of the element size.");
  if(void 0===c){var d=a.byteLength-b;if(d%this.BYTES_PER_ELEMENT)throw RangeError("length of buffer minus byteOffset not a multiple of the element size");c=d/this.BYTES_PER_ELEMENT;}else c>>>=0,d=c*this.BYTES_PER_ELEMENT;if(b+d>a.byteLength)throw RangeError("byteOffset and length reference an area beyond the end of the buffer");Object.defineProperty(this,"buffer",{value:a});Object.defineProperty(this,"byteLength",{value:d});Object.defineProperty(this,"byteOffset",{value:b});Object.defineProperty(this,
  "length",{value:c});}.apply(this,arguments);throw TypeError();}function e(a,b,c){var d=function(){Object.defineProperty(this,"constructor",{value:d});u.apply(this,arguments);v(this);};"__proto__"in d?d.__proto__=u:(d.from=u.from,d.of=u.of);d.BYTES_PER_ELEMENT=a;var p=function(){};p.prototype=w;d.prototype=new p;Object.defineProperty(d.prototype,"BYTES_PER_ELEMENT",{value:a});Object.defineProperty(d.prototype,"_pack",{value:b});Object.defineProperty(d.prototype,"_unpack",{value:c});return d}b.ArrayBuffer=
  b.ArrayBuffer||S;Object.defineProperty(u,"from",{value:function(a){return new this(a)}});Object.defineProperty(u,"of",{value:function(){return new this(arguments)}});var w={};u.prototype=w;Object.defineProperty(u.prototype,"_getter",{value:function(a){if(1>arguments.length)throw SyntaxError("Not enough arguments");a>>>=0;if(!(a>=this.length)){var b=[],c;var d=0;for(c=this.byteOffset+a*this.BYTES_PER_ELEMENT;d<this.BYTES_PER_ELEMENT;d+=1,c+=1)b.push(this.buffer._bytes[c]);return this._unpack(b)}}});
  Object.defineProperty(u.prototype,"get",{value:u.prototype._getter});Object.defineProperty(u.prototype,"_setter",{value:function(a,b){if(2>arguments.length)throw SyntaxError("Not enough arguments");a>>>=0;if(!(a>=this.length)){var c=this._pack(b),d;var p=0;for(d=this.byteOffset+a*this.BYTES_PER_ELEMENT;p<this.BYTES_PER_ELEMENT;p+=1,d+=1)this.buffer._bytes[d]=c[p];}}});Object.defineProperty(u.prototype,"constructor",{value:u});Object.defineProperty(u.prototype,"copyWithin",{value:function(a,b,c){var p=
  d(this),t=p.length>>>0;t=ba(t,0);a>>=0;a=0>a?ba(t+a,0):fa(a,t);b>>=0;b=0>b?ba(t+b,0):fa(b,t);c=void 0===c?t:c>>0;c=0>c?ba(t+c,0):fa(c,t);t=fa(c-b,t-a);from<a&&a<b+t?(c=-1,b=b+t-1,a=a+t-1):c=1;for(;0<count;)p._setter(a,p._getter(b)),b+=c,a+=c,--t;return p}});Object.defineProperty(u.prototype,"every",{value:function(a,b){if(void 0===this||null===this)throw TypeError();var c=Object(this),d=c.length>>>0;if(!f(a))throw TypeError();for(var p=0;p<d;p++)if(!a.call(b,c._getter(p),p,c))return !1;return !0}});
  Object.defineProperty(u.prototype,"fill",{value:function(a,b,c){var p=d(this),t=p.length>>>0;t=ba(t,0);b>>=0;b=0>b?ba(t+b,0):fa(b,t);c=void 0===c?t:c>>0;for(t=0>c?ba(t+c,0):fa(c,t);b<t;)p._setter(b,a),b+=1;return p}});Object.defineProperty(u.prototype,"filter",{value:function(a,b){if(void 0===this||null===this)throw TypeError();var c=Object(this),d=c.length>>>0;if(!f(a))throw TypeError();for(var p=[],t=0;t<d;t++){var g=c._getter(t);a.call(b,g,t,c)&&p.push(g);}return new this.constructor(p)}});Object.defineProperty(u.prototype,
  "find",{value:function(a){var b=d(this),c=b.length>>>0;if(!f(a))throw TypeError();for(var p=1<arguments.length?arguments[1]:void 0,t=0;t<c;){var g=b._getter(t);if(a.call(p,g,t,b))return g;++t;}}});Object.defineProperty(u.prototype,"findIndex",{value:function(a){var b=d(this),c=b.length>>>0;if(!f(a))throw TypeError();for(var p=1<arguments.length?arguments[1]:void 0,t=0;t<c;){var g=b._getter(t);if(a.call(p,g,t,b))return t;++t;}return -1}});Object.defineProperty(u.prototype,"forEach",{value:function(a,
  b){if(void 0===this||null===this)throw TypeError();var c=Object(this),d=c.length>>>0;if(!f(a))throw TypeError();for(var p=0;p<d;p++)a.call(b,c._getter(p),p,c);}});Object.defineProperty(u.prototype,"indexOf",{value:function(a){if(void 0===this||null===this)throw TypeError();var b=Object(this),c=b.length>>>0;if(0===c)return -1;var d=0;if(0<arguments.length){var g=Number(arguments[1]);g!==d?d=0:0!==g&&g!==1/0&&g!==-(1/0)&&(d=(0<g||-1)*p(t(g)));}if(d>=c)return -1;for(d=0<=d?d:ba(c-t(d),0);d<c;d++)if(b._getter(d)===
  a)return d;return -1}});Object.defineProperty(u.prototype,"join",{value:function(a){if(void 0===this||null===this)throw TypeError();for(var b=Object(this),c=b.length>>>0,d=Array(c),p=0;p<c;++p)d[p]=b._getter(p);return d.join(void 0===a?",":a)}});Object.defineProperty(u.prototype,"lastIndexOf",{value:function(a){if(void 0===this||null===this)throw TypeError();var b=Object(this),c=b.length>>>0;if(0===c)return -1;var d=c;1<arguments.length&&(d=Number(arguments[1]),d!==d?d=0:0!==d&&d!==1/0&&d!==-(1/0)&&
  (d=(0<d||-1)*p(t(d))));for(c=0<=d?fa(d,c-1):c-t(d);0<=c;c--)if(b._getter(c)===a)return c;return -1}});Object.defineProperty(u.prototype,"map",{value:function(a,b){if(void 0===this||null===this)throw TypeError();var c=Object(this),d=c.length>>>0;if(!f(a))throw TypeError();var p=[];p.length=d;for(var t=0;t<d;t++)p[t]=a.call(b,c._getter(t),t,c);return new this.constructor(p)}});Object.defineProperty(u.prototype,"reduce",{value:function(a){if(void 0===this||null===this)throw TypeError();var b=Object(this),
  c=b.length>>>0;if(!f(a))throw TypeError();if(0===c&&1===arguments.length)throw TypeError();var d=0,p;for(p=2<=arguments.length?arguments[1]:b._getter(d++);d<c;)p=a.call(void 0,p,b._getter(d),d,b),d++;return p}});Object.defineProperty(u.prototype,"reduceRight",{value:function(a){if(void 0===this||null===this)throw TypeError();var b=Object(this),c=b.length>>>0;if(!f(a))throw TypeError();if(0===c&&1===arguments.length)throw TypeError();--c;var d;for(d=2<=arguments.length?arguments[1]:b._getter(c--);0<=
  c;)d=a.call(void 0,d,b._getter(c),c,b),c--;return d}});Object.defineProperty(u.prototype,"reverse",{value:function(){if(void 0===this||null===this)throw TypeError();var a=Object(this),b=a.length>>>0,c=p(b/2),d=0;for(--b;d<c;++d,--b){var t=a._getter(d);a._setter(d,a._getter(b));a._setter(b,t);}return a}});Object.defineProperty(u.prototype,"set",{value:function(a,b){if(1>arguments.length)throw SyntaxError("Not enough arguments");var c;if("object"===typeof arguments[0]&&arguments[0].constructor===this.constructor){var d=
  arguments[0];var p=arguments[1]>>>0;if(p+d.length>this.length)throw RangeError("Offset plus length of array is out of range");var t=this.byteOffset+p*this.BYTES_PER_ELEMENT;p=d.length*this.BYTES_PER_ELEMENT;if(d.buffer===this.buffer){var g=[];var m=0;for(c=d.byteOffset;m<p;m+=1,c+=1)g[m]=d.buffer._bytes[c];for(m=0;m<p;m+=1,t+=1)this.buffer._bytes[t]=g[m];}else for(m=0,c=d.byteOffset;m<p;m+=1,c+=1,t+=1)this.buffer._bytes[t]=d.buffer._bytes[c];}else if("object"===typeof arguments[0]&&"undefined"!==typeof arguments[0].length){d=
  arguments[0];g=d.length>>>0;p=arguments[1]>>>0;if(p+g>this.length)throw RangeError("Offset plus length of array is out of range");for(m=0;m<g;m+=1)c=d[m],this._setter(p+m,Number(c));}else throw TypeError("Unexpected argument type(s)");}});Object.defineProperty(u.prototype,"slice",{value:function(a,b){var c=d(this),p=c.length>>>0;a>>=0;a=0>a?ba(p+a,0):fa(a,p);b=void 0===b?p:b>>0;p=0>b?ba(p+b,0):fa(b,p);b=new c.constructor(p-a);for(var t=0;a<p;){var g=c._getter(a);b._setter(t,g);++a;++t;}return b}});
  Object.defineProperty(u.prototype,"some",{value:function(a,b){if(void 0===this||null===this)throw TypeError();var c=Object(this),d=c.length>>>0;if(!f(a))throw TypeError();for(var p=0;p<d;p++)if(a.call(b,c._getter(p),p,c))return !0;return !1}});Object.defineProperty(u.prototype,"sort",{value:function(a){if(void 0===this||null===this)throw TypeError();for(var b=Object(this),c=b.length>>>0,d=Array(c),p=0;p<c;++p)d[p]=b._getter(p);a?d.sort(a):d.sort();for(p=0;p<c;++p)b._setter(p,d[p]);return b}});Object.defineProperty(u.prototype,
  "subarray",{value:function(a,b){a>>=0;b>>=0;1>arguments.length&&(a=0);2>arguments.length&&(b=this.length);0>a&&(a=this.length+a);0>b&&(b=this.length+b);var c=this.length;a=0>a?0:a>c?c:a;c=this.length;c=(0>b?0:b>c?c:b)-a;0>c&&(c=0);return new this.constructor(this.buffer,this.byteOffset+a*this.BYTES_PER_ELEMENT,c)}});var G=e(1,l,r),A=e(1,x,y),z=e(1,m,y),J=e(2,B,g),K=e(2,q,M),Z=e(4,P,k),da=e(4,E,F),ua=e(4,X,C),va=e(8,N,n);b.Int8Array=a.Int8Array=b.Int8Array||G;b.Uint8Array=a.Uint8Array=b.Uint8Array||
  A;b.Uint8ClampedArray=a.Uint8ClampedArray=b.Uint8ClampedArray||z;b.Int16Array=a.Int16Array=b.Int16Array||J;b.Uint16Array=a.Uint16Array=b.Uint16Array||K;b.Int32Array=a.Int32Array=b.Int32Array||Z;b.Uint32Array=a.Uint32Array=b.Uint32Array||da;b.Float32Array=a.Float32Array=b.Float32Array||ua;b.Float64Array=a.Float64Array=b.Float64Array||va;})();(function(){function a(a,b){return f(a.get)?a.get(b):a[b]}function d(a,b,d){if(!(a instanceof ArrayBuffer||"ArrayBuffer"===c(a)))throw TypeError();b>>>=0;if(b>
  a.byteLength)throw RangeError("byteOffset out of range");d=void 0===d?a.byteLength-b:d>>>0;if(b+d>a.byteLength)throw RangeError("byteOffset and length reference an area beyond the end of the buffer");Object.defineProperty(this,"buffer",{value:a});Object.defineProperty(this,"byteLength",{value:d});Object.defineProperty(this,"byteOffset",{value:b});}function p(c){return function(d,p){d>>>=0;if(d+c.BYTES_PER_ELEMENT>this.byteLength)throw RangeError("Array index out of range");d+=this.byteOffset;d=new b.Uint8Array(this.buffer,
  d,c.BYTES_PER_ELEMENT);for(var t=[],m=0;m<c.BYTES_PER_ELEMENT;m+=1)t.push(a(d,m));!!p===!!g&&t.reverse();return a(new c((new b.Uint8Array(t)).buffer),0)}}function t(c){return function(d,p,t){d>>>=0;if(d+c.BYTES_PER_ELEMENT>this.byteLength)throw RangeError("Array index out of range");p=new c([p]);p=new b.Uint8Array(p.buffer);var m=[],l;for(l=0;l<c.BYTES_PER_ELEMENT;l+=1)m.push(a(p,l));!!t===!!g&&m.reverse();(new Uint8Array(this.buffer,d,c.BYTES_PER_ELEMENT)).set(m);}}var g=function(){var c=new b.Uint16Array([4660]);
  c=new b.Uint8Array(c.buffer);return 18===a(c,0)}();Object.defineProperty(d.prototype,"getUint8",{value:p(b.Uint8Array)});Object.defineProperty(d.prototype,"getInt8",{value:p(b.Int8Array)});Object.defineProperty(d.prototype,"getUint16",{value:p(b.Uint16Array)});Object.defineProperty(d.prototype,"getInt16",{value:p(b.Int16Array)});Object.defineProperty(d.prototype,"getUint32",{value:p(b.Uint32Array)});Object.defineProperty(d.prototype,"getInt32",{value:p(b.Int32Array)});Object.defineProperty(d.prototype,
  "getFloat32",{value:p(b.Float32Array)});Object.defineProperty(d.prototype,"getFloat64",{value:p(b.Float64Array)});Object.defineProperty(d.prototype,"setUint8",{value:t(b.Uint8Array)});Object.defineProperty(d.prototype,"setInt8",{value:t(b.Int8Array)});Object.defineProperty(d.prototype,"setUint16",{value:t(b.Uint16Array)});Object.defineProperty(d.prototype,"setInt16",{value:t(b.Int16Array)});Object.defineProperty(d.prototype,"setUint32",{value:t(b.Uint32Array)});Object.defineProperty(d.prototype,"setInt32",
  {value:t(b.Int32Array)});Object.defineProperty(d.prototype,"setFloat32",{value:t(b.Float32Array)});Object.defineProperty(d.prototype,"setFloat64",{value:t(b.Float64Array)});b.DataView=b.DataView||d;})();}(k,window);"undefined"===typeof window||"Uint8ClampedArray"in window||(window.Uint8ClampedArray=window.Uint8Array);},{}],16:[function(e,n,k){function b(a,b){this.replacer=a;this.reviver=b;this.SERIALIZER_ID="json";this.BINARY=!1;}var a=e("./log.js");b.prototype.serialize=function(b){try{return JSON.stringify(b,
  this.replacer)}catch(d){throw a.warn("JSON encoding error",d),d;}};b.prototype.unserialize=function(b){try{return JSON.parse(b,this.reviver)}catch(d){throw a.warn("JSON decoding error",d),d;}};k.JSONSerializer=b;try{n=function(){this.SERIALIZER_ID="msgpack";this.BINARY=!0;};var h=e("msgpack5")({forceFloat64:!0});n.prototype.serialize=function(b){try{return h.encode(b)}catch(d){throw a.warn("MessagePack encoding error",d),d;}};n.prototype.unserialize=function(b){try{return h.decode(b)}catch(d){throw a.warn("MessagePack decoding error",
  d),d;}};k.MsgpackSerializer=n;}catch(f){a.warn("msgpack serializer not available",f);}try{n=function(){this.SERIALIZER_ID="cbor";this.BINARY=!0;};var c=e("cbor");n.prototype.serialize=function(b){try{return c.encode(b)}catch(d){throw a.warn("CBOR encoding error",d),d;}};n.prototype.unserialize=function(b){try{return c.decodeFirstSync(b)}catch(d){throw a.warn("CBOR decoding error",d),d;}};k.CBORSerializer=n;}catch(f){a.warn("cbor serializer not available",f);}},{"./log.js":7,cbor:28,msgpack5:71}],17:[function(e,
  n,k){(function(b){e("when");var a=e("when/function"),h=e("./log.js"),c=e("./util.js");Date.now=Date.now||function(){return +new Date};var f={caller:{features:{caller_identification:!0,call_canceling:!0,progressive_call_results:!0}},callee:{features:{caller_identification:!0,pattern_based_registration:!0,shared_registration:!0,progressive_call_results:!0,registration_revocation:!0}},publisher:{features:{publisher_identification:!0,subscriber_blackwhite_listing:!0,publisher_exclusion:!0}},subscriber:{features:{publisher_identification:!0,
  pattern_based_subscription:!0,subscription_revocation:!0}}},d=function(a,b,c,d,l){this.procedure=a;this.progress=b;this.caller=c;this.caller_authid=d;this.caller_authrole=l;},v=function(a,b,c,d,l,f){this.publication=a;this.topic=b;this.publisher=c;this.publisher_authid=d;this.publisher_authrole=l;this.retained=f;},u=function(a,b){this.args=a||[];this.kwargs=b||{};},w=function(a,b,c){this.error=a;this.args=b||[];this.kwargs=c||{};},l=function(a,b,c,d,l){this.topic=a;this.handler=b;this.options=c||{};this.session=
  d;this.id=l;this.active=!0;this._on_unsubscribe=d._defer();this.on_unsubscribe=this._on_unsubscribe.promise.then?this._on_unsubscribe.promise:this._on_unsubscribe;};l.prototype.unsubscribe=function(){return this.session.unsubscribe(this)};var r=function(a,b,c,d,l){this.procedure=a;this.endpoint=b;this.options=c||{};this.session=d;this.id=l;this.active=!0;this._on_unregister=d._defer();this.on_unregister=this._on_unregister.promise.then?this._on_unregister.promise:this._on_unregister;};r.prototype.unregister=
  function(){return this.session.unregister(this)};var x=function(a){this.id=a;},y=function(m,B,g,e,y){var q=this;q._socket=m;q._defer=B;q._onchallenge=g;q._on_user_error=e;q._on_internal_error=y;q._id=null;q._realm=null;q._features=null;q._goodbye_sent=!1;q._transport_is_closing=!1;q._publish_reqs={};q._subscribe_reqs={};q._unsubscribe_reqs={};q._call_reqs={};q._register_reqs={};q._unregister_reqs={};q._subscriptions={};q._registrations={};q._invocations={};q._prefixes={};q._caller_disclose_me=!1;q._publisher_disclose_me=
  !1;q._send_wamp=function(a){h.debug(a);q._socket.send(a);};q._protocol_violation=function(a){q._socket.close(3002,"protocol violation: "+a);c.handle_error(q._on_internal_error,w("failing transport due to protocol violation: "+a));};q._MESSAGE_MAP={};q._MESSAGE_MAP[8]={};var M=0;q._new_request_id=function(){return M=9007199254740992>M?M+1:1};q._process_SUBSCRIBED=function(a){var b=a[1];a=a[2];if(b in q._subscribe_reqs){var c=q._subscribe_reqs[b],d=c[0],g=c[1],m=c[2];c=c[3];a in q._subscriptions||(q._subscriptions[a]=
  []);g=new l(g,m,c,q,a);q._subscriptions[a].push(g);d.resolve(g);delete q._subscribe_reqs[b];}else q._protocol_violation("SUBSCRIBED received for non-pending request ID "+b);};q._MESSAGE_MAP[33]=q._process_SUBSCRIBED;q._process_SUBSCRIBE_ERROR=function(a){var b=a[2];b in q._subscribe_reqs?(a=new w(a[4],a[5],a[6]),q._subscribe_reqs[b][0].reject(a),delete q._subscribe_reqs[b]):q._protocol_violation("SUBSCRIBE-ERROR received for non-pending request ID "+b);};q._MESSAGE_MAP[8][32]=q._process_SUBSCRIBE_ERROR;
  q._process_UNSUBSCRIBED=function(a){var b=a[1];if(b in q._unsubscribe_reqs){a=q._unsubscribe_reqs[b];var c=a[0];a=a[1];if(a in q._subscriptions){for(var d=q._subscriptions[a],g=0;g<d.length;++g)d[g].active=!1,d[g]._on_unsubscribe.resolve();delete q._subscriptions[a];}c.resolve(!0);delete q._unsubscribe_reqs[b];}else if(0===b)if(b=a[2],a=b.subscription,b=b.reason,a in q._subscriptions){d=q._subscriptions[a];for(g=0;g<d.length;++g)d[g].active=!1,d[g]._on_unsubscribe.resolve(b);delete q._subscriptions[a];}else q._protocol_violation("non-voluntary UNSUBSCRIBED received for non-existing subscription ID "+
  a);else q._protocol_violation("UNSUBSCRIBED received for non-pending request ID "+b);};q._MESSAGE_MAP[35]=q._process_UNSUBSCRIBED;q._process_UNSUBSCRIBE_ERROR=function(a){var b=a[2];b in q._unsubscribe_reqs?(a=new w(a[4],a[5],a[6]),q._unsubscribe_reqs[b][0].reject(a),delete q._unsubscribe_reqs[b]):q._protocol_violation("UNSUBSCRIBE-ERROR received for non-pending request ID "+b);};q._MESSAGE_MAP[8][34]=q._process_UNSUBSCRIBE_ERROR;q._process_PUBLISHED=function(a){var b=a[1],c=a[2];b in q._publish_reqs?
  (a=q._publish_reqs[b][0],c=new x(c),a.resolve(c),delete q._publish_reqs[b]):q._protocol_violation("PUBLISHED received for non-pending request ID "+b);};q._MESSAGE_MAP[17]=q._process_PUBLISHED;q._process_PUBLISH_ERROR=function(a){var b=a[2];b in q._publish_reqs?(a=new w(a[4],a[5],a[6]),q._publish_reqs[b][0].reject(a),delete q._publish_reqs[b]):q._protocol_violation("PUBLISH-ERROR received for non-pending request ID "+b);};q._MESSAGE_MAP[8][16]=q._process_PUBLISH_ERROR;q._process_EVENT=function(a){var b=
  a[1];if(b in q._subscriptions){var d=a[3],g=a[4]||[],m=a[5]||{};b=q._subscriptions[b];a=new v(a[2],d.topic||b[0]&&b[0].topic,d.publisher,d.publisher_authid,d.publisher_authrole,d.retained||!1);for(d=0;d<b.length;++d){var l=b[d];try{l.handler(g,m,a,l);}catch(C){c.handle_error(q._on_user_error,C,"Exception raised in event handler:");}}}else q._protocol_violation("EVENT received for non-subscribed subscription ID "+b);};q._MESSAGE_MAP[36]=q._process_EVENT;q._process_REGISTERED=function(a){var b=a[1];a=
  a[2];if(b in q._register_reqs){var c=q._register_reqs[b],d=c[0];c=new r(c[1],c[2],c[3],q,a);q._registrations[a]=c;d.resolve(c);delete q._register_reqs[b];}else q._protocol_violation("REGISTERED received for non-pending request ID "+b);};q._MESSAGE_MAP[65]=q._process_REGISTERED;q._process_REGISTER_ERROR=function(a){var b=a[2];b in q._register_reqs?(a=new w(a[4],a[5],a[6]),q._register_reqs[b][0].reject(a),delete q._register_reqs[b]):q._protocol_violation("REGISTER-ERROR received for non-pending request ID "+
  b);};q._MESSAGE_MAP[8][64]=q._process_REGISTER_ERROR;q._process_UNREGISTERED=function(a){var b=a[1];if(b in q._unregister_reqs){a=q._unregister_reqs[b];var c=a[0];a=a[1];a.id in q._registrations&&delete q._registrations[a.id];a.active=!1;c.resolve();delete q._unregister_reqs[b];}else 0===b?(a=a[2],b=a.registration,c=a.reason,b in q._registrations?(a=q._registrations[b],a.active=!1,a._on_unregister.resolve(c),delete q._registrations[b]):q._protocol_violation("non-voluntary UNREGISTERED received for non-existing registration ID "+
  b)):q._protocol_violation("UNREGISTERED received for non-pending request ID "+b);};q._MESSAGE_MAP[67]=q._process_UNREGISTERED;q._process_UNREGISTER_ERROR=function(a){var b=a[2];b in q._unregister_reqs?(a=new w(a[4],a[5],a[6]),q._unregister_reqs[b][0].reject(a),delete q._unregister_reqs[b]):q._protocol_violation("UNREGISTER-ERROR received for non-pending request ID "+b);};q._MESSAGE_MAP[8][66]=q._process_UNREGISTER_ERROR;q._process_RESULT=function(a){var b=a[1];if(b in q._call_reqs){var c=a[2],d=a[3]||
  [],g=a[4]||{};a=null;1<d.length||0<Object.keys(g).length?a=new u(d,g):0<d.length&&(a=d[0]);g=q._call_reqs[b];d=g[0];g=g[1];c.progress?g&&g.receive_progress&&d.notify(a):(d.resolve(a),delete q._call_reqs[b]);}else q._protocol_violation("CALL-RESULT received for non-pending request ID "+b);};q._MESSAGE_MAP[50]=q._process_RESULT;q._process_CALL_ERROR=function(a){var b=a[2];b in q._call_reqs?(a=new w(a[4],a[5],a[6]),q._call_reqs[b][0].reject(a),delete q._call_reqs[b]):q._protocol_violation("CALL-ERROR received for non-pending request ID "+
  b);};q._MESSAGE_MAP[8][48]=q._process_CALL_ERROR;q._process_INVOCATION=function(b){var g=b[1],m=b[2],l=b[3];if(m in q._registrations){m=q._registrations[m];var f=b[4]||[];b=b[5]||{};var B=null;l.receive_progress&&(B=function(a,b){var c=[70,g,{progress:!0}];a=a||[];b=b||{};var d=Object.keys(b).length;if(a.length||d)c.push(a),d&&c.push(b);q._send_wamp(c);});l=new d(l.procedure||m.procedure,B,l.caller,l.caller_authid,l.caller_authrole);a.call(m.endpoint,f,b,l).then(function(a){var b=[70,g,{}];if(a instanceof
  u){var c=Object.keys(a.kwargs).length;if(a.args.length||c)b.push(a.args),c&&b.push(a.kwargs);}else b.push([a]);q._send_wamp(b);},function(a){var b=[8,68,g,{}];if(a instanceof w){b.push(a.error);var d=Object.keys(a.kwargs).length;if(a.args.length||d)b.push(a.args),d&&b.push(a.kwargs);}else b.push("wamp.error.runtime_error"),b.push([a]);q._send_wamp(b);c.handle_error(q._on_user_error,a,"Exception raised in invocation handler:");});}else q._protocol_violation("INVOCATION received for non-registered registration ID "+
  g);};q._MESSAGE_MAP[68]=q._process_INVOCATION;q._socket.onmessage=function(b){var d=b[0];if(q._id)if(6===d){if(q._goodbye_sent||q._send_wamp([6,{},"wamp.error.goodbye_and_out"]),q._id=null,q._realm=null,q._features=null,d=b[1],b=b[2],q.onleave)q.onleave(b,d);}else if(8===d){var g=b[1];if(g in q._MESSAGE_MAP[8])q._MESSAGE_MAP[d][g](b);else q._protocol_violation("unexpected ERROR message with request_type "+g);}else if(d in q._MESSAGE_MAP)q._MESSAGE_MAP[d](b);else q._protocol_violation("unexpected message type "+
  d);else if(2===d){q._id=b[1];d=b[2];q._features={};if(d.roles.broker&&(q._features.subscriber={},q._features.publisher={},d.roles.broker.features)){for(g in f.publisher.features)q._features.publisher[g]=f.publisher.features[g]&&d.roles.broker.features[g];for(g in f.subscriber.features)q._features.subscriber[g]=f.subscriber.features[g]&&d.roles.broker.features[g];}if(d.roles.dealer&&(q._features.caller={},q._features.callee={},d.roles.dealer.features)){for(g in f.caller.features)q._features.caller[g]=
  f.caller.features[g]&&d.roles.dealer.features[g];for(g in f.callee.features)q._features.callee[g]=f.callee.features[g]&&d.roles.dealer.features[g];}if(q.onjoin)q.onjoin(b[2]);}else if(3===d){if(d=b[1],b=b[2],q.onleave)q.onleave(b,d);}else 4===d?q._onchallenge?a.call(q._onchallenge,q,b[1],b[2]).then(function(a){if("string"===typeof a)var b=[5,a,{}];else "object"===typeof a&&(b=[5,a[0],a[1]]);q._send_wamp(b);},function(a){c.handle_error(q._on_user_error,a,"onchallenge() raised: ");q._send_wamp([3,{message:"sorry, I cannot authenticate (onchallenge handler raised an exception)"},
  "wamp.error.cannot_authenticate"]);q._socket.close(3E3);}):(c.handle_error(q._on_internal_error,w("received WAMP challenge, but no onchallenge() handler set")),b=[3,{message:"sorry, I cannot authenticate (no onchallenge handler set)"},"wamp.error.cannot_authenticate"],q._send_wamp(b),q._socket.close(3E3)):q._protocol_violation("unexpected message type "+d);};q._created="performance"in b&&"now"in performance?performance.now():Date.now();};Object.defineProperty(y.prototype,"defer",{get:function(){return this._defer}});
  Object.defineProperty(y.prototype,"id",{get:function(){return this._id}});Object.defineProperty(y.prototype,"realm",{get:function(){return this._realm}});Object.defineProperty(y.prototype,"isOpen",{get:function(){return null!==this.id}});Object.defineProperty(y.prototype,"features",{get:function(){return this._features}});Object.defineProperty(y.prototype,"caller_disclose_me",{get:function(){return this._caller_disclose_me},set:function(a){this._caller_disclose_me=a;}});Object.defineProperty(y.prototype,
  "publisher_disclose_me",{get:function(){return this._publisher_disclose_me},set:function(a){this._publisher_disclose_me=a;}});Object.defineProperty(y.prototype,"subscriptions",{get:function(){for(var a=Object.keys(this._subscriptions),b=[],c=0;c<a.length;++c)b.push(this._subscriptions[a[c]]);return b}});Object.defineProperty(y.prototype,"registrations",{get:function(){for(var a=Object.keys(this._registrations),b=[],c=0;c<a.length;++c)b.push(this._registrations[a[c]]);return b}});y.prototype.log=function(){if("console"in
  b){if(this._id&&this._created){var a="performance"in b&&"now"in performance?performance.now()-this._created:Date.now()-this._created;a="WAMP session "+this._id+" on '"+this._realm+"' at "+Math.round(1E3*a)/1E3+" ms";}else a="WAMP session";if("group"in console){console.group(a);for(a=0;a<arguments.length;a+=1)console.log(arguments[a]);console.groupEnd();}else {var c=[a+": "];for(a=0;a<arguments.length;a+=1)c.push(arguments[a]);console.log.apply(console,c);}}};y.prototype.join=function(a,b,d,l){c.assert(!a||
  "string"===typeof a,"Session.join: <realm> must be a string");c.assert(!b||Array.isArray(b),"Session.join: <authmethods> must be an array []");c.assert(!d||"string"===typeof d,"Session.join: <authid> must be a string");if(this.isOpen)throw "session already open";this._goodbye_sent=!1;this._realm=a;var g={};g.roles=f;b&&(g.authmethods=b);d&&(g.authid=d);l&&(g.authextra=l);this._send_wamp([1,a,g]);};y.prototype.leave=function(a,b){c.assert(!a||"string"===typeof a,"Session.leave: <reason> must be a string");
  c.assert(!b||"string"===typeof b,"Session.leave: <message> must be a string");if(!this.isOpen)throw "session not open";a||(a="wamp.close.normal");var d={};b&&(d.message=b);this._send_wamp([6,d,a]);this._goodbye_sent=!0;};y.prototype.call=function(a,b,d,l){c.assert("string"===typeof a,"Session.call: <procedure> must be a string");c.assert(!b||Array.isArray(b),"Session.call: <args> must be an array []");c.assert(!d||d instanceof Object,"Session.call: <kwargs> must be an object {}");c.assert(!l||l instanceof
  Object,"Session.call: <options> must be an object {}");var g=this;if(!g.isOpen)throw "session not open";l=l||{};void 0===l.disclose_me&&g._caller_disclose_me&&(l.disclose_me=!0);var m=g._defer(),q=g._new_request_id();g._call_reqs[q]=[m,l];a=[48,q,l,g.resolve(a)];b?(a.push(b),d&&a.push(d)):d&&(a.push([]),a.push(d));g._send_wamp(a);b=m.promise.then?m.promise:m;b.cancel=function(a){g._send_wamp([49,q,a||{}]);!(q in g._call_reqs)||a&&a.mode&&"kill"===a.mode||(g._call_reqs[q][0].reject(new w("Cancelled")),
  delete g._call_reqs[q]);};return b};y.prototype.publish=function(a,b,d,l){c.assert("string"===typeof a,"Session.publish: <topic> must be a string");c.assert(!b||Array.isArray(b),"Session.publish: <args> must be an array []");c.assert(!d||d instanceof Object,"Session.publish: <kwargs> must be an object {}");c.assert(!l||l instanceof Object,"Session.publish: <options> must be an object {}");if(!this.isOpen)throw "session not open";l=l||{};void 0===l.disclose_me&&this._publisher_disclose_me&&(l.disclose_me=
  !0);var g=null,m=this._new_request_id();l.acknowledge&&(g=this._defer(),this._publish_reqs[m]=[g,l]);a=[16,m,l,this.resolve(a)];b?(a.push(b),d&&a.push(d)):d&&(a.push([]),a.push(d));this._send_wamp(a);if(g)return g.promise.then?g.promise:g};y.prototype.subscribe=function(a,b,d){c.assert("string"===typeof a,"Session.subscribe: <topic> must be a string");c.assert("function"===typeof b,"Session.subscribe: <handler> must be a function");c.assert(!d||d instanceof Object,"Session.subscribe: <options> must be an object {}");
  if(!this.isOpen)throw "session not open";var g=this._new_request_id(),l=this._defer();this._subscribe_reqs[g]=[l,a,b,d];b=[32,g];d?b.push(d):b.push({});b.push(this.resolve(a));this._send_wamp(b);return l.promise.then?l.promise:l};y.prototype.register=function(a,b,d){c.assert("string"===typeof a,"Session.register: <procedure> must be a string");c.assert("function"===typeof b,"Session.register: <endpoint> must be a function");c.assert(!d||d instanceof Object,"Session.register: <options> must be an object {}");
  if(!this.isOpen)throw "session not open";var g=this._new_request_id(),l=this._defer();this._register_reqs[g]=[l,a,b,d];b=[64,g];d?b.push(d):b.push({});b.push(this.resolve(a));this._send_wamp(b);return l.promise.then?l.promise:l};y.prototype.unsubscribe=function(a){c.assert(a instanceof l,"Session.unsubscribe: <subscription> must be an instance of class autobahn.Subscription");if(!this.isOpen)throw "session not open";if(!(a.active&&a.id in this._subscriptions))throw "subscription not active";var b=this._subscriptions[a.id],
  d=b.indexOf(a);if(-1===d)throw "subscription not active";b.splice(d,1);a.active=!1;d=this._defer();b.length?d.resolve(!1):(b=this._new_request_id(),this._unsubscribe_reqs[b]=[d,a.id],this._send_wamp([34,b,a.id]));return d.promise.then?d.promise:d};y.prototype.unregister=function(a){c.assert(a instanceof r,"Session.unregister: <registration> must be an instance of class autobahn.Registration");if(!this.isOpen)throw "session not open";if(!(a.active&&a.id in this._registrations))throw "registration not active";
  var b=this._new_request_id(),d=this._defer();this._unregister_reqs[b]=[d,a];this._send_wamp([66,b,a.id]);return d.promise.then?d.promise:d};y.prototype.prefix=function(a,b){c.assert("string"===typeof a,"Session.prefix: <prefix> must be a string");c.assert(!b||"string"===typeof b,"Session.prefix: <uri> must be a string or falsy");b?this._prefixes[a]=b:a in this._prefixes&&delete this._prefixes[a];};y.prototype.resolve=function(a){c.assert("string"===typeof a,"Session.resolve: <curie> must be a string");
  var b=a.indexOf(":");if(0<=b){var d=a.substring(0,b);return d in this._prefixes?this._prefixes[d]+"."+a.substring(b+1):a}return a};k.Session=y;k.Invocation=d;k.Event=v;k.Result=u;k.Error=w;k.Subscription=l;k.Registration=r;k.Publication=x;}).call(this,"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{});},{"./log.js":7,"./util.js":21,when:117,"when/function":93}],18:[function(e,n,k){function b(b){a.assert(void 0!==b.url,"options.url missing");a.assert("string"===
  typeof b.url,"options.url must be a string");this._options=b;}e("when");var a=e("../util.js"),h=e("../log.js"),c=e("../serializer.js");b.prototype.type="longpoll";b.prototype.create=function(){var b=this;h.debug("longpoll.Factory.create");var d={protocol:void 0};d.serializer=new c.JSONSerializer;d.send=void 0;d.close=void 0;d.onmessage=function(){};d.onopen=function(){};d.onclose=function(){};d.info={type:"longpoll",url:null,protocol:"wamp.2.json"};d._run=function(){var c=null,f=!1,e=b._options.request_timeout||
  12E3;a.http_post(b._options.url+"/open",JSON.stringify({protocols:["wamp.2.json"]}),e).then(function(l){function r(){h.debug("longpoll.Transport: polling for message ...");a.http_post(u+"/receive",null,e).then(function(a){a&&(a=JSON.parse(a),h.debug("longpoll.Transport: message received",a),d.onmessage(a));f||r();},function(a){h.debug("longpoll.Transport: could not receive message",a.code,a.text);f=!0;d.onclose({code:1001,reason:"transport receive failure (HTTP/POST status "+a.code+" - '"+a.text+"')",
  wasClean:!1});});}c=JSON.parse(l);var u=b._options.url+"/"+c.transport;d.info.url=u;h.debug("longpoll.Transport: open",c);d.close=function(b,c){if(f)throw "transport is already closing";f=!0;a.http_post(u+"/close",null,e).then(function(){h.debug("longpoll.Transport: transport closed");d.onclose({code:1E3,reason:"transport closed",wasClean:!0});},function(a){h.debug("longpoll.Transport: could not close transport",a.code,a.text);});};d.send=function(b){if(f)throw "transport is closing or closed already";h.debug("longpoll.Transport: sending message ...",
  b);b=JSON.stringify(b);a.http_post(u+"/send",b,e).then(function(){h.debug("longpoll.Transport: message sent");},function(a){h.debug("longpoll.Transport: could not send message",a.code,a.text);f=!0;d.onclose({code:1001,reason:"transport send failure (HTTP/POST status "+a.code+" - '"+a.text+"')",wasClean:!1});});};r();d.onopen();},function(a){h.debug("longpoll.Transport: could not open transport",a.code,a.text);f=!0;d.onclose({code:1001,reason:"transport open failure (HTTP/POST status "+a.code+" - '"+a.text+
  "')",wasClean:!1});});};d._run();return d};k.Factory=b;},{"../log.js":7,"../serializer.js":16,"../util.js":21,when:117}],19:[function(e,n,k){(function(b,a){function h(a){a.protocols?f.assert(Array.isArray(a.protocols),"options.protocols must be an array"):a.protocols=["wamp.2.json"];a.rawsocket_max_len_exp=a.rawsocket_max_len_exp||24;this._options=a;}function c(b,c){this._options={_peer_serializer:null,_peer_max_len_exp:0};this._options=f.defaults(this._options,c,this.DEFAULT_OPTIONS);f.assert(this._options.serializer in
  this.SERIALIZERS,"Unsupported serializer: "+this._options.serializer);f.assert(9<=this._options.max_len_exp&&36>=this._options.max_len_exp,"Message length out of bounds [9, 36]: "+this._options.max_len_exp);f.assert(!this._options.autoping||Number.isInteger(this._options.autoping)&&0<=this._options.autoping,"Autoping interval must be positive");f.assert(!this._options.ping_timeout||Number.isInteger(this._options.ping_timeout)&&0<=this._options.ping_timeout,"Ping timeout duration must be positive");
  f.assert(!this._options.packet_timeout||Number.isInteger(this._options.packet_timeout)&&0<=this._options.packet_timeout,"Packet timeout duration must be positive");f.assert(!this._options.autoping||!this._options.ping_timeout||this._options.autoping>this._options.ping_timeout,"Autoping interval ("+this._options.autoping+") must be lower than ping timeout ("+this._options.ping_timeout+")");this._ping_interval=this._ping_payload=this._ping_timeout=null;this._status=this.STATUS.UNINITIATED;this._stream=
  b;this._emitter=new u;this._buffer=new a(4);this._msgLen=this._bufferLen=0;var d=this;this._stream.on("data",function(a){d._read(a);});this._stream.on("connect",function(){d._handshake();});["close","drain","end","error","timeout"].forEach(function(a){d._stream.on(a,function(b){d._emitter.emit(a,b);});});}var f=e("../util.js"),d=e("../log.js"),v=e("../serializer.js"),u=e("events").EventEmitter;h.prototype.type="rawsocket";h.prototype.create=function(){var a=this,f={protocol:void 0};f.serializer=new v.JSONSerializer;
  f.send=void 0;f.close=void 0;f.onmessage=function(){};f.onopen=function(){};f.onclose=function(){};f.info={type:"rawsocket",url:null,protocol:"wamp.2.json"};if(b.process&&b.process.versions.node)(function(){var b=e("net");if(a._options.path)connectionOptions={path:a._options.path,allowHalfOpen:!0};else if(a._options.port)connectionOptions={port:a._options.port||8E3,host:a._options.host||"localhost",allowHalfOpen:!0};else throw "You must specify a host/port combination or a unix socket path to connect to";
  b=b.connect(connectionOptions);var l=new c(b,{serializer:"json",max_len_exp:a._options.rawsocket_max_len_exp});l.on("connect",function(a){d.debug("RawSocket transport negociated");f.onopen(a);});l.on("data",function(a){d.debug("RawSocket transport received",a);f.onmessage(a);});l.on("close",function(a){d.debug("RawSocket transport closed");f.onclose({code:999,reason:"",wasClean:!a});});l.on("error",function(a){d.debug("RawSocket transport error",a);});f.close=function(a,b){d.debug("RawSocket transport closing",
  a,b);l.close();};f.send=function(a){d.debug("RawSocket transport sending",a);l.write(a);};})();else throw "No RawSocket support in browser";return f};c.prototype._MAGIC_BYTE=127;c.prototype.SERIALIZERS={json:1};c.prototype.STATUS={CLOSED:-1,UNINITIATED:0,NEGOCIATING:1,NEGOCIATED:2,RXHEAD:3,RXDATA:4,RXPING:5,RXPONG:6};c.prototype.ERRORS={0:"illegal (must not be used)",1:"serializer unsupported",2:"maximum message length unacceptable",3:"use of reserved bits (unsupported feature)",4:"maximum connection count reached"};
  c.prototype.MSGTYPES={WAMP:0,PING:1,PONG:2};c.prototype.DEFAULT_OPTIONS={fail_on_ping_timeout:!0,strict_pong:!0,ping_timeout:2E3,autoping:0,max_len_exp:24,serializer:"json",packet_timeout:2E3};c.prototype.close=function(){this._status=this.STATUS.CLOSED;this._stream.end();return this.STATUS.CLOSED};c.prototype.write=function(b,c,d){c=void 0===c?0:c;c===this.MSGTYPES.WAMP&&(b=JSON.stringify(b));var l=a.byteLength(b,"utf8");if(l>Math.pow(2,this._options._peer_max_len_exp))this._emitter.emit("error",
  new w("Frame too big"));else {var f=new a(l+4);f.writeUInt8(c,0);f.writeUIntBE(l,1,3);f.write(b,4);this._stream.write(f,d);}};c.prototype.ping=function(a){a=a||255;if(Number.isInteger(a))for(var b=Math.max(1,a),c=0;c<b;c++)a+="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&~\"#'{([-|`_\\^@)]=},?;.:/!*$<>".charAt(92*Math.random()|0);this._ping_payload=a;return this.write(a,this.MSGTYPES.PING,this._setupPingTimeout.bind(this))};c.prototype._setupPingTimeout=function(){this._options.ping_timeout&&
  (this._ping_timeout=setTimeout(this._onPingTimeout.bind(this),this._options.ping_timeout));};c.prototype._clearPingTimeout=function(){this._ping_timeout&&(clearTimeout(this._ping_timeout),this._ping_timeout=null);};c.prototype._setupAutoPing=function(){this._clearAutoPing();this._options.autoping&&(this._autoping_interval=setInterval(this.ping.bind(this),this._options.autoping));};c.prototype._clearAutoPing=function(){this._autoping_interval&&(clearInterval(this._autoping_interval),this._autoping_interval=
  null);};c.prototype._onPingTimeout=function(){this._emitter.emit("error",new w("PING timeout"));this._options.fail_on_ping_timeout&&this.close();};c.prototype._read=function(a){switch(this._status){case this.STATUS.CLOSED:case this.STATUS.UNINITIATED:this._emitter.emit("error",w("Unexpected packet"));break;case this.STATUS.NEGOCIATING:var b=this._handleHandshake;var c=4;break;case this.STATUS.NEGOCIATED:case this.STATUS.RXHEAD:this._status=this.STATUS.RXHEAD;b=this._handleHeaderPacket;c=4;break;case this.STATUS.RXDATA:b=
  this._handleDataPacket;c=this._msgLen;break;case this.STATUS.RXPING:b=this._handlePingPacket;c=this._msgLen;break;case this.STATUS.RXPONG:b=this._handlePongPacket,c=this._msgLen;}if(a=this._splitBytes(a,c))this._status=b.call(this,a[0]),0<a[1].length&&this._read(a[1]);};c.prototype._handshake=function(){if(this._status!==this.STATUS.UNINITIATED)throw "Handshake packet already sent";var b=new a(4);b.writeUInt8(this._MAGIC_BYTE,0);b.writeUInt8(this._options.max_len_exp-9<<4|this.SERIALIZERS[this._options.serializer],
  1);b.writeUInt8(0,2);b.writeUInt8(0,3);this._stream.write(b);this._status=this.STATUS.NEGOCIATING;};c.prototype._splitBytes=function(b,c){c!==this._buffer.length&&(this._buffer=new a(c),this._bufferLen=0);b.copy(this._buffer,this._bufferLen);if(this._bufferLen+b.length<c)return this._bufferLen+=b.length,null;var d=this._buffer.slice();b=b.slice(c-this._bufferLen);this._bufferLen=0;return [d,b]};c.prototype._handleHandshake=function(a){if(a[0]!==this._MAGIC_BYTE)return this._emitter.emit("error",new w("Invalid magic byte. Expected 0x"+
  this._MAGIC_BYTE.toString(16)+", got 0x"+a[0].toString(16))),this.close();if(0===(a[1]&15))return a=a[1]>>4,this._emitter.emit("error",new w("Peer failed handshake: "+(this.ERRORS[a]||"0x"+a.toString(16)))),this.close();this._options._peer_max_len_exp=(a[1]>>4)+9;this._options._peer_serializer=a[1]&15;if(this._options._peer_serializer!==this.SERIALIZERS.json)return this._emitter.emit("error",new w("Unsupported serializer: 0x"+this._options._peer_serializer.toString(16))),this.close();this._emitter.emit("connect");
  this._setupAutoPing();return this.STATUS.NEGOCIATED};c.prototype._handleHeaderPacket=function(a){var b=a[0]&15;this._msgLen=a.readUIntBE(1,3);switch(b){case this.MSGTYPES.WAMP:return this.STATUS.RXDATA;case this.MSGTYPES.PING:return this.STATUS.RXPING;case this.MSGTYPES.PONG:return this.STATUS.RXPONG;default:return this._emitter.emit("error",new w("Invalid frame type: 0x"+b.toString(16))),this.close()}};c.prototype._handleDataPacket=function(a){try{var b=JSON.parse(a.toString("utf8"));}catch(x){return this._emitter.emit("error",
  new w("Invalid JSON frame")),this.STATUS.RXHEAD}this._emitter.emit("data",b);return this.STATUS.RXHEAD};c.prototype._handlePingPacket=function(a){this.write(a.toString("utf8"),this.MSGTYPES.PONG);return this.STATUS.RXHEAD};c.prototype._handlePongPacket=function(a){this._clearPingTimeout();return this._options.strict_pong&&this._ping_payload!==a.toString("utf8")?(this._emitter.emit("error",new w("PONG response payload doesn't match PING.")),this.close()):this.STATUS.RXHEAD};c.prototype.on=function(a,
  b){return this._emitter.on(a,b)};c.prototype.once=function(a,b){return this._emitter.once(a,b)};c.prototype.removeListener=function(a,b){return this._emitter.removeListener(a,b)};var w=k.ProtocolError=function(a){Error.apply(this,Array.prototype.splice.call(arguments));Error.captureStackTrace(this,this.constructor);this.message=a;this.name="ProtocolError";};w.prototype=Object.create(Error.prototype);k.Factory=h;k.Protocol=c;}).call(this,"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:
  "undefined"!==typeof window?window:{},e("buffer").Buffer);},{"../log.js":7,"../serializer.js":16,"../util.js":21,buffer:30,events:66,net:29}],20:[function(e,n,k){(function(b){function a(a){h.assert(void 0!==a.url,"options.url missing");h.assert("string"===typeof a.url,"options.url must be a string");a.serializers?h.assert(Array.isArray(a.serializers),"options.serializers must be an array"):(a.serializers=[new f.JSONSerializer],f.MsgpackSerializer&&a.serializers.push(new f.MsgpackSerializer));a.protocols?
  h.assert(Array.isArray(a.protocols),"options.protocols must be an array"):(a.protocols=[],a.serializers.forEach(function(b){a.protocols.push("wamp.2."+b.SERIALIZER_ID);}));a.autoping_interval?(h.assert(0<a.autoping_interval,"options.autoping_interval must be greater than 0"),a.autoping_interval*=1E3):a.autoping_interval=1E4;a.autoping_timeout?(h.assert(0<a.autoping_timeout,"options.autoping_timeout must be greater than 0"),a.autoping_timeout*=1E3):a.autoping_timeout=5E3;a.autoping_size?h.assert(4<=
  a.autoping_size&&125>=a.autoping_size,"options.autoping_size must be between 4 and 125"):a.autoping_size=4;this._options=a;}var h=e("../util.js"),c=e("../log.js"),f=e("../serializer.js");a.prototype.type="websocket";a.prototype.create=function(){var a=this,f={protocol:void 0,serializer:void 0,send:void 0,close:void 0,onmessage:function(){},onopen:function(){},onclose:function(){}};f.info={type:"websocket",url:a._options.url,protocol:null};b.process&&b.process.versions.node&&!b.process.versions.hasOwnProperty("electron")?
  function(){var b=e("ws"),c=e("randombytes"),d={agent:a._options.agent,headers:a._options.headers};if(a._options.protocols){var h=a._options.protocols;Array.isArray(h)&&(h=h.join(","));d.protocol=h;}a._options.url.startsWith("wss://")&&(d.ca=a._options.tlsConfiguration.ca,d.cert=a._options.tlsConfiguration.cert,d.key=a._options.tlsConfiguration.key,d.rejectUnauthorized=!1);var x=new b(a._options.url,h,d);f.send=function(a){a=f.serializer.serialize(a);x.send(a,{binary:f.serializer.BINARY});};f.close=
  function(a,b){x.close();};var v,m;x.on("open",function(){m=new Date;var b=x.protocol.split(".")[2],d;for(d in a._options.serializers){var l=a._options.serializers[d];if(l.SERIALIZER_ID==b){f.serializer=l;break}}f.info.protocol=x.protocol;x.isAlive=!0;v=setInterval(function(){if(!1===x.isAlive)return clearInterval(v),x.terminate();new Date-m<a._options.autoping_interval||(x.isAlive=!1,x.ping(c(a._options.autoping_size)));},a._options.autoping_interval);f.onopen();});x.on("pong",function(){m=new Date;
  this.isAlive=!0;});x.on("message",function(a,b){m=new Date;a=f.serializer.unserialize(a);f.onmessage(a);});x.on("close",function(a,b){null!=v&&clearInterval(v);f.onclose({code:a,reason:b,wasClean:1E3===a});});x.on("error",function(a){null!=v&&clearInterval(v);f.onclose({code:1006,reason:"",wasClean:!1});});}():function(){if("WebSocket"in b){var d=a._options.protocols?new b.WebSocket(a._options.url,a._options.protocols):new b.WebSocket(a._options.url);d.binaryType="arraybuffer";}else if("MozWebSocket"in
  b)d=a._options.protocols?new b.MozWebSocket(a._options.url,a._options.protocols):new b.MozWebSocket(a._options.url);else throw "browser does not support WebSocket or WebSocket in Web workers";d.onmessage=function(a){c.debug("WebSocket transport receive",a.data);a=f.serializer.unserialize(a.data);f.onmessage(a);};d.onopen=function(){var b=d.protocol.split(".")[2],c;for(c in a._options.serializers){var h=a._options.serializers[c];if(h.SERIALIZER_ID==b){f.serializer=h;break}}f.info.protocol=d.protocol;
  f.onopen();};d.onclose=function(a){f.onclose({code:a.code,reason:a.message,wasClean:a.wasClean});};f.send=function(a){a=f.serializer.serialize(a);c.debug("WebSocket transport send",a);d.send(a);};f.close=function(a,b){d.close(a,b);};}();return f};k.Factory=a;}).call(this,"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{});},{"../log.js":7,"../serializer.js":16,"../util.js":21,randombytes:28,ws:28}],21:[function(e,n,k){(function(b){var a=e("./log.js"),
  h=e("when");k.atob=function(a){return a?new Uint8Array(atob(a).split("").map(function(a){return a.charCodeAt(0)})):null};k.btoa=function(a){return a?btoa(String.fromCharCode.apply(null,a)):null};k.btoh=function(a){if(a){for(var b="",c=0;c<a.length;++c)b+=("0"+(a[c]&255).toString(16)).slice(-2);return b}return null};k.htob=function(a){if(a){if("string"!==typeof a)throw new TypeError("Expected input to be a string");if(0!==a.length%2)throw new RangeError("Expected string to be an even number of characters");
  for(var b=new Uint8Array(a.length/2),c=0;c<a.length;c+=2)b[c/2]=parseInt(a.substring(c,c+2),16);return b}return null};var c=function(a,f){if(!a){if(c.useDebugger||"AUTOBAHN_DEBUG"in b&&AUTOBAHN_DEBUG)debugger;throw Error(f||"Assertion failed!");}},f=function(){if(0===arguments.length)return {};var a=arguments[0],b=!1,c=arguments.length;"boolean"===typeof arguments[c-1]&&(b=arguments[c-1],--c);var h=function(c){var d=r[c];c in a?b&&"object"===typeof d&&"object"===typeof a[c]&&f(a[c],d):a[c]=d;},l=1;
  for(;l<c;l++){var r=arguments[l];if(r){if("object"!==typeof r)throw Error("Expected argument at index "+l+" to be an object");Object.keys(r).forEach(h);}}return a};k.handle_error=function(a,b,c){"function"===typeof a?a(b,c):console.error(c||"Unhandled exception raised: ",b);};k.rand_normal=function(a,b){do{var c=2*Math.random()-1;var d=2*Math.random()-1;d=c*c+d*d;}while(1<=d||0==d);return (a||0)+c*Math.sqrt(-2*Math.log(d)/d)*(b||1)};k.assert=c;k.http_post=function(b,c,f){a.debug("new http_post request",
  b,c,f);var d=h.defer(),l=new XMLHttpRequest;l.withCredentials=!0;l.onreadystatechange=function(){if(4===l.readyState){var a=1223===l.status?204:l.status;200===a&&d.resolve(l.responseText);if(204===a)d.resolve();else {var b=null;try{b=l.statusText;}catch(y){}d.reject({code:a,text:b});}}};l.open("POST",b,!0);l.setRequestHeader("Content-type","application/json; charset=utf-8");0<f&&(l.timeout=f,l.ontimeout=function(){d.reject({code:501,text:"request timeout"});});c?l.send(c):l.send();return d.promise.then?
  d.promise:d};k.defaults=f;k.new_global_id=function(){return Math.floor(9007199254740992*Math.random())+1};}).call(this,"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{});},{"./log.js":7,when:117}],22:[function(e,n,k){(function(b){function a(a,b){if(a===b)return 0;for(var c=a.length,d=b.length,g=0,f=Math.min(c,d);g<f;++g)if(a[g]!==b[g]){c=a[g];d=b[g];break}return c<d?-1:d<c?1:0}function h(a){return b.Buffer&&"function"===typeof b.Buffer.isBuffer?
  b.Buffer.isBuffer(a):!(null==a||!a._isBuffer)}function c(a){return h(a)||"function"!==typeof b.ArrayBuffer?!1:"function"===typeof ArrayBuffer.isView?ArrayBuffer.isView(a):a?a instanceof DataView||a.buffer&&a.buffer instanceof ArrayBuffer?!0:!1:!1}function f(a){if(g.isFunction(a))return P?a.name:(a=a.toString().match(E))&&a[1]}function d(a,b){return "string"===typeof a?a.length<b?a:a.slice(0,b):a}function v(a){if(P||!g.isFunction(a))return g.inspect(a);a=f(a);return "[Function"+(a?": "+a:"")+"]"}function u(a,
  b,c,d,g){throw new J.AssertionError({message:c,actual:a,expected:b,operator:d,stackStartFunction:g});}function w(a,b){a||u(a,!0,b,"==",J.ok);}function l(b,d,f,l){if(b===d)return !0;if(h(b)&&h(d))return 0===a(b,d);if(g.isDate(b)&&g.isDate(d))return b.getTime()===d.getTime();if(g.isRegExp(b)&&g.isRegExp(d))return b.source===d.source&&b.global===d.global&&b.multiline===d.multiline&&b.lastIndex===d.lastIndex&&b.ignoreCase===d.ignoreCase;if(null!==b&&"object"===typeof b||null!==d&&"object"===typeof d){if(!c(b)||
  !c(d)||Object.prototype.toString.call(b)!==Object.prototype.toString.call(d)||b instanceof Float32Array||b instanceof Float64Array){if(h(b)!==h(d))return !1;l=l||{actual:[],expected:[]};var q=l.actual.indexOf(b);if(-1!==q&&q===l.expected.indexOf(d))return !0;l.actual.push(b);l.expected.push(d);return x(b,d,f,l)}return 0===a(new Uint8Array(b.buffer),new Uint8Array(d.buffer))}return f?b===d:b==d}function r(a){return "[object Arguments]"==Object.prototype.toString.call(a)}function x(a,b,c,d){if(null===
  a||void 0===a||null===b||void 0===b)return !1;if(g.isPrimitive(a)||g.isPrimitive(b))return a===b;if(c&&Object.getPrototypeOf(a)!==Object.getPrototypeOf(b))return !1;var f=r(a),q=r(b);if(f&&!q||!f&&q)return !1;if(f)return a=M.call(a),b=M.call(b),l(a,b,c);f=F(a);var m=F(b);if(f.length!==m.length)return !1;f.sort();m.sort();for(q=f.length-1;0<=q;q--)if(f[q]!==m[q])return !1;for(q=f.length-1;0<=q;q--)if(m=f[q],!l(a[m],b[m],c,d))return !1;return !0}function k(a,b,c){l(a,b,!0)&&u(a,b,c,"notDeepStrictEqual",k);}
  function m(a,b){if(!a||!b)return !1;if("[object RegExp]"==Object.prototype.toString.call(b))return b.test(a);try{if(a instanceof b)return !0}catch(K){}return Error.isPrototypeOf(b)?!1:!0===b.call({},a)}function B(a,b,c,d){if("function"!==typeof b)throw new TypeError('"block" argument must be a function');"string"===typeof c&&(d=c,c=null);try{b();}catch(t){var f=t;}b=f;d=(c&&c.name?" ("+c.name+").":".")+(d?" "+d:".");a&&!b&&u(b,c,"Missing expected exception"+d);f="string"===typeof d;var l=!a&&g.isError(b),
  q=!a&&b&&!c;(l&&f&&m(b,c)||q)&&u(b,c,"Got unwanted exception"+d);if(a&&b&&c&&!m(b,c)||!a&&b)throw b;}var g=e("util/"),q=Object.prototype.hasOwnProperty,M=Array.prototype.slice,P=function(){return "foo"===function(){}.name}(),J=n.exports=w,E=/\s*function\s+([^\(\s]*)\s*/;J.AssertionError=function(a){this.name="AssertionError";this.actual=a.actual;this.expected=a.expected;this.operator=a.operator;a.message?(this.message=a.message,this.generatedMessage=!1):(this.message=d(v(this.actual),128)+" "+this.operator+
  " "+d(v(this.expected),128),this.generatedMessage=!0);var b=a.stackStartFunction||u;Error.captureStackTrace?Error.captureStackTrace(this,b):(a=Error(),a.stack&&(a=a.stack,b=f(b),b=a.indexOf("\n"+b),0<=b&&(b=a.indexOf("\n",b+1),a=a.substring(b+1)),this.stack=a));};g.inherits(J.AssertionError,Error);J.fail=u;J.ok=w;J.equal=function(a,b,c){a!=b&&u(a,b,c,"==",J.equal);};J.notEqual=function(a,b,c){a==b&&u(a,b,c,"!=",J.notEqual);};J.deepEqual=function(a,b,c){l(a,b,!1)||u(a,b,c,"deepEqual",J.deepEqual);};J.deepStrictEqual=
  function(a,b,c){l(a,b,!0)||u(a,b,c,"deepStrictEqual",J.deepStrictEqual);};J.notDeepEqual=function(a,b,c){l(a,b,!1)&&u(a,b,c,"notDeepEqual",J.notDeepEqual);};J.notDeepStrictEqual=k;J.strictEqual=function(a,b,c){a!==b&&u(a,b,c,"===",J.strictEqual);};J.notStrictEqual=function(a,b,c){a===b&&u(a,b,c,"!==",J.notStrictEqual);};J.throws=function(a,b,c){B(!0,a,b,c);};J.doesNotThrow=function(a,b,c){B(!1,a,b,c);};J.ifError=function(a){if(a)throw a;};var F=Object.keys||function(a){var b=[],c;for(c in a)q.call(a,c)&&
  b.push(c);return b};}).call(this,"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{});},{"util/":25}],23:[function(e,n,k){n.exports="function"===typeof Object.create?function(b,a){b.super_=a;b.prototype=Object.create(a.prototype,{constructor:{value:b,enumerable:!1,writable:!0,configurable:!0}});}:function(b,a){b.super_=a;var h=function(){};h.prototype=a.prototype;b.prototype=new h;b.prototype.constructor=b;};},{}],24:[function(e,n,k){n.exports=function(b){return b&&
  "object"===typeof b&&"function"===typeof b.copy&&"function"===typeof b.fill&&"function"===typeof b.readUInt8};},{}],25:[function(e,n,k){(function(b,a){function h(a,b){var d={seen:[],stylize:f};3<=arguments.length&&(d.depth=arguments[2]);4<=arguments.length&&(d.colors=arguments[3]);m(b)?d.showHidden=b:b&&k._extend(d,b);q(d.showHidden)&&(d.showHidden=!1);q(d.depth)&&(d.depth=2);q(d.colors)&&(d.colors=!1);q(d.customInspect)&&(d.customInspect=!0);d.colors&&(d.stylize=c);return v(d,a,d.depth)}function c(a,
  b){return (b=h.styles[b])?"\u001b["+h.colors[b][0]+"m"+a+"\u001b["+h.colors[b][1]+"m":a}function f(a,b){return a}function d(a){var b={};a.forEach(function(a,c){b[a]=!0;});return b}function v(a,b,c){if(a.customInspect&&b&&F(b.inspect)&&b.inspect!==k.inspect&&(!b.constructor||b.constructor.prototype!==b)){var p=b.inspect(c,a);g(p)||(p=v(a,p,c));return p}if(p=u(a,b))return p;var t=Object.keys(b),f=d(t);a.showHidden&&(t=Object.getOwnPropertyNames(b));if(E(b)&&(0<=t.indexOf("message")||0<=t.indexOf("description")))return w(b);
  if(0===t.length){if(F(b))return a.stylize("[Function"+(b.name?": "+b.name:"")+"]","special");if(M(b))return a.stylize(RegExp.prototype.toString.call(b),"regexp");if(J(b))return a.stylize(Date.prototype.toString.call(b),"date");if(E(b))return w(b)}p="";var q=!1,m=["{","}"];y(b)&&(q=!0,m=["[","]"]);F(b)&&(p=" [Function"+(b.name?": "+b.name:"")+"]");M(b)&&(p=" "+RegExp.prototype.toString.call(b));J(b)&&(p=" "+Date.prototype.toUTCString.call(b));E(b)&&(p=" "+w(b));if(0===t.length&&(!q||0==b.length))return m[0]+
  p+m[1];if(0>c)return M(b)?a.stylize(RegExp.prototype.toString.call(b),"regexp"):a.stylize("[Object]","special");a.seen.push(b);t=q?l(a,b,c,f,t):t.map(function(d){return r(a,b,c,f,d,q)});a.seen.pop();return x(t,p,m)}function u(a,b){if(q(b))return a.stylize("undefined","undefined");if(g(b))return b="'"+JSON.stringify(b).replace(/^"|"$/g,"").replace(/'/g,"\\'").replace(/\\"/g,'"')+"'",a.stylize(b,"string");if(B(b))return a.stylize(""+b,"number");if(m(b))return a.stylize(""+b,"boolean");if(null===b)return a.stylize("null",
  "null")}function w(a){return "["+Error.prototype.toString.call(a)+"]"}function l(a,b,c,d,g){for(var p=[],t=0,f=b.length;t<f;++t)Object.prototype.hasOwnProperty.call(b,String(t))?p.push(r(a,b,c,d,String(t),!0)):p.push("");g.forEach(function(t){t.match(/^\d+$/)||p.push(r(a,b,c,d,t,!0));});return p}function r(a,b,c,d,g,f){var p,t;b=Object.getOwnPropertyDescriptor(b,g)||{value:b[g]};b.get?t=b.set?a.stylize("[Getter/Setter]","special"):a.stylize("[Getter]","special"):b.set&&(t=a.stylize("[Setter]","special"));
  Object.prototype.hasOwnProperty.call(d,g)||(p="["+g+"]");t||(0>a.seen.indexOf(b.value)?(t=null===c?v(a,b.value,null):v(a,b.value,c-1),-1<t.indexOf("\n")&&(t=f?t.split("\n").map(function(a){return "  "+a}).join("\n").substr(2):"\n"+t.split("\n").map(function(a){return "   "+a}).join("\n"))):t=a.stylize("[Circular]","special"));if(q(p)){if(f&&g.match(/^\d+$/))return t;p=JSON.stringify(""+g);p.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)?(p=p.substr(1,p.length-2),p=a.stylize(p,"name")):(p=p.replace(/'/g,"\\'").replace(/\\"/g,
  '"').replace(/(^"|"$)/g,"'"),p=a.stylize(p,"string"));}return p+": "+t}function x(a,b,c){var d=0;return 60<a.reduce(function(a,b){d++;0<=b.indexOf("\n")&&d++;return a+b.replace(/\u001b\[\d\d?m/g,"").length+1},0)?c[0]+(""===b?"":b+"\n ")+" "+a.join(",\n  ")+" "+c[1]:c[0]+b+" "+a.join(", ")+" "+c[1]}function y(a){return Array.isArray(a)}function m(a){return "boolean"===typeof a}function B(a){return "number"===typeof a}function g(a){return "string"===typeof a}function q(a){return void 0===a}function M(a){return n(a)&&
  "[object RegExp]"===Object.prototype.toString.call(a)}function n(a){return "object"===typeof a&&null!==a}function J(a){return n(a)&&"[object Date]"===Object.prototype.toString.call(a)}function E(a){return n(a)&&("[object Error]"===Object.prototype.toString.call(a)||a instanceof Error)}function F(a){return "function"===typeof a}function G(a){return 10>a?"0"+a.toString(10):a.toString(10)}function A(){var a=new Date,b=[G(a.getHours()),G(a.getMinutes()),G(a.getSeconds())].join(":");return [a.getDate(),X[a.getMonth()],
  b].join(" ")}var K=/%[sdj%]/g;k.format=function(a){if(!g(a)){for(var b=[],c=0;c<arguments.length;c++)b.push(h(arguments[c]));return b.join(" ")}c=1;var d=arguments,f=d.length;b=String(a).replace(K,function(a){if("%%"===a)return "%";if(c>=f)return a;switch(a){case "%s":return String(d[c++]);case "%d":return Number(d[c++]);case "%j":try{return JSON.stringify(d[c++])}catch(da){return "[Circular]"}default:return a}});for(var l=d[c];c<f;l=d[++c])b=null!==l&&n(l)?b+(" "+h(l)):b+(" "+l);return b};k.deprecate=
  function(c,d){if(q(a.process))return function(){return k.deprecate(c,d).apply(this,arguments)};if(!0===b.noDeprecation)return c;var p=!1;return function(){if(!p){if(b.throwDeprecation)throw Error(d);b.traceDeprecation?console.trace(d):console.error(d);p=!0;}return c.apply(this,arguments)}};var N={},C;k.debuglog=function(a){q(C)&&(C=b.env.NODE_DEBUG||"");a=a.toUpperCase();if(!N[a])if((new RegExp("\\b"+a+"\\b","i")).test(C)){var c=b.pid;N[a]=function(){var b=k.format.apply(k,arguments);console.error("%s %d: %s",
  a,c,b);};}else N[a]=function(){};return N[a]};k.inspect=h;h.colors={bold:[1,22],italic:[3,23],underline:[4,24],inverse:[7,27],white:[37,39],grey:[90,39],black:[30,39],blue:[34,39],cyan:[36,39],green:[32,39],magenta:[35,39],red:[31,39],yellow:[33,39]};h.styles={special:"cyan",number:"yellow","boolean":"yellow",undefined:"grey","null":"bold",string:"green",date:"magenta",regexp:"red"};k.isArray=y;k.isBoolean=m;k.isNull=function(a){return null===a};k.isNullOrUndefined=function(a){return null==a};k.isNumber=
  B;k.isString=g;k.isSymbol=function(a){return "symbol"===typeof a};k.isUndefined=q;k.isRegExp=M;k.isObject=n;k.isDate=J;k.isError=E;k.isFunction=F;k.isPrimitive=function(a){return null===a||"boolean"===typeof a||"number"===typeof a||"string"===typeof a||"symbol"===typeof a||"undefined"===typeof a};k.isBuffer=e("./support/isBuffer");var X="Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");k.log=function(){console.log("%s - %s",A(),k.format.apply(k,arguments));};k.inherits=e("inherits");k._extend=
  function(a,b){if(!b||!n(b))return a;for(var c=Object.keys(b),d=c.length;d--;)a[c[d]]=b[c[d]];return a};}).call(this,e("_process"),"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{});},{"./support/isBuffer":24,_process:76,inherits:23}],26:[function(e,n,k){function b(a){var b=a.length;if(0<b%4)throw Error("Invalid string. Length must be a multiple of 4");a=a.indexOf("=");-1===a&&(a=b);return [a,a===b?0:4-a%4]}function a(a,b,c){for(var d=[],f=b;f<c;f+=
  3)b=(a[f]<<16&16711680)+(a[f+1]<<8&65280)+(a[f+2]&255),d.push(h[b>>18&63]+h[b>>12&63]+h[b>>6&63]+h[b&63]);return d.join("")}k.byteLength=function(a){a=b(a);var c=a[1];return 3*(a[0]+c)/4-c};k.toByteArray=function(a){var d=b(a);var h=d[0];d=d[1];for(var e=new f(3*(h+d)/4-d),l=0,r=0<d?h-4:h,x=0;x<r;x+=4)h=c[a.charCodeAt(x)]<<18|c[a.charCodeAt(x+1)]<<12|c[a.charCodeAt(x+2)]<<6|c[a.charCodeAt(x+3)],e[l++]=h>>16&255,e[l++]=h>>8&255,e[l++]=h&255;2===d&&(h=c[a.charCodeAt(x)]<<2|c[a.charCodeAt(x+1)]>>4,e[l++]=
  h&255);1===d&&(h=c[a.charCodeAt(x)]<<10|c[a.charCodeAt(x+1)]<<4|c[a.charCodeAt(x+2)]>>2,e[l++]=h>>8&255,e[l++]=h&255);return e};k.fromByteArray=function(b){for(var c=b.length,d=c%3,f=[],l=0,e=c-d;l<e;l+=16383)f.push(a(b,l,l+16383>e?e:l+16383));1===d?(b=b[c-1],f.push(h[b>>2]+h[b<<4&63]+"==")):2===d&&(b=(b[c-2]<<8)+b[c-1],f.push(h[b>>10]+h[b>>4&63]+h[b<<2&63]+"="));return f.join("")};var h=[],c=[],f="undefined"!==typeof Uint8Array?Uint8Array:Array;for(e=0;64>e;++e)h[e]="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[e],
  c["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charCodeAt(e)]=e;c[45]=62;c[95]=63;},{}],27:[function(e,n,k){function b(c){if(!(this instanceof b))return new b(c);this._bufs=[];this.length=0;if("function"==typeof c){this._callback=c;var f=function(a){this._callback&&(this._callback(a),this._callback=null);}.bind(this);this.on("pipe",function(a){a.on("error",f);});this.on("unpipe",function(a){a.removeListener("error",f);});}else this.append(c);a.call(this);}var a=e("readable-stream").Duplex;
  k=e("util");var h=e("safe-buffer").Buffer;k.inherits(b,a);b.prototype._offset=function(a){var b=0,c=0;if(0===a)return [0,0];for(;c<this._bufs.length;c++){var h=b+this._bufs[c].length;if(a<h||c==this._bufs.length-1)return [c,a-b];b=h;}};b.prototype._reverseOffset=function(a){var b=a[0];a=a[1];for(var c=0;c<b;c++)a+=this._bufs[c].length;return a};b.prototype.append=function(a){var c=0;if(h.isBuffer(a))this._appendBuffer(a);else if(Array.isArray(a))for(;c<a.length;c++)this.append(a[c]);else if(a instanceof
  b)for(;c<a._bufs.length;c++)this.append(a._bufs[c]);else null!=a&&("number"==typeof a&&(a=a.toString()),this._appendBuffer(h.from(a)));return this};b.prototype._appendBuffer=function(a){this._bufs.push(a);this.length+=a.length;};b.prototype._write=function(a,b,d){this._appendBuffer(a);"function"==typeof d&&d();};b.prototype._read=function(a){if(!this.length)return this.push(null);a=Math.min(a,this.length);this.push(this.slice(0,a));this.consume(a);};b.prototype.end=function(b){a.prototype.end.call(this,
  b);this._callback&&(this._callback(null,this.slice()),this._callback=null);};b.prototype.get=function(a){if(!(a>this.length||0>a))return a=this._offset(a),this._bufs[a[0]][a[1]]};b.prototype.slice=function(a,b){"number"==typeof a&&0>a&&(a+=this.length);"number"==typeof b&&0>b&&(b+=this.length);return this.copy(null,0,a,b)};b.prototype.copy=function(a,b,d,e){if("number"!=typeof d||0>d)d=0;if("number"!=typeof e||e>this.length)e=this.length;if(d>=this.length||0>=e)return a||h.alloc(0);var c=!!a,f=this._offset(d),
  l=e-d,r=l,x=c&&b||0,v=f[1];if(0===d&&e==this.length){if(!c)return 1===this._bufs.length?this._bufs[0]:h.concat(this._bufs,this.length);for(d=0;d<this._bufs.length;d++)this._bufs[d].copy(a,x),x+=this._bufs[d].length;return a}if(r<=this._bufs[f[0]].length-v)return c?this._bufs[f[0]].copy(a,b,v,v+r):this._bufs[f[0]].slice(v,v+r);c||(a=h.allocUnsafe(l));for(d=f[0];d<this._bufs.length;d++){b=this._bufs[d].length-v;if(r>b)this._bufs[d].copy(a,x,v);else {this._bufs[d].copy(a,x,v,v+r);break}x+=b;r-=b;v&&(v=
  0);}return a};b.prototype.shallowSlice=function(a,f){a=a||0;f=f||this.length;0>a&&(a+=this.length);0>f&&(f+=this.length);a=this._offset(a);f=this._offset(f);var c=this._bufs.slice(a[0],f[0]+1);0==f[1]?c.pop():c[c.length-1]=c[c.length-1].slice(0,f[1]);0!=a[1]&&(c[0]=c[0].slice(a[1]));return new b(c)};b.prototype.toString=function(a,b,d){return this.slice(b,d).toString(a)};b.prototype.consume=function(a){for(;this._bufs.length;)if(a>=this._bufs[0].length)a-=this._bufs[0].length,this.length-=this._bufs[0].length,
  this._bufs.shift();else {this._bufs[0]=this._bufs[0].slice(a);this.length-=a;break}return this};b.prototype.duplicate=function(){for(var a=0,f=new b;a<this._bufs.length;a++)f.append(this._bufs[a]);return f};b.prototype.destroy=function(){this.length=this._bufs.length=0;this.push(null);};b.prototype.indexOf=function(a,f,d){void 0===d&&"string"===typeof f&&(d=f,f=void 0);if("function"===typeof a||Array.isArray(a))throw new TypeError('The "value" argument must be one of type string, Buffer, BufferList, or Uint8Array.');
  "number"===typeof a?a=h.from([a]):"string"===typeof a?a=h.from(a,d):a instanceof b?a=a.slice():h.isBuffer(a)||(a=h.from(a));f=Number(f||0);isNaN(f)&&(f=0);0>f&&(f=this.length+f);0>f&&(f=0);if(0===a.length)return f>this.length?this.length:f;d=this._offset(f);f=d[0];var c=d[1];for(f;f<this._bufs.length;f++){for(d=this._bufs[f];c<d.length;)if(d.length-c>=a.length){c=d.indexOf(a,c);if(-1!==c)return this._reverseOffset([f,c]);c=d.length-a.length+1;}else {var e=this._reverseOffset([f,c]);if(this._match(e,
  a))return e;c++;}c=0;}return -1};b.prototype._match=function(a,b){if(this.length-a<b.length)return !1;for(var c=0;c<b.length;c++)if(this.get(a+c)!==b[c])return !1;return !0};(function(){var a={readDoubleBE:8,readDoubleLE:8,readFloatBE:4,readFloatLE:4,readInt32BE:4,readInt32LE:4,readUInt32BE:4,readUInt32LE:4,readInt16BE:2,readInt16LE:2,readUInt16BE:2,readUInt16LE:2,readInt8:1,readUInt8:1,readIntBE:null,readIntLE:null,readUIntBE:null,readUIntLE:null},f;for(f in a)(function(c){b.prototype[c]=null===a[c]?function(a,
  b){return this.slice(a,a+b)[c](0,b)}:function(b){return this.slice(b,b+a[c])[c](0)};})(f);})();n.exports=b;},{"readable-stream":85,"safe-buffer":86,util:92}],28:[function(e,n,k){},{}],29:[function(e,n,k){arguments[4][28][0].apply(k,arguments);},{dup:28}],30:[function(e,n,k){function b(b){if(b>C)throw new RangeError('The value "'+b+'" is invalid for option "size"');b=new Uint8Array(b);b.__proto__=a.prototype;return b}function a(a,b,c){if("number"===typeof a){if("string"===typeof b)throw new TypeError('The "string" argument must be of type string. Received type number');
  return f(a)}return h(a,b,c)}function h(c,p,g){if("string"===typeof c){var t=p;if("string"!==typeof t||""===t)t="utf8";if(!a.isEncoding(t))throw new TypeError("Unknown encoding: "+t);p=w(c,t)|0;g=b(p);c=g.write(c,t);c!==p&&(g=g.slice(0,c));return g}if(ArrayBuffer.isView(c))return d(c);if(null==c)throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type "+typeof c);if(A(c,ArrayBuffer)||c&&A(c.buffer,ArrayBuffer)){if(0>p||c.byteLength<
  p)throw new RangeError('"offset" is outside of buffer bounds');if(c.byteLength<p+(g||0))throw new RangeError('"length" is outside of buffer bounds');c=void 0===p&&void 0===g?new Uint8Array(c):void 0===g?new Uint8Array(c,p):new Uint8Array(c,p,g);c.__proto__=a.prototype;return c}if("number"===typeof c)throw new TypeError('The "value" argument must not be of type number. Received type number');t=c.valueOf&&c.valueOf();if(null!=t&&t!==c)return a.from(t,p,g);if(t=v(c))return t;$jscomp.initSymbol();$jscomp.initSymbol();
  $jscomp.initSymbol();if("undefined"!==typeof Symbol&&null!=Symbol.toPrimitive&&"function"===typeof c[Symbol.toPrimitive])return $jscomp.initSymbol(),a.from(c[Symbol.toPrimitive]("string"),p,g);throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type "+typeof c);}function c(a){if("number"!==typeof a)throw new TypeError('"size" argument must be of type number');if(0>a)throw new RangeError('The value "'+a+'" is invalid for option "size"');
  }function f(a){c(a);return b(0>a?0:u(a)|0)}function d(a){for(var c=0>a.length?0:u(a.length)|0,d=b(c),g=0;g<c;g+=1)d[g]=a[g]&255;return d}function v(c){if(a.isBuffer(c)){var p=u(c.length)|0,g=b(p);if(0===g.length)return g;c.copy(g,0,0,p);return g}if(void 0!==c.length)return (p="number"!==typeof c.length)||(p=c.length,p=p!==p),p?b(0):d(c);if("Buffer"===c.type&&Array.isArray(c.data))return d(c.data)}function u(a){if(a>=C)throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x"+C.toString(16)+
  " bytes");return a|0}function w(b,c){if(a.isBuffer(b))return b.length;if(ArrayBuffer.isView(b)||A(b,ArrayBuffer))return b.byteLength;if("string"!==typeof b)throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type '+typeof b);var d=b.length,p=2<arguments.length&&!0===arguments[2];if(!p&&0===d)return 0;for(var g=!1;;)switch(c){case "ascii":case "latin1":case "binary":return d;case "utf8":case "utf-8":return E(b).length;case "ucs2":case "ucs-2":case "utf16le":case "utf-16le":return 2*
  d;case "hex":return d>>>1;case "base64":return K.toByteArray(J(b)).length;default:if(g)return p?-1:E(b).length;c=(""+c).toLowerCase();g=!0;}}function l(a,b,c){var d=!1;if(void 0===b||0>b)b=0;if(b>this.length)return "";if(void 0===c||c>this.length)c=this.length;if(0>=c)return "";c>>>=0;b>>>=0;if(c<=b)return "";for(a||(a="utf8");;)switch(a){case "hex":a=b;b=c;c=this.length;if(!a||0>a)a=0;if(!b||0>b||b>c)b=c;d="";for(c=a;c<b;++c)a=d,d=this[c],d=16>d?"0"+d.toString(16):d.toString(16),d=a+d;return d;case "utf8":case "utf-8":return m(this,
  b,c);case "ascii":a="";for(c=Math.min(this.length,c);b<c;++b)a+=String.fromCharCode(this[b]&127);return a;case "latin1":case "binary":a="";for(c=Math.min(this.length,c);b<c;++b)a+=String.fromCharCode(this[b]);return a;case "base64":return b=0===b&&c===this.length?K.fromByteArray(this):K.fromByteArray(this.slice(b,c)),b;case "ucs2":case "ucs-2":case "utf16le":case "utf-16le":b=this.slice(b,c);c="";for(a=0;a<b.length;a+=2)c+=String.fromCharCode(b[a]+256*b[a+1]);return c;default:if(d)throw new TypeError("Unknown encoding: "+
  a);a=(a+"").toLowerCase();d=!0;}}function r(a,b,c){var d=a[b];a[b]=a[c];a[c]=d;}function x(b,c,d,g,f){if(0===b.length)return -1;"string"===typeof d?(g=d,d=0):2147483647<d?d=2147483647:-2147483648>d&&(d=-2147483648);d=+d;d!==d&&(d=f?0:b.length-1);0>d&&(d=b.length+d);if(d>=b.length){if(f)return -1;d=b.length-1;}else if(0>d)if(f)d=0;else return -1;"string"===typeof c&&(c=a.from(c,g));if(a.isBuffer(c))return 0===c.length?-1:y(b,c,d,g,f);if("number"===typeof c)return c&=255,"function"===typeof Uint8Array.prototype.indexOf?
  f?Uint8Array.prototype.indexOf.call(b,c,d):Uint8Array.prototype.lastIndexOf.call(b,c,d):y(b,[c],d,g,f);throw new TypeError("val must be string, number or Buffer");}function y(a,b,c,d,g){function p(a,b){return 1===f?a[b]:a.readUInt16BE(b*f)}var f=1,l=a.length,t=b.length;if(void 0!==d&&(d=String(d).toLowerCase(),"ucs2"===d||"ucs-2"===d||"utf16le"===d||"utf-16le"===d)){if(2>a.length||2>b.length)return -1;f=2;l/=2;t/=2;c/=2;}if(g)for(d=-1;c<l;c++)if(p(a,c)===p(b,-1===d?0:c-d)){if(-1===d&&(d=c),c-d+1===
  t)return d*f}else -1!==d&&(c-=c-d),d=-1;else for(c+t>l&&(c=l-t);0<=c;c--){l=!0;for(d=0;d<t;d++)if(p(a,c+d)!==p(b,d)){l=!1;break}if(l)return c}return -1}function m(a,b,c){c=Math.min(a.length,c);for(var d=[];b<c;){var p=a[b],g=null,f=239<p?4:223<p?3:191<p?2:1;if(b+f<=c)switch(f){case 1:128>p&&(g=p);break;case 2:var l=a[b+1];128===(l&192)&&(p=(p&31)<<6|l&63,127<p&&(g=p));break;case 3:l=a[b+1];var q=a[b+2];128===(l&192)&&128===(q&192)&&(p=(p&15)<<12|(l&63)<<6|q&63,2047<p&&(55296>p||57343<p)&&(g=p));break;
  case 4:l=a[b+1];q=a[b+2];var t=a[b+3];128===(l&192)&&128===(q&192)&&128===(t&192)&&(p=(p&15)<<18|(l&63)<<12|(q&63)<<6|t&63,65535<p&&1114112>p&&(g=p));}null===g?(g=65533,f=1):65535<g&&(g-=65536,d.push(g>>>10&1023|55296),g=56320|g&1023);d.push(g);b+=f;}a=d.length;if(a<=X)d=String.fromCharCode.apply(String,d);else {c="";for(b=0;b<a;)c+=String.fromCharCode.apply(String,d.slice(b,b+=X));d=c;}return d}function B(a,b,c){if(0!==a%1||0>a)throw new RangeError("offset is not uint");if(a+b>c)throw new RangeError("Trying to access beyond buffer length");
  }function g(b,c,d,g,f,l){if(!a.isBuffer(b))throw new TypeError('"buffer" argument must be a Buffer instance');if(c>f||c<l)throw new RangeError('"value" argument is out of bounds');if(d+g>b.length)throw new RangeError("Index out of range");}function q(a,b,c,d,g,f){if(c+d>a.length)throw new RangeError("Index out of range");if(0>c)throw new RangeError("Index out of range");}function M(a,b,c,d,g){b=+b;c>>>=0;g||q(a,b,c,4);N.write(a,b,c,d,23,4);return c+4}function P(a,
  b,c,d,g){b=+b;c>>>=0;g||q(a,b,c,8);N.write(a,b,c,d,52,8);return c+8}function J(a){a=a.split("=")[0];a=a.trim().replace(z,"");if(2>a.length)return "";for(;0!==a.length%4;)a+="=";return a}function E(a,b){b=b||Infinity;for(var c,d=a.length,g=null,p=[],f=0;f<d;++f){c=a.charCodeAt(f);if(55295<c&&57344>c){if(!g){if(56319<c){-1<(b-=3)&&p.push(239,191,189);continue}else if(f+1===d){-1<(b-=3)&&p.push(239,191,189);continue}g=c;continue}if(56320>c){-1<(b-=3)&&p.push(239,
  191,189);g=c;continue}c=(g-55296<<10|c-56320)+65536;}else g&&-1<(b-=3)&&p.push(239,191,189);g=null;if(128>c){if(0>--b)break;p.push(c);}else if(2048>c){if(0>(b-=2))break;p.push(c>>6|192,c&63|128);}else if(65536>c){if(0>(b-=3))break;p.push(c>>12|224,c>>6&63|128,c&63|128);}else if(1114112>c){if(0>(b-=4))break;p.push(c>>18|240,c>>12&63|128,c>>6&63|128,c&63|128);}else throw Error("Invalid code point");}return p}function F(a){for(var b=[],c=0;c<a.length;++c)b.push(a.charCodeAt(c)&255);return b}function G(a,
  b,c,d){for(var g=0;g<d&&!(g+c>=b.length||g>=a.length);++g)b[g+c]=a[g];return g}function A(a,b){return a instanceof b||null!=a&&null!=a.constructor&&null!=a.constructor.name&&a.constructor.name===b.name}var K=e("base64-js"),N=e("ieee754");k.Buffer=a;k.SlowBuffer=function(b){+b!=b&&(b=0);return a.alloc(+b)};k.INSPECT_MAX_BYTES=50;var C=2147483647;k.kMaxLength=C;a.TYPED_ARRAY_SUPPORT=function(){try{var a=new Uint8Array(1);a.__proto__={__proto__:Uint8Array.prototype,foo:function(){return 42}};return 42===
  a.foo()}catch(p){return !1}}();a.TYPED_ARRAY_SUPPORT||"undefined"===typeof console||"function"!==typeof console.error||console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.");Object.defineProperty(a.prototype,"parent",{enumerable:!0,get:function(){if(a.isBuffer(this))return this.buffer}});Object.defineProperty(a.prototype,"offset",{enumerable:!0,get:function(){if(a.isBuffer(this))return this.byteOffset}});
  $jscomp.initSymbol();$jscomp.initSymbol();$jscomp.initSymbol();"undefined"!==typeof Symbol&&null!=Symbol.species&&a[Symbol.species]===a&&($jscomp.initSymbol(),Object.defineProperty(a,Symbol.species,{value:null,configurable:!0,enumerable:!1,writable:!1}));a.poolSize=8192;a.from=function(a,b,c){return h(a,b,c)};a.prototype.__proto__=Uint8Array.prototype;a.__proto__=Uint8Array;a.alloc=function(a,d,g){c(a);a=0>=a?b(a):void 0!==d?"string"===typeof g?b(a).fill(d,g):b(a).fill(d):b(a);return a};a.allocUnsafe=
  function(a){return f(a)};a.allocUnsafeSlow=function(a){return f(a)};a.isBuffer=function(b){return null!=b&&!0===b._isBuffer&&b!==a.prototype};a.compare=function(b,c){A(b,Uint8Array)&&(b=a.from(b,b.offset,b.byteLength));A(c,Uint8Array)&&(c=a.from(c,c.offset,c.byteLength));if(!a.isBuffer(b)||!a.isBuffer(c))throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');if(b===c)return 0;for(var d=b.length,g=c.length,p=0,f=Math.min(d,g);p<f;++p)if(b[p]!==c[p]){d=b[p];g=c[p];
  break}return d<g?-1:g<d?1:0};a.isEncoding=function(a){switch(String(a).toLowerCase()){case "hex":case "utf8":case "utf-8":case "ascii":case "latin1":case "binary":case "base64":case "ucs2":case "ucs-2":case "utf16le":case "utf-16le":return !0;default:return !1}};a.concat=function(b,c){if(!Array.isArray(b))throw new TypeError('"list" argument must be an Array of Buffers');if(0===b.length)return a.alloc(0);var d;if(void 0===c)for(d=c=0;d<b.length;++d)c+=b[d].length;c=a.allocUnsafe(c);var g=0;for(d=0;d<
  b.length;++d){var p=b[d];A(p,Uint8Array)&&(p=a.from(p));if(!a.isBuffer(p))throw new TypeError('"list" argument must be an Array of Buffers');p.copy(c,g);g+=p.length;}return c};a.byteLength=w;a.prototype._isBuffer=!0;a.prototype.swap16=function(){var a=this.length;if(0!==a%2)throw new RangeError("Buffer size must be a multiple of 16-bits");for(var b=0;b<a;b+=2)r(this,b,b+1);return this};a.prototype.swap32=function(){var a=this.length;if(0!==a%4)throw new RangeError("Buffer size must be a multiple of 32-bits");
  for(var b=0;b<a;b+=4)r(this,b,b+3),r(this,b+1,b+2);return this};a.prototype.swap64=function(){var a=this.length;if(0!==a%8)throw new RangeError("Buffer size must be a multiple of 64-bits");for(var b=0;b<a;b+=8)r(this,b,b+7),r(this,b+1,b+6),r(this,b+2,b+5),r(this,b+3,b+4);return this};a.prototype.toString=function(){var a=this.length;return 0===a?"":0===arguments.length?m(this,0,a):l.apply(this,arguments)};a.prototype.toLocaleString=a.prototype.toString;a.prototype.equals=function(b){if(!a.isBuffer(b))throw new TypeError("Argument must be a Buffer");
  return this===b?!0:0===a.compare(this,b)};a.prototype.inspect=function(){var a=k.INSPECT_MAX_BYTES;var b=this.toString("hex",0,a).replace(/(.{2})/g,"$1 ").trim();this.length>a&&(b+=" ... ");return "<Buffer "+b+">"};a.prototype.compare=function(b,c,d,g,f){A(b,Uint8Array)&&(b=a.from(b,b.offset,b.byteLength));if(!a.isBuffer(b))throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type '+typeof b);void 0===c&&(c=0);void 0===d&&(d=b?b.length:0);void 0===g&&(g=0);
  void 0===f&&(f=this.length);if(0>c||d>b.length||0>g||f>this.length)throw new RangeError("out of range index");if(g>=f&&c>=d)return 0;if(g>=f)return -1;if(c>=d)return 1;c>>>=0;d>>>=0;g>>>=0;f>>>=0;if(this===b)return 0;var p=f-g,l=d-c,q=Math.min(p,l);g=this.slice(g,f);b=b.slice(c,d);for(c=0;c<q;++c)if(g[c]!==b[c]){p=g[c];l=b[c];break}return p<l?-1:l<p?1:0};a.prototype.includes=function(a,b,c){return -1!==this.indexOf(a,b,c)};a.prototype.indexOf=function(a,b,c){return x(this,a,b,c,!0)};a.prototype.lastIndexOf=
  function(a,b,c){return x(this,a,b,c,!1)};a.prototype.write=function(a,b,c,d){if(void 0===b)d="utf8",c=this.length,b=0;else if(void 0===c&&"string"===typeof b)d=b,c=this.length,b=0;else if(isFinite(b))b>>>=0,isFinite(c)?(c>>>=0,void 0===d&&(d="utf8")):(d=c,c=void 0);else throw Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");var g=this.length-b;if(void 0===c||c>g)c=g;if(0<a.length&&(0>c||0>b)||b>this.length)throw new RangeError("Attempt to write outside buffer bounds");
  d||(d="utf8");for(g=!1;;)switch(d){case "hex":a:{b=Number(b)||0;d=this.length-b;c?(c=Number(c),c>d&&(c=d)):c=d;d=a.length;c>d/2&&(c=d/2);for(d=0;d<c;++d){g=parseInt(a.substr(2*d,2),16);if(g!==g){a=d;break a}this[b+d]=g;}a=d;}return a;case "utf8":case "utf-8":return G(E(a,this.length-b),this,b,c);case "ascii":return G(F(a),this,b,c);case "latin1":case "binary":return G(F(a),this,b,c);case "base64":return G(K.toByteArray(J(a)),this,b,c);case "ucs2":case "ucs-2":case "utf16le":case "utf-16le":d=a;g=this.length-
  b;for(var f=[],p=0;p<d.length&&!(0>(g-=2));++p){var l=d.charCodeAt(p);a=l>>8;l%=256;f.push(l);f.push(a);}return G(f,this,b,c);default:if(g)throw new TypeError("Unknown encoding: "+d);d=(""+d).toLowerCase();g=!0;}};a.prototype.toJSON=function(){return {type:"Buffer",data:Array.prototype.slice.call(this._arr||this,0)}};var X=4096;a.prototype.slice=function(b,c){var d=this.length;b=~~b;c=void 0===c?d:~~c;0>b?(b+=d,0>b&&(b=0)):b>d&&(b=d);0>c?(c+=d,0>c&&(c=0)):c>d&&(c=d);c<b&&(c=b);b=this.subarray(b,c);b.__proto__=
  a.prototype;return b};a.prototype.readUIntLE=function(a,b,c){a>>>=0;b>>>=0;c||B(a,b,this.length);c=this[a];for(var d=1,g=0;++g<b&&(d*=256);)c+=this[a+g]*d;return c};a.prototype.readUIntBE=function(a,b,c){a>>>=0;b>>>=0;c||B(a,b,this.length);c=this[a+--b];for(var d=1;0<b&&(d*=256);)c+=this[a+--b]*d;return c};a.prototype.readUInt8=function(a,b){a>>>=0;b||B(a,1,this.length);return this[a]};a.prototype.readUInt16LE=function(a,b){a>>>=0;b||B(a,2,this.length);return this[a]|this[a+1]<<8};a.prototype.readUInt16BE=
  function(a,b){a>>>=0;b||B(a,2,this.length);return this[a]<<8|this[a+1]};a.prototype.readUInt32LE=function(a,b){a>>>=0;b||B(a,4,this.length);return (this[a]|this[a+1]<<8|this[a+2]<<16)+16777216*this[a+3]};a.prototype.readUInt32BE=function(a,b){a>>>=0;b||B(a,4,this.length);return 16777216*this[a]+(this[a+1]<<16|this[a+2]<<8|this[a+3])};a.prototype.readIntLE=function(a,b,c){a>>>=0;b>>>=0;c||B(a,b,this.length);c=this[a];for(var d=1,g=0;++g<b&&(d*=256);)c+=this[a+g]*d;c>=128*d&&(c-=Math.pow(2,8*b));return c};
  a.prototype.readIntBE=function(a,b,c){a>>>=0;b>>>=0;c||B(a,b,this.length);c=b;for(var d=1,g=this[a+--c];0<c&&(d*=256);)g+=this[a+--c]*d;g>=128*d&&(g-=Math.pow(2,8*b));return g};a.prototype.readInt8=function(a,b){a>>>=0;b||B(a,1,this.length);return this[a]&128?-1*(255-this[a]+1):this[a]};a.prototype.readInt16LE=function(a,b){a>>>=0;b||B(a,2,this.length);a=this[a]|this[a+1]<<8;return a&32768?a|4294901760:a};a.prototype.readInt16BE=function(a,b){a>>>=0;b||B(a,2,this.length);a=this[a+1]|this[a]<<8;return a&
  32768?a|4294901760:a};a.prototype.readInt32LE=function(a,b){a>>>=0;b||B(a,4,this.length);return this[a]|this[a+1]<<8|this[a+2]<<16|this[a+3]<<24};a.prototype.readInt32BE=function(a,b){a>>>=0;b||B(a,4,this.length);return this[a]<<24|this[a+1]<<16|this[a+2]<<8|this[a+3]};a.prototype.readFloatLE=function(a,b){a>>>=0;b||B(a,4,this.length);return N.read(this,a,!0,23,4)};a.prototype.readFloatBE=function(a,b){a>>>=0;b||B(a,4,this.length);return N.read(this,a,!1,23,4)};a.prototype.readDoubleLE=function(a,
  b){a>>>=0;b||B(a,8,this.length);return N.read(this,a,!0,52,8)};a.prototype.readDoubleBE=function(a,b){a>>>=0;b||B(a,8,this.length);return N.read(this,a,!1,52,8)};a.prototype.writeUIntLE=function(a,b,c,d){a=+a;b>>>=0;c>>>=0;d||g(this,a,b,c,Math.pow(2,8*c)-1,0);d=1;var f=0;for(this[b]=a&255;++f<c&&(d*=256);)this[b+f]=a/d&255;return b+c};a.prototype.writeUIntBE=function(a,b,c,d){a=+a;b>>>=0;c>>>=0;d||g(this,a,b,c,Math.pow(2,8*c)-1,0);d=c-1;var f=1;for(this[b+d]=a&255;0<=--d&&(f*=256);)this[b+d]=a/f&
  255;return b+c};a.prototype.writeUInt8=function(a,b,c){a=+a;b>>>=0;c||g(this,a,b,1,255,0);this[b]=a&255;return b+1};a.prototype.writeUInt16LE=function(a,b,c){a=+a;b>>>=0;c||g(this,a,b,2,65535,0);this[b]=a&255;this[b+1]=a>>>8;return b+2};a.prototype.writeUInt16BE=function(a,b,c){a=+a;b>>>=0;c||g(this,a,b,2,65535,0);this[b]=a>>>8;this[b+1]=a&255;return b+2};a.prototype.writeUInt32LE=function(a,b,c){a=+a;b>>>=0;c||g(this,a,b,4,4294967295,0);this[b+3]=a>>>24;this[b+2]=a>>>16;this[b+1]=a>>>8;this[b]=a&
  255;return b+4};a.prototype.writeUInt32BE=function(a,b,c){a=+a;b>>>=0;c||g(this,a,b,4,4294967295,0);this[b]=a>>>24;this[b+1]=a>>>16;this[b+2]=a>>>8;this[b+3]=a&255;return b+4};a.prototype.writeIntLE=function(a,b,c,d){a=+a;b>>>=0;d||(d=Math.pow(2,8*c-1),g(this,a,b,c,d-1,-d));d=0;var f=1,l=0;for(this[b]=a&255;++d<c&&(f*=256);)0>a&&0===l&&0!==this[b+d-1]&&(l=1),this[b+d]=(a/f>>0)-l&255;return b+c};a.prototype.writeIntBE=function(a,b,c,d){a=+a;b>>>=0;d||(d=Math.pow(2,8*c-1),g(this,a,b,c,d-1,-d));d=c-
  1;var f=1,l=0;for(this[b+d]=a&255;0<=--d&&(f*=256);)0>a&&0===l&&0!==this[b+d+1]&&(l=1),this[b+d]=(a/f>>0)-l&255;return b+c};a.prototype.writeInt8=function(a,b,c){a=+a;b>>>=0;c||g(this,a,b,1,127,-128);0>a&&(a=255+a+1);this[b]=a&255;return b+1};a.prototype.writeInt16LE=function(a,b,c){a=+a;b>>>=0;c||g(this,a,b,2,32767,-32768);this[b]=a&255;this[b+1]=a>>>8;return b+2};a.prototype.writeInt16BE=function(a,b,c){a=+a;b>>>=0;c||g(this,a,b,2,32767,-32768);this[b]=a>>>8;this[b+1]=a&255;return b+2};a.prototype.writeInt32LE=
  function(a,b,c){a=+a;b>>>=0;c||g(this,a,b,4,2147483647,-2147483648);this[b]=a&255;this[b+1]=a>>>8;this[b+2]=a>>>16;this[b+3]=a>>>24;return b+4};a.prototype.writeInt32BE=function(a,b,c){a=+a;b>>>=0;c||g(this,a,b,4,2147483647,-2147483648);0>a&&(a=4294967295+a+1);this[b]=a>>>24;this[b+1]=a>>>16;this[b+2]=a>>>8;this[b+3]=a&255;return b+4};a.prototype.writeFloatLE=function(a,b,c){return M(this,a,b,!0,c)};a.prototype.writeFloatBE=function(a,b,c){return M(this,a,b,!1,c)};a.prototype.writeDoubleLE=function(a,
  b,c){return P(this,a,b,!0,c)};a.prototype.writeDoubleBE=function(a,b,c){return P(this,a,b,!1,c)};a.prototype.copy=function(b,c,d,g){if(!a.isBuffer(b))throw new TypeError("argument should be a Buffer");d||(d=0);g||0===g||(g=this.length);c>=b.length&&(c=b.length);c||(c=0);0<g&&g<d&&(g=d);if(g===d||0===b.length||0===this.length)return 0;if(0>c)throw new RangeError("targetStart out of bounds");if(0>d||d>=this.length)throw new RangeError("Index out of range");if(0>g)throw new RangeError("sourceEnd out of bounds");
  g>this.length&&(g=this.length);b.length-c<g-d&&(g=b.length-c+d);var f=g-d;if(this===b&&"function"===typeof Uint8Array.prototype.copyWithin)this.copyWithin(c,d,g);else if(this===b&&d<c&&c<g)for(g=f-1;0<=g;--g)b[g+c]=this[g+d];else Uint8Array.prototype.set.call(b,this.subarray(d,g),c);return f};a.prototype.fill=function(b,c,d,g){if("string"===typeof b){"string"===typeof c?(g=c,c=0,d=this.length):"string"===typeof d&&(g=d,d=this.length);if(void 0!==g&&"string"!==typeof g)throw new TypeError("encoding must be a string");
  if("string"===typeof g&&!a.isEncoding(g))throw new TypeError("Unknown encoding: "+g);if(1===b.length){var f=b.charCodeAt(0);if("utf8"===g&&128>f||"latin1"===g)b=f;}}else "number"===typeof b&&(b&=255);if(0>c||this.length<c||this.length<d)throw new RangeError("Out of range index");if(d<=c)return this;c>>>=0;d=void 0===d?this.length:d>>>0;b||(b=0);if("number"===typeof b)for(g=c;g<d;++g)this[g]=b;else {f=a.isBuffer(b)?b:a.from(b,g);var l=f.length;if(0===l)throw new TypeError('The value "'+b+'" is invalid for argument "value"');
  for(g=0;g<d-c;++g)this[g+c]=f[g%l];}return this};var z=/[^+/0-9A-Za-z-_]/g;},{"base64-js":26,ieee754:67}],31:[function(e,n,k){(function(b){k.isArray=function(a){return Array.isArray?Array.isArray(a):"[object Array]"===Object.prototype.toString.call(a)};k.isBoolean=function(a){return "boolean"===typeof a};k.isNull=function(a){return null===a};k.isNullOrUndefined=function(a){return null==a};k.isNumber=function(a){return "number"===typeof a};k.isString=function(a){return "string"===typeof a};k.isSymbol=function(a){return "symbol"===
  typeof a};k.isUndefined=function(a){return void 0===a};k.isRegExp=function(a){return "[object RegExp]"===Object.prototype.toString.call(a)};k.isObject=function(a){return "object"===typeof a&&null!==a};k.isDate=function(a){return "[object Date]"===Object.prototype.toString.call(a)};k.isError=function(a){return "[object Error]"===Object.prototype.toString.call(a)||a instanceof Error};k.isFunction=function(a){return "function"===typeof a};k.isPrimitive=function(a){return null===a||"boolean"===typeof a||"number"===
  typeof a||"string"===typeof a||"symbol"===typeof a||"undefined"===typeof a};k.isBuffer=b.isBuffer;}).call(this,{isBuffer:e("../../is-buffer/index.js")});},{"../../is-buffer/index.js":69}],32:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./enc-base64"),e("./md5"),e("./evpkdf"),e("./cipher-core")):a(b.CryptoJS);})(this,function(b){(function(){var a=b.lib.BlockCipher,h=b.algo,c=[],f=[],d=[],e=[],u=[],w=[],l=[],r=[],x=[],k=[];(function(){for(var a=[],b=0;256>b;b++)a[b]=
  128>b?b<<1:b<<1^283;var q=0,m=0;for(b=0;256>b;b++){var h=m^m<<1^m<<2^m<<3^m<<4;h=h>>>8^h&255^99;c[q]=h;f[h]=q;var v=a[q],y=a[v],n=a[y],G=257*a[h]^16843008*h;d[q]=G<<24|G>>>8;e[q]=G<<16|G>>>16;u[q]=G<<8|G>>>24;w[q]=G;G=16843009*n^65537*y^257*v^16843008*q;l[h]=G<<24|G>>>8;r[h]=G<<16|G>>>16;x[h]=G<<8|G>>>24;k[h]=G;q?(q=v^a[a[a[n^v]]],m^=a[a[m]]):q=m=1;}})();var m=[0,1,2,4,8,16,32,64,128,27,54];h=h.AES=a.extend({_doReset:function(){if(!this._nRounds||this._keyPriorReset!==this._key){var a=this._keyPriorReset=
  this._key,b=a.words,d=a.sigBytes/4;a=4*((this._nRounds=d+6)+1);for(var f=this._keySchedule=[],h=0;h<a;h++)if(h<d)f[h]=b[h];else {var e=f[h-1];h%d?6<d&&4==h%d&&(e=c[e>>>24]<<24|c[e>>>16&255]<<16|c[e>>>8&255]<<8|c[e&255]):(e=e<<8|e>>>24,e=c[e>>>24]<<24|c[e>>>16&255]<<16|c[e>>>8&255]<<8|c[e&255],e^=m[h/d|0]<<24);f[h]=f[h-d]^e;}b=this._invKeySchedule=[];for(d=0;d<a;d++)h=a-d,e=d%4?f[h]:f[h-4],b[d]=4>d||4>=h?e:l[c[e>>>24]]^r[c[e>>>16&255]]^x[c[e>>>8&255]]^k[c[e&255]];}},encryptBlock:function(a,b){this._doCryptBlock(a,
  b,this._keySchedule,d,e,u,w,c);},decryptBlock:function(a,b){var c=a[b+1];a[b+1]=a[b+3];a[b+3]=c;this._doCryptBlock(a,b,this._invKeySchedule,l,r,x,k,f);c=a[b+1];a[b+1]=a[b+3];a[b+3]=c;},_doCryptBlock:function(a,b,c,d,f,l,h,m){for(var g=this._nRounds,q=a[b]^c[0],e=a[b+1]^c[1],x=a[b+2]^c[2],r=a[b+3]^c[3],u=4,B=1;B<g;B++){var v=d[q>>>24]^f[e>>>16&255]^l[x>>>8&255]^h[r&255]^c[u++],p=d[e>>>24]^f[x>>>16&255]^l[r>>>8&255]^h[q&255]^c[u++],w=d[x>>>24]^f[r>>>16&255]^l[q>>>8&255]^h[e&255]^c[u++];r=d[r>>>24]^f[q>>>
  16&255]^l[e>>>8&255]^h[x&255]^c[u++];q=v;e=p;x=w;}v=(m[q>>>24]<<24|m[e>>>16&255]<<16|m[x>>>8&255]<<8|m[r&255])^c[u++];p=(m[e>>>24]<<24|m[x>>>16&255]<<16|m[r>>>8&255]<<8|m[q&255])^c[u++];w=(m[x>>>24]<<24|m[r>>>16&255]<<16|m[q>>>8&255]<<8|m[e&255])^c[u++];r=(m[r>>>24]<<24|m[q>>>16&255]<<16|m[e>>>8&255]<<8|m[x&255])^c[u++];a[b]=v;a[b+1]=p;a[b+2]=w;a[b+3]=r;},keySize:8});b.AES=a._createHelper(h);})();return b.AES});},{"./cipher-core":33,"./core":34,"./enc-base64":35,"./evpkdf":37,"./md5":42}],33:[function(e,
  n,k){(function(b,a){"object"===typeof k?n.exports=k=a(e("./core")):a(b.CryptoJS);})(this,function(b){b.lib.Cipher||function(a){var h=b.lib,c=h.Base,f=h.WordArray,d=h.BufferedBlockAlgorithm,e=b.enc.Base64,u=b.algo.EvpKDF,w=h.Cipher=d.extend({cfg:c.extend(),createEncryptor:function(a,b){return this.create(this._ENC_XFORM_MODE,a,b)},createDecryptor:function(a,b){return this.create(this._DEC_XFORM_MODE,a,b)},init:function(a,b,c){this.cfg=this.cfg.extend(c);this._xformMode=a;this._key=b;this.reset();},reset:function(){d.reset.call(this);
  this._doReset();},process:function(a){this._append(a);return this._process()},finalize:function(a){a&&this._append(a);return this._doFinalize()},keySize:4,ivSize:4,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:function(){return function(a){return {encrypt:function(b,c,d){return ("string"==typeof c?B:m).encrypt(a,b,c,d)},decrypt:function(b,c,d){return ("string"==typeof c?B:m).decrypt(a,b,c,d)}}}}()});h.StreamCipher=w.extend({_doFinalize:function(){return this._process(!0)},blockSize:1});var l=b.mode=
  {},r=h.BlockCipherMode=c.extend({createEncryptor:function(a,b){return this.Encryptor.create(a,b)},createDecryptor:function(a,b){return this.Decryptor.create(a,b)},init:function(a,b){this._cipher=a;this._iv=b;}});l=l.CBC=function(){function b(b,c,d){var g=this._iv;g?this._iv=a:g=this._prevBlock;for(var f=0;f<d;f++)b[c+f]^=g[f];}var c=r.extend();c.Encryptor=c.extend({processBlock:function(a,c){var d=this._cipher,g=d.blockSize;b.call(this,a,c,g);d.encryptBlock(a,c);this._prevBlock=a.slice(c,c+g);}});c.Decryptor=
  c.extend({processBlock:function(a,c){var d=this._cipher,g=d.blockSize,f=a.slice(c,c+g);d.decryptBlock(a,c);b.call(this,a,c,g);this._prevBlock=f;}});return c}();var x=(b.pad={}).Pkcs7={pad:function(a,b){b*=4;b-=a.sigBytes%b;for(var c=b<<24|b<<16|b<<8|b,d=[],g=0;g<b;g+=4)d.push(c);b=f.create(d,b);a.concat(b);},unpad:function(a){a.sigBytes-=a.words[a.sigBytes-1>>>2]&255;}};h.BlockCipher=w.extend({cfg:w.cfg.extend({mode:l,padding:x}),reset:function(){w.reset.call(this);var a=this.cfg,b=a.iv;a=a.mode;if(this._xformMode==
  this._ENC_XFORM_MODE)var c=a.createEncryptor;else c=a.createDecryptor,this._minBufferSize=1;this._mode=c.call(a,this,b&&b.words);},_doProcessBlock:function(a,b){this._mode.processBlock(a,b);},_doFinalize:function(){var a=this.cfg.padding;if(this._xformMode==this._ENC_XFORM_MODE){a.pad(this._data,this.blockSize);var b=this._process(!0);}else b=this._process(!0),a.unpad(b);return b},blockSize:4});var k=h.CipherParams=c.extend({init:function(a){this.mixIn(a);},toString:function(a){return (a||this.formatter).stringify(this)}});
  l=(b.format={}).OpenSSL={stringify:function(a){var b=a.ciphertext;a=a.salt;return (a?f.create([1398893684,1701076831]).concat(a).concat(b):b).toString(e)},parse:function(a){a=e.parse(a);var b=a.words;if(1398893684==b[0]&&1701076831==b[1]){var c=f.create(b.slice(2,4));b.splice(0,4);a.sigBytes-=16;}return k.create({ciphertext:a,salt:c})}};var m=h.SerializableCipher=c.extend({cfg:c.extend({format:l}),encrypt:function(a,b,c,d){d=this.cfg.extend(d);var g=a.createEncryptor(c,d);b=g.finalize(b);g=g.cfg;return k.create({ciphertext:b,
  key:c,iv:g.iv,algorithm:a,mode:g.mode,padding:g.padding,blockSize:a.blockSize,formatter:d.format})},decrypt:function(a,b,c,d){d=this.cfg.extend(d);b=this._parse(b,d.format);return a.createDecryptor(c,d).finalize(b.ciphertext)},_parse:function(a,b){return "string"==typeof a?b.parse(a,this):a}});c=(b.kdf={}).OpenSSL={execute:function(a,b,c,d){d||(d=f.random(8));a=u.create({keySize:b+c}).compute(a,d);c=f.create(a.words.slice(b),4*c);a.sigBytes=4*b;return k.create({key:a,iv:c,salt:d})}};var B=h.PasswordBasedCipher=
  m.extend({cfg:m.cfg.extend({kdf:c}),encrypt:function(a,b,c,d){d=this.cfg.extend(d);c=d.kdf.execute(c,a.keySize,a.ivSize);d.iv=c.iv;a=m.encrypt.call(this,a,b,c.key,d);a.mixIn(c);return a},decrypt:function(a,b,c,d){d=this.cfg.extend(d);b=this._parse(b,d.format);c=d.kdf.execute(c,a.keySize,a.ivSize,b.salt);d.iv=c.iv;return m.decrypt.call(this,a,b,c.key,d)}});}();});},{"./core":34}],34:[function(e,n,k){(function(b,a){"object"===typeof k?n.exports=k=a():b.CryptoJS=a();})(this,function(){var b=b||function(a,
  b){var c=Object.create||function(){function a(){}return function(b){a.prototype=b;b=new a;a.prototype=null;return b}}(),f={},d=f.lib={},h=d.Base=function(){return {extend:function(a){var b=c(this);a&&b.mixIn(a);b.hasOwnProperty("init")&&this.init!==b.init||(b.init=function(){b.$super.init.apply(this,arguments);});b.init.prototype=b;b.$super=this;return b},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var b in a)a.hasOwnProperty(b)&&
  (this[b]=a[b]);a.hasOwnProperty("toString")&&(this.toString=a.toString);},clone:function(){return this.init.prototype.extend(this)}}}(),e=d.WordArray=h.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=b?c:4*a.length;},toString:function(a){return (a||l).stringify(this)},concat:function(a){var b=this.words,c=a.words,d=this.sigBytes;a=a.sigBytes;this.clamp();if(d%4)for(var f=0;f<a;f++)b[d+f>>>2]|=(c[f>>>2]>>>24-f%4*8&255)<<24-(d+f)%4*8;else for(f=0;f<a;f+=4)b[d+f>>>2]=c[f>>>2];this.sigBytes+=
  a;return this},clamp:function(){var b=this.words,c=this.sigBytes;b[c>>>2]&=4294967295<<32-c%4*8;b.length=a.ceil(c/4);},clone:function(){var a=h.clone.call(this);a.words=this.words.slice(0);return a},random:function(b){for(var c=[],d=function(b){var c=987654321;return function(){c=36969*(c&65535)+(c>>16)&4294967295;b=18E3*(b&65535)+(b>>16)&4294967295;return (((c<<16)+b&4294967295)/4294967296+.5)*(.5<a.random()?1:-1)}},f=0,l;f<b;f+=4){var m=d(4294967296*(l||a.random()));l=987654071*m();c.push(4294967296*
  m()|0);}return new e.init(c,b)}}),w=f.enc={},l=w.Hex={stringify:function(a){var b=a.words;a=a.sigBytes;for(var c=[],d=0;d<a;d++){var f=b[d>>>2]>>>24-d%4*8&255;c.push((f>>>4).toString(16));c.push((f&15).toString(16));}return c.join("")},parse:function(a){for(var b=a.length,c=[],d=0;d<b;d+=2)c[d>>>3]|=parseInt(a.substr(d,2),16)<<24-d%8*4;return new e.init(c,b/2)}},r=w.Latin1={stringify:function(a){var b=a.words;a=a.sigBytes;for(var c=[],d=0;d<a;d++)c.push(String.fromCharCode(b[d>>>2]>>>24-d%4*8&255));
  return c.join("")},parse:function(a){for(var b=a.length,c=[],d=0;d<b;d++)c[d>>>2]|=(a.charCodeAt(d)&255)<<24-d%4*8;return new e.init(c,b)}},x=w.Utf8={stringify:function(a){try{return decodeURIComponent(escape(r.stringify(a)))}catch(g){throw Error("Malformed UTF-8 data");}},parse:function(a){return r.parse(unescape(encodeURIComponent(a)))}},k=d.BufferedBlockAlgorithm=h.extend({reset:function(){this._data=new e.init;this._nDataBytes=0;},_append:function(a){"string"==typeof a&&(a=x.parse(a));this._data.concat(a);
  this._nDataBytes+=a.sigBytes;},_process:function(b){var c=this._data,d=c.words,f=c.sigBytes,l=this.blockSize,m=f/(4*l);m=b?a.ceil(m):a.max((m|0)-this._minBufferSize,0);b=m*l;f=a.min(4*b,f);if(b){for(var h=0;h<b;h+=l)this._doProcessBlock(d,h);h=d.splice(0,b);c.sigBytes-=f;}return new e.init(h,f)},clone:function(){var a=h.clone.call(this);a._data=this._data.clone();return a},_minBufferSize:0});d.Hasher=k.extend({cfg:h.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset();},reset:function(){k.reset.call(this);
  this._doReset();},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(b,c){return (new a.init(c)).finalize(b)}},_createHmacHelper:function(a){return function(b,c){return (new m.HMAC.init(a,c)).finalize(b)}}});var m=f.algo={};return f}(Math);return b});},{}],35:[function(e,n,k){(function(b,a){"object"===typeof k?n.exports=k=a(e("./core")):a(b.CryptoJS);})(this,function(b){(function(){var a=
  b.lib.WordArray;b.enc.Base64={stringify:function(a){var b=a.words,f=a.sigBytes,d=this._map;a.clamp();a=[];for(var h=0;h<f;h+=3)for(var e=(b[h>>>2]>>>24-h%4*8&255)<<16|(b[h+1>>>2]>>>24-(h+1)%4*8&255)<<8|b[h+2>>>2]>>>24-(h+2)%4*8&255,w=0;4>w&&h+.75*w<f;w++)a.push(d.charAt(e>>>6*(3-w)&63));if(b=d.charAt(64))for(;a.length%4;)a.push(b);return a.join("")},parse:function(b){var c=b.length,f=this._map,d=this._reverseMap;if(!d){d=this._reverseMap=[];for(var h=0;h<f.length;h++)d[f.charCodeAt(h)]=h;}if(f=f.charAt(64))f=
  b.indexOf(f),-1!==f&&(c=f);f=[];for(var e=h=0;e<c;e++)if(e%4){var w=d[b.charCodeAt(e-1)]<<e%4*2,l=d[b.charCodeAt(e)]>>>6-e%4*2;f[h>>>2]|=(w|l)<<24-h%4*8;h++;}return a.create(f,h)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="};})();return b.enc.Base64});},{"./core":34}],36:[function(e,n,k){(function(b,a){"object"===typeof k?n.exports=k=a(e("./core")):a(b.CryptoJS);})(this,function(b){(function(){function a(a){return a<<8&4278255360|a>>>8&16711935}var h=b.lib.WordArray,c=b.enc;
  c.Utf16=c.Utf16BE={stringify:function(a){var b=a.words;a=a.sigBytes;for(var c=[],f=0;f<a;f+=2)c.push(String.fromCharCode(b[f>>>2]>>>16-f%4*8&65535));return c.join("")},parse:function(a){for(var b=a.length,c=[],f=0;f<b;f++)c[f>>>1]|=a.charCodeAt(f)<<16-f%2*16;return h.create(c,2*b)}};c.Utf16LE={stringify:function(b){var c=b.words;b=b.sigBytes;for(var f=[],h=0;h<b;h+=2){var e=a(c[h>>>2]>>>16-h%4*8&65535);f.push(String.fromCharCode(e));}return f.join("")},parse:function(b){for(var c=b.length,f=[],e=0;e<
  c;e++)f[e>>>1]|=a(b.charCodeAt(e)<<16-e%2*16);return h.create(f,2*c)}};})();return b.enc.Utf16});},{"./core":34}],37:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./sha1"),e("./hmac")):a(b.CryptoJS);})(this,function(b){(function(){var a=b.lib,h=a.Base,c=a.WordArray;a=b.algo;var f=a.EvpKDF=h.extend({cfg:h.extend({keySize:4,hasher:a.MD5,iterations:1}),init:function(a){this.cfg=this.cfg.extend(a);},compute:function(a,b){var d=this.cfg,f=d.hasher.create(),l=c.create(),
  h=l.words,e=d.keySize;for(d=d.iterations;h.length<e;){v&&f.update(v);var v=f.update(a).finalize(b);f.reset();for(var m=1;m<d;m++)v=f.finalize(v),f.reset();l.concat(v);}l.sigBytes=4*e;return l}});b.EvpKDF=function(a,b,c){return f.create(c).compute(a,b)};})();return b.EvpKDF});},{"./core":34,"./hmac":39,"./sha1":58}],38:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./cipher-core")):a(b.CryptoJS);})(this,function(b){(function(a){var h=b.lib.CipherParams,c=b.enc.Hex;b.format.Hex=
  {stringify:function(a){return a.ciphertext.toString(c)},parse:function(a){a=c.parse(a);return h.create({ciphertext:a})}};})();return b.format.Hex});},{"./cipher-core":33,"./core":34}],39:[function(e,n,k){(function(b,a){"object"===typeof k?n.exports=k=a(e("./core")):a(b.CryptoJS);})(this,function(b){(function(){var a=b.enc.Utf8;b.algo.HMAC=b.lib.Base.extend({init:function(b,c){b=this._hasher=new b.init;"string"==typeof c&&(c=a.parse(c));var f=b.blockSize,d=4*f;c.sigBytes>d&&(c=b.finalize(c));c.clamp();
  b=this._oKey=c.clone();c=this._iKey=c.clone();for(var h=b.words,e=c.words,w=0;w<f;w++)h[w]^=1549556828,e[w]^=909522486;b.sigBytes=c.sigBytes=d;this.reset();},reset:function(){var a=this._hasher;a.reset();a.update(this._iKey);},update:function(a){this._hasher.update(a);return this},finalize:function(a){var b=this._hasher;a=b.finalize(a);b.reset();return b.finalize(this._oKey.clone().concat(a))}});})();});},{"./core":34}],40:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),
  e("./x64-core"),e("./lib-typedarrays"),e("./enc-utf16"),e("./enc-base64"),e("./md5"),e("./sha1"),e("./sha256"),e("./sha224"),e("./sha512"),e("./sha384"),e("./sha3"),e("./ripemd160"),e("./hmac"),e("./pbkdf2"),e("./evpkdf"),e("./cipher-core"),e("./mode-cfb"),e("./mode-ctr"),e("./mode-ctr-gladman"),e("./mode-ofb"),e("./mode-ecb"),e("./pad-ansix923"),e("./pad-iso10126"),e("./pad-iso97971"),e("./pad-zeropadding"),e("./pad-nopadding"),e("./format-hex"),e("./aes"),e("./tripledes"),e("./rc4"),e("./rabbit"),
  e("./rabbit-legacy")):b.CryptoJS=a(b.CryptoJS);})(this,function(b){return b});},{"./aes":32,"./cipher-core":33,"./core":34,"./enc-base64":35,"./enc-utf16":36,"./evpkdf":37,"./format-hex":38,"./hmac":39,"./lib-typedarrays":41,"./md5":42,"./mode-cfb":43,"./mode-ctr":45,"./mode-ctr-gladman":44,"./mode-ecb":46,"./mode-ofb":47,"./pad-ansix923":48,"./pad-iso10126":49,"./pad-iso97971":50,"./pad-nopadding":51,"./pad-zeropadding":52,"./pbkdf2":53,"./rabbit":55,"./rabbit-legacy":54,"./rc4":56,"./ripemd160":57,
  "./sha1":58,"./sha224":59,"./sha256":60,"./sha3":61,"./sha384":62,"./sha512":63,"./tripledes":64,"./x64-core":65}],41:[function(e,n,k){(function(b,a){"object"===typeof k?n.exports=k=a(e("./core")):a(b.CryptoJS);})(this,function(b){(function(){if("function"==typeof ArrayBuffer){var a=b.lib.WordArray,h=a.init;(a.init=function(a){a instanceof ArrayBuffer&&(a=new Uint8Array(a));if(a instanceof Int8Array||"undefined"!==typeof Uint8ClampedArray&&a instanceof Uint8ClampedArray||a instanceof Int16Array||a instanceof
  Uint16Array||a instanceof Int32Array||a instanceof Uint32Array||a instanceof Float32Array||a instanceof Float64Array)a=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);if(a instanceof Uint8Array){for(var b=a.byteLength,c=[],e=0;e<b;e++)c[e>>>2]|=a[e]<<24-e%4*8;h.call(this,c,b);}else h.apply(this,arguments);}).prototype=a;}})();return b.lib.WordArray});},{"./core":34}],42:[function(e,n,k){(function(b,a){"object"===typeof k?n.exports=k=a(e("./core")):a(b.CryptoJS);})(this,function(b){(function(a){function h(a,
  b,c,d,f,g,l){a=a+(b&c|~b&d)+f+l;return (a<<g|a>>>32-g)+b}function c(a,b,c,d,f,g,l){a=a+(b&d|c&~d)+f+l;return (a<<g|a>>>32-g)+b}function f(a,b,c,d,f,g,l){a=a+(b^c^d)+f+l;return (a<<g|a>>>32-g)+b}function d(a,b,c,d,f,g,l){a=a+(c^(b|~d))+f+l;return (a<<g|a>>>32-g)+b}var e=b.lib,u=e.WordArray,w=e.Hasher;e=b.algo;var l=[];(function(){for(var b=0;64>b;b++)l[b]=4294967296*a.abs(a.sin(b+1))|0;})();e=e.MD5=w.extend({_doReset:function(){this._hash=new u.init([1732584193,4023233417,2562383102,271733878]);},_doProcessBlock:function(a,
  b){for(var e=0;16>e;e++){var m=b+e,r=a[m];a[m]=(r<<8|r>>>24)&16711935|(r<<24|r>>>8)&4278255360;}e=this._hash.words;m=a[b+0];r=a[b+1];var g=a[b+2],q=a[b+3],u=a[b+4],x=a[b+5],w=a[b+6],k=a[b+7],v=a[b+8],n=a[b+9],A=a[b+10],K=a[b+11],N=a[b+12],C=a[b+13],X=a[b+14];a=a[b+15];b=e[0];var z=e[1],t=e[2],p=e[3];b=h(b,z,t,p,m,7,l[0]);p=h(p,b,z,t,r,12,l[1]);t=h(t,p,b,z,g,17,l[2]);z=h(z,t,p,b,q,22,l[3]);b=h(b,z,t,p,u,7,l[4]);p=h(p,b,z,t,x,12,l[5]);t=h(t,p,b,z,w,17,l[6]);z=h(z,t,p,b,k,22,l[7]);b=h(b,z,t,p,v,7,l[8]);
  p=h(p,b,z,t,n,12,l[9]);t=h(t,p,b,z,A,17,l[10]);z=h(z,t,p,b,K,22,l[11]);b=h(b,z,t,p,N,7,l[12]);p=h(p,b,z,t,C,12,l[13]);t=h(t,p,b,z,X,17,l[14]);z=h(z,t,p,b,a,22,l[15]);b=c(b,z,t,p,r,5,l[16]);p=c(p,b,z,t,w,9,l[17]);t=c(t,p,b,z,K,14,l[18]);z=c(z,t,p,b,m,20,l[19]);b=c(b,z,t,p,x,5,l[20]);p=c(p,b,z,t,A,9,l[21]);t=c(t,p,b,z,a,14,l[22]);z=c(z,t,p,b,u,20,l[23]);b=c(b,z,t,p,n,5,l[24]);p=c(p,b,z,t,X,9,l[25]);t=c(t,p,b,z,q,14,l[26]);z=c(z,t,p,b,v,20,l[27]);b=c(b,z,t,p,C,5,l[28]);p=c(p,b,z,t,g,9,l[29]);t=c(t,p,
  b,z,k,14,l[30]);z=c(z,t,p,b,N,20,l[31]);b=f(b,z,t,p,x,4,l[32]);p=f(p,b,z,t,v,11,l[33]);t=f(t,p,b,z,K,16,l[34]);z=f(z,t,p,b,X,23,l[35]);b=f(b,z,t,p,r,4,l[36]);p=f(p,b,z,t,u,11,l[37]);t=f(t,p,b,z,k,16,l[38]);z=f(z,t,p,b,A,23,l[39]);b=f(b,z,t,p,C,4,l[40]);p=f(p,b,z,t,m,11,l[41]);t=f(t,p,b,z,q,16,l[42]);z=f(z,t,p,b,w,23,l[43]);b=f(b,z,t,p,n,4,l[44]);p=f(p,b,z,t,N,11,l[45]);t=f(t,p,b,z,a,16,l[46]);z=f(z,t,p,b,g,23,l[47]);b=d(b,z,t,p,m,6,l[48]);p=d(p,b,z,t,k,10,l[49]);t=d(t,p,b,z,X,15,l[50]);z=d(z,t,p,
  b,x,21,l[51]);b=d(b,z,t,p,N,6,l[52]);p=d(p,b,z,t,q,10,l[53]);t=d(t,p,b,z,A,15,l[54]);z=d(z,t,p,b,r,21,l[55]);b=d(b,z,t,p,v,6,l[56]);p=d(p,b,z,t,a,10,l[57]);t=d(t,p,b,z,w,15,l[58]);z=d(z,t,p,b,C,21,l[59]);b=d(b,z,t,p,u,6,l[60]);p=d(p,b,z,t,K,10,l[61]);t=d(t,p,b,z,g,15,l[62]);z=d(z,t,p,b,n,21,l[63]);e[0]=e[0]+b|0;e[1]=e[1]+z|0;e[2]=e[2]+t|0;e[3]=e[3]+p|0;},_doFinalize:function(){var b=this._data,c=b.words,d=8*this._nDataBytes,f=8*b.sigBytes;c[f>>>5]|=128<<24-f%32;var l=a.floor(d/4294967296);c[(f+64>>>
  9<<4)+15]=(l<<8|l>>>24)&16711935|(l<<24|l>>>8)&4278255360;c[(f+64>>>9<<4)+14]=(d<<8|d>>>24)&16711935|(d<<24|d>>>8)&4278255360;b.sigBytes=4*(c.length+1);this._process();b=this._hash;c=b.words;for(d=0;4>d;d++)f=c[d],c[d]=(f<<8|f>>>24)&16711935|(f<<24|f>>>8)&4278255360;return b},clone:function(){var a=w.clone.call(this);a._hash=this._hash.clone();return a}});b.MD5=w._createHelper(e);b.HmacMD5=w._createHmacHelper(e);})(Math);return b.MD5});},{"./core":34}],43:[function(e,n,k){(function(b,a,h){"object"===
  typeof k?n.exports=k=a(e("./core"),e("./cipher-core")):a(b.CryptoJS);})(this,function(b){b.mode.CFB=function(){function a(a,b,d,e){var c=this._iv;c?(c=c.slice(0),this._iv=void 0):c=this._prevBlock;e.encryptBlock(c,0);for(e=0;e<d;e++)a[b+e]^=c[e];}var e=b.lib.BlockCipherMode.extend();e.Encryptor=e.extend({processBlock:function(b,f){var c=this._cipher,e=c.blockSize;a.call(this,b,f,e,c);this._prevBlock=b.slice(f,f+e);}});e.Decryptor=e.extend({processBlock:function(b,f){var c=this._cipher,e=c.blockSize,
  h=b.slice(f,f+e);a.call(this,b,f,e,c);this._prevBlock=h;}});return e}();return b.mode.CFB});},{"./cipher-core":33,"./core":34}],44:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./cipher-core")):a(b.CryptoJS);})(this,function(b){b.mode.CTRGladman=function(){function a(a){if(255===(a>>24&255)){var b=a>>16&255,c=a>>8&255;a&=255;255===b?(b=0,255===c?(c=0,255===a?a=0:++a):++c):++b;a=(b<<16)+(c<<8)+a;}else a+=16777216;return a}var e=b.lib.BlockCipherMode.extend(),c=e.Encryptor=
  e.extend({processBlock:function(b,c){var d=this._cipher,f=d.blockSize,e=this._iv,l=this._counter;e&&(l=this._counter=e.slice(0),this._iv=void 0);e=l;0===(e[0]=a(e[0]))&&(e[1]=a(e[1]));l=l.slice(0);d.encryptBlock(l,0);for(d=0;d<f;d++)b[c+d]^=l[d];}});e.Decryptor=c;return e}();return b.mode.CTRGladman});},{"./cipher-core":33,"./core":34}],45:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./cipher-core")):a(b.CryptoJS);})(this,function(b){b.mode.CTR=function(){var a=
  b.lib.BlockCipherMode.extend(),e=a.Encryptor=a.extend({processBlock:function(a,b){var c=this._cipher,f=c.blockSize,e=this._iv,h=this._counter;e&&(h=this._counter=e.slice(0),this._iv=void 0);e=h.slice(0);c.encryptBlock(e,0);h[f-1]=h[f-1]+1|0;for(c=0;c<f;c++)a[b+c]^=e[c];}});a.Decryptor=e;return a}();return b.mode.CTR});},{"./cipher-core":33,"./core":34}],46:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./cipher-core")):a(b.CryptoJS);})(this,function(b){b.mode.ECB=
  function(){var a=b.lib.BlockCipherMode.extend();a.Encryptor=a.extend({processBlock:function(a,b){this._cipher.encryptBlock(a,b);}});a.Decryptor=a.extend({processBlock:function(a,b){this._cipher.decryptBlock(a,b);}});return a}();return b.mode.ECB});},{"./cipher-core":33,"./core":34}],47:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./cipher-core")):a(b.CryptoJS);})(this,function(b){b.mode.OFB=function(){var a=b.lib.BlockCipherMode.extend(),e=a.Encryptor=a.extend({processBlock:function(a,
  b){var c=this._cipher,f=c.blockSize,e=this._iv,h=this._keystream;e&&(h=this._keystream=e.slice(0),this._iv=void 0);c.encryptBlock(h,0);for(c=0;c<f;c++)a[b+c]^=h[c];}});a.Decryptor=e;return a}();return b.mode.OFB});},{"./cipher-core":33,"./core":34}],48:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./cipher-core")):a(b.CryptoJS);})(this,function(b){b.pad.AnsiX923={pad:function(a,b){var c=a.sigBytes;b*=4;b-=c%b;c=c+b-1;a.clamp();a.words[c>>>2]|=b<<24-c%4*8;a.sigBytes+=
  b;},unpad:function(a){a.sigBytes-=a.words[a.sigBytes-1>>>2]&255;}};return b.pad.Ansix923});},{"./cipher-core":33,"./core":34}],49:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./cipher-core")):a(b.CryptoJS);})(this,function(b){b.pad.Iso10126={pad:function(a,e){e*=4;e-=a.sigBytes%e;a.concat(b.lib.WordArray.random(e-1)).concat(b.lib.WordArray.create([e<<24],1));},unpad:function(a){a.sigBytes-=a.words[a.sigBytes-1>>>2]&255;}};return b.pad.Iso10126});},{"./cipher-core":33,
  "./core":34}],50:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./cipher-core")):a(b.CryptoJS);})(this,function(b){b.pad.Iso97971={pad:function(a,e){a.concat(b.lib.WordArray.create([2147483648],1));b.pad.ZeroPadding.pad(a,e);},unpad:function(a){b.pad.ZeroPadding.unpad(a);a.sigBytes--;}};return b.pad.Iso97971});},{"./cipher-core":33,"./core":34}],51:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./cipher-core")):a(b.CryptoJS);})(this,
  function(b){b.pad.NoPadding={pad:function(){},unpad:function(){}};return b.pad.NoPadding});},{"./cipher-core":33,"./core":34}],52:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./cipher-core")):a(b.CryptoJS);})(this,function(b){b.pad.ZeroPadding={pad:function(a,b){b*=4;a.clamp();a.sigBytes+=b-(a.sigBytes%b||b);},unpad:function(a){for(var b=a.words,c=a.sigBytes-1;!(b[c>>>2]>>>24-c%4*8&255);)c--;a.sigBytes=c+1;}};return b.pad.ZeroPadding});},{"./cipher-core":33,"./core":34}],
  53:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./sha1"),e("./hmac")):a(b.CryptoJS);})(this,function(b){(function(){var a=b.lib,e=a.Base,c=a.WordArray;a=b.algo;var f=a.HMAC,d=a.PBKDF2=e.extend({cfg:e.extend({keySize:4,hasher:a.SHA1,iterations:1}),init:function(a){this.cfg=this.cfg.extend(a);},compute:function(a,b){var d=this.cfg;a=f.create(d.hasher,a);var l=c.create(),e=c.create([1]),h=l.words,u=e.words,m=d.keySize;for(d=d.iterations;h.length<m;){var k=a.update(b).finalize(e);
  a.reset();for(var g=k.words,q=g.length,v=k,n=1;n<d;n++){v=a.finalize(v);a.reset();for(var J=v.words,E=0;E<q;E++)g[E]^=J[E];}l.concat(k);u[0]++;}l.sigBytes=4*m;return l}});b.PBKDF2=function(a,b,c){return d.create(c).compute(a,b)};})();return b.PBKDF2});},{"./core":34,"./hmac":39,"./sha1":58}],54:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./enc-base64"),e("./md5"),e("./evpkdf"),e("./cipher-core")):a(b.CryptoJS);})(this,function(b){(function(){function a(){for(var a=
  this._X,b=this._C,c=0;8>c;c++)f[c]=b[c];b[0]=b[0]+1295307597+this._b|0;b[1]=b[1]+3545052371+(b[0]>>>0<f[0]>>>0?1:0)|0;b[2]=b[2]+886263092+(b[1]>>>0<f[1]>>>0?1:0)|0;b[3]=b[3]+1295307597+(b[2]>>>0<f[2]>>>0?1:0)|0;b[4]=b[4]+3545052371+(b[3]>>>0<f[3]>>>0?1:0)|0;b[5]=b[5]+886263092+(b[4]>>>0<f[4]>>>0?1:0)|0;b[6]=b[6]+1295307597+(b[5]>>>0<f[5]>>>0?1:0)|0;b[7]=b[7]+3545052371+(b[6]>>>0<f[6]>>>0?1:0)|0;this._b=b[7]>>>0<f[7]>>>0?1:0;for(c=0;8>c;c++){var e=a[c]+b[c],h=e&65535,k=e>>>16;d[c]=((h*h>>>17)+h*k>>>
  15)+k*k^((e&4294901760)*e|0)+((e&65535)*e|0);}a[0]=d[0]+(d[7]<<16|d[7]>>>16)+(d[6]<<16|d[6]>>>16)|0;a[1]=d[1]+(d[0]<<8|d[0]>>>24)+d[7]|0;a[2]=d[2]+(d[1]<<16|d[1]>>>16)+(d[0]<<16|d[0]>>>16)|0;a[3]=d[3]+(d[2]<<8|d[2]>>>24)+d[1]|0;a[4]=d[4]+(d[3]<<16|d[3]>>>16)+(d[2]<<16|d[2]>>>16)|0;a[5]=d[5]+(d[4]<<8|d[4]>>>24)+d[3]|0;a[6]=d[6]+(d[5]<<16|d[5]>>>16)+(d[4]<<16|d[4]>>>16)|0;a[7]=d[7]+(d[6]<<8|d[6]>>>24)+d[5]|0;}var e=b.lib.StreamCipher,c=[],f=[],d=[],k=b.algo.RabbitLegacy=e.extend({_doReset:function(){var b=
  this._key.words,c=this.cfg.iv,d=this._X=[b[0],b[3]<<16|b[2]>>>16,b[1],b[0]<<16|b[3]>>>16,b[2],b[1]<<16|b[0]>>>16,b[3],b[2]<<16|b[1]>>>16];b=this._C=[b[2]<<16|b[2]>>>16,b[0]&4294901760|b[1]&65535,b[3]<<16|b[3]>>>16,b[1]&4294901760|b[2]&65535,b[0]<<16|b[0]>>>16,b[2]&4294901760|b[3]&65535,b[1]<<16|b[1]>>>16,b[3]&4294901760|b[0]&65535];for(var f=this._b=0;4>f;f++)a.call(this);for(f=0;8>f;f++)b[f]^=d[f+4&7];if(c){d=c.words;c=d[0];d=d[1];c=(c<<8|c>>>24)&16711935|(c<<24|c>>>8)&4278255360;d=(d<<8|d>>>24)&
  16711935|(d<<24|d>>>8)&4278255360;f=c>>>16|d&4294901760;var e=d<<16|c&65535;b[0]^=c;b[1]^=f;b[2]^=d;b[3]^=e;b[4]^=c;b[5]^=f;b[6]^=d;b[7]^=e;for(f=0;4>f;f++)a.call(this);}},_doProcessBlock:function(b,d){var f=this._X;a.call(this);c[0]=f[0]^f[5]>>>16^f[3]<<16;c[1]=f[2]^f[7]>>>16^f[5]<<16;c[2]=f[4]^f[1]>>>16^f[7]<<16;c[3]=f[6]^f[3]>>>16^f[1]<<16;for(f=0;4>f;f++)c[f]=(c[f]<<8|c[f]>>>24)&16711935|(c[f]<<24|c[f]>>>8)&4278255360,b[d+f]^=c[f];},blockSize:4,ivSize:2});b.RabbitLegacy=e._createHelper(k);})();return b.RabbitLegacy});},
  {"./cipher-core":33,"./core":34,"./enc-base64":35,"./evpkdf":37,"./md5":42}],55:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./enc-base64"),e("./md5"),e("./evpkdf"),e("./cipher-core")):a(b.CryptoJS);})(this,function(b){(function(){function a(){for(var a=this._X,b=this._C,c=0;8>c;c++)f[c]=b[c];b[0]=b[0]+1295307597+this._b|0;b[1]=b[1]+3545052371+(b[0]>>>0<f[0]>>>0?1:0)|0;b[2]=b[2]+886263092+(b[1]>>>0<f[1]>>>0?1:0)|0;b[3]=b[3]+1295307597+(b[2]>>>0<f[2]>>>0?1:0)|0;
  b[4]=b[4]+3545052371+(b[3]>>>0<f[3]>>>0?1:0)|0;b[5]=b[5]+886263092+(b[4]>>>0<f[4]>>>0?1:0)|0;b[6]=b[6]+1295307597+(b[5]>>>0<f[5]>>>0?1:0)|0;b[7]=b[7]+3545052371+(b[6]>>>0<f[6]>>>0?1:0)|0;this._b=b[7]>>>0<f[7]>>>0?1:0;for(c=0;8>c;c++){var e=a[c]+b[c],h=e&65535,k=e>>>16;d[c]=((h*h>>>17)+h*k>>>15)+k*k^((e&4294901760)*e|0)+((e&65535)*e|0);}a[0]=d[0]+(d[7]<<16|d[7]>>>16)+(d[6]<<16|d[6]>>>16)|0;a[1]=d[1]+(d[0]<<8|d[0]>>>24)+d[7]|0;a[2]=d[2]+(d[1]<<16|d[1]>>>16)+(d[0]<<16|d[0]>>>16)|0;a[3]=d[3]+(d[2]<<8|
  d[2]>>>24)+d[1]|0;a[4]=d[4]+(d[3]<<16|d[3]>>>16)+(d[2]<<16|d[2]>>>16)|0;a[5]=d[5]+(d[4]<<8|d[4]>>>24)+d[3]|0;a[6]=d[6]+(d[5]<<16|d[5]>>>16)+(d[4]<<16|d[4]>>>16)|0;a[7]=d[7]+(d[6]<<8|d[6]>>>24)+d[5]|0;}var e=b.lib.StreamCipher,c=[],f=[],d=[],k=b.algo.Rabbit=e.extend({_doReset:function(){for(var b=this._key.words,c=this.cfg.iv,d=0;4>d;d++)b[d]=(b[d]<<8|b[d]>>>24)&16711935|(b[d]<<24|b[d]>>>8)&4278255360;var f=this._X=[b[0],b[3]<<16|b[2]>>>16,b[1],b[0]<<16|b[3]>>>16,b[2],b[1]<<16|b[0]>>>16,b[3],b[2]<<
  16|b[1]>>>16];b=this._C=[b[2]<<16|b[2]>>>16,b[0]&4294901760|b[1]&65535,b[3]<<16|b[3]>>>16,b[1]&4294901760|b[2]&65535,b[0]<<16|b[0]>>>16,b[2]&4294901760|b[3]&65535,b[1]<<16|b[1]>>>16,b[3]&4294901760|b[0]&65535];for(d=this._b=0;4>d;d++)a.call(this);for(d=0;8>d;d++)b[d]^=f[d+4&7];if(c){d=c.words;c=d[0];d=d[1];c=(c<<8|c>>>24)&16711935|(c<<24|c>>>8)&4278255360;d=(d<<8|d>>>24)&16711935|(d<<24|d>>>8)&4278255360;f=c>>>16|d&4294901760;var e=d<<16|c&65535;b[0]^=c;b[1]^=f;b[2]^=d;b[3]^=e;b[4]^=c;b[5]^=f;b[6]^=
  d;b[7]^=e;for(d=0;4>d;d++)a.call(this);}},_doProcessBlock:function(b,d){var f=this._X;a.call(this);c[0]=f[0]^f[5]>>>16^f[3]<<16;c[1]=f[2]^f[7]>>>16^f[5]<<16;c[2]=f[4]^f[1]>>>16^f[7]<<16;c[3]=f[6]^f[3]>>>16^f[1]<<16;for(f=0;4>f;f++)c[f]=(c[f]<<8|c[f]>>>24)&16711935|(c[f]<<24|c[f]>>>8)&4278255360,b[d+f]^=c[f];},blockSize:4,ivSize:2});b.Rabbit=e._createHelper(k);})();return b.Rabbit});},{"./cipher-core":33,"./core":34,"./enc-base64":35,"./evpkdf":37,"./md5":42}],56:[function(e,n,k){(function(b,a,h){"object"===
  typeof k?n.exports=k=a(e("./core"),e("./enc-base64"),e("./md5"),e("./evpkdf"),e("./cipher-core")):a(b.CryptoJS);})(this,function(b){(function(){function a(){for(var a=this._S,b=this._i,c=this._j,f=0,e=0;4>e;e++){b=(b+1)%256;c=(c+a[b])%256;var h=a[b];a[b]=a[c];a[c]=h;f|=a[(a[b]+a[c])%256]<<24-8*e;}this._i=b;this._j=c;return f}var e=b.lib.StreamCipher,c=b.algo,f=c.RC4=e.extend({_doReset:function(){var a=this._key,b=a.words;a=a.sigBytes;for(var c=this._S=[],f=0;256>f;f++)c[f]=f;for(var e=f=0;256>f;f++){var h=
  f%a;e=(e+c[f]+(b[h>>>2]>>>24-h%4*8&255))%256;h=c[f];c[f]=c[e];c[e]=h;}this._i=this._j=0;},_doProcessBlock:function(b,c){b[c]^=a.call(this);},keySize:8,ivSize:0});b.RC4=e._createHelper(f);c=c.RC4Drop=f.extend({cfg:f.cfg.extend({drop:192}),_doReset:function(){f._doReset.call(this);for(var b=this.cfg.drop;0<b;b--)a.call(this);}});b.RC4Drop=e._createHelper(c);})();return b.RC4});},{"./cipher-core":33,"./core":34,"./enc-base64":35,"./evpkdf":37,"./md5":42}],57:[function(e,n,k){(function(b,a){"object"===typeof k?
  n.exports=k=a(e("./core")):a(b.CryptoJS);})(this,function(b){(function(a){function e(a,b){return a<<b|a>>>32-b}a=b.lib;var c=a.WordArray,f=a.Hasher;a=b.algo;var d=c.create([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13]),k=c.create([5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,
  15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11]),u=c.create([11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6]),n=c.create([8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11]),l=c.create([0,
  1518500249,1859775393,2400959708,2840853838]),r=c.create([1352829926,1548603684,1836072691,2053994217,0]);a=a.RIPEMD160=f.extend({_doReset:function(){this._hash=c.create([1732584193,4023233417,2562383102,271733878,3285377520]);},_doProcessBlock:function(a,b){for(var c=0;16>c;c++){var f=b+c,g=a[f];a[f]=(g<<8|g>>>24)&16711935|(g<<24|g>>>8)&4278255360;}f=this._hash.words;g=l.words;var h=r.words,x=d.words,v=k.words,w=u.words,y=n.words,F,G,A,K,N;var C=F=f[0];var X=G=f[1];var z=A=f[2];var t=K=f[3];var p=
  N=f[4];for(c=0;80>c;c+=1){var S=F+a[b+x[c]]|0;S=16>c?S+((G^A^K)+g[0]):32>c?S+((G&A|~G&K)+g[1]):48>c?S+(((G|~A)^K)+g[2]):64>c?S+((G&K|A&~K)+g[3]):S+((G^(A|~K))+g[4]);S|=0;S=e(S,w[c]);S=S+N|0;F=N;N=K;K=e(A,10);A=G;G=S;S=C+a[b+v[c]]|0;S=16>c?S+((X^(z|~t))+h[0]):32>c?S+((X&t|z&~t)+h[1]):48>c?S+(((X|~z)^t)+h[2]):64>c?S+((X&z|~X&t)+h[3]):S+((X^z^t)+h[4]);S|=0;S=e(S,y[c]);S=S+p|0;C=p;p=t;t=e(z,10);z=X;X=S;}S=f[1]+A+t|0;f[1]=f[2]+K+p|0;f[2]=f[3]+N+C|0;f[3]=f[4]+F+X|0;f[4]=f[0]+G+z|0;f[0]=S;},_doFinalize:function(){var a=
  this._data,b=a.words,c=8*this._nDataBytes,d=8*a.sigBytes;b[d>>>5]|=128<<24-d%32;b[(d+64>>>9<<4)+14]=(c<<8|c>>>24)&16711935|(c<<24|c>>>8)&4278255360;a.sigBytes=4*(b.length+1);this._process();a=this._hash;b=a.words;for(c=0;5>c;c++)d=b[c],b[c]=(d<<8|d>>>24)&16711935|(d<<24|d>>>8)&4278255360;return a},clone:function(){var a=f.clone.call(this);a._hash=this._hash.clone();return a}});b.RIPEMD160=f._createHelper(a);b.HmacRIPEMD160=f._createHmacHelper(a);})(Math);return b.RIPEMD160});},{"./core":34}],58:[function(e,
  n,k){(function(b,a){"object"===typeof k?n.exports=k=a(e("./core")):a(b.CryptoJS);})(this,function(b){(function(){var a=b.lib,e=a.WordArray,c=a.Hasher,f=[];a=b.algo.SHA1=c.extend({_doReset:function(){this._hash=new e.init([1732584193,4023233417,2562383102,271733878,3285377520]);},_doProcessBlock:function(a,b){for(var c=this._hash.words,d=c[0],e=c[1],h=c[2],k=c[3],v=c[4],m=0;80>m;m++){if(16>m)f[m]=a[b+m]|0;else {var B=f[m-3]^f[m-8]^f[m-14]^f[m-16];f[m]=B<<1|B>>>31;}B=(d<<5|d>>>27)+v+f[m];B=20>m?B+((e&h|
  ~e&k)+1518500249):40>m?B+((e^h^k)+1859775393):60>m?B+((e&h|e&k|h&k)-1894007588):B+((e^h^k)-899497514);v=k;k=h;h=e<<30|e>>>2;e=d;d=B;}c[0]=c[0]+d|0;c[1]=c[1]+e|0;c[2]=c[2]+h|0;c[3]=c[3]+k|0;c[4]=c[4]+v|0;},_doFinalize:function(){var a=this._data,b=a.words,c=8*this._nDataBytes,f=8*a.sigBytes;b[f>>>5]|=128<<24-f%32;b[(f+64>>>9<<4)+14]=Math.floor(c/4294967296);b[(f+64>>>9<<4)+15]=c;a.sigBytes=4*b.length;this._process();return this._hash},clone:function(){var a=c.clone.call(this);a._hash=this._hash.clone();
  return a}});b.SHA1=c._createHelper(a);b.HmacSHA1=c._createHmacHelper(a);})();return b.SHA1});},{"./core":34}],59:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./sha256")):a(b.CryptoJS);})(this,function(b){(function(){var a=b.lib.WordArray,e=b.algo,c=e.SHA256;e=e.SHA224=c.extend({_doReset:function(){this._hash=new a.init([3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428]);},_doFinalize:function(){var a=c._doFinalize.call(this);a.sigBytes-=
  4;return a}});b.SHA224=c._createHelper(e);b.HmacSHA224=c._createHmacHelper(e);})();return b.SHA224});},{"./core":34,"./sha256":60}],60:[function(e,n,k){(function(b,a){"object"===typeof k?n.exports=k=a(e("./core")):a(b.CryptoJS);})(this,function(b){(function(a){var e=b.lib,c=e.WordArray,f=e.Hasher;e=b.algo;var d=[],k=[];(function(){function b(b){for(var c=a.sqrt(b),d=2;d<=c;d++)if(!(b%d))return !1;return !0}function c(a){return 4294967296*(a-(a|0))|0}for(var f=2,e=0;64>e;)b(f)&&(8>e&&(d[e]=c(a.pow(f,.5))),
  k[e]=c(a.pow(f,1/3)),e++),f++;})();var u=[];e=e.SHA256=f.extend({_doReset:function(){this._hash=new c.init(d.slice(0));},_doProcessBlock:function(a,b){for(var c=this._hash.words,d=c[0],f=c[1],e=c[2],h=c[3],g=c[4],l=c[5],v=c[6],n=c[7],w=0;64>w;w++){if(16>w)u[w]=a[b+w]|0;else {var E=u[w-15],F=u[w-2];u[w]=((E<<25|E>>>7)^(E<<14|E>>>18)^E>>>3)+u[w-7]+((F<<15|F>>>17)^(F<<13|F>>>19)^F>>>10)+u[w-16];}E=n+((g<<26|g>>>6)^(g<<21|g>>>11)^(g<<7|g>>>25))+(g&l^~g&v)+k[w]+u[w];F=((d<<30|d>>>2)^(d<<19|d>>>13)^(d<<10|
  d>>>22))+(d&f^d&e^f&e);n=v;v=l;l=g;g=h+E|0;h=e;e=f;f=d;d=E+F|0;}c[0]=c[0]+d|0;c[1]=c[1]+f|0;c[2]=c[2]+e|0;c[3]=c[3]+h|0;c[4]=c[4]+g|0;c[5]=c[5]+l|0;c[6]=c[6]+v|0;c[7]=c[7]+n|0;},_doFinalize:function(){var b=this._data,c=b.words,d=8*this._nDataBytes,f=8*b.sigBytes;c[f>>>5]|=128<<24-f%32;c[(f+64>>>9<<4)+14]=a.floor(d/4294967296);c[(f+64>>>9<<4)+15]=d;b.sigBytes=4*c.length;this._process();return this._hash},clone:function(){var a=f.clone.call(this);a._hash=this._hash.clone();return a}});b.SHA256=f._createHelper(e);
  b.HmacSHA256=f._createHmacHelper(e);})(Math);return b.SHA256});},{"./core":34}],61:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./x64-core")):a(b.CryptoJS);})(this,function(b){(function(a){var e=b.lib,c=e.WordArray,f=e.Hasher,d=b.x64.Word;e=b.algo;var k=[],u=[],n=[];(function(){for(var a=1,b=0,c=0;24>c;c++){k[a+5*b]=(c+1)*(c+2)/2%64;var f=(2*a+3*b)%5;a=b%5;b=f;}for(a=0;5>a;a++)for(b=0;5>b;b++)u[a+5*b]=b+(2*a+3*b)%5*5;a=1;for(b=0;24>b;b++){for(var e=f=c=0;7>e;e++){if(a&
  1){var g=(1<<e)-1;32>g?f^=1<<g:c^=1<<g-32;}a=a&128?a<<1^113:a<<1;}n[b]=d.create(c,f);}})();var l=[];(function(){for(var a=0;25>a;a++)l[a]=d.create();})();e=e.SHA3=f.extend({cfg:f.cfg.extend({outputLength:512}),_doReset:function(){for(var a=this._state=[],b=0;25>b;b++)a[b]=new d.init;this.blockSize=(1600-2*this.cfg.outputLength)/32;},_doProcessBlock:function(a,b){for(var c=this._state,d=this.blockSize/2,f=0;f<d;f++){var e=a[b+2*f],h=a[b+2*f+1];e=(e<<8|e>>>24)&16711935|(e<<24|e>>>8)&4278255360;h=(h<<8|h>>>
  24)&16711935|(h<<24|h>>>8)&4278255360;var r=c[f];r.high^=h;r.low^=e;}for(a=0;24>a;a++){for(b=0;5>b;b++){for(e=h=d=0;5>e;e++)r=c[b+5*e],d^=r.high,h^=r.low;r=l[b];r.high=d;r.low=h;}for(b=0;5>b;b++)for(r=l[(b+4)%5],d=l[(b+1)%5],f=d.high,e=d.low,d=r.high^(f<<1|e>>>31),h=r.low^(e<<1|f>>>31),e=0;5>e;e++)r=c[b+5*e],r.high^=d,r.low^=h;for(f=1;25>f;f++)r=c[f],b=r.high,r=r.low,e=k[f],32>e?(d=b<<e|r>>>32-e,h=r<<e|b>>>32-e):(d=r<<e-32|b>>>64-e,h=b<<e-32|r>>>64-e),r=l[u[f]],r.high=d,r.low=h;r=l[0];b=c[0];r.high=
  b.high;r.low=b.low;for(b=0;5>b;b++)for(e=0;5>e;e++)f=b+5*e,r=c[f],d=l[f],f=l[(b+1)%5+5*e],h=l[(b+2)%5+5*e],r.high=d.high^~f.high&h.high,r.low=d.low^~f.low&h.low;r=c[0];b=n[a];r.high^=b.high;r.low^=b.low;}},_doFinalize:function(){var b=this._data,d=b.words,f=8*b.sigBytes,e=32*this.blockSize;d[f>>>5]|=1<<24-f%32;d[(a.ceil((f+1)/e)*e>>>5)-1]|=128;b.sigBytes=4*d.length;this._process();b=this._state;d=this.cfg.outputLength/8;f=d/8;e=[];for(var h=0;h<f;h++){var g=b[h],l=g.high;g=g.low;l=(l<<8|l>>>24)&16711935|
  (l<<24|l>>>8)&4278255360;g=(g<<8|g>>>24)&16711935|(g<<24|g>>>8)&4278255360;e.push(g);e.push(l);}return new c.init(e,d)},clone:function(){for(var a=f.clone.call(this),b=a._state=this._state.slice(0),c=0;25>c;c++)b[c]=b[c].clone();return a}});b.SHA3=f._createHelper(e);b.HmacSHA3=f._createHmacHelper(e);})(Math);return b.SHA3});},{"./core":34,"./x64-core":65}],62:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./x64-core"),e("./sha512")):a(b.CryptoJS);})(this,function(b){(function(){var a=
  b.x64,e=a.Word,c=a.WordArray;a=b.algo;var f=a.SHA512;a=a.SHA384=f.extend({_doReset:function(){this._hash=new c.init([new e.init(3418070365,3238371032),new e.init(1654270250,914150663),new e.init(2438529370,812702999),new e.init(355462360,4144912697),new e.init(1731405415,4290775857),new e.init(2394180231,1750603025),new e.init(3675008525,1694076839),new e.init(1203062813,3204075428)]);},_doFinalize:function(){var a=f._doFinalize.call(this);a.sigBytes-=16;return a}});b.SHA384=f._createHelper(a);b.HmacSHA384=
  f._createHmacHelper(a);})();return b.SHA384});},{"./core":34,"./sha512":63,"./x64-core":65}],63:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),e("./x64-core")):a(b.CryptoJS);})(this,function(b){(function(){function a(){return f.create.apply(f,arguments)}var e=b.lib.Hasher,c=b.x64,f=c.Word,d=c.WordArray;c=b.algo;var k=[a(1116352408,3609767458),a(1899447441,602891725),a(3049323471,3964484399),a(3921009573,2173295548),a(961987163,4081628472),a(1508970993,3053834265),a(2453635748,
  2937671579),a(2870763221,3664609560),a(3624381080,2734883394),a(310598401,1164996542),a(607225278,1323610764),a(1426881987,3590304994),a(1925078388,4068182383),a(2162078206,991336113),a(2614888103,633803317),a(3248222580,3479774868),a(3835390401,2666613458),a(4022224774,944711139),a(264347078,2341262773),a(604807628,2007800933),a(770255983,1495990901),a(1249150122,1856431235),a(1555081692,3175218132),a(1996064986,2198950837),a(2554220882,3999719339),a(2821834349,766784016),a(2952996808,2566594879),
  a(3210313671,3203337956),a(3336571891,1034457026),a(3584528711,2466948901),a(113926993,3758326383),a(338241895,168717936),a(666307205,1188179964),a(773529912,1546045734),a(1294757372,1522805485),a(1396182291,2643833823),a(1695183700,2343527390),a(1986661051,1014477480),a(2177026350,1206759142),a(2456956037,344077627),a(2730485921,1290863460),a(2820302411,3158454273),a(3259730800,3505952657),a(3345764771,106217008),a(3516065817,3606008344),a(3600352804,1432725776),a(4094571909,1467031594),a(275423344,
  851169720),a(430227734,3100823752),a(506948616,1363258195),a(659060556,3750685593),a(883997877,3785050280),a(958139571,3318307427),a(1322822218,3812723403),a(1537002063,2003034995),a(1747873779,3602036899),a(1955562222,1575990012),a(2024104815,1125592928),a(2227730452,2716904306),a(2361852424,442776044),a(2428436474,593698344),a(2756734187,3733110249),a(3204031479,2999351573),a(3329325298,3815920427),a(3391569614,3928383900),a(3515267271,566280711),a(3940187606,3454069534),a(4118630271,4000239992),
  a(116418474,1914138554),a(174292421,2731055270),a(289380356,3203993006),a(460393269,320620315),a(685471733,587496836),a(852142971,1086792851),a(1017036298,365543100),a(1126000580,2618297676),a(1288033470,3409855158),a(1501505948,4234509866),a(1607167915,987167468),a(1816402316,1246189591)],u=[];(function(){for(var b=0;80>b;b++)u[b]=a();})();c=c.SHA512=e.extend({_doReset:function(){this._hash=new d.init([new f.init(1779033703,4089235720),new f.init(3144134277,2227873595),new f.init(1013904242,4271175723),
  new f.init(2773480762,1595750129),new f.init(1359893119,2917565137),new f.init(2600822924,725511199),new f.init(528734635,4215389547),new f.init(1541459225,327033209)]);},_doProcessBlock:function(a,b){var c=this._hash.words,d=c[0],f=c[1],e=c[2],h=c[3],g=c[4],l=c[5],v=c[6];c=c[7];for(var n=d.high,w=d.low,E=f.high,F=f.low,G=e.high,A=e.low,K=h.high,N=h.low,C=g.high,X=g.low,z=l.high,t=l.low,p=v.high,S=v.low,ba=c.high,fa=c.low,Z=n,da=w,oa=E,ka=F,R=G,Q=A,ca=K,V=N,W=C,Y=X,xa=z,L=t,ta=p,ua=S,va=ba,sa=fa,ha=
  0;80>ha;ha++){var qa=u[ha];if(16>ha)var ia=qa.high=a[b+2*ha]|0,aa=qa.low=a[b+2*ha+1]|0;else {ia=u[ha-15];aa=ia.high;var la=ia.low;ia=(aa>>>1|la<<31)^(aa>>>8|la<<24)^aa>>>7;la=(la>>>1|aa<<31)^(la>>>8|aa<<24)^(la>>>7|aa<<25);var ra=u[ha-2];aa=ra.high;var ea=ra.low;ra=(aa>>>19|ea<<13)^(aa<<3|ea>>>29)^aa>>>6;ea=(ea>>>19|aa<<13)^(ea<<3|aa>>>29)^(ea>>>6|aa<<26);aa=u[ha-7];var pa=aa.high,ma=u[ha-16],na=ma.high;ma=ma.low;aa=la+aa.low;ia=ia+pa+(aa>>>0<la>>>0?1:0);aa+=ea;ia=ia+ra+(aa>>>0<ea>>>0?1:0);aa+=ma;
  ia=ia+na+(aa>>>0<ma>>>0?1:0);qa.high=ia;qa.low=aa;}pa=W&xa^~W&ta;ma=Y&L^~Y&ua;qa=Z&oa^Z&R^oa&R;var za=da&ka^da&Q^ka&Q;la=(Z>>>28|da<<4)^(Z<<30|da>>>2)^(Z<<25|da>>>7);ra=(da>>>28|Z<<4)^(da<<30|Z>>>2)^(da<<25|Z>>>7);ea=k[ha];var T=ea.high,U=ea.low;ea=sa+((Y>>>14|W<<18)^(Y>>>18|W<<14)^(Y<<23|W>>>9));na=va+((W>>>14|Y<<18)^(W>>>18|Y<<14)^(W<<23|Y>>>9))+(ea>>>0<sa>>>0?1:0);ea+=ma;na=na+pa+(ea>>>0<ma>>>0?1:0);ea+=U;na=na+T+(ea>>>0<U>>>0?1:0);ea+=aa;na=na+ia+(ea>>>0<aa>>>0?1:0);aa=ra+za;qa=la+qa+(aa>>>0<ra>>>
  0?1:0);va=ta;sa=ua;ta=xa;ua=L;xa=W;L=Y;Y=V+ea|0;W=ca+na+(Y>>>0<V>>>0?1:0)|0;ca=R;V=Q;R=oa;Q=ka;oa=Z;ka=da;da=ea+aa|0;Z=na+qa+(da>>>0<ea>>>0?1:0)|0;}w=d.low=w+da;d.high=n+Z+(w>>>0<da>>>0?1:0);F=f.low=F+ka;f.high=E+oa+(F>>>0<ka>>>0?1:0);A=e.low=A+Q;e.high=G+R+(A>>>0<Q>>>0?1:0);N=h.low=N+V;h.high=K+ca+(N>>>0<V>>>0?1:0);X=g.low=X+Y;g.high=C+W+(X>>>0<Y>>>0?1:0);t=l.low=t+L;l.high=z+xa+(t>>>0<L>>>0?1:0);S=v.low=S+ua;v.high=p+ta+(S>>>0<ua>>>0?1:0);fa=c.low=fa+sa;c.high=ba+va+(fa>>>0<sa>>>0?1:0);},_doFinalize:function(){var a=
  this._data,b=a.words,c=8*this._nDataBytes,d=8*a.sigBytes;b[d>>>5]|=128<<24-d%32;b[(d+128>>>10<<5)+30]=Math.floor(c/4294967296);b[(d+128>>>10<<5)+31]=c;a.sigBytes=4*b.length;this._process();return this._hash.toX32()},clone:function(){var a=e.clone.call(this);a._hash=this._hash.clone();return a},blockSize:32});b.SHA512=e._createHelper(c);b.HmacSHA512=e._createHmacHelper(c);})();return b.SHA512});},{"./core":34,"./x64-core":65}],64:[function(e,n,k){(function(b,a,h){"object"===typeof k?n.exports=k=a(e("./core"),
  e("./enc-base64"),e("./md5"),e("./evpkdf"),e("./cipher-core")):a(b.CryptoJS);})(this,function(b){(function(){function a(a,b){b&=this._lBlock>>>a^this._rBlock;this._rBlock^=b;this._lBlock^=b<<a;}function e(a,b){b&=this._rBlock>>>a^this._lBlock;this._lBlock^=b;this._rBlock^=b<<a;}var c=b.lib,f=c.WordArray;c=c.BlockCipher;var d=b.algo,k=[57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4],u=[14,
  17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,41,52,31,37,47,55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32],n=[1,2,4,6,8,10,12,14,15,17,19,21,23,25,27,28],l=[{0:8421888,268435456:32768,536870912:8421378,805306368:2,1073741824:512,1342177280:8421890,1610612736:8389122,1879048192:8388608,2147483648:514,2415919104:8389120,2684354560:33280,2952790016:8421376,3221225472:32770,3489660928:8388610,3758096384:0,4026531840:33282,134217728:0,402653184:8421890,671088640:33282,939524096:32768,
  1207959552:8421888,1476395008:512,1744830464:8421378,2013265920:2,2281701376:8389120,2550136832:33280,2818572288:8421376,3087007744:8389122,3355443200:8388610,3623878656:32770,3892314112:514,4160749568:8388608,1:32768,268435457:2,536870913:8421888,805306369:8388608,1073741825:8421378,1342177281:33280,1610612737:512,1879048193:8389122,2147483649:8421890,2415919105:8421376,2684354561:8388610,2952790017:33282,3221225473:514,3489660929:8389120,3758096385:32770,4026531841:0,134217729:8421890,402653185:8421376,
  671088641:8388608,939524097:512,1207959553:32768,1476395009:8388610,1744830465:2,2013265921:33282,2281701377:32770,2550136833:8389122,2818572289:514,3087007745:8421888,3355443201:8389120,3623878657:0,3892314113:33280,4160749569:8421378},{0:1074282512,16777216:16384,33554432:524288,50331648:1074266128,67108864:1073741840,83886080:1074282496,100663296:1073758208,117440512:16,134217728:540672,150994944:1073758224,167772160:1073741824,184549376:540688,201326592:524304,218103808:0,234881024:16400,251658240:1074266112,
  8388608:1073758208,25165824:540688,41943040:16,58720256:1073758224,75497472:1074282512,92274688:1073741824,109051904:524288,125829120:1074266128,142606336:524304,159383552:0,176160768:16384,192937984:1074266112,209715200:1073741840,226492416:540672,243269632:1074282496,260046848:16400,268435456:0,285212672:1074266128,301989888:1073758224,318767104:1074282496,335544320:1074266112,352321536:16,369098752:540688,385875968:16384,402653184:16400,419430400:524288,436207616:524304,452984832:1073741840,469762048:540672,
  486539264:1073758208,503316480:1073741824,520093696:1074282512,276824064:540688,293601280:524288,310378496:1074266112,327155712:16384,343932928:1073758208,360710144:1074282512,377487360:16,394264576:1073741824,411041792:1074282496,427819008:1073741840,444596224:1073758224,461373440:524304,478150656:0,494927872:16400,511705088:1074266128,528482304:540672},{0:260,1048576:0,2097152:67109120,3145728:65796,4194304:65540,5242880:67108868,6291456:67174660,7340032:67174400,8388608:67108864,9437184:67174656,
  10485760:65792,11534336:67174404,12582912:67109124,13631488:65536,14680064:4,15728640:256,524288:67174656,1572864:67174404,2621440:0,3670016:67109120,4718592:67108868,5767168:65536,6815744:65540,7864320:260,8912896:4,9961472:256,11010048:67174400,12058624:65796,13107200:65792,14155776:67109124,15204352:67174660,16252928:67108864,16777216:67174656,17825792:65540,18874368:65536,19922944:67109120,20971520:256,22020096:67174660,23068672:67108868,24117248:0,25165824:67109124,26214400:67108864,27262976:4,
  28311552:65792,29360128:67174400,30408704:260,31457280:65796,32505856:67174404,17301504:67108864,18350080:260,19398656:67174656,20447232:0,21495808:65540,22544384:67109120,23592960:256,24641536:67174404,25690112:65536,26738688:67174660,27787264:65796,28835840:67108868,29884416:67109124,30932992:67174400,31981568:4,33030144:65792},{0:2151682048,65536:2147487808,131072:4198464,196608:2151677952,262144:0,327680:4198400,393216:2147483712,458752:4194368,524288:2147483648,589824:4194304,655360:64,720896:2147487744,
  786432:2151678016,851968:4160,917504:4096,983040:2151682112,32768:2147487808,98304:64,163840:2151678016,229376:2147487744,294912:4198400,360448:2151682112,425984:0,491520:2151677952,557056:4096,622592:2151682048,688128:4194304,753664:4160,819200:2147483648,884736:4194368,950272:4198464,1015808:2147483712,1048576:4194368,1114112:4198400,1179648:2147483712,1245184:0,1310720:4160,1376256:2151678016,1441792:2151682048,1507328:2147487808,1572864:2151682112,1638400:2147483648,1703936:2151677952,1769472:4198464,
  1835008:2147487744,1900544:4194304,1966080:64,2031616:4096,1081344:2151677952,1146880:2151682112,1212416:0,1277952:4198400,1343488:4194368,1409024:2147483648,1474560:2147487808,1540096:64,1605632:2147483712,1671168:4096,1736704:2147487744,1802240:2151678016,1867776:4160,1933312:2151682048,1998848:4194304,2064384:4198464},{0:128,4096:17039360,8192:262144,12288:536870912,16384:537133184,20480:16777344,24576:553648256,28672:262272,32768:16777216,36864:537133056,40960:536871040,45056:553910400,49152:553910272,
  53248:0,57344:17039488,61440:553648128,2048:17039488,6144:553648256,10240:128,14336:17039360,18432:262144,22528:537133184,26624:553910272,30720:536870912,34816:537133056,38912:0,43008:553910400,47104:16777344,51200:536871040,55296:553648128,59392:16777216,63488:262272,65536:262144,69632:128,73728:536870912,77824:553648256,81920:16777344,86016:553910272,90112:537133184,94208:16777216,98304:553910400,102400:553648128,106496:17039360,110592:537133056,114688:262272,118784:536871040,122880:0,126976:17039488,
  67584:553648256,71680:16777216,75776:17039360,79872:537133184,83968:536870912,88064:17039488,92160:128,96256:553910272,100352:262272,104448:553910400,108544:0,112640:553648128,116736:16777344,120832:262144,124928:537133056,129024:536871040},{0:268435464,256:8192,512:270532608,768:270540808,1024:268443648,1280:2097152,1536:2097160,1792:268435456,2048:0,2304:268443656,2560:2105344,2816:8,3072:270532616,3328:2105352,3584:8200,3840:270540800,128:270532608,384:270540808,640:8,896:2097152,1152:2105352,
  1408:268435464,1664:268443648,1920:8200,2176:2097160,2432:8192,2688:268443656,2944:270532616,3200:0,3456:270540800,3712:2105344,3968:268435456,4096:268443648,4352:270532616,4608:270540808,4864:8200,5120:2097152,5376:268435456,5632:268435464,5888:2105344,6144:2105352,6400:0,6656:8,6912:270532608,7168:8192,7424:268443656,7680:270540800,7936:2097160,4224:8,4480:2105344,4736:2097152,4992:268435464,5248:268443648,5504:8200,5760:270540808,6016:270532608,6272:270540800,6528:270532616,6784:8192,7040:2105352,
  7296:2097160,7552:0,7808:268435456,8064:268443656},{0:1048576,16:33555457,32:1024,48:1049601,64:34604033,80:0,96:1,112:34603009,128:33555456,144:1048577,160:33554433,176:34604032,192:34603008,208:1025,224:1049600,240:33554432,8:34603009,24:0,40:33555457,56:34604032,72:1048576,88:33554433,104:33554432,120:1025,136:1049601,152:33555456,168:34603008,184:1048577,200:1024,216:34604033,232:1,248:1049600,256:33554432,272:1048576,288:33555457,304:34603009,320:1048577,336:33555456,352:34604032,368:1049601,
  384:1025,400:34604033,416:1049600,432:1,448:0,464:34603008,480:33554433,496:1024,264:1049600,280:33555457,296:34603009,312:1,328:33554432,344:1048576,360:1025,376:34604032,392:33554433,408:34603008,424:0,440:34604033,456:1049601,472:1024,488:33555456,504:1048577},{0:134219808,1:131072,2:134217728,3:32,4:131104,5:134350880,6:134350848,7:2048,8:134348800,9:134219776,10:133120,11:134348832,12:2080,13:0,14:134217760,15:133152,2147483648:2048,2147483649:134350880,2147483650:134219808,2147483651:134217728,
  2147483652:134348800,2147483653:133120,2147483654:133152,2147483655:32,2147483656:134217760,2147483657:2080,2147483658:131104,2147483659:134350848,2147483660:0,2147483661:134348832,2147483662:134219776,2147483663:131072,16:133152,17:134350848,18:32,19:2048,20:134219776,21:134217760,22:134348832,23:131072,24:0,25:131104,26:134348800,27:134219808,28:134350880,29:133120,30:2080,31:134217728,2147483664:131072,2147483665:2048,2147483666:134348832,2147483667:133152,2147483668:32,2147483669:134348800,2147483670:134217728,
  2147483671:134219808,2147483672:134350880,2147483673:134217760,2147483674:134219776,2147483675:0,2147483676:133120,2147483677:2080,2147483678:131104,2147483679:134350848}],r=[4160749569,528482304,33030144,2064384,129024,8064,504,2147483679],x=d.DES=c.extend({_doReset:function(){for(var a=this._key.words,b=[],c=0;56>c;c++){var d=k[c]-1;b[c]=a[d>>>5]>>>31-d%32&1;}a=this._subKeys=[];for(d=0;16>d;d++){var f=a[d]=[],e=n[d];for(c=0;24>c;c++)f[c/6|0]|=b[(u[c]-1+e)%28]<<31-c%6,f[4+(c/6|0)]|=b[28+(u[c+24]-
  1+e)%28]<<31-c%6;f[0]=f[0]<<1|f[0]>>>31;for(c=1;7>c;c++)f[c]>>>=4*(c-1)+3;f[7]=f[7]<<5|f[7]>>>27;}b=this._invSubKeys=[];for(c=0;16>c;c++)b[c]=a[15-c];},encryptBlock:function(a,b){this._doCryptBlock(a,b,this._subKeys);},decryptBlock:function(a,b){this._doCryptBlock(a,b,this._invSubKeys);},_doCryptBlock:function(b,c,d){this._lBlock=b[c];this._rBlock=b[c+1];a.call(this,4,252645135);a.call(this,16,65535);e.call(this,2,858993459);e.call(this,8,16711935);a.call(this,1,1431655765);for(var f=0;16>f;f++){for(var h=
  d[f],m=this._lBlock,k=this._rBlock,v=0,u=0;8>u;u++)v|=l[u][((k^h[u])&r[u])>>>0];this._lBlock=k;this._rBlock=m^v;}d=this._lBlock;this._lBlock=this._rBlock;this._rBlock=d;a.call(this,1,1431655765);e.call(this,8,16711935);e.call(this,2,858993459);a.call(this,16,65535);a.call(this,4,252645135);b[c]=this._lBlock;b[c+1]=this._rBlock;},keySize:2,ivSize:2,blockSize:2});b.DES=c._createHelper(x);d=d.TripleDES=c.extend({_doReset:function(){var a=this._key.words;this._des1=x.createEncryptor(f.create(a.slice(0,
  2)));this._des2=x.createEncryptor(f.create(a.slice(2,4)));this._des3=x.createEncryptor(f.create(a.slice(4,6)));},encryptBlock:function(a,b){this._des1.encryptBlock(a,b);this._des2.decryptBlock(a,b);this._des3.encryptBlock(a,b);},decryptBlock:function(a,b){this._des3.decryptBlock(a,b);this._des2.encryptBlock(a,b);this._des1.decryptBlock(a,b);},keySize:6,ivSize:2,blockSize:2});b.TripleDES=c._createHelper(d);})();return b.TripleDES});},{"./cipher-core":33,"./core":34,"./enc-base64":35,"./evpkdf":37,"./md5":42}],
  65:[function(e,n,k){(function(b,a){"object"===typeof k?n.exports=k=a(e("./core")):a(b.CryptoJS);})(this,function(b){(function(a){var e=b.lib,c=e.Base,f=e.WordArray;e=b.x64={};e.Word=c.extend({init:function(a,b){this.high=a;this.low=b;}});e.WordArray=c.extend({init:function(b,c){b=this.words=b||[];this.sigBytes=c!=a?c:8*b.length;},toX32:function(){for(var a=this.words,b=a.length,c=[],e=0;e<b;e++){var h=a[e];c.push(h.high);c.push(h.low);}return f.create(c,this.sigBytes)},clone:function(){for(var a=c.clone.call(this),
  b=a.words=this.words.slice(0),f=b.length,e=0;e<f;e++)b[e]=b[e].clone();return a}});})();return b});},{"./core":34}],66:[function(e,n,k){function b(){this._events&&Object.prototype.hasOwnProperty.call(this,"_events")||(this._events=r(null),this._eventsCount=0);this._maxListeners=this._maxListeners||void 0;}function a(a,c,d,f){var e;if("function"!==typeof d)throw new TypeError('"listener" argument must be a function');if(e=a._events){e.newListener&&(a.emit("newListener",c,d.listener?d.listener:d),e=a._events);
  var g=e[c];}else e=a._events=r(null),a._eventsCount=0;g?("function"===typeof g?g=e[c]=f?[d,g]:[g,d]:f?g.unshift(d):g.push(d),g.warned||(d=void 0===a._maxListeners?b.defaultMaxListeners:a._maxListeners)&&0<d&&g.length>d&&(g.warned=!0,d=Error("Possible EventEmitter memory leak detected. "+g.length+' "'+String(c)+'" listeners added. Use emitter.setMaxListeners() to increase limit.'),d.name="MaxListenersExceededWarning",d.emitter=a,d.type=c,d.count=g.length,"object"===typeof console&&console.warn&&console.warn("%s: %s",
  d.name,d.message))):(e[c]=d,++a._eventsCount);return a}function h(){if(!this.fired)switch(this.target.removeListener(this.type,this.wrapFn),this.fired=!0,arguments.length){case 0:return this.listener.call(this.target);case 1:return this.listener.call(this.target,arguments[0]);case 2:return this.listener.call(this.target,arguments[0],arguments[1]);case 3:return this.listener.call(this.target,arguments[0],arguments[1],arguments[2]);default:for(var a=Array(arguments.length),b=0;b<a.length;++b)a[b]=arguments[b];
  this.listener.apply(this.target,a);}}function c(a,b,c){a={fired:!1,wrapFn:void 0,target:a,type:b,listener:c};b=y.call(h,a);b.listener=c;return a.wrapFn=b}function f(a,b,c){a=a._events;if(!a)return [];b=a[b];if(!b)return [];if("function"===typeof b)return c?[b.listener||b]:[b];if(c)for(c=Array(b.length),a=0;a<c.length;++a)c[a]=b[a].listener||b[a];else c=v(b,b.length);return c}function d(a){var b=this._events;if(b){a=b[a];if("function"===typeof a)return 1;if(a)return a.length}return 0}function v(a,b){for(var c=
  Array(b),d=0;d<b;++d)c[d]=a[d];return c}function u(a){var b=function(){};b.prototype=a;return new b}function w(a){var b=[],c;for(c in a)Object.prototype.hasOwnProperty.call(a,c)&&b.push(c);return c}function l(a){var b=this;return function(){return b.apply(a,arguments)}}var r=Object.create||u,x=Object.keys||w,y=Function.prototype.bind||l;n.exports=b;b.EventEmitter=b;b.prototype._events=void 0;b.prototype._maxListeners=void 0;var m=10;try{e={};Object.defineProperty&&Object.defineProperty(e,"x",{value:0});
  var B=0===e.x;}catch(g){B=!1;}B?Object.defineProperty(b,"defaultMaxListeners",{enumerable:!0,get:function(){return m},set:function(a){if("number"!==typeof a||0>a||a!==a)throw new TypeError('"defaultMaxListeners" must be a positive number');m=a;}}):b.defaultMaxListeners=m;b.prototype.setMaxListeners=function(a){if("number"!==typeof a||0>a||isNaN(a))throw new TypeError('"n" argument must be a positive number');this._maxListeners=a;return this};b.prototype.getMaxListeners=function(){return void 0===this._maxListeners?
  b.defaultMaxListeners:this._maxListeners};b.prototype.emit=function(a){var b,c,d;var f="error"===a;if(d=this._events)f=f&&null==d.error;else if(!f)return !1;if(f){1<arguments.length&&(b=arguments[1]);if(b instanceof Error)throw b;d=Error('Unhandled "error" event. ('+b+")");d.context=b;throw d;}b=d[a];if(!b)return !1;d="function"===typeof b;var e=arguments.length;switch(e){case 1:if(d)b.call(this);else for(d=b.length,b=v(b,d),f=0;f<d;++f)b[f].call(this);break;case 2:f=arguments[1];if(d)b.call(this,f);
  else for(d=b.length,b=v(b,d),e=0;e<d;++e)b[e].call(this,f);break;case 3:f=arguments[1];e=arguments[2];if(d)b.call(this,f,e);else for(d=b.length,b=v(b,d),c=0;c<d;++c)b[c].call(this,f,e);break;case 4:f=arguments[1];e=arguments[2];c=arguments[3];if(d)b.call(this,f,e,c);else {d=b.length;b=v(b,d);for(var g=0;g<d;++g)b[g].call(this,f,e,c);}break;default:f=Array(e-1);for(c=1;c<e;c++)f[c-1]=arguments[c];if(d)b.apply(this,f);else for(d=b.length,b=v(b,d),e=0;e<d;++e)b[e].apply(this,f);}return !0};b.prototype.addListener=
  function(b,c){return a(this,b,c,!1)};b.prototype.on=b.prototype.addListener;b.prototype.prependListener=function(b,c){return a(this,b,c,!0)};b.prototype.once=function(a,b){if("function"!==typeof b)throw new TypeError('"listener" argument must be a function');this.on(a,c(this,a,b));return this};b.prototype.prependOnceListener=function(a,b){if("function"!==typeof b)throw new TypeError('"listener" argument must be a function');this.prependListener(a,c(this,a,b));return this};b.prototype.removeListener=
  function(a,b){var c;if("function"!==typeof b)throw new TypeError('"listener" argument must be a function');var d=this._events;if(!d)return this;var f=d[a];if(!f)return this;if(f===b||f.listener===b)0===--this._eventsCount?this._events=r(null):(delete d[a],d.removeListener&&this.emit("removeListener",a,f.listener||b));else if("function"!==typeof f){var e=-1;for(c=f.length-1;0<=c;c--)if(f[c]===b||f[c].listener===b){var g=f[c].listener;e=c;break}if(0>e)return this;if(0===e)f.shift();else {c=e+1;for(var h=
  f.length;c<h;e+=1,c+=1)f[e]=f[c];f.pop();}1===f.length&&(d[a]=f[0]);d.removeListener&&this.emit("removeListener",a,g||b);}return this};b.prototype.removeAllListeners=function(a){var b=this._events;if(!b)return this;if(!b.removeListener)return 0===arguments.length?(this._events=r(null),this._eventsCount=0):b[a]&&(0===--this._eventsCount?this._events=r(null):delete b[a]),this;if(0===arguments.length){var c=x(b);for(b=0;b<c.length;++b){var d=c[b];"removeListener"!==d&&this.removeAllListeners(d);}this.removeAllListeners("removeListener");
  this._events=r(null);this._eventsCount=0;return this}c=b[a];if("function"===typeof c)this.removeListener(a,c);else if(c)for(b=c.length-1;0<=b;b--)this.removeListener(a,c[b]);return this};b.prototype.listeners=function(a){return f(this,a,!0)};b.prototype.rawListeners=function(a){return f(this,a,!1)};b.listenerCount=function(a,b){return "function"===typeof a.listenerCount?a.listenerCount(b):d.call(a,b)};b.prototype.listenerCount=d;b.prototype.eventNames=function(){return 0<this._eventsCount?Reflect.ownKeys(this._events):
  []};},{}],67:[function(e,n,k){k.read=function(b,a,e,c,f){var d=8*f-c-1;var h=(1<<d)-1,k=h>>1,n=-7;f=e?f-1:0;var l=e?-1:1,r=b[a+f];f+=l;e=r&(1<<-n)-1;r>>=-n;for(n+=d;0<n;e=256*e+b[a+f],f+=l,n-=8);d=e&(1<<-n)-1;e>>=-n;for(n+=c;0<n;d=256*d+b[a+f],f+=l,n-=8);if(0===e)e=1-k;else {if(e===h)return d?NaN:Infinity*(r?-1:1);d+=Math.pow(2,c);e-=k;}return (r?-1:1)*d*Math.pow(2,e-c)};k.write=function(b,a,e,c,f,d){var h,k=8*d-f-1,n=(1<<k)-1,l=n>>1,r=23===f?Math.pow(2,-24)-Math.pow(2,-77):0;d=c?0:d-1;var x=c?1:-1,y=
  0>a||0===a&&0>1/a?1:0;a=Math.abs(a);isNaN(a)||Infinity===a?(a=isNaN(a)?1:0,c=n):(c=Math.floor(Math.log(a)/Math.LN2),1>a*(h=Math.pow(2,-c))&&(c--,h*=2),a=1<=c+l?a+r/h:a+r*Math.pow(2,1-l),2<=a*h&&(c++,h/=2),c+l>=n?(a=0,c=n):1<=c+l?(a=(a*h-1)*Math.pow(2,f),c+=l):(a=a*Math.pow(2,l-1)*Math.pow(2,f),c=0));for(;8<=f;b[e+d]=a&255,d+=x,a/=256,f-=8);c=c<<f|a;for(k+=f;0<k;b[e+d]=c&255,d+=x,c/=256,k-=8);b[e+d-x]|=128*y;};},{}],68:[function(e,n,k){arguments[4][23][0].apply(k,arguments);},{dup:23}],69:[function(e,
  n,k){function b(a){return !!a.constructor&&"function"===typeof a.constructor.isBuffer&&a.constructor.isBuffer(a)}n.exports=function(a){return null!=a&&(b(a)||"function"===typeof a.readFloatLE&&"function"===typeof a.slice&&b(a.slice(0,0))||!!a._isBuffer)};},{}],70:[function(e,n,k){var b={}.toString;n.exports=Array.isArray||function(a){return "[object Array]"==b.call(a)};},{}],71:[function(e,n,k){var b=e("safe-buffer").Buffer,a=e("assert"),h=e("bl"),c=e("./lib/streams"),f=e("./lib/decoder"),d=e("./lib/encoder");
  n.exports=function(e){var k=[],n=[];e=e||{forceFloat64:!1,compatibilityMode:!1,disableTimestampEncoding:!1};return {encode:d(k,e.forceFloat64,e.compatibilityMode,e.disableTimestampEncoding),decode:f(n),register:function(c,d,f,e){a(d,"must have a constructor");a(f,"must have an encode function");a(0<=c,"must have a non-negative type");a(e,"must have a decode function");this.registerEncoder(function(a){return a instanceof d},function(a){var d=h(),e=b.allocUnsafe(1);e.writeInt8(c,0);d.append(e);d.append(f(a));
  return d});this.registerDecoder(c,e);return this},registerEncoder:function(b,c){a(b,"must have an encode function");a(c,"must have an encode function");k.push({check:b,encode:c});return this},registerDecoder:function(b,c){a(0<=b,"must have a non-negative type");a(c,"must have a decode function");n.push({type:b,decode:c});return this},encoder:c.encoder,decoder:c.decoder,buffer:!0,type:"msgpack5",IncompleteBufferError:f.IncompleteBufferError}};},{"./lib/decoder":72,"./lib/encoder":73,"./lib/streams":74,
  assert:22,bl:27,"safe-buffer":86}],72:[function(e,n,k){function b(a){Error.call(this);Error.captureStackTrace&&Error.captureStackTrace(this,this.constructor);this.name=this.constructor.name;this.message=a||"unable to decode";}var a=e("bl");e("util").inherits(b,Error);n.exports=function(e){function c(a){switch(a){case 196:return 2;case 197:return 3;case 198:return 5;case 199:return 3;case 200:return 4;case 201:return 6;case 202:return 5;case 203:return 9;case 204:return 2;case 205:return 3;case 206:return 5;
  case 207:return 9;case 208:return 2;case 209:return 3;case 210:return 5;case 211:return 9;case 212:return 3;case 213:return 4;case 214:return 6;case 215:return 10;case 216:return 18;case 217:return 2;case 218:return 3;case 219:return 5;case 222:return 3;default:return -1}}function f(a,b){return {value:a,bytesConsumed:b}}function d(a,b){b=void 0===b?0:b;var d=a.length-b;if(0>=d)return null;var e=a.readUInt8(b),r=0;var g=c(e);if(-1!==g&&d<g)return null;switch(e){case 192:return f(null,1);case 194:return f(!1,
  1);case 195:return f(!0,1);case 204:return r=a.readUInt8(b+1),f(r,2);case 205:return r=a.readUInt16BE(b+1),f(r,3);case 206:return r=a.readUInt32BE(b+1),f(r,5);case 207:for(d=7;0<=d;d--)r+=a.readUInt8(b+d+1)*Math.pow(2,8*(7-d));return f(r,9);case 208:return r=a.readInt8(b+1),f(r,2);case 209:return r=a.readInt16BE(b+1),f(r,3);case 210:return r=a.readInt32BE(b+1),f(r,5);case 211:b=a.slice(b+1,b+9);if(a=128==(b[0]&128))for(r=1,d=7;0<=d;d--)r=(b[d]^255)+r,b[d]=r&255,r>>=8;d=b.readUInt32BE(0);b=b.readUInt32BE(4);
  return f((4294967296*d+b)*(a?-1:1),9);case 202:return r=a.readFloatBE(b+1),f(r,5);case 203:return r=a.readDoubleBE(b+1),f(r,9);case 217:e=a.readUInt8(b+1);if(!(d>=2+e))return null;r=a.toString("utf8",b+2,b+2+e);return f(r,2+e);case 218:e=a.readUInt16BE(b+1);if(!(d>=3+e))return null;r=a.toString("utf8",b+3,b+3+e);return f(r,3+e);case 219:e=a.readUInt32BE(b+1);if(!(d>=5+e))return null;r=a.toString("utf8",b+5,b+5+e);return f(r,5+e);case 196:e=a.readUInt8(b+1);if(!(d>=2+e))return null;r=a.slice(b+2,b+
  2+e);return f(r,2+e);case 197:e=a.readUInt16BE(b+1);if(!(d>=3+e))return null;r=a.slice(b+3,b+3+e);return f(r,3+e);case 198:e=a.readUInt32BE(b+1);if(!(d>=5+e))return null;r=a.slice(b+5,b+5+e);return f(r,5+e);case 220:if(3>d)return null;e=a.readUInt16BE(b+1);return h(a,b,e,3);case 221:if(5>d)return null;e=a.readUInt32BE(b+1);return h(a,b,e,5);case 222:return e=a.readUInt16BE(b+1),k(a,b,e,3);case 223:return e=a.readUInt32BE(b+1),k(a,b,e,5);case 212:return n(a,b,1);case 213:return n(a,b,2);case 214:return n(a,
  b,4);case 215:return n(a,b,8);case 216:return n(a,b,16);case 199:return e=a.readUInt8(b+1),r=a.readUInt8(b+2),d>=3+e?l(a,b,r,e,3):null;case 200:return e=a.readUInt16BE(b+1),r=a.readUInt8(b+3),d>=4+e?l(a,b,r,e,4):null;case 201:return e=a.readUInt32BE(b+1),r=a.readUInt8(b+5),d>=6+e?l(a,b,r,e,6):null}if(144===(e&240))return h(a,b,e&15,1);if(128===(e&240))return k(a,b,e&15,1);if(160===(e&224))return e&=31,d>=1+e?(r=a.toString("utf8",b+1,b+e+1),f(r,e+1)):null;if(224<=e)return f(e-256,1);if(128>e)return f(e,
  1);throw Error("not implemented yet");}function h(a,b,c,e){var h=[],g,l=0;b+=e;for(g=0;g<c;g++){var m=d(a,b);if(m)h.push(m.value),b+=m.bytesConsumed,l+=m.bytesConsumed;else return null}return f(h,e+l)}function k(a,b,c,e){var h={},g,l=0;b+=e;for(g=0;g<c;g++){var m=d(a,b);if(m){b+=m.bytesConsumed;var k=d(a,b);if(k){var r=m.value;h[r]=k.value;b+=k.bytesConsumed;l+=m.bytesConsumed+k.bytesConsumed;}else return null}else return null}return f(h,e+l)}function n(a,b,c){var d=a.readInt8(b+1);return l(a,b,d,
  c,2)}function l(a,b,c,d,h){b+=h;if(0>c)switch(c){case -1:b=a=a.slice(b,b+d);a=0;switch(d){case 4:var g=b.readUInt32BE(0);break;case 8:g=b.readUInt32BE(0);b=b.readUInt32BE(4);a=g/4;g=(g&3)*Math.pow(2,32)+b;break;case 12:throw Error("timestamp 96 is not yet implemented");}return f(new Date(1E3*g+Math.round(a/1E6)),d+h)}for(g=0;g<e.length;g++)if(c===e[g].type)return a=a.slice(b,b+d),g=e[g].decode(a),f(g,h+d);throw Error("unable to find ext type "+c);}return function(c){c instanceof a||(c=a().append(c));
  var e=d(c);if(e)return c.consume(e.bytesConsumed),e.value;throw new b;}};n.exports.IncompleteBufferError=b;},{bl:27,util:92}],73:[function(e,n,k){function b(a,b){for(var c=7;0<=c;c--)a[c+1]=b&255,b/=256;}function a(a,b,c){var d=0>c;d&&(c=Math.abs(c));var e=c%4294967296;a.writeUInt32BE(Math.floor(c/4294967296),b+0);a.writeUInt32BE(e,b+4);if(d)for(d=1,c=b+7;c>=b;c--)d=(a[c]^255)+d,a[c]=d&255,d>>=8;}function h(a,b){var d=!0;Math.fround&&(d=Math.fround(a)!==a);b&&(d=!0);d?(b=c.allocUnsafe(9),b[0]=203,b.writeDoubleBE(a,
  1)):(b=c.allocUnsafe(5),b[0]=202,b.writeFloatBE(a,1));return b}var c=e("safe-buffer").Buffer,f=e("bl");n.exports=function(d,e,k,n){function l(d,w){if(void 0===d)throw Error("undefined is not encodable in msgpack!");if(d!==d&&"number"===typeof d)throw Error("NaN is not encodable in msgpack!");if(null===d){var g=c.allocUnsafe(1);g[0]=192;}else if(!0===d)g=c.allocUnsafe(1),g[0]=195;else if(!1===d)g=c.allocUnsafe(1),g[0]=194;else if("string"===typeof d){var m=c.byteLength(d);32>m?(g=c.allocUnsafe(1+m),
  g[0]=160|m,0<m&&g.write(d,1)):255>=m&&!k?(g=c.allocUnsafe(2+m),g[0]=217,g[1]=m,g.write(d,2)):65535>=m?(g=c.allocUnsafe(3+m),g[0]=218,g.writeUInt16BE(m,1),g.write(d,3)):(g=c.allocUnsafe(5+m),g[0]=219,g.writeUInt32BE(m,1),g.write(d,5));}else if(d&&(d.readUInt32LE||d instanceof Uint8Array))d instanceof Uint8Array&&(d=c.from(d)),255>=d.length?(g=c.allocUnsafe(2),g[0]=196,g[1]=d.length):65535>=d.length?(g=c.allocUnsafe(3),g[0]=197,g.writeUInt16BE(d.length,1)):(g=c.allocUnsafe(5),g[0]=198,g.writeUInt32BE(d.length,
  1)),g=f([g,d]);else if(Array.isArray(d))16>d.length?(g=c.allocUnsafe(1),g[0]=144|d.length):65536>d.length?(g=c.allocUnsafe(3),g[0]=220,g.writeUInt16BE(d.length,1)):(g=c.allocUnsafe(5),g[0]=221,g.writeUInt32BE(d.length,1)),g=d.reduce(function(a,b){a.append(l(b,!0));return a},f().append(g));else {if(!n&&"function"===typeof d.getDate)return r(d);if("object"===typeof d)g=v(d)||u(d);else if("number"===typeof d){if(0!==d%1)return h(d,e);if(0<=d)if(128>d)g=c.allocUnsafe(1),g[0]=d;else if(256>d)g=c.allocUnsafe(2),
  g[0]=204,g[1]=d;else if(65536>d)g=c.allocUnsafe(3),g[0]=205,g.writeUInt16BE(d,1);else if(4294967295>=d)g=c.allocUnsafe(5),g[0]=206,g.writeUInt32BE(d,1);else if(9007199254740991>=d)g=c.allocUnsafe(9),g[0]=207,b(g,d);else return h(d,!0);else if(-32<=d)g=c.allocUnsafe(1),g[0]=256+d;else if(-128<=d)g=c.allocUnsafe(2),g[0]=208,g.writeInt8(d,1);else if(-32768<=d)g=c.allocUnsafe(3),g[0]=209,g.writeInt16BE(d,1);else if(-214748365<d)g=c.allocUnsafe(5),g[0]=210,g.writeInt32BE(d,1);else if(-9007199254740991<=
  d)g=c.allocUnsafe(9),g[0]=211,a(g,1,d);else return h(d,!0)}}if(!g)throw Error("not implemented yet");return w?g:g.slice()}function r(a){var b=1*a,d=Math.floor(b/1E3),e=1E6*(b-1E3*d);e||4294967295<d?(a=c.allocUnsafe(10),a[0]=215,a[1]=-1,b=d&4294967295,a.writeInt32BE(4*e+d/Math.pow(2,32)&4294967295,2),a.writeInt32BE(b,6)):(a=c.allocUnsafe(6),a[0]=214,a[1]=-1,a.writeUInt32BE(Math.floor(b/1E3),2));return f().append(a)}function v(a){var b,e=[];for(b=0;b<d.length;b++)if(d[b].check(a)){var h=d[b].encode(a);
  break}if(!h)return null;a=h.length-1;1===a?e.push(212):2===a?e.push(213):4===a?e.push(214):8===a?e.push(215):16===a?e.push(216):256>a?(e.push(199),e.push(a)):(65536>a?(e.push(200),e.push(a>>8)):(e.push(201),e.push(a>>24),e.push(a>>16&255),e.push(a>>8&255)),e.push(a&255));return f().append(c.from(e)).append(h)}function u(a){var b=[],d=0,e;for(e in a)a.hasOwnProperty(e)&&void 0!==a[e]&&"function"!==typeof a[e]&&(++d,b.push(l(e,!0)),b.push(l(a[e],!0)));16>d?(a=c.allocUnsafe(1),a[0]=128|d):65535>d?(a=
  c.allocUnsafe(3),a[0]=222,a.writeUInt16BE(d,1)):(a=c.allocUnsafe(5),a[0]=223,a.writeUInt32BE(d,1));b.unshift(a);return b.reduce(function(a,b){return a.append(b)},f())}return l};},{bl:27,"safe-buffer":86}],74:[function(e,n,k){function b(a){a=a||{};a.objectMode=!0;a.highWaterMark=16;c.call(this,a);this._msgpack=a.msgpack;}function a(c){if(!(this instanceof a))return c=c||{},c.msgpack=this,new a(c);b.call(this,c);this._wrap="wrap"in c&&c.wrap;}function h(a){if(!(this instanceof h))return a=a||{},a.msgpack=
  this,new h(a);b.call(this,a);this._chunks=f();this._wrap="wrap"in a&&a.wrap;}var c=e("readable-stream").Transform;k=e("inherits");var f=e("bl");k(b,c);k(a,b);a.prototype._transform=function(a,b,c){b=null;try{b=this._msgpack.encode(this._wrap?a.value:a).slice(0);}catch(w){return this.emit("error",w),c()}this.push(b);c();};k(h,b);h.prototype._transform=function(a,b,c){a&&this._chunks.append(a);try{var d=this._msgpack.decode(this._chunks);this._wrap&&(d={value:d});this.push(d);}catch(l){l instanceof this._msgpack.IncompleteBufferError?
  c():this.emit("error",l);return}0<this._chunks.length?this._transform(null,b,c):c();};n.exports.decoder=h;n.exports.encoder=a;},{bl:27,inherits:68,"readable-stream":85}],75:[function(e,n,k){(function(b){function a(a,c,e,d){if("function"!==typeof a)throw new TypeError('"callback" argument must be a function');var f=arguments.length;switch(f){case 0:case 1:return b.nextTick(a);case 2:return b.nextTick(function(){a.call(null,c);});case 3:return b.nextTick(function(){a.call(null,c,e);});case 4:return b.nextTick(function(){a.call(null,
  c,e,d);});default:var h=Array(f-1);for(f=0;f<h.length;)h[f++]=arguments[f];return b.nextTick(function(){a.apply(null,h);})}}!b.version||0===b.version.indexOf("v0.")||0===b.version.indexOf("v1.")&&0!==b.version.indexOf("v1.8.")?n.exports={nextTick:a}:n.exports=b;}).call(this,e("_process"));},{_process:76}],76:[function(e,n,k){function b(){throw Error("setTimeout has not been defined");}function a(){throw Error("clearTimeout has not been defined");}function h(a){if(w===setTimeout)return setTimeout(a,0);
  if((w===b||!w)&&setTimeout)return w=setTimeout,setTimeout(a,0);try{return w(a,0)}catch(g){try{return w.call(null,a,0)}catch(q){return w.call(this,a,0)}}}function c(b){if(l===clearTimeout)return clearTimeout(b);if((l===a||!l)&&clearTimeout)return l=clearTimeout,clearTimeout(b);try{return l(b)}catch(g){try{return l.call(null,b)}catch(q){return l.call(this,b)}}}function f(){x&&y&&(x=!1,y.length?r=y.concat(r):m=-1,r.length&&d());}function d(){if(!x){var a=h(f);x=!0;for(var b=r.length;b;){y=r;for(r=[];++m<
  b;)y&&y[m].run();m=-1;b=r.length;}y=null;x=!1;c(a);}}function v(a,b){this.fun=a;this.array=b;}function u(){}e=n.exports={};try{var w="function"===typeof setTimeout?setTimeout:b;}catch(B){w=b;}try{var l="function"===typeof clearTimeout?clearTimeout:a;}catch(B){l=a;}var r=[],x=!1,y,m=-1;e.nextTick=function(a){var b=Array(arguments.length-1);if(1<arguments.length)for(var c=1;c<arguments.length;c++)b[c-1]=arguments[c];r.push(new v(a,b));1!==r.length||x||h(d);};v.prototype.run=function(){this.fun.apply(null,this.array);};
  e.title="browser";e.browser=!0;e.env={};e.argv=[];e.version="";e.versions={};e.on=u;e.addListener=u;e.once=u;e.off=u;e.removeListener=u;e.removeAllListeners=u;e.emit=u;e.prependListener=u;e.prependOnceListener=u;e.listeners=function(a){return []};e.binding=function(a){throw Error("process.binding is not supported");};e.cwd=function(){return "/"};e.chdir=function(a){throw Error("process.chdir is not supported");};e.umask=function(){return 0};},{}],77:[function(e,n,k){function b(c){if(!(this instanceof
  b))return new b(c);f.call(this,c);d.call(this,c);c&&!1===c.readable&&(this.readable=!1);c&&!1===c.writable&&(this.writable=!1);this.allowHalfOpen=!0;c&&!1===c.allowHalfOpen&&(this.allowHalfOpen=!1);this.once("end",a);}function a(){this.allowHalfOpen||this._writableState.ended||c.nextTick(h,this);}function h(a){a.end();}var c=e("process-nextick-args");k=Object.keys||function(a){var b=[],c;for(c in a)b.push(c);return b};n.exports=b;n=e("core-util-is");n.inherits=e("inherits");var f=e("./_stream_readable"),
  d=e("./_stream_writable");n.inherits(b,f);e=k(d.prototype);for(n=0;n<e.length;n++)k=e[n],b.prototype[k]||(b.prototype[k]=d.prototype[k]);Object.defineProperty(b.prototype,"writableHighWaterMark",{enumerable:!1,get:function(){return this._writableState.highWaterMark}});Object.defineProperty(b.prototype,"destroyed",{get:function(){return void 0===this._readableState||void 0===this._writableState?!1:this._readableState.destroyed&&this._writableState.destroyed},set:function(a){void 0!==this._readableState&&
  void 0!==this._writableState&&(this._readableState.destroyed=a,this._writableState.destroyed=a);}});b.prototype._destroy=function(a,b){this.push(null);this.end();c.nextTick(b,a);};},{"./_stream_readable":79,"./_stream_writable":81,"core-util-is":31,inherits:68,"process-nextick-args":75}],78:[function(e,n,k){function b(e){if(!(this instanceof b))return new b(e);a.call(this,e);}n.exports=b;var a=e("./_stream_transform");n=e("core-util-is");n.inherits=e("inherits");n.inherits(b,a);b.prototype._transform=
  function(a,b,e){e(null,a);};},{"./_stream_transform":80,"core-util-is":31,inherits:68}],79:[function(e,n,k){(function(b,a){function h(a,b,c){if("function"===typeof a.prependListener)return a.prependListener(b,c);if(a._events&&a._events[b])E(a._events[b])?a._events[b].unshift(c):a._events[b]=[c,a._events[b]];else a.on(b,c);}function c(a,b){F=F||e("./_stream_duplex");a=a||{};b=b instanceof F;this.objectMode=!!a.objectMode;b&&(this.objectMode=this.objectMode||!!a.readableObjectMode);var c=a.highWaterMark,
  d=a.readableHighWaterMark,f=this.objectMode?16:16384;this.highWaterMark=c||0===c?c:b&&(d||0===d)?d:f;this.highWaterMark=Math.floor(this.highWaterMark);this.buffer=new X;this.length=0;this.pipes=null;this.pipesCount=0;this.flowing=null;this.reading=this.endEmitted=this.ended=!1;this.sync=!0;this.destroyed=this.resumeScheduled=this.readableListening=this.emittedReadable=this.needReadable=!1;this.defaultEncoding=a.defaultEncoding||"utf8";this.awaitDrain=0;this.readingMore=!1;this.encoding=this.decoder=
  null;a.encoding&&(z||(z=e("string_decoder/").StringDecoder),this.decoder=new z(a.encoding),this.encoding=a.encoding);}function f(a){F=F||e("./_stream_duplex");if(!(this instanceof f))return new f(a);this._readableState=new c(a,this);this.readable=!0;a&&("function"===typeof a.read&&(this._read=a.read),"function"===typeof a.destroy&&(this._destroy=a.destroy));G.call(this);}function d(a,b,c,d,e){var f=a._readableState;if(null===b)f.reading=!1,f.ended||(f.decoder&&(b=f.decoder.end())&&b.length&&(f.buffer.push(b),
  f.length+=f.objectMode?1:b.length),f.ended=!0,w(a));else {if(!e){e=b;var h;A.isBuffer(e)||e instanceof K||"string"===typeof e||void 0===e||f.objectMode||(h=new TypeError("Invalid non-string/buffer chunk"));var g=h;}g?a.emit("error",g):f.objectMode||b&&0<b.length?("string"===typeof b||f.objectMode||Object.getPrototypeOf(b)===A.prototype||(b=A.from(b)),d?f.endEmitted?a.emit("error",Error("stream.unshift() after end event")):k(a,f,b,!0):f.ended?a.emit("error",Error("stream.push() after EOF")):(f.reading=
  !1,f.decoder&&!c?(b=f.decoder.write(b),f.objectMode||0!==b.length?k(a,f,b,!1):f.readingMore||(f.readingMore=!0,J.nextTick(r,a,f))):k(a,f,b,!1))):d||(f.reading=!1);}return !f.ended&&(f.needReadable||f.length<f.highWaterMark||0===f.length)}function k(a,b,c,d){b.flowing&&0===b.length&&!b.sync?(a.emit("data",c),a.read(0)):(b.length+=b.objectMode?1:c.length,d?b.buffer.unshift(c):b.buffer.push(c),b.needReadable&&w(a));b.readingMore||(b.readingMore=!0,J.nextTick(r,a,b));}function u(a,b){if(0>=a||0===b.length&&
  b.ended)return 0;if(b.objectMode)return 1;if(a!==a)return b.flowing&&b.length?b.buffer.head.data.length:b.length;if(a>b.highWaterMark){var c=a;8388608<=c?c=8388608:(c--,c|=c>>>1,c|=c>>>2,c|=c>>>4,c|=c>>>8,c|=c>>>16,c++);b.highWaterMark=c;}return a<=b.length?a:b.ended?b.length:(b.needReadable=!0,0)}function w(a){var b=a._readableState;b.needReadable=!1;b.emittedReadable||(C("emitReadable",b.flowing),b.emittedReadable=!0,b.sync?J.nextTick(l,a):l(a));}function l(a){C("emit readable");a.emit("readable");
  B(a);}function r(a,b){for(var c=b.length;!b.reading&&!b.flowing&&!b.ended&&b.length<b.highWaterMark&&(C("maybeReadMore read 0"),a.read(0),c!==b.length);)c=b.length;b.readingMore=!1;}function x(a){return function(){var b=a._readableState;C("pipeOnDrain",b.awaitDrain);b.awaitDrain&&b.awaitDrain--;0===b.awaitDrain&&a.listeners("data").length&&(b.flowing=!0,B(a));}}function y(a){C("readable nexttick read 0");a.read(0);}function m(a,b){b.reading||(C("resume read 0"),a.read(0));b.resumeScheduled=!1;b.awaitDrain=
  0;a.emit("resume");B(a);b.flowing&&!b.reading&&a.read(0);}function B(a){var b=a._readableState;for(C("flow",b.flowing);b.flowing&&null!==a.read(););}function g(a,b){if(0===b.length)return null;if(b.objectMode)var c=b.buffer.shift();else if(!a||a>=b.length)c=b.decoder?b.buffer.join(""):1===b.buffer.length?b.buffer.head.data:b.buffer.concat(b.length),b.buffer.clear();else {c=b.buffer;b=b.decoder;if(a<c.head.data.length)b=c.head.data.slice(0,a),c.head.data=c.head.data.slice(a);else {if(a===c.head.data.length)c=
  c.shift();else if(b){b=c.head;var d=1,e=b.data;for(a-=e.length;b=b.next;){var f=b.data,h=a>f.length?f.length:a;e=h===f.length?e+f:e+f.slice(0,a);a-=h;if(0===a){h===f.length?(++d,c.head=b.next?b.next:c.tail=null):(c.head=b,b.data=f.slice(h));break}++d;}c.length-=d;c=e;}else {b=A.allocUnsafe(a);d=c.head;e=1;d.data.copy(b);for(a-=d.data.length;d=d.next;){f=d.data;h=a>f.length?f.length:a;f.copy(b,b.length-a,0,h);a-=h;if(0===a){h===f.length?(++e,c.head=d.next?d.next:c.tail=null):(c.head=d,d.data=f.slice(h));
  break}++e;}c.length-=e;c=b;}b=c;}c=b;}return c}function q(a){var b=a._readableState;if(0<b.length)throw Error('"endReadable()" called on non-empty stream');b.endEmitted||(b.ended=!0,J.nextTick(M,b,a));}function M(a,b){a.endEmitted||0!==a.length||(a.endEmitted=!0,b.readable=!1,b.emit("end"));}function P(a,b){for(var c=0,d=a.length;c<d;c++)if(a[c]===b)return c;return -1}var J=e("process-nextick-args");n.exports=f;var E=e("isarray"),F;f.ReadableState=c;e("events");var G=e("./internal/streams/stream"),A=e("safe-buffer").Buffer,
  K=a.Uint8Array||function(){};a=e("core-util-is");a.inherits=e("inherits");var N=e("util"),C=void 0;C=N&&N.debuglog?N.debuglog("stream"):function(){};var X=e("./internal/streams/BufferList");N=e("./internal/streams/destroy");var z;a.inherits(f,G);var t=["error","close","destroy","pause","resume"];Object.defineProperty(f.prototype,"destroyed",{get:function(){return void 0===this._readableState?!1:this._readableState.destroyed},set:function(a){this._readableState&&(this._readableState.destroyed=a);}});
  f.prototype.destroy=N.destroy;f.prototype._undestroy=N.undestroy;f.prototype._destroy=function(a,b){this.push(null);b(a);};f.prototype.push=function(a,b){var c=this._readableState;if(c.objectMode)var e=!0;else "string"===typeof a&&(b=b||c.defaultEncoding,b!==c.encoding&&(a=A.from(a,b),b=""),e=!0);return d(this,a,b,!1,e)};f.prototype.unshift=function(a){return d(this,a,null,!0,!1)};f.prototype.isPaused=function(){return !1===this._readableState.flowing};f.prototype.setEncoding=function(a){z||(z=e("string_decoder/").StringDecoder);
  this._readableState.decoder=new z(a);this._readableState.encoding=a;return this};f.prototype.read=function(a){C("read",a);a=parseInt(a,10);var b=this._readableState,c=a;0!==a&&(b.emittedReadable=!1);if(0===a&&b.needReadable&&(b.length>=b.highWaterMark||b.ended))return C("read: emitReadable",b.length,b.ended),0===b.length&&b.ended?q(this):w(this),null;a=u(a,b);if(0===a&&b.ended)return 0===b.length&&q(this),null;var d=b.needReadable;C("need readable",d);if(0===b.length||b.length-a<b.highWaterMark)d=
  !0,C("length less than watermark",d);b.ended||b.reading?C("reading or ended",!1):d&&(C("do read"),b.reading=!0,b.sync=!0,0===b.length&&(b.needReadable=!0),this._read(b.highWaterMark),b.sync=!1,b.reading||(a=u(c,b)));d=0<a?g(a,b):null;null===d?(b.needReadable=!0,a=0):b.length-=a;0===b.length&&(b.ended||(b.needReadable=!0),c!==a&&b.ended&&q(this));null!==d&&this.emit("data",d);return d};f.prototype._read=function(a){this.emit("error",Error("_read() is not implemented"));};f.prototype.pipe=function(a,
  c){function d(b,c){C("onunpipe");b===p&&c&&!1===c.hasUnpiped&&(c.hasUnpiped=!0,C("cleanup"),a.removeListener("close",l),a.removeListener("finish",k),a.removeListener("drain",n),a.removeListener("error",g),a.removeListener("unpipe",d),p.removeListener("end",e),p.removeListener("end",m),p.removeListener("data",f),q=!0,!r.awaitDrain||a._writableState&&!a._writableState.needDrain||n());}function e(){C("onend");a.end();}function f(b){C("ondata");t=!1;!1!==a.write(b)||t||((1===r.pipesCount&&r.pipes===a||
  1<r.pipesCount&&-1!==P(r.pipes,a))&&!q&&(C("false write response, pause",p._readableState.awaitDrain),p._readableState.awaitDrain++,t=!0),p.pause());}function g(b){C("onerror",b);m();a.removeListener("error",g);0===a.listeners("error").length&&a.emit("error",b);}function l(){a.removeListener("finish",k);m();}function k(){C("onfinish");a.removeListener("close",l);m();}function m(){C("unpipe");p.unpipe(a);}var p=this,r=this._readableState;switch(r.pipesCount){case 0:r.pipes=a;break;case 1:r.pipes=[r.pipes,
  a];break;default:r.pipes.push(a);}r.pipesCount+=1;C("pipe count=%d opts=%j",r.pipesCount,c);c=c&&!1===c.end||a===b.stdout||a===b.stderr?m:e;if(r.endEmitted)J.nextTick(c);else p.once("end",c);a.on("unpipe",d);var n=x(p);a.on("drain",n);var q=!1,t=!1;p.on("data",f);h(a,"error",g);a.once("close",l);a.once("finish",k);a.emit("pipe",p);r.flowing||(C("pipe resume"),p.resume());return a};f.prototype.unpipe=function(a){var b=this._readableState,c={hasUnpiped:!1};if(0===b.pipesCount)return this;if(1===b.pipesCount){if(a&&
  a!==b.pipes)return this;a||(a=b.pipes);b.pipes=null;b.pipesCount=0;b.flowing=!1;a&&a.emit("unpipe",this,c);return this}if(!a){a=b.pipes;var d=b.pipesCount;b.pipes=null;b.pipesCount=0;b.flowing=!1;for(b=0;b<d;b++)a[b].emit("unpipe",this,c);return this}d=P(b.pipes,a);if(-1===d)return this;b.pipes.splice(d,1);--b.pipesCount;1===b.pipesCount&&(b.pipes=b.pipes[0]);a.emit("unpipe",this,c);return this};f.prototype.on=function(a,b){b=G.prototype.on.call(this,a,b);"data"===a?!1!==this._readableState.flowing&&
  this.resume():"readable"===a&&(a=this._readableState,a.endEmitted||a.readableListening||(a.readableListening=a.needReadable=!0,a.emittedReadable=!1,a.reading?a.length&&w(this):J.nextTick(y,this)));return b};f.prototype.addListener=f.prototype.on;f.prototype.resume=function(){var a=this._readableState;a.flowing||(C("resume"),a.flowing=!0,a.resumeScheduled||(a.resumeScheduled=!0,J.nextTick(m,this,a)));return this};f.prototype.pause=function(){C("call pause flowing=%j",this._readableState.flowing);!1!==
  this._readableState.flowing&&(C("pause"),this._readableState.flowing=!1,this.emit("pause"));return this};f.prototype.wrap=function(a){var b=this,c=this._readableState,d=!1;a.on("end",function(){C("wrapped end");if(c.decoder&&!c.ended){var a=c.decoder.end();a&&a.length&&b.push(a);}b.push(null);});a.on("data",function(e){C("wrapped data");c.decoder&&(e=c.decoder.write(e));c.objectMode&&(null===e||void 0===e)||!(c.objectMode||e&&e.length)||b.push(e)||(d=!0,a.pause());});for(var e in a)void 0===this[e]&&
  "function"===typeof a[e]&&(this[e]=function(b){return function(){return a[b].apply(a,arguments)}}(e));for(e=0;e<t.length;e++)a.on(t[e],this.emit.bind(this,t[e]));this._read=function(b){C("wrapped _read",b);d&&(d=!1,a.resume());};return this};Object.defineProperty(f.prototype,"readableHighWaterMark",{enumerable:!1,get:function(){return this._readableState.highWaterMark}});f._fromList=g;}).call(this,e("_process"),"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?
  window:{});},{"./_stream_duplex":77,"./internal/streams/BufferList":82,"./internal/streams/destroy":83,"./internal/streams/stream":84,_process:76,"core-util-is":31,events:66,inherits:68,isarray:70,"process-nextick-args":75,"safe-buffer":86,"string_decoder/":87,util:28}],80:[function(e,n,k){function b(a,b){var c=this._transformState;c.transforming=!1;var d=c.writecb;if(!d)return this.emit("error",Error("write callback called multiple times"));c.writechunk=null;c.writecb=null;null!=b&&this.push(b);d(a);
  a=this._readableState;a.reading=!1;(a.needReadable||a.length<a.highWaterMark)&&this._read(a.highWaterMark);}function a(c){if(!(this instanceof a))return new a(c);f.call(this,c);this._transformState={afterTransform:b.bind(this),needTransform:!1,transforming:!1,writecb:null,writechunk:null,writeencoding:null};this._readableState.needReadable=!0;this._readableState.sync=!1;c&&("function"===typeof c.transform&&(this._transform=c.transform),"function"===typeof c.flush&&(this._flush=c.flush));this.on("prefinish",
  h);}function h(){var a=this;"function"===typeof this._flush?this._flush(function(b,d){c(a,b,d);}):c(this,null,null);}function c(a,b,c){if(b)return a.emit("error",b);null!=c&&a.push(c);if(a._writableState.length)throw Error("Calling transform done when ws.length != 0");if(a._transformState.transforming)throw Error("Calling transform done when still transforming");return a.push(null)}n.exports=a;var f=e("./_stream_duplex");n=e("core-util-is");n.inherits=e("inherits");n.inherits(a,f);a.prototype.push=function(a,
  b){this._transformState.needTransform=!1;return f.prototype.push.call(this,a,b)};a.prototype._transform=function(a,b,c){throw Error("_transform() is not implemented");};a.prototype._write=function(a,b,c){var d=this._transformState;d.writecb=c;d.writechunk=a;d.writeencoding=b;d.transforming||(a=this._readableState,(d.needTransform||a.needReadable||a.length<a.highWaterMark)&&this._read(a.highWaterMark));};a.prototype._read=function(a){a=this._transformState;null!==a.writechunk&&a.writecb&&!a.transforming?
  (a.transforming=!0,this._transform(a.writechunk,a.writeencoding,a.afterTransform)):a.needTransform=!0;};a.prototype._destroy=function(a,b){var c=this;f.prototype._destroy.call(this,a,function(a){b(a);c.emit("close");});};},{"./_stream_duplex":77,"core-util-is":31,inherits:68}],81:[function(e,n,k){(function(b,a,h){function c(a){var b=this;this.entry=this.next=null;this.finish=function(){var c=b.entry;for(b.entry=null;c;){var d=c.callback;a.pendingcb--;d(void 0);c=c.next;}a.corkedRequestsFree?a.corkedRequestsFree.next=
  b:a.corkedRequestsFree=b;};}function f(){}function d(a,b){g=g||e("./_stream_duplex");a=a||{};var d=b instanceof g;this.objectMode=!!a.objectMode;d&&(this.objectMode=this.objectMode||!!a.writableObjectMode);var f=a.highWaterMark,h=a.writableHighWaterMark,k=this.objectMode?16:16384;this.highWaterMark=f||0===f?f:d&&(h||0===h)?h:k;this.highWaterMark=Math.floor(this.highWaterMark);this.destroyed=this.finished=this.ended=this.ending=this.needDrain=this.finalCalled=!1;this.decodeStrings=!1!==a.decodeStrings;
  this.defaultEncoding=a.defaultEncoding||"utf8";this.length=0;this.writing=!1;this.corked=0;this.sync=!0;this.bufferProcessing=!1;this.onwrite=function(a){var c=b._writableState,d=c.sync,e=c.writecb;c.writing=!1;c.writecb=null;c.length-=c.writelen;c.writelen=0;a?(--c.pendingcb,d?(m.nextTick(e,a),m.nextTick(y,b,c),b._writableState.errorEmitted=!0,b.emit("error",a)):(e(a),b._writableState.errorEmitted=!0,b.emit("error",a),y(b,c))):((a=r(c))||c.corked||c.bufferProcessing||!c.bufferedRequest||l(b,c),d?
  B(w,b,c,a,e):w(b,c,a,e));};this.writecb=null;this.writelen=0;this.lastBufferedRequest=this.bufferedRequest=null;this.pendingcb=0;this.errorEmitted=this.prefinished=!1;this.bufferedRequestCount=0;this.corkedRequestsFree=new c(this);}function k(a){g=g||e("./_stream_duplex");if(!(E.call(k,this)||this instanceof g))return new k(a);this._writableState=new d(a,this);this.writable=!0;a&&("function"===typeof a.write&&(this._write=a.write),"function"===typeof a.writev&&(this._writev=a.writev),"function"===typeof a.destroy&&
  (this._destroy=a.destroy),"function"===typeof a.final&&(this._final=a.final));M.call(this);}function u(a,b,c,d,e,f,h){b.writelen=d;b.writecb=h;b.writing=!0;b.sync=!0;c?a._writev(e,b.onwrite):a._write(e,f,b.onwrite);b.sync=!1;}function w(a,b,c,d){!c&&0===b.length&&b.needDrain&&(b.needDrain=!1,a.emit("drain"));b.pendingcb--;d();y(a,b);}function l(a,b){b.bufferProcessing=!0;var d=b.bufferedRequest;if(a._writev&&d&&d.next){var e=Array(b.bufferedRequestCount),f=b.corkedRequestsFree;f.entry=d;for(var h=0,
  g=!0;d;)e[h]=d,d.isBuf||(g=!1),d=d.next,h+=1;e.allBuffers=g;u(a,b,!0,b.length,e,"",f.finish);b.pendingcb++;b.lastBufferedRequest=null;f.next?(b.corkedRequestsFree=f.next,f.next=null):b.corkedRequestsFree=new c(b);b.bufferedRequestCount=0;}else {for(;d&&(e=d.chunk,u(a,b,!1,b.objectMode?1:e.length,e,d.encoding,d.callback),d=d.next,b.bufferedRequestCount--,!b.writing););null===d&&(b.lastBufferedRequest=null);}b.bufferedRequest=d;b.bufferProcessing=!1;}function r(a){return a.ending&&0===a.length&&null===
  a.bufferedRequest&&!a.finished&&!a.writing}function x(a,b){a._final(function(c){b.pendingcb--;c&&a.emit("error",c);b.prefinished=!0;a.emit("prefinish");y(a,b);});}function y(a,b){var c=r(b);c&&(b.prefinished||b.finalCalled||("function"===typeof a._final?(b.pendingcb++,b.finalCalled=!0,m.nextTick(x,a,b)):(b.prefinished=!0,a.emit("prefinish"))),0===b.pendingcb&&(b.finished=!0,a.emit("finish")));return c}var m=e("process-nextick-args");n.exports=k;var B=!b.browser&&-1<["v0.10","v0.9."].indexOf(b.version.slice(0,
  5))?h:m.nextTick,g;k.WritableState=d;b=e("core-util-is");b.inherits=e("inherits");var q={deprecate:e("util-deprecate")},M=e("./internal/streams/stream"),P=e("safe-buffer").Buffer,J=a.Uint8Array||function(){};a=e("./internal/streams/destroy");b.inherits(k,M);d.prototype.getBuffer=function(){for(var a=this.bufferedRequest,b=[];a;)b.push(a),a=a.next;return b};(function(){try{Object.defineProperty(d.prototype,"buffer",{get:q.deprecate(function(){return this.getBuffer()},"_writableState.buffer is deprecated. Use _writableState.getBuffer instead.",
  "DEP0003")});}catch(F){}})();$jscomp.initSymbol();$jscomp.initSymbol();$jscomp.initSymbol();if("function"===typeof Symbol&&Symbol.hasInstance&&"function"===typeof Function.prototype[Symbol.hasInstance]){$jscomp.initSymbol();var E=Function.prototype[Symbol.hasInstance];$jscomp.initSymbol();Object.defineProperty(k,Symbol.hasInstance,{value:function(a){return E.call(this,a)?!0:this!==k?!1:a&&a._writableState instanceof d}});}else E=function(a){return a instanceof this};k.prototype.pipe=function(){this.emit("error",
  Error("Cannot pipe, not readable"));};k.prototype.write=function(a,b,c){var d=this._writableState,e=!1,h;if(h=!d.objectMode)h=a,h=P.isBuffer(h)||h instanceof J;h&&!P.isBuffer(a)&&(a=P.from(a));"function"===typeof b&&(c=b,b=null);h?b="buffer":b||(b=d.defaultEncoding);"function"!==typeof c&&(c=f);if(d.ended)d=c,c=Error("write after end"),this.emit("error",c),m.nextTick(d,c);else {var g;if(!(g=h)){g=a;var l=c,k=!0,r=!1;null===g?r=new TypeError("May not write null values to stream"):"string"===typeof g||
  void 0===g||d.objectMode||(r=new TypeError("Invalid non-string/buffer chunk"));r&&(this.emit("error",r),m.nextTick(l,r),k=!1);g=k;}g&&(d.pendingcb++,e=h,e||(h=a,d.objectMode||!1===d.decodeStrings||"string"!==typeof h||(h=P.from(h,b)),a!==h&&(e=!0,b="buffer",a=h)),g=d.objectMode?1:a.length,d.length+=g,h=d.length<d.highWaterMark,h||(d.needDrain=!0),d.writing||d.corked?(g=d.lastBufferedRequest,d.lastBufferedRequest={chunk:a,encoding:b,isBuf:e,callback:c,next:null},g?g.next=d.lastBufferedRequest:d.bufferedRequest=
  d.lastBufferedRequest,d.bufferedRequestCount+=1):u(this,d,!1,g,a,b,c),e=h);}return e};k.prototype.cork=function(){this._writableState.corked++;};k.prototype.uncork=function(){var a=this._writableState;a.corked&&(a.corked--,a.writing||a.corked||a.finished||a.bufferProcessing||!a.bufferedRequest||l(this,a));};k.prototype.setDefaultEncoding=function(a){"string"===typeof a&&(a=a.toLowerCase());if(!(-1<"hex utf8 utf-8 ascii binary base64 ucs2 ucs-2 utf16le utf-16le raw".split(" ").indexOf((a+"").toLowerCase())))throw new TypeError("Unknown encoding: "+
  a);this._writableState.defaultEncoding=a;return this};Object.defineProperty(k.prototype,"writableHighWaterMark",{enumerable:!1,get:function(){return this._writableState.highWaterMark}});k.prototype._write=function(a,b,c){c(Error("_write() is not implemented"));};k.prototype._writev=null;k.prototype.end=function(a,b,c){var d=this._writableState;"function"===typeof a?(c=a,b=a=null):"function"===typeof b&&(c=b,b=null);null!==a&&void 0!==a&&this.write(a,b);d.corked&&(d.corked=1,this.uncork());if(!d.ending&&
  !d.finished){a=c;d.ending=!0;y(this,d);if(a)if(d.finished)m.nextTick(a);else this.once("finish",a);d.ended=!0;this.writable=!1;}};Object.defineProperty(k.prototype,"destroyed",{get:function(){return void 0===this._writableState?!1:this._writableState.destroyed},set:function(a){this._writableState&&(this._writableState.destroyed=a);}});k.prototype.destroy=a.destroy;k.prototype._undestroy=a.undestroy;k.prototype._destroy=function(a,b){this.end();b(a);};}).call(this,e("_process"),"undefined"!==typeof commonjsGlobal?
  commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{},e("timers").setImmediate);},{"./_stream_duplex":77,"./internal/streams/destroy":83,"./internal/streams/stream":84,_process:76,"core-util-is":31,inherits:68,"process-nextick-args":75,"safe-buffer":86,timers:88,"util-deprecate":90}],82:[function(e,n,k){var b=e("safe-buffer").Buffer,a=e("util");n.exports=function(){function a(){if(!(this instanceof a))throw new TypeError("Cannot call a class as a function");this.tail=this.head=
  null;this.length=0;}a.prototype.push=function(a){a={data:a,next:null};0<this.length?this.tail.next=a:this.head=a;this.tail=a;++this.length;};a.prototype.unshift=function(a){a={data:a,next:this.head};0===this.length&&(this.tail=a);this.head=a;++this.length;};a.prototype.shift=function(){if(0!==this.length){var a=this.head.data;this.head=1===this.length?this.tail=null:this.head.next;--this.length;return a}};a.prototype.clear=function(){this.head=this.tail=null;this.length=0;};a.prototype.join=function(a){if(0===
  this.length)return "";for(var b=this.head,c=""+b.data;b=b.next;)c+=a+b.data;return c};a.prototype.concat=function(a){if(0===this.length)return b.alloc(0);if(1===this.length)return this.head.data;a=b.allocUnsafe(a>>>0);for(var c=this.head,d=0;c;)c.data.copy(a,d),d+=c.data.length,c=c.next;return a};return a}();a&&a.inspect&&a.inspect.custom&&(n.exports.prototype[a.inspect.custom]=function(){var b=a.inspect({length:this.length});return this.constructor.name+" "+b});},{"safe-buffer":86,util:28}],83:[function(e,
  n,k){function b(a,b){a.emit("error",b);}var a=e("process-nextick-args");n.exports={destroy:function(e,c){var f=this,d=this._writableState&&this._writableState.destroyed;if(this._readableState&&this._readableState.destroyed||d)return c?c(e):!e||this._writableState&&this._writableState.errorEmitted||a.nextTick(b,this,e),this;this._readableState&&(this._readableState.destroyed=!0);this._writableState&&(this._writableState.destroyed=!0);this._destroy(e||null,function(d){!c&&d?(a.nextTick(b,f,d),f._writableState&&
  (f._writableState.errorEmitted=!0)):c&&c(d);});return this},undestroy:function(){this._readableState&&(this._readableState.destroyed=!1,this._readableState.reading=!1,this._readableState.ended=!1,this._readableState.endEmitted=!1);this._writableState&&(this._writableState.destroyed=!1,this._writableState.ended=!1,this._writableState.ending=!1,this._writableState.finished=!1,this._writableState.errorEmitted=!1);}};},{"process-nextick-args":75}],84:[function(e,n,k){n.exports=e("events").EventEmitter;},
  {events:66}],85:[function(e,n,k){k=n.exports=e("./lib/_stream_readable.js");k.Stream=k;k.Readable=k;k.Writable=e("./lib/_stream_writable.js");k.Duplex=e("./lib/_stream_duplex.js");k.Transform=e("./lib/_stream_transform.js");k.PassThrough=e("./lib/_stream_passthrough.js");},{"./lib/_stream_duplex.js":77,"./lib/_stream_passthrough.js":78,"./lib/_stream_readable.js":79,"./lib/_stream_transform.js":80,"./lib/_stream_writable.js":81}],86:[function(e,n,k){function b(a,b){for(var c in a)b[c]=a[c];}function a(a,
  b,e){return c(a,b,e)}var h=e("buffer"),c=h.Buffer;c.from&&c.alloc&&c.allocUnsafe&&c.allocUnsafeSlow?n.exports=h:(b(h,k),k.Buffer=a);b(c,a);a.from=function(a,b,e){if("number"===typeof a)throw new TypeError("Argument must not be a number");return c(a,b,e)};a.alloc=function(a,b,e){if("number"!==typeof a)throw new TypeError("Argument must be a number");a=c(a);void 0!==b?"string"===typeof e?a.fill(b,e):a.fill(b):a.fill(0);return a};a.allocUnsafe=function(a){if("number"!==typeof a)throw new TypeError("Argument must be a number");
  return c(a)};a.allocUnsafeSlow=function(a){if("number"!==typeof a)throw new TypeError("Argument must be a number");return h.SlowBuffer(a)};},{buffer:30}],87:[function(e,n,k){function b(a){if(!a)return "utf8";for(var b;;)switch(a){case "utf8":case "utf-8":return "utf8";case "ucs2":case "ucs-2":case "utf16le":case "utf-16le":return "utf16le";case "latin1":case "binary":return "latin1";case "base64":case "ascii":case "hex":return a;default:if(b)return;a=(""+a).toLowerCase();b=!0;}}function a(a){var c=b(a);
  if("string"!==typeof c&&(x.isEncoding===y||!y(a)))throw Error("Unknown encoding: "+a);this.encoding=c||a;switch(this.encoding){case "utf16le":this.text=d;this.end=v;a=4;break;case "utf8":this.fillLast=f;a=4;break;case "base64":this.text=u;this.end=w;a=3;break;default:this.write=l;this.end=r;return}this.lastTotal=this.lastNeed=0;this.lastChar=x.allocUnsafe(a);}function h(a){return 127>=a?0:6===a>>5?2:14===a>>4?3:30===a>>3?4:2===a>>6?-1:-2}function c(a,b,c){var d=b.length-1;if(d<c)return 0;var e=h(b[d]);
  if(0<=e)return 0<e&&(a.lastNeed=e-1),e;if(--d<c||-2===e)return 0;e=h(b[d]);if(0<=e)return 0<e&&(a.lastNeed=e-2),e;if(--d<c||-2===e)return 0;e=h(b[d]);return 0<=e?(0<e&&(2===e?e=0:a.lastNeed=e-3),e):0}function f(a){var b=this.lastTotal-this.lastNeed;a:if(128!==(a[0]&192)){this.lastNeed=0;var c="\ufffd";}else {if(1<this.lastNeed&&1<a.length){if(128!==(a[1]&192)){this.lastNeed=1;c="\ufffd";break a}if(2<this.lastNeed&&2<a.length&&128!==(a[2]&192)){this.lastNeed=2;c="\ufffd";break a}}c=void 0;}if(void 0!==
  c)return c;if(this.lastNeed<=a.length)return a.copy(this.lastChar,b,0,this.lastNeed),this.lastChar.toString(this.encoding,0,this.lastTotal);a.copy(this.lastChar,b,0,a.length);this.lastNeed-=a.length;}function d(a,b){if(0===(a.length-b)%2){if(b=a.toString("utf16le",b)){var c=b.charCodeAt(b.length-1);if(55296<=c&&56319>=c)return this.lastNeed=2,this.lastTotal=4,this.lastChar[0]=a[a.length-2],this.lastChar[1]=a[a.length-1],b.slice(0,-1)}return b}this.lastNeed=1;this.lastTotal=2;this.lastChar[0]=a[a.length-
  1];return a.toString("utf16le",b,a.length-1)}function v(a){a=a&&a.length?this.write(a):"";return this.lastNeed?a+this.lastChar.toString("utf16le",0,this.lastTotal-this.lastNeed):a}function u(a,b){var c=(a.length-b)%3;if(0===c)return a.toString("base64",b);this.lastNeed=3-c;this.lastTotal=3;1===c?this.lastChar[0]=a[a.length-1]:(this.lastChar[0]=a[a.length-2],this.lastChar[1]=a[a.length-1]);return a.toString("base64",b,a.length-c)}function w(a){a=a&&a.length?this.write(a):"";return this.lastNeed?a+
  this.lastChar.toString("base64",0,3-this.lastNeed):a}function l(a){return a.toString(this.encoding)}function r(a){return a&&a.length?this.write(a):""}var x=e("safe-buffer").Buffer,y=x.isEncoding||function(a){a=""+a;switch(a&&a.toLowerCase()){case "hex":case "utf8":case "utf-8":case "ascii":case "binary":case "base64":case "ucs2":case "ucs-2":case "utf16le":case "utf-16le":case "raw":return !0;default:return !1}};k.StringDecoder=a;a.prototype.write=function(a){if(0===a.length)return "";if(this.lastNeed){var b=
  this.fillLast(a);if(void 0===b)return "";var c=this.lastNeed;this.lastNeed=0;}else c=0;return c<a.length?b?b+this.text(a,c):this.text(a,c):b||""};a.prototype.end=function(a){a=a&&a.length?this.write(a):"";return this.lastNeed?a+"\ufffd":a};a.prototype.text=function(a,b){var d=c(this,a,b);if(!this.lastNeed)return a.toString("utf8",b);this.lastTotal=d;d=a.length-(d-this.lastNeed);a.copy(this.lastChar,0,d);return a.toString("utf8",b,d)};a.prototype.fillLast=function(a){if(this.lastNeed<=a.length)return a.copy(this.lastChar,
  this.lastTotal-this.lastNeed,0,this.lastNeed),this.lastChar.toString(this.encoding,0,this.lastTotal);a.copy(this.lastChar,this.lastTotal-this.lastNeed,0,a.length);this.lastNeed-=a.length;};},{"safe-buffer":86}],88:[function(e,n,k){(function(b,a){function h(a,b){this._id=a;this._clearFn=b;}var c=e("process/browser.js").nextTick,f=Function.prototype.apply,d=Array.prototype.slice,n={},u=0;k.setTimeout=function(){return new h(f.call(setTimeout,window,arguments),clearTimeout)};k.setInterval=function(){return new h(f.call(setInterval,
  window,arguments),clearInterval)};k.clearTimeout=k.clearInterval=function(a){a.close();};h.prototype.unref=h.prototype.ref=function(){};h.prototype.close=function(){this._clearFn.call(window,this._id);};k.enroll=function(a,b){clearTimeout(a._idleTimeoutId);a._idleTimeout=b;};k.unenroll=function(a){clearTimeout(a._idleTimeoutId);a._idleTimeout=-1;};k._unrefActive=k.active=function(a){clearTimeout(a._idleTimeoutId);var b=a._idleTimeout;0<=b&&(a._idleTimeoutId=setTimeout(function(){a._onTimeout&&a._onTimeout();},
  b));};k.setImmediate="function"===typeof b?b:function(a){var b=u++,e=2>arguments.length?!1:d.call(arguments,1);n[b]=!0;c(function(){n[b]&&(e?a.apply(null,e):a.call(null),k.clearImmediate(b));});return b};k.clearImmediate="function"===typeof a?a:function(a){delete n[a];};}).call(this,e("timers").setImmediate,e("timers").clearImmediate);},{"process/browser.js":76,timers:88}],89:[function(e,n,k){(function(b){function a(a,b,c,d){a[b]=c>>24&255;a[b+1]=c>>16&255;a[b+2]=c>>8&255;a[b+3]=c&255;a[b+4]=d>>24&255;
  a[b+5]=d>>16&255;a[b+6]=d>>8&255;a[b+7]=d&255;}function h(a,b,c,d,e){var f,O=0;for(f=0;f<e;f++)O|=a[b+f]^c[d+f];return (1&O-1>>>8)-1}function c(a,b,c,d){return h(a,b,c,d,16)}function f(a,b,c,d){return h(a,b,c,d,32)}function d(a,b,c,d){var e=d[0]&255|(d[1]&255)<<8|(d[2]&255)<<16|(d[3]&255)<<24,f=c[0]&255|(c[1]&255)<<8|(c[2]&255)<<16|(c[3]&255)<<24,O=c[4]&255|(c[5]&255)<<8|(c[6]&255)<<16|(c[7]&255)<<24,h=c[8]&255|(c[9]&255)<<8|(c[10]&255)<<16|(c[11]&255)<<24,g=c[12]&255|(c[13]&255)<<8|(c[14]&255)<<16|
  (c[15]&255)<<24,l=d[4]&255|(d[5]&255)<<8|(d[6]&255)<<16|(d[7]&255)<<24,k=b[0]&255|(b[1]&255)<<8|(b[2]&255)<<16|(b[3]&255)<<24,U=b[4]&255|(b[5]&255)<<8|(b[6]&255)<<16|(b[7]&255)<<24,r=b[8]&255|(b[9]&255)<<8|(b[10]&255)<<16|(b[11]&255)<<24;b=b[12]&255|(b[13]&255)<<8|(b[14]&255)<<16|(b[15]&255)<<24;var T=d[8]&255|(d[9]&255)<<8|(d[10]&255)<<16|(d[11]&255)<<24,p=c[16]&255|(c[17]&255)<<8|(c[18]&255)<<16|(c[19]&255)<<24,n=c[20]&255|(c[21]&255)<<8|(c[22]&255)<<16|(c[23]&255)<<24,q=c[24]&255|(c[25]&255)<<
  8|(c[26]&255)<<16|(c[27]&255)<<24;c=c[28]&255|(c[29]&255)<<8|(c[30]&255)<<16|(c[31]&255)<<24;d=d[12]&255|(d[13]&255)<<8|(d[14]&255)<<16|(d[15]&255)<<24;for(var m=e,ja=f,t=O,u=h,x=g,v=l,R=k,w=U,y=r,B=b,z=T,Q=p,J=n,G=q,V=c,M=d,D,P=0;20>P;P+=2)D=m+J|0,x^=D<<7|D>>>25,D=x+m|0,y^=D<<9|D>>>23,D=y+x|0,J^=D<<13|D>>>19,D=J+y|0,m^=D<<18|D>>>14,D=v+ja|0,B^=D<<7|D>>>25,D=B+v|0,G^=D<<9|D>>>23,D=G+B|0,ja^=D<<13|D>>>19,D=ja+G|0,v^=D<<18|D>>>14,D=z+R|0,V^=D<<7|D>>>25,D=V+z|0,t^=D<<9|D>>>23,D=t+V|0,R^=D<<13|D>>>19,
  D=R+t|0,z^=D<<18|D>>>14,D=M+Q|0,u^=D<<7|D>>>25,D=u+M|0,w^=D<<9|D>>>23,D=w+u|0,Q^=D<<13|D>>>19,D=Q+w|0,M^=D<<18|D>>>14,D=m+u|0,ja^=D<<7|D>>>25,D=ja+m|0,t^=D<<9|D>>>23,D=t+ja|0,u^=D<<13|D>>>19,D=u+t|0,m^=D<<18|D>>>14,D=v+x|0,R^=D<<7|D>>>25,D=R+v|0,w^=D<<9|D>>>23,D=w+R|0,x^=D<<13|D>>>19,D=x+w|0,v^=D<<18|D>>>14,D=z+B|0,Q^=D<<7|D>>>25,D=Q+z|0,y^=D<<9|D>>>23,D=y+Q|0,B^=D<<13|D>>>19,D=B+y|0,z^=D<<18|D>>>14,D=M+V|0,J^=D<<7|D>>>25,D=J+M|0,G^=D<<9|D>>>23,D=G+J|0,V^=D<<13|D>>>19,D=V+G|0,M^=D<<18|D>>>14;m=m+
  e|0;ja=ja+f|0;t=t+O|0;u=u+h|0;x=x+g|0;v=v+l|0;R=R+k|0;w=w+U|0;y=y+r|0;B=B+b|0;z=z+T|0;Q=Q+p|0;J=J+n|0;G=G+q|0;V=V+c|0;M=M+d|0;a[0]=m>>>0&255;a[1]=m>>>8&255;a[2]=m>>>16&255;a[3]=m>>>24&255;a[4]=ja>>>0&255;a[5]=ja>>>8&255;a[6]=ja>>>16&255;a[7]=ja>>>24&255;a[8]=t>>>0&255;a[9]=t>>>8&255;a[10]=t>>>16&255;a[11]=t>>>24&255;a[12]=u>>>0&255;a[13]=u>>>8&255;a[14]=u>>>16&255;a[15]=u>>>24&255;a[16]=x>>>0&255;a[17]=x>>>8&255;a[18]=x>>>16&255;a[19]=x>>>24&255;a[20]=v>>>0&255;a[21]=v>>>8&255;a[22]=v>>>16&255;a[23]=
  v>>>24&255;a[24]=R>>>0&255;a[25]=R>>>8&255;a[26]=R>>>16&255;a[27]=R>>>24&255;a[28]=w>>>0&255;a[29]=w>>>8&255;a[30]=w>>>16&255;a[31]=w>>>24&255;a[32]=y>>>0&255;a[33]=y>>>8&255;a[34]=y>>>16&255;a[35]=y>>>24&255;a[36]=B>>>0&255;a[37]=B>>>8&255;a[38]=B>>>16&255;a[39]=B>>>24&255;a[40]=z>>>0&255;a[41]=z>>>8&255;a[42]=z>>>16&255;a[43]=z>>>24&255;a[44]=Q>>>0&255;a[45]=Q>>>8&255;a[46]=Q>>>16&255;a[47]=Q>>>24&255;a[48]=J>>>0&255;a[49]=J>>>8&255;a[50]=J>>>16&255;a[51]=J>>>24&255;a[52]=G>>>0&255;a[53]=G>>>8&
  255;a[54]=G>>>16&255;a[55]=G>>>24&255;a[56]=V>>>0&255;a[57]=V>>>8&255;a[58]=V>>>16&255;a[59]=V>>>24&255;a[60]=M>>>0&255;a[61]=M>>>8&255;a[62]=M>>>16&255;a[63]=M>>>24&255;}function k(a,b,c,d){var e=d[0]&255|(d[1]&255)<<8|(d[2]&255)<<16|(d[3]&255)<<24,f=c[0]&255|(c[1]&255)<<8|(c[2]&255)<<16|(c[3]&255)<<24,O=c[4]&255|(c[5]&255)<<8|(c[6]&255)<<16|(c[7]&255)<<24,h=c[8]&255|(c[9]&255)<<8|(c[10]&255)<<16|(c[11]&255)<<24,g=c[12]&255|(c[13]&255)<<8|(c[14]&255)<<16|(c[15]&255)<<24,l=d[4]&255|(d[5]&255)<<8|(d[6]&
  255)<<16|(d[7]&255)<<24,k=b[0]&255|(b[1]&255)<<8|(b[2]&255)<<16|(b[3]&255)<<24,U=b[4]&255|(b[5]&255)<<8|(b[6]&255)<<16|(b[7]&255)<<24,r=b[8]&255|(b[9]&255)<<8|(b[10]&255)<<16|(b[11]&255)<<24;b=b[12]&255|(b[13]&255)<<8|(b[14]&255)<<16|(b[15]&255)<<24;var p=d[8]&255|(d[9]&255)<<8|(d[10]&255)<<16|(d[11]&255)<<24,n=c[16]&255|(c[17]&255)<<8|(c[18]&255)<<16|(c[19]&255)<<24,T=c[20]&255|(c[21]&255)<<8|(c[22]&255)<<16|(c[23]&255)<<24,q=c[24]&255|(c[25]&255)<<8|(c[26]&255)<<16|(c[27]&255)<<24;c=c[28]&255|(c[29]&
  255)<<8|(c[30]&255)<<16|(c[31]&255)<<24;d=d[12]&255|(d[13]&255)<<8|(d[14]&255)<<16|(d[15]&255)<<24;for(var m,t=0;20>t;t+=2)m=e+T|0,g^=m<<7|m>>>25,m=g+e|0,r^=m<<9|m>>>23,m=r+g|0,T^=m<<13|m>>>19,m=T+r|0,e^=m<<18|m>>>14,m=l+f|0,b^=m<<7|m>>>25,m=b+l|0,q^=m<<9|m>>>23,m=q+b|0,f^=m<<13|m>>>19,m=f+q|0,l^=m<<18|m>>>14,m=p+k|0,c^=m<<7|m>>>25,m=c+p|0,O^=m<<9|m>>>23,m=O+c|0,k^=m<<13|m>>>19,m=k+O|0,p^=m<<18|m>>>14,m=d+n|0,h^=m<<7|m>>>25,m=h+d|0,U^=m<<9|m>>>23,m=U+h|0,n^=m<<13|m>>>19,m=n+U|0,d^=m<<18|m>>>14,m=
  e+h|0,f^=m<<7|m>>>25,m=f+e|0,O^=m<<9|m>>>23,m=O+f|0,h^=m<<13|m>>>19,m=h+O|0,e^=m<<18|m>>>14,m=l+g|0,k^=m<<7|m>>>25,m=k+l|0,U^=m<<9|m>>>23,m=U+k|0,g^=m<<13|m>>>19,m=g+U|0,l^=m<<18|m>>>14,m=p+b|0,n^=m<<7|m>>>25,m=n+p|0,r^=m<<9|m>>>23,m=r+n|0,b^=m<<13|m>>>19,m=b+r|0,p^=m<<18|m>>>14,m=d+c|0,T^=m<<7|m>>>25,m=T+d|0,q^=m<<9|m>>>23,m=q+T|0,c^=m<<13|m>>>19,m=c+q|0,d^=m<<18|m>>>14;a[0]=e>>>0&255;a[1]=e>>>8&255;a[2]=e>>>16&255;a[3]=e>>>24&255;a[4]=l>>>0&255;a[5]=l>>>8&255;a[6]=l>>>16&255;a[7]=l>>>24&255;a[8]=
  p>>>0&255;a[9]=p>>>8&255;a[10]=p>>>16&255;a[11]=p>>>24&255;a[12]=d>>>0&255;a[13]=d>>>8&255;a[14]=d>>>16&255;a[15]=d>>>24&255;a[16]=k>>>0&255;a[17]=k>>>8&255;a[18]=k>>>16&255;a[19]=k>>>24&255;a[20]=U>>>0&255;a[21]=U>>>8&255;a[22]=U>>>16&255;a[23]=U>>>24&255;a[24]=r>>>0&255;a[25]=r>>>8&255;a[26]=r>>>16&255;a[27]=r>>>24&255;a[28]=b>>>0&255;a[29]=b>>>8&255;a[30]=b>>>16&255;a[31]=b>>>24&255;}function n(a,b,c,e,f,h,g){var O=new Uint8Array(16),l=new Uint8Array(64),k;for(k=0;16>k;k++)O[k]=0;for(k=0;8>k;k++)O[k]=
  h[k];for(;64<=f;){d(l,O,g,pa);for(k=0;64>k;k++)a[b+k]=c[e+k]^l[k];h=1;for(k=8;16>k;k++)h=h+(O[k]&255)|0,O[k]=h&255,h>>>=8;f-=64;b+=64;e+=64;}if(0<f)for(d(l,O,g,pa),k=0;k<f;k++)a[b+k]=c[e+k]^l[k];return 0}function w(a,b,c,e,f){var O=new Uint8Array(16),h=new Uint8Array(64),g;for(g=0;16>g;g++)O[g]=0;for(g=0;8>g;g++)O[g]=e[g];for(;64<=c;){d(h,O,f,pa);for(g=0;64>g;g++)a[b+g]=h[g];e=1;for(g=8;16>g;g++)e=e+(O[g]&255)|0,O[g]=e&255,e>>>=8;c-=64;b+=64;}if(0<c)for(d(h,O,f,pa),g=0;g<c;g++)a[b+g]=h[g];return 0}
  function l(a,b,c,d,e){var f=new Uint8Array(32);k(f,d,e,pa);e=new Uint8Array(8);for(var O=0;8>O;O++)e[O]=d[O+16];return w(a,b,c,e,f)}function r(a,b,c,d,e,f,h){var O=new Uint8Array(32);k(O,f,h,pa);h=new Uint8Array(8);for(var g=0;8>g;g++)h[g]=f[g+16];return n(a,b,c,d,e,h,O)}function x(a,b,c,d,e,f){f=new ma(f);f.update(c,d,e);f.finish(a,b);return 0}function y(a,b,d,e,f,h){var O=new Uint8Array(16);x(O,0,d,e,f,h);return c(a,b,O,0)}function m(a,b,c,d,e){if(32>c)return -1;r(a,0,b,0,c,d,e);x(a,16,a,32,c-32,
  a);for(b=0;16>b;b++)a[b]=0;return 0}function B(a,b,c,d,e){var f=new Uint8Array(32);if(32>c)return -1;l(f,0,32,d,e);if(0!==y(b,16,b,32,c-32,f))return -1;r(a,0,b,0,c,d,e);for(b=0;32>b;b++)a[b]=0;return 0}function g(a,b){var c;for(c=0;16>c;c++)a[c]=b[c]|0;}function q(a){var b,c=1;for(b=0;16>b;b++){var d=a[b]+c+65535;c=Math.floor(d/65536);a[b]=d-65536*c;}a[0]+=c-1+37*(c-1);}function M(a,b,c){for(var d=~(c-1),e=0;16>e;e++)c=d&(a[e]^b[e]),a[e]^=c,b[e]^=c;}function P(a,b){var c,d=L(),e=L();for(c=0;16>c;c++)e[c]=
  b[c];q(e);q(e);q(e);for(b=0;2>b;b++){d[0]=e[0]-65517;for(c=1;15>c;c++)d[c]=e[c]-65535-(d[c-1]>>16&1),d[c-1]&=65535;d[15]=e[15]-32767-(d[14]>>16&1);c=d[15]>>16&1;d[14]&=65535;M(e,d,1-c);}for(c=0;16>c;c++)a[2*c]=e[c]&255,a[2*c+1]=e[c]>>8;}function J(a,b){var c=new Uint8Array(32),d=new Uint8Array(32);P(c,a);P(d,b);return f(c,0,d,0)}function E(a){var b=new Uint8Array(32);P(b,a);return b[0]&1}function F(a,b){var c;for(c=0;16>c;c++)a[c]=b[2*c]+(b[2*c+1]<<8);a[15]&=32767;}function G(a,b,c){for(var d=0;16>d;d++)a[d]=
  b[d]+c[d];}function A(a,b,c){for(var d=0;16>d;d++)a[d]=b[d]-c[d];}function K(a,b,c){var d=c[0],e=c[1],f=c[2],h=c[3],g=c[4],l=c[5],k=c[6],m=c[7],r=c[8],p=c[9],n=c[10],q=c[11],T=c[12],t=c[13],U=c[14],u=c[15];c=b[0];var O=c*d;var x=c*e;var v=c*f;var R=c*h;var w=c*g;var y=c*l;var B=c*k;var z=c*m;var Q=c*r;var J=c*p;var G=c*n;var V=c*q;var M=c*T;var P=c*t;var D=c*U;var K=c*u;c=b[1];x+=c*d;v+=c*e;R+=c*f;w+=c*h;y+=c*g;B+=c*l;z+=c*k;Q+=c*m;J+=c*r;G+=c*p;V+=c*n;M+=c*q;P+=c*T;D+=c*t;K+=c*U;var L=c*u;c=b[2];v+=
  c*d;R+=c*e;w+=c*f;y+=c*h;B+=c*g;z+=c*l;Q+=c*k;J+=c*m;G+=c*r;V+=c*p;M+=c*n;P+=c*q;D+=c*T;K+=c*t;L+=c*U;var ca=c*u;c=b[3];R+=c*d;w+=c*e;y+=c*f;B+=c*h;z+=c*g;Q+=c*l;J+=c*k;G+=c*m;V+=c*r;M+=c*p;P+=c*n;D+=c*q;K+=c*T;L+=c*t;ca+=c*U;var F=c*u;c=b[4];w+=c*d;y+=c*e;B+=c*f;z+=c*h;Q+=c*g;J+=c*l;G+=c*k;V+=c*m;M+=c*r;P+=c*p;D+=c*n;K+=c*q;L+=c*T;ca+=c*t;F+=c*U;var H=c*u;c=b[5];y+=c*d;B+=c*e;z+=c*f;Q+=c*h;J+=c*g;G+=c*l;V+=c*k;M+=c*m;P+=c*r;D+=c*p;K+=c*n;L+=c*q;ca+=c*T;F+=c*t;H+=c*U;var I=c*u;c=b[6];B+=c*d;z+=c*
  e;Q+=c*f;J+=c*h;G+=c*g;V+=c*l;M+=c*k;P+=c*m;D+=c*r;K+=c*p;L+=c*n;ca+=c*q;F+=c*T;H+=c*t;I+=c*U;var A=c*u;c=b[7];z+=c*d;Q+=c*e;J+=c*f;G+=c*h;V+=c*g;M+=c*l;P+=c*k;D+=c*m;K+=c*r;L+=c*p;ca+=c*n;F+=c*q;H+=c*T;I+=c*t;A+=c*U;var wa=c*u;c=b[8];Q+=c*d;J+=c*e;G+=c*f;V+=c*h;M+=c*g;P+=c*l;D+=c*k;K+=c*m;L+=c*r;ca+=c*p;F+=c*n;H+=c*q;I+=c*T;A+=c*t;wa+=c*U;var ya=c*u;c=b[9];J+=c*d;G+=c*e;V+=c*f;M+=c*h;P+=c*g;D+=c*l;K+=c*k;L+=c*m;ca+=c*r;F+=c*p;H+=c*n;I+=c*q;A+=c*T;wa+=c*t;ya+=c*U;var E=c*u;c=b[10];G+=c*d;V+=c*e;M+=
  c*f;P+=c*h;D+=c*g;K+=c*l;L+=c*k;ca+=c*m;F+=c*r;H+=c*p;I+=c*n;A+=c*q;wa+=c*T;ya+=c*t;E+=c*U;var C=c*u;c=b[11];V+=c*d;M+=c*e;P+=c*f;D+=c*h;K+=c*g;L+=c*l;ca+=c*k;F+=c*m;H+=c*r;I+=c*p;A+=c*n;wa+=c*q;ya+=c*T;E+=c*t;C+=c*U;var N=c*u;c=b[12];M+=c*d;P+=c*e;D+=c*f;K+=c*h;L+=c*g;ca+=c*l;F+=c*k;H+=c*m;I+=c*r;A+=c*p;wa+=c*n;ya+=c*q;E+=c*T;C+=c*t;N+=c*U;var W=c*u;c=b[13];P+=c*d;D+=c*e;K+=c*f;L+=c*h;ca+=c*g;F+=c*l;H+=c*k;I+=c*m;A+=c*r;wa+=c*p;ya+=c*n;E+=c*q;C+=c*T;N+=c*t;W+=c*U;var Y=c*u;c=b[14];D+=c*d;K+=c*e;
  L+=c*f;ca+=c*h;F+=c*g;H+=c*l;I+=c*k;A+=c*m;wa+=c*r;ya+=c*p;E+=c*n;C+=c*q;N+=c*T;W+=c*t;Y+=c*U;var S=c*u;c=b[15];K+=c*d;x+=38*(ca+c*f);v+=38*(F+c*h);R+=38*(H+c*g);w+=38*(I+c*l);y+=38*(A+c*k);B+=38*(wa+c*m);z+=38*(ya+c*r);Q+=38*(E+c*p);J+=38*(C+c*n);G+=38*(N+c*q);V+=38*(W+c*T);M+=38*(Y+c*t);P+=38*(S+c*U);D+=38*c*u;c=O+38*(L+c*e)+1+65535;b=Math.floor(c/65536);O=c-65536*b;c=x+b+65535;b=Math.floor(c/65536);x=c-65536*b;c=v+b+65535;b=Math.floor(c/65536);v=c-65536*b;c=R+b+65535;b=Math.floor(c/65536);R=c-
  65536*b;c=w+b+65535;b=Math.floor(c/65536);w=c-65536*b;c=y+b+65535;b=Math.floor(c/65536);y=c-65536*b;c=B+b+65535;b=Math.floor(c/65536);B=c-65536*b;c=z+b+65535;b=Math.floor(c/65536);z=c-65536*b;c=Q+b+65535;b=Math.floor(c/65536);Q=c-65536*b;c=J+b+65535;b=Math.floor(c/65536);J=c-65536*b;c=G+b+65535;b=Math.floor(c/65536);G=c-65536*b;c=V+b+65535;b=Math.floor(c/65536);V=c-65536*b;c=M+b+65535;b=Math.floor(c/65536);M=c-65536*b;c=P+b+65535;b=Math.floor(c/65536);P=c-65536*b;c=D+b+65535;b=Math.floor(c/65536);
  D=c-65536*b;c=K+b+65535;b=Math.floor(c/65536);K=c-65536*b;O+=b-1+37*(b-1);c=O+1+65535;b=Math.floor(c/65536);O=c-65536*b;c=x+b+65535;b=Math.floor(c/65536);x=c-65536*b;c=v+b+65535;b=Math.floor(c/65536);v=c-65536*b;c=R+b+65535;b=Math.floor(c/65536);R=c-65536*b;c=w+b+65535;b=Math.floor(c/65536);w=c-65536*b;c=y+b+65535;b=Math.floor(c/65536);y=c-65536*b;c=B+b+65535;b=Math.floor(c/65536);B=c-65536*b;c=z+b+65535;b=Math.floor(c/65536);z=c-65536*b;c=Q+b+65535;b=Math.floor(c/65536);Q=c-65536*b;c=J+b+65535;b=
  Math.floor(c/65536);J=c-65536*b;c=G+b+65535;b=Math.floor(c/65536);G=c-65536*b;c=V+b+65535;b=Math.floor(c/65536);V=c-65536*b;c=M+b+65535;b=Math.floor(c/65536);M=c-65536*b;c=P+b+65535;b=Math.floor(c/65536);P=c-65536*b;c=D+b+65535;b=Math.floor(c/65536);D=c-65536*b;c=K+b+65535;b=Math.floor(c/65536);a[0]=O+(b-1+37*(b-1));a[1]=x;a[2]=v;a[3]=R;a[4]=w;a[5]=y;a[6]=B;a[7]=z;a[8]=Q;a[9]=J;a[10]=G;a[11]=V;a[12]=M;a[13]=P;a[14]=D;a[15]=c-65536*b;}function N(a,b){K(a,b,b);}function C(a,b){var c=L(),d;for(d=0;16>
  d;d++)c[d]=b[d];for(d=253;0<=d;d--)N(c,c),2!==d&&4!==d&&K(c,c,b);for(d=0;16>d;d++)a[d]=c[d];}function X(a,b,c){var d=new Uint8Array(32),e=new Float64Array(80),f,h=L(),g=L(),l=L(),k=L(),m=L(),r=L();for(f=0;31>f;f++)d[f]=b[f];d[31]=b[31]&127|64;d[0]&=248;F(e,c);for(f=0;16>f;f++)g[f]=e[f],k[f]=h[f]=l[f]=0;h[0]=k[0]=1;for(f=254;0<=f;--f)b=d[f>>>3]>>>(f&7)&1,M(h,g,b),M(l,k,b),G(m,h,l),A(h,h,l),G(l,g,k),A(g,g,k),N(k,m),N(r,h),K(h,l,h),K(l,g,m),G(m,h,l),A(h,h,l),N(g,h),A(l,k,r),K(h,l,qa),G(h,h,k),K(l,l,h),
  K(h,k,r),K(k,g,e),N(g,m),M(h,g,b),M(l,k,b);for(f=0;16>f;f++)e[f+16]=h[f],e[f+32]=l[f],e[f+48]=g[f],e[f+64]=k[f];d=e.subarray(32);e=e.subarray(16);C(d,d);K(e,e,d);P(a,e);return 0}function z(a,b){return X(a,b,va)}function t(a,b){ta(b,32);return z(a,b)}function p(a,b,c){var d=new Uint8Array(32);X(d,c,b);k(a,ua,d,pa);}function S(a,b,c,d){var e=new Int32Array(16),f=new Int32Array(16),h;var g=a[0];var l=a[1],k=a[2],m=a[3],r=a[4],p=a[5],n=a[6],q=a[7];var t=b[0];for(var u=b[1],T=b[2],U=b[3],O=b[4],x=b[5],
  v=b[6],R=b[7],w=0;128<=d;){for(h=0;16>h;h++){var y=8*h+w;e[h]=c[y+0]<<24|c[y+1]<<16|c[y+2]<<8|c[y+3];f[h]=c[y+4]<<24|c[y+5]<<16|c[y+6]<<8|c[y+7];}for(h=0;80>h;h++){y=g;var B=l;var ja=k;var z=m;var Q=r;var G=p;var J=n;var V=t;var M=u;var D=T;var P=U;var K=O;var L=x;var ca=v;var H=q;var I=R;var F=I&65535;var A=I>>>16;var E=H&65535;var C=H>>>16;H=(r>>>14|O<<18)^(r>>>18|O<<14)^(O>>>9|r<<23);I=(O>>>14|r<<18)^(O>>>18|r<<14)^(r>>>9|O<<23);F+=I&65535;A+=I>>>16;E+=H&65535;C+=H>>>16;H=r&p^~r&n;I=O&x^~O&v;F+=
  I&65535;A+=I>>>16;E+=H&65535;C+=H>>>16;H=na[2*h];I=na[2*h+1];F+=I&65535;A+=I>>>16;E+=H&65535;C+=H>>>16;H=e[h%16];I=f[h%16];F+=I&65535;A+=I>>>16;E+=H&65535;C+=H>>>16;A+=F>>>16;E+=A>>>16;C+=E>>>16;var N=E&65535|C<<16;var W=F&65535|A<<16;H=N;I=W;F=I&65535;A=I>>>16;E=H&65535;C=H>>>16;H=(g>>>28|t<<4)^(t>>>2|g<<30)^(t>>>7|g<<25);I=(t>>>28|g<<4)^(g>>>2|t<<30)^(g>>>7|t<<25);F+=I&65535;A+=I>>>16;E+=H&65535;C+=H>>>16;H=g&l^g&k^l&k;I=t&u^t&T^u&T;F+=I&65535;A+=I>>>16;E+=H&65535;C+=H>>>16;A+=F>>>16;E+=A>>>16;
  C+=E>>>16;g=E&65535|C<<16;t=F&65535|A<<16;H=z;I=P;F=I&65535;A=I>>>16;E=H&65535;C=H>>>16;H=N;I=W;F+=I&65535;A+=I>>>16;E+=H&65535;C+=H>>>16;A+=F>>>16;E+=A>>>16;C+=E>>>16;z=E&65535|C<<16;P=F&65535|A<<16;l=y;k=B;m=ja;r=z;p=Q;n=G;q=J;u=V;T=M;U=D;O=P;x=K;v=L;R=ca;if(15===h%16)for(y=0;16>y;y++)H=e[y],I=f[y],F=I&65535,A=I>>>16,E=H&65535,C=H>>>16,H=e[(y+9)%16],I=f[(y+9)%16],F+=I&65535,A+=I>>>16,E+=H&65535,C+=H>>>16,N=e[(y+1)%16],W=f[(y+1)%16],H=(N>>>1|W<<31)^(N>>>8|W<<24)^N>>>7,I=(W>>>1|N<<31)^(W>>>8|N<<24)^
  (W>>>7|N<<25),F+=I&65535,A+=I>>>16,E+=H&65535,C+=H>>>16,N=e[(y+14)%16],W=f[(y+14)%16],H=(N>>>19|W<<13)^(W>>>29|N<<3)^N>>>6,I=(W>>>19|N<<13)^(N>>>29|W<<3)^(W>>>6|N<<26),F+=I&65535,A+=I>>>16,E+=H&65535,C+=H>>>16,A+=F>>>16,E+=A>>>16,C+=E>>>16,e[y]=E&65535|C<<16,f[y]=F&65535|A<<16;}H=g;I=t;F=I&65535;A=I>>>16;E=H&65535;C=H>>>16;H=a[0];I=b[0];F+=I&65535;A+=I>>>16;E+=H&65535;C+=H>>>16;A+=F>>>16;E+=A>>>16;C+=E>>>16;a[0]=g=E&65535|C<<16;b[0]=t=F&65535|A<<16;H=l;I=u;F=I&65535;A=I>>>16;E=H&65535;C=H>>>16;H=a[1];
  I=b[1];F+=I&65535;A+=I>>>16;E+=H&65535;C+=H>>>16;A+=F>>>16;E+=A>>>16;C+=E>>>16;a[1]=l=E&65535|C<<16;b[1]=u=F&65535|A<<16;H=k;I=T;F=I&65535;A=I>>>16;E=H&65535;C=H>>>16;H=a[2];I=b[2];F+=I&65535;A+=I>>>16;E+=H&65535;C+=H>>>16;A+=F>>>16;E+=A>>>16;C+=E>>>16;a[2]=k=E&65535|C<<16;b[2]=T=F&65535|A<<16;H=m;I=U;F=I&65535;A=I>>>16;E=H&65535;C=H>>>16;H=a[3];I=b[3];F+=I&65535;A+=I>>>16;E+=H&65535;C+=H>>>16;A+=F>>>16;E+=A>>>16;C+=E>>>16;a[3]=m=E&65535|C<<16;b[3]=U=F&65535|A<<16;H=r;I=O;F=I&65535;A=I>>>16;E=H&65535;
  C=H>>>16;H=a[4];I=b[4];F+=I&65535;A+=I>>>16;E+=H&65535;C+=H>>>16;A+=F>>>16;E+=A>>>16;C+=E>>>16;a[4]=r=E&65535|C<<16;b[4]=O=F&65535|A<<16;H=p;I=x;F=I&65535;A=I>>>16;E=H&65535;C=H>>>16;H=a[5];I=b[5];F+=I&65535;A+=I>>>16;E+=H&65535;C+=H>>>16;A+=F>>>16;E+=A>>>16;C+=E>>>16;a[5]=p=E&65535|C<<16;b[5]=x=F&65535|A<<16;H=n;I=v;F=I&65535;A=I>>>16;E=H&65535;C=H>>>16;H=a[6];I=b[6];F+=I&65535;A+=I>>>16;E+=H&65535;C+=H>>>16;A+=F>>>16;E+=A>>>16;C+=E>>>16;a[6]=n=E&65535|C<<16;b[6]=v=F&65535|A<<16;H=q;I=R;F=I&65535;
  A=I>>>16;E=H&65535;C=H>>>16;H=a[7];I=b[7];F+=I&65535;A+=I>>>16;E+=H&65535;C+=H>>>16;A+=F>>>16;E+=A>>>16;C+=E>>>16;a[7]=q=E&65535|C<<16;b[7]=R=F&65535|A<<16;w+=128;d-=128;}return d}function ba(b,c,d){var e=new Int32Array(8),f=new Int32Array(8),h=new Uint8Array(256),g,l=d;e[0]=1779033703;e[1]=3144134277;e[2]=1013904242;e[3]=2773480762;e[4]=1359893119;e[5]=2600822924;e[6]=528734635;e[7]=1541459225;f[0]=4089235720;f[1]=2227873595;f[2]=4271175723;f[3]=1595750129;f[4]=2917565137;f[5]=725511199;f[6]=4215389547;
  f[7]=327033209;S(e,f,c,d);d%=128;for(g=0;g<d;g++)h[g]=c[l-d+g];h[d]=128;d=256-128*(112>d?1:0);h[d-9]=0;a(h,d-8,l/536870912|0,l<<3);S(e,f,h,d);for(g=0;8>g;g++)a(b,8*g,e[g],f[g]);return 0}function fa(a,b){var c=L(),d=L(),e=L(),f=L(),h=L(),g=L(),l=L(),k=L(),m=L();A(c,a[1],a[0]);A(m,b[1],b[0]);K(c,c,m);G(d,a[0],a[1]);G(m,b[0],b[1]);K(d,d,m);K(e,a[3],b[3]);K(e,e,aa);K(f,a[2],b[2]);G(f,f,f);A(h,d,c);A(g,f,e);G(l,f,e);G(k,d,c);K(a[0],h,g);K(a[1],k,l);K(a[2],l,g);K(a[3],h,k);}function Z(a,b){var c=L(),d=L(),
  e=L();C(e,b[2]);K(c,b[0],e);K(d,b[1],e);P(a,d);a[31]^=E(c)<<7;}function da(a,b,c){var d;g(a[0],sa);g(a[1],ha);g(a[2],ha);g(a[3],sa);for(d=255;0<=d;--d){var e=c[d/8|0]>>(d&7)&1;var f,h=a,l=b,k=e;for(f=0;4>f;f++)M(h[f],l[f],k);fa(b,a);fa(a,a);f=a;h=b;l=e;for(e=0;4>e;e++)M(f[e],h[e],l);}}function oa(a,b){var c=[L(),L(),L(),L()];g(c[0],la);g(c[1],ra);g(c[2],ha);K(c[3],la,ra);da(a,c,b);}function ka(a,b,c){var d=new Uint8Array(64),e=[L(),L(),L(),L()];c||ta(b,32);ba(d,b,32);d[0]&=248;d[31]&=127;d[31]|=64;oa(e,
  d);Z(a,e);for(c=0;32>c;c++)b[c+32]=a[c];return 0}function R(a,b){var c,d;for(c=63;32<=c;--c){var e=0;var f=c-32;for(d=c-12;f<d;++f)b[f]+=e-16*b[c]*za[f-(c-32)],e=b[f]+128>>8,b[f]-=256*e;b[f]+=e;b[c]=0;}for(f=e=0;32>f;f++)b[f]+=e-(b[31]>>4)*za[f],e=b[f]>>8,b[f]&=255;for(f=0;32>f;f++)b[f]-=e*za[f];for(c=0;32>c;c++)b[c+1]+=b[c]>>8,a[c]=b[c]&255;}function Q(a){var b=new Float64Array(64),c;for(c=0;64>c;c++)b[c]=a[c];for(c=0;64>c;c++)a[c]=0;R(a,b);}function ca(a,b,c,d){var e=new Uint8Array(64),f=new Uint8Array(64),
  h=new Uint8Array(64),g,l=new Float64Array(64),k=[L(),L(),L(),L()];ba(e,d,32);e[0]&=248;e[31]&=127;e[31]|=64;var m=c+64;for(g=0;g<c;g++)a[64+g]=b[g];for(g=0;32>g;g++)a[32+g]=e[32+g];ba(h,a.subarray(32),c+32);Q(h);oa(k,h);Z(a,k);for(g=32;64>g;g++)a[g]=d[g];ba(f,a,c+64);Q(f);for(g=0;64>g;g++)l[g]=0;for(g=0;32>g;g++)l[g]=h[g];for(g=0;32>g;g++)for(b=0;32>b;b++)l[g+b]+=f[g]*e[b];R(a.subarray(32),l);return m}function V(a,b,c,d){var e=new Uint8Array(32),h=new Uint8Array(64),l=[L(),L(),L(),L()],k=[L(),L(),
  L(),L()];if(64>c)return -1;var m=L();var r=L(),p=L(),n=L(),q=L(),t=L(),u=L();g(k[2],ha);F(k[1],d);N(p,k[1]);K(n,p,ia);A(p,p,k[2]);G(n,k[2],n);N(q,n);N(t,q);K(u,t,q);K(m,u,p);K(m,m,n);q=L();for(t=0;16>t;t++)q[t]=m[t];for(t=250;0<=t;t--)N(q,q),1!==t&&K(q,q,m);for(t=0;16>t;t++)m[t]=q[t];K(m,m,p);K(m,m,n);K(m,m,n);K(k[0],m,n);N(r,k[0]);K(r,r,n);J(r,p)&&K(k[0],k[0],ea);N(r,k[0]);K(r,r,n);J(r,p)?m=-1:(E(k[0])===d[31]>>7&&A(k[0],sa,k[0]),K(k[3],k[0],k[1]),m=0);if(m)return -1;for(m=0;m<c;m++)a[m]=b[m];for(m=
  0;32>m;m++)a[m+32]=d[m];ba(h,a,c);Q(h);da(l,k,h);oa(k,b.subarray(32));fa(l,k);Z(e,l);c-=64;if(f(b,0,e,0)){for(m=0;m<c;m++)a[m]=0;return -1}for(m=0;m<c;m++)a[m]=b[m+64];return c}function W(a,b){if(32!==a.length)throw Error("bad key size");if(24!==b.length)throw Error("bad nonce size");}function Y(){for(var a=0;a<arguments.length;a++)if(!(arguments[a]instanceof Uint8Array))throw new TypeError("unexpected type, use Uint8Array");}function xa(a){for(var b=0;b<a.length;b++)a[b]=0;}var L=function(a){var b,
  c=new Float64Array(16);if(a)for(b=0;b<a.length;b++)c[b]=a[b];return c},ta=function(){throw Error("no PRNG");},ua=new Uint8Array(16),va=new Uint8Array(32);va[0]=9;var sa=L(),ha=L([1]),qa=L([56129,1]),ia=L([30883,4953,19914,30187,55467,16705,2637,112,59544,30585,16505,36039,65139,11119,27886,20995]),aa=L([61785,9906,39828,60374,45398,33411,5274,224,53552,61171,33010,6542,64743,22239,55772,9222]),la=L([54554,36645,11616,51542,42930,38181,51040,26924,56412,64982,57905,49316,21502,52590,14035,8553]),ra=
  L([26200,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214]),ea=L([41136,18958,6951,50414,58488,44335,6150,12099,55207,15867,153,11085,57099,20417,9344,11139]),pa=new Uint8Array([101,120,112,97,110,100,32,51,50,45,98,121,116,101,32,107]),ma=function(a){this.buffer=new Uint8Array(16);this.r=new Uint16Array(10);this.h=new Uint16Array(10);this.pad=new Uint16Array(8);this.fin=this.leftover=0;var b=a[0]&255|(a[1]&255)<<8;this.r[0]=b&8191;var c=a[2]&255|(a[3]&255)<<
  8;this.r[1]=(b>>>13|c<<3)&8191;b=a[4]&255|(a[5]&255)<<8;this.r[2]=(c>>>10|b<<6)&7939;c=a[6]&255|(a[7]&255)<<8;this.r[3]=(b>>>7|c<<9)&8191;b=a[8]&255|(a[9]&255)<<8;this.r[4]=(c>>>4|b<<12)&255;this.r[5]=b>>>1&8190;c=a[10]&255|(a[11]&255)<<8;this.r[6]=(b>>>14|c<<2)&8191;b=a[12]&255|(a[13]&255)<<8;this.r[7]=(c>>>11|b<<5)&8065;c=a[14]&255|(a[15]&255)<<8;this.r[8]=(b>>>8|c<<8)&8191;this.r[9]=c>>>5&127;this.pad[0]=a[16]&255|(a[17]&255)<<8;this.pad[1]=a[18]&255|(a[19]&255)<<8;this.pad[2]=a[20]&255|(a[21]&
  255)<<8;this.pad[3]=a[22]&255|(a[23]&255)<<8;this.pad[4]=a[24]&255|(a[25]&255)<<8;this.pad[5]=a[26]&255|(a[27]&255)<<8;this.pad[6]=a[28]&255|(a[29]&255)<<8;this.pad[7]=a[30]&255|(a[31]&255)<<8;};ma.prototype.blocks=function(a,b,c){for(var d=this.fin?0:2048,e,f,h,g,l,k,m,r,p,n,q,t=this.h[0],u=this.h[1],x=this.h[2],v=this.h[3],R=this.h[4],w=this.h[5],y=this.h[6],B=this.h[7],T=this.h[8],O=this.h[9],A=this.r[0],z=this.r[1],U=this.r[2],E=this.r[3],Q=this.r[4],F=this.r[5],C=this.r[6],G=this.r[7],D=this.r[8],
  J=this.r[9];16<=c;)e=a[b+0]&255|(a[b+1]&255)<<8,t+=e&8191,f=a[b+2]&255|(a[b+3]&255)<<8,u+=(e>>>13|f<<3)&8191,e=a[b+4]&255|(a[b+5]&255)<<8,x+=(f>>>10|e<<6)&8191,f=a[b+6]&255|(a[b+7]&255)<<8,v+=(e>>>7|f<<9)&8191,e=a[b+8]&255|(a[b+9]&255)<<8,R+=(f>>>4|e<<12)&8191,w+=e>>>1&8191,f=a[b+10]&255|(a[b+11]&255)<<8,y+=(e>>>14|f<<2)&8191,e=a[b+12]&255|(a[b+13]&255)<<8,B+=(f>>>11|e<<5)&8191,f=a[b+14]&255|(a[b+15]&255)<<8,T+=(e>>>8|f<<8)&8191,O+=f>>>5|d,e=f=0,e+=t*A,e+=5*u*J,e+=5*x*D,e+=5*v*G,e+=5*R*C,f=e>>>13,
  e&=8191,e+=5*w*F,e+=5*y*Q,e+=5*B*E,e+=5*T*U,e+=5*O*z,f+=e>>>13,e&=8191,h=f,h+=t*z,h+=u*A,h+=5*x*J,h+=5*v*D,h+=5*R*G,f=h>>>13,h&=8191,h+=5*w*C,h+=5*y*F,h+=5*B*Q,h+=5*T*E,h+=5*O*U,f+=h>>>13,h&=8191,g=f,g+=t*U,g+=u*z,g+=x*A,g+=5*v*J,g+=5*R*D,f=g>>>13,g&=8191,g+=5*w*G,g+=5*y*C,g+=5*B*F,g+=5*T*Q,g+=5*O*E,f+=g>>>13,g&=8191,l=f,l+=t*E,l+=u*U,l+=x*z,l+=v*A,l+=5*R*J,f=l>>>13,l&=8191,l+=5*w*D,l+=5*y*G,l+=5*B*C,l+=5*T*F,l+=5*O*Q,f+=l>>>13,l&=8191,k=f,k+=t*Q,k+=u*E,k+=x*U,k+=v*z,k+=R*A,f=k>>>13,k&=8191,k+=5*
  w*J,k+=5*y*D,k+=5*B*G,k+=5*T*C,k+=5*O*F,f+=k>>>13,k&=8191,m=f,m+=t*F,m+=u*Q,m+=x*E,m+=v*U,m+=R*z,f=m>>>13,m&=8191,m+=w*A,m+=5*y*J,m+=5*B*D,m+=5*T*G,m+=5*O*C,f+=m>>>13,m&=8191,r=f,r+=t*C,r+=u*F,r+=x*Q,r+=v*E,r+=R*U,f=r>>>13,r&=8191,r+=w*z,r+=y*A,r+=5*B*J,r+=5*T*D,r+=5*O*G,f+=r>>>13,r&=8191,p=f,p+=t*G,p+=u*C,p+=x*F,p+=v*Q,p+=R*E,f=p>>>13,p&=8191,p+=w*U,p+=y*z,p+=B*A,p+=5*T*J,p+=5*O*D,f+=p>>>13,p&=8191,n=f,n+=t*D,n+=u*G,n+=x*C,n+=v*F,n+=R*Q,f=n>>>13,n&=8191,n+=w*E,n+=y*U,n+=B*z,n+=T*A,n+=5*O*J,f+=n>>>
  13,n&=8191,q=f,q+=t*J,q+=u*D,q+=x*G,q+=v*C,q+=R*F,f=q>>>13,q&=8191,q+=w*Q,q+=y*E,q+=B*U,q+=T*z,q+=O*A,f+=q>>>13,q&=8191,f=(f<<2)+f|0,f=f+e|0,e=f&8191,f>>>=13,h+=f,t=e,u=h,x=g,v=l,R=k,w=m,y=r,B=p,T=n,O=q,b+=16,c-=16;this.h[0]=t;this.h[1]=u;this.h[2]=x;this.h[3]=v;this.h[4]=R;this.h[5]=w;this.h[6]=y;this.h[7]=B;this.h[8]=T;this.h[9]=O;};ma.prototype.finish=function(a,b){var c=new Uint16Array(10);if(this.leftover){var d=this.leftover;for(this.buffer[d++]=1;16>d;d++)this.buffer[d]=0;this.fin=1;this.blocks(this.buffer,
  0,16);}var e=this.h[1]>>>13;this.h[1]&=8191;for(d=2;10>d;d++)this.h[d]+=e,e=this.h[d]>>>13,this.h[d]&=8191;this.h[0]+=5*e;e=this.h[0]>>>13;this.h[0]&=8191;this.h[1]+=e;e=this.h[1]>>>13;this.h[1]&=8191;this.h[2]+=e;c[0]=this.h[0]+5;e=c[0]>>>13;c[0]&=8191;for(d=1;10>d;d++)c[d]=this.h[d]+e,e=c[d]>>>13,c[d]&=8191;c[9]-=8192;e=(e^1)-1;for(d=0;10>d;d++)c[d]&=e;e=~e;for(d=0;10>d;d++)this.h[d]=this.h[d]&e|c[d];this.h[0]=(this.h[0]|this.h[1]<<13)&65535;this.h[1]=(this.h[1]>>>3|this.h[2]<<10)&65535;this.h[2]=
  (this.h[2]>>>6|this.h[3]<<7)&65535;this.h[3]=(this.h[3]>>>9|this.h[4]<<4)&65535;this.h[4]=(this.h[4]>>>12|this.h[5]<<1|this.h[6]<<14)&65535;this.h[5]=(this.h[6]>>>2|this.h[7]<<11)&65535;this.h[6]=(this.h[7]>>>5|this.h[8]<<8)&65535;this.h[7]=(this.h[8]>>>8|this.h[9]<<5)&65535;c=this.h[0]+this.pad[0];this.h[0]=c&65535;for(d=1;8>d;d++)c=(this.h[d]+this.pad[d]|0)+(c>>>16)|0,this.h[d]=c&65535;a[b+0]=this.h[0]>>>0&255;a[b+1]=this.h[0]>>>8&255;a[b+2]=this.h[1]>>>0&255;a[b+3]=this.h[1]>>>8&255;a[b+4]=this.h[2]>>>
  0&255;a[b+5]=this.h[2]>>>8&255;a[b+6]=this.h[3]>>>0&255;a[b+7]=this.h[3]>>>8&255;a[b+8]=this.h[4]>>>0&255;a[b+9]=this.h[4]>>>8&255;a[b+10]=this.h[5]>>>0&255;a[b+11]=this.h[5]>>>8&255;a[b+12]=this.h[6]>>>0&255;a[b+13]=this.h[6]>>>8&255;a[b+14]=this.h[7]>>>0&255;a[b+15]=this.h[7]>>>8&255;};ma.prototype.update=function(a,b,c){var d;if(this.leftover){var e=16-this.leftover;e>c&&(e=c);for(d=0;d<e;d++)this.buffer[this.leftover+d]=a[b+d];c-=e;b+=e;this.leftover+=e;if(16>this.leftover)return;this.blocks(this.buffer,
  0,16);this.leftover=0;}16<=c&&(e=c-c%16,this.blocks(a,b,e),b+=e,c-=e);if(c){for(d=0;d<c;d++)this.buffer[this.leftover+d]=a[b+d];this.leftover+=c;}};var na=[1116352408,3609767458,1899447441,602891725,3049323471,3964484399,3921009573,2173295548,961987163,4081628472,1508970993,3053834265,2453635748,2937671579,2870763221,3664609560,3624381080,2734883394,310598401,1164996542,607225278,1323610764,1426881987,3590304994,1925078388,4068182383,2162078206,991336113,2614888103,633803317,3248222580,3479774868,3835390401,
  2666613458,4022224774,944711139,264347078,2341262773,604807628,2007800933,770255983,1495990901,1249150122,1856431235,1555081692,3175218132,1996064986,2198950837,2554220882,3999719339,2821834349,766784016,2952996808,2566594879,3210313671,3203337956,3336571891,1034457026,3584528711,2466948901,113926993,3758326383,338241895,168717936,666307205,1188179964,773529912,1546045734,1294757372,1522805485,1396182291,2643833823,1695183700,2343527390,1986661051,1014477480,2177026350,1206759142,2456956037,344077627,
  2730485921,1290863460,2820302411,3158454273,3259730800,3505952657,3345764771,106217008,3516065817,3606008344,3600352804,1432725776,4094571909,1467031594,275423344,851169720,430227734,3100823752,506948616,1363258195,659060556,3750685593,883997877,3785050280,958139571,3318307427,1322822218,3812723403,1537002063,2003034995,1747873779,3602036899,1955562222,1575990012,2024104815,1125592928,2227730452,2716904306,2361852424,442776044,2428436474,593698344,2756734187,3733110249,3204031479,2999351573,3329325298,
  3815920427,3391569614,3928383900,3515267271,566280711,3940187606,3454069534,4118630271,4000239992,116418474,1914138554,174292421,2731055270,289380356,3203993006,460393269,320620315,685471733,587496836,852142971,1086792851,1017036298,365543100,1126000580,2618297676,1288033470,3409855158,1501505948,4234509866,1607167915,987167468,1816402316,1246189591],za=new Float64Array([237,211,245,92,26,99,18,88,214,156,247,162,222,249,222,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16]);b.lowlevel={crypto_core_hsalsa20:function(a,
  b,c,d){k(a,b,c,d);},crypto_stream_xor:r,crypto_stream:l,crypto_stream_salsa20_xor:n,crypto_stream_salsa20:w,crypto_onetimeauth:x,crypto_onetimeauth_verify:y,crypto_verify_16:c,crypto_verify_32:f,crypto_secretbox:m,crypto_secretbox_open:B,crypto_scalarmult:X,crypto_scalarmult_base:z,crypto_box_beforenm:p,crypto_box_afternm:m,crypto_box:function(a,b,c,d,e,f){var h=new Uint8Array(32);p(h,e,f);return m(a,b,c,d,h)},crypto_box_open:function(a,b,c,d,e,f){var h=new Uint8Array(32);p(h,e,f);return B(a,b,c,d,
  h)},crypto_box_keypair:t,crypto_hash:ba,crypto_sign:ca,crypto_sign_keypair:ka,crypto_sign_open:V,crypto_secretbox_KEYBYTES:32,crypto_secretbox_NONCEBYTES:24,crypto_secretbox_ZEROBYTES:32,crypto_secretbox_BOXZEROBYTES:16,crypto_scalarmult_BYTES:32,crypto_scalarmult_SCALARBYTES:32,crypto_box_PUBLICKEYBYTES:32,crypto_box_SECRETKEYBYTES:32,crypto_box_BEFORENMBYTES:32,crypto_box_NONCEBYTES:24,crypto_box_ZEROBYTES:32,crypto_box_BOXZEROBYTES:16,crypto_sign_BYTES:64,crypto_sign_PUBLICKEYBYTES:32,crypto_sign_SECRETKEYBYTES:64,
  crypto_sign_SEEDBYTES:32,crypto_hash_BYTES:64};b.randomBytes=function(a){var b=new Uint8Array(a);ta(b,a);return b};b.secretbox=function(a,b,c){Y(a,b,c);W(c,b);for(var d=new Uint8Array(32+a.length),e=new Uint8Array(d.length),f=0;f<a.length;f++)d[f+32]=a[f];m(e,d,d.length,b,c);return e.subarray(16)};b.secretbox.open=function(a,b,c){Y(a,b,c);W(c,b);for(var d=new Uint8Array(16+a.length),e=new Uint8Array(d.length),f=0;f<a.length;f++)d[f+16]=a[f];return 32>d.length||0!==B(e,d,d.length,b,c)?null:e.subarray(32)};
  b.secretbox.keyLength=32;b.secretbox.nonceLength=24;b.secretbox.overheadLength=16;b.scalarMult=function(a,b){Y(a,b);if(32!==a.length)throw Error("bad n size");if(32!==b.length)throw Error("bad p size");var c=new Uint8Array(32);X(c,a,b);return c};b.scalarMult.base=function(a){Y(a);if(32!==a.length)throw Error("bad n size");var b=new Uint8Array(32);z(b,a);return b};b.scalarMult.scalarLength=32;b.scalarMult.groupElementLength=32;b.box=function(a,c,d,e){d=b.box.before(d,e);return b.secretbox(a,c,d)};
  b.box.before=function(a,b){Y(a,b);if(32!==a.length)throw Error("bad public key size");if(32!==b.length)throw Error("bad secret key size");var c=new Uint8Array(32);p(c,a,b);return c};b.box.after=b.secretbox;b.box.open=function(a,c,d,e){d=b.box.before(d,e);return b.secretbox.open(a,c,d)};b.box.open.after=b.secretbox.open;b.box.keyPair=function(){var a=new Uint8Array(32),b=new Uint8Array(32);t(a,b);return {publicKey:a,secretKey:b}};b.box.keyPair.fromSecretKey=function(a){Y(a);if(32!==a.length)throw Error("bad secret key size");
  var b=new Uint8Array(32);z(b,a);return {publicKey:b,secretKey:new Uint8Array(a)}};b.box.publicKeyLength=32;b.box.secretKeyLength=32;b.box.sharedKeyLength=32;b.box.nonceLength=24;b.box.overheadLength=b.secretbox.overheadLength;b.sign=function(a,b){Y(a,b);if(64!==b.length)throw Error("bad secret key size");var c=new Uint8Array(64+a.length);ca(c,a,a.length,b);return c};b.sign.open=function(a,b){Y(a,b);if(32!==b.length)throw Error("bad public key size");var c=new Uint8Array(a.length);a=V(c,a,a.length,
  b);if(0>a)return null;a=new Uint8Array(a);for(b=0;b<a.length;b++)a[b]=c[b];return a};b.sign.detached=function(a,c){a=b.sign(a,c);c=new Uint8Array(64);for(var d=0;d<c.length;d++)c[d]=a[d];return c};b.sign.detached.verify=function(a,b,c){Y(a,b,c);if(64!==b.length)throw Error("bad signature size");if(32!==c.length)throw Error("bad public key size");var d=new Uint8Array(64+a.length),e=new Uint8Array(64+a.length),f;for(f=0;64>f;f++)d[f]=b[f];for(f=0;f<a.length;f++)d[f+64]=a[f];return 0<=V(e,d,d.length,
  c)};b.sign.keyPair=function(){var a=new Uint8Array(32),b=new Uint8Array(64);ka(a,b);return {publicKey:a,secretKey:b}};b.sign.keyPair.fromSecretKey=function(a){Y(a);if(64!==a.length)throw Error("bad secret key size");for(var b=new Uint8Array(32),c=0;c<b.length;c++)b[c]=a[32+c];return {publicKey:b,secretKey:new Uint8Array(a)}};b.sign.keyPair.fromSeed=function(a){Y(a);if(32!==a.length)throw Error("bad seed size");for(var b=new Uint8Array(32),c=new Uint8Array(64),d=0;32>d;d++)c[d]=a[d];ka(b,c,!0);return {publicKey:b,
  secretKey:c}};b.sign.publicKeyLength=32;b.sign.secretKeyLength=64;b.sign.seedLength=32;b.sign.signatureLength=64;b.hash=function(a){Y(a);var b=new Uint8Array(64);ba(b,a,a.length);return b};b.hash.hashLength=64;b.verify=function(a,b){Y(a,b);return 0===a.length||0===b.length||a.length!==b.length?!1:0===h(a,0,b,0,a.length)?!0:!1};b.setPRNG=function(a){ta=a;};(function(){var a="undefined"!==typeof self?self.crypto||self.msCrypto:null;a&&a.getRandomValues?b.setPRNG(function(b,c){var d,e=new Uint8Array(c);
  for(d=0;d<c;d+=65536)a.getRandomValues(e.subarray(d,d+Math.min(c-d,65536)));for(d=0;d<c;d++)b[d]=e[d];xa(e);}):"undefined"!==typeof e&&(a=e("crypto"))&&a.randomBytes&&b.setPRNG(function(b,c){var d,e=a.randomBytes(c);for(d=0;d<c;d++)b[d]=e[d];xa(e);});})();})("undefined"!==typeof n&&n.exports?n.exports:self.nacl=self.nacl||{});},{crypto:28}],90:[function(e,n,k){(function(b){function a(a){try{if(!b.localStorage)return !1}catch(c){return !1}a=b.localStorage[a];return null==a?!1:"true"===String(a).toLowerCase()}
  n.exports=function(b,c){if(a("noDeprecation"))return b;var e=!1;return function(){if(!e){if(a("throwDeprecation"))throw Error(c);a("traceDeprecation")?console.trace(c):console.warn(c);e=!0;}return b.apply(this,arguments)}};}).call(this,"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{});},{}],91:[function(e,n,k){arguments[4][24][0].apply(k,arguments);},{dup:24}],92:[function(e,n,k){arguments[4][25][0].apply(k,arguments);},{"./support/isBuffer":91,_process:76,
  dup:25,inherits:68}],93:[function(e,n,k){(function(b){b(function(a){function b(a){var b=1<arguments.length?n.call(arguments,1):[];return function(){return k(a,this,b.concat(n.call(arguments)))}}var c=a("./when"),e=c["try"],d=a("./lib/liftAll"),k=a("./lib/apply")(c.Promise),n=Array.prototype.slice;return {lift:b,liftAll:function(a,c,e){return d(b,c,e,a)},call:e,apply:function(a,b){return k(a,this,null==b?[]:n.call(b))},compose:function(a){var b=n.call(arguments,1);return function(){var d=this,f=n.call(arguments);
  f=e.apply(d,[a].concat(f));return c.reduce(b,function(a,b){return b.call(d,a)},f)}}}});})(function(b){n.exports=b(e);});},{"./lib/apply":97,"./lib/liftAll":109,"./when":117}],94:[function(e,n,k){(function(b){b(function(a){var b=a("./makePromise"),c=a("./Scheduler");a=a("./env").asap;return b({scheduler:new c(a)})});})(function(b){n.exports=b(e);});},{"./Scheduler":95,"./env":107,"./makePromise":110}],95:[function(e,n,k){(function(b){b(function(){function a(a){this._async=a;this._running=!1;this._queue=
  this;this._queueLen=0;this._afterQueue={};this._afterQueueLen=0;var b=this;this.drain=function(){b._drain();};}a.prototype.enqueue=function(a){this._queue[this._queueLen++]=a;this.run();};a.prototype.afterQueue=function(a){this._afterQueue[this._afterQueueLen++]=a;this.run();};a.prototype.run=function(){this._running||(this._running=!0,this._async(this.drain));};a.prototype._drain=function(){for(var a=0;a<this._queueLen;++a)this._queue[a].run(),this._queue[a]=void 0;this._queueLen=0;this._running=!1;for(a=
  0;a<this._afterQueueLen;++a)this._afterQueue[a].run(),this._afterQueue[a]=void 0;this._afterQueueLen=0;};return a});})(function(b){n.exports=b();});},{}],96:[function(e,n,k){(function(b){b(function(){function a(b){Error.call(this);this.message=b;this.name=a.name;"function"===typeof Error.captureStackTrace&&Error.captureStackTrace(this,a);}a.prototype=Object.create(Error.prototype);return a.prototype.constructor=a});})(function(b){n.exports=b();});},{}],97:[function(e,n,k){(function(b){b(function(){function a(a,
  e){function c(b,c){if(0>b.i)return e(b.f,b.thisArg,b.params,c);a._handler(b.args[b.i]).fold(f,b,void 0,c);}function f(a,b,d){a.params[a.i]=b;--a.i;c(a,d);}2>arguments.length&&(e=b);return function(b,d,f){var h=a._defer(),l=f.length;c({f:b,thisArg:d,args:f,params:Array(l),i:l-1,call:e},h._handler);return h}}function b(a,b,d,e){try{e.resolve(a.apply(b,d));}catch(u){e.reject(u);}}a.tryCatchResolve=b;return a});})(function(b){n.exports=b();});},{}],98:[function(e,n,k){(function(b){b(function(a){var b=a("../state"),
  c=a("../apply");return function(a){function d(c){var d;c instanceof a&&(d=c._handler.join());if(d&&0===d.state()||!d)return h(c).then(b.fulfilled,b.rejected);d._unreport();return b.inspect(d)}function e(a){return function(b,c,d){return f(a,void 0,[b,c,d])}}var f=c(a),h=a.resolve,l=a.all,k=Array.prototype.reduce,n=Array.prototype.reduceRight,y=Array.prototype.slice;a.any=function(b){function c(a){k=null;this.resolve(a);}function d(a){this.resolved||(k.push(a),0===--l&&this.reject(k));}for(var e=a._defer(),
  f=e._handler,h=b.length>>>0,l=h,k=[],m,r=0;r<h;++r)if(m=b[r],void 0!==m||r in b)if(m=a._handler(m),0<m.state()){f.become(m);a._visitRemaining(b,r,m);break}else m.visit(f,c,d);else --l;0===l&&f.reject(new RangeError("any(): array must not be empty"));return e};a.some=function(b,c){function d(a){this.resolved||(l.push(a),0===--r&&(k=null,this.resolve(l)));}function e(a){this.resolved||(k.push(a),0===--x&&(l=null,this.reject(k)));}var f=a._defer(),h=f._handler,l=[],k=[],m=b.length>>>0,r=0,n;for(n=0;n<m;++n){var u=
  b[n];(void 0!==u||n in b)&&++r;}c=Math.max(c,0);var x=r-c+1;r=Math.min(c,r);c>r?h.reject(new RangeError("some(): array must contain at least "+c+" item(s), but had "+r)):0===r&&h.resolve(l);for(n=0;n<m;++n)u=b[n],(void 0!==u||n in b)&&a._handler(u).visit(h,d,e,h.notify);return f};a.settle=function(a){return l(a.map(d))};a.map=function(b,c){return a._traverse(c,b)};a.filter=function(b,c){var d=y.call(b);return a._traverse(c,d).then(function(b){for(var c=b.length,e=Array(c),f=0,h=0;f<c;++f)b[f]&&(e[h++]=
  a._handler(d[f]).value);e.length=h;return e})};a.reduce=function(a,b){return 2<arguments.length?k.call(a,e(b),arguments[2]):k.call(a,e(b))};a.reduceRight=function(a,b){return 2<arguments.length?n.call(a,e(b),arguments[2]):n.call(a,e(b))};a.prototype.spread=function(a){return this.then(l).then(function(b){return a.apply(this,b)})};return a}});})(function(b){n.exports=b(e);});},{"../apply":97,"../state":111}],99:[function(e,n,k){(function(b){b(function(){function a(){throw new TypeError("catch predicate must be a function");
  }function b(a){return a}return function(c){function e(a,b){return function(c){return (b===Error||null!=b&&b.prototype instanceof Error?c instanceof b:b(c))?a.call(this,c):n(c)}}function d(a,b,c,d){a=a.call(b);return "object"!==typeof a&&"function"!==typeof a||null===a?c(d):h(a,c,d)}function h(a,b,c){return k(a).then(function(){return b(c)})}var k=c.resolve,n=c.reject,l=c.prototype["catch"];c.prototype.done=function(a,b){this._handler.visit(this._handler.receiver,a,b);};c.prototype["catch"]=c.prototype.otherwise=
  function(b){return 2>arguments.length?l.call(this,b):"function"!==typeof b?this.ensure(a):l.call(this,e(arguments[1],b))};c.prototype["finally"]=c.prototype.ensure=function(a){return "function"!==typeof a?this:this.then(function(c){return d(a,this,b,c)},function(b){return d(a,this,n,b)})};c.prototype["else"]=c.prototype.orElse=function(a){return this.then(void 0,function(){return a})};c.prototype.yield=function(a){return this.then(function(){return a})};c.prototype.tap=function(a){return this.then(a).yield(this)};
  return c}});})(function(b){n.exports=b();});},{}],100:[function(e,n,k){(function(b){b(function(){return function(a){a.prototype.fold=function(b,c){var e=this._beget();this._handler.fold(function(c,e,f){a._handler(c).fold(function(a,c,d){d.resolve(b.call(this,c,a));},e,this,f);},c,e._handler.receiver,e._handler);return e};return a}});})(function(b){n.exports=b();});},{}],101:[function(e,n,k){(function(b){b(function(a){var b=a("../state").inspect;return function(a){a.prototype.inspect=function(){return b(a._handler(this))};
  return a}});})(function(b){n.exports=b(e);});},{"../state":111}],102:[function(e,n,k){(function(b){b(function(){return function(a){function b(a,d,e,h){function f(f,h){return c(e(f)).then(function(){return b(a,d,e,h)})}return c(h).then(function(b){return c(d(b)).then(function(d){return d?b:c(a(b)).spread(f)})})}var c=a.resolve;a.iterate=function(a,c,e,h){return b(function(b){return [b,a(b)]},c,e,h)};a.unfold=b;return a}});})(function(b){n.exports=b();});},{}],103:[function(e,n,k){(function(b){b(function(){return function(a){a.prototype.progress=
  function(a){return this.then(void 0,void 0,a)};return a}});})(function(b){n.exports=b();});},{}],104:[function(e,n,k){(function(b){b(function(a){function b(a,b,e,f){return c.setTimer(function(){a(e,f,b);},b)}var c=a("../env"),e=a("../TimeoutError");return function(a){function d(a,c,d){b(f,a,c,d);}function f(a,b){b.resolve(a);}function h(a,b,c){a="undefined"===typeof a?new e("timed out after "+c+"ms"):a;b.reject(a);}a.prototype.delay=function(a){var b=this._beget();this._handler.fold(d,a,void 0,b._handler);
  return b};a.prototype.timeout=function(a,d){var e=this._beget(),f=e._handler,l=b(h,a,d,e._handler);this._handler.visit(f,function(a){c.clearTimer(l);this.resolve(a);},function(a){c.clearTimer(l);this.reject(a);},f.notify);return e};return a}});})(function(b){n.exports=b(e);});},{"../TimeoutError":96,"../env":107}],105:[function(e,n,k){(function(b){b(function(a){function b(a){throw a;}function c(){}var e=a("../env").setTimer,d=a("../format");return function(a){function f(a){a.handled||(g.push(a),n("Potentially unhandled rejection ["+
  a.id+"] "+d.formatError(a.value)));}function h(a){var b=g.indexOf(a);0<=b&&(g.splice(b,1),v("Handled previous rejection ["+a.id+"] "+d.formatObject(a.value)));}function l(a,b){B.push(a,b);null===q&&(q=e(k,0));}function k(){for(q=null;0<B.length;)B.shift()(B.shift());}var n=c,v=c;if("undefined"!==typeof console){var m=console;n="undefined"!==typeof m.error?function(a){m.error(a);}:function(a){m.log(a);};v="undefined"!==typeof m.info?function(a){m.info(a);}:function(a){m.log(a);};}a.onPotentiallyUnhandledRejection=
  function(a){l(f,a);};a.onPotentiallyUnhandledRejectionHandled=function(a){l(h,a);};a.onFatalRejection=function(a){l(b,a.value);};var B=[],g=[],q=null;return a}});})(function(b){n.exports=b(e);});},{"../env":107,"../format":108}],106:[function(e,n,k){(function(b){b(function(){return function(a){a.prototype["with"]=a.prototype.withThis=function(a){var b=this._beget(),e=b._handler;e.receiver=a;this._handler.chain(e,a);return b};return a}});})(function(b){n.exports=b();});},{}],107:[function(e,n,k){(function(b){(function(a){a(function(a){function c(a){var b,
  c=document.createTextNode("");(new a(function(){var a=b;b=void 0;a();})).observe(c,{characterData:!0});var d=0;return function(a){b=a;c.data=d^=1;}}var e,d="undefined"!==typeof setTimeout&&setTimeout,h=function(a,b){return setTimeout(a,b)},k=function(a){return clearTimeout(a)},n=function(a){return d(a,0)};if("undefined"!==typeof b&&"[object process]"===Object.prototype.toString.call(b))n=function(a){return b.nextTick(a)};else if(e="undefined"!==typeof MutationObserver&&MutationObserver||"undefined"!==
  typeof WebKitMutationObserver&&WebKitMutationObserver)n=c(e);else if(!d){var l=a("vertx");h=function(a,b){return l.setTimer(b,a)};k=l.cancelTimer;n=l.runOnLoop||l.runOnContext;}return {setTimer:h,clearTimer:k,asap:n}});})(function(a){n.exports=a(e);});}).call(this,e("_process"));},{_process:76}],108:[function(e,n,k){(function(b){b(function(){function a(a){var c=String(a);"[object Object]"===c&&"undefined"!==typeof JSON&&(c=b(a,c));return c}function b(a,b){try{return JSON.stringify(a)}catch(d){return b}}
  return {formatError:function(b){var c="object"===typeof b&&null!==b&&(b.stack||b.message)?b.stack||b.message:a(b);return b instanceof Error?c:c+" (WARNING: non-Error used)"},formatObject:a,tryStringify:b}});})(function(b){n.exports=b();});},{}],109:[function(e,n,k){(function(b){b(function(){function a(a,b,d){a[d]=b;return a}function b(a){return "function"===typeof a?a.bind():Object.create(a)}return function(c,e,d,h){"undefined"===typeof e&&(e=a);return Object.keys(h).reduce(function(a,b){var d=h[b];return "function"===
  typeof d?e(a,c(d),b):a},"undefined"===typeof d?b(h):d)}});})(function(b){n.exports=b();});},{}],110:[function(e,n,k){(function(b){(function(a){a(function(){return function(a){function c(a,b){this._handler=a===y?b:e(a);}function e(a){function b(a){e.resolve(a);}function c(a){e.reject(a);}function d(a){e.notify(a);}var e=new B;try{a(b,c,d);}catch(Y){c(Y);}return e}function d(a){return a instanceof c?a:new c(y,new g(r(a)))}function h(a){return new c(y,new g(new P(a)))}function k(a,b,d){function e(c,e,h){h.resolved||
  n(d,f,c,a(b,e,c),h);}function f(a,b,c){l[a]=b;0===--k&&c.become(new M(l));}for(var h="function"===typeof b?e:f,g=new B,k=d.length>>>0,l=Array(k),m=0,p;m<d.length&&!g.resolved;++m)p=d[m],void 0!==p||m in d?n(d,h,m,p,g):--k;0===k&&g.become(new M(l));return new c(y,g)}function n(a,b,d,e,f){if(C(e)){e=e instanceof c?e._handler.join():x(e);var h=e.state();0===h?e.fold(b,d,void 0,f):0<h?b(d,e.value,f):(f.become(e),l(a,d+1,e));}else b(d,e,f);}function l(a,b,c){for(;b<a.length;++b){var d=r(a[b]);if(d!==c){var e=
  d.state();0===e?d.visit(d,void 0,d._unreport):0>e&&d._unreport();}}}function r(a){return a instanceof c?a._handler.join():C(a)?x(a):new M(a)}function x(a){try{var b=a.then;return "function"===typeof b?new q(b,a):new M(a)}catch(ca){return new P(ca)}}function y(){}function m(){}function B(a,b){c.createContext(this,b);this.consumers=void 0;this.receiver=a;this.handler=void 0;this.resolved=!1;}function g(a){this.handler=a;}function q(a,b){B.call(this);ba.enqueue(new A(a,b,this));}function M(a){c.createContext(this);
  this.value=a;}function P(a){c.createContext(this);this.id=++oa;this.value=a;this.reported=this.handled=!1;this._report();}function J(a,b){this.rejection=a;this.context=b;}function E(a){this.rejection=a;}function F(a,b){this.continuation=a;this.handler=b;}function G(a,b){this.handler=b;this.value=a;}function A(a,b,c){this._then=a;this.thenable=b;this.resolver=c;}function K(a,b,c,d,e){try{a.call(b,c,d,e);}catch(Y){d(Y);}}function N(a,b,c,d){this.f=a;this.z=b;this.c=c;this.to=d;this.resolver=da;this.receiver=
  this;}function C(a){return ("object"===typeof a||"function"===typeof a)&&null!==a}function X(a,b,d,e){if("function"!==typeof a)return e.become(b);c.enterContext(b);try{e.become(r(a.call(d,b.value)));}catch(W){e.become(new P(W));}c.exitContext();}function z(a,b,c){try{return a(b,c)}catch(V){return h(V)}}function t(a,b){b.prototype=Z(a.prototype);b.prototype.constructor=b;}function p(a,b){return b}function S(){}var ba=a.scheduler,fa=function(){if("undefined"!==typeof b&&null!==b&&"function"===typeof b.emit)var a=
  function(a,c){return "unhandledRejection"===a?b.emit(a,c.value,c):b.emit(a,c)};else {if(a="undefined"!==typeof self)a:{if("function"===typeof CustomEvent)try{a=new CustomEvent("unhandledRejection")instanceof CustomEvent;break a}catch(Q){}a=!1;}if(a)a=function(a,b){return function(c,d){c=new b(c,{detail:{reason:d.value,key:d},bubbles:!1,cancelable:!0});return !a.dispatchEvent(c)}}(self,CustomEvent);else {if(a="undefined"!==typeof self)a:{if("undefined"!==typeof document&&"function"===typeof document.createEvent)try{document.createEvent("CustomEvent").initCustomEvent("eventType",
  !1,!0,{});a=!0;break a}catch(Q){}a=!1;}a=a?function(a,b){return function(c,d){var e=b.createEvent("CustomEvent");e.initCustomEvent(c,!1,!0,{reason:d.value,key:d});return !a.dispatchEvent(e)}}(self,document):S;}}return a}(),Z=Object.create||function(a){function b(){}b.prototype=a;return new b};c.resolve=d;c.reject=h;c.never=function(){return ka};c._defer=function(){return new c(y,new B)};c._handler=r;c.prototype.then=function(a,b,c){var d=this._handler,e=d.join().state();if("function"!==typeof a&&0<e||
  "function"!==typeof b&&0>e)return new this.constructor(y,d);e=this._beget();d.chain(e._handler,d.receiver,a,b,c);return e};c.prototype["catch"]=function(a){return this.then(void 0,a)};c.prototype._beget=function(){var a=this._handler,b=this.constructor;a=new B(a.receiver,a.join().context);return new b(y,a)};c.all=function(a){return k(p,null,a)};c.race=function(a){if("object"!==typeof a||null===a)return h(new TypeError("non-iterable passed to race()"));if(0===a.length)a=ka;else if(1===a.length)a=d(a[0]);
  else {var b=new B,e;for(e=0;e<a.length;++e){var f=a[e];if(void 0!==f||e in a)if(f=r(f),0!==f.state()){b.become(f);l(a,e+1,f);break}else f.visit(b,b.resolve,b.reject);}a=new c(y,b);}return a};c._traverse=function(a,b){return k(z,a,b)};c._visitRemaining=l;y.prototype.when=y.prototype.become=y.prototype.notify=y.prototype.fail=y.prototype._unreport=y.prototype._report=S;y.prototype._state=0;y.prototype.state=function(){return this._state};y.prototype.join=function(){for(var a=this;void 0!==a.handler;)a=
  a.handler;return a};y.prototype.chain=function(a,b,c,d,e){this.when({resolver:a,receiver:b,fulfilled:c,rejected:d,progress:e});};y.prototype.visit=function(a,b,c,d){this.chain(da,a,b,c,d);};y.prototype.fold=function(a,b,c,d){this.when(new N(a,b,c,d));};t(y,m);m.prototype.become=function(a){a.fail();};var da=new m;t(y,B);B.prototype._state=0;B.prototype.resolve=function(a){this.become(r(a));};B.prototype.reject=function(a){this.resolved||this.become(new P(a));};B.prototype.join=function(){if(!this.resolved)return this;
  for(var a=this;void 0!==a.handler;)if(a=a.handler,a===this)return this.handler=new P(new TypeError("Promise cycle"));return a};B.prototype.run=function(){var a=this.consumers,b=this.handler;this.handler=this.handler.join();this.consumers=void 0;for(var c=0;c<a.length;++c)b.when(a[c]);};B.prototype.become=function(a){this.resolved||(this.resolved=!0,this.handler=a,void 0!==this.consumers&&ba.enqueue(this),void 0!==this.context&&a._report(this.context));};B.prototype.when=function(a){this.resolved?ba.enqueue(new F(a,
  this.handler)):void 0===this.consumers?this.consumers=[a]:this.consumers.push(a);};B.prototype.notify=function(a){this.resolved||ba.enqueue(new G(a,this));};B.prototype.fail=function(a){a="undefined"===typeof a?this.context:a;this.resolved&&this.handler.join().fail(a);};B.prototype._report=function(a){this.resolved&&this.handler.join()._report(a);};B.prototype._unreport=function(){this.resolved&&this.handler.join()._unreport();};t(y,g);g.prototype.when=function(a){ba.enqueue(new F(a,this));};g.prototype._report=
  function(a){this.join()._report(a);};g.prototype._unreport=function(){this.join()._unreport();};t(B,q);t(y,M);M.prototype._state=1;M.prototype.fold=function(a,b,d,e){if("function"!==typeof a)e.become(this);else {c.enterContext(this);try{a.call(d,b,this.value,e);}catch(W){e.become(new P(W));}c.exitContext();}};M.prototype.when=function(a){X(a.fulfilled,this,a.receiver,a.resolver);};var oa=0;t(y,P);P.prototype._state=-1;P.prototype.fold=function(a,b,c,d){d.become(this);};P.prototype.when=function(a){"function"===
  typeof a.rejected&&this._unreport();X(a.rejected,this,a.receiver,a.resolver);};P.prototype._report=function(a){ba.afterQueue(new J(this,a));};P.prototype._unreport=function(){this.handled||(this.handled=!0,ba.afterQueue(new E(this)));};P.prototype.fail=function(a){this.reported=!0;fa("unhandledRejection",this);c.onFatalRejection(this,void 0===a?this.context:a);};J.prototype.run=function(){this.rejection.handled||this.rejection.reported||(this.rejection.reported=!0,fa("unhandledRejection",this.rejection)||
  c.onPotentiallyUnhandledRejection(this.rejection,this.context));};E.prototype.run=function(){this.rejection.reported&&(fa("rejectionHandled",this.rejection)||c.onPotentiallyUnhandledRejectionHandled(this.rejection));};c.createContext=c.enterContext=c.exitContext=c.onPotentiallyUnhandledRejection=c.onPotentiallyUnhandledRejectionHandled=c.onFatalRejection=S;a=new y;var ka=new c(y,a);F.prototype.run=function(){this.handler.join().when(this.continuation);};G.prototype.run=function(){var a=this.handler.consumers;
  if(void 0!==a)for(var b,d=0;d<a.length;++d){b=a[d];var e=b.progress,f=this.value,h=this.handler,g=b.receiver;b=b.resolver;if("function"!==typeof e)b.notify(f);else {c.enterContext(h);h=b;try{h.notify(e.call(g,f));}catch(L){h.notify(L);}c.exitContext();}}};A.prototype.run=function(){var a=this.resolver;K(this._then,this.thenable,function(b){a.resolve(b);},function(b){a.reject(b);},function(b){a.notify(b);});};N.prototype.fulfilled=function(a){this.f.call(this.c,this.z,a,this.to);};N.prototype.rejected=function(a){this.to.reject(a);};
  N.prototype.progress=function(a){this.to.notify(a);};return c}});})(function(a){n.exports=a();});}).call(this,e("_process"));},{_process:76}],111:[function(e,n,k){(function(b){b(function(){function a(){return {state:"pending"}}function b(a){return {state:"rejected",reason:a}}function c(a){return {state:"fulfilled",value:a}}return {pending:a,fulfilled:c,rejected:b,inspect:function(e){var d=e.state();return 0===d?a():0<d?c(e.value):b(e.value)}}});})(function(b){n.exports=b();});},{}],112:[function(e,n,k){(function(b){b(function(a){var b=
  a("./monitor/PromiseMonitor");a=a("./monitor/ConsoleReporter");var c=new b(new a);return function(a){return c.monitor(a)}});})(function(b){n.exports=b(e);});},{"./monitor/ConsoleReporter":113,"./monitor/PromiseMonitor":114}],113:[function(e,n,k){(function(b){b(function(a){function b(){this._previouslyReported=!1;}function c(){}var e=a("./error");b.prototype=function(){var a;if("undefined"===typeof console)var b=a=c;else {var e=console;if("function"===typeof e.error&&"function"===typeof e.dir){if(a=function(a){e.error(a);},
  b=function(a){e.log(a);},"function"===typeof e.groupCollapsed){var f=function(a){e.groupCollapsed(a);};var h=function(){e.groupEnd();};}}else b="undefined"!==typeof e.log&&"undefined"!==typeof JSON?a=function(a){if("string"!==typeof a)try{a=JSON.stringify(a);}catch(x){}e.log(a);}:a=c;}return {msg:b,warn:a,groupStart:f||a,groupEnd:h||c}}();b.prototype.log=function(a){if(0===a.length)this._previouslyReported&&(this._previouslyReported=!1,this.msg("[promises] All previously unhandled rejections have now been handled"));
  else {this._previouslyReported=!0;this.groupStart("[promises] Unhandled rejections: "+a.length);try{this._log(a);}finally{this.groupEnd();}}};b.prototype._log=function(a){for(var b=0;b<a.length;++b)this.warn(e.format(a[b]));};return b});})(function(b){n.exports=b(e);});},{"./error":116}],114:[function(e,n,k){(function(b){b(function(a){function b(a){this.logDelay=0;this.stackFilter=d;this.stackJumpSeparator="from execution context:";this.filterDuplicateFrames=!0;this._reporter=a;"function"===typeof a.configurePromiseMonitor&&
  a.configurePromiseMonitor(this);this._traces=[];this._traceTask=0;var b=this;this._doLogTraces=function(){b._logTraces();};}function c(a,b){return b.filter(function(b){return !a.test(b)})}function e(a){return !a.handler.handled}var d=/[\s\(\/\\](node|module|timers)\.js:|when([\/\\]{1,2}(lib|monitor|es6-shim)[\/\\]{1,2}|\.js)|(new\sPromise)\b|(\b(PromiseMonitor|ConsoleReporter|Scheduler|RunHandlerTask|ProgressTask|Promise|.*Handler)\.[\w_]\w\w+\b)|\b(tryCatch\w+|getHandler\w*)\b/i,k=a("../lib/env").setTimer,
  n=a("./error"),w=[];b.prototype.monitor=function(a){var b=this;a.createContext=function(a,c){a.context=b.createContext(a,c);};a.enterContext=function(a){w.push(a.context);};a.exitContext=function(){w.pop();};a.onPotentiallyUnhandledRejection=function(a,c){return b.addTrace(a,c)};a.onPotentiallyUnhandledRejectionHandled=function(a){return b.removeTrace(a)};a.onFatalRejection=function(a,c){return b.fatal(a,c)};return this};b.prototype.createContext=function(a,b){b={parent:b||w[w.length-1],stack:void 0};
  n.captureStack(b,a.constructor);return b};b.prototype.addTrace=function(a,b){var c;for(c=this._traces.length-1;0<=c;--c){var d=this._traces[c];if(d.handler===a)break}0<=c?d.extraContext=b:this._traces.push({handler:a,extraContext:b});this.logTraces();};b.prototype.removeTrace=function(){this.logTraces();};b.prototype.fatal=function(a,b){var c=Error();c.stack=this._createLongTrace(a.value,a.context,b).join("\n");k(function(){throw c;},0);};b.prototype.logTraces=function(){this._traceTask||(this._traceTask=
  k(this._doLogTraces,this.logDelay));};b.prototype._logTraces=function(){this._traceTask=void 0;this._traces=this._traces.filter(e);this._reporter.log(this.formatTraces(this._traces));};b.prototype.formatTraces=function(a){return a.map(function(a){return this._createLongTrace(a.handler.value,a.handler.context,a.extraContext)},this)};b.prototype._createLongTrace=function(a,b,d){a=n.parse(a)||[String(a)+" (WARNING: non-Error used)"];a=c(this.stackFilter,a);this._appendContext(a,b);this._appendContext(a,
  d);return this.filterDuplicateFrames?this._removeDuplicates(a):a};b.prototype._removeDuplicates=function(a){var b={},c=this.stackJumpSeparator,d=0;return a.reduceRight(function(a,e,f){0===f?a.unshift(e):e===c?0<d&&(a.unshift(e),d=0):b[e]||(b[e]=!0,a.unshift(e),++d);return a},[])};b.prototype._appendContext=function(a,b){a.push.apply(a,this._createTrace(b));};b.prototype._createTrace=function(a){for(var b=[],d;a;){if(d=n.parse(a)){d=c(this.stackFilter,d);var e=b;1<d.length&&(d[0]=this.stackJumpSeparator,
  e.push.apply(e,d));}a=a.parent;}return b};return b});})(function(b){n.exports=b(e);});},{"../lib/env":107,"./error":116}],115:[function(e,n,k){(function(b){b(function(a){var b=a("../monitor");a=a("../when").Promise;return b(a)});})(function(b){n.exports=b(e);});},{"../monitor":112,"../when":117}],116:[function(e,n,k){(function(b){b(function(){function a(a){try{throw Error();}catch(r){a.stack=r.stack;}}function b(a){a.stack=Error().stack;}function c(a){return d(a)}function e(a){var b=Error();b.stack=d(a);return b}
  function d(a){for(var b=!1,c="",d=0;d<a.length;++d)b?c+="\n"+a[d]:(c+=a[d],b=!0);return c}if(Error.captureStackTrace){var k=function(a){return a&&a.stack&&a.stack.split("\n")};var n=c;var w=Error.captureStackTrace;}else k=function(a){var b=a&&a.stack&&a.stack.split("\n");b&&a.message&&b.unshift(a.message);return b},"string"!==typeof Error().stack?(n=c,w=a):(n=e,w=b);return {parse:k,format:n,captureStack:w}});})(function(b){n.exports=b();});},{}],117:[function(e,n,k){(function(b){b(function(a){function b(a,
  b,c,d){var e=q.resolve(a);return 2>arguments.length?e:e.then(b,c,d)}function c(a){return function(){for(var b=0,c=arguments.length,d=Array(c);b<c;++b)d[b]=arguments[b];return M(a,this,d)}}function e(a){for(var b=0,c=arguments.length-1,d=Array(c);b<c;++b)d[b]=arguments[b+1];return M(a,this,d)}function d(){function a(a){d._handler.resolve(a);}function b(a){d._handler.reject(a);}function c(a){d._handler.notify(a);}var d=q._defer();this.promise=d;this.resolve=a;this.reject=b;this.notify=c;this.resolver=
  {resolve:a,reject:b,notify:c};}var k=a("./lib/decorators/timed"),n=a("./lib/decorators/array"),w=a("./lib/decorators/flow"),l=a("./lib/decorators/fold"),r=a("./lib/decorators/inspect"),x=a("./lib/decorators/iterate"),y=a("./lib/decorators/progress"),m=a("./lib/decorators/with"),B=a("./lib/decorators/unhandledRejection"),g=a("./lib/TimeoutError"),q=[n,w,l,x,y,r,m,k,B].reduce(function(a,b){return b(a)},a("./lib/Promise")),M=a("./lib/apply")(q);b.promise=function(a){return new q(a)};b.resolve=q.resolve;
  b.reject=q.reject;b.lift=c;b["try"]=e;b.attempt=e;b.iterate=q.iterate;b.unfold=q.unfold;b.join=function(){return q.all(arguments)};b.all=function(a){return b(a,q.all)};b.settle=function(a){return b(a,q.settle)};b.any=c(q.any);b.some=c(q.some);b.race=c(q.race);b.map=function(a,c){return b(a,function(a){return q.map(a,c)})};b.filter=function(a,c){return b(a,function(a){return q.filter(a,c)})};b.reduce=c(q.reduce);b.reduceRight=c(q.reduceRight);b.isPromiseLike=function(a){return a&&"function"===typeof a.then};
  b.Promise=q;b.defer=function(){return new d};b.TimeoutError=g;return b});})(function(b){n.exports=b(e);});},{"./lib/Promise":94,"./lib/TimeoutError":96,"./lib/apply":97,"./lib/decorators/array":98,"./lib/decorators/flow":99,"./lib/decorators/fold":100,"./lib/decorators/inspect":101,"./lib/decorators/iterate":102,"./lib/decorators/progress":103,"./lib/decorators/timed":104,"./lib/decorators/unhandledRejection":105,"./lib/decorators/with":106}],118:[function(e,n,k){n.exports={name:"autobahn",version:"18.10.2",
  description:"An implementation of The Web Application Messaging Protocol (WAMP).",main:"index.js",scripts:{test:"nodeunit test/test.js"},engines:{node:">= 4.2.6"},dependencies:{cbor:">= 3.0.0","crypto-js":">=3.1.8",msgpack5:">= 3.6.0",randombytes:">=2.0.6",tweetnacl:">= 0.14.3",when:">= 3.7.7",ws:">= 1.1.4"},optionalDependencies:{bufferutil:">= 1.2.1","utf-8-validate":">= 1.2.1"},devDependencies:{browserify:">= 13.1.1","deep-equal":">= 1.0.1","google-closure-compiler":"^20170218.0.0",nodeunit:">= 0.10.2"},
  browser:{ws:!1,"lib/transport/rawsocket.js":!1,cbor:!1,randombytes:!1},repository:{type:"git",url:"git://github.com/crossbario/autobahn-js.git"},keywords:["WAMP","WebSocket","RPC","PubSub"],author:"Crossbar.io Technologies GmbH",license:"MIT"};},{}]},{},[4])(4)});
  });

  function SocketWorker (pubSub, config) {
    var self = this;
    this.pubSub = pubSub;
    this.config = config;
    this.connection = null;
    this.hasMsgQueue = false;
    this.msgQueue = new Queue();
    this.session = null;

    pubSub.subscribe('wamp', function (cmd) {
      // console.info('socketWorker: wamp', cmd)
      // var workerResult = 'Result: ' + (e.data[0] * e.data[1])
      // postMessage(workerResult)
      // console.log('data', e.data)
      // console.log('cmd', cmd)
      // if (cmd === 'setCfg') {
      //   config = e.data[1]
      // } else
      if (cmd === 'connectionClose') {
        self.connection.close();
      } else if (cmd === 'connectionOpen') {
        self.connection = self.getConnection();
      } else if (cmd === 'getMsg') {
        var msg = self.msgQueue.shift();
        // postMessage(['msg', msg])
        if (typeof msg === 'undefined') {
          self.hasMsgQueue = false;
          return
        }
        pubSub.publish('wamp', 'msg', msg);
      } else if (cmd === 'publish') {
        // topic, arguments
        self.session.publish(arguments[1], arguments[2]);
      }
    });
  }

  SocketWorker.prototype.getConnection = function () {
    var connection = new autobahn_min.Connection({
      url: this.config.get('url'),
      realm: this.config.get('realm')
    });
    var self = this;
    connection.onopen = function (session, details) {
      console.info('Wamp connection opened', details);

      self.session = session;

      // postMessage('connectionOpened')
      self.pubSub.publish('wamp', 'connectionOpened');
      // var myWorker = new Worker('socketWorker.js')
      // SUBSCRIBE to a topic and receive events

      session.subscribe('bdk.debug', self.onMsgFactory('bdk.debug')).then(
        function (sub) {
          // console.log('subscribed to topic')
        },
        function (err) {
          console.warn('failed to subscribe to topic', err);
        }
      );

      session.subscribe('bdk.debug.xdebug', self.onMsgFactory('bdk.debug.xdebug')).then(
        function (sub) {
          // console.log('subscribed to topic')
        },
        function (err) {
          console.warn('failed to subscribe to topic', err);
        }
      );
      // end onopen callback
    };
    connection.onclose = function (reason, details) {
      // console.warn('Connection closed: ' + reason)
      // postMessage('connectionClosed')
      self.pubSub.publish('wamp', 'connectionClosed');
    };
    connection.open();
    // console.log('connection', connection)
    return connection
  };

  SocketWorker.prototype.onMsgFactory = function (topic) {
    var self = this;
    return function (msg) {
      // console.log('recvd args', Object.keys(row[1][1]))
      if (!self.hasMsgQueue) {
        self.hasMsgQueue = true;
        // postMessage(['msg', row])
        self.pubSub.publish('wamp', 'msg', {
          topic: topic,
          msg: msg
        });
      } else {
        self.msgQueue.push(msg);
      }
    }
  };

  var config = new Config(
    {
      url: 'ws://127.0.0.1:9090/',
      realm: 'debug',
      fontSize: '1em',
      linkFiles: false,
      linkFilesTemplate: 'subl://open?url=file://%file&line=%line'
    },
    'debugWampClient'
  );

  initWamp();
  var xdebug = initXdebug();

  $$1(function () {
    var hasConnected = false;
    var $root = $$1('#debug-cards');

    init$1(config);
    /*
      init on #debug-cards vs body so we can stop event propagation before bubbles to body  (ie clipboard.js)
    */
    $root.debugEnhance('init', {
      sidebar: true,
      useLocalStorage: false
    });

    PubSub.subscribe('wamp', function (cmd, data) {
      var logEntry = {};
      if (cmd === 'msg') {
        logEntry = {
          method: data.msg[0],
          args: data.msg[1],
          meta: data.msg[2]
        };
        if (data.topic === 'bdk.debug') {
          processEntry(logEntry);
          if (logEntry.method === 'meta' && logEntry.meta.linkFilesTemplateDefault) {
            config.setDefault({
              linkFiles: true,
              linkFilesTemplate: logEntry.meta.linkFilesTemplateDefault
            });
          }
        } else if (data.topic === 'bdk.debug.xdebug') {
          xdebug.processEntry(logEntry);
        }
        // myWorker.postMessage('getMsg') // request next msg
        PubSub.publish('wamp', 'getMsg');
      } else if (cmd === 'connectionClosed') {
        $$1('#alert.connecting').remove();
        if ($$1('#alert.closed').length) {
          return
        }
        $$1('#debug-cards').prepend(
          '<div id="alert" class="alert alert-warning alert-dismissible closed">' +
            'Not connected to debug server' +
            '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
          '</div>'
        );
        if (!config.haveSavedConfig && !hasConnected) {
          $$1('#modal-settings').modal('show');
        }
      } else if (cmd === 'connectionOpened') {
        hasConnected = true;
        $$1('#alert').remove();
      }
    });

    // myWorker.postMessage(['setCfg', config.get()])
    // myWorker.postMessage('connectionOpen')
    // console.log('config', config)
    // events.publish('onmessage', 'setCfg', config.get())
    PubSub.publish('wamp', 'connectionOpen');

    PubSub.subscribe('phpDebugConsoleConfig', function (vals) {
      $root.debugEnhance('setConfig', vals);
    });

    config.checkPhpDebugConsole();
  });

  function initWamp () {
    return new SocketWorker(PubSub, config)
  }

  function initXdebug () {
    return new Xdebug(PubSub)
  }

}(window.jQuery));
