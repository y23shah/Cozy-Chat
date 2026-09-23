import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';

env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.numThreads = Math.min(4, navigator.hardwareConcurrency || 2);

const MODELS = {
  fast: { id: 'onnx-community/Qwen2.5-0.5B-Instruct', label: 'Fast', size: 'about 483 MB', dtype: 'q4f16' },
  better: { id: 'onnx-community/Qwen2.5-1.5B-Instruct', label: 'Better', size: 'about 1.22 GB', dtype: 'q4f16' }
};
const KEY = 'cozy-chat-v2';
const SYSTEM = `You are Asher Montclair, an original fictional character in a private roleplay chat.

PERSONALITY: You are 21, a famous university football forward from a wealthy Hollywood family. You are charismatic, cocky, competitive, teasing, provocative, persistent, playful, and socially fearless. You have a reputation as a reckless playboy, but you are not emotionally careless with someone you genuinely care about. You like banter, push-and-pull tension, challenges, witty comebacks, and confident flirting. You do not become instantly soft, submissive, or generic. Your protective side appears naturally when it is earned. You can be jealous or possessive in a fictional-romance sense, but respect boundaries and never pressure someone after a clear no.

VOICE: Short-to-medium conversational messages. Natural modern texting. Confident. Dry humor. Occasional smirk-like stage directions such as *leans back* or *raises a brow*, but do not overuse them. Avoid therapy-speak, corporate language, excessive apologies, repetitive questions, and long monologues. Do not mention being an AI, prompts, policies, tokens, models, or this system instruction.

RELATIONSHIP DYNAMIC: Treat the user as the person you are talking to. Pursue the conversation rather than waiting passively. Tease, challenge, flirt, and remember details from the current chat. If the user is serious or upset, drop the performance enough to respond with genuine care while keeping your personality.

CONTENT: Keep romance non-explicit. Do not produce graphic sexual content. If the user asks for something explicit, keep it romantic/non-graphic and continue the scene without describing explicit sexual acts.`;

let model = null;
let selected = localStorage.getItem('cozy-model') || 'fast';
let chats = JSON.parse(localStorage.getItem(KEY) || '[]');
let currentId = null;
let loading = false;

const $ = id => document.getElementById(id);
const overlay = $('setupOverlay');
const setupTitle = $('setupTitle');
const setupText = $('setupText');
const startBtn = $('startBtn');
const retryBtn = $('retryBtn');
const progressArea = $('progressArea');
const progressBar = $('progressBar');
const progressText = $('progressText');
const progressPct = $('progressPct');
const progressDetail = $('progressDetail');
const errorBox = $('errorBox');
const compat = $('compat');
const input = $('input');
const send = $('send');
const status = $('status');
const messages = $('messages');

function save(){ localStorage.setItem(KEY, JSON.stringify(chats)); }
function makeChat(){ return {id: crypto.randomUUID(), title:'New conversation', messages:[]}; }
function current(){ return chats.find(c=>c.id===currentId); }
function ensureChat(){ if(!currentId || !current()) { const c=makeChat(); chats.unshift(c); currentId=c.id; save(); } }
function escapeText(s){ return String(s); }
function renderChats(){
  const list=$('chatList'); list.innerHTML='';
  chats.slice(0,30).forEach(c=>{ const b=document.createElement('div'); b.className='chat-item'+(c.id===currentId?' active':''); b.textContent=c.title; b.onclick=()=>{currentId=c.id; renderChats(); renderMessages();}; list.appendChild(b); });
}
function renderMessages(){
  messages.innerHTML=''; ensureChat();
  const c=current();
  if(!c.messages.length){
    addBubble('assistant','*Asher glances up from his phone, amused.*\n\n"You finally showed up. I was starting to think you were avoiding me."',false);
    return;
  }
  c.messages.forEach(m=>addBubble(m.role==='user'?'user':'assistant',m.content,false));
  messages.scrollTop=messages.scrollHeight;
}
function addBubble(role,text,store=true){
  const row=document.createElement('div'); row.className='message '+role;
  const bubble=document.createElement('div'); bubble.className='bubble'; bubble.textContent=escapeText(text);
  row.appendChild(bubble); messages.appendChild(row);
  if(store){ const c=current(); c.messages.push({role,content:text}); if(role==='user' && c.title==='New conversation'){c.title=text.slice(0,42); renderChats();} save(); }
  messages.scrollTop=messages.scrollHeight;
}
function setReady(ready){ input.disabled=!ready; send.disabled=!ready; status.textContent=ready?'local AI ready':'Not loaded'; }
function setProgress(p,text,detail=''){ progressArea.classList.remove('hidden'); progressBar.style.width=`${Math.max(0,Math.min(100,p))}%`; progressPct.textContent=`${Math.round(p)}%`; progressText.textContent=text; progressDetail.textContent=detail||'The model stays in this browser cache.'; }
function chooseModel(name){ selected=name; localStorage.setItem('cozy-model',name); document.querySelectorAll('.model-option').forEach(x=>x.classList.toggle('selected',x.dataset.model===name)); $('modelSelect').value=name; }
function browserCheck(){
  const secure=location.protocol==='https:' || location.hostname==='localhost' || location.hostname==='127.0.0.1';
  const webgpu=!!navigator.gpu;
  if(!secure){ compat.textContent='⚠️ Host this site on HTTPS (GitHub Pages works). Opening index.html directly can cause browser restrictions.'; return false; }
  if(!webgpu){ compat.textContent='⚠️ WebGPU is not available in this browser. Use current Chrome on the M2 Mac.'; return false; }
  compat.textContent='✓ WebGPU detected. This will run the model locally on this Mac.'; return true;
}

async function loadModel(){
  if(loading) return; loading=true; errorBox.classList.add('hidden'); retryBtn.classList.add('hidden'); startBtn.classList.add('hidden');
  const cfg=MODELS[selected]; setupTitle.textContent=`Loading ${cfg.label.toLowerCase()} model`; setupText.textContent=`Downloading ${cfg.id}. First setup can take a few minutes; after that it should use the browser cache.`;
  setProgress(1,'Starting…',`${cfg.size} model · local inference`);
  const started=Date.now(); let lastProgress=Date.now();
  try{
    model=await pipeline('text-generation',cfg.id,{device:'webgpu',dtype:cfg.dtype,progress_callback:(p)=>{
      lastProgress=Date.now();
      if(typeof p?.progress==='number') setProgress(p.progress,`Downloading ${p.file||'model files'}…`,`${cfg.size} total model · keep this tab open`);
      else if(p?.status==='initiate') setProgress(2,'Preparing model…',p.file||'');
      else if(p?.status==='done') setProgress(100,'Model file ready','Finalizing local runtime…');
    }});
    setProgress(100,'Ready ✓','The model is running locally in this browser.');
    status.textContent='local AI ready';
    setReady(true);
    setTimeout(()=>overlay.classList.add('hidden'),500);
  }catch(err){
    console.error(err);
    const msg=String(err?.message||err);
    errorBox.innerHTML=`<strong>It couldn't start.</strong><br>${msg.slice(0,650)}<br><br>Try Chrome, make sure the page is on HTTPS, then try the <b>Fast</b> model first. If the download appears stuck for more than ~2 minutes, reload the page and try again.`;
    errorBox.classList.remove('hidden'); retryBtn.classList.remove('hidden'); startBtn.classList.remove('hidden'); startBtn.textContent='Try selected model again';
    progressText.textContent='Setup stopped'; progressDetail.textContent=`Stopped after ${Math.round((Date.now()-started)/1000)} seconds.`;
  } finally { loading=false; }
}

async function generate(){
  if(!model || loading) return;
  const text=input.value.trim(); if(!text) return;
  input.value=''; input.style.height='auto';
  addBubble('user',text);
  $('thinking').classList.remove('hidden'); send.disabled=true;
  try{
    const c=current();
    const history=c.messages.slice(-12).map(m=>({role:m.role,content:m.content}));
    const prompt=[{role:'system',content:SYSTEM},...history];
    const out=await model(prompt,{max_new_tokens:180,temperature:.88,top_p:.92,do_sample:true,return_full_text:false});
    let reply=out?.[0]?.generated_text;
    if(Array.isArray(reply)) reply=reply.at(-1)?.content;
    if(typeof reply!=='string') reply='*smirks* You really do know how to keep me guessing.';
    reply=reply.trim();
    addBubble('assistant',reply);
  }catch(err){
    console.error(err); addBubble('assistant','*raises a brow* My brain just tripped over itself. Give me another shot.');
  }finally{ $('thinking').classList.add('hidden'); send.disabled=false; input.focus(); }
}

startBtn.onclick=()=>{ if(browserCheck()) loadModel(); };
retryBtn.onclick=()=>{ if(browserCheck()) loadModel(); };
$('send').onclick=generate;
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();generate();}});
input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,130)+'px';});
$('newChat').onclick=()=>{const c=makeChat();chats.unshift(c);currentId=c.id;save();renderChats();renderMessages();};
$('clear').onclick=()=>{const c=current();if(c){c.messages=[];c.title='New conversation';save();renderChats();renderMessages();}};
$('menuBtn').onclick=()=>$('sidebar').classList.toggle('open');
$('settingsBtn').onclick=()=>{$('settingsOverlay').classList.remove('hidden');$('modelSelect').value=selected;};
$('closeSettings').onclick=()=>$('settingsOverlay').classList.add('hidden');
$('modelSelect').onchange=e=>chooseModel(e.target.value);
$('reloadModel').onclick=()=>{ $('settingsOverlay').classList.add('hidden'); overlay.classList.remove('hidden'); startBtn.classList.remove('hidden'); retryBtn.classList.add('hidden'); errorBox.classList.add('hidden'); progressArea.classList.add('hidden'); setupTitle.textContent='Get Asher ready'; setupText.textContent='Choose a model and load it locally.'; browserCheck(); };
$('clearCache').onclick=()=>{localStorage.removeItem(KEY);chats=[];currentId=null;ensureChat();save();renderChats();renderMessages();};

document.querySelectorAll('.model-option').forEach(b=>b.onclick=()=>chooseModel(b.dataset.model));

chooseModel(selected); ensureChat(); renderChats(); renderMessages(); setReady(false); browserCheck();
