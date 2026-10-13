import React,{useEffect,useMemo,useRef,useState} from 'react';

import { createPortal } from "react-dom";

import {createRoot} from 'react-dom/client';

import {io} from 'socket.io-client';

import {ArrowLeft,ArrowRight,BarChart3,Check,ChevronDown,Clock3,Copy,FileText,Flag,FolderKanban,GripVertical,Lightbulb,LogOut,MessageCircle,MoreHorizontal,Plus,RefreshCw,Send,Settings2,Sparkles,Target,ThumbsUp,Users,Wifi,WifiOff,X,Zap,Play,Pause,CheckCircle2,AlertTriangle,Search,SlidersHorizontal,MousePointer2,Pencil,Trash2} from 'lucide-react';

import './styles.css';



const API=import.meta.env.VITE_API_URL||'http://localhost:5000/api';

const SOCKET=import.meta.env.VITE_SOCKET_URL||'http://localhost:5000';

const api=async(path,opts={})=>{const token=localStorage.getItem('tt_token');const r=await fetch(API+path,{...opts,headers:{'Content-Type':'application/json',...(opts.headers||{}),...(token?{Authorization:'Bearer ' + token}:{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||'Something went wrong');return d};

const initials=n=>(n||'?').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();

const phases=['diverge','discuss','refine','converge','submit'];

const phaseLabel=p=>({diverge:'Diverge',discuss:'Discuss',refine:'Refine',converge:'Converge',submit:'Submit'}[p]||p);



function App(){

 const [user,setUser]=useState(()=>JSON.parse(localStorage.getItem('tt_user')||'null'));

 const [view,setView]=useState('overview'); const [activityId,setActivityId]=useState(null); const [classroomId,setClassroomId]=useState(null);

 const logout=()=>{localStorage.clear();setUser(null)};

 if(!user)return <Auth onLogin={u=>setUser(u)}/>;

 return <div className="app-shell"><Sidebar user={user} view={view} setView={setView} logout={logout}/><main className="main"><Topbar user={user}/>{view==='activity'&&activityId?<ActivityPage user={user} id={activityId} back={()=>setView('overview')}/>:view==='compare'&&classroomId?<ComparePage user={user} classroomId={classroomId}/>:<Overview user={user} openActivity={(id,cid)=>{setActivityId(id);setClassroomId(cid);setView('activity')}} openCompare={cid=>{setClassroomId(cid);setView('compare')}}/>}</main></div>

}



function Auth({onLogin}){const [mode,setMode]=useState('login');const [role,setRole]=useState('student');const [form,setForm]=useState({name:'',email:'',password:''});const [error,setError]=useState('');const [busy,setBusy]=useState(false);const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{const d=await api(`/auth/${mode==='login'?'login':'register'}`,{method:'POST',body:JSON.stringify({...form,role})});localStorage.setItem('tt_token',d.token);localStorage.setItem('tt_user',JSON.stringify(d.user));onLogin(d.user)}catch(e){setError(e.message)}finally{setBusy(false)}};return <div className="auth"><div className="auth-art"><div className="brand auth-brand"><div className="brand-icon"><Sparkles size={18}/></div><div><strong>Thinking Together</strong><small>Classroom Studio</small></div></div><div className="art-copy"><p className="eyebrow">A CLASSROOM MADE FOR THINKING</p><h1>Ideas should move.<br/><span>People should too.</span></h1><p>Not another blank canvas. A focused workspace where groups think, build, challenge, and converge together.</p><div className="art-board"><StickyMini x="8%" y="17%" rot="-4deg" text="What if campus felt more human?"/><StickyMini x="48%" y="9%" rot="5deg" text="Make it accessible first."/><StickyMini x="27%" y="56%" rot="-2deg" text="Build on this idea →"/><div className="board-line one"/><div className="board-line two"/><div className="board-center"><Sparkles size={19}/><span>THINK<br/>TOGETHER</span></div></div><div className="mini-flow"><span>01 Diverge</span><ArrowRight size={14}/><span>02 Discuss</span><ArrowRight size={14}/><span>03 Refine</span><ArrowRight size={14}/><span>04 Submit</span></div></div></div><form className="auth-card" onSubmit={submit}><div><p className="eyebrow">{mode==='login'?'WELCOME BACK':'GET STARTED'}</p><h2>{mode==='login'?'Good to see you.':'Create your workspace.'}</h2><p className="muted">{mode==='login'?'Enter your details to continue.':'Build better classroom conversations together.'}</p></div>{mode==='register'&&<Field label="Full name"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Menahil Faiz" required/></Field>}<Field label="Email"><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com" required/></Field><Field label="Password"><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••" required/></Field>{mode==='register'&&<div className="role-switch"><button type="button" className={role==='student'?'active':''} onClick={()=>setRole('student')}>Student</button><button type="button" className={role==='instructor'?'active':''} onClick={()=>setRole('instructor')}>Instructor</button></div>}{error&&<div className="error">{error}</div>}<button className="primary wide" disabled={busy}>{busy?'Please wait…':mode==='login'?'Enter Thinking Together':'Create account'} {!busy&&<ArrowRight size={17}/>}</button><button type="button" className="text-btn" onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login'?"Don't have an account? Create one":"Already have an account? Sign in"}</button></form></div>}

function StickyMini({x,y,rot,text}){return <div className="sticky-mini" style={{left:x,top:y,transform:`rotate(${rot})`}}><span>{text}</span></div>}

function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}



function Sidebar({user,view,setView,logout}){return <aside className="sidebar"><div className="brand"><div className="brand-icon"><Sparkles size={18}/></div><div><strong>Thinking Together</strong><small>Classroom Studio</small></div></div><div className="nav-label">WORKSPACE</div><Nav icon={<FolderKanban size={17}/>} text="Overview" active={view==='overview'} onClick={()=>setView('overview')}/>{user.role==='instructor'&&<Nav icon={<BarChart3 size={17}/>} text="Compare groups" active={view==='compare'} onClick={()=>setView('compare')}/>}<div className="sidebar-tip"><Sparkles size={15}/><span><b>Design principle</b>Every screen answers “what should I do next?”</span></div><div className="sidebar-bottom"><div className="profile-mini"><div className="avatar">{initials(user.name)}</div><div><strong>{user.name}</strong><small>{user.role}</small></div></div><button className="logout" onClick={logout} title="Sign out"><LogOut size={16}/></button></div></aside>}

function Nav({icon,text,active,onClick}){return <button className={`nav ${active?'active':''}`} onClick={onClick}>{icon}<span>{text}</span>{active&&<i/>}</button>}

function Topbar({user}){const [online,setOnline]=useState(navigator.onLine);useEffect(()=>{const a=()=>setOnline(true),b=()=>setOnline(false);window.addEventListener('online',a);window.addEventListener('offline',b);return()=>{window.removeEventListener('online',a);window.removeEventListener('offline',b)}},[]);return <header className="topbar"><div className="crumb-wrap"><span className="crumb">{user.role==='instructor'?'Instructor workspace':'Student workspace'}</span><ChevronDown size={14}/></div><div className="top-actions"><span className={`connection ${online?'on':''}`}><span/> {online?'Connected':'Offline'}</span><div className="avatar">{initials(user.name)}</div></div></header>}



function Overview({user,openActivity,openCompare}){
 const [classes,setClasses]=useState([]);
 const [showJoin,setShowJoin]=useState(false);
 const [showCreate,setShowCreate]=useState(false);
 const [joinCode,setJoinCode]=useState('');
 const [error,setError]=useState('');
 const load=()=>api('/classrooms').then(setClasses).catch(e=>setError(e.message));
 useEffect(()=>{load()},[]);
 return <div className="content">
  <section className="hero-row"><div><div className="eyebrow-row"><span className="eyebrow">{user.role==='instructor'?'INSTRUCTOR COCKPIT':'YOUR LEARNING SPACE'}</span><span className="hero-chip"><Zap size={13}/> HCI-first</span></div><h1>{user.role==='instructor'?'Make every group visible.':'Bring your ideas to life.'}</h1><p className="lead">{user.role==='instructor'?'One calm command center for the room: progress, participation, ideas, and the moments that need your attention.':'A focused whiteboard for classroom thinking — built around your group, your ideas, and the next useful step.'}</p></div><div className="hero-stat"><div className="hero-orbit"><Sparkles size={25}/></div><strong>{classes.length}</strong><span>active classroom{classes.length===1?'':'s'}</span></div></section>
  <div className="section-head"><div><h2>{user.role==='instructor'?'Your classrooms':'Joined classrooms'}</h2><p>Everything for the next conversation.</p></div><div className="section-actions">{user.role==='student'&&<button className="secondary" onClick={()=>setShowJoin(true)}><Plus size={16}/> Join classroom</button>}{user.role==='instructor'&&<button className="primary" onClick={()=>setShowCreate(true)}><Plus size={16}/> New classroom</button>}</div></div>
  {error&&<div className="error banner">{error}</div>}
  <div className="class-grid">{classes.map(c=><ClassroomCard key={c._id} c={c} user={user} openActivity={openActivity} openCompare={openCompare} onDeleted={id=>setClasses(current=>current.filter(item=>String(item._id)!==String(id)))}/>)}
   {!classes.length&&<Empty title="No classrooms yet" text={user.role==='instructor'?'Create your first classroom and invite students with its code.':'Ask your instructor for a classroom code to get started.'}/>}
  </div>
  {showJoin&&<JoinModal close={()=>setShowJoin(false)} onJoined={c=>{setClasses([c,...classes]);setShowJoin(false)}} code={joinCode} setCode={setJoinCode}/>}
  {showCreate&&<CreateClassModal close={()=>setShowCreate(false)} onCreated={c=>{setClasses([c,...classes]);setShowCreate(false)}}/>}
 </div>
}



function ClassroomCard({c,user,openActivity,openCompare,onDeleted}){
 const [activity,setActivity]=useState(c.activities?.[0]||null);
 const [showActivity,setShowActivity]=useState(false);
 const [showGroups,setShowGroups]=useState(false);
 const [confirmDelete,setConfirmDelete]=useState(false);
 const [codeCopied,setCodeCopied]=useState(false);
 const copyTimer=useRef(null);
 const load=async()=>{const a=await api('/activities?classroomId='+c._id);setActivity(a[0]||null)};
 useEffect(()=>{if(!activity)load()},[]);
 useEffect(()=>()=>clearTimeout(copyTimer.current),[]);
 const copyClassroomCode=async()=>{
  try{
   if(!navigator.clipboard?.writeText)throw new Error('Clipboard access is unavailable');
   await navigator.clipboard.writeText(c.joinCode);
   setCodeCopied(true);
   clearTimeout(copyTimer.current);
   copyTimer.current=setTimeout(()=>setCodeCopied(false),2000);
  }catch(error){
   console.error('Unable to copy classroom code',error);
  }
 };
 const deleteClassroom=async()=>{await api(`/classrooms/${c._id}`,{method:'DELETE'});onDeleted(c._id);setConfirmDelete(false)};
 const status=activity?.status||'no-activity';
 return <article className="class-card">
  <div className="class-card-top"><div className="class-icon"><Lightbulb size={18}/></div><div className="class-title"><span className="pill">{user.role==='instructor'?'TEACHING':'ENROLLED'}</span><h3>{c.name}</h3></div>{user.role==='instructor'&&<ClassroomActionMenu classroom={c} onDelete={()=>setConfirmDelete(true)}/>}</div>
  <p>{c.description||'A collaborative Thinking Together classroom.'}</p>
  <div className="class-meta">
   <span><Users size={14}/>{Math.max(1,c.members?.length||0)} members</span>
   <button type="button" className={`join-code ${codeCopied?'copied':''}`} onClick={copyClassroomCode} aria-label={codeCopied?'Classroom code copied':'Copy classroom code'} title={codeCopied?'Classroom code copied':'Copy classroom code'}><span className="copy-code-icon">{codeCopied?<Check size={13}/>:<Copy size={13}/>}</span> {c.joinCode}</button>
  </div>
  {activity?<div className={`activity-preview ${status}`}><div className="activity-mark"><Sparkles size={16}/></div><div className="activity-preview-copy"><span>{status==='live'?'LIVE NOW':status==='paused'?'PAUSED':status==='completed'?'COMPLETED':'DRAFT'}</span><strong>{activity.title}</strong><small>{activity.problem}</small></div><button className="arrow-btn" onClick={()=>openActivity(activity._id,c._id)}><ArrowRight size={17}/></button></div>:<div className="empty-inline"><span>No activity yet.</span>{user.role==='instructor'&&<button className="text-btn-inline" onClick={()=>setShowActivity(true)}>Create one <ArrowRight size={14}/></button>}</div>}
  <div className="card-footer">{user.role==='instructor'?<><button className="ghost" onClick={()=>setShowActivity(true)}><Plus size={14}/> Activity</button><button className="ghost" onClick={()=>openCompare(c._id)}><BarChart3 size={14}/> Compare</button><button className="ghost" onClick={()=>setShowGroups(true)}><Users size={14}/> Groups</button></>:<button className="ghost" onClick={()=>activity&&openActivity(activity._id,c._id)}><MousePointer2 size={14}/> Open workspace</button>}</div>
  {showActivity&&<CreateActivityModal classroom={c} close={()=>setShowActivity(false)} created={a=>{setActivity(a);setShowActivity(false)}}/>}
  {showGroups&&<GroupsModal classroom={c} close={()=>setShowGroups(false)}/>}
  {confirmDelete&&<DeleteClassroomModal onClose={()=>setConfirmDelete(false)} onConfirm={deleteClassroom}/>}
 </article>
}

function ClassroomActionMenu({classroom,onDelete}){
 const [open,setOpen]=useState(false);
 const [position,setPosition]=useState({top:0,left:0});
 const triggerRef=useRef(null);
 const menuRef=useRef(null);
 const placeMenu=()=>{const rect=triggerRef.current?.getBoundingClientRect();if(!rect)return;const width=184;const height=48;setPosition({left:Math.max(12,Math.min(rect.right-width,window.innerWidth-width-12)),top:rect.bottom+height+12>window.innerHeight?Math.max(12,rect.top-height-6):rect.bottom+6})};
 useEffect(()=>{if(!open)return;placeMenu();const outside=e=>{if(!triggerRef.current?.contains(e.target)&&!menuRef.current?.contains(e.target))setOpen(false)};const key=e=>{if(e.key==='Escape')setOpen(false)};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);window.addEventListener('resize',placeMenu);window.addEventListener('scroll',placeMenu,true);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);window.removeEventListener('resize',placeMenu);window.removeEventListener('scroll',placeMenu,true)}},[open]);
 return <><button ref={triggerRef} type="button" className="group-menu-trigger" aria-label={`Actions for ${classroom.name}`} aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><MoreHorizontal size={19}/></button>{open&&createPortal(<div ref={menuRef} className="group-menu" role="menu" style={{top:position.top,left:position.left}}><button type="button" className="menu-item danger" role="menuitem" onClick={()=>{setOpen(false);onDelete()}}><Trash2 size={15}/>Delete classroom</button></div>,document.body)}</>
}

function DeleteClassroomModal({onClose,onConfirm}){
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const submit=async()=>{setBusy(true);setError('');try{await onConfirm()}catch(e){setError(e.message)}finally{setBusy(false)}};
 return <Modal close={()=>{if(!busy)onClose()}} eyebrow="DELETE CLASSROOM" title="Delete this classroom?" subtitle="Are you sure you want to delete this classroom? This action may permanently remove its associated activities and data."><div className="modal-actions"><button className="secondary" disabled={busy} onClick={onClose}>Cancel</button><button className="primary danger" disabled={busy} onClick={submit}>{busy?'Deleting…':'Delete classroom'}</button></div>{error&&<div className="error" role="alert">{error}</div>}</Modal>
}



function JoinModal({close,onJoined,code,setCode}){const [busy,setBusy]=useState(false);const [error,setError]=useState('');const join=async()=>{setBusy(true);setError('');try{const c=await api('/classrooms/join',{method:'POST',body:JSON.stringify({joinCode:code})});onJoined(c)}catch(e){setError(e.message)}finally{setBusy(false)}};return <Modal close={close} eyebrow="JOIN CLASSROOM" title="Enter your classroom code" subtitle="Your instructor's 5-character code is the key to your workspace."><input className="code-input" autoFocus value={code} onChange={e=>setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="e.g. A7KQ2"/><div className="modal-actions"><button className="secondary" onClick={close}>Cancel</button><button className="primary" onClick={join} disabled={busy}>{busy?'Joining…':'Join classroom'} <ArrowRight size={16}/></button></div>{error&&<div className="error">{error}</div>}</Modal>}

function CreateClassModal({close,onCreated}){const [form,setForm]=useState({name:'',description:''});const [busy,setBusy]=useState(false);const [error,setError]=useState('');const submit=async()=>{setBusy(true);try{const c=await api('/classrooms',{method:'POST',body:JSON.stringify(form)});onCreated(c)}catch(e){setError(e.message)}finally{setBusy(false)}};return <Modal close={close} eyebrow="NEW CLASSROOM" title="Set up the room" subtitle="Keep the name clear. Students should know exactly where they are. "><Field label="Classroom name"><input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. HCI — Section B"/></Field><Field label="Short description"><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What will students explore here?"/></Field><div className="modal-actions"><button className="secondary" onClick={close}>Cancel</button><button className="primary" onClick={submit} disabled={!form.name.trim()||busy}>{busy?'Creating…':'Create classroom'} <ArrowRight size={16}/></button></div>{error&&<div className="error">{error}</div>}</Modal>}

function CreateActivityModal({classroom,close,created})

{const [form,setForm]=useState({title:'',problem:'',instructions:'',duration:45});

const [busy,setBusy]=useState(false);const [error,setError]=useState('');

const submit=async()=>{setBusy(true);

    try{const deadline=new Date(Date.now()+Number(form.duration)*60000).toISOString();const a=await api('/activities',{method:'POST',body:JSON.stringify({classroomId:classroom._id,title:form.title,problem:form.problem,instructions:form.instructions,deadline})});created(a)}catch(e){setError(e.message)}finally{setBusy(false)}};return <Modal close={close} eyebrow="NEW BRAINSTORM" title="Give the room a question worth exploring." subtitle="The prompt is the anchor. Keep it open enough for ideas, specific enough for action."><Field label="Activity title"><input autoFocus value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Design a better campus experience"/></Field><Field label="Problem / challenge"><textarea rows="4" value={form.problem} onChange={e=>setForm({...form,problem:e.target.value})} placeholder="How might we…?"/></Field><Field label="Instructions"><textarea rows="3" value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})} placeholder="Build on ideas. Ask before you dismiss. Prepare one final solution."/></Field><div className="two-fields"><Field label="Session length (minutes)"><input type="number" min="5" max="180" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}/></Field><div className="setting-preview"><Clock3 size={15}/><span>{form.duration} min live session</span></div></div><div className="modal-actions"><button className="secondary" onClick={close}>Cancel</button><button className="primary" disabled={!form.title.trim()||!form.problem.trim()||busy} onClick={submit}>{busy?'Creating…':'Create activity'} <ArrowRight size={16}/></button></div>{error&&<div className="error">{error}</div>}</Modal>}

function GroupsModal({classroom,close}){const [activities,setActivities]=useState([]);const [selected,setSelected]=useState(null);useEffect(()=>{api('/activities?classroomId='+classroom._id).then(a=>{setActivities(a);setSelected(a[0]?._id||null)})},[classroom._id]);return <Modal close={close} eyebrow="GROUPS" title="Shape the room before it starts." subtitle="Create groups and assign members. Students then see only their group's thinking space.">{selected?<GroupManager activityId={selected}/>:<Empty title="Create an activity first" text="Groups belong to a brainstorming activity."/>}{activities.length>1&&<select className="select" value={selected||''} onChange={e=>setSelected(e.target.value)}>{activities.map(a=><option key={a._id} value={a._id}>{a.title}</option>)}</select>}</Modal>}

function GroupManager({activityId}){const [data,setData]=useState(null);const [name,setName]=useState('');const [busy,setBusy]=useState(false);const [memberEditor,setMemberEditor]=useState(null);const [groupRename,setGroupRename]=useState(null);const [groupDelete,setGroupDelete]=useState(null);const load=()=>api('/activities/'+activityId).then(setData);useEffect(()=>{load()},[activityId]);if(!data)return <div className="loading-line"><RefreshCw className="spin"/> Loading groups…</div>;const add=async()=>{if(!name.trim())return;setBusy(true);try{await api('/activities/'+activityId+'/groups',{method:'POST',body:JSON.stringify({name})});setName('');load()}catch(e){alert(e.message)}finally{setBusy(false)}};const saveMembers=async(selectedIds)=>{if(!memberEditor)return;await api('/activities/groups/'+memberEditor._id,{method:'PATCH',body:JSON.stringify({members:selectedIds})});setMemberEditor(null);load()};const rename=async(nextName)=>{if(!groupRename)return;await api('/activities/groups/'+groupRename._id,{method:'PATCH',body:JSON.stringify({name:nextName})});setGroupRename(null);load()};const remove=async()=>{if(!groupDelete)return;await api('/activities/groups/'+groupDelete._id,{method:'DELETE'});setGroupDelete(null);load()};return <div className="group-manager"><div className="group-add"><input value={name} onChange={e=>setName(e.target.value)} placeholder="New group name"/><button className="primary" onClick={add} disabled={busy||!name.trim()}><Plus size={15}/></button></div>{data.groups.map(g=><div className="group-row group-row-expanded" key={g._id}><div className="group-dot"/><div className="group-row-main"><strong>{g.name}</strong><small>{g.members.length} members · {g.progressState}</small><div className="member-picks">{g.members.length?g.members.slice(0,5).map(m=><span key={m._id} className="member-chip" title={m.name}>{initials(m.name)}</span>):<span className="muted">No members yet</span>}</div></div><div className="group-actions"><GroupActionMenu group={g} onEditGroup={()=>setGroupRename(g)} onEditMembers={()=>setMemberEditor(g)} onDeleteGroup={()=>setGroupDelete(g)}/></div></div>)}{!data.groups.length&&<p className="muted">No groups yet. Add the first group above.</p>}{memberEditor&&<GroupMembersModal group={memberEditor} students={data.classroom?.members?.filter(m=>m.role==='student')||[]} groups={data.groups} onClose={()=>setMemberEditor(null)} onSave={saveMembers}/>}{groupRename&&<EditGroupModal group={groupRename} onClose={()=>setGroupRename(null)} onSave={rename}/>}{groupDelete&&<DeleteGroupModal group={groupDelete} onClose={()=>setGroupDelete(null)} onConfirm={remove}/>}</div>}

function GroupActionMenu({group,onEditGroup,onEditMembers,onDeleteGroup}){const [open,setOpen]=useState(false);const [position,setPosition]=useState({top:0,left:0});const triggerRef=useRef(null);const menuRef=useRef(null);const placeMenu=()=>{const rect=triggerRef.current?.getBoundingClientRect();if(!rect)return;const width=184;const height=132;setPosition({left:Math.max(12,Math.min(rect.right-width,window.innerWidth-width-12)),top:rect.bottom+height+12>window.innerHeight?Math.max(12,rect.top-height-6):rect.bottom+6})};useEffect(()=>{if(!open)return;placeMenu();const outside=e=>{if(!triggerRef.current?.contains(e.target)&&!menuRef.current?.contains(e.target))setOpen(false)};const key=e=>{if(e.key==='Escape')setOpen(false)};const reposition=()=>placeMenu();document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);window.addEventListener('resize',reposition);window.addEventListener('scroll',reposition,true);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);window.removeEventListener('resize',reposition);window.removeEventListener('scroll',reposition,true)}},[open]);const choose=action=>{setOpen(false);action()};return <><button ref={triggerRef} type="button" className="group-menu-trigger" aria-label={`Actions for ${group.name}`} aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><MoreHorizontal size={19}/></button>{open&&createPortal(<div ref={menuRef} className="group-menu" role="menu" style={{top:position.top,left:position.left}}><button type="button" className="menu-item" role="menuitem" onClick={()=>choose(onEditGroup)}><Pencil size={15}/>Edit group</button><button type="button" className="menu-item" role="menuitem" onClick={()=>choose(onEditMembers)}><Users size={15}/>Edit members</button><button type="button" className="menu-item danger" role="menuitem" onClick={()=>choose(onDeleteGroup)}><Trash2 size={15}/>Delete group</button></div>,document.body)}</>}

function GroupMembersModal({group,students,groups,onClose,onSave}){const [query,setQuery]=useState('');const [selected,setSelected]=useState(() => group.members.map(m => String(m._id||m)));const [busy,setBusy]=useState(false);const assignedElsewhere = new Set(groups.filter(g => String(g._id)!==String(group._id)).flatMap(g => (g.members || []).map(m => String(m._id || m))));const filtered = students.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));const toggle=(studentId)=>{const id=String(studentId);if(assignedElsewhere.has(id)&&!selected.includes(id))return;setSelected(curr=>curr.includes(id)?curr.filter(x=>x!==id):[...curr,id]);};return <Modal close={onClose} eyebrow="ADD STUDENTS" title={`Add students to ${group.name}`} subtitle="Select the learners who should belong to this group."><div className="member-picker"><div className="search member-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search students…"/></div><div className="student-list">{filtered.map(student=>{const sid=String(student._id);const taken=assignedElsewhere.has(sid)&&!selected.includes(sid);return <label key={student._id} className={`student-option ${selected.includes(sid)?'selected':''} ${taken?'locked':''}`}><input type="checkbox" checked={selected.includes(sid)} disabled={taken} onChange={()=>toggle(student._id)}/><span>{student.name}</span>{taken&&<small>Already assigned</small>}</label>})}{!filtered.length&&<p className="muted">No students match this search.</p>}</div><div className="picker-meta"><span>{selected.length} students selected</span></div><div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy} onClick={async()=>{setBusy(true);try{await onSave(selected)}catch(e){alert(e.message)}finally{setBusy(false)}}}>{busy?'Saving…':'Save'}</button></div></div></Modal>}

function EditGroupModal({group,onClose,onSave}){const [name,setName]=useState(group.name);const [busy,setBusy]=useState(false);return <Modal close={onClose} eyebrow="EDIT GROUP" title="Rename group" subtitle="Update how this group appears to students."><div className="group-edit-form"><Field label="Group name"><input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Group name"/></Field><div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={!name.trim()||busy} onClick={async()=>{setBusy(true);try{await onSave(name.trim())}catch(e){alert(e.message)}finally{setBusy(false)}}}>{busy?'Saving…':'Save changes'}</button></div></div></Modal>}

function DeleteGroupModal({group,onClose,onConfirm}){const [busy,setBusy]=useState(false);return <Modal close={onClose} eyebrow="DELETE GROUP" title={`Delete ${group.name}?`} subtitle="This will remove this group and its member assignments. This action cannot be undone."><div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary danger" disabled={busy} onClick={async()=>{setBusy(true);try{await onConfirm()}catch(e){alert(e.message)}finally{setBusy(false)}}}>{busy?'Deleting…':'Delete group'}</button></div></Modal>}

function Modal({close,eyebrow,title,subtitle,children}){return createPortal(<div className="modal" onMouseDown={e=>e.target===e.currentTarget&&close()}><div className="modal-card"><button className="close" onClick={close}><X size={18}/></button><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p className="muted modal-subtitle">{subtitle}</p>{children}</div></div>,document.body)}



function ActivityPage({user,id,back}){const [data,setData]=useState(null);const [connected,setConnected]=useState(false);const [tick,setTick]=useState(Date.now());const [error,setError]=useState('');const load=()=>api('/activities/'+id).then(setData).catch(e=>setError(e.message));useEffect(()=>{load();const s=io(SOCKET,{auth:{token:localStorage.getItem('tt_token')||''}});s.on('connect',()=>{setConnected(true);s.emit('activity:join',id)});s.on('disconnect',()=>setConnected(false));['activity:updated','group:updated','idea:created','idea:updated','idea:deleted','comment:created','vote:updated','submission:created','feedback:created'].forEach(ev=>s.on(ev,load));return()=>{s.emit('activity:leave',id);s.disconnect()}},[id]);useEffect(()=>{const t=setInterval(()=>setTick(Date.now()),1000);return()=>clearInterval(t)},[]);if(!data)return <div className="content"><button className="back" onClick={back}><ArrowLeft size={16}/> Back</button><Empty title={error||'Loading activity'} text="Preparing the collaborative room…" spinner/></div>;const a=data.activity;return <div className="content activity-page"><div className="activity-header"><div><button className="back" onClick={back}><ArrowLeft size={16}/> All classrooms</button><div className="activity-status"><span className={`status-dot ${a.status}`}/><b>{a.status.toUpperCase()}</b><span className="sep">·</span><span>{connected?<><Wifi size={13}/> Real-time</>:<><WifiOff size={13}/> Reconnecting</>}</span></div><h1>{a.title}</h1><p className="lead problem">{a.problem}</p></div><div className="timer"><Clock3 size={18}/><small>TIME LEFT</small><strong>{a.deadline?timeLeft(a.deadline,tick):'—'}</strong></div></div><PhaseBar activity={a} user={user} onPhase={async p=>{await api('/activities/'+id,{method:'PATCH',body:JSON.stringify({phase:p})});load()}} onStatus={async status=>{await api('/activities/'+id,{method:'PATCH',body:JSON.stringify({status})});load()}}/>{user.role==='instructor'?<InstructorWorkspace data={data} reload={load}/>:<StudentWorkspace user={user} data={data} reload={load}/>}</div>}

function PhaseBar({activity,user,onPhase,onStatus}){const current=phases.indexOf(activity.phase);return <div className="phase-shell"><div className="phase-flow"><div className="phase-intro"><span>THINKING FLOW</span><b>{phaseLabel(activity.phase)}</b></div>{phases.map((p,i)=><button key={p} disabled={user.role!=='instructor'} onClick={()=>onPhase(p)} className={`phase ${i<current?'done':''} ${p===activity.phase?'current':''}`}><span>{i<current?<Check size={12}/>:i+1}</span><div><b>{phaseLabel(p)}</b><small>{['Generate possibilities','Build on each other','Make ideas stronger','Choose what matters','Make it shareable'][i]}</small></div></button>)}</div>{user.role==='instructor'&&<div className="phase-controls">{activity.status==='live'?<button className="secondary small-btn" onClick={()=>onStatus('paused')}><Pause size={14}/> Pause</button>:activity.status==='completed'?<span className="status-badge"><CheckCircle2 size={14}/> Completed</span>:<button className="primary small-btn" onClick={()=>onStatus('live')}><Play size={14}/> {activity.status==='paused'?'Resume':'Start activity'}</button>}</div>}</div>}

function StudentWorkspace({user,data,reload}){const group=data.groups.find(g=>String(g._id)===String(data.myGroupId));const ideas=data.ideas.filter(i=>String(i.groupId)===String(group?._id));const [draft,setDraft]=useState('');const [desc,setDesc]=useState('');const [selected,setSelected]=useState([]);const [submitText,setSubmitText]=useState('');const [showSubmit,setShowSubmit]=useState(false);const create=async()=>{if(!draft.trim()||!group)return;await api(`/activities/${data.activity._id}/ideas`,{method:'POST',body:JSON.stringify({groupId:group._id,title:draft,description:desc,tags:[data.activity.phase]})});setDraft('');setDesc('');};const submit=async()=>{await api(`/activities/${data.activity._id}/submissions`,{method:'POST',body:JSON.stringify({groupId:group._id,selectedIdeaIds:selected,finalText:submitText})});setShowSubmit(false);reload()};if(!group)return <div className="no-group"><Users size={30}/><h2>You are not assigned to a group yet.</h2><p>Your instructor will place you in a group before the activity starts.</p></div>;return <div className="workspace-grid student-grid"><section className="whiteboard-panel"><div className="board-toolbar"><div><span className="eyebrow">YOUR GROUP</span><h2>{group.name}</h2></div><div className="board-actions"><span className="balance"><span/> {group.members.length} thinkers</span><button className="secondary" onClick={()=>setShowSubmit(true)}><CheckCircle2 size={15}/> Final solution</button></div></div><div className="board-canvas"><div className="canvas-grid"/><div className="canvas-hint"><MousePointer2 size={14}/> Your group's ideas live here</div>{ideas.map((idea,i)=><IdeaSticky key={idea._id} idea={idea} index={i} onVote={()=>api(`/activities/ideas/${idea._id}/vote`,{method:'POST'}).then(reload)} selected={selected.includes(idea._id)} toggle={()=>setSelected(s=>s.includes(idea._id)?s.filter(x=>x!==idea._id):[...s,idea._id])} comments={data.comments.filter(c=>String(c.ideaId)===String(idea._id))} reload={reload}/>) }{!ideas.length&&<div className="board-empty"><Lightbulb size={26}/><h3>Start with one honest thought.</h3><p>Good brainstorming is not about being clever on the first try.</p></div>}</div><div className="idea-composer board-composer"><div className="composer-avatar">{initials(user.name)}</div><div className="composer-fields"><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==='Enter'&&create()} placeholder="Drop a thought onto the board…"/><input className="subtle-input" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Optional context — why might this work?"/></div><button className="primary" onClick={create} disabled={!draft.trim()}><Plus size={16}/> Add idea</button></div></section><aside className="right-rail"><GroupPulse group={group} ideas={ideas} comments={data.comments}/><PromptCard phase={data.activity.phase}/><RulesCard/></aside>{showSubmit&&<SubmissionModal group={group} ideas={ideas} selected={selected} setSelected={setSelected} value={submitText} setValue={setSubmitText} close={()=>setShowSubmit(false)} submit={submit} existing={data.submissions.find(s=>String(s.groupId?._id||s.groupId)===String(group._id))}/>}</div>}


function InstructorWorkspace({data,reload}){
 const [selectedGroup,setSelectedGroup]=useState(data.groups[0]?._id||null);
 const [search,setSearch]=useState('');
 const [showReview,setShowReview]=useState(null);
 const [analytics,setAnalytics]=useState(null);
 const [memberEditor,setMemberEditor]=useState(null);
 const [groupRename,setGroupRename]=useState(null);
 const [groupDelete,setGroupDelete]=useState(null);
 useEffect(()=>{api('/activities/'+data.activity._id+'/analytics').then(setAnalytics).catch(()=>{})},[data.activity._id,data.groups.length,data.ideas.length,data.comments.length,data.submissions.length]);
 const groups=data.groups.map(g=>({id:g._id,name:g.name,members:g.members.length,ideas:data.ideas.filter(i=>String(i.groupId)===String(g._id)).length,comments:data.comments.filter(c=>data.ideas.some(i=>String(i._id)===String(c.ideaId)&&String(i.groupId)===String(g._id))).length,votes:0,participation:0,progress:g.progressState,submitted:Boolean(data.submissions.find(s=>String(s.groupId?._id||s.groupId)===String(g._id)))}));
 const filtered=groups.filter(g=>g.name.toLowerCase().includes(search.toLowerCase()));
 const g=data.groups.find(x=>String(x._id)===String(selectedGroup));
 const ideas=data.ideas.filter(i=>String(i.groupId)===String(selectedGroup));
 const saveMembers=async(selectedIds)=>{if(!memberEditor)return;await api('/activities/groups/'+memberEditor._id,{method:'PATCH',body:JSON.stringify({members:selectedIds})});setMemberEditor(null);reload()};
 const renameGroup=async(name)=>{if(!groupRename)return;await api('/activities/groups/'+groupRename._id,{method:'PATCH',body:JSON.stringify({name})});setGroupRename(null);reload()};
 const deleteGroup=async()=>{if(!groupDelete)return;await api('/activities/groups/'+groupDelete._id,{method:'DELETE'});setGroupDelete(null);const next=data.groups.filter(x=>String(x._id)!==String(groupDelete._id));setSelectedGroup(next[0]?._id||null);reload()};
 return <div className="instructor-grid">
  <section className="cockpit">
   <div className="cockpit-top"><div><span className="eyebrow">CLASSROOM COCKPIT</span><h2>See the room. Guide the room.</h2></div><div className="cockpit-actions"><div className="search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find a group…"/></div><button className="secondary"><SlidersHorizontal size={15}/> Signals</button></div></div>
   <div className="signal-row"><Signal label="Groups" value={groups.length}/><Signal label="Ideas" value={analytics?.totalIdeas??data.ideas.length}/><Signal label="Comments" value={analytics?.totalComments??data.comments.length}/><Signal label="Submissions" value={analytics?.totalSubmissions??data.submissions.length}/></div>
   <div className="group-table">
    <div className="table-head"><div className="table-head-main"><span>GROUP</span><span>PROGRESS</span><span>PARTICIPATION</span><span>THINKING</span><span>STATE</span></div><span className="table-head-action" aria-hidden="true"/></div>
    {filtered.map(row=>{
     const group=data.groups.find(x=>String(x._id)===String(row.id));
     const progress=row.progress==='ready'?92:row.progress==='needs-attention'?34:Math.min(90,40+row.ideas*6);
     return <div className={`table-row ${selectedGroup===row.id?'selected':''}`} key={row.id}>
      <button className="table-row-main" onClick={()=>setSelectedGroup(row.id)}>
       <span className="group-cell"><span className="group-dot"/><span className="group-name"><b>{row.name}</b><small>{row.members} members</small></span></span>
       <span className="progress-cell"><ProgressBar value={progress}/><b>{progress}%</b></span>
       <span className="participation"><b>{row.participation||0}%</b><small>balanced</small></span>
       <span className="thinking-count"><b>{row.ideas}</b><small>ideas · {row.comments} comments</small></span>
       <span><State state={row.submitted?'submitted':row.progress}/></span>
      </button>
      <div className="table-row-tools"><GroupActionMenu group={group} onEditGroup={()=>setGroupRename(group)} onEditMembers={()=>setMemberEditor(group)} onDeleteGroup={()=>setGroupDelete(group)}/></div>
     </div>
    })}
   </div>
  </section>
  <aside className="group-detail">
   <div className="detail-top"><div><span className="eyebrow">GROUP DETAIL</span><h3>{g?.name||'Select a group'}</h3></div><button className="icon-btn"><MoreHorizontal size={17}/></button></div>
   {g&&<><div className="detail-members">{g.members.slice(0,6).map(m=><div className="member-avatar" key={m._id} title={m.name}>{initials(m.name)}</div>)}<span>{g.members.length} learners</span></div>
    <div className="attention-card"><div className="attention-icon"><Target size={16}/></div><div><b>{ideas.length<3?'Invite more possibilities.':'Help them converge.'}</b><p>{ideas.length<3?'This group has a narrow idea pool. Ask for quantity before evaluation.':'They have enough material to choose a strong direction.'}</p></div></div>
    <div className="detail-section"><div className="detail-section-head"><span>Latest thinking</span><span>{ideas.length} ideas</span></div>{ideas.slice(0,5).map(i=><button className="mini-idea" key={i._id} onClick={()=>setShowReview(i)}><span className="mini-sticky"/><div><b>{i.title}</b><small>{i.authorId?.name||'Student'} · {i.voteCount||0} votes</small></div><ArrowRight size={14}/></button>)}{!ideas.length&&<p className="muted">No ideas yet.</p>}</div>
    <div className="detail-section"><div className="detail-section-head"><span>Submission</span>{data.submissions.find(s=>String(s.groupId?._id||s.groupId)===String(g._id))?<State state="submitted"/>:<span className="muted">Waiting</span>}</div>{(()=>{const submission=data.submissions.find(x=>String(x.groupId?._id||x.groupId)===String(g._id));return submission?<div className="submission-preview"><p>{submission.finalText||'No written solution.'}</p>{submission.status==='reviewed'?<div className="grade-chip">{submission.grade}/100</div>:<button className="primary small-btn" onClick={()=>setShowReview(submission)}>Review</button>}</div>:<p className="muted">This group has not submitted yet.</p>})()}</div>
   </>}
  </aside>
  {showReview&&<ReviewModal item={showReview} data={data} close={()=>setShowReview(null)} reload={()=>{setShowReview(null);reload()}}/>}
  {memberEditor&&<GroupMembersModal group={memberEditor} students={data.classroom?.members?.filter(m=>m.role==='student')||[]} groups={data.groups} onClose={()=>setMemberEditor(null)} onSave={saveMembers}/>}
  {groupRename&&<EditGroupModal group={groupRename} onClose={()=>setGroupRename(null)} onSave={renameGroup}/>}
  {groupDelete&&<DeleteGroupModal group={groupDelete} onClose={()=>setGroupDelete(null)} onConfirm={deleteGroup}/>}
 </div>
}

function Signal({label,value}){return <div className="signal"><span>{label}</span><b>{value}</b></div>}

function ProgressBar({value}){const n=typeof value==='number'?value:0;return <div className="progress-wrap"><span style={{width:n+'%'}}/></div>}

function State({state}){const label=state==='needs-attention'?'Needs attention':state==='on-track'?'On track':state==='ready'?'Ready':state==='submitted'?'Submitted':state;return <span className={`state ${state}`}>{label}</span>}

function GroupPulse({group,ideas,comments}){const contributors=new Set(ideas.map(i=>String(i.authorId?._id||i.authorId))).size;const pct=group.members.length?Math.round(contributors/group.members.length*100):0;return <div className="rail-card pulse-card"><div className="rail-title"><Users size={16}/><strong>Group pulse</strong><span className="live-label">LIVE</span></div><div className="pulse"><div className="pulse-ring"><span>{pct}%</span></div><div><strong>{pct>=70?'Balanced':'Make space'}</strong><small>{contributors} of {group.members.length} contributing</small></div></div><ProgressBar value={pct}/><p className="muted small">Participation is a signal, not a score. Invite quieter voices before pushing toward a decision.</p></div>}

function PromptCard({phase}){const prompts={diverge:'List three ideas that sound slightly impossible. Quantity before quality.',discuss:'Pick one idea you did not create. What could make it stronger?',refine:'What is the smallest change that would make this idea more useful?',converge:'Which idea best solves the actual problem — and why?',submit:'Explain the decision so another group could understand it.'};return <div className="rail-card prompt-card"><div className="rail-title"><Sparkles size={16}/><strong>Facilitator prompt</strong></div><p className="prompt">“{prompts[phase]}”</p><span className="prompt-phase">{phaseLabel(phase)} phase</span></div>}

function RulesCard(){return <div className="rail-card"><div className="rail-title"><FileText size={16}/><strong>Thinking agreements</strong></div><ul className="rules"><li>Build before you judge.</li><li>One thought per sticky.</li><li>Make space for quieter voices.</li><li>Disagree with the idea, not the person.</li></ul></div>}

function IdeaSticky({idea,index,onVote,selected,toggle,comments,reload}){
 const [open,setOpen]=useState(false);
 const [body,setBody]=useState('');
 const [editing,setEditing]=useState(false);
 const [title,setTitle]=useState(idea.title);
 const [description,setDescription]=useState(idea.description||'');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [menuOpen,setMenuOpen]=useState(false);
 const [menuPosition,setMenuPosition]=useState({top:0,left:0});
 const [deleteOpen,setDeleteOpen]=useState(false);
 const triggerRef=useRef(null);
 const menuRef=useRef(null);
 const placeMenu=()=>{const rect=triggerRef.current?.getBoundingClientRect();if(!rect)return;const width=150;const height=48;setMenuPosition({left:Math.max(12,Math.min(rect.right-width,window.innerWidth-width-12)),top:rect.bottom+height+12>window.innerHeight?Math.max(12,rect.top-height-6):rect.bottom+6})};
 useEffect(()=>{if(!menuOpen)return;placeMenu();const outside=e=>{if(!triggerRef.current?.contains(e.target)&&!menuRef.current?.contains(e.target))setMenuOpen(false)};const key=e=>{if(e.key==='Escape')setMenuOpen(false)};const reposition=()=>placeMenu();document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);window.addEventListener('resize',reposition);window.addEventListener('scroll',reposition,true);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);window.removeEventListener('resize',reposition);window.removeEventListener('scroll',reposition,true)}},[menuOpen]);
 const cancelEdit=()=>{setTitle(idea.title);setDescription(idea.description||'');setEditing(false);setError('')};
 const saveEdit=async()=>{if(!title.trim())return;setBusy(true);setError('');try{await api(`/activities/ideas/${idea._id}`,{method:'PATCH',body:JSON.stringify({title:title.trim(),description:description.trim()})});setEditing(false);await reload()}catch(e){setError(e.message)}finally{setBusy(false)}};
 const add=async()=>{if(!body.trim()||busy)return;setBusy(true);setError('');try{await api(`/activities/ideas/${idea._id}/comments`,{method:'POST',body:JSON.stringify({body:body.trim()})});setBody('');await reload()}catch(e){setError(e.message)}finally{setBusy(false)}};
 const remove=async()=>{setBusy(true);setError('');try{await api(`/activities/ideas/${idea._id}`,{method:'DELETE'});setDeleteOpen(false);await reload()}catch(e){setError(e.message)}finally{setBusy(false)}};
 const chooseDelete=()=>{setMenuOpen(false);setError('');setDeleteOpen(true)};
 return <article className={`sticky-idea color-${index%5} ${selected?'selected':''}`}>
  <div className="sticky-head"><span className="sticky-pin"/><button ref={triggerRef} type="button" className="tiny-menu" aria-label={`Idea actions for ${idea.title}`} aria-haspopup="menu" aria-expanded={menuOpen} onClick={()=>setMenuOpen(value=>!value)}><MoreHorizontal size={15}/></button></div>
  {menuOpen&&createPortal(<div ref={menuRef} className="idea-menu" role="menu" style={{top:menuPosition.top,left:menuPosition.left}}><button type="button" className="idea-menu-item" role="menuitem" onClick={chooseDelete}><Trash2 size={14}/>Delete idea</button></div>,document.body)}
  <div className="sticky-content">
   <span className="sticky-tag">{idea.status}</span>
   {editing?<div className="idea-edit-form"><input aria-label="Idea title" value={title} onChange={e=>setTitle(e.target.value)} maxLength={160}/><textarea aria-label="Idea description" value={description} onChange={e=>setDescription(e.target.value)} rows="3" placeholder="Add context to this idea…"/><div className="idea-edit-actions"><button type="button" onClick={cancelEdit} disabled={busy}>Cancel</button><button type="button" className="idea-save" onClick={saveEdit} disabled={busy||!title.trim()}>{busy?'Saving…':'Save'}</button></div></div>:<><h3>{idea.title}</h3>{idea.description&&<p>{idea.description}</p>}<small>by {idea.authorId?.name||'Student'} · v{idea.version||1}</small></>}
  </div>
  {!editing&&<div className="sticky-actions"><button className={selected?'chosen':''} onClick={toggle}><Check size={13}/>{selected?'Selected':'Select'}</button><button className={idea.votedByMe?'voted':''} onClick={onVote}><ThumbsUp size={13}/>{idea.voteCount||0}</button><button onClick={()=>setOpen(!open)} aria-expanded={open}><MessageCircle size={13}/>{comments.length}</button><button onClick={()=>{setTitle(idea.title);setDescription(idea.description||'');setError('');setEditing(true)}}>Improve</button></div>}
  {error&&!deleteOpen&&<p className="idea-inline-error" role="alert">{error}</p>}
  {open&&!editing&&<div className="sticky-comments">{comments.map(c=><div className="comment" key={c._id}><div className="comment-avatar">{initials(c.authorId?.name)}</div><div><b>{c.authorId?.name||'Student'}</b><p>{c.body}</p></div></div>)}{!comments.length&&<p className="comments-empty">No comments yet. Build on this idea.</p>}<div className="comment-box"><input value={body} onChange={e=>setBody(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&add()} placeholder="Build on this idea…" aria-label="Write a comment" disabled={busy}/><button type="button" onClick={add} disabled={busy||!body.trim()} aria-label="Send comment"><Send size={13}/></button></div></div>}
  {deleteOpen&&<Modal close={()=>!busy&&setDeleteOpen(false)} eyebrow="DELETE IDEA" title="Delete this idea?" subtitle="This will permanently delete the idea and its comments. This action cannot be undone."><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setDeleteOpen(false)} disabled={busy}>Cancel</button><button type="button" className="primary danger" onClick={remove} disabled={busy}>{busy?'Deleting…':'Delete idea'} <Trash2 size={15}/></button></div>{error&&<p className="error" role="alert">{error}</p>}</Modal>}
 </article>
}

function SubmissionModal({group,ideas,selected,setSelected,value,setValue,close,submit,existing}){return <Modal close={close} eyebrow="FINAL SOLUTION" title="Turn the group's thinking into one clear answer." subtitle="Select the ideas that shaped the decision, then explain the solution in your own words."><div className="submission-ideas">{ideas.map(i=><button key={i._id} className={selected.includes(i._id)?'selected':''} onClick={()=>setSelected(s=>s.includes(i._id)?s.filter(x=>x!==i._id):[...s,i._id])}><span className="mini-sticky"/><span>{i.title}</span>{selected.includes(i._id)&&<Check size={15}/>}</button>)}</div><textarea className="submission-text" rows="7" value={value} onChange={e=>setValue(e.target.value)} placeholder="Our solution is…\n\nIt solves the problem by…\n\nWe chose it because…"/><div className="modal-actions"><button className="secondary" onClick={close}>Keep thinking</button><button className="primary" onClick={submit} disabled={!value.trim()}>Submit solution <ArrowRight size={16}/></button></div>{existing&&<div className="submitted-note"><CheckCircle2 size={15}/> This group already has a saved submission. A submitted solution cannot be edited.</div>}</Modal>}

function ReviewModal({item,data,close,reload}){const isSubmission=!!item.finalText;const [grade,setGrade]=useState(item.grade??85);const [feedback,setFeedback]=useState(item.feedback||'');const review=async()=>{if(!isSubmission)return close();await api(`/activities/submissions/${item._id}/review`,{method:'PATCH',body:JSON.stringify({grade,feedback})});reload()};return <Modal close={close} eyebrow={isSubmission?'REVIEW SUBMISSION':'IDEA DETAIL'} title={isSubmission?'Give feedback that moves learning forward.':item.title} subtitle={isSubmission?'Grades are secondary. Make the feedback specific and actionable.':'Review the idea, its history, and the discussion around it.'}>{isSubmission?<><div className="review-solution">{item.finalText}</div><div className="two-fields"><Field label="Grade / 100"><input type="number" min="0" max="100" value={grade} onChange={e=>setGrade(e.target.value)}/></Field><div className="grade-big">{grade}<span>/100</span></div></div><Field label="Instructor feedback"><textarea rows="5" value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="What worked? What could be stronger? What should they explore next?"/></Field><div className="modal-actions"><button className="secondary" onClick={close}>Cancel</button><button className="primary" onClick={review}>Save feedback <Check size={16}/></button></div></>:<><div className="review-solution"><h3>{item.title}</h3><p>{item.description}</p></div><div className="modal-actions"><button className="primary" onClick={close}>Close</button></div></>}</Modal>}



function ComparePage({user,classroomId}){const [activities,setActivities]=useState([]);const [selected,setSelected]=useState(null);const [data,setData]=useState(null);useEffect(()=>{api('/activities?classroomId='+classroomId).then(a=>{setActivities(a);if(a[0])setSelected(a[0]._id)})},[classroomId]);useEffect(()=>{if(selected)api('/activities/'+selected+'/analytics').then(setData)},[selected]);return <div className="content"><div className="hero-row compact"><div><div className="eyebrow-row"><span className="eyebrow">INSTRUCTOR VIEW</span><span className="hero-chip"><BarChart3 size={13}/> Compare mode</span></div><h1>Compare without context-switching.</h1><p className="lead">Same signals. Same definitions. One place to notice who needs a nudge and who is ready to converge.</p></div></div><div className="compare-controls"><div><span className="muted">Activity</span><select className="select" value={selected||''} onChange={e=>setSelected(e.target.value)}>{activities.map(a=><option key={a._id} value={a._id}>{a.title}</option>)}</select></div><div className="compare-note"><Sparkles size={15}/> Participation is a conversation starter, not a grade.</div></div>{data?<div className="compare-grid">{data.groups.map(g=><CompareCard key={g.id} g={g}/>)}</div>:<Empty title="Choose an activity" text="Thinking Together will compare the live groups using the same classroom signals."/>}</div>}

function CompareCard({g}){const state=g.submitted?'submitted':g.participation<50?'needs-attention':g.progress==='ready'?'ready':'on-track';return <article className="compare-card"><div className="compare-head"><div className="team-avatar">{initials(g.name)}</div><div><h3>{g.name}</h3><State state={state}/></div><button className="icon-btn"><ArrowRight size={16}/></button></div><div className="compare-progress"><div><span>Progress</span><b>{g.progress==='ready'?92:g.progress==='needs-attention'?34:Math.min(92,35+g.ideas*7)}%</b></div><ProgressBar value={g.progress==='ready'?92:g.progress==='needs-attention'?34:Math.min(92,35+g.ideas*7)}/></div><div className="stats"><div><b>{g.ideas}</b><small>Ideas</small></div><div><b>{g.comments}</b><small>Comments</small></div><div><b>{g.participation}%</b><small>Contributors</small></div></div><div className="attention"><span/>{g.submitted?'Final solution submitted.':state==='needs-attention'?'Low contribution — try a facilitator prompt.':state==='ready'?'Ready to converge.':'Healthy collaborative rhythm.'}</div></article>}

function Empty({title,text,spinner}){return <div className="empty">{spinner?<RefreshCw className="spin"/>:<div className="empty-icon"><Lightbulb size={21}/></div>}<h3>{title}</h3><p>{text}</p></div>}

function timeLeft(d,now=Date.now()){const diff=new Date(d)-now;if(diff<=0)return'00:00';const s=Math.floor(diff/1000),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`}

createRoot(document.getElementById('root')).render(<App/>);
