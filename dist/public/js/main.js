const validacion = /^[\d+\-*/() \t]+$/;

const btn1  = document.getElementById("btn_generar");
const arbol = document.getElementById("contenido_arbol");

const estilos = { color:'#e22f2fff', outline:false, endPlugOutline:false, endPlugSize:1, startPlug:'behind', endPlug:'behind', path:'straight', size:2 };

const nodo  = (v,id)=>`<div class='col-2 align-self-end'><span id="${id}" class='btn btn-success rounded-circle'>${v}<span></div>`;
const nodo2 = (v,id)=>`<div class='col-2'><span id="${id}" class='btn btn-primary rounded-circle'>${v}<span></div>`;

const pos=(id,x,y)=>{const s=document.getElementById(id).parentElement; s.style.position='absolute'; s.style.left=x+'px'; s.style.top=y+'px';};
const limpia=()=>{(window.__lines||[]).forEach(l=>l.remove()); window.__lines=[];};
const prec=o=> (o==='+'||o==='-')?1:(o==='*'||o==='/')?2:0;
const isNum=t=>/^\d+$/.test(t), isOp=t=>/[+\-*/]/.test(t);

function tokens(expr){
  const t=(expr.replace(/\s+/g,'').match(/(\d+|\+|\-|\*|\/|\(|\))/g)||[]), out=[];
  for(let i=0;i<t.length;i++){
    const cur=t[i], prev=out[out.length-1];
    const unario=(cur==='+'||cur==='-')&&(i===0||prev==='('||isOp(prev));
    if(unario && cur==='+') continue;
    if(unario && cur==='-') out.push('0','-'); else out.push(cur);
  }
  return out;
}

function parensOK(tk){
  let d=0; for(const t of tk){ if(t==='(') d++; else if(t===')' && --d<0) return false; } return d===0;
}

function topLevelOneOp(tk){
  let depth=0, count=0;
  for(const t of tk){
    if(t==='(') depth++;
    else if(t===')') depth--;
    else if(depth===0 && isOp(t) && ++count>1) return false;
  }
  return count>=1;
}

function secuenciaOK(tk){
  if(!tk.length || isOp(tk[0]) || isOp(tk.at(-1))) return false;
  for(let i=0;i<tk.length-1;i++){
    const a=tk[i], b=tk[i+1];
    if( (isNum(a)&&(isNum(b)||b==='(')) || (a===')'&&(isNum(b)||b==='(')) ) return false;
    if( (isOp(a)&&(isOp(b)||b===')')) || (a==='('&&(isOp(b)||b===')')) ) return false;
  }
  return true;
}

function aRPN(tk){
  const out=[], ops=[];
  for(const t of tk){
    if(isNum(t)) out.push(t);
    else if(isOp(t)){ while(ops.length&&isOp(ops.at(-1))&&prec(ops.at(-1))>=prec(t)) out.push(ops.pop()); ops.push(t); }
    else if(t==='(') ops.push(t);
    else { while(ops.length&&ops.at(-1)!=='(') out.push(ops.pop()); if(!ops.length) throw Error('Paréntesis'); ops.pop(); }
  }
  while(ops.length){ const top=ops.pop(); if(top==='('||top===')') throw Error('Paréntesis'); out.push(top); }
  return out;
}

function rpn2ast(r){
  const s=[];
  for(const t of r){
    if(isNum(t)) s.push({t:'n',v:t,id:'n'+Math.random()});
    else{ const b=s.pop(), a=s.pop(); if(!a||!b) throw Error('Expresión'); s.push({t:'o',v:t,id:'n'+Math.random(),l:a,r:b}); }
  }
  if(s.length!==1) throw Error('Expresión'); return s[0];
}

function ubicar(root){
  let x=0; const X=60,Y=50,W=arbol.clientWidth||800,C=W/2;
  (function dfs(n,d=0){ if(!n) return; if(n.t==='o') dfs(n.l,d+1); n.px=C+(x++-3)*X; n.py=20+d*Y; if(n.t==='o') dfs(n.r,d+1); })(root);
}

function dibujar(n){
  arbol.innerHTML += (n.t==='n'?nodo:nodo2)(n.v,n.id);
  pos(n.id,n.px,n.py);
  if(n.t==='o'){
    dibujar(n.l); dibujar(n.r);
    window.__lines.push(new LeaderLine(document.getElementById(n.id),document.getElementById(n.l.id),estilos));
    window.__lines.push(new LeaderLine(document.getElementById(n.id),document.getElementById(n.r.id),estilos));
  }
}

// ---------- Recorridos ----------
// pre y post devuelven arrays de tokens (fácil para mostrar)
function preordenArr(n, res=[]){
  if(!n) return res;
  res.push(n.v);
  if(n.t==='o'){ preordenArr(n.l,res); preordenArr(n.r,res); }
  return res;
}
function postordenArr(n, res=[]){
  if(!n) return res;
  if(n.t==='o'){ postordenArr(n.l,res); postordenArr(n.r,res); }
  res.push(n.v);
  return res;
}

// inorden lineal (sin paréntesis)
function inordenSimple(n){
  if(!n) return '';
  if(n.t==='n') return n.v;
  return inordenSimple(n.l) + ' ' + n.v + ' ' + inordenSimple(n.r);
}

// inorden con paréntesis que respeta la estructura (fully parenthesized)
// y luego quitamos paréntesis exteriores para presentación limpia.
function inordenParen(n){
  if(!n) return '';
  if(n.t==='n') return n.v;
  return '(' + inordenParen(n.l) + ' ' + n.v + ' ' + inordenParen(n.r) + ')';
}
function stripOuterParens(s){
  // quitar paréntesis exteriores balanceados repetidamente
  function outerIsBalanced(str){
    if(str.length<2 || str[0] !== '(' || str[str.length-1] !== ')') return false;
    let depth = 0;
    for(let i=1;i<str.length-1;i++){
      const c = str[i];
      if(c==='(') depth++;
      else if(c===')'){
        if(depth===0) return false; // cierra la paréntesis exterior antes del final
        depth--;
      }
    }
    return depth===0;
  }
  let out = s;
  while(outerIsBalanced(out)){
    out = out.slice(1,-1);
  }
  return out;
}

// ---------- Evento del botón ----------
btn1.addEventListener("click", ()=>{
  const expr=(document.getElementById("expresion").value||'').trim();
  if(!validacion.test(expr)) return alert("Expresión inválida: caracteres no permitidos.");
  try{
    const tk=tokens(expr);
    if(!parensOK(tk)) return alert("Paréntesis desbalanceados.");
    if(!secuenciaOK(tk)) return alert("Secuencia inválida de tokens.");
    if(!topLevelOneOp(tk)) return alert("No se permiten cadenas de operadores al mismo nivel. Usa paréntesis.");
    limpia(); arbol.innerHTML='';
    const ast=rpn2ast(aRPN(tk));
    ubicar(ast); dibujar(ast);

    // Preparar y mostrar recorridos
    const pre = preordenArr(ast).join(' ');
    const post = postordenArr(ast).join(' ');
    const inSimple = inordenSimple(ast).trim().replace(/\s+/g,' ');
    const inParen = stripOuterParens(inordenParen(ast)).replace(/\s+/g,' ');

    document.getElementById("contenido_preorden").innerText  = pre;                 // e.g. "+ A B"
    // mostramos la versión sin paréntesis y, si difiere, la versión con paréntesis
    let inText = inSimple;
    if(inParen !== inSimple);
    document.getElementById("contenido_inorden").innerText   = inText;            // e.g. "A + B"  ó "A + B\n(Con paréntesis: (A + B))"
    document.getElementById("contenido_postorden").innerText = post;                // e.g. "A B +"
  }catch(e){ console.error(e); alert("Error: "+e.message); }
});
