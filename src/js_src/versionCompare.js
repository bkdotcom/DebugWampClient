export function versionCompare (v1, v2) {
  var v1parts = v1.split('.')
  var v2parts = v2.split('.')
  var withAlpha = false
  var zeroExtend = true

  function isValidPart(x) {
    return (withAlpha ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x)
  }

  if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
    return NaN
  }

  if (zeroExtend) {
    while (v1parts.length < v2parts.length) {
      v1parts.push('0')
    }
    while (v2parts.length < v1parts.length) {
      v2parts.push('0')
    }
  }

  if (!withAlpha) {
    v1parts = v1parts.map(Number)
    v2parts = v2parts.map(Number)
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
