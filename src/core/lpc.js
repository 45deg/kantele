/*
 * Lightweight Parser Combinator
 *  (inspired by parsimmon.js)
 * */

function makeSuccess(position, value, type='unknown'){
  return {
    status : true,
    position : position,
    value  : value,
    expected : null,
    type : type,
  };
}

function makeFailure(position, expected, type='unknown'){
  return {
    status : false,
    position : position,
    value  : null,
    expected : expected,
    type : type,
  };
}

export function token(str){
  var len = str.length;
  return function(input, pos){
    var head = input.slice(pos, pos + len);
    if(head === str) {
      return makeSuccess(pos + len, str);
    } else {
      return makeFailure(pos, str);
    }
  }
}

export function regex(re) {
  var regexp = new RegExp('^' + re.source);
  return function(input, pos){
    var result = regexp.exec(input.slice(pos));
    if(result) {
      var matched = result[0];
      return makeSuccess(pos + matched.length, matched);
    } else {
      return makeFailure(pos, regexp.source);
    }
  }
}

export function seq(...elements){
  return function(input, pos){
    var results = [];
    var current = pos;
    for(let element of elements){
      var result = element(input, current);
      if(result.status) { // parse succeeded
        current = result.position;
        results.push(result);
      } else { // parse failed
        return makeFailure(result.position, result, 'sequence');
      }
    }
    return makeSuccess(current, results, 'sequence');
  };
}

export function tag(tagName, element){
  return function(input, pos){
    var result = element(input, pos);
    result.type = tagName;
    return result;
  };
}

export function or(...elements){
  return function(input, pos){
    var result;
    var expected;
    var failurePos = pos;
    for(let element of elements){
      result = element(input, pos);
      if(result.status) { // parse succeeded
        return makeSuccess(result.position, result);
      } else {
        if(result.position >= failurePos) {
          failurePos = result.position;
          expected = { type: result.type, value: result.expected };
        }
      }
    }
    return makeFailure(failurePos, expected);
  };
}

export function atLeast(times, element){
  return function(input, pos){
    var results = [];
    var current = pos;
    var count = 0;
    for(;;) {
      var result = element(input, current);
      if(result.status) { // parse succeeded
        current = result.position;
        results.push(result);
      } else { // parse failed
        if(count < times) { // Cond. unsatisfied
          return makeFailure(result.position, result.expected, 'repetition');
        } else {
          break;
        }
      }
      count++;
    }
    return makeSuccess(current, results, 'repetition');
  };
}

export const many = atLeast.bind(null, 0);
export const oneMore = atLeast.bind(null, 1);

export function option(element){
  return function(input, pos){
    var result = element(input, pos);
    if(result.status) { // parse succeeded
      return makeSuccess(result.position, result, 'option');
    } else { // parse failed
      return makeSuccess(pos, null, 'option');
    }
  };
}

export function filter(element, pred){
  return function(input, pos){
    var result = element(input, pos);
    if(result.status) {
      if(!pred(result.value)) {
        result.status = false;
        result.value = null;
        result.position = pos;
      }
    }
    return result;
  };
}

export function map(element, func){
  return function(input, pos){
    var result = element(input, pos);
    if(result.status) {
      result.value = func(result.value);
    }
    return result;
  };
}

export function lazy(func){
  var parse = null;
  return function(input, pos){
    if(parse === null) {
      parse = func();
    }
    return parse(input, pos);
  };
}

export function repeatToEof(element, ignoreSpace = true){
  return function(input, pos){
    var results = [];
    var current = pos;
    while(current < input.length) {
      var result = element(input, current);
      if(result.status) { // parse succeeded
        current = result.position;
        results.push(result);
      } else { // parse failed
        return makeFailure(result.position, result);
      }
    }
    return makeSuccess(current, results);
  };
}

export function lexeme(element){
  var space = regex(/\s*/);
  return function(input, pos){
    var next = space(input, pos);
    return element(input, next.position);
  };
}
