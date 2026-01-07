import $ from 'zest' // external global
import { updateCssProperty } from './Css.js'

export function init (config) {
  $('#link-files').on('change', function () {
    var isChecked = $(this).prop('checked')
    var $templateGroup = $('#link-files-template').closest('.form-group')
    isChecked
      ? $templateGroup.slideDown()
      : $templateGroup.slideUp()
  }).trigger('change')

  $('#modal-settings').on('submit', function (e) {
    e.preventDefault()
    config.set({
      theme: $('#theme').val(),
      url: $('#wsUrl').val(),
      realm: $('#realm').val(),
      fontSize: $('#font-size').val(),
      linkFiles: $('#link-files').prop('checked'),
      linkFilesTemplate: $('#link-files-template').val(),
    })
    $(this).modal('hide')
  })

  $('#modal-settings').on('hide.bs.modal', function (e) {
    updateCssProperty('wampClientCss', '#debug-cards', 'font-size', config.get('fontSize'))
  })

  $('#modal-settings').on('show.bs.modal', function (e) {
    $('#theme').val(config.get('theme')).trigger('change')
    $('#wsUrl').val(config.get('url'))
    $('#realm').val(config.get('realm'))
    $('#font-size').val(config.get('fontSize'))
    $('#link-files').prop('checked', config.get('linkFiles')).trigger('change')
    $('#link-files-template').val(config.get('linkFilesTemplate'))
  })

  $('#theme-options').on('click', 'button', function () {
    $('#theme').val($(this).val()).trigger('change')
  })

  $('#theme').on('change', function (e) {
    var val = $(this).val()
    var $icon
    $('#theme-options .dropdown-item').each(function () {
      var isOption = $(this).val() === val
      $(this).toggleClass('active', isOption)
      if (isOption) {
        $icon = $(this).find('i').clone()
      }
    })
    $('#theme-options').prev().find('i').remove()
    $('#theme-options').prev().prepend($icon)
  })
}
