import escapeId from './escape-id';

var prelude = (function(){
  var prelude = new class {
    constructor(){
      this.store = {};
    }
    register(name, proc){
      this.store[escapeId(name)] = proc;
    }
  };
  
  prelude.register('number', function(obj){
    return typeof obj === 'number';
  });
  
  prelude.register('+', function(...element){
    return element.reduce((a,b) => a + b);
  });
  prelude.register('-', function(...element){
    return element.reduce((a,b) => a - b);
  });
  prelude.register('*', function(...element){
    return element.reduce((a,b) => a * b);
  });
  prelude.register('/', function(...element){
    return element.reduce((a,b) => a / b);
  });
  
  prelude.register('=', function(...element){
    return element.reduce((acc,i)=>(!acc.length)?[acc==i,i]:[acc[0] && acc[1]==i,i])[0];
  });
  prelude.register('<', function(...element){
    return element.reduce((acc,i)=>(!acc.length)?[acc<i,i]:[acc[0] && acc[1]<i,i])[0];
  });
  prelude.register('<=', function(...element){
    return element.reduce((acc,i)=>(!acc.length)?[acc<=i,i]:[acc[0] && acc[1]<=i,i])[0];
  });
  prelude.register('>', function(...element){
    return element.reduce((acc,i)=>(!acc.length)?[acc>i,i]:[acc[0] && acc[1]>i,i])[0];
  });
  prelude.register('>=', function(...element){
    return element.reduce((acc,i)=>(!acc.length)?[acc>=i,i]:[acc[0] && acc[1]>=i,i])[0];
  });
  
  prelude.register('null?', function(obj){
    return obj === null;
  });
  prelude.register('pair?', function(obj){
    return Array.isArray(obj);
  });
  
  prelude.register('list?', function list$q(obj){
    return (Array.isArray(obj) && obj[obj.length - 1] === null) || obj === null;
  });
  
  prelude.register('symbol?', function(obj){
    return !!obj.symbol;
  });
  
  prelude.register('car', function(list){
    return list[0];
  });
  
  prelude.register('cdr', function(list){
    var tail = list.slice(1);
    if(tail.length == 1) {
      return tail[0];
    } else {
      return tail;
    }
  });
  
  prelude.register('cons', function(head, tail){
    return [head].concat(tail);
  });
  
  prelude.register('list', function(...elements){
    return elements.concat(null);
  });
  
  prelude.register('length', function(list){
    if(list$q(list)){
      return list === null ? 0: list.length - 1;
    } else {
      throw 'not a list';
    }
  });
  
  prelude.register('memq', function(target, list){
    if(list$q(list)){
      var index = list.findIndex(e => prelude.eq$q(e, target));
      if(index >= 0 && index < list.length - 1) {
        return list.slice(index);
      } else {
        return false;
      }
    } else {
      throw 'not a list';
    }
  });
  
  prelude.register('eq?', function eq$q(a,b){
    if(a === null || b === null) {
      return a === b;
    } else if(!!a.symbol) {
      return a.symbol === b.symbol;
    } else {
      // Incomplete implement: 
      //  If a and b are not the same object but have the same value, this function returns '#t' against Scheme spec.
      return a === b;
    }
  });
  
  prelude.register('last', function(list){
    if(Array.isArray(list)){
      return list[list.length - 1];
    } else {
      throw 'not a list';
    }
  });
  
  prelude.register('append', function(...lists){
    var newList = [];
    for(let list of lists.slice(0, -1)){
      if(!list$q(list))
        throw 'not a list';
      newList = newList.concat(list.slice(0, -1));
    }
    newList = newList.concat(lists[lists.length - 1]);
    return newList;
  });
  
  prelude.register('neq?', function(a,b){
    return !eq$q(a,b);
  });
  
  prelude.register('set-car!', function(list, car){
    // TODO: check arg
    if(Array.isArray(list)) {
      list[0] = car;
    } else {
      throw 'not a pair';
    }
  });
  
  prelude.register('set-cdr!', function(list, cdr){
    // TODO: check arg
    if(Array.isArray(list)) {
      if(Array.isArray(cdr)) {
        list.length = cdr.length + 1;
        for(let i = 0; i < cdr.length; i++){
          list[i+1] = cdr[i];
        }
      } else {
        list.length = 2;
        list[1] = cdr;
      }
    } else {
      throw 'not a pair';
    }
  });
  
  prelude.register('boolean?', function(obj){
    return typeof obj === 'boolean';
  });
  
  prelude.register('not', function(bool){
    return !bool;
  });
  
  prelude.register('string?', function(obj){
    return typeof obj === 'string';
  });
  
  prelude.register('string-append?', function(...strings){
    var newString = '';
    for(let str of strings){
      if(typeof str === 'string')
        newString += str;
      else
        throw 'not a string';
    }
    return newString;
  });
  
  prelude.register('symbol->string', function(symbol){
    return symbol.symbol;
  });
  
  prelude.register('string->symbol', function(string){
    return { symbol: string };
  });
  
  prelude.register('string->number', function(string){
    return parseFloat(string);
  });
  
  prelude.register('number->string', function(number){
    return number.toString();
  });
  
  prelude.register('procedure?', function(){
    return typeof obj === 'function';
  });

  prelude.register('equal?', function equal$q(a,b){
    if(Array.isArray(a)) {
      if(!Array.isArray(b)) return false;
      if(a.length !== b.length) return false;
      if(a.length > 1) {
        return eq$q(a[0],b[0]) && equal$q(a.slice(1),b.slice(1));
      } else {
        return eq$q(a[0],b[0]);
      }
    } else {
      return eq$q(a,b);
    }
  });
  
  return prelude.store;
})();

export default prelude;