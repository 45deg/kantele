import escapeId from './escape-id';
import Env from './env';

class FunObject {
  constructor(args, rest, body){
    this.args = args;
    this.rest = rest;
    this.body = body;
  }
  
  call(args, env){
    var subEnv = new Env(env);
    
    if(this.rest === null) { // not have a rest
      if(args.length !== this.args.length)
        throw 'Wrong number of arguments';
          
      for(let i = 0; i < args.length; i++) {
        subEnv.set(this.args[i], args[i]);
      }
           
      return evalBody(this.body, subEnv);
    } else {
      if(args.length < this.args.length)
          throw 'Lack of arguments';
      for(let i = 0; i < this.args.length; i++) {
          subEnv.set(this.args[i], args[i]);
      }
      subEnv.set(tgus.rest, args.slice(this.args.length).concat(null));
            
      return evalBody(this.body, subEnv);
    }
  }
}

export function evalProgram(program, env){
  var evaluated = program.value.map(tl => evalToplevel(tl, env));
  return evaluated[evaluated.length - 1];
}

function evalToplevel(toplevel, env) {
  var content = toplevel.value;
  if(content.type === 'exp') {
    return evalExp(content, env);
  } else if(content.type === 'define') {
    return evalDefine(content, env);
  }
  throw 'Invalid syntax'; 
}

function evalDefine(define, env) {
  var content = define.value;
  
  if(content.type === 'define1') { // non-function definition
    var [_, id, exp] = content.value;
    env.set(escapeId(id.value), evalExp(exp, env));
  } else if(content.type === 'define2') { // function definition
    // FIXIT: DRY, this is similar to lambda... 
    var [_, signature, body] = content.value;
    var [id, args, rest] = signature.value;
    var argIds = args.value.map(arg => escapeId(arg.value));
    var restId = (rest.value !== null) ? escapeId(rest.value.value[1].value)
                                       : null;
    env.set(escapeId(id.value), new FunObject(argIds, restId, body));
  } else {
    throw 'Invalid syntax';
  }
  
  return escapeId(id.value);
}

function evalExp(exp, env){
  var content = exp.value;
  if(content.type === 'const') {
    return evalConst(content, env);
  } else if(content.type === 'id') {
    return evalId(content, env);
  } else {
    var head = content.value[0], tail = content.value.slice(1);
    if(head.value in special) {
      return special[head.value](tail, env);
    } else {
      // call function
      if(head.type === 'exp') {
          let args = tail[0].value.map(exp => evalExp(exp, env));
          let func = evalExp(head, env);
          
          if(func instanceof Function) { // native function
            return func.apply(env, args);
          } else if(func instanceof FunObject) { // in-scheme function
            return func.call(args, env);
          } else {
            throw 'Calling non-function';
          }
      } else {
          throw 'Invalid syntax';
      }
    }
  }
}

var special = {};
special['lambda'] = function(tail){
  var [arg, body] = tail;
  if(arg.value.type === 'arg1') { // single arguments
    return new FunObject([], escapeId(arg.value.value), body);
  } else {
    let argList = arg.value.value[0].value;
    let argIds = argList.map(arg => escapeId(arg.value));
    let argType = arg.value.type;
    let restId = (argType === 'arg2') ? escapeId(arg.value.value[2].value)
                                      : null;
    return new FunObject(argIds, restId, body);
  }
};
special['quote'] = special["'"] = function(tail){
  return evalSExp(tail[0]);
};
special['set!'] = function(tail, env){
  var [name, value] = tail;
  env.set(escapeId(name.value), evalExp(value, env));
};
special['let'] = function(tail, env){
  var [id, bindings, body] = tail;
  var bindPairs = bindings.value[0].value;
  var subEnv = new Env(env);
  var bindNames = [];
  for(let pair of bindPairs){
    let [id, exp] = pair.value;
    let name = escapeId(id.value);
    subEnv.set(name, evalExp(exp, env));
    bindNames.push(name);
  }
  if(id.value !== null){
    subEnv.set(escapeId(id.value.value), 
       new FunObject(bindNames, null, body));
  }
  return evalBody(body, subEnv);
};
special['let*'] = function(tail, env){
  var [bindings, body] = tail;
  var bindPairs = bindings.value[0].value;
  var subEnv = new Env(env), parent = env;
  for(let pair of bindPairs){
    let [id, exp] = pair.value;
    let name = escapeId(id.value);
    subEnv.set(name, evalExp(exp, parent));
    parent = subEnv;
    subEnv = new Env(parent);
  }
  return evalBody(body, subEnv);
};
special['letrec'] = function(tail, env){
  var [bindings, body] = tail;
  var bindPairs = bindings.value[0].value;
  var subEnv = new Env(env);
  for(let pair of bindPairs){
    let [id, exp] = pair.value;
    let name = escapeId(id.value);
    subEnv.set(name, evalExp(exp, subEnv));
  }
  return evalBody(body, subEnv);
};
special['if'] = function (tail, env) {
  var [cond, trueExp, falseExp] = tail;
  if(evalExp(cond, env)) {
    return evalExp(trueExp, env);
  } else {
    if(falseExp.value !== null)
      return evalExp(falseExp.value, env);
  }
}
special['cond'] = function(tail, env){
  var [conds, otherwise] = tail;
  for(let cond of conds.value){
    let [pred, then] = cond.value;
    if(evalExp(pred, env)) {
      let retvals = then.value.map(e => evalExp(e, env));
      return retvals[retvals.length - 1];
    }
  }
  if(otherwise.value !== null) {
    let otherwiseExps = otherwise.value.value[1].value;
    let retvals = otherwiseExps.map(e => evalExp(e, env)); 
    return retvals[retvals.length - 1];
  }
};
special['and'] = function(tail, env){
  return tail[0].value.reduce((acc,e) => acc && evalExp(e, env), true);
};
special['or'] = function(tail, env){
  return tail[0].value.reduce((acc,e) => acc || evalExp(e, env), false);
};
special['begin'] = function(tail, env){
  var retvals = tail[0].value.map(e => evalExp(e, env));
  return retvals[retvals.length - 1];
};
special['do'] = function(tail, env){
  var [fst, snd, body] = tail;
  var varDecls = fst.value[0].value;
  var vars = varDecls.map(function(varDecl){
    var [id, init, step] = varDecl.value;
    var name = escapeId(id.value);
    return { name, init, step };
  });
  var [test, exprs] = snd.value;
  var subEnv = new Env(env);
  
  // init
  for(let v of vars) {
    subEnv.set(v.name, evalExp(v.init, subEnv));
  }
  
  while(!evalExp(test, subEnv)){
    evalBody(body, subEnv);
    // update
    for(let v of vars) {
      subEnv.set(v.name, evalExp(v.step, subEnv));
    }
  }
  
  var retvals = exprs.value.map(e => evalExp(e, subEnv));
  return retvals[retvals.length - 1];
};

special['feedback'] = function(tail, env){
  class DummyNode {
    constructor() { this.target = null; this.dummy = true; }
    connect(node) { this.target = node; }
  }
  var [name, value] = tail;
  var subEnv = new Env(env);
  var dummyNode = new DummyNode();

  env.set(escapeId(name.value), dummyNode);
  var result = evalExp(value, subEnv);
  result.connect(dummyNode.target);
  dummyNode.parent = result;

  return result;
};

function evalBody(body, env){
  var [defines, exps] = body.value;
  
  var retvals = [].concat(
    defines.value.map(d => evalDefine(d, env)),
    exps.value.map(e => evalExp(e, env))
  );
  
  return retvals[retvals.length - 1];
}


function evalSExp(sexp){
  var content = sexp.value;
  if(content.type === 'id') {
    return {symbol: escapeId(content.value)};
  } else if(content.type === 'const') {
    return evalConst(content);
  } else if(content.type === 'sexp-dot'){
    var [init, dot, last] = content.value;
    var list = init.value;
    list.push(last);
    return list.map(evalSExp);
  } else {
    return content.value[0].value.map(evalSExp).concat(null);
  }
}

function evalConst(constant, env){
  if(constant.value.value === '()') {
    return null;
  } else {
    return constant.value.value;
  }
}

function evalId(id, env){
  return env.get(escapeId(id.value));
}

function evalNumber(number){
  return number.value;
}

function evalBool(bool, env){
  return bool.value;
}

function evalString(string){
  return string.value;
}
