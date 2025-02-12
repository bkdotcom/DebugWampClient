import $ from 'jquery' // external global

var $table

export function Table (dump) {
  this.dump = dump
}

Table.prototype.build = function (rows, meta, onBuildRow, info) {
  // console.warn('Table.build', meta, classname)
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
  }
  meta.tableInfo = $.extend(metaDefault.tableInfo, meta.tableInfo)
  meta = $.extend(metaDefault, meta)
  if (meta.caption === null) {
    meta.caption = ''
  }
  $table = $('<table>' +
    (meta.caption.length ? '<caption>' + meta.caption.escapeHtml() + '</caption>' : '')+
    '<thead><tr><th>&nbsp;</th></tr></thead>' +
    '<tbody></tbody>' +
    '</table>'
  )
    .addClass(meta.attribs.class.join(' '))
  this.buildHeader(meta.tableInfo)
  this.buildBody(rows, meta.tableInfo, onBuildRow, info)
  this.buildFooter(meta.tableInfo)
  return $table
}

Table.prototype.buildBody = function (rows, tableInfo, onBuildRow, info) {
  var i
  var length
  var i2
  var length2
  var parsed
  var rowKeys = rows.__debug_key_order__ || Object.keys(rows)
  var rowKey
  var key
  var row
  var rowInfo
  var $tbody = $table.find('> tbody')
  var $tr
  delete rows.__debug_key_order__
  for (i = 0, length = rowKeys.length; i < length; i++) {
    rowKey = rowKeys[i]
    row = rows[rowKey]
    rowInfo = $.extend(
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
    )
    if (rowInfo.key) {
      rowKey = rowInfo.key
    }
    // using for in, so every key will be a string
    //  check if actually an integer
    if (typeof rowKey === 'string' && rowKey.match(/^\d+$/) && Number.isSafeInteger(rowKey)) {
      rowKey = parseInt(rowKey, 10)
    }
    parsed = this.dump.parseTag(this.dump.dump(rowKey, {
      requestInfo: info,
    }))
    $tr = $('<tr></tr>', rowInfo.attribs || {})
      .append(
        $('<th scope="row" class="t_key text-right"></th>')
          .addClass(/^\d+$/.test(rowKey) ? 't_int' : parsed.attribs.class.join(' '))
          .html(parsed.innerhtml)
      )

    if (tableInfo.haveObjRow) {
      $tr.append(
        rowInfo.class
          ? $(this.dump.markupIdentifier(rowInfo.class, 'classname', 'td'))
            .attr('title', rowInfo.summary)
          : '<td class="t_undefined"></td>'
      )
    }
    for (i2 = 0, length2 = tableInfo.columns.length; i2 < length2; i2++) {
      key = tableInfo.columns[i2].key
      /*
      parsed = this.dump.parseTag(this.dump.dump(row[key], true))
      parsed.attribs.class = parsed.attribs.class.join(' ')
      $tr.append(
        $('<td />').html(parsed.innerhtml).attr(parsed.attribs)
      )
      */
      $tr.append(this.dump.dump(row[key], {
        requestInfo: info,
        tagName: 'td'
      }))
    }

    for (i2 = 0, length2 = onBuildRow.length; i2 < length2; i2++) {
      $tr = onBuildRow[i2]($tr, row, rowInfo, rowKey)
    }
    $tbody.append($tr)
  }
}

/*
  Add totals (tfoot)
*/
Table.prototype.buildFooter = function (tableInfo) {
  var cells = []
  var colHasTotal
  var haveTotal = false
  var i
  var info
  var length = tableInfo.columns.length
  for (i = 0; i < length; i++) {
    info = tableInfo.columns[i]
    colHasTotal = typeof info.total !== 'undefined'
    haveTotal = haveTotal || colHasTotal
    if (colHasTotal) {
      info.total = parseFloat(info.total.toFixed(6), 10)
      cells.push(this.dump.dump(info.total, { tagName: 'td' }))
      continue
    }
    cells.push('<td></td>')
  }
  if (haveTotal) {
    $table.append('<tfoot>' +
      '<tr><td>&nbsp;</td>' +
        (tableInfo.haveObjRow ? '<td>&nbsp;</td>' : '') +
        cells.join('') +
      '</tr>' +
      '</tfoot>'
    )
  }
}

Table.prototype.buildHeader = function (tableInfo) {
  var i
  var info
  var label
  var length = tableInfo.columns.length
  var $theadTr = $table.find('thead tr')
  if (tableInfo.haveObjRow) {
    $theadTr.append('<th>&nbsp;</th>')
  }
  for (i = 0; i < length; i++) {
    info = tableInfo.columns[i]
    label = info.key
    if (typeof info.class !== 'undefined') {
      label += ' ' + this.dump.markupIdentifier(info.class, 'classname')
    }
    $theadTr.append(
      $('<th scope="col"></th>').html(label)
    )
  }
}
