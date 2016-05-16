import {
    token,
    regex,
    seq,
    tag,
    or,
    option,
    map,
    lazy,
    repeatToEof,
    lexeme,
    many,
    oneMore,
    filter,
} from './lpc';

// primitives
var lparen = lexeme(token('('));
var rparen = lexeme(token(')'));
var dot = lexeme(token('.'));
var paren = function(...element) {
  return map(seq(lparen, ...element, rparen), val => val.slice(1, -1));
};

// TODO: 数値と成るものをのぞいてない
var id = tag('id', filter(lexeme(regex(/[0-9A-Za-z!$%&*+-\./<=>?@^_]+/)), v => v != '.' || parseFloat(v) != v));
var string = tag('string', lexeme(map(regex(/"(?:[^"\\]|\\.)*"/), function(str){
  return eval(str);
})));
var num = tag('number', lexeme(map(regex(/[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/), function(token){
  return parseFloat(token);
})));
var bool = tag('bool', lexeme(map(or(token('#t'), token('#f')), function(token){
  return (token.value === '#t');
})));

// non-primitives

var constant = tag('const', or(
    num,
    bool,
    string,
    lexeme(token('()'))
));
var sexp_ = lazy(() => sexp);
var sexp = tag('s-exp', or(
    constant,
    id,
    tag('sexp-dot', paren(oneMore(sexp_), dot, sexp_)),
    paren(many(sexp_))
));

var arg = tag('arg', or(
    tag('arg1',id),
    tag('arg2', paren(oneMore(id), dot, id)),
    tag('arg3', paren(many(id)))
));

var exp_ = lazy(() => exp);
var body_ = lazy(() => body)
var bindings = tag('bindings',paren(many(paren(id, exp_))));
var define = tag('define', or(
    tag('define1', paren(token('define'), id, exp_)),
    tag('define2', paren(token('define'), paren(id, many(id), option(seq(dot, id))), body_))
));
var body = tag('body', seq(many(define), oneMore(exp_)));
var exp = tag('exp', or(
    constant,
    id,
    paren(token('lambda'), arg, body),
    paren(token('quote'), sexp),
    seq(lexeme(token("'")), sexp),
    paren(token('set!'), id, exp_),
    paren(token('let*'), bindings, body),
    paren(token('letrec'), bindings, body),
    paren(token('let'), option(id), bindings, body),
    paren(token('if'), exp_, exp_, option(exp_)),
    paren(token('cond'), many(paren(filter(exp_, v => v.value != 'else'), oneMore(exp_))),
        option(paren(token('else'), oneMore(exp_)))),
    paren(token('and'), many(exp_)),
    paren(token('or'), many(exp_)),
    paren(token('begin'), many(exp_)),
    paren(token('do'), paren(many(paren(id, exp_, exp_))),
        paren(exp_, many(exp_)), body),
    paren(token('feedback'), id, exp_),
    paren(exp_, many(exp_))
));

var toplevel = tag('toplevel', or(
    define,
    paren(token('load'), string),
    exp
));

var program = tag('program', repeatToEof(toplevel));

export function parse(input){
    input = input.replace(/\s+$/, ''); // eliminate trailing spaces
    return program(input,0);
}
