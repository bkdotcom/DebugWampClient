(function ($$1) {
  'use strict';

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
      // "'": '&#039;',
    };
    var regex = new RegExp('[' + Object.keys(map).join('') + ']', 'g');
    return this.replace(regex, function (m) { return map[m] })
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
    var sheet = document.getElementById(stylesheet).sheet
      ;
    var cssRule = findCssRule(sheet, selector);
    var ruleCamel = rule.replace(/-([a-z])/g, function (matach, p1) {
      return p1.toUpperCase()
    });
    cssRule.style[ruleCamel] = value;
  }

  function init$1 (config) {
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
        theme: $$1('#theme').val(),
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
      $$1('#theme').val(config.get('theme')).trigger('change');
      $$1('#wsUrl').val(config.get('url'));
      $$1('#realm').val(config.get('realm'));
      $$1('#font-size').val(config.get('fontSize'));
      $$1('#link-files').prop('checked', config.get('linkFiles')).trigger('change');
      $$1('#link-files-template').val(config.get('linkFilesTemplate'));
    });

    $$1('#theme-options').on('click', 'button', function () {
      $$1('#theme').val($$1(this).val()).trigger('change');
    });

    $$1('#theme').on('change', function (e) {
      var val = $$1(this).val();
      var $icon;
      $$1('#theme-options .dropdown-item').each(function () {
        var isOption = $$1(this).val() === val;
        $$1(this).toggleClass('active', isOption);
        if (isOption) {
          $icon = $$1(this).find('i').clone();
        }
      });
      $$1('#theme-options').prev().find('i').remove();
      $$1('#theme-options').prev().prepend($icon);
    });
  }

  var classCollapsed = 'fa-chevron-right';
  var classExpanded = 'fa-chevron-down';
  var timeoutHandler;
  var navbarHeight; // = $('nav.navbar').outerHeight()
  var $cardsInViewport = $$1();

  function init (config) {
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

    init$1(config);

    // note:  navbar may not yet be at final height
    navbarHeight = $$1('nav.navbar').outerHeight();
  }

  function debounce (fn, ms) {

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

  Table.prototype.build = function (rows, meta, onBuildRow, info) {
    // console.warn('Table.build', JSON.parse(JSON.stringify(meta)))
    var metaDefault = {
      attribs: {
        class: [
          'table-bordered',
          meta.sortable ? 'sortable' : null,
          meta.inclContext ? 'trace-context' : null
        ]
      },
      caption: '',
      tableInfo: {
        columns: [],
        haveObjRow: false,
        rows: [],
      }
    };
    meta.tableInfo = $$1.extend(metaDefault.tableInfo, meta.tableInfo);
    meta = $$1.extend(metaDefault, meta);
    if (meta.caption === null) {
      meta.caption = '';
    }
    $table = $$1('<table>' +
      (meta.caption.length ? '<caption>' + meta.caption.escapeHtml() + '</caption>' : '')+
      '<thead><tr><th>&nbsp;</th></tr></thead>' +
      '<tbody></tbody>' +
      '</table>'
    )
      .addClass(meta.attribs.class.join(' '));
    this.buildHeader(meta.tableInfo);
    this.buildBody(rows, meta.tableInfo, onBuildRow, info);
    this.buildFooter(meta.tableInfo);
    return $table
  };

  Table.prototype.buildBody = function (rows, tableInfo, onBuildRow, info) {
    var i;
    var length;
    var i2;
    var length2;
    var rowKeys = rows.__debug_key_order__ || Object.keys(rows);
    var rowKey;
    var row;
    var rowInfo;
    var $tbody = $table.find('> tbody');
    var $tr;
    delete rows.__debug_key_order__;
    for (i = 0, length = rowKeys.length; i < length; i++) {
      rowKey = rowKeys[i];
      row = rows[rowKey];
      rowInfo = $$1.extend(
        {},
        typeof tableInfo.commonRowInfo !== 'undefined'
          ? tableInfo.commonRowInfo
          : {},
        typeof tableInfo.rows[rowKey] !== 'undefined'
          ? tableInfo.rows[rowKey]
          : {},
        {
          requestInfo: info, //  so pass to onBuildRow (we want DOCUMENT_ROOT)
        }
      );
      if (rowInfo.key) {
        rowKey = rowInfo.key;
      }
      // using for in, so every key will be a string
      //  check if actually an integer
      if (typeof rowKey === 'string' && rowKey.match(/^\d+$/) && Number.isSafeInteger(rowKey)) {
        rowKey = parseInt(rowKey, 10);
      }

      $tr = this.buildRow(row, rowInfo, rowKey, tableInfo);
      for (i2 = 0, length2 = onBuildRow.length; i2 < length2; i2++) {
        $tr = onBuildRow[i2]($tr, row, rowInfo, rowKey);
      }
      $tbody.append($tr);
    }
  };

  Table.prototype.buildRow = function (row, rowInfo, rowKey, tableInfo) {
    var i;
    var length;
    var colInfo;
    var key;
    var parsed = this.dump.parseTag(this.dump.dump(rowKey, {
      requestInfo: rowInfo.requestInfo,
    }));
    var td;
    var $tr = $$1('<tr></tr>', rowInfo.attribs || {})
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
    for (i = 0, length = tableInfo.columns.length; i < length; i++) {
      colInfo = tableInfo.columns[i];
      key = colInfo.key;
      td = this.dump.dump(row[key], {
        attribs: colInfo.attribs || {},
        requestInfo: rowInfo.requestInfo,
        tagName: 'td',
      });
      if (row[key] === true && colInfo.trueAs !== null) {
        td = td.replace('>true<', '>' + colInfo.trueAs + '<');
      } else if (row[key] === false && colInfo.falseAs !== null) {
        td = td.replace('>false<', '>' + colInfo.falseAs + '<');
      }
      $tr.append(td);
    }
    return $tr
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
        if (!isNaN(parseFloat(info.total)) && isFinite(info.total)) {
          // isNumeric
          info.total = parseFloat(info.total.toFixed(6), 10);
        }
        cells.push(this.dump.dump(info.total, {
          attribs: info.attribs,
          tagName: 'td',
        }));
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

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function getDefaultExportFromCjs (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  /**
   * Removes all key-value entries from the list cache.
   *
   * @private
   * @name clear
   * @memberOf ListCache
   */

  var _listCacheClear;
  var hasRequired_listCacheClear;

  function require_listCacheClear () {
  	if (hasRequired_listCacheClear) return _listCacheClear;
  	hasRequired_listCacheClear = 1;
  	function listCacheClear() {
  	  this.__data__ = [];
  	  this.size = 0;
  	}

  	_listCacheClear = listCacheClear;
  	return _listCacheClear;
  }

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

  var eq_1;
  var hasRequiredEq;

  function requireEq () {
  	if (hasRequiredEq) return eq_1;
  	hasRequiredEq = 1;
  	function eq(value, other) {
  	  return value === other || (value !== value && other !== other);
  	}

  	eq_1 = eq;
  	return eq_1;
  }

  var _assocIndexOf;
  var hasRequired_assocIndexOf;

  function require_assocIndexOf () {
  	if (hasRequired_assocIndexOf) return _assocIndexOf;
  	hasRequired_assocIndexOf = 1;
  	var eq = requireEq();

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
  	    if (eq(array[length][0], key)) {
  	      return length;
  	    }
  	  }
  	  return -1;
  	}

  	_assocIndexOf = assocIndexOf;
  	return _assocIndexOf;
  }

  var _listCacheDelete;
  var hasRequired_listCacheDelete;

  function require_listCacheDelete () {
  	if (hasRequired_listCacheDelete) return _listCacheDelete;
  	hasRequired_listCacheDelete = 1;
  	var assocIndexOf = require_assocIndexOf();

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
  	      index = assocIndexOf(data, key);

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

  	_listCacheDelete = listCacheDelete;
  	return _listCacheDelete;
  }

  var _listCacheGet;
  var hasRequired_listCacheGet;

  function require_listCacheGet () {
  	if (hasRequired_listCacheGet) return _listCacheGet;
  	hasRequired_listCacheGet = 1;
  	var assocIndexOf = require_assocIndexOf();

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
  	      index = assocIndexOf(data, key);

  	  return index < 0 ? undefined : data[index][1];
  	}

  	_listCacheGet = listCacheGet;
  	return _listCacheGet;
  }

  var _listCacheHas;
  var hasRequired_listCacheHas;

  function require_listCacheHas () {
  	if (hasRequired_listCacheHas) return _listCacheHas;
  	hasRequired_listCacheHas = 1;
  	var assocIndexOf = require_assocIndexOf();

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
  	  return assocIndexOf(this.__data__, key) > -1;
  	}

  	_listCacheHas = listCacheHas;
  	return _listCacheHas;
  }

  var _listCacheSet;
  var hasRequired_listCacheSet;

  function require_listCacheSet () {
  	if (hasRequired_listCacheSet) return _listCacheSet;
  	hasRequired_listCacheSet = 1;
  	var assocIndexOf = require_assocIndexOf();

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
  	      index = assocIndexOf(data, key);

  	  if (index < 0) {
  	    ++this.size;
  	    data.push([key, value]);
  	  } else {
  	    data[index][1] = value;
  	  }
  	  return this;
  	}

  	_listCacheSet = listCacheSet;
  	return _listCacheSet;
  }

  var _ListCache;
  var hasRequired_ListCache;

  function require_ListCache () {
  	if (hasRequired_ListCache) return _ListCache;
  	hasRequired_ListCache = 1;
  	var listCacheClear = require_listCacheClear(),
  	    listCacheDelete = require_listCacheDelete(),
  	    listCacheGet = require_listCacheGet(),
  	    listCacheHas = require_listCacheHas(),
  	    listCacheSet = require_listCacheSet();

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
  	ListCache.prototype.clear = listCacheClear;
  	ListCache.prototype['delete'] = listCacheDelete;
  	ListCache.prototype.get = listCacheGet;
  	ListCache.prototype.has = listCacheHas;
  	ListCache.prototype.set = listCacheSet;

  	_ListCache = ListCache;
  	return _ListCache;
  }

  var _stackClear;
  var hasRequired_stackClear;

  function require_stackClear () {
  	if (hasRequired_stackClear) return _stackClear;
  	hasRequired_stackClear = 1;
  	var ListCache = require_ListCache();

  	/**
  	 * Removes all key-value entries from the stack.
  	 *
  	 * @private
  	 * @name clear
  	 * @memberOf Stack
  	 */
  	function stackClear() {
  	  this.__data__ = new ListCache;
  	  this.size = 0;
  	}

  	_stackClear = stackClear;
  	return _stackClear;
  }

  /**
   * Removes `key` and its value from the stack.
   *
   * @private
   * @name delete
   * @memberOf Stack
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */

  var _stackDelete;
  var hasRequired_stackDelete;

  function require_stackDelete () {
  	if (hasRequired_stackDelete) return _stackDelete;
  	hasRequired_stackDelete = 1;
  	function stackDelete(key) {
  	  var data = this.__data__,
  	      result = data['delete'](key);

  	  this.size = data.size;
  	  return result;
  	}

  	_stackDelete = stackDelete;
  	return _stackDelete;
  }

  /**
   * Gets the stack value for `key`.
   *
   * @private
   * @name get
   * @memberOf Stack
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */

  var _stackGet;
  var hasRequired_stackGet;

  function require_stackGet () {
  	if (hasRequired_stackGet) return _stackGet;
  	hasRequired_stackGet = 1;
  	function stackGet(key) {
  	  return this.__data__.get(key);
  	}

  	_stackGet = stackGet;
  	return _stackGet;
  }

  /**
   * Checks if a stack value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Stack
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */

  var _stackHas;
  var hasRequired_stackHas;

  function require_stackHas () {
  	if (hasRequired_stackHas) return _stackHas;
  	hasRequired_stackHas = 1;
  	function stackHas(key) {
  	  return this.__data__.has(key);
  	}

  	_stackHas = stackHas;
  	return _stackHas;
  }

  /** Detect free variable `global` from Node.js. */

  var _freeGlobal;
  var hasRequired_freeGlobal;

  function require_freeGlobal () {
  	if (hasRequired_freeGlobal) return _freeGlobal;
  	hasRequired_freeGlobal = 1;
  	var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

  	_freeGlobal = freeGlobal;
  	return _freeGlobal;
  }

  var _root;
  var hasRequired_root;

  function require_root () {
  	if (hasRequired_root) return _root;
  	hasRequired_root = 1;
  	var freeGlobal = require_freeGlobal();

  	/** Detect free variable `self`. */
  	var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

  	/** Used as a reference to the global object. */
  	var root = freeGlobal || freeSelf || Function('return this')();

  	_root = root;
  	return _root;
  }

  var _Symbol;
  var hasRequired_Symbol;

  function require_Symbol () {
  	if (hasRequired_Symbol) return _Symbol;
  	hasRequired_Symbol = 1;
  	var root = require_root();

  	/** Built-in value references. */
  	var Symbol = root.Symbol;

  	_Symbol = Symbol;
  	return _Symbol;
  }

  var _getRawTag;
  var hasRequired_getRawTag;

  function require_getRawTag () {
  	if (hasRequired_getRawTag) return _getRawTag;
  	hasRequired_getRawTag = 1;
  	var Symbol = require_Symbol();

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
  	var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

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

  	_getRawTag = getRawTag;
  	return _getRawTag;
  }

  /** Used for built-in method references. */

  var _objectToString;
  var hasRequired_objectToString;

  function require_objectToString () {
  	if (hasRequired_objectToString) return _objectToString;
  	hasRequired_objectToString = 1;
  	var objectProto = Object.prototype;

  	/**
  	 * Used to resolve the
  	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
  	 * of values.
  	 */
  	var nativeObjectToString = objectProto.toString;

  	/**
  	 * Converts `value` to a string using `Object.prototype.toString`.
  	 *
  	 * @private
  	 * @param {*} value The value to convert.
  	 * @returns {string} Returns the converted string.
  	 */
  	function objectToString(value) {
  	  return nativeObjectToString.call(value);
  	}

  	_objectToString = objectToString;
  	return _objectToString;
  }

  var _baseGetTag;
  var hasRequired_baseGetTag;

  function require_baseGetTag () {
  	if (hasRequired_baseGetTag) return _baseGetTag;
  	hasRequired_baseGetTag = 1;
  	var Symbol = require_Symbol(),
  	    getRawTag = require_getRawTag(),
  	    objectToString = require_objectToString();

  	/** `Object#toString` result references. */
  	var nullTag = '[object Null]',
  	    undefinedTag = '[object Undefined]';

  	/** Built-in value references. */
  	var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

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
  	  return (symToStringTag && symToStringTag in Object(value))
  	    ? getRawTag(value)
  	    : objectToString(value);
  	}

  	_baseGetTag = baseGetTag;
  	return _baseGetTag;
  }

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

  var isObject_1;
  var hasRequiredIsObject;

  function requireIsObject () {
  	if (hasRequiredIsObject) return isObject_1;
  	hasRequiredIsObject = 1;
  	function isObject(value) {
  	  var type = typeof value;
  	  return value != null && (type == 'object' || type == 'function');
  	}

  	isObject_1 = isObject;
  	return isObject_1;
  }

  var isFunction_1;
  var hasRequiredIsFunction;

  function requireIsFunction () {
  	if (hasRequiredIsFunction) return isFunction_1;
  	hasRequiredIsFunction = 1;
  	var baseGetTag = require_baseGetTag(),
  	    isObject = requireIsObject();

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
  	  if (!isObject(value)) {
  	    return false;
  	  }
  	  // The use of `Object#toString` avoids issues with the `typeof` operator
  	  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  	  var tag = baseGetTag(value);
  	  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
  	}

  	isFunction_1 = isFunction;
  	return isFunction_1;
  }

  var _coreJsData;
  var hasRequired_coreJsData;

  function require_coreJsData () {
  	if (hasRequired_coreJsData) return _coreJsData;
  	hasRequired_coreJsData = 1;
  	var root = require_root();

  	/** Used to detect overreaching core-js shims. */
  	var coreJsData = root['__core-js_shared__'];

  	_coreJsData = coreJsData;
  	return _coreJsData;
  }

  var _isMasked;
  var hasRequired_isMasked;

  function require_isMasked () {
  	if (hasRequired_isMasked) return _isMasked;
  	hasRequired_isMasked = 1;
  	var coreJsData = require_coreJsData();

  	/** Used to detect methods masquerading as native. */
  	var maskSrcKey = (function() {
  	  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
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

  	_isMasked = isMasked;
  	return _isMasked;
  }

  /** Used for built-in method references. */

  var _toSource;
  var hasRequired_toSource;

  function require_toSource () {
  	if (hasRequired_toSource) return _toSource;
  	hasRequired_toSource = 1;
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

  	_toSource = toSource;
  	return _toSource;
  }

  var _baseIsNative;
  var hasRequired_baseIsNative;

  function require_baseIsNative () {
  	if (hasRequired_baseIsNative) return _baseIsNative;
  	hasRequired_baseIsNative = 1;
  	var isFunction = requireIsFunction(),
  	    isMasked = require_isMasked(),
  	    isObject = requireIsObject(),
  	    toSource = require_toSource();

  	/**
  	 * Used to match `RegExp`
  	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
  	 */
  	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

  	/** Used to detect host constructors (Safari). */
  	var reIsHostCtor = /^\[object .+?Constructor\]$/;

  	/** Used for built-in method references. */
  	var funcProto = Function.prototype,
  	    objectProto = Object.prototype;

  	/** Used to resolve the decompiled source of functions. */
  	var funcToString = funcProto.toString;

  	/** Used to check objects for own properties. */
  	var hasOwnProperty = objectProto.hasOwnProperty;

  	/** Used to detect if a method is native. */
  	var reIsNative = RegExp('^' +
  	  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
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
  	  if (!isObject(value) || isMasked(value)) {
  	    return false;
  	  }
  	  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  	  return pattern.test(toSource(value));
  	}

  	_baseIsNative = baseIsNative;
  	return _baseIsNative;
  }

  /**
   * Gets the value at `key` of `object`.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */

  var _getValue;
  var hasRequired_getValue;

  function require_getValue () {
  	if (hasRequired_getValue) return _getValue;
  	hasRequired_getValue = 1;
  	function getValue(object, key) {
  	  return object == null ? undefined : object[key];
  	}

  	_getValue = getValue;
  	return _getValue;
  }

  var _getNative;
  var hasRequired_getNative;

  function require_getNative () {
  	if (hasRequired_getNative) return _getNative;
  	hasRequired_getNative = 1;
  	var baseIsNative = require_baseIsNative(),
  	    getValue = require_getValue();

  	/**
  	 * Gets the native function at `key` of `object`.
  	 *
  	 * @private
  	 * @param {Object} object The object to query.
  	 * @param {string} key The key of the method to get.
  	 * @returns {*} Returns the function if it's native, else `undefined`.
  	 */
  	function getNative(object, key) {
  	  var value = getValue(object, key);
  	  return baseIsNative(value) ? value : undefined;
  	}

  	_getNative = getNative;
  	return _getNative;
  }

  var _Map;
  var hasRequired_Map;

  function require_Map () {
  	if (hasRequired_Map) return _Map;
  	hasRequired_Map = 1;
  	var getNative = require_getNative(),
  	    root = require_root();

  	/* Built-in method references that are verified to be native. */
  	var Map = getNative(root, 'Map');

  	_Map = Map;
  	return _Map;
  }

  var _nativeCreate;
  var hasRequired_nativeCreate;

  function require_nativeCreate () {
  	if (hasRequired_nativeCreate) return _nativeCreate;
  	hasRequired_nativeCreate = 1;
  	var getNative = require_getNative();

  	/* Built-in method references that are verified to be native. */
  	var nativeCreate = getNative(Object, 'create');

  	_nativeCreate = nativeCreate;
  	return _nativeCreate;
  }

  var _hashClear;
  var hasRequired_hashClear;

  function require_hashClear () {
  	if (hasRequired_hashClear) return _hashClear;
  	hasRequired_hashClear = 1;
  	var nativeCreate = require_nativeCreate();

  	/**
  	 * Removes all key-value entries from the hash.
  	 *
  	 * @private
  	 * @name clear
  	 * @memberOf Hash
  	 */
  	function hashClear() {
  	  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  	  this.size = 0;
  	}

  	_hashClear = hashClear;
  	return _hashClear;
  }

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

  var _hashDelete;
  var hasRequired_hashDelete;

  function require_hashDelete () {
  	if (hasRequired_hashDelete) return _hashDelete;
  	hasRequired_hashDelete = 1;
  	function hashDelete(key) {
  	  var result = this.has(key) && delete this.__data__[key];
  	  this.size -= result ? 1 : 0;
  	  return result;
  	}

  	_hashDelete = hashDelete;
  	return _hashDelete;
  }

  var _hashGet;
  var hasRequired_hashGet;

  function require_hashGet () {
  	if (hasRequired_hashGet) return _hashGet;
  	hasRequired_hashGet = 1;
  	var nativeCreate = require_nativeCreate();

  	/** Used to stand-in for `undefined` hash values. */
  	var HASH_UNDEFINED = '__lodash_hash_undefined__';

  	/** Used for built-in method references. */
  	var objectProto = Object.prototype;

  	/** Used to check objects for own properties. */
  	var hasOwnProperty = objectProto.hasOwnProperty;

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
  	  if (nativeCreate) {
  	    var result = data[key];
  	    return result === HASH_UNDEFINED ? undefined : result;
  	  }
  	  return hasOwnProperty.call(data, key) ? data[key] : undefined;
  	}

  	_hashGet = hashGet;
  	return _hashGet;
  }

  var _hashHas;
  var hasRequired_hashHas;

  function require_hashHas () {
  	if (hasRequired_hashHas) return _hashHas;
  	hasRequired_hashHas = 1;
  	var nativeCreate = require_nativeCreate();

  	/** Used for built-in method references. */
  	var objectProto = Object.prototype;

  	/** Used to check objects for own properties. */
  	var hasOwnProperty = objectProto.hasOwnProperty;

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
  	  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
  	}

  	_hashHas = hashHas;
  	return _hashHas;
  }

  var _hashSet;
  var hasRequired_hashSet;

  function require_hashSet () {
  	if (hasRequired_hashSet) return _hashSet;
  	hasRequired_hashSet = 1;
  	var nativeCreate = require_nativeCreate();

  	/** Used to stand-in for `undefined` hash values. */
  	var HASH_UNDEFINED = '__lodash_hash_undefined__';

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
  	  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  	  return this;
  	}

  	_hashSet = hashSet;
  	return _hashSet;
  }

  var _Hash;
  var hasRequired_Hash;

  function require_Hash () {
  	if (hasRequired_Hash) return _Hash;
  	hasRequired_Hash = 1;
  	var hashClear = require_hashClear(),
  	    hashDelete = require_hashDelete(),
  	    hashGet = require_hashGet(),
  	    hashHas = require_hashHas(),
  	    hashSet = require_hashSet();

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
  	Hash.prototype.clear = hashClear;
  	Hash.prototype['delete'] = hashDelete;
  	Hash.prototype.get = hashGet;
  	Hash.prototype.has = hashHas;
  	Hash.prototype.set = hashSet;

  	_Hash = Hash;
  	return _Hash;
  }

  var _mapCacheClear;
  var hasRequired_mapCacheClear;

  function require_mapCacheClear () {
  	if (hasRequired_mapCacheClear) return _mapCacheClear;
  	hasRequired_mapCacheClear = 1;
  	var Hash = require_Hash(),
  	    ListCache = require_ListCache(),
  	    Map = require_Map();

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
  	    'hash': new Hash,
  	    'map': new (Map || ListCache),
  	    'string': new Hash
  	  };
  	}

  	_mapCacheClear = mapCacheClear;
  	return _mapCacheClear;
  }

  /**
   * Checks if `value` is suitable for use as unique object key.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
   */

  var _isKeyable;
  var hasRequired_isKeyable;

  function require_isKeyable () {
  	if (hasRequired_isKeyable) return _isKeyable;
  	hasRequired_isKeyable = 1;
  	function isKeyable(value) {
  	  var type = typeof value;
  	  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
  	    ? (value !== '__proto__')
  	    : (value === null);
  	}

  	_isKeyable = isKeyable;
  	return _isKeyable;
  }

  var _getMapData;
  var hasRequired_getMapData;

  function require_getMapData () {
  	if (hasRequired_getMapData) return _getMapData;
  	hasRequired_getMapData = 1;
  	var isKeyable = require_isKeyable();

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
  	  return isKeyable(key)
  	    ? data[typeof key == 'string' ? 'string' : 'hash']
  	    : data.map;
  	}

  	_getMapData = getMapData;
  	return _getMapData;
  }

  var _mapCacheDelete;
  var hasRequired_mapCacheDelete;

  function require_mapCacheDelete () {
  	if (hasRequired_mapCacheDelete) return _mapCacheDelete;
  	hasRequired_mapCacheDelete = 1;
  	var getMapData = require_getMapData();

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
  	  var result = getMapData(this, key)['delete'](key);
  	  this.size -= result ? 1 : 0;
  	  return result;
  	}

  	_mapCacheDelete = mapCacheDelete;
  	return _mapCacheDelete;
  }

  var _mapCacheGet;
  var hasRequired_mapCacheGet;

  function require_mapCacheGet () {
  	if (hasRequired_mapCacheGet) return _mapCacheGet;
  	hasRequired_mapCacheGet = 1;
  	var getMapData = require_getMapData();

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
  	  return getMapData(this, key).get(key);
  	}

  	_mapCacheGet = mapCacheGet;
  	return _mapCacheGet;
  }

  var _mapCacheHas;
  var hasRequired_mapCacheHas;

  function require_mapCacheHas () {
  	if (hasRequired_mapCacheHas) return _mapCacheHas;
  	hasRequired_mapCacheHas = 1;
  	var getMapData = require_getMapData();

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
  	  return getMapData(this, key).has(key);
  	}

  	_mapCacheHas = mapCacheHas;
  	return _mapCacheHas;
  }

  var _mapCacheSet;
  var hasRequired_mapCacheSet;

  function require_mapCacheSet () {
  	if (hasRequired_mapCacheSet) return _mapCacheSet;
  	hasRequired_mapCacheSet = 1;
  	var getMapData = require_getMapData();

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
  	  var data = getMapData(this, key),
  	      size = data.size;

  	  data.set(key, value);
  	  this.size += data.size == size ? 0 : 1;
  	  return this;
  	}

  	_mapCacheSet = mapCacheSet;
  	return _mapCacheSet;
  }

  var _MapCache;
  var hasRequired_MapCache;

  function require_MapCache () {
  	if (hasRequired_MapCache) return _MapCache;
  	hasRequired_MapCache = 1;
  	var mapCacheClear = require_mapCacheClear(),
  	    mapCacheDelete = require_mapCacheDelete(),
  	    mapCacheGet = require_mapCacheGet(),
  	    mapCacheHas = require_mapCacheHas(),
  	    mapCacheSet = require_mapCacheSet();

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
  	MapCache.prototype.clear = mapCacheClear;
  	MapCache.prototype['delete'] = mapCacheDelete;
  	MapCache.prototype.get = mapCacheGet;
  	MapCache.prototype.has = mapCacheHas;
  	MapCache.prototype.set = mapCacheSet;

  	_MapCache = MapCache;
  	return _MapCache;
  }

  var _stackSet;
  var hasRequired_stackSet;

  function require_stackSet () {
  	if (hasRequired_stackSet) return _stackSet;
  	hasRequired_stackSet = 1;
  	var ListCache = require_ListCache(),
  	    Map = require_Map(),
  	    MapCache = require_MapCache();

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
  	  if (data instanceof ListCache) {
  	    var pairs = data.__data__;
  	    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
  	      pairs.push([key, value]);
  	      this.size = ++data.size;
  	      return this;
  	    }
  	    data = this.__data__ = new MapCache(pairs);
  	  }
  	  data.set(key, value);
  	  this.size = data.size;
  	  return this;
  	}

  	_stackSet = stackSet;
  	return _stackSet;
  }

  var _Stack;
  var hasRequired_Stack;

  function require_Stack () {
  	if (hasRequired_Stack) return _Stack;
  	hasRequired_Stack = 1;
  	var ListCache = require_ListCache(),
  	    stackClear = require_stackClear(),
  	    stackDelete = require_stackDelete(),
  	    stackGet = require_stackGet(),
  	    stackHas = require_stackHas(),
  	    stackSet = require_stackSet();

  	/**
  	 * Creates a stack cache object to store key-value pairs.
  	 *
  	 * @private
  	 * @constructor
  	 * @param {Array} [entries] The key-value pairs to cache.
  	 */
  	function Stack(entries) {
  	  var data = this.__data__ = new ListCache(entries);
  	  this.size = data.size;
  	}

  	// Add methods to `Stack`.
  	Stack.prototype.clear = stackClear;
  	Stack.prototype['delete'] = stackDelete;
  	Stack.prototype.get = stackGet;
  	Stack.prototype.has = stackHas;
  	Stack.prototype.set = stackSet;

  	_Stack = Stack;
  	return _Stack;
  }

  var _defineProperty;
  var hasRequired_defineProperty;

  function require_defineProperty () {
  	if (hasRequired_defineProperty) return _defineProperty;
  	hasRequired_defineProperty = 1;
  	var getNative = require_getNative();

  	var defineProperty = (function() {
  	  try {
  	    var func = getNative(Object, 'defineProperty');
  	    func({}, '', {});
  	    return func;
  	  } catch (e) {}
  	}());

  	_defineProperty = defineProperty;
  	return _defineProperty;
  }

  var _baseAssignValue;
  var hasRequired_baseAssignValue;

  function require_baseAssignValue () {
  	if (hasRequired_baseAssignValue) return _baseAssignValue;
  	hasRequired_baseAssignValue = 1;
  	var defineProperty = require_defineProperty();

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
  	  if (key == '__proto__' && defineProperty) {
  	    defineProperty(object, key, {
  	      'configurable': true,
  	      'enumerable': true,
  	      'value': value,
  	      'writable': true
  	    });
  	  } else {
  	    object[key] = value;
  	  }
  	}

  	_baseAssignValue = baseAssignValue;
  	return _baseAssignValue;
  }

  var _assignMergeValue;
  var hasRequired_assignMergeValue;

  function require_assignMergeValue () {
  	if (hasRequired_assignMergeValue) return _assignMergeValue;
  	hasRequired_assignMergeValue = 1;
  	var baseAssignValue = require_baseAssignValue(),
  	    eq = requireEq();

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
  	  if ((value !== undefined && !eq(object[key], value)) ||
  	      (value === undefined && !(key in object))) {
  	    baseAssignValue(object, key, value);
  	  }
  	}

  	_assignMergeValue = assignMergeValue;
  	return _assignMergeValue;
  }

  /**
   * Creates a base function for methods like `_.forIn` and `_.forOwn`.
   *
   * @private
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {Function} Returns the new base function.
   */

  var _createBaseFor;
  var hasRequired_createBaseFor;

  function require_createBaseFor () {
  	if (hasRequired_createBaseFor) return _createBaseFor;
  	hasRequired_createBaseFor = 1;
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

  	_createBaseFor = createBaseFor;
  	return _createBaseFor;
  }

  var _baseFor;
  var hasRequired_baseFor;

  function require_baseFor () {
  	if (hasRequired_baseFor) return _baseFor;
  	hasRequired_baseFor = 1;
  	var createBaseFor = require_createBaseFor();

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
  	var baseFor = createBaseFor();

  	_baseFor = baseFor;
  	return _baseFor;
  }

  var _cloneBuffer = {exports: {}};

  _cloneBuffer.exports;

  var hasRequired_cloneBuffer;

  function require_cloneBuffer () {
  	if (hasRequired_cloneBuffer) return _cloneBuffer.exports;
  	hasRequired_cloneBuffer = 1;
  	(function (module, exports) {
  		var root = require_root();

  		/** Detect free variable `exports`. */
  		var freeExports = exports && !exports.nodeType && exports;

  		/** Detect free variable `module`. */
  		var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  		/** Detect the popular CommonJS extension `module.exports`. */
  		var moduleExports = freeModule && freeModule.exports === freeExports;

  		/** Built-in value references. */
  		var Buffer = moduleExports ? root.Buffer : undefined,
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
  	} (_cloneBuffer, _cloneBuffer.exports));
  	return _cloneBuffer.exports;
  }

  var _Uint8Array;
  var hasRequired_Uint8Array;

  function require_Uint8Array () {
  	if (hasRequired_Uint8Array) return _Uint8Array;
  	hasRequired_Uint8Array = 1;
  	var root = require_root();

  	/** Built-in value references. */
  	var Uint8Array = root.Uint8Array;

  	_Uint8Array = Uint8Array;
  	return _Uint8Array;
  }

  var _cloneArrayBuffer;
  var hasRequired_cloneArrayBuffer;

  function require_cloneArrayBuffer () {
  	if (hasRequired_cloneArrayBuffer) return _cloneArrayBuffer;
  	hasRequired_cloneArrayBuffer = 1;
  	var Uint8Array = require_Uint8Array();

  	/**
  	 * Creates a clone of `arrayBuffer`.
  	 *
  	 * @private
  	 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
  	 * @returns {ArrayBuffer} Returns the cloned array buffer.
  	 */
  	function cloneArrayBuffer(arrayBuffer) {
  	  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  	  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
  	  return result;
  	}

  	_cloneArrayBuffer = cloneArrayBuffer;
  	return _cloneArrayBuffer;
  }

  var _cloneTypedArray;
  var hasRequired_cloneTypedArray;

  function require_cloneTypedArray () {
  	if (hasRequired_cloneTypedArray) return _cloneTypedArray;
  	hasRequired_cloneTypedArray = 1;
  	var cloneArrayBuffer = require_cloneArrayBuffer();

  	/**
  	 * Creates a clone of `typedArray`.
  	 *
  	 * @private
  	 * @param {Object} typedArray The typed array to clone.
  	 * @param {boolean} [isDeep] Specify a deep clone.
  	 * @returns {Object} Returns the cloned typed array.
  	 */
  	function cloneTypedArray(typedArray, isDeep) {
  	  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  	  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
  	}

  	_cloneTypedArray = cloneTypedArray;
  	return _cloneTypedArray;
  }

  /**
   * Copies the values of `source` to `array`.
   *
   * @private
   * @param {Array} source The array to copy values from.
   * @param {Array} [array=[]] The array to copy values to.
   * @returns {Array} Returns `array`.
   */

  var _copyArray;
  var hasRequired_copyArray;

  function require_copyArray () {
  	if (hasRequired_copyArray) return _copyArray;
  	hasRequired_copyArray = 1;
  	function copyArray(source, array) {
  	  var index = -1,
  	      length = source.length;

  	  array || (array = Array(length));
  	  while (++index < length) {
  	    array[index] = source[index];
  	  }
  	  return array;
  	}

  	_copyArray = copyArray;
  	return _copyArray;
  }

  var _baseCreate;
  var hasRequired_baseCreate;

  function require_baseCreate () {
  	if (hasRequired_baseCreate) return _baseCreate;
  	hasRequired_baseCreate = 1;
  	var isObject = requireIsObject();

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
  	    if (!isObject(proto)) {
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

  	_baseCreate = baseCreate;
  	return _baseCreate;
  }

  /**
   * Creates a unary function that invokes `func` with its argument transformed.
   *
   * @private
   * @param {Function} func The function to wrap.
   * @param {Function} transform The argument transform.
   * @returns {Function} Returns the new function.
   */

  var _overArg;
  var hasRequired_overArg;

  function require_overArg () {
  	if (hasRequired_overArg) return _overArg;
  	hasRequired_overArg = 1;
  	function overArg(func, transform) {
  	  return function(arg) {
  	    return func(transform(arg));
  	  };
  	}

  	_overArg = overArg;
  	return _overArg;
  }

  var _getPrototype;
  var hasRequired_getPrototype;

  function require_getPrototype () {
  	if (hasRequired_getPrototype) return _getPrototype;
  	hasRequired_getPrototype = 1;
  	var overArg = require_overArg();

  	/** Built-in value references. */
  	var getPrototype = overArg(Object.getPrototypeOf, Object);

  	_getPrototype = getPrototype;
  	return _getPrototype;
  }

  /** Used for built-in method references. */

  var _isPrototype;
  var hasRequired_isPrototype;

  function require_isPrototype () {
  	if (hasRequired_isPrototype) return _isPrototype;
  	hasRequired_isPrototype = 1;
  	var objectProto = Object.prototype;

  	/**
  	 * Checks if `value` is likely a prototype object.
  	 *
  	 * @private
  	 * @param {*} value The value to check.
  	 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
  	 */
  	function isPrototype(value) {
  	  var Ctor = value && value.constructor,
  	      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  	  return value === proto;
  	}

  	_isPrototype = isPrototype;
  	return _isPrototype;
  }

  var _initCloneObject;
  var hasRequired_initCloneObject;

  function require_initCloneObject () {
  	if (hasRequired_initCloneObject) return _initCloneObject;
  	hasRequired_initCloneObject = 1;
  	var baseCreate = require_baseCreate(),
  	    getPrototype = require_getPrototype(),
  	    isPrototype = require_isPrototype();

  	/**
  	 * Initializes an object clone.
  	 *
  	 * @private
  	 * @param {Object} object The object to clone.
  	 * @returns {Object} Returns the initialized clone.
  	 */
  	function initCloneObject(object) {
  	  return (typeof object.constructor == 'function' && !isPrototype(object))
  	    ? baseCreate(getPrototype(object))
  	    : {};
  	}

  	_initCloneObject = initCloneObject;
  	return _initCloneObject;
  }

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

  var isObjectLike_1;
  var hasRequiredIsObjectLike;

  function requireIsObjectLike () {
  	if (hasRequiredIsObjectLike) return isObjectLike_1;
  	hasRequiredIsObjectLike = 1;
  	function isObjectLike(value) {
  	  return value != null && typeof value == 'object';
  	}

  	isObjectLike_1 = isObjectLike;
  	return isObjectLike_1;
  }

  var _baseIsArguments;
  var hasRequired_baseIsArguments;

  function require_baseIsArguments () {
  	if (hasRequired_baseIsArguments) return _baseIsArguments;
  	hasRequired_baseIsArguments = 1;
  	var baseGetTag = require_baseGetTag(),
  	    isObjectLike = requireIsObjectLike();

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
  	  return isObjectLike(value) && baseGetTag(value) == argsTag;
  	}

  	_baseIsArguments = baseIsArguments;
  	return _baseIsArguments;
  }

  var isArguments_1;
  var hasRequiredIsArguments;

  function requireIsArguments () {
  	if (hasRequiredIsArguments) return isArguments_1;
  	hasRequiredIsArguments = 1;
  	var baseIsArguments = require_baseIsArguments(),
  	    isObjectLike = requireIsObjectLike();

  	/** Used for built-in method references. */
  	var objectProto = Object.prototype;

  	/** Used to check objects for own properties. */
  	var hasOwnProperty = objectProto.hasOwnProperty;

  	/** Built-in value references. */
  	var propertyIsEnumerable = objectProto.propertyIsEnumerable;

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
  	var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
  	  return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
  	    !propertyIsEnumerable.call(value, 'callee');
  	};

  	isArguments_1 = isArguments;
  	return isArguments_1;
  }

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

  var isArray_1;
  var hasRequiredIsArray;

  function requireIsArray () {
  	if (hasRequiredIsArray) return isArray_1;
  	hasRequiredIsArray = 1;
  	var isArray = Array.isArray;

  	isArray_1 = isArray;
  	return isArray_1;
  }

  /** Used as references for various `Number` constants. */

  var isLength_1;
  var hasRequiredIsLength;

  function requireIsLength () {
  	if (hasRequiredIsLength) return isLength_1;
  	hasRequiredIsLength = 1;
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

  	isLength_1 = isLength;
  	return isLength_1;
  }

  var isArrayLike_1;
  var hasRequiredIsArrayLike;

  function requireIsArrayLike () {
  	if (hasRequiredIsArrayLike) return isArrayLike_1;
  	hasRequiredIsArrayLike = 1;
  	var isFunction = requireIsFunction(),
  	    isLength = requireIsLength();

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
  	  return value != null && isLength(value.length) && !isFunction(value);
  	}

  	isArrayLike_1 = isArrayLike;
  	return isArrayLike_1;
  }

  var isArrayLikeObject_1;
  var hasRequiredIsArrayLikeObject;

  function requireIsArrayLikeObject () {
  	if (hasRequiredIsArrayLikeObject) return isArrayLikeObject_1;
  	hasRequiredIsArrayLikeObject = 1;
  	var isArrayLike = requireIsArrayLike(),
  	    isObjectLike = requireIsObjectLike();

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
  	  return isObjectLike(value) && isArrayLike(value);
  	}

  	isArrayLikeObject_1 = isArrayLikeObject;
  	return isArrayLikeObject_1;
  }

  var isBuffer = {exports: {}};

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

  var stubFalse_1;
  var hasRequiredStubFalse;

  function requireStubFalse () {
  	if (hasRequiredStubFalse) return stubFalse_1;
  	hasRequiredStubFalse = 1;
  	function stubFalse() {
  	  return false;
  	}

  	stubFalse_1 = stubFalse;
  	return stubFalse_1;
  }

  isBuffer.exports;

  var hasRequiredIsBuffer;

  function requireIsBuffer () {
  	if (hasRequiredIsBuffer) return isBuffer.exports;
  	hasRequiredIsBuffer = 1;
  	(function (module, exports) {
  		var root = require_root(),
  		    stubFalse = requireStubFalse();

  		/** Detect free variable `exports`. */
  		var freeExports = exports && !exports.nodeType && exports;

  		/** Detect free variable `module`. */
  		var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  		/** Detect the popular CommonJS extension `module.exports`. */
  		var moduleExports = freeModule && freeModule.exports === freeExports;

  		/** Built-in value references. */
  		var Buffer = moduleExports ? root.Buffer : undefined;

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
  		var isBuffer = nativeIsBuffer || stubFalse;

  		module.exports = isBuffer; 
  	} (isBuffer, isBuffer.exports));
  	return isBuffer.exports;
  }

  var isPlainObject_1;
  var hasRequiredIsPlainObject;

  function requireIsPlainObject () {
  	if (hasRequiredIsPlainObject) return isPlainObject_1;
  	hasRequiredIsPlainObject = 1;
  	var baseGetTag = require_baseGetTag(),
  	    getPrototype = require_getPrototype(),
  	    isObjectLike = requireIsObjectLike();

  	/** `Object#toString` result references. */
  	var objectTag = '[object Object]';

  	/** Used for built-in method references. */
  	var funcProto = Function.prototype,
  	    objectProto = Object.prototype;

  	/** Used to resolve the decompiled source of functions. */
  	var funcToString = funcProto.toString;

  	/** Used to check objects for own properties. */
  	var hasOwnProperty = objectProto.hasOwnProperty;

  	/** Used to infer the `Object` constructor. */
  	var objectCtorString = funcToString.call(Object);

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
  	  if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
  	    return false;
  	  }
  	  var proto = getPrototype(value);
  	  if (proto === null) {
  	    return true;
  	  }
  	  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  	  return typeof Ctor == 'function' && Ctor instanceof Ctor &&
  	    funcToString.call(Ctor) == objectCtorString;
  	}

  	isPlainObject_1 = isPlainObject;
  	return isPlainObject_1;
  }

  var _baseIsTypedArray;
  var hasRequired_baseIsTypedArray;

  function require_baseIsTypedArray () {
  	if (hasRequired_baseIsTypedArray) return _baseIsTypedArray;
  	hasRequired_baseIsTypedArray = 1;
  	var baseGetTag = require_baseGetTag(),
  	    isLength = requireIsLength(),
  	    isObjectLike = requireIsObjectLike();

  	/** `Object#toString` result references. */
  	var argsTag = '[object Arguments]',
  	    arrayTag = '[object Array]',
  	    boolTag = '[object Boolean]',
  	    dateTag = '[object Date]',
  	    errorTag = '[object Error]',
  	    funcTag = '[object Function]',
  	    mapTag = '[object Map]',
  	    numberTag = '[object Number]',
  	    objectTag = '[object Object]',
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
  	typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
  	typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
  	typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
  	typedArrayTags[errorTag] = typedArrayTags[funcTag] =
  	typedArrayTags[mapTag] = typedArrayTags[numberTag] =
  	typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
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
  	  return isObjectLike(value) &&
  	    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
  	}

  	_baseIsTypedArray = baseIsTypedArray;
  	return _baseIsTypedArray;
  }

  /**
   * The base implementation of `_.unary` without support for storing metadata.
   *
   * @private
   * @param {Function} func The function to cap arguments for.
   * @returns {Function} Returns the new capped function.
   */

  var _baseUnary;
  var hasRequired_baseUnary;

  function require_baseUnary () {
  	if (hasRequired_baseUnary) return _baseUnary;
  	hasRequired_baseUnary = 1;
  	function baseUnary(func) {
  	  return function(value) {
  	    return func(value);
  	  };
  	}

  	_baseUnary = baseUnary;
  	return _baseUnary;
  }

  var _nodeUtil = {exports: {}};

  _nodeUtil.exports;

  var hasRequired_nodeUtil;

  function require_nodeUtil () {
  	if (hasRequired_nodeUtil) return _nodeUtil.exports;
  	hasRequired_nodeUtil = 1;
  	(function (module, exports) {
  		var freeGlobal = require_freeGlobal();

  		/** Detect free variable `exports`. */
  		var freeExports = exports && !exports.nodeType && exports;

  		/** Detect free variable `module`. */
  		var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  		/** Detect the popular CommonJS extension `module.exports`. */
  		var moduleExports = freeModule && freeModule.exports === freeExports;

  		/** Detect free variable `process` from Node.js. */
  		var freeProcess = moduleExports && freeGlobal.process;

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
  	} (_nodeUtil, _nodeUtil.exports));
  	return _nodeUtil.exports;
  }

  var isTypedArray_1;
  var hasRequiredIsTypedArray;

  function requireIsTypedArray () {
  	if (hasRequiredIsTypedArray) return isTypedArray_1;
  	hasRequiredIsTypedArray = 1;
  	var baseIsTypedArray = require_baseIsTypedArray(),
  	    baseUnary = require_baseUnary(),
  	    nodeUtil = require_nodeUtil();

  	/* Node.js helper references. */
  	var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

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
  	var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

  	isTypedArray_1 = isTypedArray;
  	return isTypedArray_1;
  }

  /**
   * Gets the value at `key`, unless `key` is "__proto__" or "constructor".
   *
   * @private
   * @param {Object} object The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */

  var _safeGet;
  var hasRequired_safeGet;

  function require_safeGet () {
  	if (hasRequired_safeGet) return _safeGet;
  	hasRequired_safeGet = 1;
  	function safeGet(object, key) {
  	  if (key === 'constructor' && typeof object[key] === 'function') {
  	    return;
  	  }

  	  if (key == '__proto__') {
  	    return;
  	  }

  	  return object[key];
  	}

  	_safeGet = safeGet;
  	return _safeGet;
  }

  var _assignValue;
  var hasRequired_assignValue;

  function require_assignValue () {
  	if (hasRequired_assignValue) return _assignValue;
  	hasRequired_assignValue = 1;
  	var baseAssignValue = require_baseAssignValue(),
  	    eq = requireEq();

  	/** Used for built-in method references. */
  	var objectProto = Object.prototype;

  	/** Used to check objects for own properties. */
  	var hasOwnProperty = objectProto.hasOwnProperty;

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
  	  if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
  	      (value === undefined && !(key in object))) {
  	    baseAssignValue(object, key, value);
  	  }
  	}

  	_assignValue = assignValue;
  	return _assignValue;
  }

  var _copyObject;
  var hasRequired_copyObject;

  function require_copyObject () {
  	if (hasRequired_copyObject) return _copyObject;
  	hasRequired_copyObject = 1;
  	var assignValue = require_assignValue(),
  	    baseAssignValue = require_baseAssignValue();

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
  	      baseAssignValue(object, key, newValue);
  	    } else {
  	      assignValue(object, key, newValue);
  	    }
  	  }
  	  return object;
  	}

  	_copyObject = copyObject;
  	return _copyObject;
  }

  /**
   * The base implementation of `_.times` without support for iteratee shorthands
   * or max array length checks.
   *
   * @private
   * @param {number} n The number of times to invoke `iteratee`.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the array of results.
   */

  var _baseTimes;
  var hasRequired_baseTimes;

  function require_baseTimes () {
  	if (hasRequired_baseTimes) return _baseTimes;
  	hasRequired_baseTimes = 1;
  	function baseTimes(n, iteratee) {
  	  var index = -1,
  	      result = Array(n);

  	  while (++index < n) {
  	    result[index] = iteratee(index);
  	  }
  	  return result;
  	}

  	_baseTimes = baseTimes;
  	return _baseTimes;
  }

  /** Used as references for various `Number` constants. */

  var _isIndex;
  var hasRequired_isIndex;

  function require_isIndex () {
  	if (hasRequired_isIndex) return _isIndex;
  	hasRequired_isIndex = 1;
  	var MAX_SAFE_INTEGER = 9007199254740991;

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
  	  length = length == null ? MAX_SAFE_INTEGER : length;

  	  return !!length &&
  	    (type == 'number' ||
  	      (type != 'symbol' && reIsUint.test(value))) &&
  	        (value > -1 && value % 1 == 0 && value < length);
  	}

  	_isIndex = isIndex;
  	return _isIndex;
  }

  var _arrayLikeKeys;
  var hasRequired_arrayLikeKeys;

  function require_arrayLikeKeys () {
  	if (hasRequired_arrayLikeKeys) return _arrayLikeKeys;
  	hasRequired_arrayLikeKeys = 1;
  	var baseTimes = require_baseTimes(),
  	    isArguments = requireIsArguments(),
  	    isArray = requireIsArray(),
  	    isBuffer = requireIsBuffer(),
  	    isIndex = require_isIndex(),
  	    isTypedArray = requireIsTypedArray();

  	/** Used for built-in method references. */
  	var objectProto = Object.prototype;

  	/** Used to check objects for own properties. */
  	var hasOwnProperty = objectProto.hasOwnProperty;

  	/**
  	 * Creates an array of the enumerable property names of the array-like `value`.
  	 *
  	 * @private
  	 * @param {*} value The value to query.
  	 * @param {boolean} inherited Specify returning inherited property names.
  	 * @returns {Array} Returns the array of property names.
  	 */
  	function arrayLikeKeys(value, inherited) {
  	  var isArr = isArray(value),
  	      isArg = !isArr && isArguments(value),
  	      isBuff = !isArr && !isArg && isBuffer(value),
  	      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
  	      skipIndexes = isArr || isArg || isBuff || isType,
  	      result = skipIndexes ? baseTimes(value.length, String) : [],
  	      length = result.length;

  	  for (var key in value) {
  	    if ((inherited || hasOwnProperty.call(value, key)) &&
  	        !(skipIndexes && (
  	           // Safari 9 has enumerable `arguments.length` in strict mode.
  	           key == 'length' ||
  	           // Node.js 0.10 has enumerable non-index properties on buffers.
  	           (isBuff && (key == 'offset' || key == 'parent')) ||
  	           // PhantomJS 2 has enumerable non-index properties on typed arrays.
  	           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
  	           // Skip index properties.
  	           isIndex(key, length)
  	        ))) {
  	      result.push(key);
  	    }
  	  }
  	  return result;
  	}

  	_arrayLikeKeys = arrayLikeKeys;
  	return _arrayLikeKeys;
  }

  /**
   * This function is like
   * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * except that it includes inherited enumerable properties.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */

  var _nativeKeysIn;
  var hasRequired_nativeKeysIn;

  function require_nativeKeysIn () {
  	if (hasRequired_nativeKeysIn) return _nativeKeysIn;
  	hasRequired_nativeKeysIn = 1;
  	function nativeKeysIn(object) {
  	  var result = [];
  	  if (object != null) {
  	    for (var key in Object(object)) {
  	      result.push(key);
  	    }
  	  }
  	  return result;
  	}

  	_nativeKeysIn = nativeKeysIn;
  	return _nativeKeysIn;
  }

  var _baseKeysIn;
  var hasRequired_baseKeysIn;

  function require_baseKeysIn () {
  	if (hasRequired_baseKeysIn) return _baseKeysIn;
  	hasRequired_baseKeysIn = 1;
  	var isObject = requireIsObject(),
  	    isPrototype = require_isPrototype(),
  	    nativeKeysIn = require_nativeKeysIn();

  	/** Used for built-in method references. */
  	var objectProto = Object.prototype;

  	/** Used to check objects for own properties. */
  	var hasOwnProperty = objectProto.hasOwnProperty;

  	/**
  	 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
  	 *
  	 * @private
  	 * @param {Object} object The object to query.
  	 * @returns {Array} Returns the array of property names.
  	 */
  	function baseKeysIn(object) {
  	  if (!isObject(object)) {
  	    return nativeKeysIn(object);
  	  }
  	  var isProto = isPrototype(object),
  	      result = [];

  	  for (var key in object) {
  	    if (!(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
  	      result.push(key);
  	    }
  	  }
  	  return result;
  	}

  	_baseKeysIn = baseKeysIn;
  	return _baseKeysIn;
  }

  var keysIn_1;
  var hasRequiredKeysIn;

  function requireKeysIn () {
  	if (hasRequiredKeysIn) return keysIn_1;
  	hasRequiredKeysIn = 1;
  	var arrayLikeKeys = require_arrayLikeKeys(),
  	    baseKeysIn = require_baseKeysIn(),
  	    isArrayLike = requireIsArrayLike();

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
  	  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
  	}

  	keysIn_1 = keysIn;
  	return keysIn_1;
  }

  var toPlainObject_1;
  var hasRequiredToPlainObject;

  function requireToPlainObject () {
  	if (hasRequiredToPlainObject) return toPlainObject_1;
  	hasRequiredToPlainObject = 1;
  	var copyObject = require_copyObject(),
  	    keysIn = requireKeysIn();

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
  	  return copyObject(value, keysIn(value));
  	}

  	toPlainObject_1 = toPlainObject;
  	return toPlainObject_1;
  }

  var _baseMergeDeep;
  var hasRequired_baseMergeDeep;

  function require_baseMergeDeep () {
  	if (hasRequired_baseMergeDeep) return _baseMergeDeep;
  	hasRequired_baseMergeDeep = 1;
  	var assignMergeValue = require_assignMergeValue(),
  	    cloneBuffer = require_cloneBuffer(),
  	    cloneTypedArray = require_cloneTypedArray(),
  	    copyArray = require_copyArray(),
  	    initCloneObject = require_initCloneObject(),
  	    isArguments = requireIsArguments(),
  	    isArray = requireIsArray(),
  	    isArrayLikeObject = requireIsArrayLikeObject(),
  	    isBuffer = requireIsBuffer(),
  	    isFunction = requireIsFunction(),
  	    isObject = requireIsObject(),
  	    isPlainObject = requireIsPlainObject(),
  	    isTypedArray = requireIsTypedArray(),
  	    safeGet = require_safeGet(),
  	    toPlainObject = requireToPlainObject();

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
  	  var objValue = safeGet(object, key),
  	      srcValue = safeGet(source, key),
  	      stacked = stack.get(srcValue);

  	  if (stacked) {
  	    assignMergeValue(object, key, stacked);
  	    return;
  	  }
  	  var newValue = customizer
  	    ? customizer(objValue, srcValue, (key + ''), object, source, stack)
  	    : undefined;

  	  var isCommon = newValue === undefined;

  	  if (isCommon) {
  	    var isArr = isArray(srcValue),
  	        isBuff = !isArr && isBuffer(srcValue),
  	        isTyped = !isArr && !isBuff && isTypedArray(srcValue);

  	    newValue = srcValue;
  	    if (isArr || isBuff || isTyped) {
  	      if (isArray(objValue)) {
  	        newValue = objValue;
  	      }
  	      else if (isArrayLikeObject(objValue)) {
  	        newValue = copyArray(objValue);
  	      }
  	      else if (isBuff) {
  	        isCommon = false;
  	        newValue = cloneBuffer(srcValue, true);
  	      }
  	      else if (isTyped) {
  	        isCommon = false;
  	        newValue = cloneTypedArray(srcValue, true);
  	      }
  	      else {
  	        newValue = [];
  	      }
  	    }
  	    else if (isPlainObject(srcValue) || isArguments(srcValue)) {
  	      newValue = objValue;
  	      if (isArguments(objValue)) {
  	        newValue = toPlainObject(objValue);
  	      }
  	      else if (!isObject(objValue) || isFunction(objValue)) {
  	        newValue = initCloneObject(srcValue);
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
  	  assignMergeValue(object, key, newValue);
  	}

  	_baseMergeDeep = baseMergeDeep;
  	return _baseMergeDeep;
  }

  var _baseMerge;
  var hasRequired_baseMerge;

  function require_baseMerge () {
  	if (hasRequired_baseMerge) return _baseMerge;
  	hasRequired_baseMerge = 1;
  	var Stack = require_Stack(),
  	    assignMergeValue = require_assignMergeValue(),
  	    baseFor = require_baseFor(),
  	    baseMergeDeep = require_baseMergeDeep(),
  	    isObject = requireIsObject(),
  	    keysIn = requireKeysIn(),
  	    safeGet = require_safeGet();

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
  	  baseFor(source, function(srcValue, key) {
  	    stack || (stack = new Stack);
  	    if (isObject(srcValue)) {
  	      baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
  	    }
  	    else {
  	      var newValue = customizer
  	        ? customizer(safeGet(object, key), srcValue, (key + ''), object, source, stack)
  	        : undefined;

  	      if (newValue === undefined) {
  	        newValue = srcValue;
  	      }
  	      assignMergeValue(object, key, newValue);
  	    }
  	  }, keysIn);
  	}

  	_baseMerge = baseMerge;
  	return _baseMerge;
  }

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

  var identity_1;
  var hasRequiredIdentity;

  function requireIdentity () {
  	if (hasRequiredIdentity) return identity_1;
  	hasRequiredIdentity = 1;
  	function identity(value) {
  	  return value;
  	}

  	identity_1 = identity;
  	return identity_1;
  }

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

  var _apply;
  var hasRequired_apply;

  function require_apply () {
  	if (hasRequired_apply) return _apply;
  	hasRequired_apply = 1;
  	function apply(func, thisArg, args) {
  	  switch (args.length) {
  	    case 0: return func.call(thisArg);
  	    case 1: return func.call(thisArg, args[0]);
  	    case 2: return func.call(thisArg, args[0], args[1]);
  	    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  	  }
  	  return func.apply(thisArg, args);
  	}

  	_apply = apply;
  	return _apply;
  }

  var _overRest;
  var hasRequired_overRest;

  function require_overRest () {
  	if (hasRequired_overRest) return _overRest;
  	hasRequired_overRest = 1;
  	var apply = require_apply();

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
  	    return apply(func, this, otherArgs);
  	  };
  	}

  	_overRest = overRest;
  	return _overRest;
  }

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

  var constant_1;
  var hasRequiredConstant;

  function requireConstant () {
  	if (hasRequiredConstant) return constant_1;
  	hasRequiredConstant = 1;
  	function constant(value) {
  	  return function() {
  	    return value;
  	  };
  	}

  	constant_1 = constant;
  	return constant_1;
  }

  var _baseSetToString;
  var hasRequired_baseSetToString;

  function require_baseSetToString () {
  	if (hasRequired_baseSetToString) return _baseSetToString;
  	hasRequired_baseSetToString = 1;
  	var constant = requireConstant(),
  	    defineProperty = require_defineProperty(),
  	    identity = requireIdentity();

  	/**
  	 * The base implementation of `setToString` without support for hot loop shorting.
  	 *
  	 * @private
  	 * @param {Function} func The function to modify.
  	 * @param {Function} string The `toString` result.
  	 * @returns {Function} Returns `func`.
  	 */
  	var baseSetToString = !defineProperty ? identity : function(func, string) {
  	  return defineProperty(func, 'toString', {
  	    'configurable': true,
  	    'enumerable': false,
  	    'value': constant(string),
  	    'writable': true
  	  });
  	};

  	_baseSetToString = baseSetToString;
  	return _baseSetToString;
  }

  /** Used to detect hot functions by number of calls within a span of milliseconds. */

  var _shortOut;
  var hasRequired_shortOut;

  function require_shortOut () {
  	if (hasRequired_shortOut) return _shortOut;
  	hasRequired_shortOut = 1;
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

  	_shortOut = shortOut;
  	return _shortOut;
  }

  var _setToString;
  var hasRequired_setToString;

  function require_setToString () {
  	if (hasRequired_setToString) return _setToString;
  	hasRequired_setToString = 1;
  	var baseSetToString = require_baseSetToString(),
  	    shortOut = require_shortOut();

  	/**
  	 * Sets the `toString` method of `func` to return `string`.
  	 *
  	 * @private
  	 * @param {Function} func The function to modify.
  	 * @param {Function} string The `toString` result.
  	 * @returns {Function} Returns `func`.
  	 */
  	var setToString = shortOut(baseSetToString);

  	_setToString = setToString;
  	return _setToString;
  }

  var _baseRest;
  var hasRequired_baseRest;

  function require_baseRest () {
  	if (hasRequired_baseRest) return _baseRest;
  	hasRequired_baseRest = 1;
  	var identity = requireIdentity(),
  	    overRest = require_overRest(),
  	    setToString = require_setToString();

  	/**
  	 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
  	 *
  	 * @private
  	 * @param {Function} func The function to apply a rest parameter to.
  	 * @param {number} [start=func.length-1] The start position of the rest parameter.
  	 * @returns {Function} Returns the new function.
  	 */
  	function baseRest(func, start) {
  	  return setToString(overRest(func, start, identity), func + '');
  	}

  	_baseRest = baseRest;
  	return _baseRest;
  }

  var _isIterateeCall;
  var hasRequired_isIterateeCall;

  function require_isIterateeCall () {
  	if (hasRequired_isIterateeCall) return _isIterateeCall;
  	hasRequired_isIterateeCall = 1;
  	var eq = requireEq(),
  	    isArrayLike = requireIsArrayLike(),
  	    isIndex = require_isIndex(),
  	    isObject = requireIsObject();

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
  	  if (!isObject(object)) {
  	    return false;
  	  }
  	  var type = typeof index;
  	  if (type == 'number'
  	        ? (isArrayLike(object) && isIndex(index, object.length))
  	        : (type == 'string' && index in object)
  	      ) {
  	    return eq(object[index], value);
  	  }
  	  return false;
  	}

  	_isIterateeCall = isIterateeCall;
  	return _isIterateeCall;
  }

  var _createAssigner;
  var hasRequired_createAssigner;

  function require_createAssigner () {
  	if (hasRequired_createAssigner) return _createAssigner;
  	hasRequired_createAssigner = 1;
  	var baseRest = require_baseRest(),
  	    isIterateeCall = require_isIterateeCall();

  	/**
  	 * Creates a function like `_.assign`.
  	 *
  	 * @private
  	 * @param {Function} assigner The function to assign values.
  	 * @returns {Function} Returns the new assigner function.
  	 */
  	function createAssigner(assigner) {
  	  return baseRest(function(object, sources) {
  	    var index = -1,
  	        length = sources.length,
  	        customizer = length > 1 ? sources[length - 1] : undefined,
  	        guard = length > 2 ? sources[2] : undefined;

  	    customizer = (assigner.length > 3 && typeof customizer == 'function')
  	      ? (length--, customizer)
  	      : undefined;

  	    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
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

  	_createAssigner = createAssigner;
  	return _createAssigner;
  }

  var mergeWith_1;
  var hasRequiredMergeWith;

  function requireMergeWith () {
  	if (hasRequiredMergeWith) return mergeWith_1;
  	hasRequiredMergeWith = 1;
  	var baseMerge = require_baseMerge(),
  	    createAssigner = require_createAssigner();

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
  	var mergeWith = createAssigner(function(object, source, srcIndex, customizer) {
  	  baseMerge(object, source, srcIndex, customizer);
  	});

  	mergeWith_1 = mergeWith;
  	return mergeWith_1;
  }

  var mergeWithExports = requireMergeWith();
  var mergeWith = /*@__PURE__*/getDefaultExportFromCjs(mergeWithExports);

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

  var name$3;
  for (name$3 in sectionPrototype) {
    Cases.prototype[name$3] = sectionPrototype[name$3];
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
      ? info.phpDoc.summary || info.desc || null
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
      title = this.valDumper.dumpPhpDocStr(title);
      $element.find('.t_identifier').attr('title', title);
    }
    return $element[0].innerHTML
  };

  function Constants (valDumper) {
    this.valDumper = valDumper;
    sectionPrototype.valDumper = valDumper;
  }

  var name$2;
  for (name$2 in sectionPrototype) {
    Constants.prototype[name$2] = sectionPrototype[name$2];
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

  var name$1;
  for (name$1 in sectionPrototype) {
    Methods.prototype[name$1] = sectionPrototype[name$1];
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
      if (tagName === 'package') {
        tagEntries.tagName = tagName;
        html += this.dumpTag(tagEntries);
        continue
      }
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
      return (/^\d+$/).test(x)
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

  var name;
  for (name in sectionPrototype) {
    Properties.prototype[name] = sectionPrototype[name];
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
      isEager: info.isEager,
      isFinal: info.isFinal,
      isPromoted: info.isPromoted,
      isReadOnly: info.isReadOnly,
      isStatic: info.isStatic,
      isVirtual: info.isVirtual,
      isWriteOnly: info.isVirtual && info.hooks.indexOf('get') > -1,
      'private-ancestor': info.isPrivateAncestor,
      property: true,
      setHook: info.hooks.indexOf('set') > -1
    };
    var visibility = typeof info.visibility === 'object'
      ? info.visibility.join(' ')
      : info.visibility;
    $element.addClass(visibility).removeClass('debug');
    $$1.each(classes, function (className, useClass) {
      if (useClass) {
        $element.addClass(className);
      }
    });
    sectionPrototype.addAttribs($element, info, cfg);
  };

  Properties.prototype.dumpInner = function (name, info, cfg) {
    var title = info.phpDoc?.summary || info.desc || null;
    name = name.replace('debug.', '');
    return this.dumpModifiers(info) +
      (info.type
        ? this.valDumper.objectDumper.markupType(info.type)
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
    var modifiers = {};
    info = $$1.extend({
      isEager: null
    }, info);
    modifiers = $$1.extend(
      {
        eager: info.isEager,
        final: info.isFinal,
      },
      Object.fromEntries(vis.map(function (key) {
        // array_fill_keys
        return [key, true]
      })),
      {
        readOnly: info.isReadOnly,
        static: info.isStatic,
      }
    );
    $$1.each(modifiers, function (modifier, incl) {
      var cssClass = 't_modifier_' + modifier;
      if (!incl) {
        return
      }
      modifier = modifier.replace('-set', '(set)');
      html += '<span class="' + cssClass + '">' + modifier + '</span> ';
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
    var phpDocOut = abs.cfgFlags & this.PHPDOC_OUTPUT;
    var isEnum = abs.implementsList.indexOf('UnitEnum') > -1;
    var title = isEnum && typeof abs.properties.value !== 'undefined'
      ? 'value: ' + abs.properties.value.value
      : '';
    if (phpDocOut) {
      phpDoc = ((phpDoc.summary || '') + '\n\n' + (phpDoc.desc || '')).trim();
      title = title + "\n\n" + this.dumper.dumpPhpDocStr(phpDoc);
    }
    return this.dumper.dump({
      attribs: {
        title: title.trim(),
      },
      debug: this.dumper.ABSTRACTION,
      type: 'identifier',
      typeMore: isEnum ? 'const' : 'classname',
      value: isEnum
        ? abs.className + '::' + abs.properties.name.value
        : abs.className,
    })
  };

  DumpObject.prototype.dumpExtends = function (abs) {
    var self = this;
    return abs.extends && abs.extends.length
      ? '<dt>extends</dt>' +
          abs.extends.map(function (className) {
            return '<dd class="extends t_identifier">' + self.dumper.markupIdentifier(className, 'classname') + '</dd>'
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
      lazy: abs.isLazy,
      readonly: abs.isReadOnly,
      trait: abs.isTrait,
    };
    var haveModifier = false;
    var html = '<dt class="modifiers">modifiers</dt>';
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
          class: 'interface t_identifier',
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
      abs = JSON.parse(JSON.stringify(mergeWith({}, inherited, abs, function (objValue, srcValue) {
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

  var base64Arraybuffer = {};

  /*
   * base64-arraybuffer
   * https://github.com/niklasvh/base64-arraybuffer
   *
   * Copyright (c) 2012 Niklas von Hertzen
   * Licensed under the MIT license.
   */

  var hasRequiredBase64Arraybuffer;

  function requireBase64Arraybuffer () {
  	if (hasRequiredBase64Arraybuffer) return base64Arraybuffer;
  	hasRequiredBase64Arraybuffer = 1;
  	(function(){

  	  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  	  // Use a lookup table to find the index.
  	  var lookup = new Uint8Array(256);
  	  for (var i = 0; i < chars.length; i++) {
  	    lookup[chars.charCodeAt(i)] = i;
  	  }

  	  base64Arraybuffer.encode = function(arraybuffer) {
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

  	  base64Arraybuffer.decode =  function(base64) {
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
  	return base64Arraybuffer;
  }

  var base64ArraybufferExports = requireBase64Arraybuffer();
  var base64 = /*@__PURE__*/getDefaultExportFromCjs(base64ArraybufferExports);

  function chunkSplit(str, length, separator) {
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
          + chunkSplit(abs.value, 3 * 32, '<br />').slice(0, -6)
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
    var self = this;
    return function (str) {
      var parsed = self.dumpString.dumper.parseTag(str);
      var lis = [];
      if (parsed.tag === 'td') {
        str = parsed.innerhtml;
      }
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
        vals.labelRaw = 'base64';
        if (abs.strlen) {
          vals.valRaw += '<span class="maxlen">&hellip; ' + (abs.strlen - abs.value.length) + ' more bytes (not logged)</span>';
        }
        break
      case 'form':
        vals.labelRaw = 'form';
        break
      case 'json':
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
      ? new Uint8Array(base64.decode(val.substr(6)))
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
    return ['base64', 'form', 'json', 'serialized'].indexOf(val.typeMore) > -1
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
    }, JSON.parse(JSON.stringify(opts || {})));
    var tagName;
    var type; // = this.getType(val)
    var method; // = 'dump' + type[0].ucfirst()
    if (dumpOpts.type === null) {
      type = this.getType(val);
      dumpOpts.type = type[0];
      dumpOpts.typeMore = type[1];
    }
    if (typeof dumpOpts.attribs.class === 'undefined') {
      dumpOpts.attribs.class = [];
    } else if (typeof dumpOpts.attribs.class === 'string') {
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
    var keys = typeof array === 'object'
      ? array.__debug_key_order__ || Object.keys(array)
      : []; // isMaxDepth or similar
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
      '<span class="t_identifier" data-type-more="callable">' +
      this.markupIdentifier(abs, 'function') +
      '</span>'
  };

  Dump.prototype.dumpConst = function (abs) {
    return this.dumpIdentifier({
      backedValue: abs.value,
      type: 'identifier',
      typeMore: 'const',
      value: abs.name,
    })
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

  Dump.prototype.dumpIdentifier = function (abs) {
    var dumpOpts = this.getDumpOpts();
    if (dumpOpts.attribs.title === undefined && [undefined, this.UNDEFINED].indexOf(abs.backedValue) >= 0) {
      dumpOpts.attribs.title = 'value: ' + this.dump(abs.backedValue);
    }
    return this.markupIdentifier(abs.value, abs.typeMore)
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
    } else if (['const', 'function', 'method'].indexOf(what) > -1) {
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
      parts.identifier = '<span class="t_name">' + parts.identifier + '</span>';
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
  var subRegex = new RegExp('%' +
    '(?:' +
    '[coO]|' + // c: css, o: obj with max info, O: obj w generic info
    '[+-]?' + // sign specifier
    '(?:[ 0]|\'.)?' + // padding specifier
    '-?' + // alignment specifier
    '\\d*' + // width specifier
    '(?:\\.\\d+)?' + // precision specifier
    '[difs]' +
    ')', 'g');
  var table = new Table(dump);

  var methods = {
    alert: function (logEntry, info) {
      var $node = $$1('<div class="m_alert"></div>')
        .addClass('alert-' + (logEntry.meta.level || logEntry.meta.class))
        // .html(message)
        .attr('data-channel', logEntry.meta.channel); // using attr so can use [data-channel="xxx"] selector
      var dismissible = logEntry.meta.dismissible;
      var html = logEntry.args.length > 1
        ? buildEntryNode(logEntry, info).html()
        : dump.dump(logEntry.args[0], {
          sanitize: logEntry.meta.sanitizeFirst,
          tagName: null, // don't wrap value span
          visualWhiteSpace: false,
        });
      $node.html(html);
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
        $container.find('.card-title .response-code').remove(); 
        $container.find('.card-title').append(' <span class="label label-default response-code" title="Response Code">' + responseCode + '</span>');
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
        $cardHeaderBody.prepend('<span class="float-end">' + date + '</span>');
      }
    },

    profileEnd: function (logEntry, info) {
      // var $node = this.table(logEntry, info)
      // return $node.removeClass('m_log').addClass('m_profileEnd')
      return this.table(logEntry, info)
    },

    table: function (logEntry, info) {
      var onBuildRow = [];
      if (logEntry.method === 'trace') {
        onBuildRow.push(tableTraceRow);
      }
      if (logEntry.meta.inclContext) {
        onBuildRow.push(tableAddContextRow);
      }
      return $$1('<li>', { class: 'm_' + logEntry.method })
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
      /*
      if (['assert', 'error', 'info', 'log', 'warn'].indexOf(method) > -1 && logEntry.args.length > 1)) {
      }
      */
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
      $node = buildEntryNode(logEntry, info);
      $node.attr(attribs);
      if (meta.trace && meta.trace.length > 1) {
        $node.append(
          $$1('<ul>', { class: 'list-unstyled no-indent' }).append(
            methods.trace({
              method: 'trace',
              args: [meta.trace],
              meta: meta,
            }, info).attr('data-detect-files', 'true')
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

  function buildContext (context, lineNumber) {
    var keys = Object.keys(context || {}); // .map(function(val){return parseInt(val)}),
    var start = Math.min.apply(null, keys);
    return $$1('<pre>', {
      class: 'highlight line-numbers',
      'data-line': lineNumber,
      'data-start': start,
      'data-line-offset': start,
    }).append(
      $$1('<code>', {
        class: 'language-php'
      }).text(Object.values(context).join(''))
    )
  }

  function buildEntryNode (logEntry, requestInfo) {
    var i;
    var glue = ', ';
    var glueAfterFirst = true;
    var args = logEntry.args;
    var numArgs = args.length;
    var typeInfo;
    var typeMore;
    logEntry.meta = $$1.extend({
      sanitize: true,
      sanitizeFirst: null
    }, logEntry.meta);
    if (logEntry.meta.sanitizeFirst === null) {
      logEntry.meta.sanitizeFirst = logEntry.meta.sanitize;
    }
    // console.warn('buildEntryNode', JSON.parse(JSON.stringify(logEntry)))
    if (numArgs > 1) {
      processSubstitutions(logEntry);
      args = logEntry.args;
      numArgs = args.length;
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
          ? logEntry.meta.sanitizeFirst
          : logEntry.meta.sanitize,
        type: typeInfo[0],
        typeMore: typeInfo[1] || null,
        visualWhiteSpace: i !== 0
      });
    }
    return glueAfterFirst
      ? $$1('<li>').html(args.join(glue))
      : $$1('<li>').html(args[0] + ' ' + args.slice(1).join(glue))
  }

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

  function containsSubstitutions(logEntry)
  {
    if (logEntry.args.length < 2 || typeof logEntry.args[0] !== 'string') {
      return false
    }
    return logEntry.args[0].match(subRegex) !== null
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
      : dump.dump(label, {
        requestInfo: requestInfo
      }).replace(new RegExp('^<span class="t_string">(.+)</span>$', 's'), '$1');
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

  function markupFilePath(filePath, commonPrefix, docRoot) {
    var fileParts = parseFilePath(filePath || '', commonPrefix, docRoot);
    return (fileParts.docRoot ? '<span class="file-docroot">DOCUMENT_ROOT</span>' : '')
      + (fileParts.relPathCommon ? '<span class="file-basepath">' + dump.dump(fileParts.relPathCommon, {tagName:null}) + '</span>' : '')
      + (fileParts.relPath ? '<span class="file-relpath">' + dump.dump(fileParts.relPath, {tagName:null}) + '</span>' : '')
      + '<span class="file-basename">' + dump.dump(fileParts.baseName, {tagName:null}) + '</span>'
  }

  function parseFilePath (filePath, commonPrefix, docRoot) {
    var baseName = (filePath.match(/[^\/]+$/) || [''])[0];
    var containsDocRoot = filePath.indexOf(docRoot) === 0;
    var basePath = '';
    var relPath = filePath.slice(0, 0 - baseName.length);
    var maxLen = Math.max.apply(null, [
      commonPrefix ? commonPrefix.length : 0,
      containsDocRoot ? docRoot.length : 0,
    ]);
    if (maxLen) {
      basePath = relPath.substring(0, maxLen);
      relPath = relPath.substring(maxLen);
      if (containsDocRoot) {
        basePath = basePath.substring(docRoot.length);
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
    var args = logEntry.args;
    var argLen = args.length;
    var index = 0;
    var typeCounts = {
      c: 0
    };
    if (containsSubstitutions(logEntry) === false) {
      return
    }
    args[0] = dump.dump(args[0], {
      sanitize: logEntry.meta.sanitizeFirst,
      tagName: null
    });
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
    if (typeCounts.c) {
      args[0] += '</span>';
    }
    logEntry.args = args.filter(function (val) {
      return val !== undefined
    });
    logEntry.meta.sanitizeFirst = false;
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

  function tableTraceRow ($tr, row, rowInfo, i) {
    // var tr = $tr[0].outerHTML
    var docRoot = rowInfo.requestInfo.$container.data('meta').DOCUMENT_ROOT || '';
    var filePath = markupFilePath(row.file, rowInfo.commonFilePrefix, docRoot);
    var method = row.function ? dump.markupIdentifier(row.function, 'method') : '';

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

    $tr.find('td.t_string').eq(0).html(filePath).addClass('no-quotes');
    if (filePath.indexOf('DOCUMENT_ROOT') >= 0) {
      $tr.attr('data-file', row.file);
    }
    $tr.find('td.t_string').eq(1).html(method).addClass('no-quotes t_identifier');

    return $tr
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
            '<i class="fa fa-times float-end btn-remove-session"></i>' +
            '<div class="card-header-body">' +
              '<h3 class="card-title">Building Request&hellip;</h3>' +
              '<i class="fa fa-spinner fa-pulse fa-lg"></i>' +
            '</div>' +
          '</div>' +
          '<div class="card-body collapse debug debug-enhanced-ui" data-theme="' + 'dark' + '">' +
            '<header class="debug-bar debug-menu-bar">' +
              '<nav role="tablist">' +
                '<a class="active nav-link" data-target=".' + nameToClassname$1(channelNameRoot) + '" data-toggle="tab" role="tab"><i class="fa fa-list-ul"></i>Log</a>' +
              '</nav>' +
            '</header>' +
            '<div class="tab-panes">' +
              '<div class="active ' + nameToClassname$1(channelNameRoot) + ' tab-pane tab-primary" role="tabpanel">' +
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
    var $debug = $container.find('.debug');
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

    $ul = $debug.debugEnhance('buildChannelList', channelsTab, info.channelNameRoot, channelsChecked);
    $channels.find('> ul').replaceWith($ul);
    $channels.show();
    $debug.trigger('channelAdded.debug');
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
    var classname = nameToClassname$1(info.channelNameTop);
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

  function nameToClassname$1 (name) {
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

  function nameToClassname (name) {
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
    this.themeUpdate();
    window.matchMedia('(prefers-color-scheme: dark)').onchange = function (e) {
      this.themeUpdate();
    };
  }

  Config.prototype.get = function (key) {
    if (typeof key === 'undefined') {
      return JSON.parse(JSON.stringify(this.config))
    }
    return typeof this.config[key] !== 'undefined'
      ? this.config[key]
      : null
  };

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
    this.themeUpdate();
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
    var haveDbVal = false;
    if (vals === undefined) {
      vals = this.config;
    }
    for (i = 0, count = phpDebugConsoleKeys.length; i < count; i++) {
      key = phpDebugConsoleKeys[i];
      // console.log('key', key)
      if (typeof vals[key] !== 'undefined') {
        vals[key];
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

  Config.prototype.themeGet = function () {
    var theme = this.config.theme;
    if (theme === 'auto') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme
  };

  Config.prototype.themeUpdate = function () {
    var theme = this.themeGet();
    $('html').attr('data-bs-theme', theme);
    $('.debug').attr('data-theme', theme);
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

  function commonjsRequire(path) {
  	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
  }

  var autobahn_min = {exports: {}};

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
   ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource>  safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource>  MIT License (c) copyright 2010-2014 original author or authors */

  var hasRequiredAutobahn_min;

  function requireAutobahn_min () {
  	if (hasRequiredAutobahn_min) return autobahn_min.exports;
  	hasRequiredAutobahn_min = 1;
  	(function (module, exports) {
  		(function(z){module.exports=z();})(function(){return function(){function z(O,A,f){function e(b,d){if(!A[b]){if(!O[b]){var v="function"==typeof commonjsRequire&&commonjsRequire;if(!d&&v)return v(b,true);if(g)return g(b,true);d=Error("Cannot find module '"+b+"'");throw d.code="MODULE_NOT_FOUND",
  		d;}d=A[b]={exports:{}};O[b][0].call(d.exports,function(m){return e(O[b][1][m]||m)},d,d.exports,z,O,A,f);}return A[b].exports}for(var g="function"==typeof commonjsRequire&&commonjsRequire,a=0;a<f.length;a++)e(f[a]);return e}return z}()({1:[function(z,O,A){var f=z("crypto-js");A.sign=function(e,g){return f.HmacSHA256(g,e).toString(f.enc.Base64)};A.derive_key=function(e,g,a,b){return f.PBKDF2(e,g,{keySize:(b||32)/4,iterations:a||1E3,hasher:f.algo.SHA256}).toString(f.enc.Base64)};},{"crypto-js":68}],2:[function(z,O,A){function f(v,
  		m){m=a.htob(m.challenge);v=g.sign.detached(m,v.secretKey);return a.btoh(v)+a.btoh(m)}function e(v){return a.btoh(v.publicKey)}var g=z("tweetnacl"),a=z("../util.js"),b=z("../log.js"),d=z("../connection.js");A.load_private_key=function(v,m){var r=a.atob(localStorage.getItem(v));!r||m?(r=g.randomBytes(g.sign.seedLength),localStorage.setItem(v,a.btoa(r)),b.debug('new key seed "'+v+'" saved to local storage!')):b.debug('key seed "'+v+'" loaded from local storage!');return g.sign.keyPair.fromSeed(r)};A.delete_private_key=
  		function(v){for(var m=0;5>m;++m)seed=g.randomBytes(g.sign.seedLength),localStorage.setItem(v,a.btoa(seed)),localStorage.setItem(v,""),localStorage.setItem(v,null);};A.sign_challenge=f;A.public_key=e;A.create_connection=function(v){var m=v.url,r=v.realm,h=v.authid,l=v.pkey,k=v.activation_code,n=v.request_new_activation_code,w=v.serializers;v.debug&&(console.log(m),console.log(r),console.log(h),console.log(l),console.log(k),console.log(n),console.log(w));authextra={pubkey:e(l),trustroot:null,challenge:null,
  		channel_binding:null,activation_code:k,request_new_activation_code:n};return new d.Connection({url:m,realm:r,authid:h,authmethods:["cryptosign"],onchallenge:function(t,u,y){if("cryptosign"==u)return f(l,y);throw "don't know how to authenticate using '"+u+"'";},authextra,serializers:v.serializers})};},{"../connection.js":6,"../log.js":7,"../util.js":20,tweetnacl:151}],3:[function(z,O,A){A.auth=function(f,e,g){var a=f.defer();navigator.id.watch({loggedInUser:e,onlogin:function(b){a.resolve(b);},onlogout:function(){f.leave("wamp.close.logout");}});
  		return a.promise.then?a.promise:a};},{}],4:[function(z,O,A){var f="undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{};z("./polyfill.js");O=z("../package.json");let e,g;try{e=z("when"),g=!0;}catch(w){g=false;}var a=z("msgpack5"),b=z("cbor"),d=z("tweetnacl");"AUTOBAHN_DEBUG"in f&&AUTOBAHN_DEBUG&&(z("when/monitor/console"),"console"in f&&console.log("AutobahnJS debug enabled"));f=z("./util.js");var v=z("./log.js"),m=z("./session.js"),r=z("./connection.js"),
  		h=z("./configure.js"),l=z("./serializer.js"),k=z("./auth/persona.js"),n=z("./auth/cra.js");z=z("./auth/cryptosign.js");A.version=O.version;A.transports=h.transports;A.Connection=r.Connection;A.Session=m.Session;A.Invocation=m.Invocation;A.Event=m.Event;A.Result=m.Result;A.Error=m.Error;A.Subscription=m.Subscription;A.Registration=m.Registration;A.Publication=m.Publication;A.serializer=l;A.auth_persona=k.auth;A.auth_cra=n;A.auth_cryptosign=z;g&&(A.when=e);A.msgpack=a;A.cbor=b;A.nacl=d;A.util=f;A.log=
  		v;},{"../package.json":180,"./auth/cra.js":1,"./auth/cryptosign.js":2,"./auth/persona.js":3,"./configure.js":5,"./connection.js":6,"./log.js":7,"./polyfill.js":8,"./serializer.js":16,"./session.js":17,"./util.js":20,cbor:48,msgpack5:110,tweetnacl:151,when:178,"when/monitor/console":176}],5:[function(z,O,A){function f(){this._repository={};}f.prototype.register=function(g,a){this._repository[g]=a;};f.prototype.isRegistered=function(g){return this._repository[g]?true:false};f.prototype.get=function(g){if(void 0!==
  		this._repository[g])return this._repository[g];throw "no such transport: "+g;};f.prototype.list=function(){var g=[],a;for(a in this._repository)g.push(a);return g};O=new f;var e=z("./transport/websocket.js");O.register("websocket",e.Factory);e=z("./transport/longpoll.js");O.register("longpoll",e.Factory);z=z("./transport/rawsocket.js");O.register("rawsocket",z.Factory);A.transports=O;},{"./transport/longpoll.js":18,"./transport/rawsocket.js":44,"./transport/websocket.js":19}],6:[function(z,O,A){var f=
  		z("./session.js"),e=z("./util.js"),g=z("./log.js"),a=z("./autobahn.js");z=function(b){this._options=b;this._defer=e.deferred_factory(b);this._options.transports||(this._options.transports=[{type:"websocket",url:this._options.url,tlsConfiguration:this._options.tlsConfiguration}]);this._transport_factories=[];this._init_transport_factories();this._session_close_message=this._session_close_reason=this._session=null;this._retry_if_unreachable=void 0!==this._options.retry_if_unreachable?this._options.retry_if_unreachable:
  		true;this._max_retries="undefined"!==typeof this._options.max_retries?this._options.max_retries:15;this._initial_retry_delay="undefined"!==typeof this._options.initial_retry_delay?this._options.initial_retry_delay:1.5;this._max_retry_delay=this._options.max_retry_delay||300;this._retry_delay_growth=this._options.retry_delay_growth||1.5;this._retry_delay_jitter=this._options.retry_delay_jitter||.1;this._connect_successes=0;this._retry=false;this._retry_count=0;this._retry_delay=this._initial_retry_delay;
  		this._is_retrying=false;this._retry_timer=null;};z.prototype._create_transport=function(){for(var b=0;b<this._transport_factories.length;++b){var d=this._transport_factories[b];g.debug("trying to create WAMP transport of type: "+d.type);try{var v=d.create();if(v)return g.debug("using WAMP transport type: "+d.type),v}catch(m){e.handle_error(this._options.on_internal_error,m,"could not create WAMP transport '"+d.type+"': ");}}g.warn("could not create any WAMP transport");return null};z.prototype._init_transport_factories=
  		function(){var b;e.assert(this._options.transports,"No transport.factory specified");for(var d=0;d<this._options.transports.length;++d){var v=this._options.transports[d];v.url||(v.url=this._options.url);v.serializers||(v.serializers=this._options.serializers);v.protocols||(v.protocols=this._options.protocols);e.assert(v.type,"No transport.type specified");e.assert("string"===typeof v.type,"transport.type must be a string");try{if(b=a.transports.get(v.type)){var m=new b(v);this._transport_factories.push(m);}}catch(r){e.handle_error(this._options.on_internal_error,
  		r);}}};z.prototype._autoreconnect_reset_timer=function(){this._retry_timer&&clearTimeout(this._retry_timer);this._retry_timer=null;};z.prototype._autoreconnect_reset=function(){this._autoreconnect_reset_timer();this._retry_count=0;this._retry_delay=this._initial_retry_delay;this._is_retrying=false;};z.prototype._autoreconnect_advance=function(){this._retry_delay_jitter&&(this._retry_delay=e.rand_normal(this._retry_delay,this._retry_delay*this._retry_delay_jitter));this._retry_delay>this._max_retry_delay&&
  		(this._retry_delay=this._max_retry_delay);this._retry_count+=1;var b=this._retry&&(-1===this._max_retries||this._retry_count<=this._max_retries)?{count:this._retry_count,delay:this._retry_delay,will_retry:true}:{count:null,delay:null,will_retry:false};this._retry_delay_growth&&(this._retry_delay*=this._retry_delay_growth);return b};z.prototype.open=function(){function b(){try{d._transport=d._create_transport();}catch(v){e.handle_error(d._options.on_internal_error,v);}if(d._transport)d._session=new f.Session(d._transport,
  		d._defer,d._options.onchallenge,d._options.on_user_error,d._options.on_internal_error),d._session_close_reason=null,d._session_close_message=null,d._transport.onopen=function(){d._autoreconnect_reset();d._connect_successes+=1;d._session.join(d._options.realm,d._options.authmethods,d._options.authid,d._options.authextra);},d._session.onjoin=function(v){if(d.onopen)try{v.transport=d._transport.info,d.onopen(d._session,v);}catch(m){e.handle_error(d._options.on_user_error,m,"Exception raised from app code while firing Connection.onopen()");}},
  		d._session.onleave=function(v,m){d._session_close_reason=v;d._session_close_message=m.message||"";d._retry=false;d._transport.close();},d._transport.onclose=function(v){d._autoreconnect_reset_timer();d._transport=null;0===d._connect_successes?(v="unreachable",d._retry_if_unreachable||(d._retry=false)):v=v.wasClean?"closed":"lost";var m=d._autoreconnect_advance(),r={reason:d._session_close_reason,message:d._session_close_message,retry_delay:m.delay,retry_count:m.count,will_retry:m.will_retry};g.warn("connection closed",
  		v,r);if(d.onclose)try{var h=d.onclose(v,r);}catch(l){e.handle_error(d._options.on_user_error,l,"Exception raised from app code while firing Connection.onclose()");}d._session&&(d._session._id=null,d._session=null,d._session_close_reason=null,d._session_close_message=null);d._retry&&!h?m.will_retry?(d._is_retrying=true,g.warn("auto-reconnecting in "+m.delay+"s .."),d._retry_timer=setTimeout(b,1E3*m.delay)):g.warn("giving up trying to auto-reconnect!"):g.warn("auto-reconnect disabled!",d._retry,h);};else if(d._retry=
  		false,d.onclose)d.onclose("unsupported",{reason:null,message:null,retry_delay:null,retry_count:null,will_retry:false});}var d=this;if(d._transport)throw "connection already open (or opening)";d._autoreconnect_reset();d._retry=true;b();};z.prototype.close=function(b,d){if(!this._transport&&!this._is_retrying)throw "connection already closed";this._retry=false;this._session&&this._session.isOpen?this._session.leave(b,d):this._transport&&this._transport.close();};Object.defineProperty(z.prototype,"defer",{get:function(){return this._defer}});
  		Object.defineProperty(z.prototype,"session",{get:function(){return this._session}});Object.defineProperty(z.prototype,"isOpen",{get:function(){return this._session&&this._session.isOpen?true:false}});Object.defineProperty(z.prototype,"isConnected",{get:function(){return this._transport?true:false}});Object.defineProperty(z.prototype,"transport",{get:function(){return this._transport?this._transport:{info:{type:"none",url:null,protocol:null}}}});Object.defineProperty(z.prototype,"isRetrying",{get:function(){return this._is_retrying}});
  		A.Connection=z;},{"./autobahn.js":4,"./log.js":7,"./session.js":17,"./util.js":20}],7:[function(z,O,A){(function(f){(function(){let e=function(){};"AUTOBAHN_DEBUG"in f&&AUTOBAHN_DEBUG&&"console"in f&&(e=function(){console.log.apply(console,arguments);});let g=console.warn.bind(console);A.debug=e;A.warn=g;}).call(this);}).call(this,"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{});},{}],8:[function(z,O,A){z("./polyfill/object.js");z("./polyfill/array.js");
  		z("./polyfill/string.js");z("./polyfill/function.js");z("./polyfill/console.js");z("./polyfill/typedarray.js");z("./polyfill/json.js");},{"./polyfill/array.js":9,"./polyfill/console.js":10,"./polyfill/function.js":11,"./polyfill/json.js":12,"./polyfill/object.js":13,"./polyfill/string.js":14,"./polyfill/typedarray.js":15}],9:[function(z,O,A){"function"!==typeof Array.prototype.reduce&&(Array.prototype.reduce=function(f){if(null===this||"undefined"===typeof this)throw new TypeError("Array.prototype.reduce called on null or undefined");
  		if("function"!==typeof f)throw new TypeError(f+" is not a function");var e=Object(this);var g=e.length>>>0;var a=0;if(2<=arguments.length)var b=arguments[1];else {for(;a<g&&!a in e;)a++;if(a>=g)throw new TypeError("Reduce of empty array with no initial value");b=e[a++];}for(;a<g;a++)a in e&&(b=f(b,e[a],a,e));return b});"indexOf"in Array.prototype||(Array.prototype.indexOf=function(f,e){ void 0===e&&(e=0);0>e&&(e+=this.length);0>e&&(e=0);for(var g=this.length;e<g;e++)if(e in this&&this[e]===f)return e;
  		return  -1});"lastIndexOf"in Array.prototype||(Array.prototype.lastIndexOf=function(f,e){ void 0===e&&(e=this.length-1);0>e&&(e+=this.length);e>this.length-1&&(e=this.length-1);for(e++;0<e--;)if(e in this&&this[e]===f)return e;return  -1});"forEach"in Array.prototype||(Array.prototype.forEach=function(f,e){for(var g=0,a=this.length;g<a;g++)g in this&&f.call(e,this[g],g,this);});"map"in Array.prototype||(Array.prototype.map=function(f,e){for(var g=Array(this.length),a=0,b=this.length;a<b;a++)a in this&&
  		(g[a]=f.call(e,this[a],a,this));return g});"filter"in Array.prototype||(Array.prototype.filter=function(f,e){for(var g=[],a,b=0,d=this.length;b<d;b++)b in this&&f.call(e,a=this[b],b,this)&&g.push(a);return g});"every"in Array.prototype||(Array.prototype.every=function(f,e){for(var g=0,a=this.length;g<a;g++)if(g in this&&!f.call(e,this[g],g,this))return  false;return  true});"some"in Array.prototype||(Array.prototype.some=function(f,e){for(var g=0,a=this.length;g<a;g++)if(g in this&&f.call(e,this[g],g,this))return  true;
  		return  false});"function"!==typeof Array.prototype.reduceRight&&(Array.prototype.reduceRight=function(f){if(null===this||"undefined"===typeof this)throw new TypeError("Array.prototype.reduce called on null or undefined");if("function"!==typeof f)throw new TypeError(f+" is not a function");var e=Object(this),g=(e.length>>>0)-1;if(2<=arguments.length)var a=arguments[1];else {for(;0<=g&&!g in e;)g--;if(0>g)throw new TypeError("Reduce of empty array with no initial value");a=e[g--];}for(;0<=g;g--)g in e&&(a=
  		f(a,e[g],g,e));return a});},{}],10:[function(z,O,A){(function(f){f||(f=window.console={log:function(e,g,a,b,d){},info:function(e,g,a,b,d){},warn:function(e,g,a,b,d){},error:function(e,g,a,b,d){},assert:function(e,g){}});"object"===typeof f.log&&(f.log=Function.prototype.call.bind(f.log,f),f.info=Function.prototype.call.bind(f.info,f),f.warn=Function.prototype.call.bind(f.warn,f),f.error=Function.prototype.call.bind(f.error,f),f.debug=Function.prototype.call.bind(f.info,f));"group"in f||(f.group=function(e){f.info("\n--- "+
  		e+" ---\n");});"groupEnd"in f||(f.groupEnd=function(){f.log("\n");});"assert"in f||(f.assert=function(e,g){if(!e)try{throw Error("assertion failed: "+g);}catch(a){setTimeout(function(){throw a;},0);}});"time"in f||function(){var e={};f.time=function(g){e[g]=(new Date).getTime();};f.timeEnd=function(g){var a=(new Date).getTime();f.info(g+": "+(g in e?a-e[g]:0)+"ms");};}();})("undefined"!==typeof console?console:void 0);},{}],11:[function(z,O,A){Function.prototype.bind||(Function.prototype.bind=function(f){var e=
  		this,g=Array.prototype.slice.call(arguments,1);return function(){return e.apply(f,Array.prototype.concat.apply(g,arguments))}});},{}],12:[function(z,O,A){"object"!==typeof JSON&&(JSON={});(function(){function f(h){return 10>h?"0"+h:h}function e(h){v.lastIndex=0;return v.test(h)?'"'+h.replace(v,function(l){var k=m[l];return "string"===typeof k?k:"\\u"+("0000"+l.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+h+'"'}function g(h,l){var k=a,n=l[h];n&&"object"===typeof n&&"function"===typeof n.toJSON&&(n=
  		n.toJSON(h));"function"===typeof d&&(n=d.call(l,h,n));switch(typeof n){case "string":return e(n);case "number":return isFinite(n)?String(n):"null";case "boolean":case "null":return String(n);case "object":if(!n)return "null";a+=b;var w=[];if("[object Array]"===Object.prototype.toString.apply(n)){var t=n.length;for(h=0;h<t;h+=1)w[h]=g(h,n)||"null";l=0===w.length?"[]":a?"[\n"+a+w.join(",\n"+a)+"\n"+k+"]":"["+w.join(",")+"]";a=k;return l}if(d&&"object"===typeof d)for(t=d.length,h=0;h<t;h+=1){if("string"===
  		typeof d[h]){var u=d[h];(l=g(u,n))&&w.push(e(u)+(a?": ":":")+l);}}else for(u in n)Object.prototype.hasOwnProperty.call(n,u)&&(l=g(u,n))&&w.push(e(u)+(a?": ":":")+l);l=0===w.length?"{}":a?"{\n"+a+w.join(",\n"+a)+"\n"+k+"}":"{"+w.join(",")+"}";a=k;return l}}"function"!==typeof Date.prototype.toJSON&&(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+
  		"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(){return this.valueOf()});var a,b,d;if("function"!==typeof JSON.stringify){var v=/[\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;var m={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"};JSON.stringify=function(h,l,k){var n;b=a="";if("number"===typeof k)for(n=0;n<k;n+=1)b+=" ";else "string"===typeof k&&(b=k);
  		if((d=l)&&"function"!==typeof l&&("object"!==typeof l||"number"!==typeof l.length))throw Error("JSON.stringify");return g("",{"":h})};}if("function"!==typeof JSON.parse){var r=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;JSON.parse=function(h,l){function k(n,w){var t,u=n[w];if(u&&"object"===typeof u)for(t in u)if(Object.prototype.hasOwnProperty.call(u,t)){var y=k(u,t);void 0!==y?u[t]=y:delete u[t];}return l.call(n,w,u)}h=String(h);r.lastIndex=
  		0;r.test(h)&&(h=h.replace(r,function(n){return "\\u"+("0000"+n.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(h.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return h=eval("("+h+")"),"function"===typeof l?k({"":h},""):h;throw new SyntaxError("JSON.parse");};}})();A.JSON=JSON;},{}],13:[function(z,O,A){Object.create||(Object.create=function(){function f(){}return function(e){if(1!=
  		arguments.length)throw Error("Object.create implementation only accepts one parameter.");f.prototype=e;return new f}}());Object.keys||(Object.keys=function(){var f=Object.prototype.hasOwnProperty,e=!{toString:null}.propertyIsEnumerable("toString"),g="toString toLocaleString valueOf hasOwnProperty isPrototypeOf propertyIsEnumerable constructor".split(" "),a=g.length;return function(b){if("object"!==typeof b&&("function"!==typeof b||null===b))throw new TypeError("Object.keys called on non-object");
  		var d=[],v;for(v in b)f.call(b,v)&&d.push(v);if(e)for(v=0;v<a;v++)f.call(b,g[v])&&d.push(g[v]);return d}}());},{}],14:[function(z,O,A){"trim"in String.prototype||(String.prototype.trim=function(){return this.replace(/^\s+/,"").replace(/\s+$/,"")});},{}],15:[function(z,O,A){"undefined"===typeof Uint8Array&&function(f,e){function g(X){switch(typeof X){case "undefined":return "undefined";case "boolean":return "boolean";case "number":return "number";case "string":return "string";default:return null===X?"null":
  		"object"}}function a(X){return Object.prototype.toString.call(X).replace(/^\[object *|\]$/g,"")}function b(X){return "function"===typeof X}function d(X){if(null===X||void 0===X)throw TypeError();return Object(X)}function v(X){function ba(L){Object.defineProperty(X,L,{get:function(){return X._getter(L)},set:function(M){X._setter(L,M);},enumerable:true,configurable:false});}if(1E5<X.length)throw RangeError("Array too large for polyfill");var Q;for(Q=0;Q<X.length;Q+=1)ba(Q);}function m(X,ba){ba=32-ba;return X<<
  		ba>>ba}function r(X,ba){ba=32-ba;return X<<ba>>>ba}function h(X){return [X&255]}function l(X){return m(X[0],8)}function k(X){return [X&255]}function n(X){return r(X[0],8)}function w(X){X=ia(Number(X));return [0>X?0:255<X?255:X&255]}function t(X){return [X>>8&255,X&255]}function u(X){return m(X[0]<<8|X[1],16)}function y(X){return [X>>8&255,X&255]}function x(X){return r(X[0]<<8|X[1],16)}function F(X){return [X>>24&255,X>>16&255,X>>8&255,X&255]}function D(X){return m(X[0]<<24|X[1]<<16|X[2]<<8|X[3],32)}function I(X){return [X>>
  		24&255,X>>16&255,X>>8&255,X&255]}function S(X){return r(X[0]<<24|X[1]<<16|X[2]<<8|X[3],32)}function Z(X,ba,Q){function L(sa){var Ua=c(sa);sa-=Ua;return .5>sa?Ua:.5<sa?Ua+1:Ua%2?Ua+1:Ua}var M=(1<<ba-1)-1;if(X!==X){var Y=(1<<ba)-1;var oa=T(2,Q-1);var ta=0;}else Infinity===X||-Infinity===X?(Y=(1<<ba)-1,oa=0,ta=0>X?1:0):0===X?(oa=Y=0,ta=-Infinity===1/X?1:0):(ta=0>X,X=J(X),X>=T(2,1-M)?(Y=H(c(p(X)/K),1023),oa=L(X/T(2,Y)*T(2,Q)),2<=oa/T(2,Q)&&(Y+=1,oa=1),Y>M?(Y=(1<<ba)-1,oa=0):(Y+=M,oa-=T(2,Q))):(Y=0,oa=L(X/
  		T(2,1-M-Q))));for(X=[];Q;--Q)X.push(oa%2?1:0),oa=c(oa/2);for(Q=ba;Q;--Q)X.push(Y%2?1:0),Y=c(Y/2);X.push(ta?1:0);X.reverse();ba=X.join("");for(ta=[];ba.length;)ta.push(parseInt(ba.substring(0,8),2)),ba=ba.substring(8);return ta}function aa(X,ba,Q){var L=[],M,Y;for(M=X.length;M;--M){var oa=X[M-1];for(Y=8;Y;--Y)L.push(oa%2?1:0),oa>>=1;}L.reverse();Y=L.join("");X=(1<<ba-1)-1;L=parseInt(Y.substring(0,1),2)?-1:1;M=parseInt(Y.substring(1,1+ba),2);Y=parseInt(Y.substring(1+ba),2);return M===(1<<ba)-1?0!==Y?
  		NaN:Infinity*L:0<M?L*T(2,M-X)*(1+Y/T(2,Q)):0!==Y?L*T(2,-(X-1))*(Y/T(2,Q)):0>L?-0:0}function P(X){return aa(X,11,52)}function R(X){return Z(X,11,52)}function V(X){return aa(X,8,23)}function G(X){return Z(X,8,23)}var K=Math.LN2,J=Math.abs,c=Math.floor,p=Math.log,B=Math.max,H=Math.min,T=Math.pow,ia=Math.round;(function(){var X=Object.defineProperty;try{var ba=Object.defineProperty({},"x",{});}catch(Q){ba=false;}X&&ba||(Object.defineProperty=function(Q,L,M){if(X)try{return X(Q,L,M)}catch(Y){}if(Q!==Object(Q))throw TypeError("Object.defineProperty called on non-object");
  		Object.prototype.__defineGetter__&&"get"in M&&Object.prototype.__defineGetter__.call(Q,L,M.get);Object.prototype.__defineSetter__&&"set"in M&&Object.prototype.__defineSetter__.call(Q,L,M.set);"value"in M&&(Q[L]=M.value);return Q});})();(function(){function X(da){da>>=0;if(0>da)throw RangeError("ArrayBuffer size is not a small enough positive integer.");Object.defineProperty(this,"byteLength",{value:da});Object.defineProperty(this,"_bytes",{value:Array(da)});for(var ea=0;ea<da;ea+=1)this._bytes[ea]=
  		0;}function ba(){if(!arguments.length||"object"!==typeof arguments[0])return function(da){da>>=0;if(0>da)throw RangeError("length is not a small enough positive integer.");Object.defineProperty(this,"length",{value:da});Object.defineProperty(this,"byteLength",{value:da*this.BYTES_PER_ELEMENT});Object.defineProperty(this,"buffer",{value:new X(this.byteLength)});Object.defineProperty(this,"byteOffset",{value:0});}.apply(this,arguments);if(1<=arguments.length&&"object"===g(arguments[0])&&arguments[0]instanceof
  		ba)return function(da){if(this.constructor!==da.constructor)throw TypeError();var ea=da.length*this.BYTES_PER_ELEMENT;Object.defineProperty(this,"buffer",{value:new X(ea)});Object.defineProperty(this,"byteLength",{value:ea});Object.defineProperty(this,"byteOffset",{value:0});Object.defineProperty(this,"length",{value:da.length});for(ea=0;ea<this.length;ea+=1)this._setter(ea,da._getter(ea));}.apply(this,arguments);if(1<=arguments.length&&"object"===g(arguments[0])&&!(arguments[0]instanceof ba)&&!(arguments[0]instanceof
  		X||"ArrayBuffer"===a(arguments[0])))return function(da){var ea=da.length*this.BYTES_PER_ELEMENT;Object.defineProperty(this,"buffer",{value:new X(ea)});Object.defineProperty(this,"byteLength",{value:ea});Object.defineProperty(this,"byteOffset",{value:0});Object.defineProperty(this,"length",{value:da.length});for(ea=0;ea<this.length;ea+=1)this._setter(ea,Number(da[ea]));}.apply(this,arguments);if(1<=arguments.length&&"object"===g(arguments[0])&&(arguments[0]instanceof X||"ArrayBuffer"===a(arguments[0])))return function(da,
  		ea,la){ea>>>=0;if(ea>da.byteLength)throw RangeError("byteOffset out of range");if(ea%this.BYTES_PER_ELEMENT)throw RangeError("buffer length minus the byteOffset is not a multiple of the element size.");if(void 0===la){var ha=da.byteLength-ea;if(ha%this.BYTES_PER_ELEMENT)throw RangeError("length of buffer minus byteOffset not a multiple of the element size");la=ha/this.BYTES_PER_ELEMENT;}else la>>>=0,ha=la*this.BYTES_PER_ELEMENT;if(ea+ha>da.byteLength)throw RangeError("byteOffset and length reference an area beyond the end of the buffer");
  		Object.defineProperty(this,"buffer",{value:da});Object.defineProperty(this,"byteLength",{value:ha});Object.defineProperty(this,"byteOffset",{value:ea});Object.defineProperty(this,"length",{value:la});}.apply(this,arguments);throw TypeError();}function Q(da,ea,la){var ha=function(){Object.defineProperty(this,"constructor",{value:ha});ba.apply(this,arguments);v(this);};"__proto__"in ha?ha.__proto__=ba:(ha.from=ba.from,ha.of=ba.of);ha.BYTES_PER_ELEMENT=da;var ja=function(){};ja.prototype=L;ha.prototype=
  		new ja;Object.defineProperty(ha.prototype,"BYTES_PER_ELEMENT",{value:da});Object.defineProperty(ha.prototype,"_pack",{value:ea});Object.defineProperty(ha.prototype,"_unpack",{value:la});return ha}f.ArrayBuffer=f.ArrayBuffer||X;Object.defineProperty(ba,"from",{value:function(da){return new this(da)}});Object.defineProperty(ba,"of",{value:function(){return new this(arguments)}});var L={};ba.prototype=L;Object.defineProperty(ba.prototype,"_getter",{value:function(da){if(1>arguments.length)throw SyntaxError("Not enough arguments");
  		da>>>=0;if(!(da>=this.length)){var ea=[],la;var ha=0;for(la=this.byteOffset+da*this.BYTES_PER_ELEMENT;ha<this.BYTES_PER_ELEMENT;ha+=1,la+=1)ea.push(this.buffer._bytes[la]);return this._unpack(ea)}}});Object.defineProperty(ba.prototype,"get",{value:ba.prototype._getter});Object.defineProperty(ba.prototype,"_setter",{value:function(da,ea){if(2>arguments.length)throw SyntaxError("Not enough arguments");da>>>=0;if(!(da>=this.length)){var la=this._pack(ea),ha;var ja=0;for(ha=this.byteOffset+da*this.BYTES_PER_ELEMENT;ja<
  		this.BYTES_PER_ELEMENT;ja+=1,ha+=1)this.buffer._bytes[ha]=la[ja];}}});Object.defineProperty(ba.prototype,"constructor",{value:ba});Object.defineProperty(ba.prototype,"copyWithin",{value:function(da,ea,la){var ha=d(this),ja=ha.length>>>0;ja=B(ja,0);da>>=0;da=0>da?B(ja+da,0):H(da,ja);ea>>=0;ea=0>ea?B(ja+ea,0):H(ea,ja);la=void 0===la?ja:la>>0;la=0>la?B(ja+la,0):H(la,ja);ja=H(la-ea,ja-da);from<da&&da<ea+ja?(la=-1,ea=ea+ja-1,da=da+ja-1):la=1;for(;0<count;)ha._setter(da,ha._getter(ea)),ea+=la,da+=la,--ja;
  		return ha}});Object.defineProperty(ba.prototype,"every",{value:function(da,ea){if(void 0===this||null===this)throw TypeError();var la=Object(this),ha=la.length>>>0;if(!b(da))throw TypeError();for(var ja=0;ja<ha;ja++)if(!da.call(ea,la._getter(ja),ja,la))return  false;return  true}});Object.defineProperty(ba.prototype,"fill",{value:function(da,ea,la){var ha=d(this),ja=ha.length>>>0;ja=B(ja,0);ea>>=0;ea=0>ea?B(ja+ea,0):H(ea,ja);la=void 0===la?ja:la>>0;for(ja=0>la?B(ja+la,0):H(la,ja);ea<ja;)ha._setter(ea,da),
  		ea+=1;return ha}});Object.defineProperty(ba.prototype,"filter",{value:function(da,ea){if(void 0===this||null===this)throw TypeError();var la=Object(this),ha=la.length>>>0;if(!b(da))throw TypeError();for(var ja=[],Ya=0;Ya<ha;Ya++){var bb=la._getter(Ya);da.call(ea,bb,Ya,la)&&ja.push(bb);}return new this.constructor(ja)}});Object.defineProperty(ba.prototype,"find",{value:function(da){var ea=d(this),la=ea.length>>>0;if(!b(da))throw TypeError();for(var ha=1<arguments.length?arguments[1]:void 0,ja=0;ja<
  		la;){var Ya=ea._getter(ja);if(da.call(ha,Ya,ja,ea))return Ya;++ja;}}});Object.defineProperty(ba.prototype,"findIndex",{value:function(da){var ea=d(this),la=ea.length>>>0;if(!b(da))throw TypeError();for(var ha=1<arguments.length?arguments[1]:void 0,ja=0;ja<la;){var Ya=ea._getter(ja);if(da.call(ha,Ya,ja,ea))return ja;++ja;}return  -1}});Object.defineProperty(ba.prototype,"forEach",{value:function(da,ea){if(void 0===this||null===this)throw TypeError();var la=Object(this),ha=la.length>>>0;if(!b(da))throw TypeError();
  		for(var ja=0;ja<ha;ja++)da.call(ea,la._getter(ja),ja,la);}});Object.defineProperty(ba.prototype,"indexOf",{value:function(da){if(void 0===this||null===this)throw TypeError();var ea=Object(this),la=ea.length>>>0;if(0===la)return  -1;var ha=0;if(0<arguments.length){var ja=Number(arguments[1]);ja!==ha?ha=0:0!==ja&&ja!==1/0&&ja!==-Infinity&&(ha=(0<ja||-1)*c(J(ja)));}if(ha>=la)return  -1;for(ha=0<=ha?ha:B(la-J(ha),0);ha<la;ha++)if(ea._getter(ha)===da)return ha;return  -1}});Object.defineProperty(ba.prototype,"join",
  		{value:function(da){if(void 0===this||null===this)throw TypeError();for(var ea=Object(this),la=ea.length>>>0,ha=Array(la),ja=0;ja<la;++ja)ha[ja]=ea._getter(ja);return ha.join(void 0===da?",":da)}});Object.defineProperty(ba.prototype,"lastIndexOf",{value:function(da){if(void 0===this||null===this)throw TypeError();var ea=Object(this),la=ea.length>>>0;if(0===la)return  -1;var ha=la;1<arguments.length&&(ha=Number(arguments[1]),ha!==ha?ha=0:0!==ha&&ha!==1/0&&ha!==-Infinity&&(ha=(0<ha||-1)*c(J(ha))));for(la=
  		0<=ha?H(ha,la-1):la-J(ha);0<=la;la--)if(ea._getter(la)===da)return la;return  -1}});Object.defineProperty(ba.prototype,"map",{value:function(da,ea){if(void 0===this||null===this)throw TypeError();var la=Object(this),ha=la.length>>>0;if(!b(da))throw TypeError();var ja=[];ja.length=ha;for(var Ya=0;Ya<ha;Ya++)ja[Ya]=da.call(ea,la._getter(Ya),Ya,la);return new this.constructor(ja)}});Object.defineProperty(ba.prototype,"reduce",{value:function(da){if(void 0===this||null===this)throw TypeError();var ea=Object(this),
  		la=ea.length>>>0;if(!b(da))throw TypeError();if(0===la&&1===arguments.length)throw TypeError();var ha=0,ja;for(ja=2<=arguments.length?arguments[1]:ea._getter(ha++);ha<la;)ja=da.call(void 0,ja,ea._getter(ha),ha,ea),ha++;return ja}});Object.defineProperty(ba.prototype,"reduceRight",{value:function(da){if(void 0===this||null===this)throw TypeError();var ea=Object(this),la=ea.length>>>0;if(!b(da))throw TypeError();if(0===la&&1===arguments.length)throw TypeError();--la;var ha;for(ha=2<=arguments.length?
  		arguments[1]:ea._getter(la--);0<=la;)ha=da.call(void 0,ha,ea._getter(la),la,ea),la--;return ha}});Object.defineProperty(ba.prototype,"reverse",{value:function(){if(void 0===this||null===this)throw TypeError();var da=Object(this),ea=da.length>>>0,la=c(ea/2),ha=0;for(--ea;ha<la;++ha,--ea){var ja=da._getter(ha);da._setter(ha,da._getter(ea));da._setter(ea,ja);}return da}});Object.defineProperty(ba.prototype,"set",{value:function(da,ea){if(1>arguments.length)throw SyntaxError("Not enough arguments");var la;
  		if("object"===typeof arguments[0]&&arguments[0].constructor===this.constructor){var ha=arguments[0];var ja=arguments[1]>>>0;if(ja+ha.length>this.length)throw RangeError("Offset plus length of array is out of range");var Ya=this.byteOffset+ja*this.BYTES_PER_ELEMENT;ja=ha.length*this.BYTES_PER_ELEMENT;if(ha.buffer===this.buffer){var bb=[];var Oa=0;for(la=ha.byteOffset;Oa<ja;Oa+=1,la+=1)bb[Oa]=ha.buffer._bytes[la];for(Oa=0;Oa<ja;Oa+=1,Ya+=1)this.buffer._bytes[Ya]=bb[Oa];}else for(Oa=0,la=ha.byteOffset;Oa<
  		ja;Oa+=1,la+=1,Ya+=1)this.buffer._bytes[Ya]=ha.buffer._bytes[la];}else if("object"===typeof arguments[0]&&"undefined"!==typeof arguments[0].length){ha=arguments[0];bb=ha.length>>>0;ja=arguments[1]>>>0;if(ja+bb>this.length)throw RangeError("Offset plus length of array is out of range");for(Oa=0;Oa<bb;Oa+=1)la=ha[Oa],this._setter(ja+Oa,Number(la));}else throw TypeError("Unexpected argument type(s)");}});Object.defineProperty(ba.prototype,"slice",{value:function(da,ea){var la=d(this),ha=la.length>>>0;
  		da>>=0;da=0>da?B(ha+da,0):H(da,ha);ea=void 0===ea?ha:ea>>0;ha=0>ea?B(ha+ea,0):H(ea,ha);ea=new la.constructor(ha-da);for(var ja=0;da<ha;){var Ya=la._getter(da);ea._setter(ja,Ya);++da;++ja;}return ea}});Object.defineProperty(ba.prototype,"some",{value:function(da,ea){if(void 0===this||null===this)throw TypeError();var la=Object(this),ha=la.length>>>0;if(!b(da))throw TypeError();for(var ja=0;ja<ha;ja++)if(da.call(ea,la._getter(ja),ja,la))return  true;return  false}});Object.defineProperty(ba.prototype,"sort",
  		{value:function(da){if(void 0===this||null===this)throw TypeError();for(var ea=Object(this),la=ea.length>>>0,ha=Array(la),ja=0;ja<la;++ja)ha[ja]=ea._getter(ja);da?ha.sort(da):ha.sort();for(ja=0;ja<la;++ja)ea._setter(ja,ha[ja]);return ea}});Object.defineProperty(ba.prototype,"subarray",{value:function(da,ea){da>>=0;ea>>=0;1>arguments.length&&(da=0);2>arguments.length&&(ea=this.length);0>da&&(da=this.length+da);0>ea&&(ea=this.length+ea);var la=this.length;da=0>da?0:da>la?la:da;la=this.length;ea=0>ea?
  		0:ea>la?la:ea;la=ea-da;0>la&&(la=0);return new this.constructor(this.buffer,this.byteOffset+da*this.BYTES_PER_ELEMENT,la)}});var M=Q(1,h,l),Y=Q(1,k,n),oa=Q(1,w,n),ta=Q(2,t,u),sa=Q(2,y,x),Ua=Q(4,F,D),ua=Q(4,I,S),Za=Q(4,G,V),$a=Q(8,R,P);f.Int8Array=e.Int8Array=f.Int8Array||M;f.Uint8Array=e.Uint8Array=f.Uint8Array||Y;f.Uint8ClampedArray=e.Uint8ClampedArray=f.Uint8ClampedArray||oa;f.Int16Array=e.Int16Array=f.Int16Array||ta;f.Uint16Array=e.Uint16Array=f.Uint16Array||sa;f.Int32Array=e.Int32Array=f.Int32Array||
  		Ua;f.Uint32Array=e.Uint32Array=f.Uint32Array||ua;f.Float32Array=e.Float32Array=f.Float32Array||Za;f.Float64Array=e.Float64Array=f.Float64Array||$a;})();(function(){function X(Y,oa){return b(Y.get)?Y.get(oa):Y[oa]}function ba(Y,oa,ta){if(!(Y instanceof ArrayBuffer||"ArrayBuffer"===a(Y)))throw TypeError();oa>>>=0;if(oa>Y.byteLength)throw RangeError("byteOffset out of range");ta=void 0===ta?Y.byteLength-oa:ta>>>0;if(oa+ta>Y.byteLength)throw RangeError("byteOffset and length reference an area beyond the end of the buffer");
  		Object.defineProperty(this,"buffer",{value:Y});Object.defineProperty(this,"byteLength",{value:ta});Object.defineProperty(this,"byteOffset",{value:oa});}function Q(Y){return function(oa,ta){oa>>>=0;if(oa+Y.BYTES_PER_ELEMENT>this.byteLength)throw RangeError("Array index out of range");oa+=this.byteOffset;oa=new f.Uint8Array(this.buffer,oa,Y.BYTES_PER_ELEMENT);for(var sa=[],Ua=0;Ua<Y.BYTES_PER_ELEMENT;Ua+=1)sa.push(X(oa,Ua));!!ta===!!M&&sa.reverse();return X(new Y((new f.Uint8Array(sa)).buffer),0)}}function L(Y){return function(oa,
  		ta,sa){oa>>>=0;if(oa+Y.BYTES_PER_ELEMENT>this.byteLength)throw RangeError("Array index out of range");ta=new Y([ta]);ta=new f.Uint8Array(ta.buffer);var Ua=[],ua;for(ua=0;ua<Y.BYTES_PER_ELEMENT;ua+=1)Ua.push(X(ta,ua));!!sa===!!M&&Ua.reverse();(new Uint8Array(this.buffer,oa,Y.BYTES_PER_ELEMENT)).set(Ua);}}var M=function(){var Y=new f.Uint16Array([4660]);Y=new f.Uint8Array(Y.buffer);return 18===X(Y,0)}();Object.defineProperty(ba.prototype,"getUint8",{value:Q(f.Uint8Array)});Object.defineProperty(ba.prototype,
  		"getInt8",{value:Q(f.Int8Array)});Object.defineProperty(ba.prototype,"getUint16",{value:Q(f.Uint16Array)});Object.defineProperty(ba.prototype,"getInt16",{value:Q(f.Int16Array)});Object.defineProperty(ba.prototype,"getUint32",{value:Q(f.Uint32Array)});Object.defineProperty(ba.prototype,"getInt32",{value:Q(f.Int32Array)});Object.defineProperty(ba.prototype,"getFloat32",{value:Q(f.Float32Array)});Object.defineProperty(ba.prototype,"getFloat64",{value:Q(f.Float64Array)});Object.defineProperty(ba.prototype,
  		"setUint8",{value:L(f.Uint8Array)});Object.defineProperty(ba.prototype,"setInt8",{value:L(f.Int8Array)});Object.defineProperty(ba.prototype,"setUint16",{value:L(f.Uint16Array)});Object.defineProperty(ba.prototype,"setInt16",{value:L(f.Int16Array)});Object.defineProperty(ba.prototype,"setUint32",{value:L(f.Uint32Array)});Object.defineProperty(ba.prototype,"setInt32",{value:L(f.Int32Array)});Object.defineProperty(ba.prototype,"setFloat32",{value:L(f.Float32Array)});Object.defineProperty(ba.prototype,
  		"setFloat64",{value:L(f.Float64Array)});f.DataView=f.DataView||ba;})();}(A,window);"undefined"===typeof window||"Uint8ClampedArray"in window||(window.Uint8ClampedArray=window.Uint8Array);},{}],16:[function(z,O,A){function f(b,d){this.replacer=b;this.reviver=d;this.SERIALIZER_ID="json";this.BINARY=false;}var e=z("./log.js");f.prototype.serialize=function(b){try{return JSON.stringify(b,this.replacer)}catch(d){throw e.warn("JSON encoding error",d),d;}};f.prototype.unserialize=function(b){try{return JSON.parse(b,
  		this.reviver)}catch(d){throw e.warn("JSON decoding error",d),d;}};A.JSONSerializer=f;try{var g=z("msgpack5")({forceFloat64:!0});function b(){this.SERIALIZER_ID="msgpack";this.BINARY=!0;}b.prototype.serialize=function(d){try{return g.encode(d)}catch(v){throw e.warn("MessagePack encoding error",v),v;}};b.prototype.unserialize=function(d){try{return g.decode(d)}catch(v){throw e.warn("MessagePack decoding error",v),v;}};A.MsgpackSerializer=b;}catch(b){e.warn("msgpack serializer not available",b);}try{var a=
  		z("cbor");function b(){this.SERIALIZER_ID="cbor";this.BINARY=!0;}b.prototype.serialize=async function(d){try{return await a.encodeAsync(d)}catch(v){throw e.warn("CBOR encoding error",v),v;}};b.prototype.unserialize=function(d){try{return a.decodeFirstSync(d)}catch(v){throw e.warn("CBOR decoding error",v),v;}};A.CBORSerializer=b;}catch(b){e.warn("cbor serializer not available",b);}},{"./log.js":7,cbor:48,msgpack5:110}],17:[function(z,O,A){(function(f){(function(){const e=z("./log.js"),g=z("./util.js");
  		Date.now=Date.now||function(){return +new Date};var a={caller:{features:{caller_identification:true,call_canceling:true,progressive_call_results:true}},callee:{features:{caller_identification:true,pattern_based_registration:true,shared_registration:true,progressive_call_results:true,registration_revocation:true}},publisher:{features:{publisher_identification:true,subscriber_blackwhite_listing:true,publisher_exclusion:true}},subscriber:{features:{publisher_identification:true,pattern_based_subscription:true,subscription_revocation:true}}},
  		b=function(n,w,t,u,y){this.procedure=n;this.progress=w;this.caller=t;this.caller_authid=u;this.caller_authrole=y;},d=function(n,w,t,u,y,x,F){this.publication=n;this.topic=w;this.publisher=t;this.publisher_authid=u;this.publisher_authrole=y;this.retained=x;this.forward_for=F;},v=function(n,w){this.args=n||[];this.kwargs=w||{};},m=function(n,w,t){this.error=n;this.args=w||[];this.kwargs=t||{};},r=function(n,w,t,u,y){this.topic=n;this.handler=w;this.options=t||{};this.session=u;this.id=y;this.active=true;
  		this._on_unsubscribe=u._defer();this.on_unsubscribe=this._on_unsubscribe.promise.then?this._on_unsubscribe.promise:this._on_unsubscribe;};r.prototype.unsubscribe=function(){return this.session.unsubscribe(this)};var h=function(n,w,t,u,y){this.procedure=n;this.endpoint=w;this.options=t||{};this.session=u;this.id=y;this.active=true;this._on_unregister=u._defer();this.on_unregister=this._on_unregister.promise.then?this._on_unregister.promise:this._on_unregister;};h.prototype.unregister=function(){return this.session.unregister(this)};
  		var l=function(n){this.id=n;},k=function(n,w,t,u,y){var x=this;x._socket=n;x._defer=w;x._onchallenge=t;x._on_user_error=u;x._on_internal_error=y;x._id=null;x._realm=null;x._features=null;x._goodbye_sent=false;x._transport_is_closing=false;x._publish_reqs={};x._subscribe_reqs={};x._unsubscribe_reqs={};x._call_reqs={};x._register_reqs={};x._unregister_reqs={};x._subscriptions={};x._registrations={};x._invocations={};x._prefixes={};x._caller_disclose_me=false;x._publisher_disclose_me=false;x._send_wamp=function(D){e.debug(D);
  		x._socket.send(D);};x._protocol_violation=function(D){x._socket.close(3002,"protocol violation: "+D);g.handle_error(x._on_internal_error,m("failing transport due to protocol violation: "+D));};x._MESSAGE_MAP={};x._MESSAGE_MAP[8]={};var F=0;x._new_request_id=function(){return F=9007199254740992>F?F+1:1};x._process_SUBSCRIBED=function(D){var I=D[1];D=D[2];if(I in x._subscribe_reqs){var S=x._subscribe_reqs[I],Z=S[0],aa=S[1],P=S[2];S=S[3];D in x._subscriptions||(x._subscriptions[D]=[]);aa=new r(aa,P,S,
  		x,D);x._subscriptions[D].push(aa);Z.resolve(aa);delete x._subscribe_reqs[I];}else x._protocol_violation("SUBSCRIBED received for non-pending request ID "+I);};x._MESSAGE_MAP[33]=x._process_SUBSCRIBED;x._process_SUBSCRIBE_ERROR=function(D){var I=D[2];I in x._subscribe_reqs?(D=new m(D[4],D[5],D[6]),x._subscribe_reqs[I][0].reject(D),delete x._subscribe_reqs[I]):x._protocol_violation("SUBSCRIBE-ERROR received for non-pending request ID "+I);};x._MESSAGE_MAP[8][32]=x._process_SUBSCRIBE_ERROR;x._process_UNSUBSCRIBED=
  		function(D){var I=D[1];if(I in x._unsubscribe_reqs){D=x._unsubscribe_reqs[I];var S=D[0];D=D[1];if(D in x._subscriptions){for(var Z=x._subscriptions[D],aa=0;aa<Z.length;++aa)Z[aa].active=false,Z[aa]._on_unsubscribe.resolve();delete x._subscriptions[D];}S.resolve(true);delete x._unsubscribe_reqs[I];}else if(0===I)if(I=D[2],D=I.subscription,I=I.reason,D in x._subscriptions){Z=x._subscriptions[D];for(aa=0;aa<Z.length;++aa)Z[aa].active=false,Z[aa]._on_unsubscribe.resolve(I);delete x._subscriptions[D];}else x._protocol_violation("non-voluntary UNSUBSCRIBED received for non-existing subscription ID "+
  		D);else x._protocol_violation("UNSUBSCRIBED received for non-pending request ID "+I);};x._MESSAGE_MAP[35]=x._process_UNSUBSCRIBED;x._process_UNSUBSCRIBE_ERROR=function(D){var I=D[2];I in x._unsubscribe_reqs?(D=new m(D[4],D[5],D[6]),x._unsubscribe_reqs[I][0].reject(D),delete x._unsubscribe_reqs[I]):x._protocol_violation("UNSUBSCRIBE-ERROR received for non-pending request ID "+I);};x._MESSAGE_MAP[8][34]=x._process_UNSUBSCRIBE_ERROR;x._process_PUBLISHED=function(D){var I=D[1],S=D[2];I in x._publish_reqs?
  		(D=x._publish_reqs[I][0],S=new l(S),D.resolve(S),delete x._publish_reqs[I]):x._protocol_violation("PUBLISHED received for non-pending request ID "+I);};x._MESSAGE_MAP[17]=x._process_PUBLISHED;x._process_PUBLISH_ERROR=function(D){var I=D[2];I in x._publish_reqs?(D=new m(D[4],D[5],D[6]),x._publish_reqs[I][0].reject(D),delete x._publish_reqs[I]):x._protocol_violation("PUBLISH-ERROR received for non-pending request ID "+I);};x._MESSAGE_MAP[8][16]=x._process_PUBLISH_ERROR;x._process_EVENT=function(D){var I=
  		D[1];if(I in x._subscriptions){var S=D[3],Z=D[4]||[],aa=D[5]||{};I=x._subscriptions[I];D=new d(D[2],S.topic||I[0]&&I[0].topic,S.publisher,S.publisher_authid,S.publisher_authrole,S.retained||false,S.forward_for);for(S=0;S<I.length;++S){var P=I[S];try{P.handler(Z,aa,D,P);}catch(R){g.handle_error(x._on_user_error,R,"Exception raised in event handler:");}}}else x._protocol_violation("EVENT received for non-subscribed subscription ID "+I);};x._MESSAGE_MAP[36]=x._process_EVENT;x._process_REGISTERED=function(D){var I=
  		D[1];D=D[2];if(I in x._register_reqs){var S=x._register_reqs[I],Z=S[0];S=new h(S[1],S[2],S[3],x,D);x._registrations[D]=S;Z.resolve(S);delete x._register_reqs[I];}else x._protocol_violation("REGISTERED received for non-pending request ID "+I);};x._MESSAGE_MAP[65]=x._process_REGISTERED;x._process_REGISTER_ERROR=function(D){var I=D[2];I in x._register_reqs?(D=new m(D[4],D[5],D[6]),x._register_reqs[I][0].reject(D),delete x._register_reqs[I]):x._protocol_violation("REGISTER-ERROR received for non-pending request ID "+
  		I);};x._MESSAGE_MAP[8][64]=x._process_REGISTER_ERROR;x._process_UNREGISTERED=function(D){var I=D[1];if(I in x._unregister_reqs){D=x._unregister_reqs[I];var S=D[0];D=D[1];D.id in x._registrations&&delete x._registrations[D.id];D.active=false;S.resolve();delete x._unregister_reqs[I];}else 0===I?(D=D[2],I=D.registration,S=D.reason,I in x._registrations?(D=x._registrations[I],D.active=false,D._on_unregister.resolve(S),delete x._registrations[I]):x._protocol_violation("non-voluntary UNREGISTERED received for non-existing registration ID "+
  		I)):x._protocol_violation("UNREGISTERED received for non-pending request ID "+I);};x._MESSAGE_MAP[67]=x._process_UNREGISTERED;x._process_UNREGISTER_ERROR=function(D){var I=D[2];I in x._unregister_reqs?(D=new m(D[4],D[5],D[6]),x._unregister_reqs[I][0].reject(D),delete x._unregister_reqs[I]):x._protocol_violation("UNREGISTER-ERROR received for non-pending request ID "+I);};x._MESSAGE_MAP[8][66]=x._process_UNREGISTER_ERROR;x._process_RESULT=function(D){var I=D[1];if(I in x._call_reqs){var S=D[2],Z=D[3]||
  		[],aa=D[4]||{};D=null;1<Z.length||0<Object.keys(aa).length?D=new v(Z,aa):0<Z.length&&(D=Z[0]);aa=x._call_reqs[I];Z=aa[0];aa=aa[1];S.progress?aa&&aa.receive_progress&&Z.notify(D):(Z.resolve(D),delete x._call_reqs[I]);}else x._protocol_violation("CALL-RESULT received for non-pending request ID "+I);};x._MESSAGE_MAP[50]=x._process_RESULT;x._process_CALL_ERROR=function(D){var I=D[2];I in x._call_reqs?(D=new m(D[4],D[5],D[6]),x._call_reqs[I][0].reject(D),delete x._call_reqs[I]):x._protocol_violation("CALL-ERROR received for non-pending request ID "+
  		I);};x._MESSAGE_MAP[8][48]=x._process_CALL_ERROR;x._process_INVOCATION=function(D){var I=D[1],S=D[2],Z=D[3];if(S in x._registrations){S=x._registrations[S];var aa=D[4]||[];D=D[5]||{};var P=null;Z.receive_progress&&(P=function(R,V){var G=[70,I,{progress:true}];R=R||[];V=V||{};var K=Object.keys(V).length;if(R.length||K)G.push(R),K&&G.push(V);x._send_wamp(G);});Z=new b(Z.procedure||S.procedure,P,Z.caller,Z.caller_authid,Z.caller_authrole);g.as_promise(S.endpoint,aa,D,Z).then(function(R){var V=[70,I,{}];
  		if(R instanceof v){var G=Object.keys(R.kwargs).length;if(R.args.length||G)V.push(R.args),G&&V.push(R.kwargs);}else V.push([R]);x._send_wamp(V);},function(R){var V=[8,68,I,{}];if(R instanceof m){V.push(R.error);var G=Object.keys(R.kwargs).length;if(R.args.length||G)V.push(R.args),G&&V.push(R.kwargs);}else V.push("wamp.error.runtime_error"),V.push([R]);x._send_wamp(V);g.handle_error(x._on_user_error,R,"Exception raised in invocation handler:");});}else x._protocol_violation("INVOCATION received for non-registered registration ID "+
  		I);};x._MESSAGE_MAP[68]=x._process_INVOCATION;x._socket.onmessage=function(D){var I=D[0];if(x._id)if(6===I){if(x._goodbye_sent||x._send_wamp([6,{},"wamp.error.goodbye_and_out"]),x._id=null,x._realm=null,x._features=null,I=D[1],D=D[2],x.onleave)x.onleave(D,I);}else if(8===I){var S=D[1];if(S in x._MESSAGE_MAP[8])x._MESSAGE_MAP[I][S](D);else x._protocol_violation("unexpected ERROR message with request_type "+S);}else if(I in x._MESSAGE_MAP)x._MESSAGE_MAP[I](D);else x._protocol_violation("unexpected message type "+
  		I);else if(2===I){x._id=D[1];I=D[2];x._features={};if(I.roles.broker&&(x._features.subscriber={},x._features.publisher={},I.roles.broker.features)){for(S in a.publisher.features)x._features.publisher[S]=a.publisher.features[S]&&I.roles.broker.features[S];for(S in a.subscriber.features)x._features.subscriber[S]=a.subscriber.features[S]&&I.roles.broker.features[S];}if(I.roles.dealer&&(x._features.caller={},x._features.callee={},I.roles.dealer.features)){for(S in a.caller.features)x._features.caller[S]=
  		a.caller.features[S]&&I.roles.dealer.features[S];for(S in a.callee.features)x._features.callee[S]=a.callee.features[S]&&I.roles.dealer.features[S];}if(x.onjoin)x.onjoin(D[2]);}else if(3===I){if(I=D[1],D=D[2],x.onleave)x.onleave(D,I);}else 4===I?x._onchallenge?g.as_promise(x._onchallenge,x,D[1],D[2]).then(function(Z){if("string"===typeof Z)var aa=[5,Z,{}];else "object"===typeof Z&&(aa=[5,Z[0],Z[1]]);x._send_wamp(aa);},function(Z){g.handle_error(x._on_user_error,Z,"onchallenge() raised: ");x._send_wamp([3,
  		{message:"sorry, I cannot authenticate (onchallenge handler raised an exception)"},"wamp.error.cannot_authenticate"]);x._socket.close(3E3);}):(g.handle_error(x._on_internal_error,m("received WAMP challenge, but no onchallenge() handler set")),D=[3,{message:"sorry, I cannot authenticate (no onchallenge handler set)"},"wamp.error.cannot_authenticate"],x._send_wamp(D),x._socket.close(3E3)):x._protocol_violation("unexpected message type "+I);};x._created="performance"in f&&"now"in performance?performance.now():
  		Date.now();};Object.defineProperty(k.prototype,"defer",{get:function(){return this._defer}});Object.defineProperty(k.prototype,"id",{get:function(){return this._id}});Object.defineProperty(k.prototype,"realm",{get:function(){return this._realm}});Object.defineProperty(k.prototype,"isOpen",{get:function(){return null!==this.id}});Object.defineProperty(k.prototype,"features",{get:function(){return this._features}});Object.defineProperty(k.prototype,"caller_disclose_me",{get:function(){return this._caller_disclose_me},
  		set:function(n){this._caller_disclose_me=n;}});Object.defineProperty(k.prototype,"publisher_disclose_me",{get:function(){return this._publisher_disclose_me},set:function(n){this._publisher_disclose_me=n;}});Object.defineProperty(k.prototype,"subscriptions",{get:function(){for(var n=Object.keys(this._subscriptions),w=[],t=0;t<n.length;++t)w.push(this._subscriptions[n[t]]);return w}});Object.defineProperty(k.prototype,"registrations",{get:function(){for(var n=Object.keys(this._registrations),w=[],t=0;t<
  		n.length;++t)w.push(this._registrations[n[t]]);return w}});k.prototype.log=function(){if("console"in f){if(this._id&&this._created){var n="performance"in f&&"now"in performance?performance.now()-this._created:Date.now()-this._created;n="WAMP session "+this._id+" on '"+this._realm+"' at "+Math.round(1E3*n)/1E3+" ms";}else n="WAMP session";if("group"in console){console.group(n);for(n=0;n<arguments.length;n+=1)console.log(arguments[n]);console.groupEnd();}else {var w=[n+": "];for(n=0;n<arguments.length;n+=
  		1)w.push(arguments[n]);console.log.apply(console,w);}}};k.prototype.join=function(n,w,t,u){g.assert(!n||"string"===typeof n,"Session.join: <realm> must be a string");g.assert(!w||Array.isArray(w),"Session.join: <authmethods> must be an array []");g.assert(!t||"string"===typeof t,"Session.join: <authid> must be a string");if(this.isOpen)throw "session already open";this._goodbye_sent=false;this._realm=n;var y={};y.roles=a;w&&(y.authmethods=w);t&&(y.authid=t);u&&(y.authextra=u);this._send_wamp([1,n,y]);};
  		k.prototype.leave=function(n,w){g.assert(!n||"string"===typeof n,"Session.leave: <reason> must be a string");g.assert(!w||"string"===typeof w,"Session.leave: <message> must be a string");if(!this.isOpen)throw "session not open";n||(n="wamp.close.normal");var t={};w&&(t.message=w);this._send_wamp([6,t,n]);this._goodbye_sent=true;};k.prototype.call=function(n,w,t,u){g.assert("string"===typeof n,"Session.call: <procedure> must be a string");g.assert(!w||Array.isArray(w),"Session.call: <args> must be an array []");
  		g.assert(!t||g.is_object(t),"Session.call: <kwargs> must be an object {}");g.assert(!u||g.is_object(u),"Session.call: <options> must be an object {}");var y=this;if(!y.isOpen)throw "session not open";u=u||{};void 0===u.disclose_me&&y._caller_disclose_me&&(u.disclose_me=true);var x=y._defer(),F=y._new_request_id();y._call_reqs[F]=[x,u];n=[48,F,u,y.resolve(n)];w?(n.push(w),t&&n.push(t)):t&&(n.push([]),n.push(t));y._send_wamp(n);w=x.promise.then?x.promise:x;w.cancel=function(D){y._send_wamp([49,F,D||{}]);
  		!(F in y._call_reqs)||D&&D.mode&&"kill"===D.mode||(y._call_reqs[F][0].reject(new m("Cancelled")),delete y._call_reqs[F]);};return w};k.prototype.publish=function(n,w,t,u){g.assert("string"===typeof n,"Session.publish: <topic> must be a string");g.assert(!w||Array.isArray(w),"Session.publish: <args> must be an array []");g.assert(!t||g.is_object(t),"Session.publish: <kwargs> must be an object {}");g.assert(!u||g.is_object(u),"Session.publish: <options> must be an object {}");if(!this.isOpen)throw "session not open";
  		u=u||{};void 0===u.disclose_me&&this._publisher_disclose_me&&(u.disclose_me=true);var y=null,x=this._new_request_id();u.acknowledge&&(y=this._defer(),this._publish_reqs[x]=[y,u]);n=[16,x,u,this.resolve(n)];w?(n.push(w),t&&n.push(t)):t&&(n.push([]),n.push(t));this._send_wamp(n);if(y)return y.promise.then?y.promise:y};k.prototype.subscribe=function(n,w,t){g.assert("string"===typeof n,"Session.subscribe: <topic> must be a string");g.assert("function"===typeof w,"Session.subscribe: <handler> must be a function");
  		g.assert(!t||g.is_object(t),"Session.subscribe: <options> must be an object {}");if(!this.isOpen)throw "session not open";var u=this._new_request_id(),y=this._defer();this._subscribe_reqs[u]=[y,n,w,t];w=[32,u];t?w.push(t):w.push({});w.push(this.resolve(n));this._send_wamp(w);return y.promise.then?y.promise:y};k.prototype.register=function(n,w,t){g.assert("string"===typeof n,"Session.register: <procedure> must be a string");g.assert("function"===typeof w,"Session.register: <endpoint> must be a function");
  		g.assert(!t||g.is_object(t),"Session.register: <options> must be an object {}");if(!this.isOpen)throw "session not open";var u=this._new_request_id(),y=this._defer();this._register_reqs[u]=[y,n,w,t];w=[64,u];t?w.push(t):w.push({});w.push(this.resolve(n));this._send_wamp(w);return y.promise.then?y.promise:y};k.prototype.unsubscribe=function(n){g.assert(n instanceof r,"Session.unsubscribe: <subscription> must be an instance of class autobahn.Subscription");var w=this._subscriptions[n.id],t=w.indexOf(n);
  		if(!this.isOpen)throw  -1!==t&&(w.splice(t,1),n.active=false),"session not open";if(!(n.active&&n.id in this._subscriptions))throw  -1!==t&&(w.splice(t,1),n.active=false),"subscription not active";if(-1===t)throw "subscription not active";w.splice(t,1);n.active=false;t=this._defer();w.length?t.resolve(false):(w=this._new_request_id(),this._unsubscribe_reqs[w]=[t,n.id],this._send_wamp([34,w,n.id]));return t.promise.then?t.promise:t};k.prototype.unregister=function(n){g.assert(n instanceof h,"Session.unregister: <registration> must be an instance of class autobahn.Registration");
  		if(!this.isOpen)throw "session not open";if(!(n.active&&n.id in this._registrations))throw "registration not active";var w=this._new_request_id(),t=this._defer();this._unregister_reqs[w]=[t,n];this._send_wamp([66,w,n.id]);return t.promise.then?t.promise:t};k.prototype.prefix=function(n,w){g.assert("string"===typeof n,"Session.prefix: <prefix> must be a string");g.assert(!w||"string"===typeof w,"Session.prefix: <uri> must be a string or falsy");w?this._prefixes[n]=w:n in this._prefixes&&delete this._prefixes[n];};
  		k.prototype.resolve=function(n){g.assert("string"===typeof n,"Session.resolve: <curie> must be a string");var w=n.indexOf(":");if(0<=w){var t=n.substring(0,w);return t in this._prefixes?this._prefixes[t]+"."+n.substring(w+1):n}return n};A.Session=k;A.Invocation=b;A.Event=d;A.Result=v;A.Error=m;A.Subscription=r;A.Registration=h;A.Publication=l;}).call(this);}).call(this,"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{});},{"./log.js":7,"./util.js":20}],
  		18:[function(z,O,A){function f(b){e.assert(void 0!==b.url,"options.url missing");e.assert("string"===typeof b.url,"options.url must be a string");this._options=b;}var e=z("../util.js"),g=z("../log.js"),a=z("../serializer.js");f.prototype.type="longpoll";f.prototype.create=function(){var b=this;g.debug("longpoll.Factory.create");var d={protocol:void 0};d.serializer=new a.JSONSerializer;d.send=void 0;d.close=void 0;d.onmessage=function(){};d.onopen=function(){};d.onclose=function(){};d.info={type:"longpoll",
  		url:null,protocol:"wamp.2.json"};d._run=function(){var v=null,m=false,r=b._options.request_timeout||12E3;e.http_post(b._options.url+"/open",JSON.stringify({protocols:["wamp.2.json"]}),r).then(function(h){function l(){g.debug("longpoll.Transport: polling for message ...");e.http_post(k+"/receive",null,r).then(function(n){n&&(n=JSON.parse(n),g.debug("longpoll.Transport: message received",n),d.onmessage(n));m||l();},function(n){g.debug("longpoll.Transport: could not receive message",n.code,n.text);m=true;
  		d.onclose({code:1001,reason:"transport receive failure (HTTP/POST status "+n.code+" - '"+n.text+"')",wasClean:false});});}v=JSON.parse(h);var k=b._options.url+"/"+v.transport;d.info.url=k;g.debug("longpoll.Transport: open",v);d.close=function(n,w){if(m)throw "transport is already closing";m=true;e.http_post(k+"/close",null,r).then(function(){g.debug("longpoll.Transport: transport closed");d.onclose({code:1E3,reason:"transport closed",wasClean:true});},function(t){g.debug("longpoll.Transport: could not close transport",
  		t.code,t.text);});};d.send=function(n){if(m)throw "transport is closing or closed already";g.debug("longpoll.Transport: sending message ...",n);n=JSON.stringify(n);e.http_post(k+"/send",n,r).then(function(){g.debug("longpoll.Transport: message sent");},function(w){g.debug("longpoll.Transport: could not send message",w.code,w.text);m=true;d.onclose({code:1001,reason:"transport send failure (HTTP/POST status "+w.code+" - '"+w.text+"')",wasClean:false});});};l();d.onopen();},function(h){g.debug("longpoll.Transport: could not open transport",
  		h.code,h.text);m=true;d.onclose({code:1001,reason:"transport open failure (HTTP/POST status "+h.code+" - '"+h.text+"')",wasClean:false});});};d._run();return d};A.Factory=f;},{"../log.js":7,"../serializer.js":16,"../util.js":20}],19:[function(z,O,A){(function(f){(function(){function e(d){g.assert(void 0!==d.url,"options.url missing");g.assert("string"===typeof d.url,"options.url must be a string");d.serializers?g.assert(Array.isArray(d.serializers),"options.serializers must be an array"):(d.serializers=[new b.JSONSerializer],
  		b.MsgpackSerializer&&d.serializers.push(new b.MsgpackSerializer));d.protocols?g.assert(Array.isArray(d.protocols),"options.protocols must be an array"):(d.protocols=[],d.serializers.forEach(function(v){d.protocols.push("wamp.2."+v.SERIALIZER_ID);}));d.autoping_interval?(g.assert(0<d.autoping_interval,"options.autoping_interval must be greater than 0"),d.autoping_interval*=1E3):d.autoping_interval=1E4;d.autoping_timeout?(g.assert(0<d.autoping_timeout,"options.autoping_timeout must be greater than 0"),
  		d.autoping_timeout*=1E3):d.autoping_timeout=5E3;d.autoping_size?g.assert(4<=d.autoping_size&&125>=d.autoping_size,"options.autoping_size must be between 4 and 125"):d.autoping_size=4;this._options=d;}var g=z("../util.js"),a=z("../log.js"),b=z("../serializer.js");e.prototype.type="websocket";e.prototype.create=function(){var d=this,v={protocol:void 0,serializer:void 0,send:void 0,close:void 0,onmessage:function(){},onopen:function(){},onclose:function(){}};v.info={type:"websocket",url:d._options.url,
  		protocol:null};"WebSocket"in f?function(){var m=d._options.protocols?new f.WebSocket(d._options.url,d._options.protocols):new f.WebSocket(d._options.url);m.binaryType="arraybuffer";m.onmessage=function(r){a.debug("WebSocket transport receive",r.data);r=v.serializer.unserialize(r.data);v.onmessage(r);};m.onopen=function(){var r=m.protocol.split(".")[2],h;for(h in d._options.serializers){var l=d._options.serializers[h];if(l.SERIALIZER_ID==r){v.serializer=l;break}}v.info.protocol=m.protocol;v.onopen();};
  		m.onclose=function(r){v.onclose({code:r.code,reason:r.message,wasClean:r.wasClean});};v.send=async function(r){r=await v.serializer.serialize(r);a.debug("WebSocket transport send",r);m.send(r);};v.close=function(r,h){m.close(r,h);};}():function(){var m=z("ws"),r=z("tweetnacl").randomBytes,h={agent:d._options.agent,headers:d._options.headers};if(d._options.protocols){var l=d._options.protocols;Array.isArray(l)&&(l=l.join(","));h.protocol=l;}d._options.url.startsWith("wss://")&&d._options.tlsConfiguration?
  		d._options.tlsConfiguration.ca&&d._options.tlsConfiguration.cert&&d._options.tlsConfiguration.key?(a.debug("Using TLS Client Authentication."),h.ca=d._options.tlsConfiguration.ca,h.cert=d._options.tlsConfiguration.cert,h.key=d._options.tlsConfiguration.key,h.rejectUnauthorized=false):a.debug("Not using TLS Client Authentication. tlsConfiguration should include 'ca' 'cert' and 'key' parameters."):a.debug("Not using TLS Client Authentication.");var k=new m(d._options.url,l,h);v.send=async function(t){t=
  		await v.serializer.serialize(t);k.send(t,{binary:v.serializer.BINARY});};v.close=function(t,u){k.close();};var n,w;k.on("open",function(){w=new Date;var t=k.protocol.split(".")[2],u;for(u in d._options.serializers){var y=d._options.serializers[u];if(y.SERIALIZER_ID==t){v.serializer=y;break}}v.info.protocol=k.protocol;k.isAlive=true;n=setInterval(function(){if(false===k.isAlive)return clearInterval(n),k.terminate();new Date-w<d._options.autoping_interval||(k.isAlive=false,k.ping(r(d._options.autoping_size)));},
  		d._options.autoping_interval);v.onopen();});k.on("pong",function(){w=new Date;this.isAlive=true;});k.on("message",function(t,u){w=new Date;t=v.serializer.unserialize(t);v.onmessage(t);});k.on("close",function(t,u){null!=n&&clearInterval(n);v.onclose({code:t,reason:u,wasClean:1E3===t});});k.on("error",function(t){null!=n&&clearInterval(n);v.onclose({code:1006,reason:"",wasClean:false});});}();return v};A.Factory=e;}).call(this);}).call(this,"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==
  		typeof window?window:{});},{"../log.js":7,"../serializer.js":16,"../util.js":20,tweetnacl:151,ws:44}],20:[function(z,O,A){(function(f){(function(){let e,g;try{g=z("when"),e=!0;}catch(r){e=false;}let a=z("./log.js");A.atob=function(r){return r?new Uint8Array(atob(r).split("").map(function(h){return h.charCodeAt(0)})):null};A.btoa=function(r){return r?btoa(String.fromCharCode.apply(null,r)):null};A.btoh=function(r){if(r){let h="";for(let l=0;l<r.length;++l)h+=("0"+(r[l]&255).toString(16)).slice(-2);return h}return null};
  		A.htob=function(r){if(r){if("string"!==typeof r)throw new TypeError("Expected input to be a string");if(0!==r.length%2)throw new RangeError("Expected string to be an even number of characters");let h=new Uint8Array(r.length/2);for(let l=0;l<r.length;l+=2)h[l/2]=parseInt(r.substring(l,l+2),16);return h}return null};let b=function(r,h){if(!r){if(b.useDebugger||"AUTOBAHN_DEBUG"in f&&AUTOBAHN_DEBUG)debugger;throw Error(h||"Assertion failed!");}},d=function(){if(0===arguments.length)return {};let r=arguments[0],
  		h=false,l=arguments.length;"boolean"===typeof arguments[l-1]&&(h=arguments[l-1],--l);for(let k=1;k<l;k++){let n=arguments[k];if(n){if("object"!==typeof n)throw Error("Expected argument at index "+k+" to be an object");Object.keys(n).forEach(function(w){let t=n[w];w in r?h&&"object"===typeof t&&"object"===typeof r[w]&&d(r[w],t):r[w]=t;});}}return r},v=function(r){let h=function(){return function(){let l={};l.promise=new Promise(function(k,n){l.resolve=k;l.reject=n;});return l}};return r?r.use_es6_promises?
  		h():r.use_deferred?r.use_deferred:e?g.defer:h():e?g.defer:h()},m=async function(r){return new Promise((h,l)=>{fs.readFile(r,function(k,n){k?l(k):h(n);});})};A.read_file="fs"in f?m:null;A.handle_error=function(r,h,l){"function"===typeof r?r(h,l):console.error(l||"Unhandled exception raised: ",h);};A.rand_normal=function(r,h){let l;do{l=2*Math.random()-1;var k=2*Math.random()-1;k=l*l+k*k;}while(1<=k||0==k);return (r||0)+l*Math.sqrt(-2*Math.log(k)/k)*(h||1)};A.is_object=function(r){return !Array.isArray(r)&&
  		(r instanceof Object||"object"===typeof r)};A.assert=b;A.http_post=function(r,h,l){a.debug("new http_post request",r,h,l);let k=v()(),n=new XMLHttpRequest;n.withCredentials=true;n.onreadystatechange=function(){if(4===n.readyState){let w=1223===n.status?204:n.status;200===w&&k.resolve(n.responseText);if(204===w)k.resolve();else {let t=null;try{t=n.statusText;}catch(u){}k.reject({code:w,text:t});}}};n.open("POST",r,true);n.setRequestHeader("Content-type","application/json; charset=utf-8");0<l&&(n.timeout=
  		l,n.ontimeout=function(){k.reject({code:501,text:"request timeout"});});h?n.send(h):n.send();return k.promise.then?k.promise:k};A.http_get_json=function(r,h){let l=v()(),k=new XMLHttpRequest;k.withCredentials=true;k.onreadystatechange=function(){if(4===k.readyState){let w=1223===k.status?204:k.status;if(200===w){var n=JSON.parse(k.responseText);l.resolve(n);}if(204===w)l.resolve();else {n=null;try{n=k.statusText;}catch(t){}l.reject({code:w,text:n});}}};k.open("GET",r,true);k.setRequestHeader("Content-type",
  		"application/json; charset=utf-8");0<h&&(k.timeout=h,k.ontimeout=function(){l.reject({code:501,text:"request timeout"});});k.send();return l.promise.then?l.promise:l};A.defaults=d;A.new_global_id=function(){return Math.floor(9007199254740992*Math.random())+1};A.deferred_factory=v;A.promise=function(r){return r.promise.then?r.promise:r};A.sleep=async function(r){return new Promise(h=>setTimeout(h,r))};A.as_promise=function(r,...h){return new Promise((l,k)=>{try{l(r.call(this,...h));}catch(n){k(n);}})};}).call(this);}).call(this,
  		"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{});},{"./log.js":7,when:178}],21:[function(z,O,A){(function(f){(function(){function e(P,R){if(P===R)return 0;for(var V=P.length,G=R.length,K=0,J=Math.min(V,G);K<J;++K)if(P[K]!==R[K]){V=P[K];G=R[K];break}return V<G?-1:G<V?1:0}function g(P){return f.Buffer&&"function"===typeof f.Buffer.isBuffer?f.Buffer.isBuffer(P):!(null==P||!P._isBuffer)}function a(P){return g(P)||"function"!==typeof f.ArrayBuffer?
  		false:"function"===typeof ArrayBuffer.isView?ArrayBuffer.isView(P):P?P instanceof DataView||P.buffer&&P.buffer instanceof ArrayBuffer?true:false:false}function b(P){if(x.isFunction(P))return I?P.name:(P=P.toString().match(Z))&&P[1]}function d(P,R){return "string"===typeof P?P.length<R?P:P.slice(0,R):P}function v(P){if(I||!x.isFunction(P))return x.inspect(P);P=b(P);return "[Function"+(P?": "+P:"")+"]"}function m(P,R,V,G,K){throw new S.AssertionError({message:V,actual:P,expected:R,operator:G,stackStartFunction:K});
  		}function r(P,R){P||m(P,true,R,"==",S.ok);}function h(P,R,V,G){if(P===R)return  true;if(g(P)&&g(R))return 0===e(P,R);if(x.isDate(P)&&x.isDate(R))return P.getTime()===R.getTime();if(x.isRegExp(P)&&x.isRegExp(R))return P.source===R.source&&P.global===R.global&&P.multiline===R.multiline&&P.lastIndex===R.lastIndex&&P.ignoreCase===R.ignoreCase;if(null!==P&&"object"===typeof P||null!==R&&"object"===typeof R){if(!a(P)||!a(R)||Object.prototype.toString.call(P)!==Object.prototype.toString.call(R)||P instanceof Float32Array||
  		P instanceof Float64Array){if(g(P)!==g(R))return  false;G=G||{actual:[],expected:[]};var K=G.actual.indexOf(P);if(-1!==K&&K===G.expected.indexOf(R))return  true;G.actual.push(P);G.expected.push(R);return k(P,R,V,G)}return 0===e(new Uint8Array(P.buffer),new Uint8Array(R.buffer))}return V?P===R:P==R}function l(P){return "[object Arguments]"==Object.prototype.toString.call(P)}function k(P,R,V,G){if(null===P||void 0===P||null===R||void 0===R)return  false;if(x.isPrimitive(P)||x.isPrimitive(R))return P===R;if(V&&Object.getPrototypeOf(P)!==
  		Object.getPrototypeOf(R))return  false;var K=l(P),J=l(R);if(K&&!J||!K&&J)return  false;if(K)return P=D.call(P),R=D.call(R),h(P,R,V);K=aa(P);var c=aa(R);if(K.length!==c.length)return  false;K.sort();c.sort();for(J=K.length-1;0<=J;J--)if(K[J]!==c[J])return  false;for(J=K.length-1;0<=J;J--)if(c=K[J],!h(P[c],R[c],V,G))return  false;return  true}function n(P,R,V){h(P,R,true)&&m(P,R,V,"notDeepStrictEqual",n);}function w(P,R){if(!P||!R)return  false;if("[object RegExp]"==Object.prototype.toString.call(R))return R.test(P);try{if(P instanceof
  		R)return !0}catch(V){}return Error.isPrototypeOf(R)?false:true===R.call({},P)}function t(P,R,V,G){if("function"!==typeof R)throw new TypeError('"block" argument must be a function');"string"===typeof V&&(G=V,V=null);try{R();}catch(p){var K=p;}R=K;G=(V&&V.name?" ("+V.name+").":".")+(G?" "+G:".");P&&!R&&m(R,V,"Missing expected exception"+G);K="string"===typeof G;var J=!P&&x.isError(R),c=!P&&R&&!V;(J&&K&&w(R,V)||c)&&m(R,V,"Got unwanted exception"+G);if(P&&R&&V&&!w(R,V)||!P&&R)throw R;}function u(P,R){P||m(P,
  		true,R,"==",u);}var y=z("object-assign"),x=z("util/"),F=Object.prototype.hasOwnProperty,D=Array.prototype.slice,I=function(){return "foo"===function(){}.name}(),S=O.exports=r,Z=/\s*function\s+([^\(\s]*)\s*/;S.AssertionError=function(P){this.name="AssertionError";this.actual=P.actual;this.expected=P.expected;this.operator=P.operator;P.message?(this.message=P.message,this.generatedMessage=false):(this.message=d(v(this.actual),128)+" "+this.operator+" "+d(v(this.expected),128),this.generatedMessage=true);var R=
  		P.stackStartFunction||m;Error.captureStackTrace?Error.captureStackTrace(this,R):(P=Error(),P.stack&&(P=P.stack,R=b(R),R=P.indexOf("\n"+R),0<=R&&(R=P.indexOf("\n",R+1),P=P.substring(R+1)),this.stack=P));};x.inherits(S.AssertionError,Error);S.fail=m;S.ok=r;S.equal=function(P,R,V){P!=R&&m(P,R,V,"==",S.equal);};S.notEqual=function(P,R,V){P==R&&m(P,R,V,"!=",S.notEqual);};S.deepEqual=function(P,R,V){h(P,R,false)||m(P,R,V,"deepEqual",S.deepEqual);};S.deepStrictEqual=function(P,R,V){h(P,R,true)||m(P,R,V,"deepStrictEqual",
  		S.deepStrictEqual);};S.notDeepEqual=function(P,R,V){h(P,R,false)&&m(P,R,V,"notDeepEqual",S.notDeepEqual);};S.notDeepStrictEqual=n;S.strictEqual=function(P,R,V){P!==R&&m(P,R,V,"===",S.strictEqual);};S.notStrictEqual=function(P,R,V){P===R&&m(P,R,V,"!==",S.notStrictEqual);};S.throws=function(P,R,V){t(true,P,R,V);};S.doesNotThrow=function(P,R,V){t(false,P,R,V);};S.ifError=function(P){if(P)throw P;};S.strict=y(u,S,{equal:S.strictEqual,deepEqual:S.deepStrictEqual,notEqual:S.notStrictEqual,notDeepEqual:S.notDeepStrictEqual});
  		S.strict.strict=S.strict;var aa=Object.keys||function(P){var R=[],V;for(V in P)F.call(P,V)&&R.push(V);return R};}).call(this);}).call(this,"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{});},{"object-assign":132,"util/":24}],22:[function(z,O,A){O.exports="function"===typeof Object.create?function(f,e){f.super_=e;f.prototype=Object.create(e.prototype,{constructor:{value:f,enumerable:false,writable:true,configurable:true}});}:function(f,e){f.super_=e;var g=
  		function(){};g.prototype=e.prototype;f.prototype=new g;f.prototype.constructor=f;};},{}],23:[function(z,O,A){O.exports=function(f){return f&&"object"===typeof f&&"function"===typeof f.copy&&"function"===typeof f.fill&&"function"===typeof f.readUInt8};},{}],24:[function(z,O,A){(function(f,e){(function(){function g(G,K){var J={seen:[],stylize:b};3<=arguments.length&&(J.depth=arguments[2]);4<=arguments.length&&(J.colors=arguments[3]);w(K)?J.showHidden=K:K&&A._extend(J,K);y(J.showHidden)&&(J.showHidden=
  		false);y(J.depth)&&(J.depth=2);y(J.colors)&&(J.colors=false);y(J.customInspect)&&(J.customInspect=true);J.colors&&(J.stylize=a);return v(J,G,J.depth)}function a(G,K){return (K=g.styles[K])?"\u001b["+g.colors[K][0]+"m"+G+"\u001b["+g.colors[K][1]+"m":G}function b(G,K){return G}function d(G){var K={};G.forEach(function(J,c){K[J]=true;});return K}function v(G,K,J){if(G.customInspect&&K&&S(K.inspect)&&K.inspect!==A.inspect&&(!K.constructor||K.constructor.prototype!==K)){var c=K.inspect(J,G);u(c)||(c=v(G,c,J));return c}if(c=
  		m(G,K))return c;var p=Object.keys(K),B=d(p);G.showHidden&&(p=Object.getOwnPropertyNames(K));if(I(K)&&(0<=p.indexOf("message")||0<=p.indexOf("description")))return r(K);if(0===p.length){if(S(K))return G.stylize("[Function"+(K.name?": "+K.name:"")+"]","special");if(x(K))return G.stylize(RegExp.prototype.toString.call(K),"regexp");if(D(K))return G.stylize(Date.prototype.toString.call(K),"date");if(I(K))return r(K)}c="";var H=false,T=["{","}"];n(K)&&(H=true,T=["[","]"]);S(K)&&(c=" [Function"+(K.name?": "+
  		K.name:"")+"]");x(K)&&(c=" "+RegExp.prototype.toString.call(K));D(K)&&(c=" "+Date.prototype.toUTCString.call(K));I(K)&&(c=" "+r(K));if(0===p.length&&(!H||0==K.length))return T[0]+c+T[1];if(0>J)return x(K)?G.stylize(RegExp.prototype.toString.call(K),"regexp"):G.stylize("[Object]","special");G.seen.push(K);p=H?h(G,K,J,B,p):p.map(function(ia){return l(G,K,J,B,ia,H)});G.seen.pop();return k(p,c,T)}function m(G,K){if(y(K))return G.stylize("undefined","undefined");if(u(K))return K="'"+JSON.stringify(K).replace(/^"|"$/g,
  		"").replace(/'/g,"\\'").replace(/\\"/g,'"')+"'",G.stylize(K,"string");if(t(K))return G.stylize(""+K,"number");if(w(K))return G.stylize(""+K,"boolean");if(null===K)return G.stylize("null","null")}function r(G){return "["+Error.prototype.toString.call(G)+"]"}function h(G,K,J,c,p){for(var B=[],H=0,T=K.length;H<T;++H)Object.prototype.hasOwnProperty.call(K,String(H))?B.push(l(G,K,J,c,String(H),true)):B.push("");p.forEach(function(ia){ia.match(/^\d+$/)||B.push(l(G,K,J,c,ia,true));});return B}function l(G,K,J,
  		c,p,B){var H,T;K=Object.getOwnPropertyDescriptor(K,p)||{value:K[p]};K.get?T=K.set?G.stylize("[Getter/Setter]","special"):G.stylize("[Getter]","special"):K.set&&(T=G.stylize("[Setter]","special"));Object.prototype.hasOwnProperty.call(c,p)||(H="["+p+"]");T||(0>G.seen.indexOf(K.value)?(T=null===J?v(G,K.value,null):v(G,K.value,J-1),-1<T.indexOf("\n")&&(T=B?T.split("\n").map(function(ia){return "  "+ia}).join("\n").substr(2):"\n"+T.split("\n").map(function(ia){return "   "+ia}).join("\n"))):T=G.stylize("[Circular]",
  		"special"));if(y(H)){if(B&&p.match(/^\d+$/))return T;H=JSON.stringify(""+p);H.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)?(H=H.substr(1,H.length-2),H=G.stylize(H,"name")):(H=H.replace(/'/g,"\\'").replace(/\\"/g,'"').replace(/(^"|"$)/g,"'"),H=G.stylize(H,"string"));}return H+": "+T}function k(G,K,J){var c=0;return 60<G.reduce(function(p,B){c++;0<=B.indexOf("\n")&&c++;return p+B.replace(/\u001b\[\d\d?m/g,"").length+1},0)?J[0]+(""===K?"":K+"\n ")+" "+G.join(",\n  ")+" "+J[1]:J[0]+K+" "+G.join(", ")+" "+J[1]}
  		function n(G){return Array.isArray(G)}function w(G){return "boolean"===typeof G}function t(G){return "number"===typeof G}function u(G){return "string"===typeof G}function y(G){return void 0===G}function x(G){return F(G)&&"[object RegExp]"===Object.prototype.toString.call(G)}function F(G){return "object"===typeof G&&null!==G}function D(G){return F(G)&&"[object Date]"===Object.prototype.toString.call(G)}function I(G){return F(G)&&("[object Error]"===Object.prototype.toString.call(G)||G instanceof Error)}
  		function S(G){return "function"===typeof G}function Z(G){return 10>G?"0"+G.toString(10):G.toString(10)}var aa=/%[sdj%]/g;A.format=function(G){if(!u(G)){for(var K=[],J=0;J<arguments.length;J++)K.push(g(arguments[J]));return K.join(" ")}J=1;var c=arguments,p=c.length;K=String(G).replace(aa,function(H){if("%%"===H)return "%";if(J>=p)return H;switch(H){case "%s":return String(c[J++]);case "%d":return Number(c[J++]);case "%j":try{return JSON.stringify(c[J++])}catch(T){return "[Circular]"}default:return H}});
  		for(var B=c[J];J<p;B=c[++J])K=null!==B&&F(B)?K+(" "+g(B)):K+(" "+B);return K};A.deprecate=function(G,K){if(y(e.process))return function(){return A.deprecate(G,K).apply(this,arguments)};if(true===f.noDeprecation)return G;var J=false;return function(){if(!J){if(f.throwDeprecation)throw Error(K);f.traceDeprecation?console.trace(K):console.error(K);J=true;}return G.apply(this,arguments)}};var P={},R;A.debuglog=function(G){y(R)&&(R=f.env.NODE_DEBUG||"");G=G.toUpperCase();if(!P[G])if((new RegExp("\\b"+G+"\\b",
  		"i")).test(R)){var K=f.pid;P[G]=function(){var J=A.format.apply(A,arguments);console.error("%s %d: %s",G,K,J);};}else P[G]=function(){};return P[G]};A.inspect=g;g.colors={bold:[1,22],italic:[3,23],underline:[4,24],inverse:[7,27],white:[37,39],grey:[90,39],black:[30,39],blue:[34,39],cyan:[36,39],green:[32,39],magenta:[35,39],red:[31,39],yellow:[33,39]};g.styles={special:"cyan",number:"yellow","boolean":"yellow",undefined:"grey","null":"bold",string:"green",date:"magenta",regexp:"red"};A.isArray=n;A.isBoolean=
  		w;A.isNull=function(G){return null===G};A.isNullOrUndefined=function(G){return null==G};A.isNumber=t;A.isString=u;A.isSymbol=function(G){return "symbol"===typeof G};A.isUndefined=y;A.isRegExp=x;A.isObject=F;A.isDate=D;A.isError=I;A.isFunction=S;A.isPrimitive=function(G){return null===G||"boolean"===typeof G||"number"===typeof G||"string"===typeof G||"symbol"===typeof G||"undefined"===typeof G};A.isBuffer=z("./support/isBuffer");var V="Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");A.log=
  		function(){var G=console,K=G.log;var J=new Date;var c=[Z(J.getHours()),Z(J.getMinutes()),Z(J.getSeconds())].join(":");J=[J.getDate(),V[J.getMonth()],c].join(" ");K.call(G,"%s - %s",J,A.format.apply(A,arguments));};A.inherits=z("inherits");A._extend=function(G,K){if(!K||!F(K))return G;for(var J=Object.keys(K),c=J.length;c--;)G[J[c]]=K[J[c]];return G};}).call(this);}).call(this,z("_process"),"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{});},{"./support/isBuffer":23,
  		_process:133,inherits:22}],25:[function(z,O,A){(function(f){(function(){var e="BigInt64Array BigUint64Array Float32Array Float64Array Int16Array Int32Array Int8Array Uint16Array Uint32Array Uint8Array Uint8ClampedArray".split(" "),g="undefined"===typeof globalThis?f:globalThis;O.exports=function(){for(var a=[],b=0;b<e.length;b++)"function"===typeof g[e[b]]&&(a[a.length]=e[b]);return a};}).call(this);}).call(this,"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?
  		window:{});},{}],26:[function(z,O,A){function f(b){var d=b.length;if(0<d%4)throw Error("Invalid string. Length must be a multiple of 4");b=b.indexOf("=");-1===b&&(b=d);return [b,b===d?0:4-b%4]}A.byteLength=function(b){b=f(b);var d=b[1];return 3*(b[0]+d)/4-d};A.toByteArray=function(b){var d=f(b);var v=d[0];d=d[1];var m=new a(3*(v+d)/4-d),r=0,h=0<d?v-4:v,l;for(l=0;l<h;l+=4)v=g[b.charCodeAt(l)]<<18|g[b.charCodeAt(l+1)]<<12|g[b.charCodeAt(l+2)]<<6|g[b.charCodeAt(l+3)],m[r++]=v>>16&255,m[r++]=v>>8&255,m[r++]=
  		v&255;2===d&&(v=g[b.charCodeAt(l)]<<2|g[b.charCodeAt(l+1)]>>4,m[r++]=v&255);1===d&&(v=g[b.charCodeAt(l)]<<10|g[b.charCodeAt(l+1)]<<4|g[b.charCodeAt(l+2)]>>2,m[r++]=v>>8&255,m[r++]=v&255);return m};A.fromByteArray=function(b){for(var d=b.length,v=d%3,m=[],r=0,h=d-v;r<h;r+=16383){for(var l=m,k=l.push,n,w=b,t=r+16383>h?h:r+16383,u=[],y=r;y<t;y+=3)n=(w[y]<<16&16711680)+(w[y+1]<<8&65280)+(w[y+2]&255),u.push(e[n>>18&63]+e[n>>12&63]+e[n>>6&63]+e[n&63]);n=u.join("");k.call(l,n);}1===v?(b=b[d-1],m.push(e[b>>
  		2]+e[b<<4&63]+"==")):2===v&&(b=(b[d-2]<<8)+b[d-1],m.push(e[b>>10]+e[b>>4&63]+e[b<<2&63]+"="));return m.join("")};var e=[],g=[],a="undefined"!==typeof Uint8Array?Uint8Array:Array;for(z=0;64>z;++z)e[z]="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[z],g["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charCodeAt(z)]=z;g[45]=62;g[95]=63;},{}],27:[function(z,O,A){function f(a){if(!(this instanceof f))return new f(a);f._init.call(this,a);}const {Buffer:e}=z("buffer"),
  		g=Symbol.for("BufferList");f._init=function(a){Object.defineProperty(this,g,{value:true});this._bufs=[];this.length=0;a&&this.append(a);};f.prototype._new=function(a){return new f(a)};f.prototype._offset=function(a){if(0===a)return [0,0];let b=0;for(let d=0;d<this._bufs.length;d++){const v=b+this._bufs[d].length;if(a<v||d===this._bufs.length-1)return [d,a-b];b=v;}};f.prototype._reverseOffset=function(a){const b=a[0];a=a[1];for(let d=0;d<b;d++)a+=this._bufs[d].length;return a};f.prototype.get=function(a){if(!(a>
  		this.length||0>a))return a=this._offset(a),this._bufs[a[0]][a[1]]};f.prototype.slice=function(a,b){"number"===typeof a&&0>a&&(a+=this.length);"number"===typeof b&&0>b&&(b+=this.length);return this.copy(null,0,a,b)};f.prototype.copy=function(a,b,d,v){if("number"!==typeof d||0>d)d=0;if("number"!==typeof v||v>this.length)v=this.length;if(d>=this.length||0>=v)return a||e.alloc(0);const m=!!a,r=this._offset(d),h=v-d;var l=h;let k=m&&b||0,n=r[1];if(0===d&&v===this.length){if(!m)return 1===this._bufs.length?
  		this._bufs[0]:e.concat(this._bufs,this.length);for(l=0;l<this._bufs.length;l++)this._bufs[l].copy(a,k),k+=this._bufs[l].length;return a}if(l<=this._bufs[r[0]].length-n)return m?this._bufs[r[0]].copy(a,b,n,n+l):this._bufs[r[0]].slice(n,n+l);m||(a=e.allocUnsafe(h));for(b=r[0];b<this._bufs.length;b++){d=this._bufs[b].length-n;if(l>d)this._bufs[b].copy(a,k,n),k+=d;else {this._bufs[b].copy(a,k,n,n+l);k+=d;break}l-=d;n&&(n=0);}return a.length>k?a.slice(0,k):a};f.prototype.shallowSlice=function(a,b){a=a||
  		0;b="number"!==typeof b?this.length:b;0>a&&(a+=this.length);0>b&&(b+=this.length);if(a===b)return this._new();a=this._offset(a);b=this._offset(b);const d=this._bufs.slice(a[0],b[0]+1);0===b[1]?d.pop():d[d.length-1]=d[d.length-1].slice(0,b[1]);0!==a[1]&&(d[0]=d[0].slice(a[1]));return this._new(d)};f.prototype.toString=function(a,b,d){return this.slice(b,d).toString(a)};f.prototype.consume=function(a){a=Math.trunc(a);if(Number.isNaN(a)||0>=a)return this;for(;this._bufs.length;)if(a>=this._bufs[0].length)a-=
  		this._bufs[0].length,this.length-=this._bufs[0].length,this._bufs.shift();else {this._bufs[0]=this._bufs[0].slice(a);this.length-=a;break}return this};f.prototype.duplicate=function(){const a=this._new();for(let b=0;b<this._bufs.length;b++)a.append(this._bufs[b]);return a};f.prototype.append=function(a){if(null==a)return this;if(a.buffer)this._appendBuffer(e.from(a.buffer,a.byteOffset,a.byteLength));else if(Array.isArray(a))for(var b=0;b<a.length;b++)this.append(a[b]);else if(this._isBufferList(a))for(b=
  		0;b<a._bufs.length;b++)this.append(a._bufs[b]);else "number"===typeof a&&(a=a.toString()),this._appendBuffer(e.from(a));return this};f.prototype._appendBuffer=function(a){this._bufs.push(a);this.length+=a.length;};f.prototype.indexOf=function(a,b,d){ void 0===d&&"string"===typeof b&&(d=b,b=void 0);if("function"===typeof a||Array.isArray(a))throw new TypeError('The "value" argument must be one of type string, Buffer, BufferList, or Uint8Array.');"number"===typeof a?a=e.from([a]):"string"===typeof a?a=
  		e.from(a,d):this._isBufferList(a)?a=a.slice():Array.isArray(a.buffer)?a=e.from(a.buffer,a.byteOffset,a.byteLength):e.isBuffer(a)||(a=e.from(a));b=Number(b||0);isNaN(b)&&(b=0);0>b&&(b=this.length+b);0>b&&(b=0);if(0===a.length)return b>this.length?this.length:b;d=this._offset(b);b=d[0];for(var v=d[1];b<this._bufs.length;b++){for(d=this._bufs[b];v<d.length;)if(d.length-v>=a.length){v=d.indexOf(a,v);if(-1!==v)return this._reverseOffset([b,v]);v=d.length-a.length+1;}else {const m=this._reverseOffset([b,
  		v]);if(this._match(m,a))return m;v++;}v=0;}return  -1};f.prototype._match=function(a,b){if(this.length-a<b.length)return  false;for(let d=0;d<b.length;d++)if(this.get(a+d)!==b[d])return  false;return  true};(function(){const a={readDoubleBE:8,readDoubleLE:8,readFloatBE:4,readFloatLE:4,readInt32BE:4,readInt32LE:4,readUInt32BE:4,readUInt32LE:4,readInt16BE:2,readInt16LE:2,readUInt16BE:2,readUInt16LE:2,readInt8:1,readUInt8:1,readIntBE:null,readIntLE:null,readUIntBE:null,readUIntLE:null};for(const b in a)(function(d){f.prototype[d]=
  		null===a[d]?function(v,m){return this.slice(v,v+m)[d](0,m)}:function(v=0){return this.slice(v,v+a[d])[d](0)};})(b);})();f.prototype._isBufferList=function(a){return a instanceof f||f.isBufferList(a)};f.isBufferList=function(a){return null!=a&&a[g]};O.exports=f;},{buffer:45}],28:[function(z,O,A){function f(a){if(!(this instanceof f))return new f(a);if("function"===typeof a){this._callback=a;const b=function(d){this._callback&&(this._callback(d),this._callback=null);}.bind(this);this.on("pipe",function(d){d.on("error",
  		b);});this.on("unpipe",function(d){d.removeListener("error",b);});a=null;}g._init.call(this,a);e.call(this);}const e=z("readable-stream").Duplex;A=z("inherits");const g=z("./BufferList");A(f,e);Object.assign(f.prototype,g.prototype);f.prototype._new=function(a){return new f(a)};f.prototype._write=function(a,b,d){this._appendBuffer(a);"function"===typeof d&&d();};f.prototype._read=function(a){if(!this.length)return this.push(null);a=Math.min(a,this.length);this.push(this.slice(0,a));this.consume(a);};f.prototype.end=
  		function(a){e.prototype.end.call(this,a);this._callback&&(this._callback(null,this.slice()),this._callback=null);};f.prototype._destroy=function(a,b){this.length=this._bufs.length=0;b(a);};f.prototype._isBufferList=function(a){return a instanceof f||a instanceof g||f.isBufferList(a)};f.isBufferList=g.isBufferList;O.exports=f;O.exports.BufferListStream=f;O.exports.BufferList=g;},{"./BufferList":27,inherits:105,"readable-stream":43}],29:[function(z,O,A){function f(b,d){b.prototype=Object.create(d.prototype);
  		b.prototype.constructor=b;b.__proto__=d;}function e(b,d,v){v||(v=Error);var m=function(r){function h(l,k,n){var w=r.call;l="string"===typeof d?d:d(l,k,n);return w.call(r,this,l)||this}f(h,r);return h}(v);m.prototype.name=v.name;m.prototype.code=b;a[b]=m;}function g(b,d){if(Array.isArray(b)){var v=b.length;b=b.map(function(m){return String(m)});return 2<v?"one of ".concat(d," ").concat(b.slice(0,v-1).join(", "),", or ")+b[v-1]:2===v?"one of ".concat(d," ").concat(b[0]," or ").concat(b[1]):"of ".concat(d,
  		" ").concat(b[0])}return "of ".concat(d," ").concat(String(b))}var a={};e("ERR_INVALID_OPT_VALUE",function(b,d){return 'The value "'+d+'" is invalid for option "'+b+'"'},TypeError);e("ERR_INVALID_ARG_TYPE",function(b,d,v){var m;if(m="string"===typeof d)m="not "===d.substr(0,4);m?(m="must not be",d=d.replace(/^not /,"")):m="must be";var r=void 0;if(void 0===r||r>b.length)r=b.length;" argument"===b.substring(r-9,r)?b="The ".concat(b," ").concat(m," ").concat(g(d,"type")):(r=void 0,"number"!==typeof r&&
  		(r=0),r=r+1>b.length?false:-1!==b.indexOf(".",r),r=r?"property":"argument",b='The "'.concat(b,'" ').concat(r," ").concat(m," ").concat(g(d,"type")));return b+=". Received type ".concat(typeof v)},TypeError);e("ERR_STREAM_PUSH_AFTER_EOF","stream.push() after EOF");e("ERR_METHOD_NOT_IMPLEMENTED",function(b){return "The "+b+" method is not implemented"});e("ERR_STREAM_PREMATURE_CLOSE","Premature close");e("ERR_STREAM_DESTROYED",function(b){return "Cannot call "+b+" after a stream was destroyed"});e("ERR_MULTIPLE_CALLBACK",
  		"Callback called multiple times");e("ERR_STREAM_CANNOT_PIPE","Cannot pipe, not readable");e("ERR_STREAM_WRITE_AFTER_END","write after end");e("ERR_STREAM_NULL_VALUES","May not write null values to stream",TypeError);e("ERR_UNKNOWN_ENCODING",function(b){return "Unknown encoding: "+b},TypeError);e("ERR_STREAM_UNSHIFT_AFTER_END_EVENT","stream.unshift() after end event");O.exports.codes=a;},{}],30:[function(z,O,A){(function(f){(function(){function e(h){if(!(this instanceof e))return new e(h);d.call(this,
  		h);v.call(this,h);this.allowHalfOpen=true;h&&(false===h.readable&&(this.readable=false),false===h.writable&&(this.writable=false),false===h.allowHalfOpen&&(this.allowHalfOpen=false,this.once("end",g)));}function g(){this._writableState.ended||f.nextTick(a,this);}function a(h){h.end();}var b=Object.keys||function(h){var l=[],k;for(k in h)l.push(k);return l};O.exports=e;var d=z("./_stream_readable"),v=z("./_stream_writable");z("inherits")(e,d);b=b(v.prototype);for(var m=0;m<b.length;m++){var r=b[m];e.prototype[r]||(e.prototype[r]=
  		v.prototype[r]);}Object.defineProperty(e.prototype,"writableHighWaterMark",{enumerable:false,get:function(){return this._writableState.highWaterMark}});Object.defineProperty(e.prototype,"writableBuffer",{enumerable:false,get:function(){return this._writableState&&this._writableState.getBuffer()}});Object.defineProperty(e.prototype,"writableLength",{enumerable:false,get:function(){return this._writableState.length}});Object.defineProperty(e.prototype,"destroyed",{enumerable:false,get:function(){return void 0===
  		this._readableState||void 0===this._writableState?false:this._readableState.destroyed&&this._writableState.destroyed},set:function(h){ void 0!==this._readableState&&void 0!==this._writableState&&(this._readableState.destroyed=h,this._writableState.destroyed=h);}});}).call(this);}).call(this,z("_process"));},{"./_stream_readable":32,"./_stream_writable":34,_process:133,inherits:105}],31:[function(z,O,A){function f(g){if(!(this instanceof f))return new f(g);e.call(this,g);}O.exports=f;var e=z("./_stream_transform");
  		z("inherits")(f,e);f.prototype._transform=function(g,a,b){b(null,g);};},{"./_stream_transform":33,inherits:105}],32:[function(z,O,A){(function(f,e){(function(){function g(L,M,Y){if("function"===typeof L.prependListener)return L.prependListener(M,Y);if(L._events&&L._events[M])Array.isArray(L._events[M])?L._events[M].unshift(Y):L._events[M]=[Y,L._events[M]];else L.on(M,Y);}function a(L,M,Y){S=S||z("./_stream_duplex");L=L||{};"boolean"!==typeof Y&&(Y=M instanceof S);this.objectMode=!!L.objectMode;Y&&(this.objectMode=
  		this.objectMode||!!L.readableObjectMode);this.highWaterMark=K(this,L,"readableHighWaterMark",Y);this.buffer=new G;this.length=0;this.pipes=null;this.pipesCount=0;this.flowing=null;this.reading=this.endEmitted=this.ended=false;this.sync=true;this.resumeScheduled=this.readableListening=this.emittedReadable=this.needReadable=false;this.paused=true;this.emitClose=false!==L.emitClose;this.autoDestroy=!!L.autoDestroy;this.destroyed=false;this.defaultEncoding=L.defaultEncoding||"utf8";this.awaitDrain=0;this.readingMore=
  		false;this.encoding=this.decoder=null;L.encoding&&(T||(T=z("string_decoder/").StringDecoder),this.decoder=new T(L.encoding),this.encoding=L.encoding);}function b(L){S=S||z("./_stream_duplex");if(!(this instanceof b))return new b(L);this._readableState=new a(L,this,this instanceof S);this.readable=true;L&&("function"===typeof L.read&&(this._read=L.read),"function"===typeof L.destroy&&(this._destroy=L.destroy));Z.call(this);}function d(L,M,Y,oa,ta){V("readableAddChunk",M);var sa=L._readableState;if(null===
  		M)sa.reading=false,V("onEofChunk"),sa.ended||(sa.decoder&&(M=sa.decoder.end())&&M.length&&(sa.buffer.push(M),sa.length+=sa.objectMode?1:M.length),sa.ended=true,sa.sync?r(L):(sa.needReadable=false,sa.emittedReadable||(sa.emittedReadable=true,h(L))));else {if(!ta){ta=M;var Ua;aa.isBuffer(ta)||ta instanceof P||"string"===typeof ta||void 0===ta||sa.objectMode||(Ua=new c("chunk",["string","Buffer","Uint8Array"],ta));var ua=Ua;}if(ua)ba(L,ua);else if(sa.objectMode||M&&0<M.length)if("string"===typeof M||sa.objectMode||
  		Object.getPrototypeOf(M)===aa.prototype||(M=aa.from(M)),oa)sa.endEmitted?ba(L,new H):v(L,sa,M,true);else if(sa.ended)ba(L,new p);else {if(sa.destroyed)return  false;sa.reading=false;sa.decoder&&!Y?(M=sa.decoder.write(M),sa.objectMode||0!==M.length?v(L,sa,M,false):l(L,sa)):v(L,sa,M,false);}else oa||(sa.reading=false,l(L,sa));}return !sa.ended&&(sa.length<sa.highWaterMark||0===sa.length)}function v(L,M,Y,oa){M.flowing&&0===M.length&&!M.sync?(M.awaitDrain=0,L.emit("data",Y)):(M.length+=M.objectMode?1:Y.length,oa?M.buffer.unshift(Y):
  		M.buffer.push(Y),M.needReadable&&r(L));l(L,M);}function m(L,M){if(0>=L||0===M.length&&M.ended)return 0;if(M.objectMode)return 1;if(L!==L)return M.flowing&&M.length?M.buffer.head.data.length:M.length;if(L>M.highWaterMark){var Y=L;1073741824<=Y?Y=1073741824:(Y--,Y|=Y>>>1,Y|=Y>>>2,Y|=Y>>>4,Y|=Y>>>8,Y|=Y>>>16,Y++);M.highWaterMark=Y;}return L<=M.length?L:M.ended?M.length:(M.needReadable=true,0)}function r(L){var M=L._readableState;V("emitReadable",M.needReadable,M.emittedReadable);M.needReadable=false;M.emittedReadable||
  		(V("emitReadable",M.flowing),M.emittedReadable=true,f.nextTick(h,L));}function h(L){var M=L._readableState;V("emitReadable_",M.destroyed,M.length,M.ended);M.destroyed||!M.length&&!M.ended||(L.emit("readable"),M.emittedReadable=false);M.needReadable=!M.flowing&&!M.ended&&M.length<=M.highWaterMark;y(L);}function l(L,M){M.readingMore||(M.readingMore=true,f.nextTick(k,L,M));}function k(L,M){for(;!M.reading&&!M.ended&&(M.length<M.highWaterMark||M.flowing&&0===M.length);){var Y=M.length;V("maybeReadMore read 0");
  		L.read(0);if(Y===M.length)break}M.readingMore=false;}function n(L){return function(){var M=L._readableState;V("pipeOnDrain",M.awaitDrain);M.awaitDrain&&M.awaitDrain--;0===M.awaitDrain&&L.listeners("data").length&&(M.flowing=true,y(L));}}function w(L){var M=L._readableState;M.readableListening=0<L.listenerCount("readable");M.resumeScheduled&&!M.paused?M.flowing=true:0<L.listenerCount("data")&&L.resume();}function t(L){V("readable nexttick read 0");L.read(0);}function u(L,M){V("resume",M.reading);M.reading||L.read(0);
  		M.resumeScheduled=false;L.emit("resume");y(L);M.flowing&&!M.reading&&L.read(0);}function y(L){var M=L._readableState;for(V("flow",M.flowing);M.flowing&&null!==L.read(););}function x(L,M){if(0===M.length)return null;M.objectMode?L=M.buffer.shift():!L||L>=M.length?(L=M.decoder?M.buffer.join(""):1===M.buffer.length?M.buffer.first():M.buffer.concat(M.length),M.buffer.clear()):L=M.buffer.consume(L,M.decoder);return L}function F(L){var M=L._readableState;V("endReadable",M.endEmitted);M.endEmitted||(M.ended=
  		true,f.nextTick(D,M,L));}function D(L,M){V("endReadableNT",L.endEmitted,L.length);L.endEmitted||0!==L.length||(L.endEmitted=true,M.readable=false,M.emit("end"),L.autoDestroy&&(L=M._writableState,(!L||L.autoDestroy&&L.finished)&&M.destroy()));}function I(L,M){for(var Y=0,oa=L.length;Y<oa;Y++)if(L[Y]===M)return Y;return  -1}O.exports=b;var S;b.ReadableState=a;z("events");var Z=z("./internal/streams/stream"),aa=z("buffer").Buffer,P=e.Uint8Array||function(){},R=z("util");var V=R&&R.debuglog?R.debuglog("stream"):
  		function(){};var G=z("./internal/streams/buffer_list");R=z("./internal/streams/destroy");var K=z("./internal/streams/state").getHighWaterMark,J=z("../errors").codes,c=J.ERR_INVALID_ARG_TYPE,p=J.ERR_STREAM_PUSH_AFTER_EOF,B=J.ERR_METHOD_NOT_IMPLEMENTED,H=J.ERR_STREAM_UNSHIFT_AFTER_END_EVENT,T,ia,X;z("inherits")(b,Z);var ba=R.errorOrDestroy,Q=["error","close","destroy","pause","resume"];Object.defineProperty(b.prototype,"destroyed",{enumerable:false,get:function(){return void 0===this._readableState?false:
  		this._readableState.destroyed},set:function(L){this._readableState&&(this._readableState.destroyed=L);}});b.prototype.destroy=R.destroy;b.prototype._undestroy=R.undestroy;b.prototype._destroy=function(L,M){M(L);};b.prototype.push=function(L,M){var Y=this._readableState;if(Y.objectMode)var oa=true;else "string"===typeof L&&(M=M||Y.defaultEncoding,M!==Y.encoding&&(L=aa.from(L,M),M=""),oa=true);return d(this,L,M,false,oa)};b.prototype.unshift=function(L){return d(this,L,null,true,false)};b.prototype.isPaused=function(){return  false===
  		this._readableState.flowing};b.prototype.setEncoding=function(L){T||(T=z("string_decoder/").StringDecoder);L=new T(L);this._readableState.decoder=L;this._readableState.encoding=this._readableState.decoder.encoding;for(var M=this._readableState.buffer.head,Y="";null!==M;)Y+=L.write(M.data),M=M.next;this._readableState.buffer.clear();""!==Y&&this._readableState.buffer.push(Y);this._readableState.length=Y.length;return this};b.prototype.read=function(L){V("read",L);L=parseInt(L,10);var M=this._readableState,
  		Y=L;0!==L&&(M.emittedReadable=false);if(0===L&&M.needReadable&&((0!==M.highWaterMark?M.length>=M.highWaterMark:0<M.length)||M.ended))return V("read: emitReadable",M.length,M.ended),0===M.length&&M.ended?F(this):r(this),null;L=m(L,M);if(0===L&&M.ended)return 0===M.length&&F(this),null;var oa=M.needReadable;V("need readable",oa);if(0===M.length||M.length-L<M.highWaterMark)oa=true,V("length less than watermark",oa);M.ended||M.reading?V("reading or ended",false):oa&&(V("do read"),M.reading=true,M.sync=true,0===M.length&&
  		(M.needReadable=true),this._read(M.highWaterMark),M.sync=false,M.reading||(L=m(Y,M)));oa=0<L?x(L,M):null;null===oa?(M.needReadable=M.length<=M.highWaterMark,L=0):(M.length-=L,M.awaitDrain=0);0===M.length&&(M.ended||(M.needReadable=true),Y!==L&&M.ended&&F(this));null!==oa&&this.emit("data",oa);return oa};b.prototype._read=function(L){ba(this,new B("_read()"));};b.prototype.pipe=function(L,M){function Y(ha,ja){V("onunpipe");ha===$a&&ja&&false===ja.hasUnpiped&&(ja.hasUnpiped=true,V("cleanup"),L.removeListener("close",
  		Ua),L.removeListener("finish",ua),L.removeListener("drain",ea),L.removeListener("error",sa),L.removeListener("unpipe",Y),$a.removeListener("end",oa),$a.removeListener("end",Za),$a.removeListener("data",ta),la=true,!da.awaitDrain||L._writableState&&!L._writableState.needDrain||ea());}function oa(){V("onend");L.end();}function ta(ha){V("ondata");ha=L.write(ha);V("dest.write",ha);false===ha&&((1===da.pipesCount&&da.pipes===L||1<da.pipesCount&&-1!==I(da.pipes,L))&&!la&&(V("false write response, pause",da.awaitDrain),
  		da.awaitDrain++),$a.pause());}function sa(ha){V("onerror",ha);Za();L.removeListener("error",sa);0===L.listeners("error").length&&ba(L,ha);}function Ua(){L.removeListener("finish",ua);Za();}function ua(){V("onfinish");L.removeListener("close",Ua);Za();}function Za(){V("unpipe");$a.unpipe(L);}var $a=this,da=this._readableState;switch(da.pipesCount){case 0:da.pipes=L;break;case 1:da.pipes=[da.pipes,L];break;default:da.pipes.push(L);}da.pipesCount+=1;V("pipe count=%d opts=%j",da.pipesCount,M);M=M&&false===M.end||
  		L===f.stdout||L===f.stderr?Za:oa;if(da.endEmitted)f.nextTick(M);else $a.once("end",M);L.on("unpipe",Y);var ea=n($a);L.on("drain",ea);var la=false;$a.on("data",ta);g(L,"error",sa);L.once("close",Ua);L.once("finish",ua);L.emit("pipe",$a);da.flowing||(V("pipe resume"),$a.resume());return L};b.prototype.unpipe=function(L){var M=this._readableState,Y={hasUnpiped:false};if(0===M.pipesCount)return this;if(1===M.pipesCount){if(L&&L!==M.pipes)return this;L||(L=M.pipes);M.pipes=null;M.pipesCount=0;M.flowing=false;L&&
  		L.emit("unpipe",this,Y);return this}if(!L){L=M.pipes;Y=M.pipesCount;M.pipes=null;M.pipesCount=0;M.flowing=false;for(M=0;M<Y;M++)L[M].emit("unpipe",this,{hasUnpiped:false});return this}var oa=I(M.pipes,L);if(-1===oa)return this;M.pipes.splice(oa,1);--M.pipesCount;1===M.pipesCount&&(M.pipes=M.pipes[0]);L.emit("unpipe",this,Y);return this};b.prototype.on=function(L,M){M=Z.prototype.on.call(this,L,M);var Y=this._readableState;"data"===L?(Y.readableListening=0<this.listenerCount("readable"),false!==Y.flowing&&
  		this.resume()):"readable"!==L||Y.endEmitted||Y.readableListening||(Y.readableListening=Y.needReadable=true,Y.flowing=false,Y.emittedReadable=false,V("on readable",Y.length,Y.reading),Y.length?r(this):Y.reading||f.nextTick(t,this));return M};b.prototype.addListener=b.prototype.on;b.prototype.removeListener=function(L,M){M=Z.prototype.removeListener.call(this,L,M);"readable"===L&&f.nextTick(w,this);return M};b.prototype.removeAllListeners=function(L){var M=Z.prototype.removeAllListeners.apply(this,arguments);
  		"readable"!==L&&void 0!==L||f.nextTick(w,this);return M};b.prototype.resume=function(){var L=this._readableState;L.flowing||(V("resume"),L.flowing=!L.readableListening,L.resumeScheduled||(L.resumeScheduled=true,f.nextTick(u,this,L)));L.paused=false;return this};b.prototype.pause=function(){V("call pause flowing=%j",this._readableState.flowing);false!==this._readableState.flowing&&(V("pause"),this._readableState.flowing=false,this.emit("pause"));this._readableState.paused=true;return this};b.prototype.wrap=function(L){var M=
  		this,Y=this._readableState,oa=false;L.on("end",function(){V("wrapped end");if(Y.decoder&&!Y.ended){var sa=Y.decoder.end();sa&&sa.length&&M.push(sa);}M.push(null);});L.on("data",function(sa){V("wrapped data");Y.decoder&&(sa=Y.decoder.write(sa));Y.objectMode&&(null===sa||void 0===sa)||!(Y.objectMode||sa&&sa.length)||M.push(sa)||(oa=true,L.pause());});for(var ta in L) void 0===this[ta]&&"function"===typeof L[ta]&&(this[ta]=function(sa){return function(){return L[sa].apply(L,arguments)}}(ta));for(ta=0;ta<Q.length;ta++)L.on(Q[ta],
  		this.emit.bind(this,Q[ta]));this._read=function(sa){V("wrapped _read",sa);oa&&(oa=false,L.resume());};return this};"function"===typeof Symbol&&(b.prototype[Symbol.asyncIterator]=function(){ void 0===ia&&(ia=z("./internal/streams/async_iterator"));return ia(this)});Object.defineProperty(b.prototype,"readableHighWaterMark",{enumerable:false,get:function(){return this._readableState.highWaterMark}});Object.defineProperty(b.prototype,"readableBuffer",{enumerable:false,get:function(){return this._readableState&&
  		this._readableState.buffer}});Object.defineProperty(b.prototype,"readableFlowing",{enumerable:false,get:function(){return this._readableState.flowing},set:function(L){this._readableState&&(this._readableState.flowing=L);}});b._fromList=x;Object.defineProperty(b.prototype,"readableLength",{enumerable:false,get:function(){return this._readableState.length}});"function"===typeof Symbol&&(b.from=function(L,M){ void 0===X&&(X=z("./internal/streams/from"));return X(b,L,M)});}).call(this);}).call(this,z("_process"),
  		"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{});},{"../errors":29,"./_stream_duplex":30,"./internal/streams/async_iterator":35,"./internal/streams/buffer_list":36,"./internal/streams/destroy":37,"./internal/streams/from":39,"./internal/streams/state":41,"./internal/streams/stream":42,_process:133,buffer:45,events:95,inherits:105,"string_decoder/":150,util:44}],33:[function(z,O,A){function f(h,l){var k=this._transformState;k.transforming=false;var n=
  		k.writecb;if(null===n)return this.emit("error",new d);k.writechunk=null;k.writecb=null;null!=l&&this.push(l);n(h);h=this._readableState;h.reading=false;(h.needReadable||h.length<h.highWaterMark)&&this._read(h.highWaterMark);}function e(h){if(!(this instanceof e))return new e(h);r.call(this,h);this._transformState={afterTransform:f.bind(this),needTransform:false,transforming:false,writecb:null,writechunk:null,writeencoding:null};this._readableState.needReadable=true;this._readableState.sync=false;h&&("function"===
  		typeof h.transform&&(this._transform=h.transform),"function"===typeof h.flush&&(this._flush=h.flush));this.on("prefinish",g);}function g(){var h=this;"function"!==typeof this._flush||this._readableState.destroyed?a(this,null,null):this._flush(function(l,k){a(h,l,k);});}function a(h,l,k){if(l)return h.emit("error",l);null!=k&&h.push(k);if(h._writableState.length)throw new m;if(h._transformState.transforming)throw new v;return h.push(null)}O.exports=e;O=z("../errors").codes;var b=O.ERR_METHOD_NOT_IMPLEMENTED,
  		d=O.ERR_MULTIPLE_CALLBACK,v=O.ERR_TRANSFORM_ALREADY_TRANSFORMING,m=O.ERR_TRANSFORM_WITH_LENGTH_0,r=z("./_stream_duplex");z("inherits")(e,r);e.prototype.push=function(h,l){this._transformState.needTransform=false;return r.prototype.push.call(this,h,l)};e.prototype._transform=function(h,l,k){k(new b("_transform()"));};e.prototype._write=function(h,l,k){var n=this._transformState;n.writecb=k;n.writechunk=h;n.writeencoding=l;n.transforming||(h=this._readableState,(n.needTransform||h.needReadable||h.length<
  		h.highWaterMark)&&this._read(h.highWaterMark));};e.prototype._read=function(h){h=this._transformState;null===h.writechunk||h.transforming?h.needTransform=true:(h.transforming=true,this._transform(h.writechunk,h.writeencoding,h.afterTransform));};e.prototype._destroy=function(h,l){r.prototype._destroy.call(this,h,function(k){l(k);});};},{"../errors":29,"./_stream_duplex":30,inherits:105}],34:[function(z,O,A){(function(f,e){(function(){function g(c){var p=this;this.entry=this.next=null;this.finish=function(){var B=
  		p.entry;for(p.entry=null;B;){var H=B.callback;c.pendingcb--;H(void 0);B=B.next;}c.corkedRequestsFree.next=p;};}function a(){}function b(c,p,B){n=n||z("./_stream_duplex");c=c||{};"boolean"!==typeof B&&(B=p instanceof n);this.objectMode=!!c.objectMode;B&&(this.objectMode=this.objectMode||!!c.writableObjectMode);this.highWaterMark=F(this,c,"writableHighWaterMark",B);this.destroyed=this.finished=this.ended=this.ending=this.needDrain=this.finalCalled=false;this.decodeStrings=false!==c.decodeStrings;this.defaultEncoding=
  		c.defaultEncoding||"utf8";this.length=0;this.writing=false;this.corked=0;this.sync=true;this.bufferProcessing=false;this.onwrite=function(H){var T=p._writableState,ia=T.sync,X=T.writecb;if("function"!==typeof X)throw new Z;T.writing=false;T.writecb=null;T.length-=T.writelen;T.writelen=0;H?(--T.pendingcb,ia?(f.nextTick(X,H),f.nextTick(k,p,T),p._writableState.errorEmitted=true,K(p,H)):(X(H),p._writableState.errorEmitted=true,K(p,H),k(p,T))):((H=h(T)||p.destroyed)||T.corked||T.bufferProcessing||!T.bufferedRequest||
  		r(p,T),ia?f.nextTick(m,p,T,H,X):m(p,T,H,X));};this.writecb=null;this.writelen=0;this.lastBufferedRequest=this.bufferedRequest=null;this.pendingcb=0;this.errorEmitted=this.prefinished=false;this.emitClose=false!==c.emitClose;this.autoDestroy=!!c.autoDestroy;this.bufferedRequestCount=0;this.corkedRequestsFree=new g(this);}function d(c){n=n||z("./_stream_duplex");var p=this instanceof n;if(!p&&!J.call(d,this))return new d(c);this._writableState=new b(c,this,p);this.writable=true;c&&("function"===typeof c.write&&
  		(this._write=c.write),"function"===typeof c.writev&&(this._writev=c.writev),"function"===typeof c.destroy&&(this._destroy=c.destroy),"function"===typeof c.final&&(this._final=c.final));t.call(this);}function v(c,p,B,H,T,ia,X){p.writelen=H;p.writecb=X;p.writing=true;p.sync=true;if(p.destroyed)p.onwrite(new P("write"));else B?c._writev(T,p.onwrite):c._write(T,ia,p.onwrite);p.sync=false;}function m(c,p,B,H){!B&&0===p.length&&p.needDrain&&(p.needDrain=false,c.emit("drain"));p.pendingcb--;H();k(c,p);}function r(c,
  		p){p.bufferProcessing=true;var B=p.bufferedRequest;if(c._writev&&B&&B.next){var H=Array(p.bufferedRequestCount),T=p.corkedRequestsFree;T.entry=B;for(var ia=0,X=true;B;)H[ia]=B,B.isBuf||(X=false),B=B.next,ia+=1;H.allBuffers=X;v(c,p,true,p.length,H,"",T.finish);p.pendingcb++;p.lastBufferedRequest=null;T.next?(p.corkedRequestsFree=T.next,T.next=null):p.corkedRequestsFree=new g(p);p.bufferedRequestCount=0;}else {for(;B&&(H=B.chunk,v(c,p,false,p.objectMode?1:H.length,H,B.encoding,B.callback),B=B.next,p.bufferedRequestCount--,
  		!p.writing););null===B&&(p.lastBufferedRequest=null);}p.bufferedRequest=B;p.bufferProcessing=false;}function h(c){return c.ending&&0===c.length&&null===c.bufferedRequest&&!c.finished&&!c.writing}function l(c,p){c._final(function(B){p.pendingcb--;B&&K(c,B);p.prefinished=true;c.emit("prefinish");k(c,p);});}function k(c,p){var B=h(p);B&&(p.prefinished||p.finalCalled||("function"!==typeof c._final||p.destroyed?(p.prefinished=true,c.emit("prefinish")):(p.pendingcb++,p.finalCalled=true,f.nextTick(l,c,p))),0===p.pendingcb&&
  		(p.finished=true,c.emit("finish"),p.autoDestroy&&(p=c._readableState,(!p||p.autoDestroy&&p.endEmitted)&&c.destroy())));return B}O.exports=d;var n;d.WritableState=b;var w={deprecate:z("util-deprecate")},t=z("./internal/streams/stream"),u=z("buffer").Buffer,y=e.Uint8Array||function(){},x=z("./internal/streams/destroy"),F=z("./internal/streams/state").getHighWaterMark,D=z("../errors").codes,I=D.ERR_INVALID_ARG_TYPE,S=D.ERR_METHOD_NOT_IMPLEMENTED,Z=D.ERR_MULTIPLE_CALLBACK,aa=D.ERR_STREAM_CANNOT_PIPE,P=
  		D.ERR_STREAM_DESTROYED,R=D.ERR_STREAM_NULL_VALUES,V=D.ERR_STREAM_WRITE_AFTER_END,G=D.ERR_UNKNOWN_ENCODING,K=x.errorOrDestroy;z("inherits")(d,t);b.prototype.getBuffer=function(){for(var c=this.bufferedRequest,p=[];c;)p.push(c),c=c.next;return p};(function(){try{Object.defineProperty(b.prototype,"buffer",{get:w.deprecate(function(){return this.getBuffer()},"_writableState.buffer is deprecated. Use _writableState.getBuffer instead.","DEP0003")});}catch(c){}})();if("function"===typeof Symbol&&Symbol.hasInstance&&
  		"function"===typeof Function.prototype[Symbol.hasInstance]){var J=Function.prototype[Symbol.hasInstance];Object.defineProperty(d,Symbol.hasInstance,{value:function(c){return J.call(this,c)?true:this!==d?false:c&&c._writableState instanceof b}});}else J=function(c){return c instanceof this};d.prototype.pipe=function(){K(this,new aa);};d.prototype.write=function(c,p,B){var H=this._writableState,T=false,ia;if(ia=!H.objectMode)ia=c,ia=u.isBuffer(ia)||ia instanceof y;ia&&!u.isBuffer(c)&&(c=u.from(c));"function"===
  		typeof p&&(B=p,p=null);ia?p="buffer":p||(p=H.defaultEncoding);"function"!==typeof B&&(B=a);if(H.ending)H=B,B=new V,K(this,B),f.nextTick(H,B);else {var X;if(!(X=ia)){X=c;var ba=B,Q;null===X?Q=new R:"string"===typeof X||H.objectMode||(Q=new I("chunk",["string","Buffer"],X));Q?(K(this,Q),f.nextTick(ba,Q),X=false):X=true;}X&&(H.pendingcb++,T=ia,T||(Q=c,H.objectMode||false===H.decodeStrings||"string"!==typeof Q||(Q=u.from(Q,p)),c!==Q&&(T=true,p="buffer",c=Q)),ia=H.objectMode?1:c.length,H.length+=ia,Q=H.length<H.highWaterMark,
  		Q||(H.needDrain=true),H.writing||H.corked?(ia=H.lastBufferedRequest,H.lastBufferedRequest={chunk:c,encoding:p,isBuf:T,callback:B,next:null},ia?ia.next=H.lastBufferedRequest:H.bufferedRequest=H.lastBufferedRequest,H.bufferedRequestCount+=1):v(this,H,false,ia,c,p,B),T=Q);}return T};d.prototype.cork=function(){this._writableState.corked++;};d.prototype.uncork=function(){var c=this._writableState;c.corked&&(c.corked--,c.writing||c.corked||c.bufferProcessing||!c.bufferedRequest||r(this,c));};d.prototype.setDefaultEncoding=
  		function(c){"string"===typeof c&&(c=c.toLowerCase());if(!(-1<"hex utf8 utf-8 ascii binary base64 ucs2 ucs-2 utf16le utf-16le raw".split(" ").indexOf((c+"").toLowerCase())))throw new G(c);this._writableState.defaultEncoding=c;return this};Object.defineProperty(d.prototype,"writableBuffer",{enumerable:false,get:function(){return this._writableState&&this._writableState.getBuffer()}});Object.defineProperty(d.prototype,"writableHighWaterMark",{enumerable:false,get:function(){return this._writableState.highWaterMark}});
  		d.prototype._write=function(c,p,B){B(new S("_write()"));};d.prototype._writev=null;d.prototype.end=function(c,p,B){var H=this._writableState;"function"===typeof c?(B=c,p=c=null):"function"===typeof p&&(B=p,p=null);null!==c&&void 0!==c&&this.write(c,p);H.corked&&(H.corked=1,this.uncork());if(!H.ending){c=B;H.ending=true;k(this,H);if(c)if(H.finished)f.nextTick(c);else this.once("finish",c);H.ended=true;this.writable=false;}return this};Object.defineProperty(d.prototype,"writableLength",{enumerable:false,get:function(){return this._writableState.length}});
  		Object.defineProperty(d.prototype,"destroyed",{enumerable:false,get:function(){return void 0===this._writableState?false:this._writableState.destroyed},set:function(c){this._writableState&&(this._writableState.destroyed=c);}});d.prototype.destroy=x.destroy;d.prototype._undestroy=x.undestroy;d.prototype._destroy=function(c,p){p(c);};}).call(this);}).call(this,z("_process"),"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{});},{"../errors":29,"./_stream_duplex":30,
  		"./internal/streams/destroy":37,"./internal/streams/state":41,"./internal/streams/stream":42,_process:133,buffer:45,inherits:105,"util-deprecate":152}],35:[function(z,O,A){(function(f){(function(){function e(x,F,D){F in x?Object.defineProperty(x,F,{value:D,enumerable:true,configurable:true,writable:true}):x[F]=D;return x}function g(x,F){return {value:x,done:F}}function a(x){var F=x[r];if(null!==F){var D=x[t].read();null!==D&&(x[n]=null,x[r]=null,x[h]=null,F(g(D,false)));}}function b(x){f.nextTick(a,x);}function d(x,
  		F){return function(D,I){x.then(function(){if(F[k])D(g(void 0,true));else F[w](D,I);},I);}}var v,m=z("./end-of-stream"),r=Symbol("lastResolve"),h=Symbol("lastReject"),l=Symbol("error"),k=Symbol("ended"),n=Symbol("lastPromise"),w=Symbol("handlePromise"),t=Symbol("stream"),u=Object.getPrototypeOf(function(){}),y=Object.setPrototypeOf((v={get stream(){return this[t]},next:function(){var x=this,F=this[l];if(null!==F)return Promise.reject(F);if(this[k])return Promise.resolve(g(void 0,true));if(this[t].destroyed)return new Promise(function(D,
  		I){f.nextTick(function(){x[l]?I(x[l]):D(g(void 0,true));});});if(F=this[n])F=new Promise(d(F,this));else {F=this[t].read();if(null!==F)return Promise.resolve(g(F,false));F=new Promise(this[w]);}return this[n]=F}},e(v,Symbol.asyncIterator,function(){return this}),e(v,"return",function(){var x=this;return new Promise(function(F,D){x[t].destroy(null,function(I){I?D(I):F(g(void 0,true));});})}),v),u);O.exports=function(x){var F,D=Object.create(y,(F={},e(F,t,{value:x,writable:true}),e(F,r,{value:null,writable:true}),e(F,
  		h,{value:null,writable:true}),e(F,l,{value:null,writable:true}),e(F,k,{value:x._readableState.endEmitted,writable:true}),e(F,w,{value:function(I,S){var Z=D[t].read();Z?(D[n]=null,D[r]=null,D[h]=null,I(g(Z,false))):(D[r]=I,D[h]=S);},writable:true}),F));D[n]=null;m(x,function(I){if(I&&"ERR_STREAM_PREMATURE_CLOSE"!==I.code){var S=D[h];null!==S&&(D[n]=null,D[r]=null,D[h]=null,S(I));D[l]=I;}else I=D[r],null!==I&&(D[n]=null,D[r]=null,D[h]=null,I(g(void 0,true))),D[k]=true;});x.on("readable",b.bind(null,D));return D};}).call(this);}).call(this,
  		z("_process"));},{"./end-of-stream":38,_process:133}],36:[function(z,O,A){function f(m,r){var h=Object.keys(m);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(m);r&&(l=l.filter(function(k){return Object.getOwnPropertyDescriptor(m,k).enumerable}));h.push.apply(h,l);}return h}function e(m){for(var r=1;r<arguments.length;r++){var h=null!=arguments[r]?arguments[r]:{};r%2?f(Object(h),true).forEach(function(l){var k=h[l];l in m?Object.defineProperty(m,l,{value:k,enumerable:true,configurable:true,
  		writable:true}):m[l]=k;}):Object.getOwnPropertyDescriptors?Object.defineProperties(m,Object.getOwnPropertyDescriptors(h)):f(Object(h)).forEach(function(l){Object.defineProperty(m,l,Object.getOwnPropertyDescriptor(h,l));});}return m}function g(m,r){for(var h=0;h<r.length;h++){var l=r[h];l.enumerable=l.enumerable||false;l.configurable=true;"value"in l&&(l.writable=true);Object.defineProperty(m,l.key,l);}}function a(m,r,h){r&&g(m.prototype,r);return m}var b=z("buffer").Buffer,d=z("util").inspect,v=d&&d.custom||
  		"inspect";O.exports=function(){function m(){if(!(this instanceof m))throw new TypeError("Cannot call a class as a function");this.tail=this.head=null;this.length=0;}a(m,[{key:"push",value:function(r){r={data:r,next:null};0<this.length?this.tail.next=r:this.head=r;this.tail=r;++this.length;}},{key:"unshift",value:function(r){r={data:r,next:this.head};0===this.length&&(this.tail=r);this.head=r;++this.length;}},{key:"shift",value:function(){if(0!==this.length){var r=this.head.data;this.head=1===this.length?
  		this.tail=null:this.head.next;--this.length;return r}}},{key:"clear",value:function(){this.head=this.tail=null;this.length=0;}},{key:"join",value:function(r){if(0===this.length)return "";for(var h=this.head,l=""+h.data;h=h.next;)l+=r+h.data;return l}},{key:"concat",value:function(r){if(0===this.length)return b.alloc(0);r=b.allocUnsafe(r>>>0);for(var h=this.head,l=0;h;)b.prototype.copy.call(h.data,r,l),l+=h.data.length,h=h.next;return r}},{key:"consume",value:function(r,h){r<this.head.data.length?(h=
  		this.head.data.slice(0,r),this.head.data=this.head.data.slice(r)):h=r===this.head.data.length?this.shift():h?this._getString(r):this._getBuffer(r);return h}},{key:"first",value:function(){return this.head.data}},{key:"_getString",value:function(r){var h=this.head,l=1,k=h.data;for(r-=k.length;h=h.next;){var n=h.data,w=r>n.length?n.length:r;k=w===n.length?k+n:k+n.slice(0,r);r-=w;if(0===r){w===n.length?(++l,this.head=h.next?h.next:this.tail=null):(this.head=h,h.data=n.slice(w));break}++l;}this.length-=
  		l;return k}},{key:"_getBuffer",value:function(r){var h=b.allocUnsafe(r),l=this.head,k=1;l.data.copy(h);for(r-=l.data.length;l=l.next;){var n=l.data,w=r>n.length?n.length:r;n.copy(h,h.length-r,0,w);r-=w;if(0===r){w===n.length?(++k,this.head=l.next?l.next:this.tail=null):(this.head=l,l.data=n.slice(w));break}++k;}this.length-=k;return h}},{key:v,value:function(r,h){return d(this,e({},h,{depth:0,customInspect:false}))}}]);return m}();},{buffer:45,util:44}],37:[function(z,O,A){(function(f){(function(){function e(b,
  		d){a(b,d);g(b);}function g(b){b._writableState&&!b._writableState.emitClose||b._readableState&&!b._readableState.emitClose||b.emit("close");}function a(b,d){b.emit("error",d);}O.exports={destroy:function(b,d){var v=this,m=this._writableState&&this._writableState.destroyed;if(this._readableState&&this._readableState.destroyed||m)return d?d(b):b&&(this._writableState?this._writableState.errorEmitted||(this._writableState.errorEmitted=true,f.nextTick(a,this,b)):f.nextTick(a,this,b)),this;this._readableState&&
  		(this._readableState.destroyed=true);this._writableState&&(this._writableState.destroyed=true);this._destroy(b||null,function(r){!d&&r?v._writableState?v._writableState.errorEmitted?f.nextTick(g,v):(v._writableState.errorEmitted=true,f.nextTick(e,v,r)):f.nextTick(e,v,r):d?(f.nextTick(g,v),d(r)):f.nextTick(g,v);});return this},undestroy:function(){this._readableState&&(this._readableState.destroyed=false,this._readableState.reading=false,this._readableState.ended=false,this._readableState.endEmitted=false);this._writableState&&
  		(this._writableState.destroyed=false,this._writableState.ended=false,this._writableState.ending=false,this._writableState.finalCalled=false,this._writableState.prefinished=false,this._writableState.finished=false,this._writableState.errorEmitted=false);},errorOrDestroy:function(b,d){var v=b._readableState,m=b._writableState;v&&v.autoDestroy||m&&m.autoDestroy?b.destroy(d):b.emit("error",d);}};}).call(this);}).call(this,z("_process"));},{_process:133}],38:[function(z,O,A){function f(b){var d=false;return function(){if(!d){d=true;
  		for(var v=arguments.length,m=Array(v),r=0;r<v;r++)m[r]=arguments[r];b.apply(this,m);}}}function e(){}function g(b,d,v){if("function"===typeof d)return g(b,null,d);d||(d={});v=f(v||e);var m=d.readable||false!==d.readable&&b.readable,r=d.writable||false!==d.writable&&b.writable,h=function(){b.writable||k();},l=b._writableState&&b._writableState.finished,k=function(){r=false;l=true;m||v.call(b);},n=b._readableState&&b._readableState.endEmitted,w=function(){m=false;n=true;r||v.call(b);},t=function(x){v.call(b,x);},u=function(){var x;
  		if(m&&!n)return b._readableState&&b._readableState.ended||(x=new a),v.call(b,x);if(r&&!l)return b._writableState&&b._writableState.ended||(x=new a),v.call(b,x)},y=function(){b.req.on("finish",k);};if(b.setHeader&&"function"===typeof b.abort)if(b.on("complete",k),b.on("abort",u),b.req)y();else b.on("request",y);else r&&!b._writableState&&(b.on("end",h),b.on("close",h));b.on("end",w);b.on("finish",k);if(false!==d.error)b.on("error",t);b.on("close",u);return function(){b.removeListener("complete",k);b.removeListener("abort",
  		u);b.removeListener("request",y);b.req&&b.req.removeListener("finish",k);b.removeListener("end",h);b.removeListener("close",h);b.removeListener("finish",k);b.removeListener("end",w);b.removeListener("error",t);b.removeListener("close",u);}}var a=z("../../../errors").codes.ERR_STREAM_PREMATURE_CLOSE;O.exports=g;},{"../../../errors":29}],39:[function(z,O,A){O.exports=function(){throw Error("Readable.from is not available in the browser");};},{}],40:[function(z,O,A){function f(r){var h=false;return function(){h||
  		(h=true,r.apply(void 0,arguments));}}function e(r){if(r)throw r;}function g(r,h,l,k){k=f(k);var n=false;r.on("close",function(){n=true;});void 0===d&&(d=z("./end-of-stream"));d(r,{readable:h,writable:l},function(t){if(t)return k(t);n=true;k();});var w=false;return function(t){if(!n&&!w){w=true;if(r.setHeader&&"function"===typeof r.abort)return r.abort();if("function"===typeof r.destroy)return r.destroy();k(t||new m("pipe"));}}}function a(r){r();}function b(r,h){return r.pipe(h)}var d;A=z("../../../errors").codes;var v=
  		A.ERR_MISSING_ARGS,m=A.ERR_STREAM_DESTROYED;O.exports=function(){for(var r=arguments.length,h=Array(r),l=0;l<r;l++)h[l]=arguments[l];var k=h.length?"function"!==typeof h[h.length-1]?e:h.pop():e;Array.isArray(h[0])&&(h=h[0]);if(2>h.length)throw new v("streams");var n,w=h.map(function(t,u){var y=u<h.length-1;return g(t,y,0<u,function(x){n||(n=x);x&&w.forEach(a);y||(w.forEach(a),k(n));})});return h.reduce(b)};},{"../../../errors":29,"./end-of-stream":38}],41:[function(z,O,A){var f=z("../../../errors").codes.ERR_INVALID_OPT_VALUE;
  		O.exports={getHighWaterMark:function(e,g,a,b){g=null!=g.highWaterMark?g.highWaterMark:b?g[a]:null;if(null!=g){if(!isFinite(g)||Math.floor(g)!==g||0>g)throw new f(b?a:"highWaterMark",g);return Math.floor(g)}return e.objectMode?16:16384}};},{"../../../errors":29}],42:[function(z,O,A){O.exports=z("events").EventEmitter;},{events:95}],43:[function(z,O,A){A=O.exports=z("./lib/_stream_readable.js");A.Stream=A;A.Readable=A;A.Writable=z("./lib/_stream_writable.js");A.Duplex=z("./lib/_stream_duplex.js");A.Transform=
  		z("./lib/_stream_transform.js");A.PassThrough=z("./lib/_stream_passthrough.js");A.finished=z("./lib/internal/streams/end-of-stream.js");A.pipeline=z("./lib/internal/streams/pipeline.js");},{"./lib/_stream_duplex.js":30,"./lib/_stream_passthrough.js":31,"./lib/_stream_readable.js":32,"./lib/_stream_transform.js":33,"./lib/_stream_writable.js":34,"./lib/internal/streams/end-of-stream.js":38,"./lib/internal/streams/pipeline.js":40}],44:[function(z,O,A){},{}],45:[function(z,O,A){(function(f){(function(){function e(c){if(c>
  		G)throw new RangeError('The value "'+c+'" is invalid for option "size"');c=new Uint8Array(c);c.__proto__=g.prototype;return c}function g(c,p,B){if("number"===typeof c){if("string"===typeof p)throw new TypeError('The "string" argument must be of type string. Received type number');return d(c)}return a(c,p,B)}function a(c,p,B){if("string"===typeof c){var H=p;if("string"!==typeof H||""===H)H="utf8";if(!g.isEncoding(H))throw new TypeError("Unknown encoding: "+H);p=h(c,H)|0;B=e(p);c=B.write(c,H);c!==p&&
  		(B=B.slice(0,c));return B}if(ArrayBuffer.isView(c))return v(c);if(null==c)throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type "+typeof c);if(P(c,ArrayBuffer)||c&&P(c.buffer,ArrayBuffer)){if(0>p||c.byteLength<p)throw new RangeError('"offset" is outside of buffer bounds');if(c.byteLength<p+(B||0))throw new RangeError('"length" is outside of buffer bounds');c=void 0===p&&void 0===B?new Uint8Array(c):void 0===B?new Uint8Array(c,
  		p):new Uint8Array(c,p,B);c.__proto__=g.prototype;return c}if("number"===typeof c)throw new TypeError('The "value" argument must not be of type number. Received type number');H=c.valueOf&&c.valueOf();if(null!=H&&H!==c)return g.from(H,p,B);if(H=m(c))return H;if("undefined"!==typeof Symbol&&null!=Symbol.toPrimitive&&"function"===typeof c[Symbol.toPrimitive])return g.from(c[Symbol.toPrimitive]("string"),p,B);throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type "+
  		typeof c);}function b(c){if("number"!==typeof c)throw new TypeError('"size" argument must be of type number');if(0>c)throw new RangeError('The value "'+c+'" is invalid for option "size"');}function d(c){b(c);return e(0>c?0:r(c)|0)}function v(c){for(var p=0>c.length?0:r(c.length)|0,B=e(p),H=0;H<p;H+=1)B[H]=c[H]&255;return B}function m(c){if(g.isBuffer(c)){var p=r(c.length)|0,B=e(p);if(0===B.length)return B;c.copy(B,0,0,p);return B}if(void 0!==c.length)return (p="number"!==typeof c.length)||(p=c.length,
  		p=p!==p),p?e(0):v(c);if("Buffer"===c.type&&Array.isArray(c.data))return v(c.data)}function r(c){if(c>=G)throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x"+G.toString(16)+" bytes");return c|0}function h(c,p){if(g.isBuffer(c))return c.length;if(ArrayBuffer.isView(c)||P(c,ArrayBuffer))return c.byteLength;if("string"!==typeof c)throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type '+typeof c);var B=c.length,H=2<arguments.length&&
  		true===arguments[2];if(!H&&0===B)return 0;for(var T=false;;)switch(p){case "ascii":case "latin1":case "binary":return B;case "utf8":case "utf-8":return I(c).length;case "ucs2":case "ucs-2":case "utf16le":case "utf-16le":return 2*B;case "hex":return B>>>1;case "base64":return Z(c).length;default:if(T)return H?-1:I(c).length;p=(""+p).toLowerCase();T=true;}}function l(c,p,B){var H=false;if(void 0===p||0>p)p=0;if(p>this.length)return "";if(void 0===B||B>this.length)B=this.length;if(0>=B)return "";B>>>=0;p>>>=0;if(B<=
  		p)return "";for(c||(c="utf8");;)switch(c){case "hex":c=p;p=B;B=this.length;if(!c||0>c)c=0;if(!p||0>p||p>B)p=B;H="";for(B=c;B<p;++B)c=H,H=this[B],H=16>H?"0"+H.toString(16):H.toString(16),H=c+H;return H;case "utf8":case "utf-8":return t(this,p,B);case "ascii":c="";for(B=Math.min(this.length,B);p<B;++p)c+=String.fromCharCode(this[p]&127);return c;case "latin1":case "binary":c="";for(B=Math.min(this.length,B);p<B;++p)c+=String.fromCharCode(this[p]);return c;case "base64":return p=0===p&&B===this.length?
  		R.fromByteArray(this):R.fromByteArray(this.slice(p,B)),p;case "ucs2":case "ucs-2":case "utf16le":case "utf-16le":p=this.slice(p,B);B="";for(c=0;c<p.length;c+=2)B+=String.fromCharCode(p[c]+256*p[c+1]);return B;default:if(H)throw new TypeError("Unknown encoding: "+c);c=(c+"").toLowerCase();H=true;}}function k(c,p,B){var H=c[p];c[p]=c[B];c[B]=H;}function n(c,p,B,H,T){if(0===c.length)return  -1;"string"===typeof B?(H=B,B=0):2147483647<B?B=2147483647:-2147483648>B&&(B=-2147483648);B=+B;B!==B&&(B=T?0:c.length-
  		1);0>B&&(B=c.length+B);if(B>=c.length){if(T)return  -1;B=c.length-1;}else if(0>B)if(T)B=0;else return  -1;"string"===typeof p&&(p=g.from(p,H));if(g.isBuffer(p))return 0===p.length?-1:w(c,p,B,H,T);if("number"===typeof p)return p&=255,"function"===typeof Uint8Array.prototype.indexOf?T?Uint8Array.prototype.indexOf.call(c,p,B):Uint8Array.prototype.lastIndexOf.call(c,p,B):w(c,[p],B,H,T);throw new TypeError("val must be string, number or Buffer");}function w(c,p,B,H,T){function ia(L,M){return 1===X?L[M]:L.readUInt16BE(M*
  		X)}var X=1,ba=c.length,Q=p.length;if(void 0!==H&&(H=String(H).toLowerCase(),"ucs2"===H||"ucs-2"===H||"utf16le"===H||"utf-16le"===H)){if(2>c.length||2>p.length)return  -1;X=2;ba/=2;Q/=2;B/=2;}if(T)for(H=-1;B<ba;B++)if(ia(c,B)===ia(p,-1===H?0:B-H)){if(-1===H&&(H=B),B-H+1===Q)return H*X}else  -1!==H&&(B-=B-H),H=-1;else for(B+Q>ba&&(B=ba-Q);0<=B;B--){ba=true;for(H=0;H<Q;H++)if(ia(c,B+H)!==ia(p,H)){ba=false;break}if(ba)return B}return  -1}function t(c,p,B){B=Math.min(c.length,B);for(var H=[];p<B;){var T=c[p],ia=null,
  		X=239<T?4:223<T?3:191<T?2:1;if(p+X<=B)switch(X){case 1:128>T&&(ia=T);break;case 2:var ba=c[p+1];128===(ba&192)&&(T=(T&31)<<6|ba&63,127<T&&(ia=T));break;case 3:ba=c[p+1];var Q=c[p+2];128===(ba&192)&&128===(Q&192)&&(T=(T&15)<<12|(ba&63)<<6|Q&63,2047<T&&(55296>T||57343<T)&&(ia=T));break;case 4:ba=c[p+1];Q=c[p+2];var L=c[p+3];128===(ba&192)&&128===(Q&192)&&128===(L&192)&&(T=(T&15)<<18|(ba&63)<<12|(Q&63)<<6|L&63,65535<T&&1114112>T&&(ia=T));}null===ia?(ia=65533,X=1):65535<ia&&(ia-=65536,H.push(ia>>>10&1023|
  		55296),ia=56320|ia&1023);H.push(ia);p+=X;}c=H.length;if(c<=K)H=String.fromCharCode.apply(String,H);else {B="";for(p=0;p<c;)B+=String.fromCharCode.apply(String,H.slice(p,p+=K));H=B;}return H}function u(c,p,B){if(0!==c%1||0>c)throw new RangeError("offset is not uint");if(c+p>B)throw new RangeError("Trying to access beyond buffer length");}function y(c,p,B,H,T,ia){if(!g.isBuffer(c))throw new TypeError('"buffer" argument must be a Buffer instance');if(p>T||p<ia)throw new RangeError('"value" argument is out of bounds');
  		if(B+H>c.length)throw new RangeError("Index out of range");}function x(c,p,B,H,T,ia){if(B+H>c.length)throw new RangeError("Index out of range");if(0>B)throw new RangeError("Index out of range");}function F(c,p,B,H,T){p=+p;B>>>=0;T||x(c,p,B,4);V.write(c,p,B,H,23,4);return B+4}function D(c,p,B,H,T){p=+p;B>>>=0;T||x(c,p,B,8);V.write(c,p,B,H,52,8);return B+8}function I(c,p){p=p||Infinity;for(var B,H=c.length,T=
  		null,ia=[],X=0;X<H;++X){B=c.charCodeAt(X);if(55295<B&&57344>B){if(!T){if(56319<B){ -1<(p-=3)&&ia.push(239,191,189);continue}else if(X+1===H){ -1<(p-=3)&&ia.push(239,191,189);continue}T=B;continue}if(56320>B){ -1<(p-=3)&&ia.push(239,191,189);T=B;continue}B=(T-55296<<10|B-56320)+65536;}else T&&-1<(p-=3)&&ia.push(239,191,189);T=null;if(128>B){if(0>--p)break;ia.push(B);}else if(2048>B){if(0>(p-=2))break;ia.push(B>>6|192,B&63|128);}else if(65536>B){if(0>(p-=3))break;ia.push(B>>12|224,B>>6&63|128,B&63|128);}else if(1114112>
  		B){if(0>(p-=4))break;ia.push(B>>18|240,B>>12&63|128,B>>6&63|128,B&63|128);}else throw Error("Invalid code point");}return ia}function S(c){for(var p=[],B=0;B<c.length;++B)p.push(c.charCodeAt(B)&255);return p}function Z(c){var p=R,B=p.toByteArray;c=c.split("=")[0];c=c.trim().replace(J,"");if(2>c.length)c="";else for(;0!==c.length%4;)c+="=";return B.call(p,c)}function aa(c,p,B,H){for(var T=0;T<H&&!(T+B>=p.length||T>=c.length);++T)p[T+B]=c[T];return T}function P(c,p){return c instanceof p||null!=c&&null!=
  		c.constructor&&null!=c.constructor.name&&c.constructor.name===p.name}var R=z("base64-js"),V=z("ieee754");A.Buffer=g;A.SlowBuffer=function(c){+c!=c&&(c=0);return g.alloc(+c)};A.INSPECT_MAX_BYTES=50;var G=2147483647;A.kMaxLength=G;g.TYPED_ARRAY_SUPPORT=function(){try{var c=new Uint8Array(1);c.__proto__={__proto__:Uint8Array.prototype,foo:function(){return 42}};return 42===c.foo()}catch(p){return  false}}();g.TYPED_ARRAY_SUPPORT||"undefined"===typeof console||"function"!==typeof console.error||console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.");
  		Object.defineProperty(g.prototype,"parent",{enumerable:true,get:function(){if(g.isBuffer(this))return this.buffer}});Object.defineProperty(g.prototype,"offset",{enumerable:true,get:function(){if(g.isBuffer(this))return this.byteOffset}});"undefined"!==typeof Symbol&&null!=Symbol.species&&g[Symbol.species]===g&&Object.defineProperty(g,Symbol.species,{value:null,configurable:true,enumerable:false,writable:false});g.poolSize=8192;g.from=function(c,p,B){return a(c,p,B)};g.prototype.__proto__=Uint8Array.prototype;
  		g.__proto__=Uint8Array;g.alloc=function(c,p,B){b(c);c=0>=c?e(c):void 0!==p?"string"===typeof B?e(c).fill(p,B):e(c).fill(p):e(c);return c};g.allocUnsafe=function(c){return d(c)};g.allocUnsafeSlow=function(c){return d(c)};g.isBuffer=function(c){return null!=c&&true===c._isBuffer&&c!==g.prototype};g.compare=function(c,p){P(c,Uint8Array)&&(c=g.from(c,c.offset,c.byteLength));P(p,Uint8Array)&&(p=g.from(p,p.offset,p.byteLength));if(!g.isBuffer(c)||!g.isBuffer(p))throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
  		if(c===p)return 0;for(var B=c.length,H=p.length,T=0,ia=Math.min(B,H);T<ia;++T)if(c[T]!==p[T]){B=c[T];H=p[T];break}return B<H?-1:H<B?1:0};g.isEncoding=function(c){switch(String(c).toLowerCase()){case "hex":case "utf8":case "utf-8":case "ascii":case "latin1":case "binary":case "base64":case "ucs2":case "ucs-2":case "utf16le":case "utf-16le":return  true;default:return  false}};g.concat=function(c,p){if(!Array.isArray(c))throw new TypeError('"list" argument must be an Array of Buffers');if(0===c.length)return g.alloc(0);
  		var B;if(void 0===p)for(B=p=0;B<c.length;++B)p+=c[B].length;p=g.allocUnsafe(p);var H=0;for(B=0;B<c.length;++B){var T=c[B];P(T,Uint8Array)&&(T=g.from(T));if(!g.isBuffer(T))throw new TypeError('"list" argument must be an Array of Buffers');T.copy(p,H);H+=T.length;}return p};g.byteLength=h;g.prototype._isBuffer=true;g.prototype.swap16=function(){var c=this.length;if(0!==c%2)throw new RangeError("Buffer size must be a multiple of 16-bits");for(var p=0;p<c;p+=2)k(this,p,p+1);return this};g.prototype.swap32=
  		function(){var c=this.length;if(0!==c%4)throw new RangeError("Buffer size must be a multiple of 32-bits");for(var p=0;p<c;p+=4)k(this,p,p+3),k(this,p+1,p+2);return this};g.prototype.swap64=function(){var c=this.length;if(0!==c%8)throw new RangeError("Buffer size must be a multiple of 64-bits");for(var p=0;p<c;p+=8)k(this,p,p+7),k(this,p+1,p+6),k(this,p+2,p+5),k(this,p+3,p+4);return this};g.prototype.toString=function(){var c=this.length;return 0===c?"":0===arguments.length?t(this,0,c):l.apply(this,
  		arguments)};g.prototype.toLocaleString=g.prototype.toString;g.prototype.equals=function(c){if(!g.isBuffer(c))throw new TypeError("Argument must be a Buffer");return this===c?true:0===g.compare(this,c)};g.prototype.inspect=function(){var c=A.INSPECT_MAX_BYTES;var p=this.toString("hex",0,c).replace(/(.{2})/g,"$1 ").trim();this.length>c&&(p+=" ... ");return "<Buffer "+p+">"};g.prototype.compare=function(c,p,B,H,T){P(c,Uint8Array)&&(c=g.from(c,c.offset,c.byteLength));if(!g.isBuffer(c))throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type '+
  		typeof c);void 0===p&&(p=0);void 0===B&&(B=c?c.length:0);void 0===H&&(H=0);void 0===T&&(T=this.length);if(0>p||B>c.length||0>H||T>this.length)throw new RangeError("out of range index");if(H>=T&&p>=B)return 0;if(H>=T)return  -1;if(p>=B)return 1;p>>>=0;B>>>=0;H>>>=0;T>>>=0;if(this===c)return 0;var ia=T-H,X=B-p,ba=Math.min(ia,X);H=this.slice(H,T);c=c.slice(p,B);for(p=0;p<ba;++p)if(H[p]!==c[p]){ia=H[p];X=c[p];break}return ia<X?-1:X<ia?1:0};g.prototype.includes=function(c,p,B){return  -1!==this.indexOf(c,
  		p,B)};g.prototype.indexOf=function(c,p,B){return n(this,c,p,B,true)};g.prototype.lastIndexOf=function(c,p,B){return n(this,c,p,B,false)};g.prototype.write=function(c,p,B,H){if(void 0===p)H="utf8",B=this.length,p=0;else if(void 0===B&&"string"===typeof p)H=p,B=this.length,p=0;else if(isFinite(p))p>>>=0,isFinite(B)?(B>>>=0,void 0===H&&(H="utf8")):(H=B,B=void 0);else throw Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");var T=this.length-p;if(void 0===B||B>T)B=T;if(0<c.length&&
  		(0>B||0>p)||p>this.length)throw new RangeError("Attempt to write outside buffer bounds");H||(H="utf8");for(T=false;;)switch(H){case "hex":a:{p=Number(p)||0;H=this.length-p;B?(B=Number(B),B>H&&(B=H)):B=H;H=c.length;B>H/2&&(B=H/2);for(H=0;H<B;++H){T=parseInt(c.substr(2*H,2),16);if(T!==T){c=H;break a}this[p+H]=T;}c=H;}return c;case "utf8":case "utf-8":return aa(I(c,this.length-p),this,p,B);case "ascii":return aa(S(c),this,p,B);case "latin1":case "binary":return aa(S(c),this,p,B);case "base64":return aa(Z(c),
  		this,p,B);case "ucs2":case "ucs-2":case "utf16le":case "utf-16le":H=c;T=this.length-p;for(var ia=[],X=0;X<H.length&&!(0>(T-=2));++X){var ba=H.charCodeAt(X);c=ba>>8;ba%=256;ia.push(ba);ia.push(c);}return aa(ia,this,p,B);default:if(T)throw new TypeError("Unknown encoding: "+H);H=(""+H).toLowerCase();T=true;}};g.prototype.toJSON=function(){return {type:"Buffer",data:Array.prototype.slice.call(this._arr||this,0)}};var K=4096;g.prototype.slice=function(c,p){var B=this.length;c=~~c;p=void 0===p?B:~~p;0>c?(c+=
  		B,0>c&&(c=0)):c>B&&(c=B);0>p?(p+=B,0>p&&(p=0)):p>B&&(p=B);p<c&&(p=c);c=this.subarray(c,p);c.__proto__=g.prototype;return c};g.prototype.readUIntLE=function(c,p,B){c>>>=0;p>>>=0;B||u(c,p,this.length);B=this[c];for(var H=1,T=0;++T<p&&(H*=256);)B+=this[c+T]*H;return B};g.prototype.readUIntBE=function(c,p,B){c>>>=0;p>>>=0;B||u(c,p,this.length);B=this[c+--p];for(var H=1;0<p&&(H*=256);)B+=this[c+--p]*H;return B};g.prototype.readUInt8=function(c,p){c>>>=0;p||u(c,1,this.length);return this[c]};g.prototype.readUInt16LE=
  		function(c,p){c>>>=0;p||u(c,2,this.length);return this[c]|this[c+1]<<8};g.prototype.readUInt16BE=function(c,p){c>>>=0;p||u(c,2,this.length);return this[c]<<8|this[c+1]};g.prototype.readUInt32LE=function(c,p){c>>>=0;p||u(c,4,this.length);return (this[c]|this[c+1]<<8|this[c+2]<<16)+16777216*this[c+3]};g.prototype.readUInt32BE=function(c,p){c>>>=0;p||u(c,4,this.length);return 16777216*this[c]+(this[c+1]<<16|this[c+2]<<8|this[c+3])};g.prototype.readIntLE=function(c,p,B){c>>>=0;p>>>=0;B||u(c,p,this.length);
  		B=this[c];for(var H=1,T=0;++T<p&&(H*=256);)B+=this[c+T]*H;B>=128*H&&(B-=Math.pow(2,8*p));return B};g.prototype.readIntBE=function(c,p,B){c>>>=0;p>>>=0;B||u(c,p,this.length);B=p;for(var H=1,T=this[c+--B];0<B&&(H*=256);)T+=this[c+--B]*H;T>=128*H&&(T-=Math.pow(2,8*p));return T};g.prototype.readInt8=function(c,p){c>>>=0;p||u(c,1,this.length);return this[c]&128?-1*(255-this[c]+1):this[c]};g.prototype.readInt16LE=function(c,p){c>>>=0;p||u(c,2,this.length);c=this[c]|this[c+1]<<8;return c&32768?c|4294901760:
  		c};g.prototype.readInt16BE=function(c,p){c>>>=0;p||u(c,2,this.length);c=this[c+1]|this[c]<<8;return c&32768?c|4294901760:c};g.prototype.readInt32LE=function(c,p){c>>>=0;p||u(c,4,this.length);return this[c]|this[c+1]<<8|this[c+2]<<16|this[c+3]<<24};g.prototype.readInt32BE=function(c,p){c>>>=0;p||u(c,4,this.length);return this[c]<<24|this[c+1]<<16|this[c+2]<<8|this[c+3]};g.prototype.readFloatLE=function(c,p){c>>>=0;p||u(c,4,this.length);return V.read(this,c,true,23,4)};g.prototype.readFloatBE=function(c,
  		p){c>>>=0;p||u(c,4,this.length);return V.read(this,c,false,23,4)};g.prototype.readDoubleLE=function(c,p){c>>>=0;p||u(c,8,this.length);return V.read(this,c,true,52,8)};g.prototype.readDoubleBE=function(c,p){c>>>=0;p||u(c,8,this.length);return V.read(this,c,false,52,8)};g.prototype.writeUIntLE=function(c,p,B,H){c=+c;p>>>=0;B>>>=0;H||y(this,c,p,B,Math.pow(2,8*B)-1,0);H=1;var T=0;for(this[p]=c&255;++T<B&&(H*=256);)this[p+T]=c/H&255;return p+B};g.prototype.writeUIntBE=function(c,p,B,H){c=+c;p>>>=0;B>>>=0;H||y(this,
  		c,p,B,Math.pow(2,8*B)-1,0);H=B-1;var T=1;for(this[p+H]=c&255;0<=--H&&(T*=256);)this[p+H]=c/T&255;return p+B};g.prototype.writeUInt8=function(c,p,B){c=+c;p>>>=0;B||y(this,c,p,1,255,0);this[p]=c&255;return p+1};g.prototype.writeUInt16LE=function(c,p,B){c=+c;p>>>=0;B||y(this,c,p,2,65535,0);this[p]=c&255;this[p+1]=c>>>8;return p+2};g.prototype.writeUInt16BE=function(c,p,B){c=+c;p>>>=0;B||y(this,c,p,2,65535,0);this[p]=c>>>8;this[p+1]=c&255;return p+2};g.prototype.writeUInt32LE=function(c,p,B){c=+c;p>>>=
  		0;B||y(this,c,p,4,4294967295,0);this[p+3]=c>>>24;this[p+2]=c>>>16;this[p+1]=c>>>8;this[p]=c&255;return p+4};g.prototype.writeUInt32BE=function(c,p,B){c=+c;p>>>=0;B||y(this,c,p,4,4294967295,0);this[p]=c>>>24;this[p+1]=c>>>16;this[p+2]=c>>>8;this[p+3]=c&255;return p+4};g.prototype.writeIntLE=function(c,p,B,H){c=+c;p>>>=0;H||(H=Math.pow(2,8*B-1),y(this,c,p,B,H-1,-H));H=0;var T=1,ia=0;for(this[p]=c&255;++H<B&&(T*=256);)0>c&&0===ia&&0!==this[p+H-1]&&(ia=1),this[p+H]=(c/T>>0)-ia&255;return p+B};g.prototype.writeIntBE=
  		function(c,p,B,H){c=+c;p>>>=0;H||(H=Math.pow(2,8*B-1),y(this,c,p,B,H-1,-H));H=B-1;var T=1,ia=0;for(this[p+H]=c&255;0<=--H&&(T*=256);)0>c&&0===ia&&0!==this[p+H+1]&&(ia=1),this[p+H]=(c/T>>0)-ia&255;return p+B};g.prototype.writeInt8=function(c,p,B){c=+c;p>>>=0;B||y(this,c,p,1,127,-128);0>c&&(c=255+c+1);this[p]=c&255;return p+1};g.prototype.writeInt16LE=function(c,p,B){c=+c;p>>>=0;B||y(this,c,p,2,32767,-32768);this[p]=c&255;this[p+1]=c>>>8;return p+2};g.prototype.writeInt16BE=function(c,p,B){c=+c;p>>>=
  		0;B||y(this,c,p,2,32767,-32768);this[p]=c>>>8;this[p+1]=c&255;return p+2};g.prototype.writeInt32LE=function(c,p,B){c=+c;p>>>=0;B||y(this,c,p,4,2147483647,-2147483648);this[p]=c&255;this[p+1]=c>>>8;this[p+2]=c>>>16;this[p+3]=c>>>24;return p+4};g.prototype.writeInt32BE=function(c,p,B){c=+c;p>>>=0;B||y(this,c,p,4,2147483647,-2147483648);0>c&&(c=4294967295+c+1);this[p]=c>>>24;this[p+1]=c>>>16;this[p+2]=c>>>8;this[p+3]=c&255;return p+4};g.prototype.writeFloatLE=function(c,p,B){return F(this,c,p,true,B)};
  		g.prototype.writeFloatBE=function(c,p,B){return F(this,c,p,false,B)};g.prototype.writeDoubleLE=function(c,p,B){return D(this,c,p,true,B)};g.prototype.writeDoubleBE=function(c,p,B){return D(this,c,p,false,B)};g.prototype.copy=function(c,p,B,H){if(!g.isBuffer(c))throw new TypeError("argument should be a Buffer");B||(B=0);H||0===H||(H=this.length);p>=c.length&&(p=c.length);p||(p=0);0<H&&H<B&&(H=B);if(H===B||0===c.length||0===this.length)return 0;if(0>p)throw new RangeError("targetStart out of bounds");if(0>
  		B||B>=this.length)throw new RangeError("Index out of range");if(0>H)throw new RangeError("sourceEnd out of bounds");H>this.length&&(H=this.length);c.length-p<H-B&&(H=c.length-p+B);var T=H-B;if(this===c&&"function"===typeof Uint8Array.prototype.copyWithin)this.copyWithin(p,B,H);else if(this===c&&B<p&&p<H)for(H=T-1;0<=H;--H)c[H+p]=this[H+B];else Uint8Array.prototype.set.call(c,this.subarray(B,H),p);return T};g.prototype.fill=function(c,p,B,H){if("string"===typeof c){"string"===typeof p?(H=p,p=0,B=this.length):
  		"string"===typeof B&&(H=B,B=this.length);if(void 0!==H&&"string"!==typeof H)throw new TypeError("encoding must be a string");if("string"===typeof H&&!g.isEncoding(H))throw new TypeError("Unknown encoding: "+H);if(1===c.length){var T=c.charCodeAt(0);if("utf8"===H&&128>T||"latin1"===H)c=T;}}else "number"===typeof c&&(c&=255);if(0>p||this.length<p||this.length<B)throw new RangeError("Out of range index");if(B<=p)return this;p>>>=0;B=void 0===B?this.length:B>>>0;c||(c=0);if("number"===typeof c)for(H=p;H<
  		B;++H)this[H]=c;else {T=g.isBuffer(c)?c:g.from(c,H);var ia=T.length;if(0===ia)throw new TypeError('The value "'+c+'" is invalid for argument "value"');for(H=0;H<B-p;++H)this[H+p]=T[H%ia];}return this};var J=/[^+/0-9A-Za-z-_]/g;}).call(this);}).call(this,z("buffer").Buffer);},{"base64-js":26,buffer:45,ieee754:104}],46:[function(z,O,A){var f=z("get-intrinsic"),e=z("./"),g=e(f("String.prototype.indexOf"));O.exports=function(a,b){b=f(a,!!b);return "function"===typeof b&&-1<g(a,".prototype.")?e(b):b};},{"./":47,
  		"get-intrinsic":99}],47:[function(z,O,A){var f=z("function-bind");z=z("get-intrinsic");var e=z("%Function.prototype.apply%"),g=z("%Function.prototype.call%"),a=z("%Reflect.apply%",true)||f.call(g,e),b=z("%Object.getOwnPropertyDescriptor%",true),d=z("%Object.defineProperty%",true),v=z("%Math.max%");if(d)try{d({},"a",{value:1});}catch(m){d=null;}O.exports=function(m){var r=a(f,g,arguments);b&&d&&b(r,"length").configurable&&d(r,"length",{value:1+v(0,m.length-(arguments.length-1))});return r};z=function(){return a(f,
  		e,arguments)};d?d(O.exports,"apply",{value:z}):O.exports.apply=z;},{"function-bind":98,"get-intrinsic":99}],48:[function(z,O,A){A.Commented=z("./commented");A.Diagnose=z("./diagnose");A.Decoder=z("./decoder");A.Encoder=z("./encoder");A.Simple=z("./simple");A.Tagged=z("./tagged");A.Map=z("./map");A.comment=A.Commented.comment;A.decodeAll=A.Decoder.decodeAll;A.decodeFirst=A.Decoder.decodeFirst;A.decodeAllSync=A.Decoder.decodeAllSync;A.decodeFirstSync=A.Decoder.decodeFirstSync;A.diagnose=A.Diagnose.diagnose;
  		A.encode=A.Encoder.encode;A.encodeCanonical=A.Encoder.encodeCanonical;A.encodeOne=A.Encoder.encodeOne;A.encodeAsync=A.Encoder.encodeAsync;A.decode=A.Decoder.decodeFirstSync;A.leveldb={decode:A.Decoder.decodeFirstSync,encode:A.Encoder.encode,buffer:true,name:"cbor"};A.reset=function(){A.Encoder.reset();A.Tagged.reset();};},{"./commented":49,"./decoder":51,"./diagnose":52,"./encoder":53,"./map":54,"./simple":55,"./tagged":56}],49:[function(z,O,A){function f(h,l){switch(typeof h){case "function":return {options:{},
  		cb:h};case "string":return {options:{encoding:h},cb:l};case "number":return {options:{max_depth:h},cb:l};case "object":return {options:h||{},cb:l};default:throw new TypeError("Unknown option type");}}A=z("stream");const e=z("./utils"),g=z("./decoder"),a=z("nofilter"),{MT:b,NUMBYTES:d,SYMS:v}=z("./constants"),{Buffer:m}=z("buffer");class r extends A.Transform{constructor(h={}){const {depth:l=1,max_depth:k=10,no_summary:n=false,tags:w={},preferWeb:t,encoding:u,...y}=h;super({...y,readableObjectMode:false,writableObjectMode:false});
  		this.depth=l;this.max_depth=k;this.all=new a;w[24]||(w[24]=this._tag_24.bind(this));this.parser=new g({tags:w,max_depth:k,preferWeb:t,encoding:u});this.parser.on("value",this._on_value.bind(this));this.parser.on("start",this._on_start.bind(this));this.parser.on("start-string",this._on_start_string.bind(this));this.parser.on("stop",this._on_stop.bind(this));this.parser.on("more-bytes",this._on_more.bind(this));this.parser.on("error",this._on_error.bind(this));if(!n)this.parser.on("data",this._on_data.bind(this));
  		this.parser.bs.on("read",this._on_read.bind(this));}_tag_24(h){const l=new r({depth:this.depth+1,no_summary:true});l.on("data",k=>this.push(k));l.on("error",k=>this.emit("error",k));l.end(h);}_transform(h,l,k){this.parser.write(h,l,k);}_flush(h){return this.parser._flush(h)}static comment(h,l={},k=null){if(null==h)throw Error("input required");({options:l,cb:k}=f(l,k));const n=new a,{encoding:w="hex",...t}=l,u=new r(t);l=null;"function"===typeof k?(u.on("end",()=>{k(null,n.toString("utf8"));}),u.on("error",
  		k)):l=new Promise((y,x)=>{u.on("end",()=>{y(n.toString("utf8"));});u.on("error",x);});u.pipe(n);e.guessEncoding(h,w).pipe(u);return l}_on_error(h){this.push("ERROR: ");this.push(h.toString());this.push("\n");}_on_read(h){this.all.write(h);h=h.toString("hex");this.push(Array(this.depth+1).join("  "));this.push(h);h=2*(this.max_depth-this.depth)-h.length;1>h&&(h=1);this.push(Array(h+1).join(" "));this.push("-- ");}_on_more(h,l,k,n){k="";this.depth++;switch(h){case b.POS_INT:k="Positive number,";break;case b.NEG_INT:k=
  		"Negative number,";break;case b.ARRAY:k="Array, length";break;case b.MAP:k="Map, count";break;case b.BYTE_STRING:k="Bytes, length";break;case b.UTF8_STRING:k="String, length";break;case b.SIMPLE_FLOAT:k=1===l?"Simple value,":"Float,";}this.push(`${k} next ${l} byte${1<l?"s":""}\n`);}_on_start_string(h,l,k,n){k="";this.depth++;switch(h){case b.BYTE_STRING:k=`Bytes, length: ${l}`;break;case b.UTF8_STRING:k=`String, length: ${l.toString()}`;}this.push(`${k}\n`);}_on_start(h,l,k,n){this.depth++;switch(k){case b.ARRAY:this.push(`[${n}], `);
  		break;case b.MAP:n%2?this.push(`{Val:${Math.floor(n/2)}}, `):this.push(`{Key:${Math.floor(n/2)}}, `);}switch(h){case b.TAG:this.push(`Tag #${l}`);24===l&&this.push(" Encoded CBOR data item");break;case b.ARRAY:l===v.STREAM?this.push("Array (streaming)"):this.push(`Array, ${l} item${1<l?"s":""}`);break;case b.MAP:l===v.STREAM?this.push("Map (streaming)"):this.push(`Map, ${l} pair${1<l?"s":""}`);break;case b.BYTE_STRING:this.push("Bytes (streaming)");break;case b.UTF8_STRING:this.push("String (streaming)");}this.push("\n");}_on_stop(h){this.depth--;}_on_value(h,
  		l,k,n){if(h!==v.BREAK)switch(l){case b.ARRAY:this.push(`[${k}], `);break;case b.MAP:k%2?this.push(`{Val:${Math.floor(k/2)}}, `):this.push(`{Key:${Math.floor(k/2)}}, `);}l=e.cborValueToString(h,-Infinity);"string"===typeof h||m.isBuffer(h)?(0<h.length&&(this.push(l),this.push("\n")),this.depth--):(this.push(l),this.push("\n"));switch(n){case d.ONE:case d.TWO:case d.FOUR:case d.EIGHT:this.depth--;}}_on_data(){this.push("0x");this.push(this.all.read().toString("hex"));this.push("\n");}}O.exports=r;},{"./constants":50,
  		"./decoder":51,"./utils":57,buffer:45,nofilter:131,stream:135}],50:[function(z,O,A){A.MT={POS_INT:0,NEG_INT:1,BYTE_STRING:2,UTF8_STRING:3,ARRAY:4,MAP:5,TAG:6,SIMPLE_FLOAT:7};A.TAG={DATE_STRING:0,DATE_EPOCH:1,POS_BIGINT:2,NEG_BIGINT:3,DECIMAL_FRAC:4,BIGFLOAT:5,BASE64URL_EXPECTED:21,BASE64_EXPECTED:22,BASE16_EXPECTED:23,CBOR:24,URI:32,BASE64URL:33,BASE64:34,REGEXP:35,MIME:36,SET:258};A.NUMBYTES={ZERO:0,ONE:24,TWO:25,FOUR:26,EIGHT:27,INDEFINITE:31};A.SIMPLE={FALSE:20,TRUE:21,NULL:22,UNDEFINED:23};A.SYMS=
  		{NULL:Symbol.for("github.com/hildjj/node-cbor/null"),UNDEFINED:Symbol.for("github.com/hildjj/node-cbor/undef"),PARENT:Symbol.for("github.com/hildjj/node-cbor/parent"),BREAK:Symbol.for("github.com/hildjj/node-cbor/break"),STREAM:Symbol.for("github.com/hildjj/node-cbor/stream")};A.SHIFT32=4294967296;A.BI={MINUS_ONE:BigInt(-1),NEG_MAX:BigInt(-1)-BigInt(Number.MAX_SAFE_INTEGER),MAXINT32:BigInt("0xffffffff"),MAXINT64:BigInt("0xffffffffffffffff"),SHIFT32:BigInt(A.SHIFT32)};},{}],51:[function(z,O,A){function f(F,
  		D,I){const S=[];S[n]=I;S[h.PARENT]=F;S[w]=D;return S}function e(F,D){switch(typeof F){case "function":return {options:{},cb:F};case "string":return {options:{encoding:F},cb:D};case "object":return {options:F||{},cb:D};default:throw new TypeError("Unknown option type");}}A=z("../vendor/binary-parse-stream");const g=z("./tagged"),a=z("./simple"),b=z("./utils"),d=z("nofilter");z("stream");const v=z("./constants"),{MT:m,NUMBYTES:r,SYMS:h,BI:l}=v,{Buffer:k}=z("buffer"),n=Symbol("count"),w=Symbol("major type"),
  		t=Symbol("error"),u=Symbol("not found");class y extends Error{constructor(F,D){super(`Unexpected data: 0x${F.toString(16)}`);this.name="UnexpectedDataError";this.byte=F;this.value=D;}}class x extends A{constructor(F={}){const {tags:D={},max_depth:I=-1,preferWeb:S=false,required:Z=false,encoding:aa="hex",extendedResults:P=false,preventDuplicateKeys:R=false,...V}=F;super({defaultEncoding:aa,...V});this.running=true;this.max_depth=I;this.tags=D;this.preferWeb=S;this.extendedResults=P;this.required=Z;this.preventDuplicateKeys=
  		R;P&&(this.bs.on("read",this._onRead.bind(this)),this.valueBytes=new d);}static nullcheck(F){switch(F){case h.NULL:return null;case h.UNDEFINED:break;case u:throw Error("Value not found");default:return F}}static decodeFirstSync(F,D={}){if(null==F)throw new TypeError("input required");({options:D}=e(D));const {encoding:I="hex",...S}=D;D=new x(S);F=b.guessEncoding(F,I);var Z=D._parse();let aa=Z.next();for(;!aa.done;){const P=F.read(aa.value);if(null==P||P.length!==aa.value)throw Error("Insufficient data");
  		D.extendedResults&&D.valueBytes.write(P);aa=Z.next(P);}if(D.extendedResults)D=aa.value,D.unused=F.read();else if(D=x.nullcheck(aa.value),0<F.length)throw Z=F.read(1),F.unshift(Z),new y(Z[0],D);return D}static decodeAllSync(F,D={}){if(null==F)throw new TypeError("input required");({options:D}=e(D));const {encoding:I="hex",...S}=D;D=new x(S);F=b.guessEncoding(F,I);const Z=[];for(;0<F.length;){const aa=D._parse();let P=aa.next();for(;!P.done;){const R=F.read(P.value);if(null==R||R.length!==P.value)throw Error("Insufficient data");
  		D.extendedResults&&D.valueBytes.write(R);P=aa.next(R);}Z.push(x.nullcheck(P.value));}return Z}static decodeFirst(F,D={},I=null){if(null==F)throw new TypeError("input required");({options:D,cb:I}=e(D,I));const {encoding:S="hex",required:Z=false,...aa}=D,P=new x(aa);let R=u;F=b.guessEncoding(F,S);D=new Promise((V,G)=>{P.on("data",K=>{R=x.nullcheck(K);P.close();});P.once("error",K=>{if(P.extendedResults&&K instanceof y)return R.unused=P.bs.slice(),V(R);R!==u&&(K.value=R);R=t;P.close();return G(K)});P.once("end",
  		()=>{switch(R){case u:return Z?G(Error("No CBOR found")):V(R);case t:break;default:return V(R)}});});"function"===typeof I&&D.then(V=>I(null,V),I);F.pipe(P);return D}static decodeAll(F,D={},I=null){if(null==F)throw new TypeError("input required");({options:D,cb:I}=e(D,I));const {encoding:S="hex",...Z}=D,aa=new x(Z),P=[];aa.on("data",R=>P.push(x.nullcheck(R)));D=new Promise((R,V)=>{aa.on("error",V);aa.on("end",()=>R(P));});"function"===typeof I&&D.then(R=>I(void 0,R),R=>I(R,void 0));b.guessEncoding(F,
  		S).pipe(aa);return D}close(){this.running=false;this.__fresh=true;}_onRead(F){this.valueBytes.write(F);}*_parse(){for(var F=null,D=0,I;;){if(0<=this.max_depth&&D>this.max_depth)throw Error(`Maximum depth ${this.max_depth} exceeded`);[I]=yield 1;if(!this.running)throw this.bs.unshift(k.from([I])),new y(I);var S=I>>5,Z=I&31,aa=null==F?void 0:F[w];const P=null==F?void 0:F.length;switch(Z){case r.ONE:this.emit("more-bytes",S,1,aa,P);[I]=yield 1;break;case r.TWO:case r.FOUR:case r.EIGHT:I=1<<Z-24;this.emit("more-bytes",
  		S,I,aa,P);I=yield I;I=S===m.SIMPLE_FLOAT?I:b.parseCBORint(Z,I);break;case 28:case 29:case 30:throw this.running=false,Error(`Additional info not implemented: ${Z}`);case r.INDEFINITE:switch(S){case m.POS_INT:case m.NEG_INT:case m.TAG:throw Error(`Invalid indefinite encoding for MT ${S}`);}I=-1;break;default:I=Z;}switch(S){case m.NEG_INT:I=I===Number.MAX_SAFE_INTEGER?l.NEG_MAX:"bigint"===typeof I?l.MINUS_ONE-I:-1-I;break;case m.BYTE_STRING:case m.UTF8_STRING:switch(I){case 0:this.emit("start-string",S,
  		I,aa,P);I=S===m.UTF8_STRING?"":this.preferWeb?new Uint8Array(0):k.allocUnsafe(0);break;case -1:this.emit("start",S,h.STREAM,aa,P);I=new d;I[n]=-1;I[h.PARENT]=F;I[w]=S;F=I;D++;continue;default:this.emit("start-string",S,I,aa,P),I=yield I,S===m.UTF8_STRING?I=b.utf8(I):this.preferWeb&&(I=new Uint8Array(I.buffer,I.byteOffset,I.length));}break;case m.ARRAY:case m.MAP:switch(I){case 0:I=S===m.MAP?{}:[];break;case -1:this.emit("start",S,h.STREAM,aa,P);F=f(F,S,-1);D++;continue;default:this.emit("start",S,
  		I,aa,P);F=f(F,S,I*(S-3));D++;continue}break;case m.TAG:this.emit("start",S,I,aa,P);F=f(F,S,1);F.push(I);D++;continue;case m.SIMPLE_FLOAT:if("number"===typeof I){if(Z===r.ONE&&32>I)throw Error(`Invalid two-byte encoding of simple value ${I}`);const R=null!=F;I=a.decode(I,R,R&&0>F[n]);}else I=b.parseCBORfloat(I);}this.emit("value",I,aa,P,Z);for(Z=false;null!=F;){if(I===h.BREAK)F[n]=1;else if(Array.isArray(F))F.push(I);else {aa=F[w];if(null!=aa&&aa!==S)throw this.running=false,Error("Invalid major type in indefinite encoding");
  		F.write(I);}if(0!==--F[n]){Z=true;break}--D;delete F[n];if(Array.isArray(F))switch(F[w]){case m.ARRAY:I=F;break;case m.MAP:I=true;if(0!==F.length%2)throw Error(`Invalid map length: ${F.length}`);for(let R=0,V=F.length;R<V;R+=2)if("string"!==typeof F[R]||"__proto__"===F[R]){I=false;break}if(I){I={};for(let R=0,V=F.length;R<V;R+=2){if(this.preventDuplicateKeys&&Object.prototype.hasOwnProperty.call(I,F[R]))throw Error("Duplicate keys in a map");I[F[R]]=F[R+1];}}else {I=new Map;for(let R=0,V=F.length;R<V;R+=2){if(this.preventDuplicateKeys&&
  		I.has(F[R]))throw Error("Duplicate keys in a map");I.set(F[R],F[R+1]);}}break;case m.TAG:I=(new g(F[0],F[1])).convert(this.tags);}else if(F instanceof d)switch(F[w]){case m.BYTE_STRING:I=F.slice();this.preferWeb&&(I=new Uint8Array(I.buffer,I.byteOffset,I.length));break;case m.UTF8_STRING:I=F.toString("utf-8");}this.emit("stop",F[w]);aa=F;F=F[h.PARENT];delete aa[h.PARENT];delete aa[w];}if(!Z)return this.extendedResults?(D=this.valueBytes.slice(),D={value:x.nullcheck(I),bytes:D,length:D.length},this.valueBytes=
  		new d,D):I}}}x.NOT_FOUND=u;O.exports=x;},{"../vendor/binary-parse-stream":58,"./constants":50,"./simple":55,"./tagged":56,"./utils":57,buffer:45,nofilter:131,stream:135}],52:[function(z,O,A){A=z("stream");const f=z("./decoder"),e=z("./utils"),g=z("nofilter"),{MT:a,SYMS:b}=z("./constants");class d extends A.Transform{constructor(v={}){const {separator:m="\n",stream_errors:r=false,tags:h,max_depth:l,preferWeb:k,encoding:n,...w}=v;super({...w,readableObjectMode:false,writableObjectMode:false});this.float_bytes=
  		-1;this.separator=m;this.stream_errors=r;this.parser=new f({tags:h,max_depth:l,preferWeb:k,encoding:n});this.parser.on("more-bytes",this._on_more.bind(this));this.parser.on("value",this._on_value.bind(this));this.parser.on("start",this._on_start.bind(this));this.parser.on("stop",this._on_stop.bind(this));this.parser.on("data",this._on_data.bind(this));this.parser.on("error",this._on_error.bind(this));}_transform(v,m,r){return this.parser.write(v,m,r)}_flush(v){return this.parser._flush(m=>this.stream_errors?
  		(m&&this._on_error(m),v()):v(m))}static diagnose(v,m={},r=null){if(null==v)throw new TypeError("input required");a:switch(typeof m){case "function":m={options:{},cb:m};break a;case "string":m={options:{encoding:m},cb:r};break a;case "object":m={options:m||{},cb:r};break a;default:throw new TypeError("Unknown option type");}({options:m,cb:r}=m);const {encoding:h="hex",...l}=m,k=new g,n=new d(l);m=null;"function"===typeof r?(n.on("end",()=>r(null,k.toString("utf8"))),n.on("error",r)):m=new Promise((w,
  		t)=>{n.on("end",()=>w(k.toString("utf8")));n.on("error",t);});n.pipe(k);e.guessEncoding(v,h).pipe(n);return m}_on_error(v){this.stream_errors?this.push(v.toString()):this.emit("error",v);}_on_more(v,m,r,h){v===a.SIMPLE_FLOAT&&(this.float_bytes={2:1,4:2,8:3}[m]);}_fore(v,m){switch(v){case a.BYTE_STRING:case a.UTF8_STRING:case a.ARRAY:0<m&&this.push(", ");break;case a.MAP:0<m&&(m%2?this.push(": "):this.push(", "));}}_on_value(v,m,r){v!==b.BREAK&&(this._fore(m,r),m=this.float_bytes,this.float_bytes=-1,this.push(e.cborValueToString(v,
  		m)));}_on_start(v,m,r,h){this._fore(r,h);switch(v){case a.TAG:this.push(`${m}(`);break;case a.ARRAY:this.push("[");break;case a.MAP:this.push("{");break;case a.BYTE_STRING:case a.UTF8_STRING:this.push("(");}m===b.STREAM&&this.push("_ ");}_on_stop(v){switch(v){case a.TAG:this.push(")");break;case a.ARRAY:this.push("]");break;case a.MAP:this.push("}");break;case a.BYTE_STRING:case a.UTF8_STRING:this.push(")");}}_on_data(){this.push(this.separator);}}O.exports=d;},{"./constants":50,"./decoder":51,"./utils":57,
  		nofilter:131,stream:135}],53:[function(z,O,A){function f(G){if(!G)return "number";switch(G.toLowerCase()){case "number":return "number";case "float":return "float";case "int":case "integer":return "int";case "string":return "string"}throw new TypeError(`dateType invalid, got "${G}"`);}A=z("stream");const e=z("nofilter"),g=z("./utils"),a=z("./constants"),{MT:b,NUMBYTES:d,SHIFT32:v,SIMPLE:m,SYMS:r,TAG:h,BI:l}=a,{Buffer:k}=z("buffer"),n=b.SIMPLE_FLOAT<<5|d.TWO,w=b.SIMPLE_FLOAT<<5|d.FOUR,t=b.SIMPLE_FLOAT<<
  		5|d.EIGHT,u=b.SIMPLE_FLOAT<<5|m.TRUE,y=b.SIMPLE_FLOAT<<5|m.FALSE,x=b.SIMPLE_FLOAT<<5|m.UNDEFINED,F=b.SIMPLE_FLOAT<<5|m.NULL,D=k.from([255]),I=k.from("f97e00","hex"),S=k.from("f9fc00","hex"),Z=k.from("f97c00","hex"),aa=k.from("f98000","hex"),P={};let R={};class V extends A.Transform{constructor(G={}){const {canonical:K=false,encodeUndefined:J,disallowUndefinedKeys:c=false,dateType:p="number",collapseBigIntegers:B=false,detectLoops:H=false,omitUndefinedProperties:T=false,genTypes:ia=[],...X}=G;super({...X,readableObjectMode:false,
  		writableObjectMode:true});this.canonical=K;this.encodeUndefined=J;this.disallowUndefinedKeys=c;this.dateType=f(p);this.collapseBigIntegers=this.canonical?true:B;this.detectLoops=void 0;if("boolean"===typeof H)H&&(this.detectLoops=new WeakSet);else if(H instanceof WeakSet)this.detectLoops=H;else throw new TypeError("detectLoops must be boolean or WeakSet");this.omitUndefinedProperties=T;this.semanticTypes={...V.SEMANTIC_TYPES};if(Array.isArray(ia))for(let ba=0,Q=ia.length;ba<Q;ba+=2)this.addSemanticType(ia[ba],
  		ia[ba+1]);else for(const [ba,Q]of Object.entries(ia))this.addSemanticType(ba,Q);}_transform(G,K,J){G=this.pushAny(G);return J(false===G?Error("Push Error"):void 0)}_flush(G){return G()}_pushUInt8(G){const K=k.allocUnsafe(1);K.writeUInt8(G,0);return this.push(K)}_pushUInt16BE(G){const K=k.allocUnsafe(2);K.writeUInt16BE(G,0);return this.push(K)}_pushUInt32BE(G){const K=k.allocUnsafe(4);K.writeUInt32BE(G,0);return this.push(K)}_pushFloatBE(G){const K=k.allocUnsafe(4);K.writeFloatBE(G,0);return this.push(K)}_pushDoubleBE(G){const K=
  		k.allocUnsafe(8);K.writeDoubleBE(G,0);return this.push(K)}_pushNaN(){return this.push(I)}_pushInfinity(G){return this.push(0>G?S:Z)}_pushFloat(G){if(this.canonical){const K=k.allocUnsafe(2);if(g.writeHalf(K,G))return this._pushUInt8(n)&&this.push(K)}return Math.fround(G)===G?this._pushUInt8(w)&&this._pushFloatBE(G):this._pushUInt8(t)&&this._pushDoubleBE(G)}_pushInt(G,K,J){const c=K<<5;if(24>G)return this._pushUInt8(c|G);if(255>=G)return this._pushUInt8(c|d.ONE)&&this._pushUInt8(G);if(65535>=G)return this._pushUInt8(c|
  		d.TWO)&&this._pushUInt16BE(G);if(4294967295>=G)return this._pushUInt8(c|d.FOUR)&&this._pushUInt32BE(G);let p=Number.MAX_SAFE_INTEGER;K===b.NEG_INT&&p--;return G<=p?this._pushUInt8(c|d.EIGHT)&&this._pushUInt32BE(Math.floor(G/v))&&this._pushUInt32BE(G%v):K===b.NEG_INT?this._pushFloat(J):this._pushFloat(G)}_pushIntNum(G){return Object.is(G,-0)?this.push(aa):0>G?this._pushInt(-G-1,b.NEG_INT,G):this._pushInt(G,b.POS_INT)}_pushNumber(G){return isNaN(G)?this._pushNaN():isFinite(G)?Math.round(G)===G?this._pushIntNum(G):
  		this._pushFloat(G):this._pushInfinity(G)}_pushString(G){const K=k.byteLength(G,"utf8");return this._pushInt(K,b.UTF8_STRING)&&this.push(G,"utf8")}_pushBoolean(G){return this._pushUInt8(G?u:y)}_pushUndefined(G){switch(typeof this.encodeUndefined){case "undefined":return this._pushUInt8(x);case "function":return this.pushAny(this.encodeUndefined(G));case "object":if(G=g.bufferishToBuffer(this.encodeUndefined))return this.push(G)}return this.pushAny(this.encodeUndefined)}_pushNull(G){return this._pushUInt8(F)}_pushTag(G){return this._pushInt(G,
  		b.TAG)}_pushJSBigint(G){let K=b.POS_INT,J=h.POS_BIGINT;0>G&&(G=-G+l.MINUS_ONE,K=b.NEG_INT,J=h.NEG_BIGINT);if(this.collapseBigIntegers&&G<=l.MAXINT64)return 4294967295>=G?this._pushInt(Number(G),K):this._pushUInt8(K<<5|d.EIGHT)&&this._pushUInt32BE(Number(G/l.SHIFT32))&&this._pushUInt32BE(Number(G%l.SHIFT32));G=G.toString(16);G.length%2&&(G=`0${G}`);G=k.from(G,"hex");return this._pushTag(J)&&V._pushBuffer(this,G)}_pushObject(G,K){if(!G)return this._pushNull(G);K={indefinite:false,skipTypes:false,...K};if(!K.indefinite&&
  		this.detectLoops){if(this.detectLoops.has(G))throw Error("Loop detected while CBOR encoding.\nCall removeLoopDetectors before resuming.");this.detectLoops.add(G);}if(!K.skipTypes){var J=G.encodeCBOR;if("function"===typeof J)return J.call(G,this);if(J=this.semanticTypes[G.constructor.name])return J.call(G,this,G)}J=Object.keys(G).filter(B=>{B=typeof G[B];return "function"!==B&&(!this.omitUndefinedProperties||"undefined"!==B)});const c={};this.canonical&&J.sort((B,H)=>{B=c[B]||(c[B]=V.encode(B));H=c[H]||
  		(c[H]=V.encode(H));return B.compare(H)});if(K.indefinite){if(!this._pushUInt8(b.MAP<<5|d.INDEFINITE))return  false}else if(!this._pushInt(J.length,b.MAP))return  false;let p=null;for(let B=0,H=J.length;B<H;B++){const T=J[B];if(this.canonical&&(p=c[T])){if(!this.push(p))return  false}else if(!this._pushString(T))return  false;if(!this.pushAny(G[T]))return  false}if(K.indefinite){if(!this.push(D))return  false}else this.detectLoops&&this.detectLoops.delete(G);return  true}_encodeAll(G){const K=new e({highWaterMark:this.readableHighWaterMark});
  		this.pipe(K);for(const J of G)this.pushAny(J);this.end();return K.read()}addSemanticType(G,K){G="string"===typeof G?G:G.name;const J=this.semanticTypes[G];if(K){if("function"!==typeof K)throw new TypeError("fun must be of type function");this.semanticTypes[G]=K;}else J&&delete this.semanticTypes[G];return J}pushAny(G){switch(typeof G){case "number":return this._pushNumber(G);case "bigint":return this._pushJSBigint(G);case "string":return this._pushString(G);case "boolean":return this._pushBoolean(G);
  		case "undefined":return this._pushUndefined(G);case "object":return this._pushObject(G);case "symbol":switch(G){case r.NULL:return this._pushNull(null);case r.UNDEFINED:return this._pushUndefined(void 0);default:throw new TypeError(`Unknown symbol: ${G.toString()}`);}default:throw new TypeError(`Unknown type: ${typeof G}, ${"function"===typeof G.toString?G.toString():""}`);}}static pushArray(G,K,J){J={indefinite:false,...J};const c=K.length;if(J.indefinite){if(!G._pushUInt8(b.ARRAY<<5|d.INDEFINITE))return  false}else if(!G._pushInt(c,
  		b.ARRAY))return  false;for(let p=0;p<c;p++)if(!G.pushAny(K[p]))return  false;return J.indefinite&&!G.push(D)?false:true}removeLoopDetectors(){if(!this.detectLoops)return  false;this.detectLoops=new WeakSet;return  true}static _pushDate(G,K){switch(G.dateType){case "string":return G._pushTag(h.DATE_STRING)&&G._pushString(K.toISOString());case "int":return G._pushTag(h.DATE_EPOCH)&&G._pushIntNum(Math.round(K.getTime()/1E3));case "float":return G._pushTag(h.DATE_EPOCH)&&G._pushFloat(K.getTime()/1E3);default:return G._pushTag(h.DATE_EPOCH)&&
  		G.pushAny(K.getTime()/1E3)}}static _pushBuffer(G,K){return G._pushInt(K.length,b.BYTE_STRING)&&G.push(K)}static _pushNoFilter(G,K){return V._pushBuffer(G,K.slice())}static _pushRegexp(G,K){return G._pushTag(h.REGEXP)&&G.pushAny(K.source)}static _pushSet(G,K){if(!G._pushTag(h.SET)||!G._pushInt(K.size,b.ARRAY))return  false;for(const J of K)if(!G.pushAny(J))return  false;return  true}static _pushURL(G,K){return G._pushTag(h.URI)&&G.pushAny(K.toString())}static _pushBoxed(G,K){return G.pushAny(K.valueOf())}static _pushMap(G,
  		K,J){J={indefinite:false,...J};K=[...K.entries()];G.omitUndefinedProperties&&(K=K.filter(([,c])=>void 0!==c));if(J.indefinite){if(!G._pushUInt8(b.MAP<<5|d.INDEFINITE))return  false}else if(!G._pushInt(K.length,b.MAP))return  false;if(G.canonical){const c=new V({genTypes:G.semanticTypes,canonical:G.canonical,detectLoops:!!G.detectLoops,dateType:G.dateType,disallowUndefinedKeys:G.disallowUndefinedKeys,collapseBigIntegers:G.collapseBigIntegers}),p=new e({highWaterMark:G.readableHighWaterMark});c.pipe(p);K.sort(([B],
  		[H])=>{c.pushAny(B);B=p.read();c.pushAny(H);H=p.read();return B.compare(H)});for(const [B,H]of K){if(G.disallowUndefinedKeys&&"undefined"===typeof B)throw Error("Invalid Map key: undefined");if(!G.pushAny(B)||!G.pushAny(H))return  false}}else for(const [c,p]of K){if(G.disallowUndefinedKeys&&"undefined"===typeof c)throw Error("Invalid Map key: undefined");if(!G.pushAny(c)||!G.pushAny(p))return  false}return J.indefinite&&!G.push(D)?false:true}static _pushTypedArray(G,K){let J=64,c=K.BYTES_PER_ELEMENT;const {name:p}=
  		K.constructor;p.startsWith("Float")?(J|=16,c/=2):p.includes("U")||(J|=8);if(p.includes("Clamped")||1!==c&&!g.isBigEndian())J|=4;J|={1:0,2:1,4:2,8:3}[c];return G._pushTag(J)?V._pushBuffer(G,k.from(K.buffer,K.byteOffset,K.byteLength)):false}static _pushArrayBuffer(G,K){return V._pushBuffer(G,k.from(K))}static encodeIndefinite(G,K,J={}){if(null==K){if(null==this)throw Error("No object to encode");K=this;}({chunkSize:J=4096}=J);let c=true;var p=typeof K,B;if("string"===p){c=c&&G._pushUInt8(b.UTF8_STRING<<5|
  		d.INDEFINITE);for(B=0;B<K.length;)p=B+J,c=c&&G._pushString(K.slice(B,p)),B=p;c=c&&G.push(D);}else if(B=g.bufferishToBuffer(K)){c=c&&G._pushUInt8(b.BYTE_STRING<<5|d.INDEFINITE);for(K=0;K<B.length;)p=K+J,c=c&&V._pushBuffer(G,B.slice(K,p)),K=p;c=c&&G.push(D);}else if(Array.isArray(K))c=c&&V.pushArray(G,K,{indefinite:true});else if(K instanceof Map)c=c&&V._pushMap(G,K,{indefinite:true});else {if("object"!==p)throw Error("Invalid indefinite encoding");c=c&&G._pushObject(K,{indefinite:true,skipTypes:true});}return c}static encode(...G){return (new V)._encodeAll(G)}static encodeCanonical(...G){return (new V({canonical:true}))._encodeAll(G)}static encodeOne(G,
  		K){return (new V(K))._encodeAll([G])}static encodeAsync(G,K){return new Promise((J,c)=>{const p=[],B=new V(K);B.on("data",H=>p.push(H));B.on("error",c);B.on("finish",()=>J(k.concat(p)));B.pushAny(G);B.end();})}static get SEMANTIC_TYPES(){return R}static set SEMANTIC_TYPES(G){R=G;}static reset(){V.SEMANTIC_TYPES={...P};}}Object.assign(P,{Array:V.pushArray,Date:V._pushDate,Buffer:V._pushBuffer,[k.name]:V._pushBuffer,Map:V._pushMap,NoFilter:V._pushNoFilter,[e.name]:V._pushNoFilter,RegExp:V._pushRegexp,Set:V._pushSet,
  		ArrayBuffer:V._pushArrayBuffer,Uint8ClampedArray:V._pushTypedArray,Uint8Array:V._pushTypedArray,Uint16Array:V._pushTypedArray,Uint32Array:V._pushTypedArray,Int8Array:V._pushTypedArray,Int16Array:V._pushTypedArray,Int32Array:V._pushTypedArray,Float32Array:V._pushTypedArray,Float64Array:V._pushTypedArray,URL:V._pushURL,Boolean:V._pushBoxed,Number:V._pushBoxed,String:V._pushBoxed});"undefined"!==typeof BigUint64Array&&(P[BigUint64Array.name]=V._pushTypedArray);"undefined"!==typeof BigInt64Array&&(P[BigInt64Array.name]=
  		V._pushTypedArray);V.reset();O.exports=V;},{"./constants":50,"./utils":57,buffer:45,nofilter:131,stream:135}],54:[function(z,O,A){const {Buffer:f}=z("buffer"),e=z("./encoder"),g=z("./decoder"),{MT:a}=z("./constants");class b extends Map{constructor(d){super(d);}static _encode(d){return e.encodeCanonical(d).toString("base64")}static _decode(d){return g.decodeFirstSync(d,"base64")}get(d){return super.get(b._encode(d))}set(d,v){return super.set(b._encode(d),v)}delete(d){return super.delete(b._encode(d))}has(d){return super.has(b._encode(d))}*keys(){for(const d of super.keys())yield b._decode(d);}*entries(){for(const d of super.entries())yield [b._decode(d[0]),
  		d[1]];}[Symbol.iterator](){return this.entries()}forEach(d,v){if("function"!==typeof d)throw new TypeError("Must be function");for(const m of super.entries())d.call(this,m[1],b._decode(m[0]),this);}encodeCBOR(d){if(!d._pushInt(this.size,a.MAP))return  false;if(d.canonical){var v=Array.from(super.entries()).map(m=>[f.from(m[0],"base64"),m[1]]);v.sort((m,r)=>m[0].compare(r[0]));for(const m of v)if(!d.push(m[0])||!d.pushAny(m[1]))return  false}else for(v of super.entries())if(!d.push(f.from(v[0],"base64"))||!d.pushAny(v[1]))return  false;
  		return  true}}O.exports=b;},{"./constants":50,"./decoder":51,"./encoder":53,buffer:45}],55:[function(z,O,A){const {MT:f,SIMPLE:e,SYMS:g}=z("./constants");class a{constructor(b){if("number"!==typeof b)throw Error(`Invalid Simple type: ${typeof b}`);if(0>b||255<b||(b|0)!==b)throw Error(`value must be a small positive integer: ${b}`);this.value=b;}toString(){return `simple(${this.value})`}[Symbol.for("nodejs.util.inspect.custom")](b,d){return `simple(${this.value})`}encodeCBOR(b){return b._pushInt(this.value,
  		f.SIMPLE_FLOAT)}static isSimple(b){return b instanceof a}static decode(b,d=true,v=false){switch(b){case e.FALSE:return  false;case e.TRUE:return  true;case e.NULL:return d?null:g.NULL;case e.UNDEFINED:return d?void 0:g.UNDEFINED;case -1:if(!d||!v)throw Error("Invalid BREAK");return g.BREAK;default:return new a(b)}}}O.exports=a;},{"./constants":50}],56:[function(z,O,A){function f(n,w){if(v.isBufferish(n))n.toJSON=w;else if(Array.isArray(n))for(const t of n)f(t,w);else if(n&&"object"===typeof n&&(!(n instanceof k)||
  		21>n.tag||23<n.tag))for(const t of Object.values(n))f(t,w);}function e(){return v.base64(this)}function g(){return v.base64url(this)}function a(){return this.toString("hex")}function b(n,w){if(!v.isBufferish(n))throw new TypeError("val not a buffer");var {tag:t}=w;w=h[t];if(!w)throw Error(`Invalid typed array tag: ${t}`);const u=2**(((t&16)>>4)+(t&3));if(!(t&4)!==v.isBigEndian()&&1<u){var y=n.byteOffset,x=n.byteLength;t=new DataView(n.buffer);const [F,D]={2:[t.getUint16,t.setUint16],4:[t.getUint32,
  		t.setUint32],8:[t.getBigUint64,t.setBigUint64]}[u];for(x=y+x;y<x;y+=u)D.call(t,y,F.call(t,y,true));}n=n.buffer.slice(n.byteOffset,n.byteOffset+n.byteLength);return new w(n)}const d=z("./constants"),v=z("./utils"),m=Symbol("INTERNAL_JSON"),r={0:n=>new Date(n),1:n=>new Date(1E3*n),2:n=>v.bufferToBigInt(n),3:n=>d.BI.MINUS_ONE-v.bufferToBigInt(n),21:(n,w)=>{v.isBufferish(n)?w[m]=g:f(n,g);return w},22:(n,w)=>{v.isBufferish(n)?w[m]=e:f(n,e);return w},23:(n,w)=>{v.isBufferish(n)?w[m]=a:f(n,a);return w},32:n=>
  		new URL(n),33:(n,w)=>{if(!n.match(/^[a-zA-Z0-9_-]+$/))throw Error("Invalid base64url characters");const t=n.length%4;if(1===t)throw Error("Invalid base64url length");if(2===t){if(-1==="AQgw".indexOf(n[n.length-1]))throw Error("Invalid base64 padding");}else if(3===t&&-1==="AEIMQUYcgkosw048".indexOf(n[n.length-1]))throw Error("Invalid base64 padding");return w},34:(n,w)=>{const t=n.match(/^[a-zA-Z0-9+/]+(?<padding>={0,2})$/);if(!t)throw Error("Invalid base64 characters");if(0!==n.length%4)throw Error("Invalid base64 length");
  		if("="===t.groups.padding){if(-1==="AQgw".indexOf(n[n.length-2]))throw Error("Invalid base64 padding");}else if("=="===t.groups.padding&&-1==="AEIMQUYcgkosw048".indexOf(n[n.length-3]))throw Error("Invalid base64 padding");return w},35:n=>new RegExp(n),258:n=>new Set(n)},h={64:Uint8Array,65:Uint16Array,66:Uint32Array,68:Uint8ClampedArray,69:Uint16Array,70:Uint32Array,72:Int8Array,73:Int16Array,74:Int32Array,77:Int16Array,78:Int32Array,81:Float32Array,82:Float64Array,85:Float32Array,86:Float64Array};
  		"undefined"!==typeof BigUint64Array&&(h[67]=BigUint64Array,h[71]=BigUint64Array);"undefined"!==typeof BigInt64Array&&(h[75]=BigInt64Array,h[79]=BigInt64Array);for(const n of Object.keys(h))r[n]=b;let l={};class k{constructor(n,w,t){this.tag=n;this.value=w;this.err=t;if("number"!==typeof this.tag)throw Error(`Invalid tag type (${typeof this.tag})`);if(0>this.tag||(this.tag|0)!==this.tag)throw Error(`Tag must be a positive integer: ${this.tag}`);}toJSON(){if(this[m])return this[m].call(this.value);
  		const n={tag:this.tag,value:this.value};this.err&&(n.err=this.err);return n}toString(){return `${this.tag}(${JSON.stringify(this.value)})`}encodeCBOR(n){n._pushTag(this.tag);return n.pushAny(this.value)}convert(n){n=null==n?void 0:n[this.tag];if("function"!==typeof n&&(n=k.TAGS[this.tag],"function"!==typeof n))return this;try{return n.call(this,this.value,this)}catch(w){return this.err=w&&w.message&&0<w.message.length?w.message:w,this}}static get TAGS(){return l}static set TAGS(n){l=n;}static reset(){k.TAGS=
  		{...r};}}k.INTERNAL_JSON=m;k.reset();O.exports=k;},{"./constants":50,"./utils":57}],57:[function(z,O,A){function f(l){return l instanceof a.Readable?true:["read","on","pipe"].every(k=>"function"===typeof l[k])}const {Buffer:e}=z("buffer"),g=z("nofilter"),a=z("stream");z=z("./constants");const {NUMBYTES:b,SHIFT32:d,BI:v,SYMS:m}=z,r=new TextDecoder("utf8",{fatal:true,ignoreBOM:true});A.utf8=l=>r.decode(l);A.utf8.checksUTF8=true;A.isBufferish=function(l){return l&&"object"===typeof l&&(e.isBuffer(l)||l instanceof
  		Uint8Array||l instanceof Uint8ClampedArray||l instanceof ArrayBuffer||l instanceof DataView)};A.bufferishToBuffer=function(l){return e.isBuffer(l)?l:ArrayBuffer.isView(l)?e.from(l.buffer,l.byteOffset,l.byteLength):l instanceof ArrayBuffer?e.from(l):null};A.parseCBORint=function(l,k){switch(l){case b.ONE:return k.readUInt8(0);case b.TWO:return k.readUInt16BE(0);case b.FOUR:return k.readUInt32BE(0);case b.EIGHT:return l=k.readUInt32BE(0),k=k.readUInt32BE(4),2097151<l?BigInt(l)*v.SHIFT32+BigInt(k):l*
  		d+k;default:throw Error(`Invalid additional info for int: ${l}`);}};A.writeHalf=function(l,k){var n=e.allocUnsafe(4);n.writeFloatBE(k,0);var w=n.readUInt32BE(0);if(0!==(w&8191))return  false;k=w>>16&32768;n=w>>23&255;w&=8388607;if(113<=n&&142>=n)k+=(n-112<<10)+(w>>13);else if(103<=n&&113>n){if(w&(1<<126-n)-1)return  false;k+=w+8388608>>126-n;}else return  false;l.writeUInt16BE(k);return  true};A.parseHalf=function(l){const k=l[0]&128?-1:1,n=(l[0]&124)>>2;l=(l[0]&3)<<8|l[1];return n?31===n?k*(l?NaN:Infinity):k*2**(n-
  		25)*(1024+l):5.9604644775390625E-8*k*l};A.parseCBORfloat=function(l){switch(l.length){case 2:return A.parseHalf(l);case 4:return l.readFloatBE(0);case 8:return l.readDoubleBE(0);default:throw Error(`Invalid float size: ${l.length}`);}};A.hex=function(l){return e.from(l.replace(/^0x/,""),"hex")};A.bin=function(l){l=l.replace(/\s/g,"");let k=0,n=l.length%8||8;const w=[];for(;n<=l.length;)w.push(parseInt(l.slice(k,n),2)),k=n,n+=8;return e.from(w)};A.arrayEqual=function(l,k){return null==l&&null==k?true:
  		null==l||null==k?false:l.length===k.length&&l.every((n,w)=>n===k[w])};A.bufferToBigInt=function(l){return BigInt(`0x${l.toString("hex")}`)};A.cborValueToString=function(l,k=-1){switch(typeof l){case "symbol":switch(l){case m.NULL:return "null";case m.UNDEFINED:return "undefined";case m.BREAK:return "BREAK"}return l.description?l.description:(k=l.toString().match(/^Symbol\((?<name>.*)\)/))&&k.groups.name?k.groups.name:"Symbol";case "string":return JSON.stringify(l);case "bigint":return l.toString();case "number":return l=
  		Object.is(l,-0)?"-0":String(l),0<k?`${l}_${k}`:l;case "object":const n=A.bufferishToBuffer(l);return n?(l=n.toString("hex"),-Infinity===k?l:`h'${l}'`):"function"===typeof l[Symbol.for("nodejs.util.inspect.custom")]?l[Symbol.for("nodejs.util.inspect.custom")]():Array.isArray(l)?"[]":"{}"}return String(l)};A.guessEncoding=function(l,k){if("string"===typeof l)return new g(l,null==k?"hex":k);if(k=A.bufferishToBuffer(l))return new g(k);if(f(l))return l;throw Error("Unknown input type");};const h={"=":"",
  		"+":"-","/":"_"};A.base64url=function(l){return A.bufferishToBuffer(l).toString("base64").replace(/[=+/]/g,k=>h[k])};A.base64=function(l){return A.bufferishToBuffer(l).toString("base64")};A.isBigEndian=function(){const l=new Uint8Array(4);return !(((new Uint32Array(l.buffer))[0]=1)&l[0])};},{"./constants":50,buffer:45,nofilter:131,stream:135}],58:[function(z,O,A){A=z("stream");const f=z("nofilter");class e extends A.Transform{constructor(g){super(g);this._writableState.objectMode=false;this._readableState.objectMode=
  		true;this.bs=new f;this.__restart();}_transform(g,a,b){for(this.bs.write(g);this.bs.length>=this.__needed;){g=null;a=null===this.__needed?void 0:this.bs.read(this.__needed);try{g=this.__parser.next(a);}catch(d){return b(d)}this.__needed&&(this.__fresh=false);g.done?(this.push(g.value),this.__restart()):this.__needed=g.value||Infinity;}return b()}*_parse(){throw Error("Must be implemented in subclass");}__restart(){this.__needed=null;this.__parser=this._parse();this.__fresh=true;}_flush(g){g(this.__fresh?null:
  		Error("unexpected end of input"));}}O.exports=e;},{nofilter:131,stream:135}],59:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./enc-base64"),z("./md5"),z("./evpkdf"),z("./cipher-core")):e(f.CryptoJS);})(this,function(f){(function(){var e=f.lib.BlockCipher,g=f.algo,a=[],b=[],d=[],v=[],m=[],r=[],h=[],l=[],k=[],n=[];(function(){for(var t=[],u=0;256>u;u++)t[u]=128>u?u<<1:u<<1^283;var y=0,x=0;for(u=0;256>u;u++){var F=x^x<<1^x<<2^x<<3^x<<4;F=F>>>8^F&255^99;a[y]=F;b[F]=
  		y;var D=t[y],I=t[D],S=t[I],Z=257*t[F]^16843008*F;d[y]=Z<<24|Z>>>8;v[y]=Z<<16|Z>>>16;m[y]=Z<<8|Z>>>24;r[y]=Z;Z=16843009*S^65537*I^257*D^16843008*y;h[F]=Z<<24|Z>>>8;l[F]=Z<<16|Z>>>16;k[F]=Z<<8|Z>>>24;n[F]=Z;y?(y=D^t[t[t[S^D]]],x^=t[t[x]]):y=x=1;}})();var w=[0,1,2,4,8,16,32,64,128,27,54];g=g.AES=e.extend({_doReset:function(){if(!this._nRounds||this._keyPriorReset!==this._key){var t=this._keyPriorReset=this._key;for(var u=t.words,y=t.sigBytes/4,x=4*((this._nRounds=y+6)+1),F=this._keySchedule=[],D=0;D<
  		x;D++)D<y?F[D]=u[D]:(t=F[D-1],D%y?6<y&&4==D%y&&(t=a[t>>>24]<<24|a[t>>>16&255]<<16|a[t>>>8&255]<<8|a[t&255]):(t=t<<8|t>>>24,t=a[t>>>24]<<24|a[t>>>16&255]<<16|a[t>>>8&255]<<8|a[t&255],t^=w[D/y|0]<<24),F[D]=F[D-y]^t);u=this._invKeySchedule=[];for(y=0;y<x;y++)D=x-y,t=y%4?F[D]:F[D-4],u[y]=4>y||4>=D?t:h[a[t>>>24]]^l[a[t>>>16&255]]^k[a[t>>>8&255]]^n[a[t&255]];}},encryptBlock:function(t,u){this._doCryptBlock(t,u,this._keySchedule,d,v,m,r,a);},decryptBlock:function(t,u){var y=t[u+1];t[u+1]=t[u+3];t[u+3]=y;this._doCryptBlock(t,
  		u,this._invKeySchedule,h,l,k,n,b);y=t[u+1];t[u+1]=t[u+3];t[u+3]=y;},_doCryptBlock:function(t,u,y,x,F,D,I,S){for(var Z=this._nRounds,aa=t[u]^y[0],P=t[u+1]^y[1],R=t[u+2]^y[2],V=t[u+3]^y[3],G=4,K=1;K<Z;K++){var J=x[aa>>>24]^F[P>>>16&255]^D[R>>>8&255]^I[V&255]^y[G++],c=x[P>>>24]^F[R>>>16&255]^D[V>>>8&255]^I[aa&255]^y[G++],p=x[R>>>24]^F[V>>>16&255]^D[aa>>>8&255]^I[P&255]^y[G++];V=x[V>>>24]^F[aa>>>16&255]^D[P>>>8&255]^I[R&255]^y[G++];aa=J;P=c;R=p;}J=(S[aa>>>24]<<24|S[P>>>16&255]<<16|S[R>>>8&255]<<8|S[V&255])^
  		y[G++];c=(S[P>>>24]<<24|S[R>>>16&255]<<16|S[V>>>8&255]<<8|S[aa&255])^y[G++];p=(S[R>>>24]<<24|S[V>>>16&255]<<16|S[aa>>>8&255]<<8|S[P&255])^y[G++];V=(S[V>>>24]<<24|S[aa>>>16&255]<<16|S[P>>>8&255]<<8|S[R&255])^y[G++];t[u]=J;t[u+1]=c;t[u+2]=p;t[u+3]=V;},keySize:8});f.AES=e._createHelper(g);})();return f.AES});},{"./cipher-core":60,"./core":61,"./enc-base64":62,"./evpkdf":65,"./md5":70}],60:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./evpkdf")):e(f.CryptoJS);})(this,
  		function(f){f.lib.Cipher||function(e){var g=f.lib,a=g.Base,b=g.WordArray,d=g.BufferedBlockAlgorithm,v=f.enc.Base64,m=f.algo.EvpKDF,r=g.Cipher=d.extend({cfg:a.extend(),createEncryptor:function(u,y){return this.create(this._ENC_XFORM_MODE,u,y)},createDecryptor:function(u,y){return this.create(this._DEC_XFORM_MODE,u,y)},init:function(u,y,x){this.cfg=this.cfg.extend(x);this._xformMode=u;this._key=y;this.reset();},reset:function(){d.reset.call(this);this._doReset();},process:function(u){this._append(u);
  		return this._process()},finalize:function(u){u&&this._append(u);return this._doFinalize()},keySize:4,ivSize:4,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:function(){return function(u){return {encrypt:function(y,x,F){return ("string"==typeof x?t:w).encrypt(u,y,x,F)},decrypt:function(y,x,F){return ("string"==typeof x?t:w).decrypt(u,y,x,F)}}}}()});g.StreamCipher=r.extend({_doFinalize:function(){return this._process(true)},blockSize:1});var h=f.mode={},l=g.BlockCipherMode=a.extend({createEncryptor:function(u,
  		y){return this.Encryptor.create(u,y)},createDecryptor:function(u,y){return this.Decryptor.create(u,y)},init:function(u,y){this._cipher=u;this._iv=y;}});h=h.CBC=function(){function u(x,F,D){var I;(I=this._iv)?this._iv=e:I=this._prevBlock;for(var S=0;S<D;S++)x[F+S]^=I[S];}var y=l.extend();y.Encryptor=y.extend({processBlock:function(x,F){var D=this._cipher,I=D.blockSize;u.call(this,x,F,I);D.encryptBlock(x,F);this._prevBlock=x.slice(F,F+I);}});y.Decryptor=y.extend({processBlock:function(x,F){var D=this._cipher,
  		I=D.blockSize,S=x.slice(F,F+I);D.decryptBlock(x,F);u.call(this,x,F,I);this._prevBlock=S;}});return y}();var k=(f.pad={}).Pkcs7={pad:function(u,y){y*=4;y-=u.sigBytes%y;for(var x=y<<24|y<<16|y<<8|y,F=[],D=0;D<y;D+=4)F.push(x);y=b.create(F,y);u.concat(y);},unpad:function(u){u.sigBytes-=u.words[u.sigBytes-1>>>2]&255;}};g.BlockCipher=r.extend({cfg:r.cfg.extend({mode:h,padding:k}),reset:function(){r.reset.call(this);var u=this.cfg;var y=u.iv,x=u.mode;this._xformMode==this._ENC_XFORM_MODE?u=x.createEncryptor:
  		(u=x.createDecryptor,this._minBufferSize=1);this._mode&&this._mode.__creator==u?this._mode.init(this,y&&y.words):(this._mode=u.call(x,this,y&&y.words),this._mode.__creator=u);},_doProcessBlock:function(u,y){this._mode.processBlock(u,y);},_doFinalize:function(){var u=this.cfg.padding;if(this._xformMode==this._ENC_XFORM_MODE){u.pad(this._data,this.blockSize);var y=this._process(true);}else y=this._process(true),u.unpad(y);return y},blockSize:4});var n=g.CipherParams=a.extend({init:function(u){this.mixIn(u);},
  		toString:function(u){return (u||this.formatter).stringify(this)}});h=(f.format={}).OpenSSL={stringify:function(u){var y=u.ciphertext;u=u.salt;return (u?b.create([1398893684,1701076831]).concat(u).concat(y):y).toString(v)},parse:function(u){u=v.parse(u);var y=u.words;if(1398893684==y[0]&&1701076831==y[1]){var x=b.create(y.slice(2,4));y.splice(0,4);u.sigBytes-=16;}return n.create({ciphertext:u,salt:x})}};var w=g.SerializableCipher=a.extend({cfg:a.extend({format:h}),encrypt:function(u,y,x,F){F=this.cfg.extend(F);
  		var D=u.createEncryptor(x,F);y=D.finalize(y);D=D.cfg;return n.create({ciphertext:y,key:x,iv:D.iv,algorithm:u,mode:D.mode,padding:D.padding,blockSize:u.blockSize,formatter:F.format})},decrypt:function(u,y,x,F){F=this.cfg.extend(F);y=this._parse(y,F.format);return u.createDecryptor(x,F).finalize(y.ciphertext)},_parse:function(u,y){return "string"==typeof u?y.parse(u,this):u}});a=(f.kdf={}).OpenSSL={execute:function(u,y,x,F){F||(F=b.random(8));u=m.create({keySize:y+x}).compute(u,F);x=b.create(u.words.slice(y),
  		4*x);u.sigBytes=4*y;return n.create({key:u,iv:x,salt:F})}};var t=g.PasswordBasedCipher=w.extend({cfg:w.cfg.extend({kdf:a}),encrypt:function(u,y,x,F){F=this.cfg.extend(F);x=F.kdf.execute(x,u.keySize,u.ivSize);F.iv=x.iv;u=w.encrypt.call(this,u,y,x.key,F);u.mixIn(x);return u},decrypt:function(u,y,x,F){F=this.cfg.extend(F);y=this._parse(y,F.format);x=F.kdf.execute(x,u.keySize,u.ivSize,y.salt);F.iv=x.iv;return w.decrypt.call(this,u,y,x.key,F)}});}();});},{"./core":61,"./evpkdf":65}],61:[function(z,O,A){(function(f){(function(){(function(e,
  		g){"object"===typeof A?O.exports=A=g():e.CryptoJS=g();})(this,function(){var e=e||function(g,a){if("undefined"!==typeof window&&window.crypto)var b=window.crypto;"undefined"!==typeof self&&self.crypto&&(b=self.crypto);"undefined"!==typeof globalThis&&globalThis.crypto&&(b=globalThis.crypto);!b&&"undefined"!==typeof window&&window.msCrypto&&(b=window.msCrypto);!b&&"undefined"!==typeof f&&f.crypto&&(b=f.crypto);if(!b&&"function"===typeof z)try{b=z("crypto");}catch(y){}var d=Object.create||function(){function y(){}
  		return function(x){y.prototype=x;x=new y;y.prototype=null;return x}}(),v={},m=v.lib={},r=m.Base=function(){return {extend:function(y){var x=d(this);y&&x.mixIn(y);x.hasOwnProperty("init")&&this.init!==x.init||(x.init=function(){x.$super.init.apply(this,arguments);});x.init.prototype=x;x.$super=this;return x},create:function(){var y=this.extend();y.init.apply(y,arguments);return y},init:function(){},mixIn:function(y){for(var x in y)y.hasOwnProperty(x)&&(this[x]=y[x]);y.hasOwnProperty("toString")&&(this.toString=
  		y.toString);},clone:function(){return this.init.prototype.extend(this)}}}(),h=m.WordArray=r.extend({init:function(y,x){y=this.words=y||[];this.sigBytes=x!=a?x:4*y.length;},toString:function(y){return (y||k).stringify(this)},concat:function(y){var x=this.words,F=y.words,D=this.sigBytes;y=y.sigBytes;this.clamp();if(D%4)for(var I=0;I<y;I++)x[D+I>>>2]|=(F[I>>>2]>>>24-I%4*8&255)<<24-(D+I)%4*8;else for(I=0;I<y;I+=4)x[D+I>>>2]=F[I>>>2];this.sigBytes+=y;return this},clamp:function(){var y=this.words,x=this.sigBytes;
  		y[x>>>2]&=4294967295<<32-x%4*8;y.length=g.ceil(x/4);},clone:function(){var y=r.clone.call(this);y.words=this.words.slice(0);return y},random:function(y){for(var x=[],F=0;F<y;F+=4){var D=x,I=D.push;a:{if(b){if("function"===typeof b.getRandomValues)try{var S=b.getRandomValues(new Uint32Array(1))[0];break a}catch(Z){}if("function"===typeof b.randomBytes)try{S=b.randomBytes(4).readInt32LE();break a}catch(Z){}}throw Error("Native crypto module could not be used to get secure random number.");}I.call(D,
  		S);}return new h.init(x,y)}}),l=v.enc={},k=l.Hex={stringify:function(y){var x=y.words;y=y.sigBytes;for(var F=[],D=0;D<y;D++){var I=x[D>>>2]>>>24-D%4*8&255;F.push((I>>>4).toString(16));F.push((I&15).toString(16));}return F.join("")},parse:function(y){for(var x=y.length,F=[],D=0;D<x;D+=2)F[D>>>3]|=parseInt(y.substr(D,2),16)<<24-D%8*4;return new h.init(F,x/2)}},n=l.Latin1={stringify:function(y){var x=y.words;y=y.sigBytes;for(var F=[],D=0;D<y;D++)F.push(String.fromCharCode(x[D>>>2]>>>24-D%4*8&255));return F.join("")},
  		parse:function(y){for(var x=y.length,F=[],D=0;D<x;D++)F[D>>>2]|=(y.charCodeAt(D)&255)<<24-D%4*8;return new h.init(F,x)}},w=l.Utf8={stringify:function(y){try{return decodeURIComponent(escape(n.stringify(y)))}catch(x){throw Error("Malformed UTF-8 data");}},parse:function(y){return n.parse(unescape(encodeURIComponent(y)))}},t=m.BufferedBlockAlgorithm=r.extend({reset:function(){this._data=new h.init;this._nDataBytes=0;},_append:function(y){"string"==typeof y&&(y=w.parse(y));this._data.concat(y);this._nDataBytes+=
  		y.sigBytes;},_process:function(y){var x,F=this._data,D=F.words,I=F.sigBytes,S=this.blockSize,Z=I/(4*S);Z=y?g.ceil(Z):g.max((Z|0)-this._minBufferSize,0);y=Z*S;I=g.min(4*y,I);if(y){for(x=0;x<y;x+=S)this._doProcessBlock(D,x);x=D.splice(0,y);F.sigBytes-=I;}return new h.init(x,I)},clone:function(){var y=r.clone.call(this);y._data=this._data.clone();return y},_minBufferSize:0});m.Hasher=t.extend({cfg:r.extend(),init:function(y){this.cfg=this.cfg.extend(y);this.reset();},reset:function(){t.reset.call(this);
  		this._doReset();},update:function(y){this._append(y);this._process();return this},finalize:function(y){y&&this._append(y);return this._doFinalize()},blockSize:16,_createHelper:function(y){return function(x,F){return (new y.init(F)).finalize(x)}},_createHmacHelper:function(y){return function(x,F){return (new u.HMAC.init(y,F)).finalize(x)}}});var u=v.algo={};return v}(Math);return e});}).call(this);}).call(this,"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?
  		window:{});},{crypto:44}],62:[function(z,O,A){(function(f,e){"object"===typeof A?O.exports=A=e(z("./core")):e(f.CryptoJS);})(this,function(f){(function(){var e=f.lib.WordArray;f.enc.Base64={stringify:function(g){var a=g.words,b=g.sigBytes,d=this._map;g.clamp();g=[];for(var v=0;v<b;v+=3)for(var m=(a[v>>>2]>>>24-v%4*8&255)<<16|(a[v+1>>>2]>>>24-(v+1)%4*8&255)<<8|a[v+2>>>2]>>>24-(v+2)%4*8&255,r=0;4>r&&v+.75*r<b;r++)g.push(d.charAt(m>>>6*(3-r)&63));if(a=d.charAt(64))for(;g.length%4;)g.push(a);return g.join("")},
  		parse:function(g){var a=g.length,b=this._map,d=this._reverseMap;if(!d){d=this._reverseMap=[];for(var v=0;v<b.length;v++)d[b.charCodeAt(v)]=v;}if(b=b.charAt(64))b=g.indexOf(b),-1!==b&&(a=b);b=[];for(var m=v=0;m<a;m++)if(m%4){var r=d[g.charCodeAt(m-1)]<<m%4*2,h=d[g.charCodeAt(m)]>>>6-m%4*2;b[v>>>2]|=(r|h)<<24-v%4*8;v++;}return e.create(b,v)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="};})();return f.enc.Base64});},{"./core":61}],63:[function(z,O,A){(function(f,e){"object"===
  		typeof A?O.exports=A=e(z("./core")):e(f.CryptoJS);})(this,function(f){(function(){var e=f.lib.WordArray;f.enc.Base64url={stringify:function(g,a=true){var b=g.words,d=g.sigBytes;a=a?this._safe_map:this._map;g.clamp();g=[];for(var v=0;v<d;v+=3)for(var m=(b[v>>>2]>>>24-v%4*8&255)<<16|(b[v+1>>>2]>>>24-(v+1)%4*8&255)<<8|b[v+2>>>2]>>>24-(v+2)%4*8&255,r=0;4>r&&v+.75*r<d;r++)g.push(a.charAt(m>>>6*(3-r)&63));if(b=a.charAt(64))for(;g.length%4;)g.push(b);return g.join("")},parse:function(g,a=true){var b=g.length,
  		d=a?this._safe_map:this._map;a=this._reverseMap;if(!a){a=this._reverseMap=[];for(var v=0;v<d.length;v++)a[d.charCodeAt(v)]=v;}if(d=d.charAt(64))d=g.indexOf(d),-1!==d&&(b=d);d=[];for(var m=v=0;m<b;m++)if(m%4){var r=a[g.charCodeAt(m-1)]<<m%4*2,h=a[g.charCodeAt(m)]>>>6-m%4*2;d[v>>>2]|=(r|h)<<24-v%4*8;v++;}return e.create(d,v)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",_safe_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"};})();return f.enc.Base64url});},
  		{"./core":61}],64:[function(z,O,A){(function(f,e){"object"===typeof A?O.exports=A=e(z("./core")):e(f.CryptoJS);})(this,function(f){(function(){function e(b){return b<<8&4278255360|b>>>8&16711935}var g=f.lib.WordArray,a=f.enc;a.Utf16=a.Utf16BE={stringify:function(b){var d=b.words;b=b.sigBytes;for(var v=[],m=0;m<b;m+=2)v.push(String.fromCharCode(d[m>>>2]>>>16-m%4*8&65535));return v.join("")},parse:function(b){for(var d=b.length,v=[],m=0;m<d;m++)v[m>>>1]|=b.charCodeAt(m)<<16-m%2*16;return g.create(v,
  		2*d)}};a.Utf16LE={stringify:function(b){var d=b.words;b=b.sigBytes;for(var v=[],m=0;m<b;m+=2){var r=e(d[m>>>2]>>>16-m%4*8&65535);v.push(String.fromCharCode(r));}return v.join("")},parse:function(b){for(var d=b.length,v=[],m=0;m<d;m++)v[m>>>1]|=e(b.charCodeAt(m)<<16-m%2*16);return g.create(v,2*d)}};})();return f.enc.Utf16});},{"./core":61}],65:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./sha1"),z("./hmac")):e(f.CryptoJS);})(this,function(f){(function(){var e=f.lib,
  		g=e.Base,a=e.WordArray;e=f.algo;var b=e.EvpKDF=g.extend({cfg:g.extend({keySize:4,hasher:e.MD5,iterations:1}),init:function(d){this.cfg=this.cfg.extend(d);},compute:function(d,v){var m=this.cfg,r=m.hasher.create(),h=a.create(),l=h.words,k=m.keySize;for(m=m.iterations;l.length<k;){n&&r.update(n);var n=r.update(d).finalize(v);r.reset();for(var w=1;w<m;w++)n=r.finalize(n),r.reset();h.concat(n);}h.sigBytes=4*k;return h}});f.EvpKDF=function(d,v,m){return b.create(m).compute(d,v)};})();return f.EvpKDF});},{"./core":61,
  		"./hmac":67,"./sha1":86}],66:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./cipher-core")):e(f.CryptoJS);})(this,function(f){(function(e){var g=f.lib.CipherParams,a=f.enc.Hex;f.format.Hex={stringify:function(b){return b.ciphertext.toString(a)},parse:function(b){b=a.parse(b);return g.create({ciphertext:b})}};})();return f.format.Hex});},{"./cipher-core":60,"./core":61}],67:[function(z,O,A){(function(f,e){"object"===typeof A?O.exports=A=e(z("./core")):e(f.CryptoJS);})(this,
  		function(f){(function(){var e=f.enc.Utf8;f.algo.HMAC=f.lib.Base.extend({init:function(g,a){g=this._hasher=new g.init;"string"==typeof a&&(a=e.parse(a));var b=g.blockSize,d=4*b;a.sigBytes>d&&(a=g.finalize(a));a.clamp();g=this._oKey=a.clone();a=this._iKey=a.clone();for(var v=g.words,m=a.words,r=0;r<b;r++)v[r]^=1549556828,m[r]^=909522486;g.sigBytes=a.sigBytes=d;this.reset();},reset:function(){var g=this._hasher;g.reset();g.update(this._iKey);},update:function(g){this._hasher.update(g);return this},finalize:function(g){var a=
  		this._hasher;g=a.finalize(g);a.reset();return a.finalize(this._oKey.clone().concat(g))}});})();});},{"./core":61}],68:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./x64-core"),z("./lib-typedarrays"),z("./enc-utf16"),z("./enc-base64"),z("./enc-base64url"),z("./md5"),z("./sha1"),z("./sha256"),z("./sha224"),z("./sha512"),z("./sha384"),z("./sha3"),z("./ripemd160"),z("./hmac"),z("./pbkdf2"),z("./evpkdf"),z("./cipher-core"),z("./mode-cfb"),z("./mode-ctr"),z("./mode-ctr-gladman"),
  		z("./mode-ofb"),z("./mode-ecb"),z("./pad-ansix923"),z("./pad-iso10126"),z("./pad-iso97971"),z("./pad-zeropadding"),z("./pad-nopadding"),z("./format-hex"),z("./aes"),z("./tripledes"),z("./rc4"),z("./rabbit"),z("./rabbit-legacy")):f.CryptoJS=e(f.CryptoJS);})(this,function(f){return f});},{"./aes":59,"./cipher-core":60,"./core":61,"./enc-base64":62,"./enc-base64url":63,"./enc-utf16":64,"./evpkdf":65,"./format-hex":66,"./hmac":67,"./lib-typedarrays":69,"./md5":70,"./mode-cfb":71,"./mode-ctr":73,"./mode-ctr-gladman":72,
  		"./mode-ecb":74,"./mode-ofb":75,"./pad-ansix923":76,"./pad-iso10126":77,"./pad-iso97971":78,"./pad-nopadding":79,"./pad-zeropadding":80,"./pbkdf2":81,"./rabbit":83,"./rabbit-legacy":82,"./rc4":84,"./ripemd160":85,"./sha1":86,"./sha224":87,"./sha256":88,"./sha3":89,"./sha384":90,"./sha512":91,"./tripledes":92,"./x64-core":93}],69:[function(z,O,A){(function(f,e){"object"===typeof A?O.exports=A=e(z("./core")):e(f.CryptoJS);})(this,function(f){(function(){if("function"==typeof ArrayBuffer){var e=f.lib.WordArray,
  		g=e.init;(e.init=function(a){a instanceof ArrayBuffer&&(a=new Uint8Array(a));if(a instanceof Int8Array||"undefined"!==typeof Uint8ClampedArray&&a instanceof Uint8ClampedArray||a instanceof Int16Array||a instanceof Uint16Array||a instanceof Int32Array||a instanceof Uint32Array||a instanceof Float32Array||a instanceof Float64Array)a=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);if(a instanceof Uint8Array){for(var b=a.byteLength,d=[],v=0;v<b;v++)d[v>>>2]|=a[v]<<24-v%4*8;g.call(this,d,b);}else g.apply(this,
  		arguments);}).prototype=e;}})();return f.lib.WordArray});},{"./core":61}],70:[function(z,O,A){(function(f,e){"object"===typeof A?O.exports=A=e(z("./core")):e(f.CryptoJS);})(this,function(f){(function(e){function g(l,k,n,w,t,u,y){l=l+(k&n|~k&w)+t+y;return (l<<u|l>>>32-u)+k}function a(l,k,n,w,t,u,y){l=l+(k&w|n&~w)+t+y;return (l<<u|l>>>32-u)+k}function b(l,k,n,w,t,u,y){l=l+(k^n^w)+t+y;return (l<<u|l>>>32-u)+k}function d(l,k,n,w,t,u,y){l=l+(n^(k|~w))+t+y;return (l<<u|l>>>32-u)+k}var v=f.lib,m=v.WordArray,r=v.Hasher;
  		v=f.algo;var h=[];(function(){for(var l=0;64>l;l++)h[l]=4294967296*e.abs(e.sin(l+1))|0;})();v=v.MD5=r.extend({_doReset:function(){this._hash=new m.init([1732584193,4023233417,2562383102,271733878]);},_doProcessBlock:function(l,k){for(var n=0;16>n;n++){var w=k+n,t=l[w];l[w]=(t<<8|t>>>24)&16711935|(t<<24|t>>>8)&4278255360;}n=this._hash.words;w=l[k+0];t=l[k+1];var u=l[k+2],y=l[k+3],x=l[k+4],F=l[k+5],D=l[k+6],I=l[k+7],S=l[k+8],Z=l[k+9],aa=l[k+10],P=l[k+11],R=l[k+12],V=l[k+13],G=l[k+14];l=l[k+15];k=n[0];
  		var K=n[1],J=n[2],c=n[3];k=g(k,K,J,c,w,7,h[0]);c=g(c,k,K,J,t,12,h[1]);J=g(J,c,k,K,u,17,h[2]);K=g(K,J,c,k,y,22,h[3]);k=g(k,K,J,c,x,7,h[4]);c=g(c,k,K,J,F,12,h[5]);J=g(J,c,k,K,D,17,h[6]);K=g(K,J,c,k,I,22,h[7]);k=g(k,K,J,c,S,7,h[8]);c=g(c,k,K,J,Z,12,h[9]);J=g(J,c,k,K,aa,17,h[10]);K=g(K,J,c,k,P,22,h[11]);k=g(k,K,J,c,R,7,h[12]);c=g(c,k,K,J,V,12,h[13]);J=g(J,c,k,K,G,17,h[14]);K=g(K,J,c,k,l,22,h[15]);k=a(k,K,J,c,t,5,h[16]);c=a(c,k,K,J,D,9,h[17]);J=a(J,c,k,K,P,14,h[18]);K=a(K,J,c,k,w,20,h[19]);k=a(k,K,J,c,
  		F,5,h[20]);c=a(c,k,K,J,aa,9,h[21]);J=a(J,c,k,K,l,14,h[22]);K=a(K,J,c,k,x,20,h[23]);k=a(k,K,J,c,Z,5,h[24]);c=a(c,k,K,J,G,9,h[25]);J=a(J,c,k,K,y,14,h[26]);K=a(K,J,c,k,S,20,h[27]);k=a(k,K,J,c,V,5,h[28]);c=a(c,k,K,J,u,9,h[29]);J=a(J,c,k,K,I,14,h[30]);K=a(K,J,c,k,R,20,h[31]);k=b(k,K,J,c,F,4,h[32]);c=b(c,k,K,J,S,11,h[33]);J=b(J,c,k,K,P,16,h[34]);K=b(K,J,c,k,G,23,h[35]);k=b(k,K,J,c,t,4,h[36]);c=b(c,k,K,J,x,11,h[37]);J=b(J,c,k,K,I,16,h[38]);K=b(K,J,c,k,aa,23,h[39]);k=b(k,K,J,c,V,4,h[40]);c=b(c,k,K,J,w,11,
  		h[41]);J=b(J,c,k,K,y,16,h[42]);K=b(K,J,c,k,D,23,h[43]);k=b(k,K,J,c,Z,4,h[44]);c=b(c,k,K,J,R,11,h[45]);J=b(J,c,k,K,l,16,h[46]);K=b(K,J,c,k,u,23,h[47]);k=d(k,K,J,c,w,6,h[48]);c=d(c,k,K,J,I,10,h[49]);J=d(J,c,k,K,G,15,h[50]);K=d(K,J,c,k,F,21,h[51]);k=d(k,K,J,c,R,6,h[52]);c=d(c,k,K,J,y,10,h[53]);J=d(J,c,k,K,aa,15,h[54]);K=d(K,J,c,k,t,21,h[55]);k=d(k,K,J,c,S,6,h[56]);c=d(c,k,K,J,l,10,h[57]);J=d(J,c,k,K,D,15,h[58]);K=d(K,J,c,k,V,21,h[59]);k=d(k,K,J,c,x,6,h[60]);c=d(c,k,K,J,P,10,h[61]);J=d(J,c,k,K,u,15,h[62]);
  		K=d(K,J,c,k,Z,21,h[63]);n[0]=n[0]+k|0;n[1]=n[1]+K|0;n[2]=n[2]+J|0;n[3]=n[3]+c|0;},_doFinalize:function(){var l=this._data,k=l.words,n=8*this._nDataBytes,w=8*l.sigBytes;k[w>>>5]|=128<<24-w%32;var t=e.floor(n/4294967296);k[(w+64>>>9<<4)+15]=(t<<8|t>>>24)&16711935|(t<<24|t>>>8)&4278255360;k[(w+64>>>9<<4)+14]=(n<<8|n>>>24)&16711935|(n<<24|n>>>8)&4278255360;l.sigBytes=4*(k.length+1);this._process();l=this._hash;k=l.words;for(n=0;4>n;n++)w=k[n],k[n]=(w<<8|w>>>24)&16711935|(w<<24|w>>>8)&4278255360;return l},
  		clone:function(){var l=r.clone.call(this);l._hash=this._hash.clone();return l}});f.MD5=r._createHelper(v);f.HmacMD5=r._createHmacHelper(v);})(Math);return f.MD5});},{"./core":61}],71:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./cipher-core")):e(f.CryptoJS);})(this,function(f){f.mode.CFB=function(){function e(a,b,d,v){var m;(m=this._iv)?(m=m.slice(0),this._iv=void 0):m=this._prevBlock;v.encryptBlock(m,0);for(v=0;v<d;v++)a[b+v]^=m[v];}var g=f.lib.BlockCipherMode.extend();
  		g.Encryptor=g.extend({processBlock:function(a,b){var d=this._cipher,v=d.blockSize;e.call(this,a,b,v,d);this._prevBlock=a.slice(b,b+v);}});g.Decryptor=g.extend({processBlock:function(a,b){var d=this._cipher,v=d.blockSize,m=a.slice(b,b+v);e.call(this,a,b,v,d);this._prevBlock=m;}});return g}();return f.mode.CFB});},{"./cipher-core":60,"./core":61}],72:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./cipher-core")):e(f.CryptoJS);})(this,function(f){f.mode.CTRGladman=function(){function e(b){if(255===
  		(b>>24&255)){var d=b>>16&255,v=b>>8&255,m=b&255;255===d?(d=0,255===v?(v=0,255===m?m=0:++m):++v):++d;b=d<<16;b+=v<<8;b+=m;}else b+=16777216;return b}var g=f.lib.BlockCipherMode.extend(),a=g.Encryptor=g.extend({processBlock:function(b,d){var v=this._cipher,m=v.blockSize,r=this._iv,h=this._counter;r&&(h=this._counter=r.slice(0),this._iv=void 0);r=h;0===(r[0]=e(r[0]))&&(r[1]=e(r[1]));h=h.slice(0);v.encryptBlock(h,0);for(v=0;v<m;v++)b[d+v]^=h[v];}});g.Decryptor=a;return g}();return f.mode.CTRGladman});},
  		{"./cipher-core":60,"./core":61}],73:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./cipher-core")):e(f.CryptoJS);})(this,function(f){f.mode.CTR=function(){var e=f.lib.BlockCipherMode.extend(),g=e.Encryptor=e.extend({processBlock:function(a,b){var d=this._cipher,v=d.blockSize,m=this._iv,r=this._counter;m&&(r=this._counter=m.slice(0),this._iv=void 0);m=r.slice(0);d.encryptBlock(m,0);r[v-1]=r[v-1]+1|0;for(d=0;d<v;d++)a[b+d]^=m[d];}});e.Decryptor=g;return e}();return f.mode.CTR});},
  		{"./cipher-core":60,"./core":61}],74:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./cipher-core")):e(f.CryptoJS);})(this,function(f){f.mode.ECB=function(){var e=f.lib.BlockCipherMode.extend();e.Encryptor=e.extend({processBlock:function(g,a){this._cipher.encryptBlock(g,a);}});e.Decryptor=e.extend({processBlock:function(g,a){this._cipher.decryptBlock(g,a);}});return e}();return f.mode.ECB});},{"./cipher-core":60,"./core":61}],75:[function(z,O,A){(function(f,e,g){"object"===
  		typeof A?O.exports=A=e(z("./core"),z("./cipher-core")):e(f.CryptoJS);})(this,function(f){f.mode.OFB=function(){var e=f.lib.BlockCipherMode.extend(),g=e.Encryptor=e.extend({processBlock:function(a,b){var d=this._cipher,v=d.blockSize,m=this._iv,r=this._keystream;m&&(r=this._keystream=m.slice(0),this._iv=void 0);d.encryptBlock(r,0);for(d=0;d<v;d++)a[b+d]^=r[d];}});e.Decryptor=g;return e}();return f.mode.OFB});},{"./cipher-core":60,"./core":61}],76:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=
  		A=e(z("./core"),z("./cipher-core")):e(f.CryptoJS);})(this,function(f){f.pad.AnsiX923={pad:function(e,g){var a=e.sigBytes;g*=4;g-=a%g;a=a+g-1;e.clamp();e.words[a>>>2]|=g<<24-a%4*8;e.sigBytes+=g;},unpad:function(e){e.sigBytes-=e.words[e.sigBytes-1>>>2]&255;}};return f.pad.Ansix923});},{"./cipher-core":60,"./core":61}],77:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./cipher-core")):e(f.CryptoJS);})(this,function(f){f.pad.Iso10126={pad:function(e,g){g*=4;g-=e.sigBytes%
  		g;e.concat(f.lib.WordArray.random(g-1)).concat(f.lib.WordArray.create([g<<24],1));},unpad:function(e){e.sigBytes-=e.words[e.sigBytes-1>>>2]&255;}};return f.pad.Iso10126});},{"./cipher-core":60,"./core":61}],78:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./cipher-core")):e(f.CryptoJS);})(this,function(f){f.pad.Iso97971={pad:function(e,g){e.concat(f.lib.WordArray.create([2147483648],1));f.pad.ZeroPadding.pad(e,g);},unpad:function(e){f.pad.ZeroPadding.unpad(e);e.sigBytes--;}};
  		return f.pad.Iso97971});},{"./cipher-core":60,"./core":61}],79:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./cipher-core")):e(f.CryptoJS);})(this,function(f){f.pad.NoPadding={pad:function(){},unpad:function(){}};return f.pad.NoPadding});},{"./cipher-core":60,"./core":61}],80:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./cipher-core")):e(f.CryptoJS);})(this,function(f){f.pad.ZeroPadding={pad:function(e,g){g*=4;e.clamp();e.sigBytes+=
  		g-(e.sigBytes%g||g);},unpad:function(e){var g=e.words,a;for(a=e.sigBytes-1;0<=a;a--)if(g[a>>>2]>>>24-a%4*8&255){e.sigBytes=a+1;break}}};return f.pad.ZeroPadding});},{"./cipher-core":60,"./core":61}],81:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./sha1"),z("./hmac")):e(f.CryptoJS);})(this,function(f){(function(){var e=f.lib,g=e.Base,a=e.WordArray;e=f.algo;var b=e.HMAC,d=e.PBKDF2=g.extend({cfg:g.extend({keySize:4,hasher:e.SHA1,iterations:1}),init:function(v){this.cfg=
  		this.cfg.extend(v);},compute:function(v,m){var r=this.cfg;v=b.create(r.hasher,v);var h=a.create(),l=a.create([1]),k=h.words,n=l.words,w=r.keySize;for(r=r.iterations;k.length<w;){var t=v.update(m).finalize(l);v.reset();for(var u=t.words,y=u.length,x=t,F=1;F<r;F++){x=v.finalize(x);v.reset();for(var D=x.words,I=0;I<y;I++)u[I]^=D[I];}h.concat(t);n[0]++;}h.sigBytes=4*w;return h}});f.PBKDF2=function(v,m,r){return d.create(r).compute(v,m)};})();return f.PBKDF2});},{"./core":61,"./hmac":67,"./sha1":86}],82:[function(z,
  		O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./enc-base64"),z("./md5"),z("./evpkdf"),z("./cipher-core")):e(f.CryptoJS);})(this,function(f){(function(){function e(){for(var m=this._X,r=this._C,h=0;8>h;h++)b[h]=r[h];r[0]=r[0]+1295307597+this._b|0;r[1]=r[1]+3545052371+(r[0]>>>0<b[0]>>>0?1:0)|0;r[2]=r[2]+886263092+(r[1]>>>0<b[1]>>>0?1:0)|0;r[3]=r[3]+1295307597+(r[2]>>>0<b[2]>>>0?1:0)|0;r[4]=r[4]+3545052371+(r[3]>>>0<b[3]>>>0?1:0)|0;r[5]=r[5]+886263092+(r[4]>>>0<b[4]>>>0?1:0)|
  		0;r[6]=r[6]+1295307597+(r[5]>>>0<b[5]>>>0?1:0)|0;r[7]=r[7]+3545052371+(r[6]>>>0<b[6]>>>0?1:0)|0;this._b=r[7]>>>0<b[7]>>>0?1:0;for(h=0;8>h;h++){var l=m[h]+r[h],k=l&65535,n=l>>>16;d[h]=((k*k>>>17)+k*n>>>15)+n*n^((l&4294901760)*l|0)+((l&65535)*l|0);}m[0]=d[0]+(d[7]<<16|d[7]>>>16)+(d[6]<<16|d[6]>>>16)|0;m[1]=d[1]+(d[0]<<8|d[0]>>>24)+d[7]|0;m[2]=d[2]+(d[1]<<16|d[1]>>>16)+(d[0]<<16|d[0]>>>16)|0;m[3]=d[3]+(d[2]<<8|d[2]>>>24)+d[1]|0;m[4]=d[4]+(d[3]<<16|d[3]>>>16)+(d[2]<<16|d[2]>>>16)|0;m[5]=d[5]+(d[4]<<8|
  		d[4]>>>24)+d[3]|0;m[6]=d[6]+(d[5]<<16|d[5]>>>16)+(d[4]<<16|d[4]>>>16)|0;m[7]=d[7]+(d[6]<<8|d[6]>>>24)+d[5]|0;}var g=f.lib.StreamCipher,a=[],b=[],d=[],v=f.algo.RabbitLegacy=g.extend({_doReset:function(){var m=this._key.words,r=this.cfg.iv,h=this._X=[m[0],m[3]<<16|m[2]>>>16,m[1],m[0]<<16|m[3]>>>16,m[2],m[1]<<16|m[0]>>>16,m[3],m[2]<<16|m[1]>>>16];m=this._C=[m[2]<<16|m[2]>>>16,m[0]&4294901760|m[1]&65535,m[3]<<16|m[3]>>>16,m[1]&4294901760|m[2]&65535,m[0]<<16|m[0]>>>16,m[2]&4294901760|m[3]&65535,m[1]<<16|
  		m[1]>>>16,m[3]&4294901760|m[0]&65535];for(var l=this._b=0;4>l;l++)e.call(this);for(l=0;8>l;l++)m[l]^=h[l+4&7];if(r){h=r.words;r=h[0];h=h[1];r=(r<<8|r>>>24)&16711935|(r<<24|r>>>8)&4278255360;h=(h<<8|h>>>24)&16711935|(h<<24|h>>>8)&4278255360;l=r>>>16|h&4294901760;var k=h<<16|r&65535;m[0]^=r;m[1]^=l;m[2]^=h;m[3]^=k;m[4]^=r;m[5]^=l;m[6]^=h;m[7]^=k;for(l=0;4>l;l++)e.call(this);}},_doProcessBlock:function(m,r){var h=this._X;e.call(this);a[0]=h[0]^h[5]>>>16^h[3]<<16;a[1]=h[2]^h[7]>>>16^h[5]<<16;a[2]=h[4]^
  		h[1]>>>16^h[7]<<16;a[3]=h[6]^h[3]>>>16^h[1]<<16;for(h=0;4>h;h++)a[h]=(a[h]<<8|a[h]>>>24)&16711935|(a[h]<<24|a[h]>>>8)&4278255360,m[r+h]^=a[h];},blockSize:4,ivSize:2});f.RabbitLegacy=g._createHelper(v);})();return f.RabbitLegacy});},{"./cipher-core":60,"./core":61,"./enc-base64":62,"./evpkdf":65,"./md5":70}],83:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./enc-base64"),z("./md5"),z("./evpkdf"),z("./cipher-core")):e(f.CryptoJS);})(this,function(f){(function(){function e(){for(var m=
  		this._X,r=this._C,h=0;8>h;h++)b[h]=r[h];r[0]=r[0]+1295307597+this._b|0;r[1]=r[1]+3545052371+(r[0]>>>0<b[0]>>>0?1:0)|0;r[2]=r[2]+886263092+(r[1]>>>0<b[1]>>>0?1:0)|0;r[3]=r[3]+1295307597+(r[2]>>>0<b[2]>>>0?1:0)|0;r[4]=r[4]+3545052371+(r[3]>>>0<b[3]>>>0?1:0)|0;r[5]=r[5]+886263092+(r[4]>>>0<b[4]>>>0?1:0)|0;r[6]=r[6]+1295307597+(r[5]>>>0<b[5]>>>0?1:0)|0;r[7]=r[7]+3545052371+(r[6]>>>0<b[6]>>>0?1:0)|0;this._b=r[7]>>>0<b[7]>>>0?1:0;for(h=0;8>h;h++){var l=m[h]+r[h],k=l&65535,n=l>>>16;d[h]=((k*k>>>17)+k*n>>>
  		15)+n*n^((l&4294901760)*l|0)+((l&65535)*l|0);}m[0]=d[0]+(d[7]<<16|d[7]>>>16)+(d[6]<<16|d[6]>>>16)|0;m[1]=d[1]+(d[0]<<8|d[0]>>>24)+d[7]|0;m[2]=d[2]+(d[1]<<16|d[1]>>>16)+(d[0]<<16|d[0]>>>16)|0;m[3]=d[3]+(d[2]<<8|d[2]>>>24)+d[1]|0;m[4]=d[4]+(d[3]<<16|d[3]>>>16)+(d[2]<<16|d[2]>>>16)|0;m[5]=d[5]+(d[4]<<8|d[4]>>>24)+d[3]|0;m[6]=d[6]+(d[5]<<16|d[5]>>>16)+(d[4]<<16|d[4]>>>16)|0;m[7]=d[7]+(d[6]<<8|d[6]>>>24)+d[5]|0;}var g=f.lib.StreamCipher,a=[],b=[],d=[],v=f.algo.Rabbit=g.extend({_doReset:function(){for(var m=
  		this._key.words,r=this.cfg.iv,h=0;4>h;h++)m[h]=(m[h]<<8|m[h]>>>24)&16711935|(m[h]<<24|m[h]>>>8)&4278255360;var l=this._X=[m[0],m[3]<<16|m[2]>>>16,m[1],m[0]<<16|m[3]>>>16,m[2],m[1]<<16|m[0]>>>16,m[3],m[2]<<16|m[1]>>>16];m=this._C=[m[2]<<16|m[2]>>>16,m[0]&4294901760|m[1]&65535,m[3]<<16|m[3]>>>16,m[1]&4294901760|m[2]&65535,m[0]<<16|m[0]>>>16,m[2]&4294901760|m[3]&65535,m[1]<<16|m[1]>>>16,m[3]&4294901760|m[0]&65535];for(h=this._b=0;4>h;h++)e.call(this);for(h=0;8>h;h++)m[h]^=l[h+4&7];if(r){h=r.words;r=
  		h[0];h=h[1];r=(r<<8|r>>>24)&16711935|(r<<24|r>>>8)&4278255360;h=(h<<8|h>>>24)&16711935|(h<<24|h>>>8)&4278255360;l=r>>>16|h&4294901760;var k=h<<16|r&65535;m[0]^=r;m[1]^=l;m[2]^=h;m[3]^=k;m[4]^=r;m[5]^=l;m[6]^=h;m[7]^=k;for(h=0;4>h;h++)e.call(this);}},_doProcessBlock:function(m,r){var h=this._X;e.call(this);a[0]=h[0]^h[5]>>>16^h[3]<<16;a[1]=h[2]^h[7]>>>16^h[5]<<16;a[2]=h[4]^h[1]>>>16^h[7]<<16;a[3]=h[6]^h[3]>>>16^h[1]<<16;for(h=0;4>h;h++)a[h]=(a[h]<<8|a[h]>>>24)&16711935|(a[h]<<24|a[h]>>>8)&4278255360,
  		m[r+h]^=a[h];},blockSize:4,ivSize:2});f.Rabbit=g._createHelper(v);})();return f.Rabbit});},{"./cipher-core":60,"./core":61,"./enc-base64":62,"./evpkdf":65,"./md5":70}],84:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./enc-base64"),z("./md5"),z("./evpkdf"),z("./cipher-core")):e(f.CryptoJS);})(this,function(f){(function(){function e(){for(var d=this._S,v=this._i,m=this._j,r=0,h=0;4>h;h++){v=(v+1)%256;m=(m+d[v])%256;var l=d[v];d[v]=d[m];d[m]=l;r|=d[(d[v]+d[m])%256]<<
  		24-8*h;}this._i=v;this._j=m;return r}var g=f.lib.StreamCipher,a=f.algo,b=a.RC4=g.extend({_doReset:function(){var d=this._key,v=d.words;d=d.sigBytes;for(var m=this._S=[],r=0;256>r;r++)m[r]=r;for(var h=r=0;256>r;r++){var l=r%d;h=(h+m[r]+(v[l>>>2]>>>24-l%4*8&255))%256;l=m[r];m[r]=m[h];m[h]=l;}this._i=this._j=0;},_doProcessBlock:function(d,v){d[v]^=e.call(this);},keySize:8,ivSize:0});f.RC4=g._createHelper(b);a=a.RC4Drop=b.extend({cfg:b.cfg.extend({drop:192}),_doReset:function(){b._doReset.call(this);for(var d=
  		this.cfg.drop;0<d;d--)e.call(this);}});f.RC4Drop=g._createHelper(a);})();return f.RC4});},{"./cipher-core":60,"./core":61,"./enc-base64":62,"./evpkdf":65,"./md5":70}],85:[function(z,O,A){(function(f,e){"object"===typeof A?O.exports=A=e(z("./core")):e(f.CryptoJS);})(this,function(f){(function(e){function g(k,n){return k<<n|k>>>32-n}e=f.lib;var a=e.WordArray,b=e.Hasher;e=f.algo;var d=a.create([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,
  		12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13]),v=a.create([5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11]),m=a.create([11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6]),r=
  		a.create([8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11]),h=a.create([0,1518500249,1859775393,2400959708,2840853838]),l=a.create([1352829926,1548603684,1836072691,2053994217,0]);e=e.RIPEMD160=b.extend({_doReset:function(){this._hash=a.create([1732584193,4023233417,2562383102,271733878,3285377520]);},_doProcessBlock:function(k,n){for(var w=0;16>w;w++){var t=
  		n+w,u=k[t];k[t]=(u<<8|u>>>24)&16711935|(u<<24|u>>>8)&4278255360;}t=this._hash.words;u=h.words;var y=l.words,x=d.words,F=v.words,D=m.words,I=r.words,S,Z,aa,P,R;var V=S=t[0];var G=Z=t[1];var K=aa=t[2];var J=P=t[3];var c=R=t[4];for(w=0;80>w;w+=1){var p=S+k[n+x[w]]|0;p=16>w?p+((Z^aa^P)+u[0]):32>w?p+((Z&aa|~Z&P)+u[1]):48>w?p+(((Z|~aa)^P)+u[2]):64>w?p+((Z&P|aa&~P)+u[3]):p+((Z^(aa|~P))+u[4]);p|=0;p=g(p,D[w]);p=p+R|0;S=R;R=P;P=g(aa,10);aa=Z;Z=p;p=V+k[n+F[w]]|0;p=16>w?p+((G^(K|~J))+y[0]):32>w?p+((G&J|K&~J)+
  		y[1]):48>w?p+(((G|~K)^J)+y[2]):64>w?p+((G&K|~G&J)+y[3]):p+((G^K^J)+y[4]);p|=0;p=g(p,I[w]);p=p+c|0;V=c;c=J;J=g(K,10);K=G;G=p;}p=t[1]+aa+J|0;t[1]=t[2]+P+c|0;t[2]=t[3]+R+V|0;t[3]=t[4]+S+G|0;t[4]=t[0]+Z+K|0;t[0]=p;},_doFinalize:function(){var k=this._data,n=k.words,w=8*this._nDataBytes,t=8*k.sigBytes;n[t>>>5]|=128<<24-t%32;n[(t+64>>>9<<4)+14]=(w<<8|w>>>24)&16711935|(w<<24|w>>>8)&4278255360;k.sigBytes=4*(n.length+1);this._process();k=this._hash;n=k.words;for(w=0;5>w;w++)t=n[w],n[w]=(t<<8|t>>>24)&16711935|
  		(t<<24|t>>>8)&4278255360;return k},clone:function(){var k=b.clone.call(this);k._hash=this._hash.clone();return k}});f.RIPEMD160=b._createHelper(e);f.HmacRIPEMD160=b._createHmacHelper(e);})(Math);return f.RIPEMD160});},{"./core":61}],86:[function(z,O,A){(function(f,e){"object"===typeof A?O.exports=A=e(z("./core")):e(f.CryptoJS);})(this,function(f){(function(){var e=f.lib,g=e.WordArray,a=e.Hasher,b=[];e=f.algo.SHA1=a.extend({_doReset:function(){this._hash=new g.init([1732584193,4023233417,2562383102,271733878,
  		3285377520]);},_doProcessBlock:function(d,v){for(var m=this._hash.words,r=m[0],h=m[1],l=m[2],k=m[3],n=m[4],w=0;80>w;w++){if(16>w)b[w]=d[v+w]|0;else {var t=b[w-3]^b[w-8]^b[w-14]^b[w-16];b[w]=t<<1|t>>>31;}t=(r<<5|r>>>27)+n+b[w];t=20>w?t+((h&l|~h&k)+1518500249):40>w?t+((h^l^k)+1859775393):60>w?t+((h&l|h&k|l&k)-1894007588):t+((h^l^k)-899497514);n=k;k=l;l=h<<30|h>>>2;h=r;r=t;}m[0]=m[0]+r|0;m[1]=m[1]+h|0;m[2]=m[2]+l|0;m[3]=m[3]+k|0;m[4]=m[4]+n|0;},_doFinalize:function(){var d=this._data,v=d.words,m=8*this._nDataBytes,
  		r=8*d.sigBytes;v[r>>>5]|=128<<24-r%32;v[(r+64>>>9<<4)+14]=Math.floor(m/4294967296);v[(r+64>>>9<<4)+15]=m;d.sigBytes=4*v.length;this._process();return this._hash},clone:function(){var d=a.clone.call(this);d._hash=this._hash.clone();return d}});f.SHA1=a._createHelper(e);f.HmacSHA1=a._createHmacHelper(e);})();return f.SHA1});},{"./core":61}],87:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./sha256")):e(f.CryptoJS);})(this,function(f){(function(){var e=f.lib.WordArray,
  		g=f.algo,a=g.SHA256;g=g.SHA224=a.extend({_doReset:function(){this._hash=new e.init([3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428]);},_doFinalize:function(){var b=a._doFinalize.call(this);b.sigBytes-=4;return b}});f.SHA224=a._createHelper(g);f.HmacSHA224=a._createHmacHelper(g);})();return f.SHA224});},{"./core":61,"./sha256":88}],88:[function(z,O,A){(function(f,e){"object"===typeof A?O.exports=A=e(z("./core")):e(f.CryptoJS);})(this,function(f){(function(e){var g=
  		f.lib,a=g.WordArray,b=g.Hasher;g=f.algo;var d=[],v=[];(function(){function r(n){for(var w=e.sqrt(n),t=2;t<=w;t++)if(!(n%t))return  false;return  true}function h(n){return 4294967296*(n-(n|0))|0}for(var l=2,k=0;64>k;)r(l)&&(8>k&&(d[k]=h(e.pow(l,.5))),v[k]=h(e.pow(l,1/3)),k++),l++;})();var m=[];g=g.SHA256=b.extend({_doReset:function(){this._hash=new a.init(d.slice(0));},_doProcessBlock:function(r,h){for(var l=this._hash.words,k=l[0],n=l[1],w=l[2],t=l[3],u=l[4],y=l[5],x=l[6],F=l[7],D=0;64>D;D++){if(16>D)m[D]=r[h+
  		D]|0;else {var I=m[D-15],S=m[D-2];m[D]=((I<<25|I>>>7)^(I<<14|I>>>18)^I>>>3)+m[D-7]+((S<<15|S>>>17)^(S<<13|S>>>19)^S>>>10)+m[D-16];}I=F+((u<<26|u>>>6)^(u<<21|u>>>11)^(u<<7|u>>>25))+(u&y^~u&x)+v[D]+m[D];S=((k<<30|k>>>2)^(k<<19|k>>>13)^(k<<10|k>>>22))+(k&n^k&w^n&w);F=x;x=y;y=u;u=t+I|0;t=w;w=n;n=k;k=I+S|0;}l[0]=l[0]+k|0;l[1]=l[1]+n|0;l[2]=l[2]+w|0;l[3]=l[3]+t|0;l[4]=l[4]+u|0;l[5]=l[5]+y|0;l[6]=l[6]+x|0;l[7]=l[7]+F|0;},_doFinalize:function(){var r=this._data,h=r.words,l=8*this._nDataBytes,k=8*r.sigBytes;h[k>>>
  		5]|=128<<24-k%32;h[(k+64>>>9<<4)+14]=e.floor(l/4294967296);h[(k+64>>>9<<4)+15]=l;r.sigBytes=4*h.length;this._process();return this._hash},clone:function(){var r=b.clone.call(this);r._hash=this._hash.clone();return r}});f.SHA256=b._createHelper(g);f.HmacSHA256=b._createHmacHelper(g);})(Math);return f.SHA256});},{"./core":61}],89:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./x64-core")):e(f.CryptoJS);})(this,function(f){(function(e){var g=f.lib,a=g.WordArray,b=g.Hasher,
  		d=f.x64.Word;g=f.algo;var v=[],m=[],r=[];(function(){for(var l=1,k=0,n=0;24>n;n++){v[l+5*k]=(n+1)*(n+2)/2%64;var w=(2*l+3*k)%5;l=k%5;k=w;}for(l=0;5>l;l++)for(k=0;5>k;k++)m[l+5*k]=k+(2*l+3*k)%5*5;l=1;for(k=0;24>k;k++){for(var t=w=n=0;7>t;t++){if(l&1){var u=(1<<t)-1;32>u?w^=1<<u:n^=1<<u-32;}l=l&128?l<<1^113:l<<1;}r[k]=d.create(n,w);}})();var h=[];(function(){for(var l=0;25>l;l++)h[l]=d.create();})();g=g.SHA3=b.extend({cfg:b.cfg.extend({outputLength:512}),_doReset:function(){for(var l=this._state=[],k=0;25>
  		k;k++)l[k]=new d.init;this.blockSize=(1600-2*this.cfg.outputLength)/32;},_doProcessBlock:function(l,k){for(var n=this._state,w=this.blockSize/2,t=0;t<w;t++){var u=l[k+2*t],y=l[k+2*t+1];u=(u<<8|u>>>24)&16711935|(u<<24|u>>>8)&4278255360;y=(y<<8|y>>>24)&16711935|(y<<24|y>>>8)&4278255360;var x=n[t];x.high^=y;x.low^=u;}for(l=0;24>l;l++){for(k=0;5>k;k++){for(u=y=w=0;5>u;u++)x=n[k+5*u],w^=x.high,y^=x.low;x=h[k];x.high=w;x.low=y;}for(k=0;5>k;k++)for(x=h[(k+4)%5],w=h[(k+1)%5],t=w.high,u=w.low,w=x.high^(t<<1|
  		u>>>31),y=x.low^(u<<1|t>>>31),u=0;5>u;u++)x=n[k+5*u],x.high^=w,x.low^=y;for(t=1;25>t;t++)x=n[t],k=x.high,x=x.low,u=v[t],32>u?(w=k<<u|x>>>32-u,y=x<<u|k>>>32-u):(w=x<<u-32|k>>>64-u,y=k<<u-32|x>>>64-u),x=h[m[t]],x.high=w,x.low=y;x=h[0];k=n[0];x.high=k.high;x.low=k.low;for(k=0;5>k;k++)for(u=0;5>u;u++)t=k+5*u,x=n[t],w=h[t],t=h[(k+1)%5+5*u],y=h[(k+2)%5+5*u],x.high=w.high^~t.high&y.high,x.low=w.low^~t.low&y.low;x=n[0];k=r[l];x.high^=k.high;x.low^=k.low;}},_doFinalize:function(){var l=this._data,k=l.words,
  		n=8*l.sigBytes,w=32*this.blockSize;k[n>>>5]|=1<<24-n%32;k[(e.ceil((n+1)/w)*w>>>5)-1]|=128;l.sigBytes=4*k.length;this._process();l=this._state;k=this.cfg.outputLength/8;n=k/8;w=[];for(var t=0;t<n;t++){var u=l[t],y=u.high;u=u.low;y=(y<<8|y>>>24)&16711935|(y<<24|y>>>8)&4278255360;u=(u<<8|u>>>24)&16711935|(u<<24|u>>>8)&4278255360;w.push(u);w.push(y);}return new a.init(w,k)},clone:function(){for(var l=b.clone.call(this),k=l._state=this._state.slice(0),n=0;25>n;n++)k[n]=k[n].clone();return l}});f.SHA3=b._createHelper(g);
  		f.HmacSHA3=b._createHmacHelper(g);})(Math);return f.SHA3});},{"./core":61,"./x64-core":93}],90:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./x64-core"),z("./sha512")):e(f.CryptoJS);})(this,function(f){(function(){var e=f.x64,g=e.Word,a=e.WordArray;e=f.algo;var b=e.SHA512;e=e.SHA384=b.extend({_doReset:function(){this._hash=new a.init([new g.init(3418070365,3238371032),new g.init(1654270250,914150663),new g.init(2438529370,812702999),new g.init(355462360,4144912697),
  		new g.init(1731405415,4290775857),new g.init(2394180231,1750603025),new g.init(3675008525,1694076839),new g.init(1203062813,3204075428)]);},_doFinalize:function(){var d=b._doFinalize.call(this);d.sigBytes-=16;return d}});f.SHA384=b._createHelper(e);f.HmacSHA384=b._createHmacHelper(e);})();return f.SHA384});},{"./core":61,"./sha512":91,"./x64-core":93}],91:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./x64-core")):e(f.CryptoJS);})(this,function(f){(function(){function e(){return b.create.apply(b,
  		arguments)}var g=f.lib.Hasher,a=f.x64,b=a.Word,d=a.WordArray;a=f.algo;var v=[e(1116352408,3609767458),e(1899447441,602891725),e(3049323471,3964484399),e(3921009573,2173295548),e(961987163,4081628472),e(1508970993,3053834265),e(2453635748,2937671579),e(2870763221,3664609560),e(3624381080,2734883394),e(310598401,1164996542),e(607225278,1323610764),e(1426881987,3590304994),e(1925078388,4068182383),e(2162078206,991336113),e(2614888103,633803317),e(3248222580,3479774868),e(3835390401,2666613458),e(4022224774,
  		944711139),e(264347078,2341262773),e(604807628,2007800933),e(770255983,1495990901),e(1249150122,1856431235),e(1555081692,3175218132),e(1996064986,2198950837),e(2554220882,3999719339),e(2821834349,766784016),e(2952996808,2566594879),e(3210313671,3203337956),e(3336571891,1034457026),e(3584528711,2466948901),e(113926993,3758326383),e(338241895,168717936),e(666307205,1188179964),e(773529912,1546045734),e(1294757372,1522805485),e(1396182291,2643833823),e(1695183700,2343527390),e(1986661051,1014477480),
  		e(2177026350,1206759142),e(2456956037,344077627),e(2730485921,1290863460),e(2820302411,3158454273),e(3259730800,3505952657),e(3345764771,106217008),e(3516065817,3606008344),e(3600352804,1432725776),e(4094571909,1467031594),e(275423344,851169720),e(430227734,3100823752),e(506948616,1363258195),e(659060556,3750685593),e(883997877,3785050280),e(958139571,3318307427),e(1322822218,3812723403),e(1537002063,2003034995),e(1747873779,3602036899),e(1955562222,1575990012),e(2024104815,1125592928),e(2227730452,
  		2716904306),e(2361852424,442776044),e(2428436474,593698344),e(2756734187,3733110249),e(3204031479,2999351573),e(3329325298,3815920427),e(3391569614,3928383900),e(3515267271,566280711),e(3940187606,3454069534),e(4118630271,4000239992),e(116418474,1914138554),e(174292421,2731055270),e(289380356,3203993006),e(460393269,320620315),e(685471733,587496836),e(852142971,1086792851),e(1017036298,365543100),e(1126000580,2618297676),e(1288033470,3409855158),e(1501505948,4234509866),e(1607167915,987167468),e(1816402316,
  		1246189591)],m=[];(function(){for(var r=0;80>r;r++)m[r]=e();})();a=a.SHA512=g.extend({_doReset:function(){this._hash=new d.init([new b.init(1779033703,4089235720),new b.init(3144134277,2227873595),new b.init(1013904242,4271175723),new b.init(2773480762,1595750129),new b.init(1359893119,2917565137),new b.init(2600822924,725511199),new b.init(528734635,4215389547),new b.init(1541459225,327033209)]);},_doProcessBlock:function(r,h){var l=this._hash.words,k=l[0],n=l[1],w=l[2],t=l[3],u=l[4],y=l[5],x=l[6];
  		l=l[7];for(var F=k.high,D=k.low,I=n.high,S=n.low,Z=w.high,aa=w.low,P=t.high,R=t.low,V=u.high,G=u.low,K=y.high,J=y.low,c=x.high,p=x.low,B=l.high,H=l.low,T=F,ia=D,X=I,ba=S,Q=Z,L=aa,M=P,Y=R,oa=V,ta=G,sa=K,Ua=J,ua=c,Za=p,$a=B,da=H,ea=0;80>ea;ea++){var la=m[ea];if(16>ea){var ha=la.high=r[h+2*ea]|0;var ja=la.low=r[h+2*ea+1]|0;}else {ha=m[ea-15];ja=ha.high;var Ya=ha.low;ha=(ja>>>1|Ya<<31)^(ja>>>8|Ya<<24)^ja>>>7;Ya=(Ya>>>1|ja<<31)^(Ya>>>8|ja<<24)^(Ya>>>7|ja<<25);var bb=m[ea-2];ja=bb.high;var Oa=bb.low;bb=(ja>>>
  		19|Oa<<13)^(ja<<3|Oa>>>29)^ja>>>6;Oa=(Oa>>>19|ja<<13)^(Oa<<3|ja>>>29)^(Oa>>>6|ja<<26);ja=m[ea-7];var jb=ja.high,db=m[ea-16],fb=db.high;db=db.low;ja=Ya+ja.low;ha=ha+jb+(ja>>>0<Ya>>>0?1:0);ja+=Oa;ha=ha+bb+(ja>>>0<Oa>>>0?1:0);ja+=db;ha=ha+fb+(ja>>>0<db>>>0?1:0);la.high=ha;la.low=ja;}jb=oa&sa^~oa&ua;db=ta&Ua^~ta&Za;la=T&X^T&Q^X&Q;var kb=ia&ba^ia&L^ba&L;Ya=(T>>>28|ia<<4)^(T<<30|ia>>>2)^(T<<25|ia>>>7);bb=(ia>>>28|T<<4)^(ia<<30|T>>>2)^(ia<<25|T>>>7);Oa=v[ea];var ib=Oa.high,E=Oa.low;Oa=da+((ta>>>14|oa<<18)^
  		(ta>>>18|oa<<14)^(ta<<23|oa>>>9));fb=$a+((oa>>>14|ta<<18)^(oa>>>18|ta<<14)^(oa<<23|ta>>>9))+(Oa>>>0<da>>>0?1:0);Oa+=db;fb=fb+jb+(Oa>>>0<db>>>0?1:0);Oa+=E;fb=fb+ib+(Oa>>>0<E>>>0?1:0);Oa+=ja;fb=fb+ha+(Oa>>>0<ja>>>0?1:0);ja=bb+kb;ha=Ya+la+(ja>>>0<bb>>>0?1:0);$a=ua;da=Za;ua=sa;Za=Ua;sa=oa;Ua=ta;ta=Y+Oa|0;oa=M+fb+(ta>>>0<Y>>>0?1:0)|0;M=Q;Y=L;Q=X;L=ba;X=T;ba=ia;ia=Oa+ja|0;T=fb+ha+(ia>>>0<Oa>>>0?1:0)|0;}D=k.low=D+ia;k.high=F+T+(D>>>0<ia>>>0?1:0);S=n.low=S+ba;n.high=I+X+(S>>>0<ba>>>0?1:0);aa=w.low=aa+L;w.high=
  		Z+Q+(aa>>>0<L>>>0?1:0);R=t.low=R+Y;t.high=P+M+(R>>>0<Y>>>0?1:0);G=u.low=G+ta;u.high=V+oa+(G>>>0<ta>>>0?1:0);J=y.low=J+Ua;y.high=K+sa+(J>>>0<Ua>>>0?1:0);p=x.low=p+Za;x.high=c+ua+(p>>>0<Za>>>0?1:0);H=l.low=H+da;l.high=B+$a+(H>>>0<da>>>0?1:0);},_doFinalize:function(){var r=this._data,h=r.words,l=8*this._nDataBytes,k=8*r.sigBytes;h[k>>>5]|=128<<24-k%32;h[(k+128>>>10<<5)+30]=Math.floor(l/4294967296);h[(k+128>>>10<<5)+31]=l;r.sigBytes=4*h.length;this._process();return this._hash.toX32()},clone:function(){var r=
  		g.clone.call(this);r._hash=this._hash.clone();return r},blockSize:32});f.SHA512=g._createHelper(a);f.HmacSHA512=g._createHmacHelper(a);})();return f.SHA512});},{"./core":61,"./x64-core":93}],92:[function(z,O,A){(function(f,e,g){"object"===typeof A?O.exports=A=e(z("./core"),z("./enc-base64"),z("./md5"),z("./evpkdf"),z("./cipher-core")):e(f.CryptoJS);})(this,function(f){(function(){function e(n,w){w&=this._lBlock>>>n^this._rBlock;this._rBlock^=w;this._lBlock^=w<<n;}function g(n,w){w&=this._rBlock>>>n^this._lBlock;
  		this._lBlock^=w;this._rBlock^=w<<n;}var a=f.lib,b=a.WordArray;a=a.BlockCipher;var d=f.algo,v=[57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4],m=[14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,41,52,31,37,47,55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32],r=[1,2,4,6,8,10,12,14,15,17,19,21,23,25,27,28],h=[{0:8421888,268435456:32768,536870912:8421378,805306368:2,
  		1073741824:512,1342177280:8421890,1610612736:8389122,1879048192:8388608,2147483648:514,2415919104:8389120,2684354560:33280,2952790016:8421376,3221225472:32770,3489660928:8388610,3758096384:0,4026531840:33282,134217728:0,402653184:8421890,671088640:33282,939524096:32768,1207959552:8421888,1476395008:512,1744830464:8421378,2013265920:2,2281701376:8389120,2550136832:33280,2818572288:8421376,3087007744:8389122,3355443200:8388610,3623878656:32770,3892314112:514,4160749568:8388608,1:32768,268435457:2,536870913:8421888,
  		805306369:8388608,1073741825:8421378,1342177281:33280,1610612737:512,1879048193:8389122,2147483649:8421890,2415919105:8421376,2684354561:8388610,2952790017:33282,3221225473:514,3489660929:8389120,3758096385:32770,4026531841:0,134217729:8421890,402653185:8421376,671088641:8388608,939524097:512,1207959553:32768,1476395009:8388610,1744830465:2,2013265921:33282,2281701377:32770,2550136833:8389122,2818572289:514,3087007745:8421888,3355443201:8389120,3623878657:0,3892314113:33280,4160749569:8421378},{0:1074282512,
  		16777216:16384,33554432:524288,50331648:1074266128,67108864:1073741840,83886080:1074282496,100663296:1073758208,117440512:16,134217728:540672,150994944:1073758224,167772160:1073741824,184549376:540688,201326592:524304,218103808:0,234881024:16400,251658240:1074266112,8388608:1073758208,25165824:540688,41943040:16,58720256:1073758224,75497472:1074282512,92274688:1073741824,109051904:524288,125829120:1074266128,142606336:524304,159383552:0,176160768:16384,192937984:1074266112,209715200:1073741840,226492416:540672,
  		243269632:1074282496,260046848:16400,268435456:0,285212672:1074266128,301989888:1073758224,318767104:1074282496,335544320:1074266112,352321536:16,369098752:540688,385875968:16384,402653184:16400,419430400:524288,436207616:524304,452984832:1073741840,469762048:540672,486539264:1073758208,503316480:1073741824,520093696:1074282512,276824064:540688,293601280:524288,310378496:1074266112,327155712:16384,343932928:1073758208,360710144:1074282512,377487360:16,394264576:1073741824,411041792:1074282496,427819008:1073741840,
  		444596224:1073758224,461373440:524304,478150656:0,494927872:16400,511705088:1074266128,528482304:540672},{0:260,1048576:0,2097152:67109120,3145728:65796,4194304:65540,5242880:67108868,6291456:67174660,7340032:67174400,8388608:67108864,9437184:67174656,10485760:65792,11534336:67174404,12582912:67109124,13631488:65536,14680064:4,15728640:256,524288:67174656,1572864:67174404,2621440:0,3670016:67109120,4718592:67108868,5767168:65536,6815744:65540,7864320:260,8912896:4,9961472:256,11010048:67174400,12058624:65796,
  		13107200:65792,14155776:67109124,15204352:67174660,16252928:67108864,16777216:67174656,17825792:65540,18874368:65536,19922944:67109120,20971520:256,22020096:67174660,23068672:67108868,24117248:0,25165824:67109124,26214400:67108864,27262976:4,28311552:65792,29360128:67174400,30408704:260,31457280:65796,32505856:67174404,17301504:67108864,18350080:260,19398656:67174656,20447232:0,21495808:65540,22544384:67109120,23592960:256,24641536:67174404,25690112:65536,26738688:67174660,27787264:65796,28835840:67108868,
  		29884416:67109124,30932992:67174400,31981568:4,33030144:65792},{0:2151682048,65536:2147487808,131072:4198464,196608:2151677952,262144:0,327680:4198400,393216:2147483712,458752:4194368,524288:2147483648,589824:4194304,655360:64,720896:2147487744,786432:2151678016,851968:4160,917504:4096,983040:2151682112,32768:2147487808,98304:64,163840:2151678016,229376:2147487744,294912:4198400,360448:2151682112,425984:0,491520:2151677952,557056:4096,622592:2151682048,688128:4194304,753664:4160,819200:2147483648,
  		884736:4194368,950272:4198464,1015808:2147483712,1048576:4194368,1114112:4198400,1179648:2147483712,1245184:0,1310720:4160,1376256:2151678016,1441792:2151682048,1507328:2147487808,1572864:2151682112,1638400:2147483648,1703936:2151677952,1769472:4198464,1835008:2147487744,1900544:4194304,1966080:64,2031616:4096,1081344:2151677952,1146880:2151682112,1212416:0,1277952:4198400,1343488:4194368,1409024:2147483648,1474560:2147487808,1540096:64,1605632:2147483712,1671168:4096,1736704:2147487744,1802240:2151678016,
  		1867776:4160,1933312:2151682048,1998848:4194304,2064384:4198464},{0:128,4096:17039360,8192:262144,12288:536870912,16384:537133184,20480:16777344,24576:553648256,28672:262272,32768:16777216,36864:537133056,40960:536871040,45056:553910400,49152:553910272,53248:0,57344:17039488,61440:553648128,2048:17039488,6144:553648256,10240:128,14336:17039360,18432:262144,22528:537133184,26624:553910272,30720:536870912,34816:537133056,38912:0,43008:553910400,47104:16777344,51200:536871040,55296:553648128,59392:16777216,
  		63488:262272,65536:262144,69632:128,73728:536870912,77824:553648256,81920:16777344,86016:553910272,90112:537133184,94208:16777216,98304:553910400,102400:553648128,106496:17039360,110592:537133056,114688:262272,118784:536871040,122880:0,126976:17039488,67584:553648256,71680:16777216,75776:17039360,79872:537133184,83968:536870912,88064:17039488,92160:128,96256:553910272,100352:262272,104448:553910400,108544:0,112640:553648128,116736:16777344,120832:262144,124928:537133056,129024:536871040},{0:268435464,
  		256:8192,512:270532608,768:270540808,1024:268443648,1280:2097152,1536:2097160,1792:268435456,2048:0,2304:268443656,2560:2105344,2816:8,3072:270532616,3328:2105352,3584:8200,3840:270540800,128:270532608,384:270540808,640:8,896:2097152,1152:2105352,1408:268435464,1664:268443648,1920:8200,2176:2097160,2432:8192,2688:268443656,2944:270532616,3200:0,3456:270540800,3712:2105344,3968:268435456,4096:268443648,4352:270532616,4608:270540808,4864:8200,5120:2097152,5376:268435456,5632:268435464,5888:2105344,
  		6144:2105352,6400:0,6656:8,6912:270532608,7168:8192,7424:268443656,7680:270540800,7936:2097160,4224:8,4480:2105344,4736:2097152,4992:268435464,5248:268443648,5504:8200,5760:270540808,6016:270532608,6272:270540800,6528:270532616,6784:8192,7040:2105352,7296:2097160,7552:0,7808:268435456,8064:268443656},{0:1048576,16:33555457,32:1024,48:1049601,64:34604033,80:0,96:1,112:34603009,128:33555456,144:1048577,160:33554433,176:34604032,192:34603008,208:1025,224:1049600,240:33554432,8:34603009,24:0,40:33555457,
  		56:34604032,72:1048576,88:33554433,104:33554432,120:1025,136:1049601,152:33555456,168:34603008,184:1048577,200:1024,216:34604033,232:1,248:1049600,256:33554432,272:1048576,288:33555457,304:34603009,320:1048577,336:33555456,352:34604032,368:1049601,384:1025,400:34604033,416:1049600,432:1,448:0,464:34603008,480:33554433,496:1024,264:1049600,280:33555457,296:34603009,312:1,328:33554432,344:1048576,360:1025,376:34604032,392:33554433,408:34603008,424:0,440:34604033,456:1049601,472:1024,488:33555456,504:1048577},
  		{0:134219808,1:131072,2:134217728,3:32,4:131104,5:134350880,6:134350848,7:2048,8:134348800,9:134219776,10:133120,11:134348832,12:2080,13:0,14:134217760,15:133152,2147483648:2048,2147483649:134350880,2147483650:134219808,2147483651:134217728,2147483652:134348800,2147483653:133120,2147483654:133152,2147483655:32,2147483656:134217760,2147483657:2080,2147483658:131104,2147483659:134350848,2147483660:0,2147483661:134348832,2147483662:134219776,2147483663:131072,16:133152,17:134350848,18:32,19:2048,20:134219776,
  		21:134217760,22:134348832,23:131072,24:0,25:131104,26:134348800,27:134219808,28:134350880,29:133120,30:2080,31:134217728,2147483664:131072,2147483665:2048,2147483666:134348832,2147483667:133152,2147483668:32,2147483669:134348800,2147483670:134217728,2147483671:134219808,2147483672:134350880,2147483673:134217760,2147483674:134219776,2147483675:0,2147483676:133120,2147483677:2080,2147483678:131104,2147483679:134350848}],l=[4160749569,528482304,33030144,2064384,129024,8064,504,2147483679],k=d.DES=a.extend({_doReset:function(){for(var n=
  		this._key.words,w=[],t=0;56>t;t++){var u=v[t]-1;w[t]=n[u>>>5]>>>31-u%32&1;}n=this._subKeys=[];for(u=0;16>u;u++){var y=n[u]=[],x=r[u];for(t=0;24>t;t++)y[t/6|0]|=w[(m[t]-1+x)%28]<<31-t%6,y[4+(t/6|0)]|=w[28+(m[t+24]-1+x)%28]<<31-t%6;y[0]=y[0]<<1|y[0]>>>31;for(t=1;7>t;t++)y[t]>>>=4*(t-1)+3;y[7]=y[7]<<5|y[7]>>>27;}w=this._invSubKeys=[];for(t=0;16>t;t++)w[t]=n[15-t];},encryptBlock:function(n,w){this._doCryptBlock(n,w,this._subKeys);},decryptBlock:function(n,w){this._doCryptBlock(n,w,this._invSubKeys);},_doCryptBlock:function(n,
  		w,t){this._lBlock=n[w];this._rBlock=n[w+1];e.call(this,4,252645135);e.call(this,16,65535);g.call(this,2,858993459);g.call(this,8,16711935);e.call(this,1,1431655765);for(var u=0;16>u;u++){for(var y=t[u],x=this._lBlock,F=this._rBlock,D=0,I=0;8>I;I++)D|=h[I][((F^y[I])&l[I])>>>0];this._lBlock=F;this._rBlock=x^D;}t=this._lBlock;this._lBlock=this._rBlock;this._rBlock=t;e.call(this,1,1431655765);g.call(this,8,16711935);g.call(this,2,858993459);e.call(this,16,65535);e.call(this,4,252645135);n[w]=this._lBlock;
  		n[w+1]=this._rBlock;},keySize:2,ivSize:2,blockSize:2});f.DES=a._createHelper(k);d=d.TripleDES=a.extend({_doReset:function(){var n=this._key.words;if(2!==n.length&&4!==n.length&&6>n.length)throw Error("Invalid key length - 3DES requires the key length to be 64, 128, 192 or >192.");var w=n.slice(0,2),t=4>n.length?n.slice(0,2):n.slice(2,4);n=6>n.length?n.slice(0,2):n.slice(4,6);this._des1=k.createEncryptor(b.create(w));this._des2=k.createEncryptor(b.create(t));this._des3=k.createEncryptor(b.create(n));},
  		encryptBlock:function(n,w){this._des1.encryptBlock(n,w);this._des2.decryptBlock(n,w);this._des3.encryptBlock(n,w);},decryptBlock:function(n,w){this._des3.decryptBlock(n,w);this._des2.encryptBlock(n,w);this._des1.decryptBlock(n,w);},keySize:6,ivSize:2,blockSize:2});f.TripleDES=a._createHelper(d);})();return f.TripleDES});},{"./cipher-core":60,"./core":61,"./enc-base64":62,"./evpkdf":65,"./md5":70}],93:[function(z,O,A){(function(f,e){"object"===typeof A?O.exports=A=e(z("./core")):e(f.CryptoJS);})(this,function(f){(function(e){var g=
  		f.lib,a=g.Base,b=g.WordArray;g=f.x64={};g.Word=a.extend({init:function(d,v){this.high=d;this.low=v;}});g.WordArray=a.extend({init:function(d,v){d=this.words=d||[];this.sigBytes=v!=e?v:8*d.length;},toX32:function(){for(var d=this.words,v=d.length,m=[],r=0;r<v;r++){var h=d[r];m.push(h.high);m.push(h.low);}return b.create(m,this.sigBytes)},clone:function(){for(var d=a.clone.call(this),v=d.words=this.words.slice(0),m=v.length,r=0;r<m;r++)v[r]=v[r].clone();return d}});})();return f});},{"./core":61}],94:[function(z,
  		O,A){if(z=z("get-intrinsic")("%Object.getOwnPropertyDescriptor%",true))try{z([],"length");}catch(f){z=null;}O.exports=z;},{"get-intrinsic":99}],95:[function(z,O,A){function f(){f.init.call(this);}function e(t){if("function"!==typeof t)throw new TypeError('The "listener" argument must be of type Function. Received type '+typeof t);}function g(t,u,y,x){e(y);var F=t._events;if(void 0===F)F=t._events=Object.create(null),t._eventsCount=0;else { void 0!==F.newListener&&(t.emit("newListener",u,y.listener?y.listener:
  		y),F=t._events);var D=F[u];} void 0===D?(F[u]=y,++t._eventsCount):("function"===typeof D?D=F[u]=x?[y,D]:[D,y]:x?D.unshift(y):D.push(y),y=void 0===t._maxListeners?f.defaultMaxListeners:t._maxListeners,0<y&&D.length>y&&!D.warned&&(D.warned=true,y=Error("Possible EventEmitter memory leak detected. "+D.length+" "+String(u)+" listeners added. Use emitter.setMaxListeners() to increase limit"),y.name="MaxListenersExceededWarning",y.emitter=t,y.type=u,y.count=D.length,console&&console.warn&&console.warn(y)));
  		return t}function a(){if(!this.fired)return this.target.removeListener(this.type,this.wrapFn),this.fired=true,0===arguments.length?this.listener.call(this.target):this.listener.apply(this.target,arguments)}function b(t,u,y){t={fired:false,wrapFn:void 0,target:t,type:u,listener:y};u=a.bind(t);u.listener=y;return t.wrapFn=u}function d(t,u,y){t=t._events;if(void 0===t)return [];u=t[u];if(void 0===u)return [];if("function"===typeof u)return y?[u.listener||u]:[u];if(y)for(y=Array(u.length),t=0;t<y.length;++t)y[t]=
  		u[t].listener||u[t];else y=m(u,u.length);return y}function v(t){var u=this._events;if(void 0!==u){t=u[t];if("function"===typeof t)return 1;if(void 0!==t)return t.length}return 0}function m(t,u){for(var y=Array(u),x=0;x<u;++x)y[x]=t[x];return y}function r(t,u,y){"function"===typeof t.on&&h(t,"error",u,y);}function h(t,u,y,x){if("function"===typeof t.on)if(x.once)t.once(u,y);else t.on(u,y);else if("function"===typeof t.addEventListener)t.addEventListener(u,function I(D){x.once&&t.removeEventListener(u,
  		I);y(D);});else throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type '+typeof t);}var l=(z="object"===typeof Reflect?Reflect:null)&&"function"===typeof z.apply?z.apply:function(t,u,y){return Function.prototype.apply.call(t,u,y)};var k=z&&"function"===typeof z.ownKeys?z.ownKeys:Object.getOwnPropertySymbols?function(t){return Object.getOwnPropertyNames(t).concat(Object.getOwnPropertySymbols(t))}:function(t){return Object.getOwnPropertyNames(t)};var n=Number.isNaN||
  		function(t){return t!==t};O.exports=f;O.exports.once=function(t,u){return new Promise(function(y,x){function F(I){t.removeListener(u,D);x(I);}function D(){"function"===typeof t.removeListener&&t.removeListener("error",F);y([].slice.call(arguments));}h(t,u,D,{once:true});"error"!==u&&r(t,F,{once:true});})};f.EventEmitter=f;f.prototype._events=void 0;f.prototype._eventsCount=0;f.prototype._maxListeners=void 0;var w=10;Object.defineProperty(f,"defaultMaxListeners",{enumerable:true,get:function(){return w},set:function(t){if("number"!==
  		typeof t||0>t||n(t))throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received '+t+".");w=t;}});f.init=function(){if(void 0===this._events||this._events===Object.getPrototypeOf(this)._events)this._events=Object.create(null),this._eventsCount=0;this._maxListeners=this._maxListeners||void 0;};f.prototype.setMaxListeners=function(t){if("number"!==typeof t||0>t||n(t))throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received '+
  		t+".");this._maxListeners=t;return this};f.prototype.getMaxListeners=function(){return void 0===this._maxListeners?f.defaultMaxListeners:this._maxListeners};f.prototype.emit=function(t){for(var u=[],y=1;y<arguments.length;y++)u.push(arguments[y]);y="error"===t;var x=this._events;if(void 0!==x)y=y&&void 0===x.error;else if(!y)return  false;if(y){var F;0<u.length&&(F=u[0]);if(F instanceof Error)throw F;u=Error("Unhandled error."+(F?" ("+F.message+")":""));u.context=F;throw u;}y=x[t];if(void 0===y)return  false;
  		if("function"===typeof y)l(y,this,u);else for(F=y.length,x=m(y,F),y=0;y<F;++y)l(x[y],this,u);return  true};f.prototype.addListener=function(t,u){return g(this,t,u,false)};f.prototype.on=f.prototype.addListener;f.prototype.prependListener=function(t,u){return g(this,t,u,true)};f.prototype.once=function(t,u){e(u);this.on(t,b(this,t,u));return this};f.prototype.prependOnceListener=function(t,u){e(u);this.prependListener(t,b(this,t,u));return this};f.prototype.removeListener=function(t,u){var y;e(u);var x=this._events;
  		if(void 0===x)return this;var F=x[t];if(void 0===F)return this;if(F===u||F.listener===u)0===--this._eventsCount?this._events=Object.create(null):(delete x[t],x.removeListener&&this.emit("removeListener",t,F.listener||u));else if("function"!==typeof F){var D=-1;for(y=F.length-1;0<=y;y--)if(F[y]===u||F[y].listener===u){var I=F[y].listener;D=y;break}if(0>D)return this;if(0===D)F.shift();else {for(;D+1<F.length;D++)F[D]=F[D+1];F.pop();}1===F.length&&(x[t]=F[0]);void 0!==x.removeListener&&this.emit("removeListener",
  		t,I||u);}return this};f.prototype.off=f.prototype.removeListener;f.prototype.removeAllListeners=function(t){var u=this._events;if(void 0===u)return this;if(void 0===u.removeListener)return 0===arguments.length?(this._events=Object.create(null),this._eventsCount=0):void 0!==u[t]&&(0===--this._eventsCount?this._events=Object.create(null):delete u[t]),this;if(0===arguments.length){var y=Object.keys(u);for(u=0;u<y.length;++u){var x=y[u];"removeListener"!==x&&this.removeAllListeners(x);}this.removeAllListeners("removeListener");
  		this._events=Object.create(null);this._eventsCount=0;return this}y=u[t];if("function"===typeof y)this.removeListener(t,y);else if(void 0!==y)for(u=y.length-1;0<=u;u--)this.removeListener(t,y[u]);return this};f.prototype.listeners=function(t){return d(this,t,true)};f.prototype.rawListeners=function(t){return d(this,t,false)};f.listenerCount=function(t,u){return "function"===typeof t.listenerCount?t.listenerCount(u):v.call(t,u)};f.prototype.listenerCount=v;f.prototype.eventNames=function(){return 0<this._eventsCount?
  		k(this._events):[]};},{}],96:[function(z,O,A){var f=z("is-callable"),e=Object.prototype.toString,g=Object.prototype.hasOwnProperty;O.exports=function(a,b,d){if(!f(b))throw new TypeError("iterator must be a function");var v;3<=arguments.length&&(v=d);if("[object Array]"===e.call(a)){var m=v;v=0;for(var r=a.length;v<r;v++)g.call(a,v)&&(null==m?b(a[v],v,a):b.call(m,a[v],v,a));}else if("string"===typeof a)for(m=v,v=0,r=a.length;v<r;v++)null==m?b(a.charAt(v),v,a):b.call(m,a.charAt(v),v,a);else for(m in a)g.call(a,
  		m)&&(null==v?b(a[m],m,a):b.call(v,a[m],m,a));};},{"is-callable":107}],97:[function(z,O,A){var f=Array.prototype.slice,e=Object.prototype.toString;O.exports=function(g){var a=this;if("function"!==typeof a||"[object Function]"!==e.call(a))throw new TypeError("Function.prototype.bind called on incompatible "+a);for(var b=f.call(arguments,1),d,v=Math.max(0,a.length-b.length),m=[],r=0;r<v;r++)m.push("$"+r);d=Function("binder","return function ("+m.join(",")+"){ return binder.apply(this,arguments); }")(function(){if(this instanceof
  		d){var h=a.apply(this,b.concat(f.call(arguments)));return Object(h)===h?h:this}return a.apply(g,b.concat(f.call(arguments)))});a.prototype&&(v=function(){},v.prototype=a.prototype,d.prototype=new v,v.prototype=null);return d};},{}],98:[function(z,O,A){z=z("./implementation");O.exports=Function.prototype.bind||z;},{"./implementation":97}],99:[function(z,O,A){var f=SyntaxError,e=Function,g=TypeError,a=function(Z){try{return e('"use strict"; return ('+Z+").constructor;")()}catch(aa){}},b=Object.getOwnPropertyDescriptor;
  		if(b)try{b({},"");}catch(Z){b=null;}var d=function(){throw new g;};A=b?function(){try{return arguments.callee,d}catch(Z){try{return b(arguments,"callee").get}catch(aa){return d}}}():d;var v=z("has-symbols")(),m=Object.getPrototypeOf||function(Z){return Z.__proto__},r={},h="undefined"===typeof Uint8Array?void 0:m(Uint8Array),l={"%AggregateError%":"undefined"===typeof AggregateError?void 0:AggregateError,"%Array%":Array,"%ArrayBuffer%":"undefined"===typeof ArrayBuffer?void 0:ArrayBuffer,"%ArrayIteratorPrototype%":v?
  		m([][Symbol.iterator]()):void 0,"%AsyncFromSyncIteratorPrototype%":void 0,"%AsyncFunction%":r,"%AsyncGenerator%":r,"%AsyncGeneratorFunction%":r,"%AsyncIteratorPrototype%":r,"%Atomics%":"undefined"===typeof Atomics?void 0:Atomics,"%BigInt%":"undefined"===typeof BigInt?void 0:BigInt,"%Boolean%":Boolean,"%DataView%":"undefined"===typeof DataView?void 0:DataView,"%Date%":Date,"%decodeURI%":decodeURI,"%decodeURIComponent%":decodeURIComponent,"%encodeURI%":encodeURI,"%encodeURIComponent%":encodeURIComponent,
  		"%Error%":Error,"%eval%":eval,"%EvalError%":EvalError,"%Float32Array%":"undefined"===typeof Float32Array?void 0:Float32Array,"%Float64Array%":"undefined"===typeof Float64Array?void 0:Float64Array,"%FinalizationRegistry%":"undefined"===typeof FinalizationRegistry?void 0:FinalizationRegistry,"%Function%":e,"%GeneratorFunction%":r,"%Int8Array%":"undefined"===typeof Int8Array?void 0:Int8Array,"%Int16Array%":"undefined"===typeof Int16Array?void 0:Int16Array,"%Int32Array%":"undefined"===typeof Int32Array?
  		void 0:Int32Array,"%isFinite%":isFinite,"%isNaN%":isNaN,"%IteratorPrototype%":v?m(m([][Symbol.iterator]())):void 0,"%JSON%":"object"===typeof JSON?JSON:void 0,"%Map%":"undefined"===typeof Map?void 0:Map,"%MapIteratorPrototype%":"undefined"!==typeof Map&&v?m((new Map)[Symbol.iterator]()):void 0,"%Math%":Math,"%Number%":Number,"%Object%":Object,"%parseFloat%":parseFloat,"%parseInt%":parseInt,"%Promise%":"undefined"===typeof Promise?void 0:Promise,"%Proxy%":"undefined"===typeof Proxy?void 0:Proxy,"%RangeError%":RangeError,
  		"%ReferenceError%":ReferenceError,"%Reflect%":"undefined"===typeof Reflect?void 0:Reflect,"%RegExp%":RegExp,"%Set%":"undefined"===typeof Set?void 0:Set,"%SetIteratorPrototype%":"undefined"!==typeof Set&&v?m((new Set)[Symbol.iterator]()):void 0,"%SharedArrayBuffer%":"undefined"===typeof SharedArrayBuffer?void 0:SharedArrayBuffer,"%String%":String,"%StringIteratorPrototype%":v?m(""[Symbol.iterator]()):void 0,"%Symbol%":v?Symbol:void 0,"%SyntaxError%":f,"%ThrowTypeError%":A,"%TypedArray%":h,"%TypeError%":g,
  		"%Uint8Array%":"undefined"===typeof Uint8Array?void 0:Uint8Array,"%Uint8ClampedArray%":"undefined"===typeof Uint8ClampedArray?void 0:Uint8ClampedArray,"%Uint16Array%":"undefined"===typeof Uint16Array?void 0:Uint16Array,"%Uint32Array%":"undefined"===typeof Uint32Array?void 0:Uint32Array,"%URIError%":URIError,"%WeakMap%":"undefined"===typeof WeakMap?void 0:WeakMap,"%WeakRef%":"undefined"===typeof WeakRef?void 0:WeakRef,"%WeakSet%":"undefined"===typeof WeakSet?void 0:WeakSet},k=function P(aa){if("%AsyncFunction%"===
  		aa)var R=a("async function () {}");else if("%GeneratorFunction%"===aa)R=a("function* () {}");else if("%AsyncGeneratorFunction%"===aa)R=a("async function* () {}");else if("%AsyncGenerator%"===aa){var V=P("%AsyncGeneratorFunction%");V&&(R=V.prototype);}else "%AsyncIteratorPrototype%"===aa&&(V=P("%AsyncGenerator%"))&&(R=m(V.prototype));return l[aa]=R},n={"%ArrayBufferPrototype%":["ArrayBuffer","prototype"],"%ArrayPrototype%":["Array","prototype"],"%ArrayProto_entries%":["Array","prototype","entries"],
  		"%ArrayProto_forEach%":["Array","prototype","forEach"],"%ArrayProto_keys%":["Array","prototype","keys"],"%ArrayProto_values%":["Array","prototype","values"],"%AsyncFunctionPrototype%":["AsyncFunction","prototype"],"%AsyncGenerator%":["AsyncGeneratorFunction","prototype"],"%AsyncGeneratorPrototype%":["AsyncGeneratorFunction","prototype","prototype"],"%BooleanPrototype%":["Boolean","prototype"],"%DataViewPrototype%":["DataView","prototype"],"%DatePrototype%":["Date","prototype"],"%ErrorPrototype%":["Error",
  		"prototype"],"%EvalErrorPrototype%":["EvalError","prototype"],"%Float32ArrayPrototype%":["Float32Array","prototype"],"%Float64ArrayPrototype%":["Float64Array","prototype"],"%FunctionPrototype%":["Function","prototype"],"%Generator%":["GeneratorFunction","prototype"],"%GeneratorPrototype%":["GeneratorFunction","prototype","prototype"],"%Int8ArrayPrototype%":["Int8Array","prototype"],"%Int16ArrayPrototype%":["Int16Array","prototype"],"%Int32ArrayPrototype%":["Int32Array","prototype"],"%JSONParse%":["JSON",
  		"parse"],"%JSONStringify%":["JSON","stringify"],"%MapPrototype%":["Map","prototype"],"%NumberPrototype%":["Number","prototype"],"%ObjectPrototype%":["Object","prototype"],"%ObjProto_toString%":["Object","prototype","toString"],"%ObjProto_valueOf%":["Object","prototype","valueOf"],"%PromisePrototype%":["Promise","prototype"],"%PromiseProto_then%":["Promise","prototype","then"],"%Promise_all%":["Promise","all"],"%Promise_reject%":["Promise","reject"],"%Promise_resolve%":["Promise","resolve"],"%RangeErrorPrototype%":["RangeError",
  		"prototype"],"%ReferenceErrorPrototype%":["ReferenceError","prototype"],"%RegExpPrototype%":["RegExp","prototype"],"%SetPrototype%":["Set","prototype"],"%SharedArrayBufferPrototype%":["SharedArrayBuffer","prototype"],"%StringPrototype%":["String","prototype"],"%SymbolPrototype%":["Symbol","prototype"],"%SyntaxErrorPrototype%":["SyntaxError","prototype"],"%TypedArrayPrototype%":["TypedArray","prototype"],"%TypeErrorPrototype%":["TypeError","prototype"],"%Uint8ArrayPrototype%":["Uint8Array","prototype"],
  		"%Uint8ClampedArrayPrototype%":["Uint8ClampedArray","prototype"],"%Uint16ArrayPrototype%":["Uint16Array","prototype"],"%Uint32ArrayPrototype%":["Uint32Array","prototype"],"%URIErrorPrototype%":["URIError","prototype"],"%WeakMapPrototype%":["WeakMap","prototype"],"%WeakSetPrototype%":["WeakSet","prototype"]};A=z("function-bind");var w=z("has"),t=A.call(Function.call,Array.prototype.concat),u=A.call(Function.apply,Array.prototype.splice),y=A.call(Function.call,String.prototype.replace),x=A.call(Function.call,
  		String.prototype.slice),F=A.call(Function.call,RegExp.prototype.exec),D=/[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g,I=/\\(\\)?/g,S=function(aa){var P=x(aa,0,1),R=x(aa,-1);if("%"===P&&"%"!==R)throw new f("invalid intrinsic syntax, expected closing `%`");if("%"===R&&"%"!==P)throw new f("invalid intrinsic syntax, expected opening `%`");var V=[];y(aa,D,function(G,K,J,c){V[V.length]=J?y(c,I,"$1"):K||G;});return V};O.exports=function(aa,P){if("string"!==
  		typeof aa||0===aa.length)throw new g("intrinsic name must be a non-empty string");if(1<arguments.length&&"boolean"!==typeof P)throw new g('"allowMissing" argument must be a boolean');if(null===F(/^%?[^%]*%?$/,aa))throw new f("`%` may not be present anywhere but at the beginning and end of the intrinsic name");var R=S(aa),V=0<R.length?R[0]:"";var G="%"+V+"%",K=G;if(w(n,K)){var J=n[K];K="%"+J[0]+"%";}if(w(l,K)){var c=l[K];c===r&&(c=k(K));if("undefined"===typeof c&&!P)throw new g("intrinsic "+G+" exists, but is not available. Please file an issue!");
  		}else throw new f("intrinsic "+G+" does not exist!");G=c;K=false;J&&(V=J[0],u(R,t([0,1],J)));J=1;for(c=true;J<R.length;J+=1){var p=R[J];var B=x(p,0,1);var H=x(p,-1);if(('"'===B||"'"===B||"`"===B||'"'===H||"'"===H||"`"===H)&&B!==H)throw new f("property names with quotes must have matching quotes");"constructor"!==p&&c||(K=true);V+="."+p;B="%"+V+"%";if(w(l,B))G=l[B];else if(null!=G){if(!(p in G)){if(!P)throw new g("base intrinsic for "+aa+" exists, but the property is not available.");return}b&&J+1>=R.length?
  		(H=b(G,p),G=(c=!!H)&&"get"in H&&!("originalValue"in H.get)?H.get:G[p]):(c=w(G,p),G=G[p]);c&&!K&&(l[B]=G);}}return G};},{"function-bind":98,has:103,"has-symbols":100}],100:[function(z,O,A){var f="undefined"!==typeof Symbol&&Symbol,e=z("./shams");O.exports=function(){return "function"!==typeof f||"function"!==typeof Symbol||"symbol"!==typeof f("foo")||"symbol"!==typeof Symbol("bar")?false:e()};},{"./shams":101}],101:[function(z,O,A){O.exports=function(){if("function"!==typeof Symbol||"function"!==typeof Object.getOwnPropertySymbols)return  false;
  		if("symbol"===typeof Symbol.iterator)return  true;var f={},e=Symbol("test"),g=Object(e);if("string"===typeof e||"[object Symbol]"!==Object.prototype.toString.call(e)||"[object Symbol]"!==Object.prototype.toString.call(g))return  false;f[e]=42;for(e in f)return  false;if("function"===typeof Object.keys&&0!==Object.keys(f).length||"function"===typeof Object.getOwnPropertyNames&&0!==Object.getOwnPropertyNames(f).length)return  false;g=Object.getOwnPropertySymbols(f);return 1!==g.length||g[0]!==e||!Object.prototype.propertyIsEnumerable.call(f,
  		e)||"function"===typeof Object.getOwnPropertyDescriptor&&(f=Object.getOwnPropertyDescriptor(f,e),42!==f.value||true!==f.enumerable)?false:true};},{}],102:[function(z,O,A){var f=z("has-symbols/shams");O.exports=function(){return f()&&!!Symbol.toStringTag};},{"has-symbols/shams":101}],103:[function(z,O,A){z=z("function-bind");O.exports=z.call(Function.call,Object.prototype.hasOwnProperty);},{"function-bind":98}],104:[function(z,O,A){A.read=function(f,e,g,a,b){var d=8*b-a-1;var v=(1<<d)-1,m=v>>1,r=-7;b=g?b-1:
  		0;var h=g?-1:1,l=f[e+b];b+=h;g=l&(1<<-r)-1;l>>=-r;for(r+=d;0<r;g=256*g+f[e+b],b+=h,r-=8);d=g&(1<<-r)-1;g>>=-r;for(r+=a;0<r;d=256*d+f[e+b],b+=h,r-=8);if(0===g)g=1-m;else {if(g===v)return d?NaN:Infinity*(l?-1:1);d+=Math.pow(2,a);g-=m;}return (l?-1:1)*d*Math.pow(2,g-a)};A.write=function(f,e,g,a,b,d){var v,m=8*d-b-1,r=(1<<m)-1,h=r>>1,l=23===b?Math.pow(2,-24)-Math.pow(2,-77):0;d=a?0:d-1;var k=a?1:-1,n=0>e||0===e&&0>1/e?1:0;e=Math.abs(e);isNaN(e)||Infinity===e?(e=isNaN(e)?1:0,a=r):(a=Math.floor(Math.log(e)/
  		Math.LN2),1>e*(v=Math.pow(2,-a))&&(a--,v*=2),e=1<=a+h?e+l/v:e+l*Math.pow(2,1-h),2<=e*v&&(a++,v/=2),a+h>=r?(e=0,a=r):1<=a+h?(e=(e*v-1)*Math.pow(2,b),a+=h):(e=e*Math.pow(2,h-1)*Math.pow(2,b),a=0));for(;8<=b;f[g+d]=e&255,d+=k,e/=256,b-=8);a=a<<b|e;for(m+=b;0<m;f[g+d]=a&255,d+=k,a/=256,m-=8);f[g+d-k]|=128*n;};},{}],105:[function(z,O,A){O.exports="function"===typeof Object.create?function(f,e){e&&(f.super_=e,f.prototype=Object.create(e.prototype,{constructor:{value:f,enumerable:false,writable:true,configurable:true}}));}:
  		function(f,e){if(e){f.super_=e;var g=function(){};g.prototype=e.prototype;f.prototype=new g;f.prototype.constructor=f;}};},{}],106:[function(z,O,A){var f=z("has-tostringtag/shams")(),e=z("call-bind/callBound")("Object.prototype.toString"),g=function(a){return f&&a&&"object"===typeof a&&Symbol.toStringTag in a?false:"[object Arguments]"===e(a)};z=function(a){return g(a)?true:null!==a&&"object"===typeof a&&"number"===typeof a.length&&0<=a.length&&"[object Array]"!==e(a)&&"[object Function]"===e(a.callee)};
  		A=function(){return g(arguments)}();g.isLegacyArguments=z;O.exports=A?g:z;},{"call-bind/callBound":46,"has-tostringtag/shams":102}],107:[function(z,O,A){var f=Function.prototype.toString,e="object"===typeof Reflect&&null!==Reflect&&Reflect.apply;if("function"===typeof e&&"function"===typeof Object.defineProperty)try{var g=Object.defineProperty({},"length",{get:function(){throw a;}});var a={};e(function(){throw 42;},null,g);}catch(k){k!==a&&(e=null);}else e=null;var b=/^\s*class\b/,d=function(k){try{var n=
  		f.call(k);return b.test(n)}catch(w){return  false}},v=function(k){try{if(d(k))return !1;f.call(k);return !0}catch(n){return  false}},m=Object.prototype.toString,r="function"===typeof Symbol&&!!Symbol.toStringTag,h=!(0 in[,]),l=function(){return  false};"object"===typeof document&&m.call(document.all)===m.call(document.all)&&(l=function(k){if(!(!h&&k||"undefined"!==typeof k&&"object"!==typeof k))try{var n=m.call(k);return ("[object HTMLAllCollection]"===n||"[object HTML document.all class]"===n||"[object HTMLCollection]"===
  		n||"[object Object]"===n)&&null==k("")}catch(w){}return  false});O.exports=e?function(k){if(l(k))return  true;if(!k||"function"!==typeof k&&"object"!==typeof k)return  false;try{e(k,null,g);}catch(n){if(n!==a)return  false}return !d(k)&&v(k)}:function(k){if(l(k))return  true;if(!k||"function"!==typeof k&&"object"!==typeof k)return  false;if(r)return v(k);if(d(k))return  false;var n=m.call(k);return "[object Function]"===n||"[object GeneratorFunction]"===n||/^\[object HTML/.test(n)?v(k):false};},{}],108:[function(z,O,A){var f=Object.prototype.toString,
  		e=Function.prototype.toString,g=/^\s*(?:function)?\*/,a=z("has-tostringtag/shams")(),b=Object.getPrototypeOf,d;O.exports=function(v){if("function"!==typeof v)return  false;if(g.test(e.call(v)))return  true;if(!a)return "[object GeneratorFunction]"===f.call(v);if(!b)return  false;if("undefined"===typeof d){a:if(a){try{var m=Function("return function*() {}")();break a}catch(r){}m=void 0;}else m=false;d=m?b(m):false;}return b(v)===d};},{"has-tostringtag/shams":102}],109:[function(z,O,A){(function(f){(function(){var e=z("for-each"),
  		g=z("available-typed-arrays"),a=z("call-bind/callBound"),b=a("Object.prototype.toString"),d=z("has-tostringtag/shams")(),v="undefined"===typeof globalThis?f:globalThis,m=g(),r=a("Array.prototype.indexOf",true)||function(t,u){for(var y=0;y<t.length;y+=1)if(t[y]===u)return y;return  -1},h=a("String.prototype.slice"),l={},k=z("es-abstract/helpers/getOwnPropertyDescriptor"),n=Object.getPrototypeOf;d&&k&&n&&e(m,function(t){var u=new v[t];if(Symbol.toStringTag in u){u=n(u);var y=k(u,Symbol.toStringTag);y||
  		(u=n(u),y=k(u,Symbol.toStringTag));l[t]=y.get;}});var w=function(t){var u=false;e(l,function(y,x){if(!u)try{u=y.call(t)===x;}catch(F){}});return u};O.exports=function(t){return t&&"object"===typeof t?d&&Symbol.toStringTag in t?k?w(t):false:(t=h(b(t),8,-1),-1<r(m,t)):false};}).call(this);}).call(this,"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{});},{"available-typed-arrays":25,"call-bind/callBound":46,"es-abstract/helpers/getOwnPropertyDescriptor":94,"for-each":96,
  		"has-tostringtag/shams":102}],110:[function(z,O,A){const f=z("safe-buffer").Buffer,e=z("assert"),g=z("bl"),a=z("./lib/streams"),b=z("./lib/decoder"),d=z("./lib/encoder"),v=z("./lib/helpers.js").IncompleteBufferError,m=z("./lib/codecs/DateCodec");O.exports=function(r){const h=[],l=new Map;r=r||{forceFloat64:false,compatibilityMode:false,disableTimestampEncoding:false,preferMap:false,protoAction:"error"};l.set(m.type,m.decode);r.disableTimestampEncoding||h.push(m);return {encode:d(h,r),decode:b(l,r),register:function(k,
  		n,w,t){e(n,"must have a constructor");e(w,"must have an encode function");e(0<=k,"must have a non-negative type");e(t,"must have a decode function");this.registerEncoder(function(u){return u instanceof n},function(u){const y=g(),x=f.allocUnsafe(1);x.writeInt8(k,0);y.append(x);y.append(w(u));return y});this.registerDecoder(k,t);return this},registerEncoder:function(k,n){e(k,"must have an encode function");e(n,"must have an encode function");h.push({check:k,encode:n});return this},registerDecoder:function(k,
  		n){e(0<=k,"must have a non-negative type");e(n,"must have a decode function");l.set(k,n);return this},encoder:a.encoder,decoder:a.decoder,buffer:true,type:"msgpack5",IncompleteBufferError:v}};},{"./lib/codecs/DateCodec":111,"./lib/decoder":112,"./lib/encoder":113,"./lib/helpers.js":114,"./lib/streams":115,assert:21,bl:28,"safe-buffer":134}],111:[function(z,O,A){(function(f){(function(){O.exports={check:function(e){return "function"===typeof e.getDate},type:-1,encode:function(e){if(null!==e){var g=1*e;
  		e=Math.floor(g/1E3);var a=1E6*(g-1E3*e);if(0>e||17179869184<e){g=f.allocUnsafe(13);g[0]=-1;g.writeUInt32BE(a,1);let b="";if(0<=e)b=e.toString(16),b="0000000000000000".slice(0,-1*b.length)+b;else {e=(-1*e).toString(2);for(a=e.length-1;"0"===e[a];)a--;e=e.slice(0,a).split("").map(function(d){return "1"===d?0:1}).join("")+e.slice(a,e.length);e="1111111111111111111111111111111111111111111111111111111111111111".slice(0,-1*e.length)+e;e.match(/.{1,8}/g).forEach(function(d){d=parseInt(d,2).toString(16);1===
  		d.length&&(d="0"+d);b+=d;});}g.write(b,5,"hex");return g}if(a||4294967295<e){g=f.allocUnsafe(9);g[0]=-1;const b=e&4294967295;g.writeInt32BE(4*a+e/Math.pow(2,32)&4294967295,1);g.writeInt32BE(b,5);return g}e=f.allocUnsafe(5);e[0]=-1;e.writeUInt32BE(Math.floor(g/1E3),1);return e}},decode:function(e){var g=0;switch(e.length){case 4:var a=e.readUInt32BE(0);break;case 8:a=e.readUInt32BE(0);e=e.readUInt32BE(4);g=a/4;a=(a&3)*Math.pow(2,32)+e;break;case 12:g=e.toString("hex",4,12);if(parseInt(e.toString("hex",
  		4,6),16)&128){let b="";g.match(/.{1,2}/g).forEach(function(d){d=parseInt(d,16).toString(2);d="00000000".slice(0,-1*d.length)+d;b+=d;});a=-1*parseInt(b.split("").map(function(d){return "1"===d?0:1}).join(""),2)-1;}else a=parseInt(g,16);g=e.readUInt32BE(0);}return new Date(1E3*a+Math.round(g/1E6))}};}).call(this);}).call(this,z("buffer").Buffer);},{buffer:45}],112:[function(z,O,A){function f(m,r,h,l,k){let n=r;const w=[];let t=0;for(;t++<h;){const u=g(m,n,k);if(!u)return null;w.push(u[0]);n+=u[1];}return [w,
  		l+n-r]}function e(m,r,h,l,k){m=f(m,r,2*h,l,k);if(!m)return null;const [n,w]=m;if(m=!k.options.preferMap)for(r=0;r<2*h;r+=2)if("string"!==typeof n[r]){m=false;break}if(m){m={};for(r=0;r<2*h;r+=2){l=n[r];const t=n[r+1];if("__proto__"===l){if("error"===k.options.protoAction)throw new SyntaxError("Object contains forbidden prototype property");if("remove"===k.options.protoAction)continue}m[l]=t;}return [m,w]}k=new Map;for(m=0;m<2*h;m+=2)k.set(n[m],n[m+1]);return [k,w]}function g(m,r,h){if(m.length<=r)return null;
  		var l=m.length-r,k=r;const n=m.readUInt8(k);k+=1;var w=v[n]||-1;if(l<w)return null;if(128>n)return [n,1];if(128===(n&240))return e(m,k,n&15,k-r,h);if(144===(n&240))return f(m,k,n&15,k-r,h);if(160===(n&224))return w=n&31,l>=1+w?[m.toString("utf8",k,k+w),w+1]:null;if(192<=n&&195>=n)return m=192===n?[null,1]:194===n?[false,1]:195===n?[true,1]:void 0,m;if(196<=n&&198>=n)return h=m.readUIntBE(k,w-1),k+=w-1,l>=w+h?[m.slice(k,k+h),w+h]:null;if(199<=n&&201>=n){var t=m.readUIntBE(k,w-2);k+=w-2;var u=m.readInt8(k);
  		return l>=w+t?a(m,k+1,u,t,w,h):null}if(202<=n&&203>=n)return --w,4===w&&(t=m.readFloatBE(k)),8===w&&(t=m.readDoubleBE(k)),[t,w+1];if(204<=n&&207>=n){--w;h=k+w;for(l=0;k<h;)l+=m.readUInt8(k++)*Math.pow(256,h-k);return [l,w+1]}if(208<=n&&211>=n){--w;1===w&&(u=m.readInt8(k));2===w&&(u=m.readInt16BE(k));4===w&&(u=m.readInt32BE(k));if(8===w){k=m.slice(k,k+8);if(m=128==(k[0]&128))for(l=1,h=7;0<=h;h--)l=(k[h]^255)+l,k[h]=l&255,l>>=8;h=k.readUInt32BE(0);k=k.readUInt32BE(4);u=(4294967296*h+k)*(m?-1:1);}return [u,
  		w+1]}if(212<=n&&216>=n)return l=m.readInt8(k),a(m,k+1,l,w-2,2,h);if(217<=n&&219>=n)return h=m.readUIntBE(k,w-1),k+=w-1,l>=w+h?[m.toString("utf8",k,k+h),w+h]:null;if(220<=n&&221>=n)return l=m.readUIntBE(k,w-1),f(m,k+(w-1),l,w,h);if(222<=n&&223>=n)switch(n){case 222:return w=m.readUInt16BE(k),e(m,k+2,w,3,h);case 223:return w=m.readUInt32BE(k),e(m,k+4,w,5,h)}if(224<=n)return [n-256,1];throw Error("not implemented yet");}function a(m,r,h,l,k,n){m=m.slice(r,r+l);n=n.decodingTypes.get(h);if(!n)throw Error("unable to find ext type "+
  		h);return [n(m),k+l]}const b=z("bl"),d=z("./helpers.js").IncompleteBufferError,v={196:2,197:3,198:5,199:3,200:4,201:6,202:5,203:9,204:2,205:3,206:5,207:9,208:2,209:3,210:5,211:9,212:3,213:4,214:6,215:10,216:18,217:2,218:3,219:5,222:3,220:3,221:5};O.exports=function(m,r){function h(k){b.isBufferList(k)||(k=b(k));const n=g(k,0,l);if(!n)throw new d;k.consume(n[1]);return n[0]}const l={decodingTypes:m,options:r,decode:h};return h};},{"./helpers.js":114,bl:28}],113:[function(z,O,A){function f(u,y){const x=
  		[m(u.length,144,220)];u.forEach(F=>{x.push(y(F));});if(x.length!==u.length+1)throw Error("Sparse arrays are not encodable in msgpack");return n(x)}function e(u,y,x){const F=[m(u.size,128,222)],D=[...u.keys()];y.preferMap||D.every(I=>"string"===typeof I)&&console.warn("Map with string only keys will be deserialized as an object!");D.forEach(I=>{F.push(x(I),x(u.get(I)));});return n(F)}function g(u,y,x){const F=[];for(const I in u)Object.prototype.hasOwnProperty.call(u,I)&&void 0!==u[I]&&"function"!==
  		typeof u[I]&&F.push(I);const D=[m(F.length,128,222)];y.sortKeys&&F.sort();F.forEach(I=>{D.push(x(I),x(u[I]));});return n(D)}function a(u,y,x){const F=x%4294967296;u.writeUInt32BE(Math.floor(x/4294967296),y+0);u.writeUInt32BE(F,y+4);}function b(u,y){!y&&t&&Object.is(t(u),u)?(y=k.allocUnsafe(5),y[0]=202,y.writeFloatBE(u,1)):(y=k.allocUnsafe(9),y[0]=203,y.writeDoubleBE(u,1));return y}function d(u,y){y=y.find(x=>x.check(u));return y?(y=y.encode(u))?n([v(y.length-1),y]):null:null}function v(u){return 1===
  		u?k.from([212]):2===u?k.from([213]):4===u?k.from([214]):8===u?k.from([215]):16===u?k.from([216]):256>u?k.from([199,u]):65536>u?k.from([200,u>>8,u&255]):k.from([201,u>>24,u>>16&255,u>>8&255,u&255])}function m(u,y,x){if(16>u)return k.from([y|u]);y=65536>u?2:4;const F=k.allocUnsafe(1+y);F[0]=65536>u?x:x+1;F.writeUIntBE(u,1,y);return F}function r(u){let y;255>=u?(y=k.allocUnsafe(2),y[0]=196,y[1]=u):65535>=u?(y=k.allocUnsafe(3),y[0]=197,y.writeUInt16BE(u,1)):(y=k.allocUnsafe(5),y[0]=198,y.writeUInt32BE(u,
  		1));return y}function h(u){let y;31>=u?(y=k.allocUnsafe(1),y[0]=160|u):65535>=u?(y=k.allocUnsafe(3),y[0]=218,y.writeUInt16BE(u,1)):(y=k.allocUnsafe(5),y[0]=219,y.writeUInt32BE(u,1));return y}function l(u,y){let x;if(w(u))return b(u,y.forceFloat64);if(9007199254740991<Math.abs(u))return b(u,true);if(0<=u){if(128>u)return k.from([u]);if(256>u)return k.from([204,u]);if(65536>u)return k.from([205,255&u>>8,255&u]);if(4294967295>=u)return k.from([206,255&u>>24,255&u>>16,255&u>>8,255&u]);9007199254740991>=
  		u&&(x=k.allocUnsafe(9),x[0]=207,a(x,1,u));}else if(-32<=u)x=k.allocUnsafe(1),x[0]=256+u;else if(-128<=u)x=k.allocUnsafe(2),x[0]=208,x.writeInt8(u,1);else if(-32768<=u)x=k.allocUnsafe(3),x[0]=209,x.writeInt16BE(u,1);else if(-214748365<u)x=k.allocUnsafe(5),x[0]=210,x.writeInt32BE(u,1);else if(-9007199254740991<=u){x=k.allocUnsafe(9);x[0]=211;y=x;const F=0>u;u=Math.abs(u);a(y,1,u);if(F){for(u=9;1<u--;)if(0!==y[u]){y[u]=(y[u]^255)+1;break}for(;1<u--;)y[u]^=255;}}return x}const k=z("safe-buffer").Buffer,
  		n=z("bl"),w=z("./helpers.js").isFloat;O.exports=function(u,y){function x(F){if(void 0===F)throw Error("undefined is not encodable in msgpack!");if(null===F)return k.from([192]);if(true===F)return k.from([195]);if(false===F)return k.from([194]);if(F instanceof Map)return e(F,y,x);if("string"===typeof F){const D=k.byteLength(F);let I;32>D?(I=k.allocUnsafe(1+D),I[0]=160|D,0<D&&I.write(F,1)):255>=D&&!y.compatibilityMode?(I=k.allocUnsafe(2+D),I[0]=217,I[1]=D,I.write(F,2)):65535>=D?(I=k.allocUnsafe(3+D),I[0]=
  		218,I.writeUInt16BE(D,1),I.write(F,3)):(I=k.allocUnsafe(5+D),I[0]=219,I.writeUInt32BE(D,1),I.write(F,5));return I}if(F&&(F.readUInt32LE||F instanceof Uint8Array))return F instanceof Uint8Array&&(F=k.from(F)),n([(y.compatibilityMode?h:r)(F.length),F]);if(Array.isArray(F))return f(F,x);if("object"===typeof F)return d(F,u)||g(F,y,x);if("number"===typeof F)return l(F,y);throw Error("not implemented yet");}return function(F){return x(F).slice()}};const t=Math.fround;},{"./helpers.js":114,bl:28,"safe-buffer":134}],
  		114:[function(z,O,A){function f(e){Error.call(this);Error.captureStackTrace&&Error.captureStackTrace(this,this.constructor);this.name=this.constructor.name;this.message=e||"unable to decode";}z=z("util");A.IncompleteBufferError=f;z.inherits(f,Error);A.isFloat=function(e){return 0!==e%1};},{util:155}],115:[function(z,O,A){function f(d){d=d||{};d.objectMode=true;d.highWaterMark=16;a.call(this,d);this._msgpack=d.msgpack;}function e(d){if(!(this instanceof e))return d=d||{},d.msgpack=this,new e(d);f.call(this,
  		d);this._wrap="wrap"in d&&d.wrap;}function g(d){if(!(this instanceof g))return d=d||{},d.msgpack=this,new g(d);f.call(this,d);this._chunks=b();this._wrap="wrap"in d&&d.wrap;}const a=z("readable-stream").Transform;A=z("inherits");const b=z("bl");A(f,a);A(e,f);e.prototype._transform=function(d,v,m){v=null;try{v=this._msgpack.encode(this._wrap?d.value:d).slice(0);}catch(r){return this.emit("error",r),m()}this.push(v);m();};A(g,f);g.prototype._transform=function(d,v,m){d&&this._chunks.append(d);try{let r=
  		this._msgpack.decode(this._chunks);this._wrap&&(r={value:r});this.push(r);}catch(r){r instanceof this._msgpack.IncompleteBufferError?m():this.emit("error",r);return}0<this._chunks.length?this._transform(null,v,m):m();};O.exports.decoder=g;O.exports.encoder=e;},{bl:28,inherits:105,"readable-stream":130}],116:[function(z,O,A){arguments[4][29][0].apply(A,arguments);},{dup:29}],117:[function(z,O,A){arguments[4][30][0].apply(A,arguments);},{"./_stream_readable":119,"./_stream_writable":121,_process:133,dup:30,
  		inherits:105}],118:[function(z,O,A){arguments[4][31][0].apply(A,arguments);},{"./_stream_transform":120,dup:31,inherits:105}],119:[function(z,O,A){arguments[4][32][0].apply(A,arguments);},{"../errors":116,"./_stream_duplex":117,"./internal/streams/async_iterator":122,"./internal/streams/buffer_list":123,"./internal/streams/destroy":124,"./internal/streams/from":126,"./internal/streams/state":128,"./internal/streams/stream":129,_process:133,buffer:45,dup:32,events:95,inherits:105,"string_decoder/":150,
  		util:44}],120:[function(z,O,A){arguments[4][33][0].apply(A,arguments);},{"../errors":116,"./_stream_duplex":117,dup:33,inherits:105}],121:[function(z,O,A){arguments[4][34][0].apply(A,arguments);},{"../errors":116,"./_stream_duplex":117,"./internal/streams/destroy":124,"./internal/streams/state":128,"./internal/streams/stream":129,_process:133,buffer:45,dup:34,inherits:105,"util-deprecate":152}],122:[function(z,O,A){arguments[4][35][0].apply(A,arguments);},{"./end-of-stream":125,_process:133,dup:35}],
  		123:[function(z,O,A){arguments[4][36][0].apply(A,arguments);},{buffer:45,dup:36,util:44}],124:[function(z,O,A){arguments[4][37][0].apply(A,arguments);},{_process:133,dup:37}],125:[function(z,O,A){arguments[4][38][0].apply(A,arguments);},{"../../../errors":116,dup:38}],126:[function(z,O,A){arguments[4][39][0].apply(A,arguments);},{dup:39}],127:[function(z,O,A){arguments[4][40][0].apply(A,arguments);},{"../../../errors":116,"./end-of-stream":125,dup:40}],128:[function(z,O,A){arguments[4][41][0].apply(A,
  		arguments);},{"../../../errors":116,dup:41}],129:[function(z,O,A){arguments[4][42][0].apply(A,arguments);},{dup:42,events:95}],130:[function(z,O,A){arguments[4][43][0].apply(A,arguments);},{"./lib/_stream_duplex.js":117,"./lib/_stream_passthrough.js":118,"./lib/_stream_readable.js":119,"./lib/_stream_transform.js":120,"./lib/_stream_writable.js":121,"./lib/internal/streams/end-of-stream.js":125,"./lib/internal/streams/pipeline.js":127,dup:43}],131:[function(z,O,A){A=z("stream");const {Buffer:f}=z("buffer"),
  		e=new TextDecoder("utf8",{fatal:true,ignoreBOM:true});class g extends A.Transform{constructor(a,b,d={}){let v=null,m=null;switch(typeof a){case "object":f.isBuffer(a)?v=a:a&&(d=a);break;case "string":v=a;break;case "undefined":break;default:throw new TypeError("Invalid input");}switch(typeof b){case "object":b&&(d=b);break;case "string":m=b;break;case "undefined":break;default:throw new TypeError("Invalid inputEncoding");}if(!d||"object"!==typeof d)throw new TypeError("Invalid options");null==v&&(v=d.input);
  		null==m&&(m=d.inputEncoding);delete d.input;delete d.inputEncoding;a=null==d.watchPipe?true:d.watchPipe;delete d.watchPipe;b=!!d.readError;delete d.readError;super(d);this.readError=b;if(a)this.on("pipe",r=>{r=r._readableState.objectMode;if(0<this.length&&r!==this._readableState.objectMode)throw Error("Do not switch objectMode in the middle of the stream");this._readableState.objectMode=r;this._writableState.objectMode=r;});null!=v&&this.end(v,m);}static isNoFilter(a){return a instanceof this}static compare(a,
  		b){if(!(a instanceof this))throw new TypeError("Arguments must be NoFilters");return a===b?0:a.compare(b)}static concat(a,b){if(!Array.isArray(a))throw new TypeError("list argument must be an Array of NoFilters");if(0===a.length||0===b)return f.alloc(0);null==b&&(b=a.reduce((m,r)=>{if(!(r instanceof g))throw new TypeError("list argument must be an Array of NoFilters");return m+r.length},0));let d=true,v=true;a=a.map(m=>{if(!(m instanceof g))throw new TypeError("list argument must be an Array of NoFilters");
  		m=m.slice();f.isBuffer(m)?v=false:d=false;return m});if(d)return f.concat(a,b);if(v)return [].concat(...a).slice(0,b);throw Error("Concatenating mixed object and byte streams not supported");}_transform(a,b,d){this._readableState.objectMode||f.isBuffer(a)||(a=f.from(a,b));this.push(a);d();}_bufArray(){let a=this._readableState.buffer;if(!Array.isArray(a)){let b=a.head;for(a=[];null!=b;)a.push(b.data),b=b.next;}return a}read(a){const b=super.read(a);if(null!=b){if(this.emit("read",b),this.readError&&b.length<
  		a)throw Error(`Read ${b.length}, wanted ${a}`);}else if(this.readError)throw Error(`No data available, wanted ${a}`);return b}readFull(a){let b=null,d=null,v=null;return (new Promise((m,r)=>{this.length>=a?m(this.read(a)):this.writableFinished?r(Error(`Stream finished before ${a} bytes were available`)):(b=h=>{this.length>=a&&m(this.read(a));},d=()=>{r(Error(`Stream finished before ${a} bytes were available`));},v=r,this.on("readable",b),this.on("error",v),this.on("finish",d));})).finally(()=>{b&&(this.removeListener("readable",
  		b),this.removeListener("error",v),this.removeListener("finish",d));})}promise(a){let b=false;return new Promise((d,v)=>{this.on("finish",()=>{const m=this.read();null==a||b||(b=true,a(null,m));d(m);});this.on("error",m=>{null==a||b||(b=true,a(m));v(m);});})}compare(a){if(!(a instanceof g))throw new TypeError("Arguments must be NoFilters");if(this===a)return 0;const b=this.slice();a=a.slice();if(f.isBuffer(b)&&f.isBuffer(a))return b.compare(a);throw Error("Cannot compare streams in object mode");}equals(a){return 0===
  		this.compare(a)}slice(a,b){if(this._readableState.objectMode)return this._bufArray().slice(a,b);const d=this._bufArray();switch(d.length){case 0:return f.alloc(0);case 1:return d[0].slice(a,b);default:return f.concat(d).slice(a,b)}}get(a){return this.slice()[a]}toJSON(){const a=this.slice();return f.isBuffer(a)?a.toJSON():a}toString(a,b,d){b=this.slice(b,d);return f.isBuffer(b)?a&&"utf8"!==a?b.toString(a):e.decode(b):JSON.stringify(b)}[Symbol.for("nodejs.util.inspect.custom")](a,b){a=this._bufArray().map(d=>
  		f.isBuffer(d)?b.stylize(d.toString("hex"),"string"):JSON.stringify(d)).join(", ");return `${this.constructor.name} [${a}]`}get length(){return this._readableState.length}writeBigInt(a){let b=a.toString(16);0>a&&(a=(BigInt(1)<<BigInt(Math.floor(b.length/2))*BigInt(8))+a,b=a.toString(16));b.length%2&&(b=`0${b}`);return this.push(f.from(b,"hex"))}readUBigInt(a){a=this.read(a);return f.isBuffer(a)?BigInt(`0x${a.toString("hex")}`):null}readBigInt(a){a=this.read(a);if(!f.isBuffer(a))return null;let b=BigInt(`0x${a.toString("hex")}`);
  		a[0]&128&&(b-=BigInt(1)<<BigInt(a.length)*BigInt(8));return b}writeUInt8(a){a=f.from([a]);return this.push(a)}writeUInt16LE(a){const b=f.alloc(2);b.writeUInt16LE(a);return this.push(b)}writeUInt16BE(a){const b=f.alloc(2);b.writeUInt16BE(a);return this.push(b)}writeUInt32LE(a){const b=f.alloc(4);b.writeUInt32LE(a);return this.push(b)}writeUInt32BE(a){const b=f.alloc(4);b.writeUInt32BE(a);return this.push(b)}writeInt8(a){a=f.from([a]);return this.push(a)}writeInt16LE(a){const b=f.alloc(2);b.writeUInt16LE(a);
  		return this.push(b)}writeInt16BE(a){const b=f.alloc(2);b.writeUInt16BE(a);return this.push(b)}writeInt32LE(a){const b=f.alloc(4);b.writeUInt32LE(a);return this.push(b)}writeInt32BE(a){const b=f.alloc(4);b.writeUInt32BE(a);return this.push(b)}writeFloatLE(a){const b=f.alloc(4);b.writeFloatLE(a);return this.push(b)}writeFloatBE(a){const b=f.alloc(4);b.writeFloatBE(a);return this.push(b)}writeDoubleLE(a){const b=f.alloc(8);b.writeDoubleLE(a);return this.push(b)}writeDoubleBE(a){const b=f.alloc(8);b.writeDoubleBE(a);
  		return this.push(b)}writeBigInt64LE(a){const b=f.alloc(8);b.writeBigInt64LE(a);return this.push(b)}writeBigInt64BE(a){const b=f.alloc(8);b.writeBigInt64BE(a);return this.push(b)}writeBigUInt64LE(a){const b=f.alloc(8);b.writeBigUInt64LE(a);return this.push(b)}writeBigUInt64BE(a){const b=f.alloc(8);b.writeBigUInt64BE(a);return this.push(b)}readUInt8(){const a=this.read(1);return f.isBuffer(a)?a.readUInt8():null}readUInt16LE(){const a=this.read(2);return f.isBuffer(a)?a.readUInt16LE():null}readUInt16BE(){const a=
  		this.read(2);return f.isBuffer(a)?a.readUInt16BE():null}readUInt32LE(){const a=this.read(4);return f.isBuffer(a)?a.readUInt32LE():null}readUInt32BE(){const a=this.read(4);return f.isBuffer(a)?a.readUInt32BE():null}readInt8(){const a=this.read(1);return f.isBuffer(a)?a.readInt8():null}readInt16LE(){const a=this.read(2);return f.isBuffer(a)?a.readInt16LE():null}readInt16BE(){const a=this.read(2);return f.isBuffer(a)?a.readInt16BE():null}readInt32LE(){const a=this.read(4);return f.isBuffer(a)?a.readInt32LE():
  		null}readInt32BE(){const a=this.read(4);return f.isBuffer(a)?a.readInt32BE():null}readFloatLE(){const a=this.read(4);return f.isBuffer(a)?a.readFloatLE():null}readFloatBE(){const a=this.read(4);return f.isBuffer(a)?a.readFloatBE():null}readDoubleLE(){const a=this.read(8);return f.isBuffer(a)?a.readDoubleLE():null}readDoubleBE(){const a=this.read(8);return f.isBuffer(a)?a.readDoubleBE():null}readBigInt64LE(){const a=this.read(8);return f.isBuffer(a)?a.readBigInt64LE():null}readBigInt64BE(){const a=
  		this.read(8);return f.isBuffer(a)?a.readBigInt64BE():null}readBigUInt64LE(){const a=this.read(8);return f.isBuffer(a)?a.readBigUInt64LE():null}readBigUInt64BE(){const a=this.read(8);return f.isBuffer(a)?a.readBigUInt64BE():null}}O.exports=g;},{buffer:45,stream:135}],132:[function(z,O,A){var f=Object.getOwnPropertySymbols,e=Object.prototype.hasOwnProperty,g=Object.prototype.propertyIsEnumerable;O.exports=function(){try{if(!Object.assign)return !1;var a=new String("abc");a[5]="de";if("5"===Object.getOwnPropertyNames(a)[0])return !1;
  		var b={};for(a=0;10>a;a++)b["_"+String.fromCharCode(a)]=a;if("0123456789"!==Object.getOwnPropertyNames(b).map(function(v){return b[v]}).join(""))return !1;var d={};"abcdefghijklmnopqrst".split("").forEach(function(v){d[v]=v;});return "abcdefghijklmnopqrst"!==Object.keys(Object.assign({},d)).join("")?!1:!0}catch(v){return  false}}()?Object.assign:function(a,b){if(null===a||void 0===a)throw new TypeError("Object.assign cannot be called with null or undefined");var d=Object(a);for(var v,m=1;m<arguments.length;m++){var r=
  		Object(arguments[m]);for(var h in r)e.call(r,h)&&(d[h]=r[h]);if(f){v=f(r);for(var l=0;l<v.length;l++)g.call(r,v[l])&&(d[v[l]]=r[v[l]]);}}return d};},{}],133:[function(z,O,A){function f(){throw Error("setTimeout has not been defined");}function e(){throw Error("clearTimeout has not been defined");}function g(t){if(r===setTimeout)return setTimeout(t,0);if((r===f||!r)&&setTimeout)return r=setTimeout,setTimeout(t,0);try{return r(t,0)}catch(u){try{return r.call(null,t,0)}catch(y){return r.call(this,t,0)}}}
  		function a(t){if(h===clearTimeout)return clearTimeout(t);if((h===e||!h)&&clearTimeout)return h=clearTimeout,clearTimeout(t);try{return h(t)}catch(u){try{return h.call(null,t)}catch(y){return h.call(this,t)}}}function b(){k&&n&&(k=false,n.length?l=n.concat(l):w=-1,l.length&&d());}function d(){if(!k){var t=g(b);k=true;for(var u=l.length;u;){n=l;for(l=[];++w<u;)n&&n[w].run();w=-1;u=l.length;}n=null;k=false;a(t);}}function v(t,u){this.fun=t;this.array=u;}function m(){}z=O.exports={};try{var r="function"===typeof setTimeout?
  		setTimeout:f;}catch(t){r=f;}try{var h="function"===typeof clearTimeout?clearTimeout:e;}catch(t){h=e;}var l=[],k=false,n,w=-1;z.nextTick=function(t){var u=Array(arguments.length-1);if(1<arguments.length)for(var y=1;y<arguments.length;y++)u[y-1]=arguments[y];l.push(new v(t,u));1!==l.length||k||g(d);};v.prototype.run=function(){this.fun.apply(null,this.array);};z.title="browser";z.browser=true;z.env={};z.argv=[];z.version="";z.versions={};z.on=m;z.addListener=m;z.once=m;z.off=m;z.removeListener=m;z.removeAllListeners=
  		m;z.emit=m;z.prependListener=m;z.prependOnceListener=m;z.listeners=function(t){return []};z.binding=function(t){throw Error("process.binding is not supported");};z.cwd=function(){return "/"};z.chdir=function(t){throw Error("process.chdir is not supported");};z.umask=function(){return 0};},{}],134:[function(z,O,A){function f(b,d){for(var v in b)d[v]=b[v];}function e(b,d,v){return a(b,d,v)}var g=z("buffer"),a=g.Buffer;a.from&&a.alloc&&a.allocUnsafe&&a.allocUnsafeSlow?O.exports=g:(f(g,A),A.Buffer=e);e.prototype=
  		Object.create(a.prototype);f(a,e);e.from=function(b,d,v){if("number"===typeof b)throw new TypeError("Argument must not be a number");return a(b,d,v)};e.alloc=function(b,d,v){if("number"!==typeof b)throw new TypeError("Argument must be a number");b=a(b);void 0!==d?"string"===typeof v?b.fill(d,v):b.fill(d):b.fill(0);return b};e.allocUnsafe=function(b){if("number"!==typeof b)throw new TypeError("Argument must be a number");return a(b)};e.allocUnsafeSlow=function(b){if("number"!==typeof b)throw new TypeError("Argument must be a number");
  		return g.SlowBuffer(b)};},{buffer:45}],135:[function(z,O,A){function f(){e.call(this);}O.exports=f;var e=z("events").EventEmitter;z("inherits")(f,e);f.Readable=z("readable-stream/lib/_stream_readable.js");f.Writable=z("readable-stream/lib/_stream_writable.js");f.Duplex=z("readable-stream/lib/_stream_duplex.js");f.Transform=z("readable-stream/lib/_stream_transform.js");f.PassThrough=z("readable-stream/lib/_stream_passthrough.js");f.finished=z("readable-stream/lib/internal/streams/end-of-stream.js");
  		f.pipeline=z("readable-stream/lib/internal/streams/pipeline.js");f.Stream=f;f.prototype.pipe=function(g,a){function b(n){g.writable&&false===g.write(n)&&l.pause&&l.pause();}function d(){l.readable&&l.resume&&l.resume();}function v(){k||(k=true,g.end());}function m(){k||(k=true,"function"===typeof g.destroy&&g.destroy());}function r(n){h();if(0===e.listenerCount(this,"error"))throw n;}function h(){l.removeListener("data",b);g.removeListener("drain",d);l.removeListener("end",v);l.removeListener("close",m);l.removeListener("error",
  		r);g.removeListener("error",r);l.removeListener("end",h);l.removeListener("close",h);g.removeListener("close",h);}var l=this;l.on("data",b);g.on("drain",d);g._isStdio||a&&false===a.end||(l.on("end",v),l.on("close",m));var k=false;l.on("error",r);g.on("error",r);l.on("end",h);l.on("close",h);g.on("close",h);g.emit("pipe",l);return g};},{events:95,inherits:105,"readable-stream/lib/_stream_duplex.js":137,"readable-stream/lib/_stream_passthrough.js":138,"readable-stream/lib/_stream_readable.js":139,"readable-stream/lib/_stream_transform.js":140,
  		"readable-stream/lib/_stream_writable.js":141,"readable-stream/lib/internal/streams/end-of-stream.js":145,"readable-stream/lib/internal/streams/pipeline.js":147}],136:[function(z,O,A){arguments[4][29][0].apply(A,arguments);},{dup:29}],137:[function(z,O,A){arguments[4][30][0].apply(A,arguments);},{"./_stream_readable":139,"./_stream_writable":141,_process:133,dup:30,inherits:105}],138:[function(z,O,A){arguments[4][31][0].apply(A,arguments);},{"./_stream_transform":140,dup:31,inherits:105}],139:[function(z,
  		O,A){arguments[4][32][0].apply(A,arguments);},{"../errors":136,"./_stream_duplex":137,"./internal/streams/async_iterator":142,"./internal/streams/buffer_list":143,"./internal/streams/destroy":144,"./internal/streams/from":146,"./internal/streams/state":148,"./internal/streams/stream":149,_process:133,buffer:45,dup:32,events:95,inherits:105,"string_decoder/":150,util:44}],140:[function(z,O,A){arguments[4][33][0].apply(A,arguments);},{"../errors":136,"./_stream_duplex":137,dup:33,inherits:105}],141:[function(z,
  		O,A){arguments[4][34][0].apply(A,arguments);},{"../errors":136,"./_stream_duplex":137,"./internal/streams/destroy":144,"./internal/streams/state":148,"./internal/streams/stream":149,_process:133,buffer:45,dup:34,inherits:105,"util-deprecate":152}],142:[function(z,O,A){arguments[4][35][0].apply(A,arguments);},{"./end-of-stream":145,_process:133,dup:35}],143:[function(z,O,A){arguments[4][36][0].apply(A,arguments);},{buffer:45,dup:36,util:44}],144:[function(z,O,A){arguments[4][37][0].apply(A,arguments);},
  		{_process:133,dup:37}],145:[function(z,O,A){arguments[4][38][0].apply(A,arguments);},{"../../../errors":136,dup:38}],146:[function(z,O,A){arguments[4][39][0].apply(A,arguments);},{dup:39}],147:[function(z,O,A){arguments[4][40][0].apply(A,arguments);},{"../../../errors":136,"./end-of-stream":145,dup:40}],148:[function(z,O,A){arguments[4][41][0].apply(A,arguments);},{"../../../errors":136,dup:41}],149:[function(z,O,A){arguments[4][42][0].apply(A,arguments);},{dup:42,events:95}],150:[function(z,O,A){function f(w){if(!w)return "utf8";
  		for(var t;;)switch(w){case "utf8":case "utf-8":return "utf8";case "ucs2":case "ucs-2":case "utf16le":case "utf-16le":return "utf16le";case "latin1":case "binary":return "latin1";case "base64":case "ascii":case "hex":return w;default:if(t)return;w=(""+w).toLowerCase();t=true;}}function e(w){var t=f(w);if("string"!==typeof t&&(k.isEncoding===n||!n(w)))throw Error("Unknown encoding: "+w);this.encoding=t||w;switch(this.encoding){case "utf16le":this.text=d;this.end=v;w=4;break;case "utf8":this.fillLast=b;w=
  		4;break;case "base64":this.text=m;this.end=r;w=3;break;default:this.write=h;this.end=l;return}this.lastTotal=this.lastNeed=0;this.lastChar=k.allocUnsafe(w);}function g(w){return 127>=w?0:6===w>>5?2:14===w>>4?3:30===w>>3?4:2===w>>6?-1:-2}function a(w,t,u){var y=t.length-1;if(y<u)return 0;var x=g(t[y]);if(0<=x)return 0<x&&(w.lastNeed=x-1),x;if(--y<u||-2===x)return 0;x=g(t[y]);if(0<=x)return 0<x&&(w.lastNeed=x-2),x;if(--y<u||-2===x)return 0;x=g(t[y]);return 0<=x?(0<x&&(2===x?x=0:w.lastNeed=x-3),x):0}
  		function b(w){var t=this.lastTotal-this.lastNeed;a:if(128!==(w[0]&192)){this.lastNeed=0;var u="\ufffd";}else {if(1<this.lastNeed&&1<w.length){if(128!==(w[1]&192)){this.lastNeed=1;u="\ufffd";break a}if(2<this.lastNeed&&2<w.length&&128!==(w[2]&192)){this.lastNeed=2;u="\ufffd";break a}}u=void 0;}if(void 0!==u)return u;if(this.lastNeed<=w.length)return w.copy(this.lastChar,t,0,this.lastNeed),this.lastChar.toString(this.encoding,0,this.lastTotal);w.copy(this.lastChar,t,0,w.length);this.lastNeed-=w.length;}
  		function d(w,t){if(0===(w.length-t)%2){if(t=w.toString("utf16le",t)){var u=t.charCodeAt(t.length-1);if(55296<=u&&56319>=u)return this.lastNeed=2,this.lastTotal=4,this.lastChar[0]=w[w.length-2],this.lastChar[1]=w[w.length-1],t.slice(0,-1)}return t}this.lastNeed=1;this.lastTotal=2;this.lastChar[0]=w[w.length-1];return w.toString("utf16le",t,w.length-1)}function v(w){w=w&&w.length?this.write(w):"";return this.lastNeed?w+this.lastChar.toString("utf16le",0,this.lastTotal-this.lastNeed):w}function m(w,
  		t){var u=(w.length-t)%3;if(0===u)return w.toString("base64",t);this.lastNeed=3-u;this.lastTotal=3;1===u?this.lastChar[0]=w[w.length-1]:(this.lastChar[0]=w[w.length-2],this.lastChar[1]=w[w.length-1]);return w.toString("base64",t,w.length-u)}function r(w){w=w&&w.length?this.write(w):"";return this.lastNeed?w+this.lastChar.toString("base64",0,3-this.lastNeed):w}function h(w){return w.toString(this.encoding)}function l(w){return w&&w.length?this.write(w):""}var k=z("safe-buffer").Buffer,n=k.isEncoding||
  		function(w){w=""+w;switch(w&&w.toLowerCase()){case "hex":case "utf8":case "utf-8":case "ascii":case "binary":case "base64":case "ucs2":case "ucs-2":case "utf16le":case "utf-16le":case "raw":return  true;default:return  false}};A.StringDecoder=e;e.prototype.write=function(w){if(0===w.length)return "";if(this.lastNeed){var t=this.fillLast(w);if(void 0===t)return "";var u=this.lastNeed;this.lastNeed=0;}else u=0;return u<w.length?t?t+this.text(w,u):this.text(w,u):t||""};e.prototype.end=function(w){w=w&&w.length?
  		this.write(w):"";return this.lastNeed?w+"\ufffd":w};e.prototype.text=function(w,t){var u=a(this,w,t);if(!this.lastNeed)return w.toString("utf8",t);this.lastTotal=u;u=w.length-(u-this.lastNeed);w.copy(this.lastChar,0,u);return w.toString("utf8",t,u)};e.prototype.fillLast=function(w){if(this.lastNeed<=w.length)return w.copy(this.lastChar,this.lastTotal-this.lastNeed,0,this.lastNeed),this.lastChar.toString(this.encoding,0,this.lastTotal);w.copy(this.lastChar,this.lastTotal-this.lastNeed,0,w.length);
  		this.lastNeed-=w.length;};},{"safe-buffer":134}],151:[function(z,O,A){(function(f){function e(E,C,q,N){E[C]=q>>24&255;E[C+1]=q>>16&255;E[C+2]=q>>8&255;E[C+3]=q&255;E[C+4]=N>>24&255;E[C+5]=N>>16&255;E[C+6]=N>>8&255;E[C+7]=N&255;}function g(E,C,q,N,U){var W,ka=0;for(W=0;W<U;W++)ka|=E[C+W]^q[N+W];return (1&ka-1>>>8)-1}function a(E,C,q,N){return g(E,C,q,N,16)}function b(E,C,q,N){return g(E,C,q,N,32)}function d(E,C,q,N){var U=N[0]&255|(N[1]&255)<<8|(N[2]&255)<<16|(N[3]&255)<<24,W=q[0]&255|(q[1]&255)<<8|(q[2]&
  		255)<<16|(q[3]&255)<<24,ka=q[4]&255|(q[5]&255)<<8|(q[6]&255)<<16|(q[7]&255)<<24,ca=q[8]&255|(q[9]&255)<<8|(q[10]&255)<<16|(q[11]&255)<<24,na=q[12]&255|(q[13]&255)<<8|(q[14]&255)<<16|(q[15]&255)<<24,pa=N[4]&255|(N[5]&255)<<8|(N[6]&255)<<16|(N[7]&255)<<24,wa=C[0]&255|(C[1]&255)<<8|(C[2]&255)<<16|(C[3]&255)<<24,va=C[4]&255|(C[5]&255)<<8|(C[6]&255)<<16|(C[7]&255)<<24,Ca=C[8]&255|(C[9]&255)<<8|(C[10]&255)<<16|(C[11]&255)<<24;C=C[12]&255|(C[13]&255)<<8|(C[14]&255)<<16|(C[15]&255)<<24;var Da=N[8]&255|(N[9]&
  		255)<<8|(N[10]&255)<<16|(N[11]&255)<<24,Fa=q[16]&255|(q[17]&255)<<8|(q[18]&255)<<16|(q[19]&255)<<24,Ea=q[20]&255|(q[21]&255)<<8|(q[22]&255)<<16|(q[23]&255)<<24,Ha=q[24]&255|(q[25]&255)<<8|(q[26]&255)<<16|(q[27]&255)<<24;q=q[28]&255|(q[29]&255)<<8|(q[30]&255)<<16|(q[31]&255)<<24;N=N[12]&255|(N[13]&255)<<8|(N[14]&255)<<16|(N[15]&255)<<24;for(var fa=U,Ga=W,Ia=ka,Sa=ca,Pa=na,Qa=pa,Ta=wa,Aa=va,Wa=Ca,Va=C,Ma=Da,Ra=Fa,Na=Ea,La=Ha,Ka=q,Ja=N,ma,Xa=0;20>Xa;Xa+=2)ma=fa+Na|0,Pa^=ma<<7|ma>>>25,ma=Pa+fa|0,Wa^=
  		ma<<9|ma>>>23,ma=Wa+Pa|0,Na^=ma<<13|ma>>>19,ma=Na+Wa|0,fa^=ma<<18|ma>>>14,ma=Qa+Ga|0,Va^=ma<<7|ma>>>25,ma=Va+Qa|0,La^=ma<<9|ma>>>23,ma=La+Va|0,Ga^=ma<<13|ma>>>19,ma=Ga+La|0,Qa^=ma<<18|ma>>>14,ma=Ma+Ta|0,Ka^=ma<<7|ma>>>25,ma=Ka+Ma|0,Ia^=ma<<9|ma>>>23,ma=Ia+Ka|0,Ta^=ma<<13|ma>>>19,ma=Ta+Ia|0,Ma^=ma<<18|ma>>>14,ma=Ja+Ra|0,Sa^=ma<<7|ma>>>25,ma=Sa+Ja|0,Aa^=ma<<9|ma>>>23,ma=Aa+Sa|0,Ra^=ma<<13|ma>>>19,ma=Ra+Aa|0,Ja^=ma<<18|ma>>>14,ma=fa+Sa|0,Ga^=ma<<7|ma>>>25,ma=Ga+fa|0,Ia^=ma<<9|ma>>>23,ma=Ia+Ga|0,Sa^=
  		ma<<13|ma>>>19,ma=Sa+Ia|0,fa^=ma<<18|ma>>>14,ma=Qa+Pa|0,Ta^=ma<<7|ma>>>25,ma=Ta+Qa|0,Aa^=ma<<9|ma>>>23,ma=Aa+Ta|0,Pa^=ma<<13|ma>>>19,ma=Pa+Aa|0,Qa^=ma<<18|ma>>>14,ma=Ma+Va|0,Ra^=ma<<7|ma>>>25,ma=Ra+Ma|0,Wa^=ma<<9|ma>>>23,ma=Wa+Ra|0,Va^=ma<<13|ma>>>19,ma=Va+Wa|0,Ma^=ma<<18|ma>>>14,ma=Ja+Ka|0,Na^=ma<<7|ma>>>25,ma=Na+Ja|0,La^=ma<<9|ma>>>23,ma=La+Na|0,Ka^=ma<<13|ma>>>19,ma=Ka+La|0,Ja^=ma<<18|ma>>>14;fa=fa+U|0;Ga=Ga+W|0;Ia=Ia+ka|0;Sa=Sa+ca|0;Pa=Pa+na|0;Qa=Qa+pa|0;Ta=Ta+wa|0;Aa=Aa+va|0;Wa=Wa+Ca|0;Va=Va+
  		C|0;Ma=Ma+Da|0;Ra=Ra+Fa|0;Na=Na+Ea|0;La=La+Ha|0;Ka=Ka+q|0;Ja=Ja+N|0;E[0]=fa>>>0&255;E[1]=fa>>>8&255;E[2]=fa>>>16&255;E[3]=fa>>>24&255;E[4]=Ga>>>0&255;E[5]=Ga>>>8&255;E[6]=Ga>>>16&255;E[7]=Ga>>>24&255;E[8]=Ia>>>0&255;E[9]=Ia>>>8&255;E[10]=Ia>>>16&255;E[11]=Ia>>>24&255;E[12]=Sa>>>0&255;E[13]=Sa>>>8&255;E[14]=Sa>>>16&255;E[15]=Sa>>>24&255;E[16]=Pa>>>0&255;E[17]=Pa>>>8&255;E[18]=Pa>>>16&255;E[19]=Pa>>>24&255;E[20]=Qa>>>0&255;E[21]=Qa>>>8&255;E[22]=Qa>>>16&255;E[23]=Qa>>>24&255;E[24]=Ta>>>0&255;E[25]=
  		Ta>>>8&255;E[26]=Ta>>>16&255;E[27]=Ta>>>24&255;E[28]=Aa>>>0&255;E[29]=Aa>>>8&255;E[30]=Aa>>>16&255;E[31]=Aa>>>24&255;E[32]=Wa>>>0&255;E[33]=Wa>>>8&255;E[34]=Wa>>>16&255;E[35]=Wa>>>24&255;E[36]=Va>>>0&255;E[37]=Va>>>8&255;E[38]=Va>>>16&255;E[39]=Va>>>24&255;E[40]=Ma>>>0&255;E[41]=Ma>>>8&255;E[42]=Ma>>>16&255;E[43]=Ma>>>24&255;E[44]=Ra>>>0&255;E[45]=Ra>>>8&255;E[46]=Ra>>>16&255;E[47]=Ra>>>24&255;E[48]=Na>>>0&255;E[49]=Na>>>8&255;E[50]=Na>>>16&255;E[51]=Na>>>24&255;E[52]=La>>>0&255;E[53]=La>>>8&255;
  		E[54]=La>>>16&255;E[55]=La>>>24&255;E[56]=Ka>>>0&255;E[57]=Ka>>>8&255;E[58]=Ka>>>16&255;E[59]=Ka>>>24&255;E[60]=Ja>>>0&255;E[61]=Ja>>>8&255;E[62]=Ja>>>16&255;E[63]=Ja>>>24&255;}function v(E,C,q,N){var U=N[0]&255|(N[1]&255)<<8|(N[2]&255)<<16|(N[3]&255)<<24,W=q[0]&255|(q[1]&255)<<8|(q[2]&255)<<16|(q[3]&255)<<24,ka=q[4]&255|(q[5]&255)<<8|(q[6]&255)<<16|(q[7]&255)<<24,ca=q[8]&255|(q[9]&255)<<8|(q[10]&255)<<16|(q[11]&255)<<24,na=q[12]&255|(q[13]&255)<<8|(q[14]&255)<<16|(q[15]&255)<<24,pa=N[4]&255|(N[5]&
  		255)<<8|(N[6]&255)<<16|(N[7]&255)<<24,wa=C[0]&255|(C[1]&255)<<8|(C[2]&255)<<16|(C[3]&255)<<24,va=C[4]&255|(C[5]&255)<<8|(C[6]&255)<<16|(C[7]&255)<<24,Ca=C[8]&255|(C[9]&255)<<8|(C[10]&255)<<16|(C[11]&255)<<24;C=C[12]&255|(C[13]&255)<<8|(C[14]&255)<<16|(C[15]&255)<<24;var Da=N[8]&255|(N[9]&255)<<8|(N[10]&255)<<16|(N[11]&255)<<24,Fa=q[16]&255|(q[17]&255)<<8|(q[18]&255)<<16|(q[19]&255)<<24,Ea=q[20]&255|(q[21]&255)<<8|(q[22]&255)<<16|(q[23]&255)<<24,Ha=q[24]&255|(q[25]&255)<<8|(q[26]&255)<<16|(q[27]&255)<<
  		24;q=q[28]&255|(q[29]&255)<<8|(q[30]&255)<<16|(q[31]&255)<<24;N=N[12]&255|(N[13]&255)<<8|(N[14]&255)<<16|(N[15]&255)<<24;for(var fa,Ga=0;20>Ga;Ga+=2)fa=U+Ea|0,na^=fa<<7|fa>>>25,fa=na+U|0,Ca^=fa<<9|fa>>>23,fa=Ca+na|0,Ea^=fa<<13|fa>>>19,fa=Ea+Ca|0,U^=fa<<18|fa>>>14,fa=pa+W|0,C^=fa<<7|fa>>>25,fa=C+pa|0,Ha^=fa<<9|fa>>>23,fa=Ha+C|0,W^=fa<<13|fa>>>19,fa=W+Ha|0,pa^=fa<<18|fa>>>14,fa=Da+wa|0,q^=fa<<7|fa>>>25,fa=q+Da|0,ka^=fa<<9|fa>>>23,fa=ka+q|0,wa^=fa<<13|fa>>>19,fa=wa+ka|0,Da^=fa<<18|fa>>>14,fa=N+Fa|0,
  		ca^=fa<<7|fa>>>25,fa=ca+N|0,va^=fa<<9|fa>>>23,fa=va+ca|0,Fa^=fa<<13|fa>>>19,fa=Fa+va|0,N^=fa<<18|fa>>>14,fa=U+ca|0,W^=fa<<7|fa>>>25,fa=W+U|0,ka^=fa<<9|fa>>>23,fa=ka+W|0,ca^=fa<<13|fa>>>19,fa=ca+ka|0,U^=fa<<18|fa>>>14,fa=pa+na|0,wa^=fa<<7|fa>>>25,fa=wa+pa|0,va^=fa<<9|fa>>>23,fa=va+wa|0,na^=fa<<13|fa>>>19,fa=na+va|0,pa^=fa<<18|fa>>>14,fa=Da+C|0,Fa^=fa<<7|fa>>>25,fa=Fa+Da|0,Ca^=fa<<9|fa>>>23,fa=Ca+Fa|0,C^=fa<<13|fa>>>19,fa=C+Ca|0,Da^=fa<<18|fa>>>14,fa=N+q|0,Ea^=fa<<7|fa>>>25,fa=Ea+N|0,Ha^=fa<<9|fa>>>
  		23,fa=Ha+Ea|0,q^=fa<<13|fa>>>19,fa=q+Ha|0,N^=fa<<18|fa>>>14;E[0]=U>>>0&255;E[1]=U>>>8&255;E[2]=U>>>16&255;E[3]=U>>>24&255;E[4]=pa>>>0&255;E[5]=pa>>>8&255;E[6]=pa>>>16&255;E[7]=pa>>>24&255;E[8]=Da>>>0&255;E[9]=Da>>>8&255;E[10]=Da>>>16&255;E[11]=Da>>>24&255;E[12]=N>>>0&255;E[13]=N>>>8&255;E[14]=N>>>16&255;E[15]=N>>>24&255;E[16]=wa>>>0&255;E[17]=wa>>>8&255;E[18]=wa>>>16&255;E[19]=wa>>>24&255;E[20]=va>>>0&255;E[21]=va>>>8&255;E[22]=va>>>16&255;E[23]=va>>>24&255;E[24]=Ca>>>0&255;E[25]=Ca>>>8&255;E[26]=
  		Ca>>>16&255;E[27]=Ca>>>24&255;E[28]=C>>>0&255;E[29]=C>>>8&255;E[30]=C>>>16&255;E[31]=C>>>24&255;}function m(E,C,q,N,U,W,ka){var ca=new Uint8Array(16),na=new Uint8Array(64),pa;for(pa=0;16>pa;pa++)ca[pa]=0;for(pa=0;8>pa;pa++)ca[pa]=W[pa];for(;64<=U;){d(na,ca,ka,db);for(pa=0;64>pa;pa++)E[C+pa]=q[N+pa]^na[pa];W=1;for(pa=8;16>pa;pa++)W=W+(ca[pa]&255)|0,ca[pa]=W&255,W>>>=8;U-=64;C+=64;N+=64;}if(0<U)for(d(na,ca,ka,db),pa=0;pa<U;pa++)E[C+pa]=q[N+pa]^na[pa];return 0}function r(E,C,q,N,U){var W=new Uint8Array(16),
  		ka=new Uint8Array(64),ca;for(ca=0;16>ca;ca++)W[ca]=0;for(ca=0;8>ca;ca++)W[ca]=N[ca];for(;64<=q;){d(ka,W,U,db);for(ca=0;64>ca;ca++)E[C+ca]=ka[ca];N=1;for(ca=8;16>ca;ca++)N=N+(W[ca]&255)|0,W[ca]=N&255,N>>>=8;q-=64;C+=64;}if(0<q)for(d(ka,W,U,db),ca=0;ca<q;ca++)E[C+ca]=ka[ca];return 0}function h(E,C,q,N,U){var W=new Uint8Array(32);v(W,N,U,db);U=new Uint8Array(8);for(var ka=0;8>ka;ka++)U[ka]=N[ka+16];return r(E,C,q,U,W)}function l(E,C,q,N,U,W,ka){var ca=new Uint8Array(32);v(ca,W,ka,db);ka=new Uint8Array(8);
  		for(var na=0;8>na;na++)ka[na]=W[na+16];return m(E,C,q,N,U,ka,ca)}function k(E,C,q,N,U,W){W=new fb(W);W.update(q,N,U);W.finish(E,C);return 0}function n(E,C,q,N,U,W){var ka=new Uint8Array(16);k(ka,0,q,N,U,W);return a(E,C,ka,0)}function w(E,C,q,N,U){if(32>q)return  -1;l(E,0,C,0,q,N,U);k(E,16,E,32,q-32,E);for(C=0;16>C;C++)E[C]=0;return 0}function t(E,C,q,N,U){var W=new Uint8Array(32);if(32>q)return  -1;h(W,0,32,N,U);if(0!==n(C,16,C,32,q-32,W))return  -1;l(E,0,C,0,q,N,U);for(C=0;32>C;C++)E[C]=0;return 0}function u(E,
  		C){var q;for(q=0;16>q;q++)E[q]=C[q]|0;}function y(E){var C,q=1;for(C=0;16>C;C++){var N=E[C]+q+65535;q=Math.floor(N/65536);E[C]=N-65536*q;}E[0]+=q-1+37*(q-1);}function x(E,C,q){for(var N=~(q-1),U=0;16>U;U++)q=N&(E[U]^C[U]),E[U]^=q,C[U]^=q;}function F(E,C){var q,N=ua(),U=ua();for(q=0;16>q;q++)U[q]=C[q];y(U);y(U);y(U);for(C=0;2>C;C++){N[0]=U[0]-65517;for(q=1;15>q;q++)N[q]=U[q]-65535-(N[q-1]>>16&1),N[q-1]&=65535;N[15]=U[15]-32767-(N[14]>>16&1);q=N[15]>>16&1;N[14]&=65535;x(U,N,1-q);}for(q=0;16>q;q++)E[2*q]=
  		U[q]&255,E[2*q+1]=U[q]>>8;}function D(E,C){var q=new Uint8Array(32),N=new Uint8Array(32);F(q,E);F(N,C);return b(q,0,N,0)}function I(E){var C=new Uint8Array(32);F(C,E);return C[0]&1}function S(E,C){var q;for(q=0;16>q;q++)E[q]=C[2*q]+(C[2*q+1]<<8);E[15]&=32767;}function Z(E,C,q){for(var N=0;16>N;N++)E[N]=C[N]+q[N];}function aa(E,C,q){for(var N=0;16>N;N++)E[N]=C[N]-q[N];}function P(E,C,q){var N=q[0],U=q[1],W=q[2],ka=q[3],ca=q[4],na=q[5],pa=q[6],wa=q[7],va=q[8],Ca=q[9],Da=q[10],Fa=q[11],Ea=q[12],Ha=q[13],
  		fa=q[14],Ga=q[15];q=C[0];var Ia=q*N;var Sa=q*U;var Pa=q*W;var Qa=q*ka;var Ta=q*ca;var Aa=q*na;var Wa=q*pa;var Va=q*wa;var Ma=q*va;var Ra=q*Ca;var Na=q*Da;var La=q*Fa;var Ka=q*Ea;var Ja=q*Ha;var ma=q*fa;var Xa=q*Ga;q=C[1];Sa+=q*N;Pa+=q*U;Qa+=q*W;Ta+=q*ka;Aa+=q*ca;Wa+=q*na;Va+=q*pa;Ma+=q*wa;Ra+=q*va;Na+=q*Ca;La+=q*Da;Ka+=q*Fa;Ja+=q*Ea;ma+=q*Ha;Xa+=q*fa;var eb=q*Ga;q=C[2];Pa+=q*N;Qa+=q*U;Ta+=q*W;Aa+=q*ka;Wa+=q*ca;Va+=q*na;Ma+=q*pa;Ra+=q*wa;Na+=q*va;La+=q*Ca;Ka+=q*Da;Ja+=q*Fa;ma+=q*Ea;Xa+=q*Ha;eb+=q*
  		fa;var gb=q*Ga;q=C[3];Qa+=q*N;Ta+=q*U;Aa+=q*W;Wa+=q*ka;Va+=q*ca;Ma+=q*na;Ra+=q*pa;Na+=q*wa;La+=q*va;Ka+=q*Ca;Ja+=q*Da;ma+=q*Fa;Xa+=q*Ea;eb+=q*Ha;gb+=q*fa;var hb=q*Ga;q=C[4];Ta+=q*N;Aa+=q*U;Wa+=q*W;Va+=q*ka;Ma+=q*ca;Ra+=q*na;Na+=q*pa;La+=q*wa;Ka+=q*va;Ja+=q*Ca;ma+=q*Da;Xa+=q*Fa;eb+=q*Ea;gb+=q*Ha;hb+=q*fa;var qa=q*Ga;q=C[5];Aa+=q*N;Wa+=q*U;Va+=q*W;Ma+=q*ka;Ra+=q*ca;Na+=q*na;La+=q*pa;Ka+=q*wa;Ja+=q*va;ma+=q*Ca;Xa+=q*Da;eb+=q*Fa;gb+=q*Ea;hb+=q*Ha;qa+=q*fa;var ra=q*Ga;q=C[6];Wa+=q*N;Va+=q*U;Ma+=q*W;Ra+=
  		q*ka;Na+=q*ca;La+=q*na;Ka+=q*pa;Ja+=q*wa;ma+=q*va;Xa+=q*Ca;eb+=q*Da;gb+=q*Fa;hb+=q*Ea;qa+=q*Ha;ra+=q*fa;var za=q*Ga;q=C[7];Va+=q*N;Ma+=q*U;Ra+=q*W;Na+=q*ka;La+=q*ca;Ka+=q*na;Ja+=q*pa;ma+=q*wa;Xa+=q*va;eb+=q*Ca;gb+=q*Da;hb+=q*Fa;qa+=q*Ea;ra+=q*Ha;za+=q*fa;var xa=q*Ga;q=C[8];Ma+=q*N;Ra+=q*U;Na+=q*W;La+=q*ka;Ka+=q*ca;Ja+=q*na;ma+=q*pa;Xa+=q*wa;eb+=q*va;gb+=q*Ca;hb+=q*Da;qa+=q*Fa;ra+=q*Ea;za+=q*Ha;xa+=q*fa;var ya=q*Ga;q=C[9];Ra+=q*N;Na+=q*U;La+=q*W;Ka+=q*ka;Ja+=q*ca;ma+=q*na;Xa+=q*pa;eb+=q*wa;gb+=q*va;
  		hb+=q*Ca;qa+=q*Da;ra+=q*Fa;za+=q*Ea;xa+=q*Ha;ya+=q*fa;var Ba=q*Ga;q=C[10];Na+=q*N;La+=q*U;Ka+=q*W;Ja+=q*ka;ma+=q*ca;Xa+=q*na;eb+=q*pa;gb+=q*wa;hb+=q*va;qa+=q*Ca;ra+=q*Da;za+=q*Fa;xa+=q*Ea;ya+=q*Ha;Ba+=q*fa;var ab=q*Ga;q=C[11];La+=q*N;Ka+=q*U;Ja+=q*W;ma+=q*ka;Xa+=q*ca;eb+=q*na;gb+=q*pa;hb+=q*wa;qa+=q*va;ra+=q*Ca;za+=q*Da;xa+=q*Fa;ya+=q*Ea;Ba+=q*Ha;ab+=q*fa;var cb=q*Ga;q=C[12];Ka+=q*N;Ja+=q*U;ma+=q*W;Xa+=q*ka;eb+=q*ca;gb+=q*na;hb+=q*pa;qa+=q*wa;ra+=q*va;za+=q*Ca;xa+=q*Da;ya+=q*Fa;Ba+=q*Ea;ab+=q*Ha;
  		cb+=q*fa;var lb=q*Ga;q=C[13];Ja+=q*N;ma+=q*U;Xa+=q*W;eb+=q*ka;gb+=q*ca;hb+=q*na;qa+=q*pa;ra+=q*wa;za+=q*va;xa+=q*Ca;ya+=q*Da;Ba+=q*Fa;ab+=q*Ea;cb+=q*Ha;lb+=q*fa;var mb=q*Ga;q=C[14];ma+=q*N;Xa+=q*U;eb+=q*W;gb+=q*ka;hb+=q*ca;qa+=q*na;ra+=q*pa;za+=q*wa;xa+=q*va;ya+=q*Ca;Ba+=q*Da;ab+=q*Fa;cb+=q*Ea;lb+=q*Ha;mb+=q*fa;var nb=q*Ga;q=C[15];Xa+=q*N;Sa+=38*(gb+q*W);Pa+=38*(hb+q*ka);Qa+=38*(qa+q*ca);Ta+=38*(ra+q*na);Aa+=38*(za+q*pa);Wa+=38*(xa+q*wa);Va+=38*(ya+q*va);Ma+=38*(Ba+q*Ca);Ra+=38*(ab+q*Da);Na+=38*(cb+
  		q*Fa);La+=38*(lb+q*Ea);Ka+=38*(mb+q*Ha);Ja+=38*(nb+q*fa);ma+=38*q*Ga;q=Ia+38*(eb+q*U)+1+65535;C=Math.floor(q/65536);Ia=q-65536*C;q=Sa+C+65535;C=Math.floor(q/65536);Sa=q-65536*C;q=Pa+C+65535;C=Math.floor(q/65536);Pa=q-65536*C;q=Qa+C+65535;C=Math.floor(q/65536);Qa=q-65536*C;q=Ta+C+65535;C=Math.floor(q/65536);Ta=q-65536*C;q=Aa+C+65535;C=Math.floor(q/65536);Aa=q-65536*C;q=Wa+C+65535;C=Math.floor(q/65536);Wa=q-65536*C;q=Va+C+65535;C=Math.floor(q/65536);Va=q-65536*C;q=Ma+C+65535;C=Math.floor(q/65536);Ma=
  		q-65536*C;q=Ra+C+65535;C=Math.floor(q/65536);Ra=q-65536*C;q=Na+C+65535;C=Math.floor(q/65536);Na=q-65536*C;q=La+C+65535;C=Math.floor(q/65536);La=q-65536*C;q=Ka+C+65535;C=Math.floor(q/65536);Ka=q-65536*C;q=Ja+C+65535;C=Math.floor(q/65536);Ja=q-65536*C;q=ma+C+65535;C=Math.floor(q/65536);ma=q-65536*C;q=Xa+C+65535;C=Math.floor(q/65536);Xa=q-65536*C;Ia+=C-1+37*(C-1);q=Ia+1+65535;C=Math.floor(q/65536);Ia=q-65536*C;q=Sa+C+65535;C=Math.floor(q/65536);Sa=q-65536*C;q=Pa+C+65535;C=Math.floor(q/65536);Pa=q-65536*
  		C;q=Qa+C+65535;C=Math.floor(q/65536);Qa=q-65536*C;q=Ta+C+65535;C=Math.floor(q/65536);Ta=q-65536*C;q=Aa+C+65535;C=Math.floor(q/65536);Aa=q-65536*C;q=Wa+C+65535;C=Math.floor(q/65536);Wa=q-65536*C;q=Va+C+65535;C=Math.floor(q/65536);Va=q-65536*C;q=Ma+C+65535;C=Math.floor(q/65536);Ma=q-65536*C;q=Ra+C+65535;C=Math.floor(q/65536);Ra=q-65536*C;q=Na+C+65535;C=Math.floor(q/65536);Na=q-65536*C;q=La+C+65535;C=Math.floor(q/65536);La=q-65536*C;q=Ka+C+65535;C=Math.floor(q/65536);Ka=q-65536*C;q=Ja+C+65535;C=Math.floor(q/
  		65536);Ja=q-65536*C;q=ma+C+65535;C=Math.floor(q/65536);ma=q-65536*C;q=Xa+C+65535;C=Math.floor(q/65536);E[0]=Ia+(C-1+37*(C-1));E[1]=Sa;E[2]=Pa;E[3]=Qa;E[4]=Ta;E[5]=Aa;E[6]=Wa;E[7]=Va;E[8]=Ma;E[9]=Ra;E[10]=Na;E[11]=La;E[12]=Ka;E[13]=Ja;E[14]=ma;E[15]=q-65536*C;}function R(E,C){P(E,C,C);}function V(E,C){var q=ua(),N;for(N=0;16>N;N++)q[N]=C[N];for(N=253;0<=N;N--)R(q,q),2!==N&&4!==N&&P(q,q,C);for(N=0;16>N;N++)E[N]=q[N];}function G(E,C){var q=ua(),N;for(N=0;16>N;N++)q[N]=C[N];for(N=250;0<=N;N--)R(q,q),1!==
  		N&&P(q,q,C);for(N=0;16>N;N++)E[N]=q[N];}function K(E,C,q){var N=new Uint8Array(32),U=new Float64Array(80),W,ka=ua(),ca=ua(),na=ua(),pa=ua(),wa=ua(),va=ua();for(W=0;31>W;W++)N[W]=C[W];N[31]=C[31]&127|64;N[0]&=248;S(U,q);for(W=0;16>W;W++)ca[W]=U[W],pa[W]=ka[W]=na[W]=0;ka[0]=pa[0]=1;for(W=254;0<=W;--W)C=N[W>>>3]>>>(W&7)&1,x(ka,ca,C),x(na,pa,C),Z(wa,ka,na),aa(ka,ka,na),Z(na,ca,pa),aa(ca,ca,pa),R(pa,wa),R(va,ka),P(ka,na,ka),P(na,ca,wa),Z(wa,ka,na),aa(ka,ka,na),R(ca,ka),aa(na,pa,va),P(ka,na,ha),Z(ka,ka,
  		pa),P(na,na,ka),P(ka,pa,va),P(pa,ca,U),R(ca,wa),x(ka,ca,C),x(na,pa,C);for(W=0;16>W;W++)U[W+16]=ka[W],U[W+32]=na[W],U[W+48]=ca[W],U[W+64]=pa[W];N=U.subarray(32);U=U.subarray(16);V(N,N);P(U,U,N);F(E,U);return 0}function J(E,C){return K(E,C,da)}function c(E,C){Za(C,32);return J(E,C)}function p(E,C,q){var N=new Uint8Array(32);K(N,q,C);v(E,$a,N,db);}function B(E,C,q,N){var U=new Int32Array(16),W=new Int32Array(16),ka;var ca=E[0];var na=E[1],pa=E[2],wa=E[3],va=E[4],Ca=E[5],Da=E[6],Fa=E[7];var Ea=C[0];for(var Ha=
  		C[1],fa=C[2],Ga=C[3],Ia=C[4],Sa=C[5],Pa=C[6],Qa=C[7],Ta=0;128<=N;){for(ka=0;16>ka;ka++){var Aa=8*ka+Ta;U[ka]=q[Aa+0]<<24|q[Aa+1]<<16|q[Aa+2]<<8|q[Aa+3];W[ka]=q[Aa+4]<<24|q[Aa+5]<<16|q[Aa+6]<<8|q[Aa+7];}for(ka=0;80>ka;ka++){Aa=ca;var Wa=na;var Va=pa;var Ma=wa;var Ra=va;var Na=Ca;var La=Da;var Ka=Ea;var Ja=Ha;var ma=fa;var Xa=Ga;var eb=Ia;var gb=Sa;var hb=Pa;var qa=Fa;var ra=Qa;var za=ra&65535;var xa=ra>>>16;var ya=qa&65535;var Ba=qa>>>16;qa=(va>>>14|Ia<<18)^(va>>>18|Ia<<14)^(Ia>>>9|va<<23);ra=(Ia>>>
  		14|va<<18)^(Ia>>>18|va<<14)^(va>>>9|Ia<<23);za+=ra&65535;xa+=ra>>>16;ya+=qa&65535;Ba+=qa>>>16;qa=va&Ca^~va&Da;ra=Ia&Sa^~Ia&Pa;za+=ra&65535;xa+=ra>>>16;ya+=qa&65535;Ba+=qa>>>16;qa=kb[2*ka];ra=kb[2*ka+1];za+=ra&65535;xa+=ra>>>16;ya+=qa&65535;Ba+=qa>>>16;qa=U[ka%16];ra=W[ka%16];za+=ra&65535;xa+=ra>>>16;ya+=qa&65535;Ba+=qa>>>16;xa+=za>>>16;ya+=xa>>>16;Ba+=ya>>>16;var ab=ya&65535|Ba<<16;var cb=za&65535|xa<<16;qa=ab;ra=cb;za=ra&65535;xa=ra>>>16;ya=qa&65535;Ba=qa>>>16;qa=(ca>>>28|Ea<<4)^(Ea>>>2|ca<<30)^
  		(Ea>>>7|ca<<25);ra=(Ea>>>28|ca<<4)^(ca>>>2|Ea<<30)^(ca>>>7|Ea<<25);za+=ra&65535;xa+=ra>>>16;ya+=qa&65535;Ba+=qa>>>16;qa=ca&na^ca&pa^na&pa;ra=Ea&Ha^Ea&fa^Ha&fa;za+=ra&65535;xa+=ra>>>16;ya+=qa&65535;Ba+=qa>>>16;xa+=za>>>16;ya+=xa>>>16;Ba+=ya>>>16;ca=ya&65535|Ba<<16;Ea=za&65535|xa<<16;qa=Ma;ra=Xa;za=ra&65535;xa=ra>>>16;ya=qa&65535;Ba=qa>>>16;qa=ab;ra=cb;za+=ra&65535;xa+=ra>>>16;ya+=qa&65535;Ba+=qa>>>16;xa+=za>>>16;ya+=xa>>>16;Ba+=ya>>>16;Ma=ya&65535|Ba<<16;Xa=za&65535|xa<<16;na=Aa;pa=Wa;wa=Va;va=Ma;
  		Ca=Ra;Da=Na;Fa=La;Ha=Ka;fa=Ja;Ga=ma;Ia=Xa;Sa=eb;Pa=gb;Qa=hb;if(15===ka%16)for(Aa=0;16>Aa;Aa++)qa=U[Aa],ra=W[Aa],za=ra&65535,xa=ra>>>16,ya=qa&65535,Ba=qa>>>16,qa=U[(Aa+9)%16],ra=W[(Aa+9)%16],za+=ra&65535,xa+=ra>>>16,ya+=qa&65535,Ba+=qa>>>16,ab=U[(Aa+1)%16],cb=W[(Aa+1)%16],qa=(ab>>>1|cb<<31)^(ab>>>8|cb<<24)^ab>>>7,ra=(cb>>>1|ab<<31)^(cb>>>8|ab<<24)^(cb>>>7|ab<<25),za+=ra&65535,xa+=ra>>>16,ya+=qa&65535,Ba+=qa>>>16,ab=U[(Aa+14)%16],cb=W[(Aa+14)%16],qa=(ab>>>19|cb<<13)^(cb>>>29|ab<<3)^ab>>>6,ra=(cb>>>
  		19|ab<<13)^(ab>>>29|cb<<3)^(cb>>>6|ab<<26),za+=ra&65535,xa+=ra>>>16,ya+=qa&65535,Ba+=qa>>>16,xa+=za>>>16,ya+=xa>>>16,Ba+=ya>>>16,U[Aa]=ya&65535|Ba<<16,W[Aa]=za&65535|xa<<16;}qa=ca;ra=Ea;za=ra&65535;xa=ra>>>16;ya=qa&65535;Ba=qa>>>16;qa=E[0];ra=C[0];za+=ra&65535;xa+=ra>>>16;ya+=qa&65535;Ba+=qa>>>16;xa+=za>>>16;ya+=xa>>>16;Ba+=ya>>>16;E[0]=ca=ya&65535|Ba<<16;C[0]=Ea=za&65535|xa<<16;qa=na;ra=Ha;za=ra&65535;xa=ra>>>16;ya=qa&65535;Ba=qa>>>16;qa=E[1];ra=C[1];za+=ra&65535;xa+=ra>>>16;ya+=qa&65535;Ba+=qa>>>
  		16;xa+=za>>>16;ya+=xa>>>16;Ba+=ya>>>16;E[1]=na=ya&65535|Ba<<16;C[1]=Ha=za&65535|xa<<16;qa=pa;ra=fa;za=ra&65535;xa=ra>>>16;ya=qa&65535;Ba=qa>>>16;qa=E[2];ra=C[2];za+=ra&65535;xa+=ra>>>16;ya+=qa&65535;Ba+=qa>>>16;xa+=za>>>16;ya+=xa>>>16;Ba+=ya>>>16;E[2]=pa=ya&65535|Ba<<16;C[2]=fa=za&65535|xa<<16;qa=wa;ra=Ga;za=ra&65535;xa=ra>>>16;ya=qa&65535;Ba=qa>>>16;qa=E[3];ra=C[3];za+=ra&65535;xa+=ra>>>16;ya+=qa&65535;Ba+=qa>>>16;xa+=za>>>16;ya+=xa>>>16;Ba+=ya>>>16;E[3]=wa=ya&65535|Ba<<16;C[3]=Ga=za&65535|xa<<16;
  		qa=va;ra=Ia;za=ra&65535;xa=ra>>>16;ya=qa&65535;Ba=qa>>>16;qa=E[4];ra=C[4];za+=ra&65535;xa+=ra>>>16;ya+=qa&65535;Ba+=qa>>>16;xa+=za>>>16;ya+=xa>>>16;Ba+=ya>>>16;E[4]=va=ya&65535|Ba<<16;C[4]=Ia=za&65535|xa<<16;qa=Ca;ra=Sa;za=ra&65535;xa=ra>>>16;ya=qa&65535;Ba=qa>>>16;qa=E[5];ra=C[5];za+=ra&65535;xa+=ra>>>16;ya+=qa&65535;Ba+=qa>>>16;xa+=za>>>16;ya+=xa>>>16;Ba+=ya>>>16;E[5]=Ca=ya&65535|Ba<<16;C[5]=Sa=za&65535|xa<<16;qa=Da;ra=Pa;za=ra&65535;xa=ra>>>16;ya=qa&65535;Ba=qa>>>16;qa=E[6];ra=C[6];za+=ra&65535;
  		xa+=ra>>>16;ya+=qa&65535;Ba+=qa>>>16;xa+=za>>>16;ya+=xa>>>16;Ba+=ya>>>16;E[6]=Da=ya&65535|Ba<<16;C[6]=Pa=za&65535|xa<<16;qa=Fa;ra=Qa;za=ra&65535;xa=ra>>>16;ya=qa&65535;Ba=qa>>>16;qa=E[7];ra=C[7];za+=ra&65535;xa+=ra>>>16;ya+=qa&65535;Ba+=qa>>>16;xa+=za>>>16;ya+=xa>>>16;Ba+=ya>>>16;E[7]=Fa=ya&65535|Ba<<16;C[7]=Qa=za&65535|xa<<16;Ta+=128;N-=128;}return N}function H(E,C,q){var N=new Int32Array(8),U=new Int32Array(8),W=new Uint8Array(256),ka,ca=q;N[0]=1779033703;N[1]=3144134277;N[2]=1013904242;N[3]=2773480762;
  		N[4]=1359893119;N[5]=2600822924;N[6]=528734635;N[7]=1541459225;U[0]=4089235720;U[1]=2227873595;U[2]=4271175723;U[3]=1595750129;U[4]=2917565137;U[5]=725511199;U[6]=4215389547;U[7]=327033209;B(N,U,C,q);q%=128;for(ka=0;ka<q;ka++)W[ka]=C[ca-q+ka];W[q]=128;q=256-128*(112>q?1:0);W[q-9]=0;e(W,q-8,ca/536870912|0,ca<<3);B(N,U,W,q);for(ka=0;8>ka;ka++)e(E,8*ka,N[ka],U[ka]);return 0}function T(E,C){var q=ua(),N=ua(),U=ua(),W=ua(),ka=ua(),ca=ua(),na=ua(),pa=ua(),wa=ua();aa(q,E[1],E[0]);aa(wa,C[1],C[0]);P(q,q,
  		wa);Z(N,E[0],E[1]);Z(wa,C[0],C[1]);P(N,N,wa);P(U,E[3],C[3]);P(U,U,Ya);P(W,E[2],C[2]);Z(W,W,W);aa(ka,N,q);aa(ca,W,U);Z(na,W,U);Z(pa,N,q);P(E[0],ka,ca);P(E[1],pa,na);P(E[2],na,ca);P(E[3],ka,pa);}function ia(E,C){var q=ua(),N=ua(),U=ua();V(U,C[2]);P(q,C[0],U);P(N,C[1],U);F(E,N);E[31]^=I(q)<<7;}function X(E,C,q){var N;u(E[0],ea);u(E[1],la);u(E[2],la);u(E[3],ea);for(N=255;0<=N;--N){var U=q[N/8|0]>>(N&7)&1;var W,ka=E,ca=C,na=U;for(W=0;4>W;W++)x(ka[W],ca[W],na);T(C,E);T(E,E);W=E;ka=C;ca=U;for(U=0;4>U;U++)x(W[U],
  		ka[U],ca);}}function ba(E,C){var q=[ua(),ua(),ua(),ua()];u(q[0],bb);u(q[1],Oa);u(q[2],la);P(q[3],bb,Oa);X(E,q,C);}function Q(E,C,q){var N=new Uint8Array(64),U=[ua(),ua(),ua(),ua()];q||Za(C,32);H(N,C,32);N[0]&=248;N[31]&=127;N[31]|=64;ba(U,N);ia(E,U);for(q=0;32>q;q++)C[q+32]=E[q];return 0}function L(E,C){var q,N;for(q=63;32<=q;--q){var U=0;var W=q-32;for(N=q-12;W<N;++W)C[W]+=U-16*C[q]*ib[W-(q-32)],U=Math.floor((C[W]+128)/256),C[W]-=256*U;C[W]+=U;C[q]=0;}for(W=U=0;32>W;W++)C[W]+=U-(C[31]>>4)*ib[W],U=C[W]>>
  		8,C[W]&=255;for(W=0;32>W;W++)C[W]-=U*ib[W];for(q=0;32>q;q++)C[q+1]+=C[q]>>8,E[q]=C[q]&255;}function M(E){var C=new Float64Array(64),q;for(q=0;64>q;q++)C[q]=E[q];for(q=0;64>q;q++)E[q]=0;L(E,C);}function Y(E,C,q,N){var U=new Uint8Array(64),W=new Uint8Array(64),ka=new Uint8Array(64),ca,na=new Float64Array(64),pa=[ua(),ua(),ua(),ua()];H(U,N,32);U[0]&=248;U[31]&=127;U[31]|=64;var wa=q+64;for(ca=0;ca<q;ca++)E[64+ca]=C[ca];for(ca=0;32>ca;ca++)E[32+ca]=U[32+ca];H(ka,E.subarray(32),q+32);M(ka);ba(pa,ka);ia(E,
  		pa);for(ca=32;64>ca;ca++)E[ca]=N[ca];H(W,E,q+64);M(W);for(ca=0;64>ca;ca++)na[ca]=0;for(ca=0;32>ca;ca++)na[ca]=ka[ca];for(ca=0;32>ca;ca++)for(C=0;32>C;C++)na[ca+C]+=W[ca]*U[C];L(E.subarray(32),na);return wa}function oa(E,C,q,N){var U=new Uint8Array(32),W=new Uint8Array(64),ka=[ua(),ua(),ua(),ua()],ca=[ua(),ua(),ua(),ua()];if(64>q)return  -1;var na=ua();var pa=ua(),wa=ua(),va=ua(),Ca=ua(),Da=ua(),Fa=ua();u(ca[2],la);S(ca[1],N);R(wa,ca[1]);P(va,wa,ja);aa(wa,wa,ca[2]);Z(va,ca[2],va);R(Ca,va);R(Da,Ca);P(Fa,
  		Da,Ca);P(na,Fa,wa);P(na,na,va);G(na,na);P(na,na,wa);P(na,na,va);P(na,na,va);P(ca[0],na,va);R(pa,ca[0]);P(pa,pa,va);D(pa,wa)&&P(ca[0],ca[0],jb);R(pa,ca[0]);P(pa,pa,va);D(pa,wa)?na=-1:(I(ca[0])===N[31]>>7&&aa(ca[0],ea,ca[0]),P(ca[3],ca[0],ca[1]),na=0);if(na)return  -1;for(na=0;na<q;na++)E[na]=C[na];for(na=0;32>na;na++)E[na+32]=N[na];H(W,E,q);M(W);X(ka,ca,W);ba(ca,C.subarray(32));T(ka,ca);ia(U,ka);q-=64;if(b(C,0,U,0)){for(na=0;na<q;na++)E[na]=0;return  -1}for(na=0;na<q;na++)E[na]=C[na+64];return q}function ta(E,
  		C){if(32!==E.length)throw Error("bad key size");if(24!==C.length)throw Error("bad nonce size");}function sa(){for(var E=0;E<arguments.length;E++)if(!(arguments[E]instanceof Uint8Array))throw new TypeError("unexpected type, use Uint8Array");}function Ua(E){for(var C=0;C<E.length;C++)E[C]=0;}var ua=function(E){var C,q=new Float64Array(16);if(E)for(C=0;C<E.length;C++)q[C]=E[C];return q},Za=function(){throw Error("no PRNG");},$a=new Uint8Array(16),da=new Uint8Array(32);da[0]=9;var ea=ua(),la=ua([1]),ha=
  		ua([56129,1]),ja=ua([30883,4953,19914,30187,55467,16705,2637,112,59544,30585,16505,36039,65139,11119,27886,20995]),Ya=ua([61785,9906,39828,60374,45398,33411,5274,224,53552,61171,33010,6542,64743,22239,55772,9222]),bb=ua([54554,36645,11616,51542,42930,38181,51040,26924,56412,64982,57905,49316,21502,52590,14035,8553]),Oa=ua([26200,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214]),jb=ua([41136,18958,6951,50414,58488,44335,6150,12099,55207,15867,153,11085,57099,
  		20417,9344,11139]),db=new Uint8Array([101,120,112,97,110,100,32,51,50,45,98,121,116,101,32,107]),fb=function(E){this.buffer=new Uint8Array(16);this.r=new Uint16Array(10);this.h=new Uint16Array(10);this.pad=new Uint16Array(8);this.fin=this.leftover=0;var C=E[0]&255|(E[1]&255)<<8;this.r[0]=C&8191;var q=E[2]&255|(E[3]&255)<<8;this.r[1]=(C>>>13|q<<3)&8191;C=E[4]&255|(E[5]&255)<<8;this.r[2]=(q>>>10|C<<6)&7939;q=E[6]&255|(E[7]&255)<<8;this.r[3]=(C>>>7|q<<9)&8191;C=E[8]&255|(E[9]&255)<<8;this.r[4]=(q>>>
  		4|C<<12)&255;this.r[5]=C>>>1&8190;q=E[10]&255|(E[11]&255)<<8;this.r[6]=(C>>>14|q<<2)&8191;C=E[12]&255|(E[13]&255)<<8;this.r[7]=(q>>>11|C<<5)&8065;q=E[14]&255|(E[15]&255)<<8;this.r[8]=(C>>>8|q<<8)&8191;this.r[9]=q>>>5&127;this.pad[0]=E[16]&255|(E[17]&255)<<8;this.pad[1]=E[18]&255|(E[19]&255)<<8;this.pad[2]=E[20]&255|(E[21]&255)<<8;this.pad[3]=E[22]&255|(E[23]&255)<<8;this.pad[4]=E[24]&255|(E[25]&255)<<8;this.pad[5]=E[26]&255|(E[27]&255)<<8;this.pad[6]=E[28]&255|(E[29]&255)<<8;this.pad[7]=E[30]&255|
  		(E[31]&255)<<8;};fb.prototype.blocks=function(E,C,q){for(var N=this.fin?0:2048,U,W,ka,ca,na,pa,wa,va,Ca,Da,Fa,Ea=this.h[0],Ha=this.h[1],fa=this.h[2],Ga=this.h[3],Ia=this.h[4],Sa=this.h[5],Pa=this.h[6],Qa=this.h[7],Ta=this.h[8],Aa=this.h[9],Wa=this.r[0],Va=this.r[1],Ma=this.r[2],Ra=this.r[3],Na=this.r[4],La=this.r[5],Ka=this.r[6],Ja=this.r[7],ma=this.r[8],Xa=this.r[9];16<=q;)U=E[C+0]&255|(E[C+1]&255)<<8,Ea+=U&8191,W=E[C+2]&255|(E[C+3]&255)<<8,Ha+=(U>>>13|W<<3)&8191,U=E[C+4]&255|(E[C+5]&255)<<8,fa+=
  		(W>>>10|U<<6)&8191,W=E[C+6]&255|(E[C+7]&255)<<8,Ga+=(U>>>7|W<<9)&8191,U=E[C+8]&255|(E[C+9]&255)<<8,Ia+=(W>>>4|U<<12)&8191,Sa+=U>>>1&8191,W=E[C+10]&255|(E[C+11]&255)<<8,Pa+=(U>>>14|W<<2)&8191,U=E[C+12]&255|(E[C+13]&255)<<8,Qa+=(W>>>11|U<<5)&8191,W=E[C+14]&255|(E[C+15]&255)<<8,Ta+=(U>>>8|W<<8)&8191,Aa+=W>>>5|N,U=W=0,U+=Ea*Wa,U+=5*Ha*Xa,U+=5*fa*ma,U+=5*Ga*Ja,U+=5*Ia*Ka,W=U>>>13,U&=8191,U+=5*Sa*La,U+=5*Pa*Na,U+=5*Qa*Ra,U+=5*Ta*Ma,U+=5*Aa*Va,W+=U>>>13,U&=8191,ka=W,ka+=Ea*Va,ka+=Ha*Wa,ka+=5*fa*Xa,ka+=5*
  		Ga*ma,ka+=5*Ia*Ja,W=ka>>>13,ka&=8191,ka+=5*Sa*Ka,ka+=5*Pa*La,ka+=5*Qa*Na,ka+=5*Ta*Ra,ka+=5*Aa*Ma,W+=ka>>>13,ka&=8191,ca=W,ca+=Ea*Ma,ca+=Ha*Va,ca+=fa*Wa,ca+=5*Ga*Xa,ca+=5*Ia*ma,W=ca>>>13,ca&=8191,ca+=5*Sa*Ja,ca+=5*Pa*Ka,ca+=5*Qa*La,ca+=5*Ta*Na,ca+=5*Aa*Ra,W+=ca>>>13,ca&=8191,na=W,na+=Ea*Ra,na+=Ha*Ma,na+=fa*Va,na+=Ga*Wa,na+=5*Ia*Xa,W=na>>>13,na&=8191,na+=5*Sa*ma,na+=5*Pa*Ja,na+=5*Qa*Ka,na+=5*Ta*La,na+=5*Aa*Na,W+=na>>>13,na&=8191,pa=W,pa+=Ea*Na,pa+=Ha*Ra,pa+=fa*Ma,pa+=Ga*Va,pa+=Ia*Wa,W=pa>>>13,pa&=8191,
  		pa+=5*Sa*Xa,pa+=5*Pa*ma,pa+=5*Qa*Ja,pa+=5*Ta*Ka,pa+=5*Aa*La,W+=pa>>>13,pa&=8191,wa=W,wa+=Ea*La,wa+=Ha*Na,wa+=fa*Ra,wa+=Ga*Ma,wa+=Ia*Va,W=wa>>>13,wa&=8191,wa+=Sa*Wa,wa+=5*Pa*Xa,wa+=5*Qa*ma,wa+=5*Ta*Ja,wa+=5*Aa*Ka,W+=wa>>>13,wa&=8191,va=W,va+=Ea*Ka,va+=Ha*La,va+=fa*Na,va+=Ga*Ra,va+=Ia*Ma,W=va>>>13,va&=8191,va+=Sa*Va,va+=Pa*Wa,va+=5*Qa*Xa,va+=5*Ta*ma,va+=5*Aa*Ja,W+=va>>>13,va&=8191,Ca=W,Ca+=Ea*Ja,Ca+=Ha*Ka,Ca+=fa*La,Ca+=Ga*Na,Ca+=Ia*Ra,W=Ca>>>13,Ca&=8191,Ca+=Sa*Ma,Ca+=Pa*Va,Ca+=Qa*Wa,Ca+=5*Ta*Xa,Ca+=
  		5*Aa*ma,W+=Ca>>>13,Ca&=8191,Da=W,Da+=Ea*ma,Da+=Ha*Ja,Da+=fa*Ka,Da+=Ga*La,Da+=Ia*Na,W=Da>>>13,Da&=8191,Da+=Sa*Ra,Da+=Pa*Ma,Da+=Qa*Va,Da+=Ta*Wa,Da+=5*Aa*Xa,W+=Da>>>13,Da&=8191,Fa=W,Fa+=Ea*Xa,Fa+=Ha*ma,Fa+=fa*Ja,Fa+=Ga*Ka,Fa+=Ia*La,W=Fa>>>13,Fa&=8191,Fa+=Sa*Na,Fa+=Pa*Ra,Fa+=Qa*Ma,Fa+=Ta*Va,Fa+=Aa*Wa,W+=Fa>>>13,Fa&=8191,W=(W<<2)+W|0,W=W+U|0,U=W&8191,W>>>=13,ka+=W,Ea=U,Ha=ka,fa=ca,Ga=na,Ia=pa,Sa=wa,Pa=va,Qa=Ca,Ta=Da,Aa=Fa,C+=16,q-=16;this.h[0]=Ea;this.h[1]=Ha;this.h[2]=fa;this.h[3]=Ga;this.h[4]=Ia;this.h[5]=
  		Sa;this.h[6]=Pa;this.h[7]=Qa;this.h[8]=Ta;this.h[9]=Aa;};fb.prototype.finish=function(E,C){var q=new Uint16Array(10);if(this.leftover){var N=this.leftover;for(this.buffer[N++]=1;16>N;N++)this.buffer[N]=0;this.fin=1;this.blocks(this.buffer,0,16);}var U=this.h[1]>>>13;this.h[1]&=8191;for(N=2;10>N;N++)this.h[N]+=U,U=this.h[N]>>>13,this.h[N]&=8191;this.h[0]+=5*U;U=this.h[0]>>>13;this.h[0]&=8191;this.h[1]+=U;U=this.h[1]>>>13;this.h[1]&=8191;this.h[2]+=U;q[0]=this.h[0]+5;U=q[0]>>>13;q[0]&=8191;for(N=1;10>
  		N;N++)q[N]=this.h[N]+U,U=q[N]>>>13,q[N]&=8191;q[9]-=8192;U=(U^1)-1;for(N=0;10>N;N++)q[N]&=U;U=~U;for(N=0;10>N;N++)this.h[N]=this.h[N]&U|q[N];this.h[0]=(this.h[0]|this.h[1]<<13)&65535;this.h[1]=(this.h[1]>>>3|this.h[2]<<10)&65535;this.h[2]=(this.h[2]>>>6|this.h[3]<<7)&65535;this.h[3]=(this.h[3]>>>9|this.h[4]<<4)&65535;this.h[4]=(this.h[4]>>>12|this.h[5]<<1|this.h[6]<<14)&65535;this.h[5]=(this.h[6]>>>2|this.h[7]<<11)&65535;this.h[6]=(this.h[7]>>>5|this.h[8]<<8)&65535;this.h[7]=(this.h[8]>>>8|this.h[9]<<
  		5)&65535;q=this.h[0]+this.pad[0];this.h[0]=q&65535;for(N=1;8>N;N++)q=(this.h[N]+this.pad[N]|0)+(q>>>16)|0,this.h[N]=q&65535;E[C+0]=this.h[0]>>>0&255;E[C+1]=this.h[0]>>>8&255;E[C+2]=this.h[1]>>>0&255;E[C+3]=this.h[1]>>>8&255;E[C+4]=this.h[2]>>>0&255;E[C+5]=this.h[2]>>>8&255;E[C+6]=this.h[3]>>>0&255;E[C+7]=this.h[3]>>>8&255;E[C+8]=this.h[4]>>>0&255;E[C+9]=this.h[4]>>>8&255;E[C+10]=this.h[5]>>>0&255;E[C+11]=this.h[5]>>>8&255;E[C+12]=this.h[6]>>>0&255;E[C+13]=this.h[6]>>>8&255;E[C+14]=this.h[7]>>>0&255;
  		E[C+15]=this.h[7]>>>8&255;};fb.prototype.update=function(E,C,q){var N;if(this.leftover){var U=16-this.leftover;U>q&&(U=q);for(N=0;N<U;N++)this.buffer[this.leftover+N]=E[C+N];q-=U;C+=U;this.leftover+=U;if(16>this.leftover)return;this.blocks(this.buffer,0,16);this.leftover=0;}16<=q&&(U=q-q%16,this.blocks(E,C,U),C+=U,q-=U);if(q){for(N=0;N<q;N++)this.buffer[this.leftover+N]=E[C+N];this.leftover+=q;}};var kb=[1116352408,3609767458,1899447441,602891725,3049323471,3964484399,3921009573,2173295548,961987163,
  		4081628472,1508970993,3053834265,2453635748,2937671579,2870763221,3664609560,3624381080,2734883394,310598401,1164996542,607225278,1323610764,1426881987,3590304994,1925078388,4068182383,2162078206,991336113,2614888103,633803317,3248222580,3479774868,3835390401,2666613458,4022224774,944711139,264347078,2341262773,604807628,2007800933,770255983,1495990901,1249150122,1856431235,1555081692,3175218132,1996064986,2198950837,2554220882,3999719339,2821834349,766784016,2952996808,2566594879,3210313671,3203337956,
  		3336571891,1034457026,3584528711,2466948901,113926993,3758326383,338241895,168717936,666307205,1188179964,773529912,1546045734,1294757372,1522805485,1396182291,2643833823,1695183700,2343527390,1986661051,1014477480,2177026350,1206759142,2456956037,344077627,2730485921,1290863460,2820302411,3158454273,3259730800,3505952657,3345764771,106217008,3516065817,3606008344,3600352804,1432725776,4094571909,1467031594,275423344,851169720,430227734,3100823752,506948616,1363258195,659060556,3750685593,883997877,
  		3785050280,958139571,3318307427,1322822218,3812723403,1537002063,2003034995,1747873779,3602036899,1955562222,1575990012,2024104815,1125592928,2227730452,2716904306,2361852424,442776044,2428436474,593698344,2756734187,3733110249,3204031479,2999351573,3329325298,3815920427,3391569614,3928383900,3515267271,566280711,3940187606,3454069534,4118630271,4000239992,116418474,1914138554,174292421,2731055270,289380356,3203993006,460393269,320620315,685471733,587496836,852142971,1086792851,1017036298,365543100,
  		1126000580,2618297676,1288033470,3409855158,1501505948,4234509866,1607167915,987167468,1816402316,1246189591],ib=new Float64Array([237,211,245,92,26,99,18,88,214,156,247,162,222,249,222,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16]);f.lowlevel={crypto_core_hsalsa20:function(E,C,q,N){v(E,C,q,N);},crypto_stream_xor:l,crypto_stream:h,crypto_stream_salsa20_xor:m,crypto_stream_salsa20:r,crypto_onetimeauth:k,crypto_onetimeauth_verify:n,crypto_verify_16:a,crypto_verify_32:b,crypto_secretbox:w,crypto_secretbox_open:t,
  		crypto_scalarmult:K,crypto_scalarmult_base:J,crypto_box_beforenm:p,crypto_box_afternm:w,crypto_box:function(E,C,q,N,U,W){var ka=new Uint8Array(32);p(ka,U,W);return w(E,C,q,N,ka)},crypto_box_open:function(E,C,q,N,U,W){var ka=new Uint8Array(32);p(ka,U,W);return t(E,C,q,N,ka)},crypto_box_keypair:c,crypto_hash:H,crypto_sign:Y,crypto_sign_keypair:Q,crypto_sign_open:oa,crypto_secretbox_KEYBYTES:32,crypto_secretbox_NONCEBYTES:24,crypto_secretbox_ZEROBYTES:32,crypto_secretbox_BOXZEROBYTES:16,crypto_scalarmult_BYTES:32,
  		crypto_scalarmult_SCALARBYTES:32,crypto_box_PUBLICKEYBYTES:32,crypto_box_SECRETKEYBYTES:32,crypto_box_BEFORENMBYTES:32,crypto_box_NONCEBYTES:24,crypto_box_ZEROBYTES:32,crypto_box_BOXZEROBYTES:16,crypto_sign_BYTES:64,crypto_sign_PUBLICKEYBYTES:32,crypto_sign_SECRETKEYBYTES:64,crypto_sign_SEEDBYTES:32,crypto_hash_BYTES:64,gf:ua,D:ja,L:ib,pack25519:F,unpack25519:S,M:P,A:Z,S:R,Z:aa,pow2523:G,add:T,set25519:u,modL:L,scalarmult:X,scalarbase:ba};f.randomBytes=function(E){var C=new Uint8Array(E);Za(C,E);
  		return C};f.secretbox=function(E,C,q){sa(E,C,q);ta(q,C);for(var N=new Uint8Array(32+E.length),U=new Uint8Array(N.length),W=0;W<E.length;W++)N[W+32]=E[W];w(U,N,N.length,C,q);return U.subarray(16)};f.secretbox.open=function(E,C,q){sa(E,C,q);ta(q,C);for(var N=new Uint8Array(16+E.length),U=new Uint8Array(N.length),W=0;W<E.length;W++)N[W+16]=E[W];return 32>N.length||0!==t(U,N,N.length,C,q)?null:U.subarray(32)};f.secretbox.keyLength=32;f.secretbox.nonceLength=24;f.secretbox.overheadLength=16;f.scalarMult=
  		function(E,C){sa(E,C);if(32!==E.length)throw Error("bad n size");if(32!==C.length)throw Error("bad p size");var q=new Uint8Array(32);K(q,E,C);return q};f.scalarMult.base=function(E){sa(E);if(32!==E.length)throw Error("bad n size");var C=new Uint8Array(32);J(C,E);return C};f.scalarMult.scalarLength=32;f.scalarMult.groupElementLength=32;f.box=function(E,C,q,N){q=f.box.before(q,N);return f.secretbox(E,C,q)};f.box.before=function(E,C){sa(E,C);if(32!==E.length)throw Error("bad public key size");if(32!==
  		C.length)throw Error("bad secret key size");var q=new Uint8Array(32);p(q,E,C);return q};f.box.after=f.secretbox;f.box.open=function(E,C,q,N){q=f.box.before(q,N);return f.secretbox.open(E,C,q)};f.box.open.after=f.secretbox.open;f.box.keyPair=function(){var E=new Uint8Array(32),C=new Uint8Array(32);c(E,C);return {publicKey:E,secretKey:C}};f.box.keyPair.fromSecretKey=function(E){sa(E);if(32!==E.length)throw Error("bad secret key size");var C=new Uint8Array(32);J(C,E);return {publicKey:C,secretKey:new Uint8Array(E)}};
  		f.box.publicKeyLength=32;f.box.secretKeyLength=32;f.box.sharedKeyLength=32;f.box.nonceLength=24;f.box.overheadLength=f.secretbox.overheadLength;f.sign=function(E,C){sa(E,C);if(64!==C.length)throw Error("bad secret key size");var q=new Uint8Array(64+E.length);Y(q,E,E.length,C);return q};f.sign.open=function(E,C){sa(E,C);if(32!==C.length)throw Error("bad public key size");var q=new Uint8Array(E.length);E=oa(q,E,E.length,C);if(0>E)return null;E=new Uint8Array(E);for(C=0;C<E.length;C++)E[C]=q[C];return E};
  		f.sign.detached=function(E,C){E=f.sign(E,C);C=new Uint8Array(64);for(var q=0;q<C.length;q++)C[q]=E[q];return C};f.sign.detached.verify=function(E,C,q){sa(E,C,q);if(64!==C.length)throw Error("bad signature size");if(32!==q.length)throw Error("bad public key size");var N=new Uint8Array(64+E.length),U=new Uint8Array(64+E.length),W;for(W=0;64>W;W++)N[W]=C[W];for(W=0;W<E.length;W++)N[W+64]=E[W];return 0<=oa(U,N,N.length,q)};f.sign.keyPair=function(){var E=new Uint8Array(32),C=new Uint8Array(64);Q(E,C);
  		return {publicKey:E,secretKey:C}};f.sign.keyPair.fromSecretKey=function(E){sa(E);if(64!==E.length)throw Error("bad secret key size");for(var C=new Uint8Array(32),q=0;q<C.length;q++)C[q]=E[32+q];return {publicKey:C,secretKey:new Uint8Array(E)}};f.sign.keyPair.fromSeed=function(E){sa(E);if(32!==E.length)throw Error("bad seed size");for(var C=new Uint8Array(32),q=new Uint8Array(64),N=0;32>N;N++)q[N]=E[N];Q(C,q,true);return {publicKey:C,secretKey:q}};f.sign.publicKeyLength=32;f.sign.secretKeyLength=64;f.sign.seedLength=
  		32;f.sign.signatureLength=64;f.hash=function(E){sa(E);var C=new Uint8Array(64);H(C,E,E.length);return C};f.hash.hashLength=64;f.verify=function(E,C){sa(E,C);return 0===E.length||0===C.length||E.length!==C.length?false:0===g(E,0,C,0,E.length)?true:false};f.setPRNG=function(E){Za=E;};(function(){var E="undefined"!==typeof self?self.crypto||self.msCrypto:null;E&&E.getRandomValues?f.setPRNG(function(C,q){var N,U=new Uint8Array(q);for(N=0;N<q;N+=65536)E.getRandomValues(U.subarray(N,N+Math.min(q-N,65536)));for(N=
  		0;N<q;N++)C[N]=U[N];Ua(U);}):"undefined"!==typeof z&&(E=z("crypto"))&&E.randomBytes&&f.setPRNG(function(C,q){var N,U=E.randomBytes(q);for(N=0;N<q;N++)C[N]=U[N];Ua(U);});})();})("undefined"!==typeof O&&O.exports?O.exports:self.nacl=self.nacl||{});},{crypto:44}],152:[function(z,O,A){(function(f){(function(){function e(g){try{if(!f.localStorage)return !1}catch(a){return  false}g=f.localStorage[g];return null==g?false:"true"===String(g).toLowerCase()}O.exports=function(g,a){if(e("noDeprecation"))return g;var b=false;
  		return function(){if(!b){if(e("throwDeprecation"))throw Error(a);e("traceDeprecation")?console.trace(a):console.warn(a);b=true;}return g.apply(this,arguments)}};}).call(this);}).call(this,"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{});},{}],153:[function(z,O,A){arguments[4][23][0].apply(A,arguments);},{dup:23}],154:[function(z,O,A){function f(J){return J.call.bind(J)}function e(J,c){if("object"!==typeof J)return  false;try{return c(J),!0}catch(p){return  false}}
  		function g(J){return "[object Map]"===Z(J)}function a(J){return "[object Set]"===Z(J)}function b(J){return "[object WeakMap]"===Z(J)}function d(J){return "[object WeakSet]"===Z(J)}function v(J){return "[object ArrayBuffer]"===Z(J)}function m(J){return "undefined"===typeof ArrayBuffer?false:v.working?v(J):J instanceof ArrayBuffer}function r(J){return "[object DataView]"===Z(J)}function h(J){return "undefined"===typeof DataView?false:r.working?r(J):J instanceof DataView}function l(J){return "[object SharedArrayBuffer]"===
  		Z(J)}function k(J){if("undefined"===typeof K)return  false;"undefined"===typeof l.working&&(l.working=l(new K));return l.working?l(J):J instanceof K}function n(J){return e(J,aa)}function w(J){return e(J,P)}function t(J){return e(J,R)}function u(J){return I&&e(J,V)}function y(J){return S&&e(J,G)}O=z("is-arguments");var x=z("is-generator-function"),F=z("which-typed-array"),D=z("is-typed-array"),I="undefined"!==typeof BigInt,S="undefined"!==typeof Symbol,Z=f(Object.prototype.toString),aa=f(Number.prototype.valueOf),
  		P=f(String.prototype.valueOf),R=f(Boolean.prototype.valueOf);if(I)var V=f(BigInt.prototype.valueOf);if(S)var G=f(Symbol.prototype.valueOf);A.isArgumentsObject=O;A.isGeneratorFunction=x;A.isTypedArray=D;A.isPromise=function(J){return "undefined"!==typeof Promise&&J instanceof Promise||null!==J&&"object"===typeof J&&"function"===typeof J.then&&"function"===typeof J.catch};A.isArrayBufferView=function(J){return "undefined"!==typeof ArrayBuffer&&ArrayBuffer.isView?ArrayBuffer.isView(J):D(J)||h(J)};A.isUint8Array=
  		function(J){return "Uint8Array"===F(J)};A.isUint8ClampedArray=function(J){return "Uint8ClampedArray"===F(J)};A.isUint16Array=function(J){return "Uint16Array"===F(J)};A.isUint32Array=function(J){return "Uint32Array"===F(J)};A.isInt8Array=function(J){return "Int8Array"===F(J)};A.isInt16Array=function(J){return "Int16Array"===F(J)};A.isInt32Array=function(J){return "Int32Array"===F(J)};A.isFloat32Array=function(J){return "Float32Array"===F(J)};A.isFloat64Array=function(J){return "Float64Array"===F(J)};A.isBigInt64Array=
  		function(J){return "BigInt64Array"===F(J)};A.isBigUint64Array=function(J){return "BigUint64Array"===F(J)};g.working="undefined"!==typeof Map&&g(new Map);A.isMap=function(J){return "undefined"===typeof Map?false:g.working?g(J):J instanceof Map};a.working="undefined"!==typeof Set&&a(new Set);A.isSet=function(J){return "undefined"===typeof Set?false:a.working?a(J):J instanceof Set};b.working="undefined"!==typeof WeakMap&&b(new WeakMap);A.isWeakMap=function(J){return "undefined"===typeof WeakMap?false:b.working?b(J):
  		J instanceof WeakMap};d.working="undefined"!==typeof WeakSet&&d(new WeakSet);A.isWeakSet=function(J){return d(J)};v.working="undefined"!==typeof ArrayBuffer&&v(new ArrayBuffer);A.isArrayBuffer=m;r.working="undefined"!==typeof ArrayBuffer&&"undefined"!==typeof DataView&&r(new DataView(new ArrayBuffer(1),0,1));A.isDataView=h;var K="undefined"!==typeof SharedArrayBuffer?SharedArrayBuffer:void 0;A.isSharedArrayBuffer=k;A.isAsyncFunction=function(J){return "[object AsyncFunction]"===Z(J)};A.isMapIterator=
  		function(J){return "[object Map Iterator]"===Z(J)};A.isSetIterator=function(J){return "[object Set Iterator]"===Z(J)};A.isGeneratorObject=function(J){return "[object Generator]"===Z(J)};A.isWebAssemblyCompiledModule=function(J){return "[object WebAssembly.Module]"===Z(J)};A.isNumberObject=n;A.isStringObject=w;A.isBooleanObject=t;A.isBigIntObject=u;A.isSymbolObject=y;A.isBoxedPrimitive=function(J){return n(J)||w(J)||t(J)||u(J)||y(J)};A.isAnyArrayBuffer=function(J){return "undefined"!==typeof Uint8Array&&
  		(m(J)||k(J))};["isProxy","isExternal","isModuleNamespaceObject"].forEach(function(J){Object.defineProperty(A,J,{enumerable:false,value:function(){throw Error(J+" is not supported in userland");}});});},{"is-arguments":106,"is-generator-function":108,"is-typed-array":109,"which-typed-array":179}],155:[function(z,O,A){(function(f){(function(){function e(c,p){var B={seen:[],stylize:a};3<=arguments.length&&(B.depth=arguments[2]);4<=arguments.length&&(B.colors=arguments[3]);n(p)?B.showHidden=p:p&&A._extend(B,
  		p);u(B.showHidden)&&(B.showHidden=false);u(B.depth)&&(B.depth=2);u(B.colors)&&(B.colors=false);u(B.customInspect)&&(B.customInspect=true);B.colors&&(B.stylize=g);return d(B,c,B.depth)}function g(c,p){return (p=e.styles[p])?"\u001b["+e.colors[p][0]+"m"+c+"\u001b["+e.colors[p][1]+"m":c}function a(c,p){return c}function b(c){var p={};c.forEach(function(B,H){p[B]=true;});return p}function d(c,p,B){if(c.customInspect&&p&&I(p.inspect)&&p.inspect!==A.inspect&&(!p.constructor||p.constructor.prototype!==p)){var H=p.inspect(B,
  		c);t(H)||(H=d(c,H,B));return H}if(H=v(c,p))return H;var T=Object.keys(p),ia=b(T);c.showHidden&&(T=Object.getOwnPropertyNames(p));if(D(p)&&(0<=T.indexOf("message")||0<=T.indexOf("description")))return m(p);if(0===T.length){if(I(p))return c.stylize("[Function"+(p.name?": "+p.name:"")+"]","special");if(y(p))return c.stylize(RegExp.prototype.toString.call(p),"regexp");if(F(p))return c.stylize(Date.prototype.toString.call(p),"date");if(D(p))return m(p)}H="";var X=false,ba=["{","}"];k(p)&&(X=true,ba=["[","]"]);
  		I(p)&&(H=" [Function"+(p.name?": "+p.name:"")+"]");y(p)&&(H=" "+RegExp.prototype.toString.call(p));F(p)&&(H=" "+Date.prototype.toUTCString.call(p));D(p)&&(H=" "+m(p));if(0===T.length&&(!X||0==p.length))return ba[0]+H+ba[1];if(0>B)return y(p)?c.stylize(RegExp.prototype.toString.call(p),"regexp"):c.stylize("[Object]","special");c.seen.push(p);T=X?r(c,p,B,ia,T):T.map(function(Q){return h(c,p,B,ia,Q,X)});c.seen.pop();return l(T,H,ba)}function v(c,p){if(u(p))return c.stylize("undefined","undefined");if(t(p))return p=
  		"'"+JSON.stringify(p).replace(/^"|"$/g,"").replace(/'/g,"\\'").replace(/\\"/g,'"')+"'",c.stylize(p,"string");if(w(p))return c.stylize(""+p,"number");if(n(p))return c.stylize(""+p,"boolean");if(null===p)return c.stylize("null","null")}function m(c){return "["+Error.prototype.toString.call(c)+"]"}function r(c,p,B,H,T){for(var ia=[],X=0,ba=p.length;X<ba;++X)Object.prototype.hasOwnProperty.call(p,String(X))?ia.push(h(c,p,B,H,String(X),true)):ia.push("");T.forEach(function(Q){Q.match(/^\d+$/)||ia.push(h(c,
  		p,B,H,Q,true));});return ia}function h(c,p,B,H,T,ia){var X,ba;p=Object.getOwnPropertyDescriptor(p,T)||{value:p[T]};p.get?ba=p.set?c.stylize("[Getter/Setter]","special"):c.stylize("[Getter]","special"):p.set&&(ba=c.stylize("[Setter]","special"));Object.prototype.hasOwnProperty.call(H,T)||(X="["+T+"]");ba||(0>c.seen.indexOf(p.value)?(ba=null===B?d(c,p.value,null):d(c,p.value,B-1),-1<ba.indexOf("\n")&&(ba=ia?ba.split("\n").map(function(Q){return "  "+Q}).join("\n").slice(2):"\n"+ba.split("\n").map(function(Q){return "   "+
  		Q}).join("\n"))):ba=c.stylize("[Circular]","special"));if(u(X)){if(ia&&T.match(/^\d+$/))return ba;X=JSON.stringify(""+T);X.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)?(X=X.slice(1,-1),X=c.stylize(X,"name")):(X=X.replace(/'/g,"\\'").replace(/\\"/g,'"').replace(/(^"|"$)/g,"'"),X=c.stylize(X,"string"));}return X+": "+ba}function l(c,p,B){var H=0;return 60<c.reduce(function(T,ia){H++;0<=ia.indexOf("\n")&&H++;return T+ia.replace(/\u001b\[\d\d?m/g,"").length+1},0)?B[0]+(""===p?"":p+"\n ")+" "+c.join(",\n  ")+
  		" "+B[1]:B[0]+p+" "+c.join(", ")+" "+B[1]}function k(c){return Array.isArray(c)}function n(c){return "boolean"===typeof c}function w(c){return "number"===typeof c}function t(c){return "string"===typeof c}function u(c){return void 0===c}function y(c){return x(c)&&"[object RegExp]"===Object.prototype.toString.call(c)}function x(c){return "object"===typeof c&&null!==c}function F(c){return x(c)&&"[object Date]"===Object.prototype.toString.call(c)}function D(c){return x(c)&&("[object Error]"===Object.prototype.toString.call(c)||
  		c instanceof Error)}function I(c){return "function"===typeof c}function S(c){return 10>c?"0"+c.toString(10):c.toString(10)}function Z(c,p){if(!c){var B=Error("Promise was rejected with a falsy value");B.reason=c;c=B;}return p(c)}var aa=Object.getOwnPropertyDescriptors||function(c){for(var p=Object.keys(c),B={},H=0;H<p.length;H++)B[p[H]]=Object.getOwnPropertyDescriptor(c,p[H]);return B},P=/%[sdj%]/g;A.format=function(c){if(!t(c)){for(var p=[],B=0;B<arguments.length;B++)p.push(e(arguments[B]));return p.join(" ")}B=
  		1;var H=arguments,T=H.length;p=String(c).replace(P,function(X){if("%%"===X)return "%";if(B>=T)return X;switch(X){case "%s":return String(H[B++]);case "%d":return Number(H[B++]);case "%j":try{return JSON.stringify(H[B++])}catch(ba){return "[Circular]"}default:return X}});for(var ia=H[B];B<T;ia=H[++B])p=null!==ia&&x(ia)?p+(" "+e(ia)):p+(" "+ia);return p};A.deprecate=function(c,p){if("undefined"!==typeof f&&true===f.noDeprecation)return c;if("undefined"===typeof f)return function(){return A.deprecate(c,
  		p).apply(this,arguments)};var B=false;return function(){if(!B){if(f.throwDeprecation)throw Error(p);f.traceDeprecation?console.trace(p):console.error(p);B=true;}return c.apply(this,arguments)}};var R={},V=/^$/;if(f.env.NODE_DEBUG){var G=f.env.NODE_DEBUG;G=G.replace(/[|\\{}()[\]^$+?.]/g,"\\$&").replace(/\*/g,".*").replace(/,/g,"$|^").toUpperCase();V=new RegExp("^"+G+"$","i");}A.debuglog=function(c){c=c.toUpperCase();if(!R[c])if(V.test(c)){var p=f.pid;R[c]=function(){var B=A.format.apply(A,arguments);console.error("%s %d: %s",
  		c,p,B);};}else R[c]=function(){};return R[c]};A.inspect=e;e.colors={bold:[1,22],italic:[3,23],underline:[4,24],inverse:[7,27],white:[37,39],grey:[90,39],black:[30,39],blue:[34,39],cyan:[36,39],green:[32,39],magenta:[35,39],red:[31,39],yellow:[33,39]};e.styles={special:"cyan",number:"yellow","boolean":"yellow",undefined:"grey","null":"bold",string:"green",date:"magenta",regexp:"red"};A.types=z("./support/types");A.isArray=k;A.isBoolean=n;A.isNull=function(c){return null===c};A.isNullOrUndefined=function(c){return null==
  		c};A.isNumber=w;A.isString=t;A.isSymbol=function(c){return "symbol"===typeof c};A.isUndefined=u;A.isRegExp=y;A.types.isRegExp=y;A.isObject=x;A.isDate=F;A.types.isDate=F;A.isError=D;A.types.isNativeError=D;A.isFunction=I;A.isPrimitive=function(c){return null===c||"boolean"===typeof c||"number"===typeof c||"string"===typeof c||"symbol"===typeof c||"undefined"===typeof c};A.isBuffer=z("./support/isBuffer");var K="Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");A.log=function(){var c=console,
  		p=c.log;var B=new Date;var H=[S(B.getHours()),S(B.getMinutes()),S(B.getSeconds())].join(":");B=[B.getDate(),K[B.getMonth()],H].join(" ");p.call(c,"%s - %s",B,A.format.apply(A,arguments));};A.inherits=z("inherits");A._extend=function(c,p){if(!p||!x(p))return c;for(var B=Object.keys(p),H=B.length;H--;)c[B[H]]=p[B[H]];return c};var J="undefined"!==typeof Symbol?Symbol("util.promisify.custom"):void 0;A.promisify=function(c){function p(){for(var B,H,T=new Promise(function(ba,Q){B=ba;H=Q;}),ia=[],X=0;X<arguments.length;X++)ia.push(arguments[X]);
  		ia.push(function(ba,Q){ba?H(ba):B(Q);});try{c.apply(this,ia);}catch(ba){H(ba);}return T}if("function"!==typeof c)throw new TypeError('The "original" argument must be of type Function');if(J&&c[J]){p=c[J];if("function"!==typeof p)throw new TypeError('The "util.promisify.custom" argument must be of type Function');Object.defineProperty(p,J,{value:p,enumerable:false,writable:false,configurable:true});return p}Object.setPrototypeOf(p,Object.getPrototypeOf(c));J&&Object.defineProperty(p,J,{value:p,enumerable:false,
  		writable:false,configurable:true});return Object.defineProperties(p,aa(c))};A.promisify.custom=J;A.callbackify=function(c){function p(){for(var B=[],H=0;H<arguments.length;H++)B.push(arguments[H]);var T=B.pop();if("function"!==typeof T)throw new TypeError("The last argument must be of type Function");var ia=this,X=function(){return T.apply(ia,arguments)};c.apply(this,B).then(function(ba){f.nextTick(X.bind(null,null,ba));},function(ba){f.nextTick(Z.bind(null,ba,X));});}if("function"!==typeof c)throw new TypeError('The "original" argument must be of type Function');
  		Object.setPrototypeOf(p,Object.getPrototypeOf(c));Object.defineProperties(p,aa(c));return p};}).call(this);}).call(this,z("_process"));},{"./support/isBuffer":153,"./support/types":154,_process:133,inherits:105}],156:[function(z,O,A){(function(f){f(function(e){var g=e("./makePromise"),a=e("./Scheduler");e=e("./env").asap;return g({scheduler:new a(e)})});})(function(f){O.exports=f(z);});},{"./Scheduler":157,"./env":169,"./makePromise":171}],157:[function(z,O,A){(function(f){f(function(){function e(g){this._async=
  		g;this._running=false;this._queue=this;this._queueLen=0;this._afterQueue={};this._afterQueueLen=0;var a=this;this.drain=function(){a._drain();};}e.prototype.enqueue=function(g){this._queue[this._queueLen++]=g;this.run();};e.prototype.afterQueue=function(g){this._afterQueue[this._afterQueueLen++]=g;this.run();};e.prototype.run=function(){this._running||(this._running=true,this._async(this.drain));};e.prototype._drain=function(){for(var g=0;g<this._queueLen;++g)this._queue[g].run(),this._queue[g]=void 0;this._queueLen=
  		0;this._running=false;for(g=0;g<this._afterQueueLen;++g)this._afterQueue[g].run(),this._afterQueue[g]=void 0;this._afterQueueLen=0;};return e});})(function(f){O.exports=f();});},{}],158:[function(z,O,A){(function(f){f(function(){function e(g){Error.call(this);this.message=g;this.name=e.name;"function"===typeof Error.captureStackTrace&&Error.captureStackTrace(this,e);}e.prototype=Object.create(Error.prototype);return e.prototype.constructor=e});})(function(f){O.exports=f();});},{}],159:[function(z,O,A){(function(f){f(function(){function e(a,
  		b){function d(m,r){if(0>m.i)return b(m.f,m.thisArg,m.params,r);a._handler(m.args[m.i]).fold(v,m,void 0,r);}function v(m,r,h){m.params[m.i]=r;--m.i;d(m,h);}2>arguments.length&&(b=g);return function(m,r,h){var l=a._defer(),k=h.length;d({f:m,thisArg:r,args:h,params:Array(k),i:k-1,call:b},l._handler);return l}}function g(a,b,d,v){try{v.resolve(a.apply(b,d));}catch(m){v.reject(m);}}e.tryCatchResolve=g;return e});})(function(f){O.exports=f();});},{}],160:[function(z,O,A){(function(f){f(function(e){var g=e("../state"),
  		a=e("../apply");return function(b){function d(w){var t;w instanceof b&&(t=w._handler.join());if(t&&0===t.state()||!t)return r(w).then(g.fulfilled,g.rejected);t._unreport();return g.inspect(t)}function v(w){return function(t,u,y){return m(w,void 0,[t,u,y])}}var m=a(b),r=b.resolve,h=b.all,l=Array.prototype.reduce,k=Array.prototype.reduceRight,n=Array.prototype.slice;b.any=function(w){function t(aa){I=null;this.resolve(aa);}function u(aa){this.resolved||(I.push(aa),0===--D&&this.reject(I));}for(var y=
  		b._defer(),x=y._handler,F=w.length>>>0,D=F,I=[],S,Z=0;Z<F;++Z)if(S=w[Z],void 0!==S||Z in w)if(S=b._handler(S),0<S.state()){x.become(S);b._visitRemaining(w,Z,S);break}else S.visit(x,t,u);else --D;0===D&&x.reject(new RangeError("any(): array must not be empty"));return y};b.some=function(w,t){function u(V){this.resolved||(D.push(V),0===--Z&&(I=null,this.resolve(D)));}function y(V){this.resolved||(I.push(V),0===--R&&(D=null,this.reject(I)));}var x=b._defer(),F=x._handler,D=[],I=[],S=w.length>>>0,Z=0,aa;
  		for(aa=0;aa<S;++aa){var P=w[aa];(void 0!==P||aa in w)&&++Z;}t=Math.max(t,0);var R=Z-t+1;Z=Math.min(t,Z);t>Z?F.reject(new RangeError("some(): array must contain at least "+t+" item(s), but had "+Z)):0===Z&&F.resolve(D);for(aa=0;aa<S;++aa)P=w[aa],(void 0!==P||aa in w)&&b._handler(P).visit(F,u,y,F.notify);return x};b.settle=function(w){return h(w.map(d))};b.map=function(w,t){return b._traverse(t,w)};b.filter=function(w,t){var u=n.call(w);return b._traverse(t,u).then(function(y){for(var x=y.length,F=Array(x),
  		D=0,I=0;D<x;++D)y[D]&&(F[I++]=b._handler(u[D]).value);F.length=I;return F})};b.reduce=function(w,t){return 2<arguments.length?l.call(w,v(t),arguments[2]):l.call(w,v(t))};b.reduceRight=function(w,t){return 2<arguments.length?k.call(w,v(t),arguments[2]):k.call(w,v(t))};b.prototype.spread=function(w){return this.then(h).then(function(t){return w.apply(this,t)})};return b}});})(function(f){O.exports=f(z);});},{"../apply":159,"../state":172}],161:[function(z,O,A){(function(f){f(function(){function e(){throw new TypeError("catch predicate must be a function");
  		}function g(a){return a}return function(a){function b(l,k){return function(n){return (k===Error||null!=k&&k.prototype instanceof Error?n instanceof k:k(n))?l.call(this,n):r(n)}}function d(l,k,n,w){l=l.call(k);return "object"!==typeof l&&"function"!==typeof l||null===l?n(w):v(l,n,w)}function v(l,k,n){return m(l).then(function(){return k(n)})}var m=a.resolve,r=a.reject,h=a.prototype["catch"];a.prototype.done=function(l,k){this._handler.visit(this._handler.receiver,l,k);};a.prototype["catch"]=a.prototype.otherwise=
  		function(l){return 2>arguments.length?h.call(this,l):"function"!==typeof l?this.ensure(e):h.call(this,b(arguments[1],l))};a.prototype["finally"]=a.prototype.ensure=function(l){return "function"!==typeof l?this:this.then(function(k){return d(l,this,g,k)},function(k){return d(l,this,r,k)})};a.prototype["else"]=a.prototype.orElse=function(l){return this.then(void 0,function(){return l})};a.prototype.yield=function(l){return this.then(function(){return l})};a.prototype.tap=function(l){return this.then(l).yield(this)};
  		return a}});})(function(f){O.exports=f();});},{}],162:[function(z,O,A){(function(f){f(function(){return function(e){e.prototype.fold=function(g,a){var b=this._beget();this._handler.fold(function(d,v,m){e._handler(d).fold(function(r,h,l){l.resolve(g.call(this,h,r));},v,this,m);},a,b._handler.receiver,b._handler);return b};return e}});})(function(f){O.exports=f();});},{}],163:[function(z,O,A){(function(f){f(function(e){var g=e("../state").inspect;return function(a){a.prototype.inspect=function(){return g(a._handler(this))};
  		return a}});})(function(f){O.exports=f(z);});},{"../state":172}],164:[function(z,O,A){(function(f){f(function(){return function(e){function g(b,d,v,m){function r(h,l){return a(v(h)).then(function(){return g(b,d,v,l)})}return a(m).then(function(h){return a(d(h)).then(function(l){return l?h:a(b(h)).spread(r)})})}var a=e.resolve;e.iterate=function(b,d,v,m){return g(function(r){return [r,b(r)]},d,v,m)};e.unfold=g;return e}});})(function(f){O.exports=f();});},{}],165:[function(z,O,A){(function(f){f(function(){return function(e){e.prototype.progress=
  		function(g){return this.then(void 0,void 0,g)};return e}});})(function(f){O.exports=f();});},{}],166:[function(z,O,A){(function(f){f(function(e){function g(d,v,m,r){return a.setTimer(function(){d(m,r,v);},v)}var a=e("../env"),b=e("../TimeoutError");return function(d){function v(h,l,k){g(m,h,l,k);}function m(h,l){l.resolve(h);}function r(h,l,k){h="undefined"===typeof h?new b("timed out after "+k+"ms"):h;l.reject(h);}d.prototype.delay=function(h){var l=this._beget();this._handler.fold(v,h,void 0,l._handler);
  		return l};d.prototype.timeout=function(h,l){var k=this._beget(),n=k._handler,w=g(r,h,l,k._handler);this._handler.visit(n,function(t){a.clearTimer(w);this.resolve(t);},function(t){a.clearTimer(w);this.reject(t);},n.notify);return k};return d}});})(function(f){O.exports=f(z);});},{"../TimeoutError":158,"../env":169}],167:[function(z,O,A){(function(f){f(function(e){function g(v){throw v;}function a(){}var b=e("../env").setTimer,d=e("../format");return function(v){function m(x){x.handled||(u.push(x),k("Potentially unhandled rejection ["+
  		x.id+"] "+d.formatError(x.value)));}function r(x){var F=u.indexOf(x);0<=F&&(u.splice(F,1),n("Handled previous rejection ["+x.id+"] "+d.formatObject(x.value)));}function h(x,F){t.push(x,F);null===y&&(y=b(l,0));}function l(){for(y=null;0<t.length;)t.shift()(t.shift());}var k=a,n=a;if("undefined"!==typeof console){var w=console;k="undefined"!==typeof w.error?function(x){w.error(x);}:function(x){w.log(x);};n="undefined"!==typeof w.info?function(x){w.info(x);}:function(x){w.log(x);};}v.onPotentiallyUnhandledRejection=
  		function(x){h(m,x);};v.onPotentiallyUnhandledRejectionHandled=function(x){h(r,x);};v.onFatalRejection=function(x){h(g,x.value);};var t=[],u=[],y=null;return v}});})(function(f){O.exports=f(z);});},{"../env":169,"../format":170}],168:[function(z,O,A){(function(f){f(function(){return function(e){e.prototype["with"]=e.prototype.withThis=function(g){var a=this._beget(),b=a._handler;b.receiver=g;this._handler.chain(b,g);return a};return e}});})(function(f){O.exports=f();});},{}],169:[function(z,O,A){(function(f){(function(){(function(e){e(function(g){function a(l){var k,
  		n=document.createTextNode("");(new l(function(){var t=k;k=void 0;t();})).observe(n,{characterData:true});var w=0;return function(t){k=t;n.data=w^=1;}}var b,d="undefined"!==typeof setTimeout&&setTimeout,v=function(l,k){return setTimeout(l,k)},m=function(l){return clearTimeout(l)},r=function(l){return d(l,0)};if("undefined"!==typeof f&&"[object process]"===Object.prototype.toString.call(f))r=function(l){return f.nextTick(l)};else if(b="undefined"!==typeof MutationObserver&&MutationObserver||"undefined"!==
  		typeof WebKitMutationObserver&&WebKitMutationObserver)r=a(b);else if(!d){var h=g("vertx");v=function(l,k){return h.setTimer(k,l)};m=h.cancelTimer;r=h.runOnLoop||h.runOnContext;}return {setTimer:v,clearTimer:m,asap:r}});})(function(e){O.exports=e(z);});}).call(this);}).call(this,z("_process"));},{_process:133}],170:[function(z,O,A){(function(f){f(function(){function e(a){var b=String(a);"[object Object]"===b&&"undefined"!==typeof JSON&&(b=g(a,b));return b}function g(a,b){try{return JSON.stringify(a)}catch(d){return b}}
  		return {formatError:function(a){var b="object"===typeof a&&null!==a&&(a.stack||a.message)?a.stack||a.message:e(a);return a instanceof Error?b:b+" (WARNING: non-Error used)"},formatObject:e,tryStringify:g}});})(function(f){O.exports=f();});},{}],171:[function(z,O,A){(function(f){(function(){(function(e){e(function(){return function(g){function a(Q,L){this._handler=Q===n?L:b(Q);}function b(Q){function L(ta){oa.resolve(ta);}function M(ta){oa.reject(ta);}function Y(ta){oa.notify(ta);}var oa=new t;try{Q(L,M,Y);}catch(ta){M(ta);}return oa}
  		function d(Q){return Q instanceof a?Q:new a(n,new u(l(Q)))}function v(Q){return new a(n,new u(new F(Q)))}function m(Q,L,M){function Y(da,ea,la){la.resolved||r(M,oa,da,Q(L,ea,da),la);}function oa(da,ea,la){ua[da]=ea;0===--Ua&&la.become(new x(ua));}for(var ta="function"===typeof L?Y:oa,sa=new t,Ua=M.length>>>0,ua=Array(Ua),Za=0,$a;Za<M.length&&!sa.resolved;++Za)$a=M[Za],void 0!==$a||Za in M?r(M,ta,Za,$a,sa):--Ua;0===Ua&&sa.become(new x(ua));return new a(n,sa)}function r(Q,L,M,Y,oa){if(V(Y)){Y=Y instanceof
  		a?Y._handler.join():k(Y);var ta=Y.state();0===ta?Y.fold(L,M,void 0,oa):0<ta?L(M,Y.value,oa):(oa.become(Y),h(Q,M+1,Y));}else L(M,Y,oa);}function h(Q,L,M){for(;L<Q.length;++L){var Y=l(Q[L]);if(Y!==M){var oa=Y.state();0===oa?Y.visit(Y,void 0,Y._unreport):0>oa&&Y._unreport();}}}function l(Q){return Q instanceof a?Q._handler.join():V(Q)?k(Q):new x(Q)}function k(Q){try{var L=Q.then;return "function"===typeof L?new y(L,Q):new x(Q)}catch(M){return new F(M)}}function n(){}function w(){}function t(Q,L){a.createContext(this,
  		L);this.consumers=void 0;this.receiver=Q;this.handler=void 0;this.resolved=false;}function u(Q){this.handler=Q;}function y(Q,L){t.call(this);B.enqueue(new aa(Q,L,this));}function x(Q){a.createContext(this);this.value=Q;}function F(Q){a.createContext(this);this.id=++X;this.value=Q;this.reported=this.handled=false;this._report();}function D(Q,L){this.rejection=Q;this.context=L;}function I(Q){this.rejection=Q;}function S(Q,L){this.continuation=Q;this.handler=L;}function Z(Q,L){this.handler=L;this.value=Q;}function aa(Q,
  		L,M){this._then=Q;this.thenable=L;this.resolver=M;}function P(Q,L,M,Y,oa){try{Q.call(L,M,Y,oa);}catch(ta){Y(ta);}}function R(Q,L,M,Y){this.f=Q;this.z=L;this.c=M;this.to=Y;this.resolver=ia;this.receiver=this;}function V(Q){return ("object"===typeof Q||"function"===typeof Q)&&null!==Q}function G(Q,L,M,Y){if("function"!==typeof Q)return Y.become(L);a.enterContext(L);try{Y.become(l(Q.call(M,L.value)));}catch(oa){Y.become(new F(oa));}a.exitContext();}function K(Q,L,M){try{return Q(L,M)}catch(Y){return v(Y)}}function J(Q,
  		L){L.prototype=T(Q.prototype);L.prototype.constructor=L;}function c(Q,L){return L}function p(){}var B=g.scheduler,H=function(){if("undefined"!==typeof f&&null!==f&&"function"===typeof f.emit)var Q=function(L,M){return "unhandledRejection"===L?f.emit(L,M.value,M):f.emit(L,M)};else {if(Q="undefined"!==typeof self)a:{if("function"===typeof CustomEvent)try{Q=new CustomEvent("unhandledRejection")instanceof CustomEvent;break a}catch(L){}Q=false;}if(Q)Q=function(L,M){return function(Y,oa){Y=new M(Y,{detail:{reason:oa.value,
  		key:oa},bubbles:false,cancelable:true});return !L.dispatchEvent(Y)}}(self,CustomEvent);else {if(Q="undefined"!==typeof self)a:{if("undefined"!==typeof document&&"function"===typeof document.createEvent)try{document.createEvent("CustomEvent").initCustomEvent("eventType",!1,!0,{});Q=!0;break a}catch(L){}Q=false;}Q=Q?function(L,M){return function(Y,oa){var ta=M.createEvent("CustomEvent");ta.initCustomEvent(Y,false,true,{reason:oa.value,key:oa});return !L.dispatchEvent(ta)}}(self,document):p;}}return Q}(),T=Object.create||
  		function(Q){function L(){}L.prototype=Q;return new L};a.resolve=d;a.reject=v;a.never=function(){return ba};a._defer=function(){return new a(n,new t)};a._handler=l;a.prototype.then=function(Q,L,M){var Y=this._handler,oa=Y.join().state();if("function"!==typeof Q&&0<oa||"function"!==typeof L&&0>oa)return new this.constructor(n,Y);oa=this._beget();Y.chain(oa._handler,Y.receiver,Q,L,M);return oa};a.prototype["catch"]=function(Q){return this.then(void 0,Q)};a.prototype._beget=function(){var Q=this._handler,
  		L=this.constructor;Q=new t(Q.receiver,Q.join().context);return new L(n,Q)};a.all=function(Q){return m(c,null,Q)};a.race=function(Q){if("object"!==typeof Q||null===Q)return v(new TypeError("non-iterable passed to race()"));if(0===Q.length)Q=ba;else if(1===Q.length)Q=d(Q[0]);else {var L=new t,M;for(M=0;M<Q.length;++M){var Y=Q[M];if(void 0!==Y||M in Q)if(Y=l(Y),0!==Y.state()){L.become(Y);h(Q,M+1,Y);break}else Y.visit(L,L.resolve,L.reject);}Q=new a(n,L);}return Q};a._traverse=function(Q,L){return m(K,Q,
  		L)};a._visitRemaining=h;n.prototype.when=n.prototype.become=n.prototype.notify=n.prototype.fail=n.prototype._unreport=n.prototype._report=p;n.prototype._state=0;n.prototype.state=function(){return this._state};n.prototype.join=function(){for(var Q=this;void 0!==Q.handler;)Q=Q.handler;return Q};n.prototype.chain=function(Q,L,M,Y,oa){this.when({resolver:Q,receiver:L,fulfilled:M,rejected:Y,progress:oa});};n.prototype.visit=function(Q,L,M,Y){this.chain(ia,Q,L,M,Y);};n.prototype.fold=function(Q,L,M,Y){this.when(new R(Q,
  		L,M,Y));};J(n,w);w.prototype.become=function(Q){Q.fail();};var ia=new w;J(n,t);t.prototype._state=0;t.prototype.resolve=function(Q){this.become(l(Q));};t.prototype.reject=function(Q){this.resolved||this.become(new F(Q));};t.prototype.join=function(){if(!this.resolved)return this;for(var Q=this;void 0!==Q.handler;)if(Q=Q.handler,Q===this)return this.handler=new F(new TypeError("Promise cycle"));return Q};t.prototype.run=function(){var Q=this.consumers,L=this.handler;this.handler=this.handler.join();this.consumers=
  		void 0;for(var M=0;M<Q.length;++M)L.when(Q[M]);};t.prototype.become=function(Q){this.resolved||(this.resolved=true,this.handler=Q,void 0!==this.consumers&&B.enqueue(this),void 0!==this.context&&Q._report(this.context));};t.prototype.when=function(Q){this.resolved?B.enqueue(new S(Q,this.handler)):void 0===this.consumers?this.consumers=[Q]:this.consumers.push(Q);};t.prototype.notify=function(Q){this.resolved||B.enqueue(new Z(Q,this));};t.prototype.fail=function(Q){Q="undefined"===typeof Q?this.context:Q;
  		this.resolved&&this.handler.join().fail(Q);};t.prototype._report=function(Q){this.resolved&&this.handler.join()._report(Q);};t.prototype._unreport=function(){this.resolved&&this.handler.join()._unreport();};J(n,u);u.prototype.when=function(Q){B.enqueue(new S(Q,this));};u.prototype._report=function(Q){this.join()._report(Q);};u.prototype._unreport=function(){this.join()._unreport();};J(t,y);J(n,x);x.prototype._state=1;x.prototype.fold=function(Q,L,M,Y){if("function"!==typeof Q)Y.become(this);else {a.enterContext(this);
  		try{Q.call(M,L,this.value,Y);}catch(oa){Y.become(new F(oa));}a.exitContext();}};x.prototype.when=function(Q){G(Q.fulfilled,this,Q.receiver,Q.resolver);};var X=0;J(n,F);F.prototype._state=-1;F.prototype.fold=function(Q,L,M,Y){Y.become(this);};F.prototype.when=function(Q){"function"===typeof Q.rejected&&this._unreport();G(Q.rejected,this,Q.receiver,Q.resolver);};F.prototype._report=function(Q){B.afterQueue(new D(this,Q));};F.prototype._unreport=function(){this.handled||(this.handled=true,B.afterQueue(new I(this)));};
  		F.prototype.fail=function(Q){this.reported=true;H("unhandledRejection",this);a.onFatalRejection(this,void 0===Q?this.context:Q);};D.prototype.run=function(){this.rejection.handled||this.rejection.reported||(this.rejection.reported=true,H("unhandledRejection",this.rejection)||a.onPotentiallyUnhandledRejection(this.rejection,this.context));};I.prototype.run=function(){this.rejection.reported&&(H("rejectionHandled",this.rejection)||a.onPotentiallyUnhandledRejectionHandled(this.rejection));};a.createContext=
  		a.enterContext=a.exitContext=a.onPotentiallyUnhandledRejection=a.onPotentiallyUnhandledRejectionHandled=a.onFatalRejection=p;g=new n;var ba=new a(n,g);S.prototype.run=function(){this.handler.join().when(this.continuation);};Z.prototype.run=function(){var Q=this.handler.consumers;if(void 0!==Q)for(var L,M=0;M<Q.length;++M){L=Q[M];var Y=L.progress,oa=this.value,ta=this.handler,sa=L.receiver;L=L.resolver;if("function"!==typeof Y)L.notify(oa);else {a.enterContext(ta);ta=L;try{ta.notify(Y.call(sa,oa));}catch(Ua){ta.notify(Ua);}a.exitContext();}}};
  		aa.prototype.run=function(){var Q=this.resolver;P(this._then,this.thenable,function(L){Q.resolve(L);},function(L){Q.reject(L);},function(L){Q.notify(L);});};R.prototype.fulfilled=function(Q){this.f.call(this.c,this.z,Q,this.to);};R.prototype.rejected=function(Q){this.to.reject(Q);};R.prototype.progress=function(Q){this.to.notify(Q);};return a}});})(function(e){O.exports=e();});}).call(this);}).call(this,z("_process"));},{_process:133}],172:[function(z,O,A){(function(f){f(function(){function e(){return {state:"pending"}}
  		function g(b){return {state:"rejected",reason:b}}function a(b){return {state:"fulfilled",value:b}}return {pending:e,fulfilled:a,rejected:g,inspect:function(b){var d=b.state();return 0===d?e():0<d?a(b.value):g(b.value)}}});})(function(f){O.exports=f();});},{}],173:[function(z,O,A){(function(f){f(function(e){var g=e("./monitor/PromiseMonitor");e=e("./monitor/ConsoleReporter");var a=new g(new e);return function(b){return a.monitor(b)}});})(function(f){O.exports=f(z);});},{"./monitor/ConsoleReporter":174,"./monitor/PromiseMonitor":175}],
  		174:[function(z,O,A){(function(f){f(function(e){function g(){this._previouslyReported=false;}function a(){}var b=e("./error");g.prototype=function(){var d;if("undefined"===typeof console)var v=d=a;else {var m=console;if("function"===typeof m.error&&"function"===typeof m.dir){if(d=function(l){m.error(l);},v=function(l){m.log(l);},"function"===typeof m.groupCollapsed){var r=function(l){m.groupCollapsed(l);};var h=function(){m.groupEnd();};}}else v="undefined"!==typeof m.log&&"undefined"!==typeof JSON?d=function(l){if("string"!==
  		typeof l)try{l=JSON.stringify(l);}catch(k){}m.log(l);}:d=a;}return {msg:v,warn:d,groupStart:r||d,groupEnd:h||a}}();g.prototype.log=function(d){if(0===d.length)this._previouslyReported&&(this._previouslyReported=false,this.msg("[promises] All previously unhandled rejections have now been handled"));else {this._previouslyReported=true;this.groupStart("[promises] Unhandled rejections: "+d.length);try{this._log(d);}finally{this.groupEnd();}}};g.prototype._log=function(d){for(var v=0;v<d.length;++v)this.warn(b.format(d[v]));};
  		return g});})(function(f){O.exports=f(z);});},{"./error":177}],175:[function(z,O,A){(function(f){f(function(e){function g(h){this.logDelay=0;this.stackFilter=d;this.stackJumpSeparator="from execution context:";this.filterDuplicateFrames=true;this._reporter=h;"function"===typeof h.configurePromiseMonitor&&h.configurePromiseMonitor(this);this._traces=[];this._traceTask=0;var l=this;this._doLogTraces=function(){l._logTraces();};}function a(h,l){return l.filter(function(k){return !h.test(k)})}function b(h){return !h.handler.handled}
  		var d=/[\s\(\/\\](node|module|timers)\.js:|when([\/\\]{1,2}(lib|monitor|es6-shim)[\/\\]{1,2}|\.js)|(new\sPromise)\b|(\b(PromiseMonitor|ConsoleReporter|Scheduler|RunHandlerTask|ProgressTask|Promise|.*Handler)\.[\w_]\w\w+\b)|\b(tryCatch\w+|getHandler\w*)\b/i,v=e("../lib/env").setTimer,m=e("./error"),r=[];g.prototype.monitor=function(h){var l=this;h.createContext=function(k,n){k.context=l.createContext(k,n);};h.enterContext=function(k){r.push(k.context);};h.exitContext=function(){r.pop();};h.onPotentiallyUnhandledRejection=
  		function(k,n){return l.addTrace(k,n)};h.onPotentiallyUnhandledRejectionHandled=function(k){return l.removeTrace(k)};h.onFatalRejection=function(k,n){return l.fatal(k,n)};return this};g.prototype.createContext=function(h,l){l={parent:l||r[r.length-1],stack:void 0};m.captureStack(l,h.constructor);return l};g.prototype.addTrace=function(h,l){var k;for(k=this._traces.length-1;0<=k;--k){var n=this._traces[k];if(n.handler===h)break}0<=k?n.extraContext=l:this._traces.push({handler:h,extraContext:l});this.logTraces();};
  		g.prototype.removeTrace=function(){this.logTraces();};g.prototype.fatal=function(h,l){var k=Error();k.stack=this._createLongTrace(h.value,h.context,l).join("\n");v(function(){throw k;},0);};g.prototype.logTraces=function(){this._traceTask||(this._traceTask=v(this._doLogTraces,this.logDelay));};g.prototype._logTraces=function(){this._traceTask=void 0;this._traces=this._traces.filter(b);this._reporter.log(this.formatTraces(this._traces));};g.prototype.formatTraces=function(h){return h.map(function(l){return this._createLongTrace(l.handler.value,
  		l.handler.context,l.extraContext)},this)};g.prototype._createLongTrace=function(h,l,k){h=m.parse(h)||[String(h)+" (WARNING: non-Error used)"];h=a(this.stackFilter,h);this._appendContext(h,l);this._appendContext(h,k);return this.filterDuplicateFrames?this._removeDuplicates(h):h};g.prototype._removeDuplicates=function(h){var l={},k=this.stackJumpSeparator,n=0;return h.reduceRight(function(w,t,u){0===u?w.unshift(t):t===k?0<n&&(w.unshift(t),n=0):l[t]||(l[t]=true,w.unshift(t),++n);return w},[])};g.prototype._appendContext=
  		function(h,l){h.push.apply(h,this._createTrace(l));};g.prototype._createTrace=function(h){for(var l=[],k;h;){if(k=m.parse(h)){k=a(this.stackFilter,k);var n=l;1<k.length&&(k[0]=this.stackJumpSeparator,n.push.apply(n,k));}h=h.parent;}return l};return g});})(function(f){O.exports=f(z);});},{"../lib/env":169,"./error":177}],176:[function(z,O,A){(function(f){f(function(e){var g=e("../monitor");e=e("../when").Promise;return g(e)});})(function(f){O.exports=f(z);});},{"../monitor":173,"../when":178}],177:[function(z,
  		O,A){(function(f){f(function(){function e(h){try{throw Error();}catch(l){h.stack=l.stack;}}function g(h){h.stack=Error().stack;}function a(h){return d(h)}function b(h){var l=Error();l.stack=d(h);return l}function d(h){for(var l=false,k="",n=0;n<h.length;++n)l?k+="\n"+h[n]:(k+=h[n],l=true);return k}if(Error.captureStackTrace){var v=function(h){return h&&h.stack&&h.stack.split("\n")};var m=a;var r=Error.captureStackTrace;}else v=function(h){var l=h&&h.stack&&h.stack.split("\n");l&&h.message&&l.unshift(h.message);
  		return l},"string"!==typeof Error().stack?(m=a,r=e):(m=b,r=g);return {parse:v,format:m,captureStack:r}});})(function(f){O.exports=f();});},{}],178:[function(z,O,A){(function(f){f(function(e){function g(F,D,I,S){var Z=y.resolve(F);return 2>arguments.length?Z:Z.then(D,I,S)}function a(F){return function(){for(var D=0,I=arguments.length,S=Array(I);D<I;++D)S[D]=arguments[D];return x(F,this,S)}}function b(F){for(var D=0,I=arguments.length-1,S=Array(I);D<I;++D)S[D]=arguments[D+1];return x(F,this,S)}function d(){function F(Z){S._handler.resolve(Z);}
  		function D(Z){S._handler.reject(Z);}function I(Z){S._handler.notify(Z);}var S=y._defer();this.promise=S;this.resolve=F;this.reject=D;this.notify=I;this.resolver={resolve:F,reject:D,notify:I};}var v=e("./lib/decorators/timed"),m=e("./lib/decorators/array"),r=e("./lib/decorators/flow"),h=e("./lib/decorators/fold"),l=e("./lib/decorators/inspect"),k=e("./lib/decorators/iterate"),n=e("./lib/decorators/progress"),w=e("./lib/decorators/with"),t=e("./lib/decorators/unhandledRejection"),u=e("./lib/TimeoutError"),
  		y=[m,r,h,k,n,l,w,v,t].reduce(function(F,D){return D(F)},e("./lib/Promise")),x=e("./lib/apply")(y);g.promise=function(F){return new y(F)};g.resolve=y.resolve;g.reject=y.reject;g.lift=a;g["try"]=b;g.attempt=b;g.iterate=y.iterate;g.unfold=y.unfold;g.join=function(){return y.all(arguments)};g.all=function(F){return g(F,y.all)};g.settle=function(F){return g(F,y.settle)};g.any=a(y.any);g.some=a(y.some);g.race=a(y.race);g.map=function(F,D){return g(F,function(I){return y.map(I,D)})};g.filter=function(F,
  		D){return g(F,function(I){return y.filter(I,D)})};g.reduce=a(y.reduce);g.reduceRight=a(y.reduceRight);g.isPromiseLike=function(F){return F&&"function"===typeof F.then};g.Promise=y;g.defer=function(){return new d};g.TimeoutError=u;return g});})(function(f){O.exports=f(z);});},{"./lib/Promise":156,"./lib/TimeoutError":158,"./lib/apply":159,"./lib/decorators/array":160,"./lib/decorators/flow":161,"./lib/decorators/fold":162,"./lib/decorators/inspect":163,"./lib/decorators/iterate":164,"./lib/decorators/progress":165,
  		"./lib/decorators/timed":166,"./lib/decorators/unhandledRejection":167,"./lib/decorators/with":168}],179:[function(z,O,A){(function(f){(function(){var e=z("for-each"),g=z("available-typed-arrays"),a=z("call-bind/callBound"),b=a("Object.prototype.toString"),d=z("has-tostringtag/shams")(),v="undefined"===typeof globalThis?f:globalThis;g=g();var m=a("String.prototype.slice"),r={},h=z("es-abstract/helpers/getOwnPropertyDescriptor"),l=Object.getPrototypeOf;d&&h&&l&&e(g,function(w){if("function"===typeof v[w]){var t=
  		new v[w];if(Symbol.toStringTag in t){t=l(t);var u=h(t,Symbol.toStringTag);u||(t=l(t),u=h(t,Symbol.toStringTag));r[w]=u.get;}}});var k=function(w){var t=false;e(r,function(u,y){if(!t)try{var x=u.call(w);x===y&&(t=x);}catch(F){}});return t},n=z("is-typed-array");O.exports=function(w){return n(w)?d&&Symbol.toStringTag in w?k(w):m(b(w),8,-1):false};}).call(this);}).call(this,"undefined"!==typeof commonjsGlobal?commonjsGlobal:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{});},{"available-typed-arrays":25,"call-bind/callBound":46,
  		"es-abstract/helpers/getOwnPropertyDescriptor":94,"for-each":96,"has-tostringtag/shams":102,"is-typed-array":109}],180:[function(z,O,A){O.exports={name:"autobahn",version:"22.11.1",description:"An implementation of The Web Application Messaging Protocol (WAMP).",main:"index.js",files:["index.js","/lib"],scripts:{test:"nodeunit test/test.js"},engines:{node:">= 7.10.1"},dependencies:{cbor:">= 3.0.0","crypto-js":">=3.1.8",msgpack5:">= 3.6.0",tweetnacl:">= 0.14.3",ws:"1.1.4 - 7"},optionalDependencies:{bufferutil:">= 1.2.1",
  		"utf-8-validate":">= 1.2.1",when:">= 3.7.7"},devDependencies:{browserify:">= 13.1.1","deep-equal":">= 1.0.1","google-closure-compiler":">= 20170218.0.0",nodeunit:">= 0.11.3","random-bytes-seed":">=1.0.3"},browser:{ws:false,"./lib/transport/rawsocket.js":false},repository:{type:"git",url:"git://github.com/crossbario/autobahn-js.git"},keywords:"WAMP WebSocket RPC PubSub ethereum solidity xbr crossbar autobahn wamp data-service data-monetization".split(" "),author:"Crossbar.io Technologies GmbH",license:"MIT"};},
  		{}]},{},[4])(4)}); 
  	} (autobahn_min));
  	return autobahn_min.exports;
  }

  var autobahn_minExports = requireAutobahn_min();
  var autobahn = /*@__PURE__*/getDefaultExportFromCjs(autobahn_minExports);

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
    var connection = new autobahn.Connection({
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

  var config = new Config({
    theme: 'auto',
    url: 'ws://127.0.0.1:9090/',
    realm: 'debug',
    fontSize: '1em',
    linkFiles: false,
    linkFilesTemplate: 'subl://open?url=file://%file&line=%line'
  }, 'debugWampClient');

  initWamp();
  var xdebug = initXdebug();

  $$1(function () {
    var hasConnected = false;
    var $root = $$1('#debug-cards');

    init(config);
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
            '<button type="button" class="btn-close" data-dismiss="alert" aria-label="Close"></button>' +
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

})(window.jQuery);
