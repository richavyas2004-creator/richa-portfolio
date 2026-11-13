/* Site editor: change text and images without touching layout.
   HOW TO USE
   1. Open any page with ?edit at the end, e.g. index.html?edit
   2. Click any text to type over it. Use the buttons on images to add, replace or remove them.
      Galleries, the Wall of Fame and work-sample lines also have "+ Add image".
   3. Your changes save in this browser as you go.
   4. Click "Save to site": a small file downloads (e.g. edits-index.js). Upload it to GitHub,
      replacing the old one. Everyone now sees your changes.  */
(()=>{
  const PAGE=(location.pathname.split("/").pop()||"index.html").replace(/\.html?$/,"")||"index";
  const EDIT=/[?&]edit\b/.test(location.search);
  const empty=()=>({slots:{},extra:{},text:{}});
  const norm=v=>Object.assign(empty(),v||{});
  let base=norm(window.SITE_EDITS);
  try{const t=document.getElementById("img-data");if(t){const o=JSON.parse(t.textContent||"{}");base.slots=Object.assign({},o.slots,base.slots);base.extra=Object.assign({},o.extra,base.extra)}}catch(e){}
  let state=JSON.parse(JSON.stringify(base));

  /* ---------- storage for drafts (IndexedDB: images are too big for localStorage) ---------- */
  const KEY="draft:"+PAGE;
  const db=new Promise(res=>{try{const r=indexedDB.open("site-edits",1);r.onupgradeneeded=()=>r.result.createObjectStore("d");r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)}catch(e){res(null)}});
  const get=async()=>{const d=await db;if(!d)return null;return new Promise(r=>{try{const q=d.transaction("d").objectStore("d").get(KEY);q.onsuccess=()=>r(q.result||null);q.onerror=()=>r(null)}catch(e){r(null)}})};
  const put=async v=>{const d=await db;if(!d)return;try{d.transaction("d","readwrite").objectStore("d").put(v,KEY)}catch(e){}};
  const del=async()=>{const d=await db;if(!d)return;try{d.transaction("d","readwrite").objectStore("d").delete(KEY)}catch(e){}};

  /* ---------- text: which elements, and how to find them again ---------- */
  const TEXT_SEL="h1,h2,h3,h4,p,li,dt,dd,th,td,figcaption,summary,small,.stk,.eyebrow,.dlabel,.plate,.btn,.chip,.tags span,.cap,.lab,.k span,.w,.r";
  const main=()=>document.querySelector("main");
  const pathOf=el=>{const p=[];let n=el;const m=main();while(n&&n!==m){p.unshift([...n.parentElement.children].indexOf(n));n=n.parentElement}return p.join(".")};
  const byPath=p=>{let n=main();for(const i of p.split(".")){n=n&&n.children[+i];if(!n)return null}return n};
  const loose=t=>(t||"").replace(/[\d\s,.]+/g,"");   // ignore numbers that animate (timeline counters)
  const candidates=()=>[...main().querySelectorAll(TEXT_SEL)].filter(el=>!el.closest(".ed-ui,[data-slot] img,svg")&&!el.parentElement.closest(TEXT_SEL)&&el.textContent.trim());
  const applyText=()=>Object.entries(state.text||{}).forEach(([p,r])=>{const el=byPath(p);if(el&&loose(el.textContent)===loose(r.o))el.innerHTML=r.h});

  /* ---------- images ---------- */
  const slotEl=id=>document.querySelector(`[data-slot="${CSS.escape(id)}"]`);
  function setSlot(el,src){
    if(!el)return;
    if(el.dataset.orig===undefined)el.dataset.orig=el.innerHTML;
    if(src){const img=el.querySelector(":scope > img");
      if(img&&el.classList.contains("shot__img"))img.src=src;else el.innerHTML=`<img src="${src}" alt="" loading="lazy">`;
      el.classList.add("has-img")}
    else{el.innerHTML=el.dataset.orig;el.classList.toggle("has-img",!!el.querySelector(":scope > img"))}
    if(EDIT)addTools(el);
  }
  function makeExtra(box,item){
    const tpl=[...box.children].find(c=>!c.dataset.extra&&(c.matches("[data-slot]")||c.querySelector("[data-slot]")));
    if(!tpl)return;
    const n=tpl.cloneNode(true);n.dataset.extra=item.id;n.querySelectorAll(".ed-tools").forEach(t=>t.remove());
    const s=n.matches("[data-slot]")?n:n.querySelector("[data-slot]");
    s.dataset.slot=item.id;delete s.dataset.orig;
    box.appendChild(n);
    box.dispatchEvent(new CustomEvent("ed:extra",{detail:n}));
    setSlot(s,item.src);
  }
  function render(){
    applyText();
    Object.entries(state.slots||{}).forEach(([id,src])=>setSlot(slotEl(id),src));
    Object.entries(state.extra||{}).forEach(([k,list])=>{const box=document.querySelector(`[data-add="${CSS.escape(k)}"]`);if(box)list.forEach(it=>makeExtra(box,it))});
  }
  render();
  if(!EDIT)return;

  /* ================= edit mode ================= */
  const root=document.documentElement;root.classList.add("editing");
  const css=document.createElement("style");css.textContent=`
  .editing .print,.editing .pf,.editing .doodle,.editing .flip__in{animation:none!important;transform:none!important;rotate:0deg!important;opacity:1!important}
  .editing .print:hover .paper,.editing .pf:hover .pf__s,.editing .unit:hover{transform:none!important}
  .editing .flip__b{display:none}.editing .flip__f{position:relative}
  .editing .reveal{opacity:1!important;transform:none!important}
  .editing [data-ed]{outline:1.5px dashed rgba(47,95,208,.45);outline-offset:2px;cursor:text;border-radius:2px}
  .editing [data-ed]:hover{outline-color:#2F5FD0}
  .editing [data-ed]:focus{outline:2px solid #2F5FD0;background:rgba(47,95,208,.06)}
  .editing [data-slot]{outline:2px dashed #2F5FD0;outline-offset:3px;position:relative}
  .ed-tools{position:absolute;top:8px;left:8px;z-index:30;display:flex;gap:6px;flex-wrap:wrap}
  .ed-ui button,.ed-ui.ed-add{font:600 12px/1 "DM Sans",system-ui,sans-serif;padding:8px 12px;border-radius:999px;border:1.5px solid #1F2A6B;background:#fff;color:#1F2A6B;cursor:pointer;box-shadow:2px 2px 0 #1F2A6B;letter-spacing:0;text-transform:none}
  .ed-ui button.p{background:#2F5FD0;color:#fff}
  .ed-ui.ed-add{display:flex;align-items:center;justify-content:center;min-height:120px;min-width:140px;border-style:dashed;box-shadow:none;background:rgba(47,95,208,.08);font-size:14px;flex:none;align-self:center}
  #board>.ed-add{position:absolute;left:50%;bottom:-70px;translate:-50% 0;min-height:56px;z-index:6}
  .editing .pf__in{position:absolute!important;overflow:visible}
  .pf .ed-tools{top:2px;left:2px;gap:3px}.pf .ed-tools button{padding:4px 7px;font-size:10px}
  .ed-bar{position:fixed;left:50%;bottom:18px;translate:-50% 0;z-index:400;display:flex;gap:8px;align-items:center;padding:10px 12px;border-radius:999px;background:#1F2A6B;color:#fff;font:500 13px "DM Sans",system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25);flex-wrap:wrap;justify-content:center;max-width:94vw}
  .ed-bar span{padding:0 6px}.ed-bar i{font-style:normal;opacity:.7;font-size:12px}`;
  document.head.appendChild(css);

  let saveT;const save=()=>{clearTimeout(saveT);saveT=setTimeout(()=>{put(state);const s=document.querySelector("#edState");if(s)s.textContent="Saved in this browser"},300)};

  // nothing on the page reacts to clicks while editing (no links, doors, lightboxes) except the editor's own buttons
  ["click","submit"].forEach(t=>document.addEventListener(t,e=>{if(!e.target.closest(".ed-ui")){e.preventDefault();e.stopPropagation()}},true));

  /* text editing */
  function makeEditable(){
    candidates().forEach(el=>{if(el.dataset.ed)return;
      const p=pathOf(el);el.dataset.ed=p;el.contentEditable="true";el.spellcheck=true;
      el.dataset.o=(state.text[p]&&state.text[p].o)||el.textContent;el.dataset.oh=el.dataset.oh||el.innerHTML;
      el.addEventListener("input",()=>{const k=el.dataset.ed;
        if(el.innerHTML===el.dataset.oh&&!(base.text[k]))delete state.text[k];else state.text[k]={o:el.dataset.o,h:el.innerHTML};
        const s=document.querySelector("#edState");if(s)s.textContent="Saving…";save()});
      el.addEventListener("paste",e=>{e.preventDefault();document.execCommand("insertText",false,(e.clipboardData||window.clipboardData).getData("text/plain"))});
      el.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();if(e.shiftKey)document.execCommand("insertLineBreak")}});
    });
  }

  /* images */
  const pick=()=>new Promise(res=>{const i=document.createElement("input");i.type="file";i.accept="image/*";i.onchange=()=>res(i.files[0]||null);i.click()});
  const shrink=file=>new Promise(res=>{
    if(file.type==="image/gif"||file.type==="image/svg+xml"){const r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(file);return}
    const im=new Image();im.onload=()=>{const max=1800,k=Math.min(1,max/Math.max(im.width,im.height));
      const c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
      c.getContext("2d").drawImage(im,0,0,c.width,c.height);
      let out=c.toDataURL("image/webp",.85);if(!out.startsWith("data:image/webp"))out=c.toDataURL("image/jpeg",.86);
      URL.revokeObjectURL(im.src);res(out)};
    im.src=URL.createObjectURL(file)});
  function addTools(el){
    el.querySelector(":scope > .ed-tools")?.remove();
    const t=document.createElement("div");t.className="ed-tools ed-ui";
    const extraItem=el.closest("[data-extra]"),has=el.classList.contains("has-img")||!!el.querySelector(":scope > img");
    t.innerHTML=`<button class="p" data-a="rep">${has?"Replace image":"Add image"}</button>`+(extraItem||state.slots[el.dataset.slot]?`<button data-a="rm">Remove</button>`:"");
    t.addEventListener("click",async e=>{e.preventDefault();const a=e.target.dataset.a;if(!a)return;const id=el.dataset.slot;
      if(a==="rep"){const f=await pick();if(!f)return;const src=await shrink(f);
        if(extraItem){for(const k in state.extra){const it=state.extra[k].find(x=>x.id===id);if(it)it.src=src}}else state.slots[id]=src;
        setSlot(el,src);save()}
      if(a==="rm"){if(extraItem){for(const k in state.extra)state.extra[k]=state.extra[k].filter(x=>x.id!==id);extraItem.remove()}
        else{delete state.slots[id];setSlot(el,null)}save()}});
    el.appendChild(t);
  }
  function addButtons(){
    document.querySelectorAll("[data-add]").forEach(box=>{if(box.querySelector(":scope > .ed-add"))return;
      const b=document.createElement("button");b.className="ed-add ed-ui";b.textContent="+ Add image";
      b.onclick=async e=>{e.preventDefault();const f=await pick();if(!f)return;
        const k=box.dataset.add,it={id:k+"-x"+Date.now().toString(36),src:await shrink(f)};
        (state.extra[k]=state.extra[k]||[]).push(it);makeExtra(box,it);save()};
      box.prepend(b)});
  }

  get().then(d=>{
    if(d){state=norm(d);
      document.querySelectorAll("[data-extra]").forEach(n=>n.remove());
      document.querySelectorAll("[data-slot]").forEach(el=>{if(el.dataset.orig!==undefined)setSlot(el,null)});
      render()}
    document.querySelectorAll("[data-slot]").forEach(addTools);
    addButtons();makeEditable();
  });

  const bar=document.createElement("div");bar.className="ed-bar ed-ui";
  bar.innerHTML=`<span>Editing · click text to type, use buttons on images</span><i id="edState"></i><button class="p" data-a="dl">Save to site</button><button data-a="reset">Undo all unsaved</button><button data-a="x">Exit</button>`;
  document.body.appendChild(bar);
  bar.addEventListener("click",async e=>{const a=e.target.dataset.a;if(!a)return;
    if(a==="x")location.href=location.pathname+location.hash;
    if(a==="reset"&&confirm("Throw away the changes on this page that you haven't saved to the site?")){await del();location.reload()}
    if(a==="dl"){
      const js="/* Edits for "+PAGE+".html, made with the site editor. */\nwindow.SITE_EDITS="+JSON.stringify(state).replace(/</g,"\\u003c")+";\n";
      const a2=document.createElement("a");a2.className="ed-ui";a2.href=URL.createObjectURL(new Blob([js],{type:"text/javascript"}));a2.download="edits-"+PAGE+".js";document.body.appendChild(a2);a2.click();a2.remove();
      setTimeout(()=>alert(`Downloaded "edits-${PAGE}.js".

Upload it to your GitHub repository (Add file > Upload files) to replace the old "edits-${PAGE}.js". The live site updates in 1-2 minutes.`),300);
    }});
})();
