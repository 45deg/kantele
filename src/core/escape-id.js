export default function escapeId(id){
  var alternatives = {
    '!': '$excl',
    '$': '$dollar',
    '%': '$percent',
    '&': '$amp',
    '*': '$ast',
    '+': '$plus',
    '-': '$minus',
    '.': '$dot',
    '/': '$slash',
    '<': '$lt',
    '=': '$eq',
    '>': '$gt',
    '?': '$q',
    '@': '$at',
    '^': '$caret',
  };
  var escaped = '';
  for(let c of id){
    if(alternatives[c] !== undefined) {
      escaped += alternatives[c];
    } else {
      escaped += c;
    }
  }
  return escaped;
}