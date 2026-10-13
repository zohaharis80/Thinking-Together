import {Router} from 'express';
import mongoose from 'mongoose';
import Classroom from '../models/Classroom.js';
import Activity from '../models/Activity.js';
import Group from '../models/Group.js';
import Idea from '../models/Idea.js';
import Comment from '../models/Comment.js';
import Vote from '../models/Vote.js';
import Submission from '../models/Submission.js';
import Notification from '../models/Notification.js';
import {auth,role} from '../middleware/auth.js';
import {joinCode} from '../utils/joinCode.js';
const r=Router(); r.use(auth); const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const oid=x=>String(x);
const findIds=async(Model,filter,session)=>{let query=Model.find(filter).select('_id');if(session)query=query.session(session);return (await query).map(({_id})=>_id)};
const deleteMany=async(Model,filter,session)=>Model.deleteMany(filter,session?{session}:{});
const deleteClassroomData=async(classroomId,session)=>{
  const activityIds=await findIds(Activity,{classroomId},session);
  const groupIds=activityIds.length?await findIds(Group,{activityId:{$in:activityIds}},session):[];
  const ideaIds=activityIds.length?await findIds(Idea,{activityId:{$in:activityIds}},session):[];
  const submissionIds=activityIds.length?await findIds(Submission,{activityId:{$in:activityIds}},session):[];
  if(submissionIds.length)await Notification.deleteMany({relatedId:{$in:submissionIds.map(String)}},session?{session}:{});
  if(ideaIds.length){
    await deleteMany(Comment,{ideaId:{$in:ideaIds}},session);
    await deleteMany(Vote,{ideaId:{$in:ideaIds}},session);
    await deleteMany(Idea,{_id:{$in:ideaIds}},session);
  }
  if(submissionIds.length)await deleteMany(Submission,{_id:{$in:submissionIds}},session);
  if(groupIds.length)await deleteMany(Group,{_id:{$in:groupIds}},session);
  if(activityIds.length)await deleteMany(Activity,{_id:{$in:activityIds}},session);
  await deleteMany(Classroom,{_id:classroomId},session);
};
r.post('/',role('instructor'),wrap(async(req,res)=>{let code=joinCode();while(await Classroom.exists({joinCode:code}))code=joinCode();const c=await Classroom.create({name:String(req.body.name||'Untitled classroom').trim(),description:String(req.body.description||'').trim(),instructorId:req.user._id,joinCode:code,members:[req.user._id]});res.status(201).json(c);}));
r.get('/',wrap(async(req,res)=>{const cs=await Classroom.find({$or:[{instructorId:req.user._id},{members:req.user._id}]}).sort({createdAt:-1});const out=await Promise.all(cs.map(async c=>{const activities=await Activity.find({classroomId:c._id}).sort({createdAt:-1}).limit(3);return {...c.toObject(),activities}}));res.json(out);}));
r.post('/join',role('student'),wrap(async(req,res)=>{const code=String(req.body.joinCode||'').toUpperCase().trim();const c=await Classroom.findOne({joinCode:code});if(!c)return res.status(404).json({message:'Classroom code not found'});if(!c.members.some(x=>oid(x)===oid(req.user._id))){c.members.push(req.user._id);await c.save()}res.json(c);}));
r.delete('/:id',role('instructor'),wrap(async(req,res)=>{
  if(!mongoose.isValidObjectId(req.params.id))return res.status(404).json({message:'Classroom not found'});
  const classroom=await Classroom.findById(req.params.id);
  if(!classroom)return res.status(404).json({message:'Classroom not found'});
  if(oid(classroom.instructorId)!==oid(req.user._id))return res.status(403).json({message:'Only the classroom instructor can delete this classroom'});
  const hello=await mongoose.connection.db.admin().command({hello:1});
  if(hello.setName||hello.msg==='isdbgrid'){
    const session=await mongoose.startSession();
    try{await session.withTransaction(()=>deleteClassroomData(classroom._id,session))}
    finally{await session.endSession()}
  }else{
    await deleteClassroomData(classroom._id);
  }
  res.json({success:true,deletedClassroomId:String(classroom._id)});
}));
r.get('/:id',wrap(async(req,res)=>{const c=await Classroom.findById(req.params.id).populate('members','name email role');if(!c)return res.status(404).json({message:'Classroom not found'});const allowed=oid(c.instructorId)===oid(req.user._id)||c.members.some(x=>oid(x._id||x)===oid(req.user._id));if(!allowed)return res.status(403).json({message:'Access denied'});res.json(c);}));
export default r;
