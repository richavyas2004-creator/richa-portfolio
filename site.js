/* Shared behaviour for every page: header, live clock, rope theme switch, reveal, page-enter, lightbox */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const RM=matchMedia("(prefers-reduced-motion: reduce)").matches;
const ic=(n,cls="ic",style="")=>`<svg class="${cls}" style="${style}" aria-hidden="true"><use href="#i-${n}"/></svg>`;

const PAGES={
  home:{href:"index.html",label:"Home"},
  cs1:{href:"case-study-1.html",label:"Manychat",sub:"Case study 1"},
  cs2:{href:"case-study-2.html",label:"FIKAA",sub:"Case study 2"},
  cs3:{href:"case-study-3.html",label:"Sunsama",sub:"Case study 3"},
  td:{href:"teardown.html",label:"Teardown"},
  ws:{href:"work-samples.html",label:"Work samples"},
};

/* ---------- header + mobile menu + rope + footer ---------- */
(()=>{
  const page=document.body.dataset.page||"home", home=page==="home";
  const on=k=>k===page?' class="on"':"";
  const story=home?"#about":"index.html#about", contact=home?"#contact":"index.html#contact";
  const nav=document.createElement("nav");nav.className="top";nav.id="nav";
  nav.innerHTML=`<div class="wrap">
    <a href="index.html" class="logo">richa vyas</a>
    <ul class="links">
      <li><a href="index.html"${on("home")}>Home</a></li>
      <li><a href="${home?"#works":"index.html#works"}"${["cs1","cs2","cs3","td","ws"].includes(page)?' class="on"':""}>My work ▾</a>
        <ul class="drop">${["cs1","cs2","cs3","td","ws"].map(k=>`<li><a href="${PAGES[k].href}"${k===page?' class="cur"':""}>${PAGES[k].label}${PAGES[k].sub?`<small>${PAGES[k].sub}</small>`:""}</a></li>`).join("")}</ul></li>
      <li><a href="${story}">My story</a></li>
      <li><a href="${contact}">Contact</a></li>
    </ul>
    <div class="chips">
      <span class="chip hide-sm"><i class="live"></i>Available for work</span>
      <span class="chip"><span class="lbl">Local time</span><b class="clock">--:--</b><span class="lbl hide-sm hide-md">· Mumbai</span></span>
      <button class="menu-btn" id="menuBtn" aria-expanded="false">Menu</button>
    </div></div>`;
  document.body.prepend(nav);
  const mm=document.createElement("div");mm.className="mmenu";mm.id="mmenu";
  mm.innerHTML=Object.entries(PAGES).map(([k,p])=>`<a href="${p.href}">${p.label}${p.sub?`<small>${p.sub}</small>`:""}</a>`).join("")+`<a href="${story}">My story</a><a href="${contact}">Contact</a>`;
  document.body.appendChild(mm);
  $("#menuBtn").onclick=()=>{const o=mm.classList.toggle("open");$("#menuBtn").textContent=o?"Close":"Menu";$("#menuBtn").setAttribute("aria-expanded",o)};
  mm.addEventListener("click",e=>{if(e.target.closest("a")){mm.classList.remove("open");$("#menuBtn").textContent="Menu"}});

  // rope elements
  document.body.insertAdjacentHTML("beforeend",`<canvas id="ropeCv" aria-hidden="true"></canvas><div id="ropeHit" role="button" tabindex="0" aria-label="Pull the cord to switch light and dark mode"></div>${home?'<div class="rope-hint" id="ropeHint">psst… pull me ↗</div>':""}`);

  if(!document.querySelector("footer"))document.body.insertAdjacentHTML("beforeend",`<footer><div class="wrap"><span>© 2026 Richa Vyas</span><span>Mumbai, India · Remote-first, worldwide · <a href="mailto:richavyas2004@gmail.com">richavyas2004@gmail.com</a> · <a href="https://www.linkedin.com/in/vyas-richa/" target="_blank" rel="noopener">LinkedIn</a></span></div></footer>`);
  if(!home)document.body.insertAdjacentHTML("beforeend",`<a class="back" href="index.html#works">${ic("arrow-left")}Back to the doors</a>`);

  addEventListener("scroll",()=>{nav.classList.toggle("scrolled",scrollY>40);const h=$("#ropeHint");if(h)h.style.opacity=scrollY>200?0:""},{passive:true});
})();

/* ---------- live local time (Mumbai) ---------- */
(()=>{
  const f=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit"});
  const tick=()=>{const t=f.format(new Date()).replace(" ","").toLowerCase();$$(".clock").forEach(c=>c.textContent=t)};
  tick();setInterval(tick,15000);
})();

/* ---------- rope: physics cord, drag to pull, toggles theme ---------- */
(()=>{
  const cv=$("#ropeCv"),ctx=cv.getContext("2d"),hit=$("#ropeHit"),root=document.documentElement;
  const W=140,H=420,L=150,ax=78,ay=-4;let dpr=1;
  const size=()=>{dpr=Math.min(devicePixelRatio||1,2);cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)};size();addEventListener("resize",size);
  const b={x:ax,y:ay+L,vx:0,vy:0};let drag=false,moved=0,lastPX=null;const col={};
  const readCol=()=>{const s=getComputedStyle(root);col.ink=s.getPropertyValue("--ink").trim();col.bob=root.dataset.theme==="dark"?s.getPropertyValue("--blue").trim():"#F3D27A"};readCol();
  const local=e=>{const r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
  function toggle(){
    const r=cv.getBoundingClientRect(),x=r.left+b.x,y=r.top+b.y;
    const apply=()=>{root.dataset.theme=root.dataset.theme==="dark"?"light":"dark";try{localStorage.setItem("theme",root.dataset.theme)}catch(e){};readCol()};
    const h=$("#ropeHint");if(h)h.style.opacity=0;
    if(!document.startViewTransition||RM){apply();return}
    const rad=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
    document.startViewTransition(apply).ready.then(()=>root.animate({clipPath:[`circle(0px at ${x}px ${y}px)`,`circle(${rad}px at ${x}px ${y}px)`]},{duration:900,easing:"cubic-bezier(.6,0,.2,1)",pseudoElement:"::view-transition-new(root)"}));
  }
  hit.addEventListener("pointerdown",e=>{e.preventDefault();drag=true;moved=0;hit.setPointerCapture(e.pointerId)});
  hit.addEventListener("pointermove",e=>{if(!drag)return;const p=local(e);moved+=Math.abs(p.y-b.y)+Math.abs(p.x-b.x);
    const dx=p.x-ax,dy=p.y-ay,len=Math.hypot(dx,dy),max=L+110,k=len>max?max/len:1;b.x=ax+dx*k;b.y=ay+dy*k;b.vx=b.vy=0});
  const release=()=>{if(!drag)return;drag=false;const st=Math.hypot(b.x-ax,b.y-ay)-L;if(moved<6)b.y+=70;if(st>45||moved<6)toggle()};
  hit.addEventListener("pointerup",release);hit.addEventListener("pointercancel",release);
  hit.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();b.vy+=900;toggle()}});
  addEventListener("pointermove",e=>{const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    if(lastPX!==null&&!drag&&y>0&&y<b.y+20&&Math.abs(x-(ax+(b.x-ax)*(y/b.y)))<26)b.vx+=Math.max(-260,Math.min(260,(x-lastPX)*9));lastPX=x},{passive:true});
  let last=performance.now();
  (function step(t){
    const dt=Math.min(.032,(t-last)/1000);last=t;
    if(!drag){const dx=b.x-ax,dy=b.y-ay,len=Math.hypot(dx,dy)||1,st=len-L,k=st>0?260:40;
      b.vx+=(-k*st*dx/len)*dt;b.vy+=(-k*st*dy/len+1200)*dt;b.vx*=.975;b.vy*=.975;b.x+=b.vx*dt;b.y+=b.vy*dt}
    ctx.clearRect(0,0,W,H);
    const mx=(ax+b.x)/2-b.vx*.02,my=(ay+b.y)/2;
    ctx.strokeStyle=col.ink;ctx.lineWidth=2;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo(mx,my,b.x,b.y-4);ctx.stroke();
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.y-my,b.x-mx)-Math.PI/2);
    ctx.beginPath();ctx.moveTo(0,-6);ctx.bezierCurveTo(10,8,13,22,0,30);ctx.bezierCurveTo(-13,22,-10,8,0,-6);
    ctx.fillStyle=col.bob;ctx.fill();ctx.lineWidth=2;ctx.stroke();
    ctx.beginPath();ctx.moveTo(-4,12);ctx.quadraticCurveTo(-6,18,-3,23);ctx.strokeStyle="rgba(255,255,255,.7)";ctx.stroke();ctx.restore();
    const r=cv.getBoundingClientRect();hit.style.left=r.left+b.x+"px";hit.style.top=r.top+b.y+"px";
    requestAnimationFrame(step);
  })(last);
})();

/* ---------- arriving through a door: veil fades, content rises ---------- */
(()=>{
  let c=null;try{c=sessionStorage.getItem("enteredDoor");sessionStorage.removeItem("enteredDoor")}catch(e){}
  if(!c||RM)return;
  document.body.classList.add("entering");
  const v=document.createElement("div");v.className="enter-veil";v.style.setProperty("--veil",c);document.body.appendChild(v);
  requestAnimationFrame(()=>requestAnimationFrame(()=>v.classList.add("out")));
  setTimeout(()=>{v.remove();document.body.classList.remove("entering")},1400);
})();

/* ---------- reveal on scroll ---------- */
(()=>{const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.12});
  $$(".reveal").forEach(el=>io.observe(el));})();

/* ---------- shared lightbox ---------- */
const lightbox=(()=>{
  const lb=document.createElement("div");lb.className="lightbox";lb.innerHTML=`<button class="close">Close ✕</button><div class="big"></div>`;
  document.body.appendChild(lb);const big=lb.querySelector(".big");
  const close=()=>lb.classList.remove("open");lb.querySelector(".close").onclick=close;lb.onclick=e=>{if(e.target===lb)close()};
  addEventListener("keydown",e=>{if(e.key==="Escape")close()});
  return html=>{big.innerHTML=html;lb.classList.add("open")};
})();

/* ---------- click any content image to see it big ---------- */
document.addEventListener("click",e=>{const im=e.target.closest(".shot__img img,.ph.has-img img");
  if(!im||document.documentElement.classList.contains("editing"))return;lightbox(`<img src="${im.src}" alt="${im.alt||""}">`)});

/* ---------- case-study table of contents: highlight current section ---------- */
(()=>{const toc=$(".toc");if(!toc)return;const links=[...toc.querySelectorAll("a[href^='#']")];
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle("on",a.getAttribute("href")==="#"+e.target.id))}),{rootMargin:"-30% 0px -60% 0px"});
  links.forEach(a=>{const s=document.querySelector(a.getAttribute("href"));if(s)io.observe(s)});})();
