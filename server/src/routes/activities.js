import {Router} from 'express';
import Activity from '../models/Activity.js';
import Group from '../models/Group.js';
import Idea from '../models/Idea.js';
import Comment from '../models/Comment.js';
import Vote from '../models/Vote.js';
import Submission from '../models/Submission.js';
import Classroom from '../models/Classroom.js';
import Notification from '../models/Notification.js';
import {auth,role} from '../middleware/auth.js';

const r=Router();
r.use(auth);
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const oid=(x)=>String(x);
const emit=(req,event,payload,activityId)=>req.app.get('io')?.to(`activity:${activityId||payload?.activityId||payload?._id}`).emit(event,payload);

const getActivity=async(id)=>Activity.findById(id);
const canSeeActivity=async(req,a)=>{
  const c=await Classroom.findById(a.classroomId);
  if(!c) return false;
  return req.user.role==='instructor' ? oid(c.instructorId)===oid(req.user._id) : c.members.some(x=>oid(x)===oid(req.user._id));
};
const canManageActivity=async(req,a)=>{
  const c=await Classroom.findById(a.classroomId);
  return !!c && req.user.role==='instructor' && oid(c.instructorId)===oid(req.user._id);
};
const studentGroup=async(req,activityId)=>Group.findOne({activityId,members:req.user._id});

r.get('/',wrap(async(req,res)=>{
  let q={};
  if(req.query.classroomId) q.classroomId=req.query.classroomId;
  const classrooms=await Classroom.find({$or:[{instructorId:req.user._id},{members:req.user._id}]}).select('_id');
  const ids=classrooms.map(x=>x._id);
  if(!req.query.classroomId) q.classroomId={$in:ids};
  const list=await Activity.find(q).sort({createdAt:-1});
  res.json(list);
}));

r.post('/',role('instructor'),wrap(async(req,res)=>{
  const c=await Classroom.findOne({_id:req.body.classroomId,instructorId:req.user._id});
  if(!c) return res.status(403).json({message:'You do not own this classroom'});
  const a=await Activity.create({
    classroomId:c._id,title:String(req.body.title||'Untitled activity').trim(),
    problem:String(req.body.problem||'').trim(),instructions:String(req.body.instructions||'').trim(),
    status:'draft',phase:'diverge',deadline:req.body.deadline||null,
    settings:{allowVoting:req.body.allowVoting!==false,anonymousIdeas:!!req.body.anonymousIdeas}
  });
  emit(req,'activity:created',a,a._id); res.status(201).json(a);
}));

r.get('/:id',wrap(async(req,res)=>{
  const a=await getActivity(req.params.id); if(!a)return res.status(404).json({message:'Activity not found'});
  if(!(await canSeeActivity(req,a)))return res.status(403).json({message:'You are not a member of this classroom'});
  const [groups,ideas,comments,submissions,c]=await Promise.all([
    Group.find({activityId:a._id}).populate('members','name email role'),
    Idea.find({activityId:a._id}).populate('authorId','name role').sort({createdAt:-1}),
    Comment.find({ideaId:{$in:await Idea.find({activityId:a._id}).distinct('_id')}}).populate('authorId','name').sort({createdAt:1}),
    Submission.find({activityId:a._id}).populate('groupId','name'),
    Classroom.findById(a.classroomId).populate('members','name email role')
  ]);
  const voteRows=ideas.length?await Vote.aggregate([{$match:{ideaId:{$in:ideas.map(i=>i._id)}}},{$group:{_id:'$ideaId',count:{$sum:1}}}]):[];
  const voteMap=Object.fromEntries(voteRows.map(v=>[oid(v._id),v.count]));
  const mine=ideas.length?await Vote.find({ideaId:{$in:ideas.map(i=>i._id)},userId:req.user._id}).select('ideaId'):[];
  const mineSet=new Set(mine.map(v=>oid(v.ideaId)));
  const meGroup=await studentGroup(req,a._id);
  res.json({activity:a,classroom:c,groups,ideas:ideas.map(i=>({...i.toObject(),voteCount:voteMap[oid(i._id)]||0,votedByMe:mineSet.has(oid(i._id))})),comments,submissions,myGroupId:meGroup?meGroup._id:null});
}));

r.patch('/:id',role('instructor'),wrap(async(req,res)=>{
  const a=await getActivity(req.params.id); if(!a)return res.status(404).json({message:'Activity not found'});
  if(!(await canManageActivity(req,a)))return res.status(403).json({message:'Only the classroom instructor can manage this activity'});
  const allowed=['title','problem','instructions','status','phase','deadline','settings'];
  allowed.forEach(k=>{if(req.body[k]!==undefined)a[k]=req.body[k]});
  await a.save(); emit(req,'activity:updated',a,a._id); res.json(a);
}));

r.post('/:id/groups',role('instructor'),wrap(async(req,res)=>{
  const a=await getActivity(req.params.id); if(!a)return res.status(404).json({message:'Activity not found'});
  if(!(await canManageActivity(req,a)))return res.status(403).json({message:'Only the instructor can manage groups'});
  const members=[...new Set((req.body.members||[]).map(String))];
  const conflicts=await Group.find({activityId:a._id,members:{$in:members}}).select('_id name members');
  if(conflicts.length){
    return res.status(409).json({message:'One or more students are already assigned to another group in this activity.'});
  }
  const g=await Group.create({activityId:a._id,name:String(req.body.name||'New group').trim(),members,accent:req.body.accent||'violet'});
  emit(req,'group:updated',g,a._id); res.status(201).json(g);
}));

r.patch('/groups/:id',wrap(async(req,res)=>{
  const g=await Group.findById(req.params.id); if(!g)return res.status(404).json({message:'Group not found'});
  const a=await getActivity(g.activityId); if(!a)return res.status(404).json({message:'Activity not found'});
  const manager=await canManageActivity(req,a);
  if(!manager)return res.status(403).json({message:'Only the instructor can edit groups'});
  if(req.body.name!==undefined)g.name=String(req.body.name||'').trim()||'New group';
  if(req.body.accent!==undefined)g.accent=req.body.accent;
  if(req.body.progressState!==undefined)g.progressState=req.body.progressState;
  if(req.body.members!==undefined){
    const nextMembers=[...new Set((req.body.members||[]).map(String))];
    const duplicates=await Group.find({activityId:a._id,_id:{$ne:g._id},members:{$in:nextMembers}}).select('_id members');
    if(duplicates.length){
      return res.status(409).json({message:'One or more students are already assigned to another group in this activity.'});
    }
    for(const other of await Group.find({activityId:a._id,_id:{$ne:g._id},members:{$in:nextMembers}})){
      other.members=other.members.filter(memberId=>!nextMembers.includes(String(memberId)));
      await other.save();
    }
    g.members=nextMembers;
  }
  await g.save(); emit(req,'group:updated',g,a._id); res.json(g);
}));

r.delete('/groups/:id',role('instructor'),wrap(async(req,res)=>{
  const g=await Group.findById(req.params.id); if(!g)return res.status(404).json({message:'Group not found'});
  const a=await getActivity(g.activityId); if(!a)return res.status(404).json({message:'Activity not found'});
  if(!(await canManageActivity(req,a)))return res.status(403).json({message:'Only the instructor can delete groups'});
  await Group.deleteOne({_id:g._id});
  emit(req,'group:updated',{_id:g._id,activityId:a._id,deleted:true},a._id);
  res.json({success:true,deletedGroupId:String(g._id)});
}));

r.post('/:id/ideas',wrap(async(req,res)=>{
  const a=await getActivity(req.params.id); if(!a)return res.status(404).json({message:'Activity not found'});
  if(!(await canSeeActivity(req,a)))return res.status(403).json({message:'Access denied'});
  const g=await Group.findOne({_id:req.body.groupId,activityId:a._id});
  if(!g)return res.status(400).json({message:'Select a valid group'});
  if(req.user.role==='student'&&!g.members.some(x=>oid(x)===oid(req.user._id)))return res.status(403).json({message:'You are not a member of this group'});
  const i=await Idea.create({activityId:a._id,groupId:g._id,authorId:req.user._id,title:String(req.body.title||'').trim(),description:String(req.body.description||'').trim(),tags:Array.isArray(req.body.tags)?req.body.tags:[],parentIdeaId:req.body.parentIdeaId||null,version:req.body.version||1});
  const full=await Idea.findById(i._id).populate('authorId','name role'); emit(req,'idea:created',full,a._id); res.status(201).json(full);
}));

r.patch('/ideas/:id',wrap(async(req,res)=>{
  const old=await Idea.findById(req.params.id); if(!old)return res.status(404).json({message:'Idea not found'});
  const a=await getActivity(old.activityId); if(!a)return res.status(404).json({message:'Activity not found'});
  const g=await Group.findById(old.groupId);
  const manager=await canManageActivity(req,a); const member=g?.members.some(x=>oid(x)===oid(req.user._id));
  if(!manager&&!member)return res.status(403).json({message:'You cannot edit this idea'});
  ['title','description','tags','status'].forEach(k=>{if(req.body[k]!==undefined)old[k]=req.body[k]}); old.version=(old.version||1)+1; await old.save();
  const full=await Idea.findById(old._id).populate('authorId','name role'); emit(req,'idea:updated',full,a._id); res.json(full);
}));

r.delete('/ideas/:id',wrap(async(req,res)=>{
  const idea=await Idea.findById(req.params.id); if(!idea)return res.status(404).json({message:'Idea not found'});
  const a=await getActivity(idea.activityId); if(!a)return res.status(404).json({message:'Activity not found'});
  const group=await Group.findById(idea.groupId);
  const manager=await canManageActivity(req,a);
  const member=group?.members.some(x=>oid(x)===oid(req.user._id));
  if(!manager&&!member)return res.status(403).json({message:'You cannot delete this idea'});
  await Promise.all([
    Comment.deleteMany({ideaId:idea._id}),
    Vote.deleteMany({ideaId:idea._id}),
    Idea.deleteOne({_id:idea._id})
  ]);
  emit(req,'idea:deleted',{_id:idea._id,activityId:a._id},a._id);
  res.json({success:true,deletedIdeaId:String(idea._id)});
}));

r.post('/ideas/:id/improve',wrap(async(req,res)=>{
  const old=await Idea.findById(req.params.id); if(!old)return res.status(404).json({message:'Idea not found'});
  const a=await getActivity(old.activityId); const g=await Group.findById(old.groupId);
  if(!a||!g)return res.status(404).json({message:'Idea context not found'});
  if(req.user.role==='student'&&!g.members.some(x=>oid(x)===oid(req.user._id)))return res.status(403).json({message:'You are not in this group'});
  const i=await Idea.create({activityId:a._id,groupId:g._id,authorId:req.user._id,title:String(req.body.title||old.title).trim(),description:String(req.body.description||old.description||'').trim(),tags:old.tags,parentIdeaId:old._id,version:(old.version||1)+1,status:'new'});
  const full=await Idea.findById(i._id).populate('authorId','name role'); emit(req,'idea:created',full,a._id); res.status(201).json(full);
}));

r.post('/ideas/:id/comments',wrap(async(req,res)=>{
  const idea=await Idea.findById(req.params.id); if(!idea)return res.status(404).json({message:'Idea not found'});
  const a=await getActivity(idea.activityId); if(!a||!(await canSeeActivity(req,a)))return res.status(403).json({message:'Access denied'});
  const body=String(req.body.body||'').trim(); if(!body)return res.status(400).json({message:'Comment cannot be empty'});
  const c=await Comment.create({ideaId:idea._id,authorId:req.user._id,body,parentCommentId:req.body.parentCommentId||null});
  const full=await Comment.findById(c._id).populate('authorId','name'); emit(req,'comment:created',full,a._id); res.status(201).json(full);
}));

r.post('/ideas/:id/vote',wrap(async(req,res)=>{
  const idea=await Idea.findById(req.params.id); if(!idea)return res.status(404).json({message:'Idea not found'});
  const a=await getActivity(idea.activityId); if(!a||!(await canSeeActivity(req,a)))return res.status(403).json({message:'Access denied'});
  if(a.settings?.allowVoting===false)return res.status(400).json({message:'Voting is disabled for this activity'});
  const existing=await Vote.findOne({ideaId:idea._id,userId:req.user._id}); let voted;
  if(existing){await existing.deleteOne();voted=false}else{await Vote.create({ideaId:idea._id,userId:req.user._id});voted=true}
  const count=await Vote.countDocuments({ideaId:idea._id}); const payload={activityId:a._id,ideaId:idea._id,voteCount:count,votedByMe:voted}; emit(req,'vote:updated',payload,a._id); res.json(payload);
}));

r.post('/:id/submissions',wrap(async(req,res)=>{
  const a=await getActivity(req.params.id); if(!a)return res.status(404).json({message:'Activity not found'});
  const g=await Group.findOne({_id:req.body.groupId,activityId:a._id}); if(!g)return res.status(400).json({message:'Invalid group'});
  if(req.user.role==='student'&&!g.members.some(x=>oid(x)===oid(req.user._id)))return res.status(403).json({message:'You are not in this group'});
  const existing=await Submission.findOne({activityId:a._id,groupId:g._id}); if(existing?.status==='submitted'||existing?.status==='reviewed')return res.status(409).json({message:'Submission is already locked'});
  const s=existing||new Submission({activityId:a._id,groupId:g._id}); s.selectedIdeaIds=req.body.selectedIdeaIds||[]; s.finalText=String(req.body.finalText||'').trim(); s.status='submitted'; s.submittedAt=new Date(); await s.save();
  emit(req,'submission:created',s,a._id); res.status(201).json(s);
}));

r.patch('/submissions/:id/review',role('instructor'),wrap(async(req,res)=>{
  const s=await Submission.findById(req.params.id); if(!s)return res.status(404).json({message:'Submission not found'});
  const a=await getActivity(s.activityId); if(!a||!(await canManageActivity(req,a)))return res.status(403).json({message:'Only the instructor can review this submission'});
  s.grade=Math.max(0,Math.min(100,Number(req.body.grade))); s.feedback=String(req.body.feedback||'').trim(); s.status='reviewed'; await s.save();
  const g=await Group.findById(s.groupId); if(g){for(const uid of g.members){await Notification.create({userId:uid,type:'feedback',title:'Your group received feedback',message:`${a.title} has been reviewed.`,relatedId:String(s._id)})}}
  emit(req,'feedback:created',s,a._id); res.json(s);
}));

r.get('/:id/analytics',role('instructor'),wrap(async(req,res)=>{
  const a=await getActivity(req.params.id); if(!a||!(await canManageActivity(req,a)))return res.status(403).json({message:'Access denied'});
  const [groups,ideas,comments,votes,subs]=await Promise.all([Group.find({activityId:a._id}),Idea.find({activityId:a._id}),Comment.find({ideaId:{$in:await Idea.find({activityId:a._id}).distinct('_id')}}),Vote.find({ideaId:{$in:await Idea.find({activityId:a._id}).distinct('_id')}}),Submission.find({activityId:a._id})]);
  const byGroup=groups.map(g=>{
    const gi=ideas.filter(i=>oid(i.groupId)===oid(g._id)); const ids=new Set(gi.map(i=>oid(i._id))); const gc=comments.filter(c=>ids.has(oid(c.ideaId))).length; const gv=votes.filter(v=>ids.has(oid(v.ideaId))).length; const sub=subs.find(s=>oid(s.groupId)===oid(g._id));
    const uniqueContributors=new Set(gi.map(i=>oid(i.authorId))); const participation=g.members.length?Math.round(uniqueContributors.size/g.members.length*100):0;
    return {id:g._id,name:g.name,members:g.members.length,ideas:gi.length,comments:gc,votes:gv,participation,progress:g.progressState,submitted:!!sub,grade:sub?.grade??null};
  });
  res.json({groups:byGroup,totalIdeas:ideas.length,totalComments:comments.length,totalVotes:votes.length,totalSubmissions:subs.filter(s=>s.status!=='draft').length});
}));

export default r;
