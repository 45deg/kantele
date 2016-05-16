export default class Env {
  constructor(parent){
    this.store = new Map();
    this.parent = parent;
  }
  
  get(key) {
    if(this.store.has(key)) {
      return this.store.get(key);
    } else if(this.parent !== null) {
      return this.parent.get(key);
    } else {
      return null;
    }
  }
  
  set(key, value) {
    this.store.set(key, value);
  }
  
  setEntries(obj){
    for(let key in obj) {
      this.set(key, obj[key]);
    }
  }
  
  has(key){
    return this.store.has(key) ||
           (this.parent !== null && this.parent.has(key));
  }
}