import { parse } from './core/parser';
import { evalProgram } from './core/eval';
import Env from './core/env';
import prelude from './core/prelude';
import { makeComponent } from './api/components';

import ace from 'brace';
import 'brace/mode/scheme';
import 'brace/theme/chrome';

function initEnv(){
  var global = new Env(null);
  global.setEntries(prelude);
  var context = new AudioContext();
  var components = makeComponent(context);
  var componentMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(components));
  for(let name of componentMethods){
    if(name === 'constructor' || name === '$play') continue;
    global.set(name, components[name].bind(components));
  }
  return { global, components };
}

var prevContext = null;
function run(source, editor){
  var resField = document.querySelector('#result-field');
  var ast;
  {
    ast = parse(source);
    if(ast.status === false) {
      let Document = ace.acequire('ace/document').Document;
      let { row, column } = (new Document(source)).indexToPosition(ast.position, 0);
      resField.innerHTML = `<span class="err">Parse Error (row: ${row + 1}, column: ${column})</span>`;
      editor.getSession().setAnnotations([{
        row: row,
        column: column,
        text: "Parse Error",
        type: "error"
      }]);
      return;
    }
    let { global, components } = initEnv();
    analyser = components.analyser;
    if(prevContext != null){
      prevContext.close();
    }
    let result = evalProgram(ast, global);
    if(result && result.connect){
      components.$play(result);
      let diagram = makeDiagram(result);
      console.log(diagram);
      resField.innerHTML = '';
      mermaidAPI.render('graph', diagram, function(svgCode){
        resField.innerHTML = svgCode;
      });
    } else {
      resField.innerHTML = `<pre>${result}</pre>`;
    }
    prevContext = components.context;
  }
}

function makeDiagram(node){
  var diagram = "graph TB\n";
  var visited = new Set();
  var toVisit = [node];
  diagram += makeNode(node, {id:'o'}) + ";";
  diagram += 'o((OUT));';
  while(toVisit.length > 0){
    let top = toVisit.pop();
    if(visited.has(top)) continue;
    visited.add(top);
    if(top.parent && top.parent.length > 0 &&
       (top.name !== "sequence" || top.parent.length < 3)) { // is middle node
      for(let parent of top.parent){
        if(parent.dummy) parent = parent.parent;
        if(top.subNode && top.subNode.node === parent) {
          diagram += makeNode(parent, top, top.subNode.type) + "\n";
        } else {
          diagram += makeNode(parent, top) + "\n";
        }
      }
      toVisit = toVisit.concat(top.parent);
    }
  }
  return diagram;

  function makeLabel(node){
    switch(node.name) {
      case 'sequence': return `["sequence [${node.parent.length}]"]`;
      case 'delay': return `[delay ${node.delayTime.value.toFixed(2)}s]`;
      case 'gain': return `[gain ${(node.gain.value*100).toFixed(2)} %]`;
      case 'oscillator': return `>${node.type} ${node.frequency.value.toFixed(2)}Hz]`;
      case 'sound': return `>${node.fileName}]`;
      case 'filter': return `[${node.type}]`;
      case 'out': return `(output)`;
      default: return `(${node.name})`;
    }
  }
  function makeNode(from, to, sub = null){
    var fromStr = from.id + makeLabel(from);
    var toStr = to.id;
    if(sub === null) {
      var connection = ' --> ';
    } else {
      var connection = ` -. ${sub} .-> `;
    }

    return fromStr + connection + toStr;
  }
}

var analyser = null;
function drawAnalyser(){
  var canvas = document.querySelector('#oscillo');
  var ctx = canvas.getContext('2d');
  var width = canvas.width, height = canvas.height;
  ctx.beginPath();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(0, 0, width, height);
  ctx.beginPath();
  if(analyser !== null) {
    let times = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(times);
    for (let i = 0, l = times.length; i < l; i++) {
      let x = Math.floor(i/l * width);
      let y = Math.floor((1 - (times[i] / 255)) * height);
      if(i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle = 'rgba(0, 255, 0, 1.0)';
    ctx.lineWidth   = '1';
    ctx.stroke();
  }
  requestAnimationFrame(drawAnalyser);
}

document.addEventListener("DOMContentLoaded", function(){
  var editor = ace.edit('source');
  editor.getSession().setMode('ace/mode/scheme');
  editor.setTheme('ace/theme/chrome');
  editor.setOptions({
    fontSize: "19pt"
  });
  document.querySelector('button').addEventListener('click', function(){
    run(editor.getValue(), editor);
  });

  editor.commands.addCommand({
    name: 'execProgram',
    bindKey: {win: 'Ctrl-Enter',  mac: 'Ctrl-Enter'},
    exec: function(editor) {
      run(editor.getValue(), editor);
    }
  });

  mermaidAPI.initialize({
    startOnLoad:false,
    flowchart: {
      useMaxWidth: false
    }
  });

  requestAnimationFrame(drawAnalyser);
});
