const fs=require('fs');
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
function mk(tag){
  const n={tag,attrs:{},kids:[],style:{setProperty(k,v){this[k]=v;},getPropertyValue(k){return this[k];}},_text:'',
    setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k]??null;},
    removeAttribute(k){delete this.attrs[k];},
    appendChild(c){this.kids.push(c);return c;},
    addEventListener(){},focus(){},classList:{add(){},remove(){},toggle(){},contains:()=>false},
    querySelectorAll(sel){const cls=sel.replace('.','');const out=[];
      (function walk(e){e.kids.forEach(k=>{const c=(k.attrs['class']||'');
        if(sel==='text'? k.tag==='text' : c.split(' ').includes(cls)) out.push(k); walk(k);});})(n);
      out.forEach=Array.prototype.forEach.bind(out);return out;},
    querySelector(sel){return this.querySelectorAll(sel)[0]||null;},
    get textContent(){return this._text;}, set textContent(v){this._text=v;},
    ser(){let a=Object.entries(this.attrs).map(([k,v])=>` ${k}="${esc(v)}"`).join('');
      const st=Object.entries(this.style).filter(([k,v])=>v!==''&&v!=null&&k!=='cssText')
        .map(([k,v])=>`${k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}:${v}`).join(';');
      if(st)a+=` style="${st}"`;
      return `<${this.tag}${a}>${esc(this._text)}${this.kids.map(k=>k.ser()).join('')}</${this.tag}>`;}
  };
  return n;
}
const root=mk('svg');
root.setAttribute('data-art',process.argv[3]||'mark');
global.document={createElementNS:(ns,t)=>mk(t),createElement:t=>mk(t),
  getElementById:()=>mk('div'),querySelectorAll:s=>s.includes('data-art')?[root]:[],
  querySelector:()=>null,addEventListener(){},documentElement:{className:''},
  body:mk('body'),readyState:'complete'};
document.querySelectorAll('svg[data-art]').forEach=Array.prototype.forEach;
global.window={addEventListener(){},matchMedia:()=>({matches:process.env.RM==='1',addEventListener(){}})};
global.requestAnimationFrame=f=>f();
global.setTimeout=(f)=>{ if(process.env.END==='1') f(); return 0;};
global.IntersectionObserver=function(){this.observe=()=>{};this.unobserve=()=>{}};
require('vm').runInThisContext(fs.readFileSync('assets/js/v2.js','utf8'));
console.log('ok');
