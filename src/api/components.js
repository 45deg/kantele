class SequenceNode {
  constructor(parents){ this.parent = parents; }
  connect(node) { return this.parent.forEach(p => p.connect(node)); }
}

class Component {
  constructor(context){
    this.context = context;
    this.analyser = context.createAnalyser();
    this.nodeIdCnt = 0;
    this.seqIdCnt = 0;
  }

  createNode(type, ...arg){
    var node;
    if(type === 'oscillator') {
      node = this.context.createOscillator();
      node.source = true;
    } else if(type === 'gain') {
      node = this.context.createGain();
    } else if(type === 'delay') {
      node = this.context.createDelay();
    } else if(type == 'sequence') {
      node = new SequenceNode(...arg);
    } else if(type === 'sound') {
      node = this.context.createBufferSource();
      node.source = true;
    } else if(type == 'filter') {
      node = this.context.createBiquadFilter();
    }
    node.name = type;
    node.id = this.nodeIdCnt++;
    return node;
  }

  wave(form, length, fs, detune = 0){
    var oscillator = this.createNode('oscillator');
    oscillator.type = form.symbol;
    oscillator.frequency.value = fs;
    oscillator.detune.value = detune;
    oscillator.offset = 0;
    oscillator.length = length;
    return oscillator;
  }

  sound(fileName, playingRate = 1) {
    var source = this.createNode('sound');
    source.name = "sound";
    source.fileName = fileName;
    source.loop = false;
    source.playbackRate.value = playingRate;
    source.offset = 0;
    source.loaded = false;
    if(fileName){
      let xhr = new XMLHttpRequest();
      xhr.addEventListener('load', (function(){
        if(xhr.status !== 200) return;
        var arrayBuf = xhr.response;
        if(arrayBuf instanceof ArrayBuffer){
          this.context.decodeAudioData(arrayBuf, function(buf){ // success
            source.buffer = buf;
            source.loaded = true;
            if(source.onload instanceof Function)
              source.onload();
          }, function(e){ // error
            alert('LoadError: ' + e.message);
          });
        }
      }).bind(this));
      xhr.open('GET', fileName);
      xhr.responseType = 'arraybuffer';
      xhr.send();
    }
    return source;
  }

  gain(value, nodeList, gainModNode){
    nodeList = convertToArray(nodeList);
    var gainNode = this.createNode('gain');
    gainNode.gain.value = value;
    gainNode.parent = nodeList;
    for(let node of nodeList) {
      node.connect(gainNode);
    }
    if(gainModNode) {
      gainModNode.connect(gainNode.gain);
      gainNode.subNode = { type: 'gain', node: gainModNode };
      gainNode.parent.push(gainModNode);
    }
    return gainNode;
  }

  compose(nodeList){
    nodeList = convertToArray(nodeList);
    return gain(1/nodeList.length, nodeList);
  }

  delay(delayTime, nodeList, delayTimeNode){
    nodeList = convertToArray(nodeList);
    var delayNode = this.createNode('delay');
    delayNode.delayTime.value = delayTime;
    delayNode.parent = nodeList;
    for(let node of nodeList) {
      node.connect(delayNode);
    }
    if(delayTimeNode) {
      delayTimeNode.connect(delayNode.delayTime);
      delayNode.subNode = { type: 'delayTime', node: delayTimeNode };
      delayNode.parent.push(delayTimeNode);
    }
    return delayNode;
  }

  wait(time){
    return { wait: true, length: time };
  }

  sequence(elements){
    elements = convertToArray(elements);
    var offsetTime = 0;
    var playables = [];
    var seqId = this.seqIdCnt++;
    var cnt = 0;
    for(let e of elements){
      if(e.wait) {
        offsetTime = e.length;
      } else if(e.connect) {
        playables.push(e);
        e.offset = offsetTime;
        e.seqId = [seqId, cnt++];
        offsetTime = 0;
      } else {
        throw 'elements of sequence must have connect method';
      }
    }
    return this.createNode('sequence', playables);
  }

  filter(type, freq, ...rest){
    type = type.symbol;
    var q = 0, gain = 0;
    if(type.indexOf('pass') !== -1 || type === 'notch') {
      q = rest.shift();
    } else if(type.indexOf('shelf') !== -1) {
      gain = rest.shift();
    } else if(type === 'peaking') {
      q = rest.shift();
      gain = rest.shift();
    }
    var nodeList = convertToArray(rest.shift());
    var filterNode = this.createNode('filter');
    filterNode.type = type;
    filterNode.frequency.value = freq;
    filterNode.gain.value = gain;
    filterNode.Q.value = q;
    filterNode.parent = nodeList;
    for(let node of nodeList) {
      node.connect(filterNode);
    }
    return filterNode;
  }

  $play(node){
    var visited = new Set();
    var toVisit = [node];
    var sources = [];
    while(toVisit.length > 0){
      let top = toVisit.pop();
      if(visited.has(top)) continue;
      visited.add(top);
      var out = '';
      if(top.parent && top.parent.length > 0) { // is middle node
        toVisit = toVisit.concat(top.parent);
      } else if(top.source) {
        sources.push(top);
      }
    }

    node.connect(this.analyser);
    this.analyser.connect(this.context.destination);
    var t = this.context.currentTime;

    console.log(sources);
    sources = sources.sort(function(sa, sb){
      var a = sa.seqId || [-1, -1], b = sb.seqId || [-1, -1];
      return a[0] - b[0] || a[1] - b[1]
    });

    for(let src of sources) {
      if(src.loaded === false){
        src.onload = (() => this.$play(node)).bind(this);
        return;
      }
    }
    let accTime = 0;
    for(let src of sources) {
      let len = src.length || src.buffer.duration / src.playbackRate.value;

      if(src.seqId === undefined) {
        src.start(t + src.offset);
        if(len >= 0)
          src.stop(t + src.offset + len);
      } else {
        let id = src.seqId[0];
        src.start(t + src.offset + accTime);
        accTime += src.offset + len;
        if(len >= 0)
          src.stop(t + accTime);
      }
    }
  }
}

export function makeComponent(context){
  return new Component(context);
}

function convertToArray(nodeList){
  if(!Array.isArray(nodeList)) {
    nodeList = [nodeList];
  } else {
    nodeList.pop();
  }
  return nodeList;
}
