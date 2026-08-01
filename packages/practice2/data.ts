import type{Practice2Movement,Practice2PosePoint,Practice2ReferenceFrame,ShortFlowDefinition,StaticPracticeDefinition}from'./types';

const points=(entries:Array<[string,number,number]>):Practice2PosePoint[]=>entries.map(([name,x,y])=>({name,x,y,score:1}));

export const bowStanceTarget:readonly Practice2PosePoint[]=points([
 ['nose',.5,.12],['left_shoulder',.40,.28],['right_shoulder',.60,.28],['left_elbow',.31,.38],['right_elbow',.69,.38],['left_wrist',.22,.45],['right_wrist',.78,.45],
 ['left_hip',.44,.54],['right_hip',.56,.54],['left_knee',.31,.72],['right_knee',.69,.69],['left_ankle',.22,.91],['right_ankle',.78,.91],['left_heel',.20,.92],['right_heel',.76,.92],['left_foot_index',.27,.94],['right_foot_index',.84,.94],
]);

export const staticReferencePoses:Readonly<Record<string,readonly Practice2PosePoint[]>>={
 'qi-shi':points([['nose',.5,.12],['left_shoulder',.42,.29],['right_shoulder',.58,.29],['left_elbow',.40,.43],['right_elbow',.60,.43],['left_wrist',.46,.53],['right_wrist',.54,.53],['left_hip',.45,.55],['right_hip',.55,.55],['left_knee',.44,.75],['right_knee',.56,.75],['left_ankle',.43,.93],['right_ankle',.57,.93]]),
 'push-forward':bowStanceTarget,
 'raise-and-open':points([['nose',.5,.12],['left_shoulder',.42,.29],['right_shoulder',.58,.29],['left_elbow',.30,.30],['right_elbow',.70,.30],['left_wrist',.18,.25],['right_wrist',.82,.25],['left_hip',.45,.55],['right_hip',.55,.55],['left_knee',.43,.75],['right_knee',.57,.75],['left_ankle',.39,.93],['right_ankle',.61,.93]]),
 'bend-and-pull':points([['nose',.53,.13],['left_shoulder',.43,.29],['right_shoulder',.63,.30],['left_elbow',.38,.39],['right_elbow',.68,.38],['left_wrist',.50,.45],['right_wrist',.78,.34],['left_hip',.45,.55],['right_hip',.60,.56],['left_knee',.34,.73],['right_knee',.68,.70],['left_ankle',.23,.92],['right_ankle',.80,.92]]),
 'push-clouds':points([['nose',.52,.12],['left_shoulder',.42,.29],['right_shoulder',.62,.29],['left_elbow',.37,.37],['right_elbow',.70,.36],['left_wrist',.49,.43],['right_wrist',.80,.33],['left_hip',.45,.55],['right_hip',.58,.55],['left_knee',.34,.73],['right_knee',.67,.72],['left_ankle',.23,.92],['right_ankle',.79,.92]]),
};

const dynamic=(timestampMs:number,phaseId:string,wristY:number,wristSpread:number,shift:number,knee:number):Practice2ReferenceFrame=>({timestampMs,phaseId,keypoints:points([
 ['nose',.5+shift,.12],['left_shoulder',.41+shift,.28],['right_shoulder',.59+shift,.28],['left_elbow',.42-wristSpread+shift,.36],['right_elbow',.58+wristSpread+shift,.36],['left_wrist',.46-wristSpread*1.35+shift,wristY],['right_wrist',.54+wristSpread*1.35+shift,wristY],
 ['left_hip',.45+shift,.54],['right_hip',.55+shift,.54],['left_knee',.43-knee+shift,.73],['right_knee',.57+knee+shift,.73],['left_ankle',.39+shift,.92],['right_ankle',.63+shift,.92],
])});

export const pushReferenceFrames:readonly Practice2ReferenceFrame[]=[
 dynamic(0,'prepare',.53,.01,0,0),dynamic(800,'lift',.40,.035,0,.01),dynamic(1600,'push',.34,.075,.018,.025),dynamic(2400,'extend',.31,.13,.035,.04),dynamic(3200,'release',.43,.055,.018,.018),dynamic(4000,'release',.54,.01,0,0),
];

export const practice2Phases=[
 {id:'prepare',title:'Hazırlık',startMs:0,endMs:800,breath:'Nefes alırken hazırlan.'},
 {id:'lift',title:'Kaldır',startMs:800,endMs:1600,breath:'Nefes almaya devam et.'},
 {id:'push',title:'İt',startMs:1600,endMs:2400,breath:'Nefes verirken ileri it.'},
 {id:'extend',title:'Uzat',startMs:2400,endMs:3200,breath:'Dirseklerini kilitlemeden uzat.'},
 {id:'release',title:'Bırak',startMs:3200,endMs:4000,breath:'Omuzlarını yumuşat ve bırak.'},
]as const;

export const practice2Movement:Practice2Movement={id:'practice2-front-back-push',order:8,name:'Önden Arkaya İtme',traditionalName:'Tui Zhang',durationMs:4000,referenceImage:'movement-5',phases:practice2Phases,referenceFrames:pushReferenceFrames};

export const staticPracticeDefinitions:readonly StaticPracticeDefinition[]=[
 {id:'qi-shi',title:'Başlangıç Duruşu',englishTitle:'Starting Posture',order:1,referenceImage:'/images/practice2/static/01-qi-shi.png',cameraView:'front',holdDurationMs:15000,focusMetrics:['denge','merkezlenme','doğal nefes','omuz rahatlığı'],breathingCue:'Nefesini değiştirmeden omuzlarını yumuşat.',shortInstruction:'Ayaklarını yere eşit bırak, tepe noktanı göğe doğru uzat.',targetAngles:{leftKnee:174,rightKnee:174,leftElbow:148,rightElbow:148},tolerances:{knee:14,elbow:18,level:.09}},
 {id:'push-forward',title:'Önden Arkaya İtme',englishTitle:'Push Forward',order:2,referenceImage:'/images/practice2/static/02-push-forward.png',cameraView:'diagonal',holdDurationMs:12000,focusMetrics:['ağırlık aktarımı','kol hizası','gövde dengesi','kontrollü itme'],breathingCue:'Nefes verirken ağırlığını öne taşı.',shortInstruction:'Öndeki dizi yumuşat, iki avucu aynı çizgide ileri gönder.',targetAngles:{leftKnee:118,rightKnee:158,leftElbow:160,rightElbow:160},tolerances:{knee:20,elbow:20,level:.1}},
 {id:'raise-and-open',title:'Kaldır ve Aç',englishTitle:'Raise and Open',order:3,referenceImage:'/images/practice2/static/03-raise-and-open.png',cameraView:'front',holdDurationMs:12000,focusMetrics:['omuz açıklığı','kol simetrisi','göğüs açıklığı','nefes uyumu'],breathingCue:'Nefes al, kollarını kaldır ve göğsünde alan aç.',shortInstruction:'Dirseklerini kilitlemeden iki kolunu eşit genişlikte aç.',targetAngles:{leftKnee:170,rightKnee:170,leftElbow:154,rightElbow:154},tolerances:{knee:16,elbow:18,level:.08}},
 {id:'bend-and-pull',title:'Bük ve Çek',englishTitle:'Bend and Pull',order:4,referenceImage:'/images/practice2/static/04-bend-and-pull.png',cameraView:'diagonal',holdDurationMs:12000,focusMetrics:['diz açısı','kalça dengesi','gövde dönüşü','geri çekme kontrolü'],breathingCue:'Nefes verirken dizini bük, ellerini merkeze çek.',shortInstruction:'Kalçanı iki ayağın arasında tut, gövdeyi devirmeden geri çek.',targetAngles:{leftKnee:112,rightKnee:146,leftElbow:92,rightElbow:124},tolerances:{knee:20,elbow:22,level:.11}},
 {id:'push-clouds',title:'Bulutları İt',englishTitle:'Push the Clouds',order:5,referenceImage:'/images/practice2/static/05-push-clouds.png',cameraView:'front',holdDurationMs:15000,focusMetrics:['akışkanlık','el yolu','sağ-sol senkronu','hafiflik'],breathingCue:'Nefesin kesilmeden ellerini bulut gibi taşı.',shortInstruction:'Bir el iterken diğerini merkeze al; geçişi görünmez kıl.',targetAngles:{leftKnee:142,rightKnee:142,leftElbow:118,rightElbow:138},tolerances:{knee:22,elbow:24,level:.12}},
]as const;

export const shortFlowDefinitions:readonly ShortFlowDefinition[]=[
 {id:'qi-shi-motion',title:'Başlangıç Duruşu',order:1,durationMinutes:1,level:'Başlangıç',focus:'Merkezlenme',description:'Kolları yumuşakça kaldır, nefesle yeniden merkeze bırak.',steps:[{practiceId:'qi-shi',durationMs:1500,cue:'Merkezini bul.'},{practiceId:'raise-and-open',durationMs:1500,cue:'Nefesle açıl.'},{practiceId:'qi-shi',durationMs:1500,cue:'Yumuşakça merkeze dön.'}]},
 {id:'push-forward-motion',title:'Önden Arkaya İtme',order:2,durationMinutes:1,level:'Başlangıç',focus:'Ağırlık aktarımı',description:'Ağırlığı kontrollü biçimde öne taşı ve iki avucu ileri gönder.',steps:[{practiceId:'qi-shi',durationMs:1500,cue:'Köklen.'},{practiceId:'bend-and-pull',durationMs:1500,cue:'Gücü merkeze topla.'},{practiceId:'push-forward',durationMs:1500,cue:'Nefes verirken ileri it.'}]},
 {id:'raise-and-open-motion',title:'Kaldır ve Aç',order:3,durationMinutes:1,level:'Başlangıç',focus:'Omuz açıklığı',description:'Kolları omuzları sıkıştırmadan kaldır ve göğsünde alan aç.',steps:[{practiceId:'qi-shi',durationMs:1500,cue:'Omuzlarını bırak.'},{practiceId:'raise-and-open',durationMs:1500,cue:'Kollarını nefesle kaldır.'},{practiceId:'qi-shi',durationMs:1500,cue:'Sessizce başlangıca dön.'}]},
 {id:'bend-and-pull-motion',title:'Bük ve Çek',order:4,durationMinutes:1,level:'Orta',focus:'Gövde dengesi',description:'Dizleri yumuşat, bedeni devirmeden elleri merkeze çek.',steps:[{practiceId:'push-forward',durationMs:1500,cue:'Uzan.'},{practiceId:'bend-and-pull',durationMs:1500,cue:'Dizleri yumuşat ve çek.'},{practiceId:'qi-shi',durationMs:1500,cue:'Merkeze yerleş.'}]},
 {id:'push-clouds-motion',title:'Bulutları İt',order:5,durationMinutes:1,level:'Orta',focus:'Akışkanlık',description:'Sağ ve sol arasında kesintisiz, hafif bir el yolu oluştur.',steps:[{practiceId:'bend-and-pull',durationMs:1500,cue:'Bir eli merkeze al.'},{practiceId:'push-clouds',durationMs:1500,cue:'Bulutu yana taşı.'},{practiceId:'push-forward',durationMs:1500,cue:'Geçişi görünmez kıl.'}]},
]as const;

export function getStaticPractice(id:string){return staticPracticeDefinitions.find(item=>item.id===id)??staticPracticeDefinitions[0]}
export function getShortFlow(id:string){return shortFlowDefinitions.find(item=>item.id===id)??shortFlowDefinitions[0]}

export function practice2PhaseAt(elapsedMs:number){const time=Math.max(0,Math.min(practice2Movement.durationMs-1,elapsedMs));return practice2Phases.find(phase=>time>=phase.startMs&&time<phase.endMs)??practice2Phases[0]}

export function buildShortFlowReferenceFrames(flow:ShortFlowDefinition,durationMs=4000):readonly Practice2ReferenceFrame[]{
 const segment=durationMs/Math.max(1,flow.steps.length),frames:Practice2ReferenceFrame[]=[];
 flow.steps.forEach((flowStep,index)=>{const target=staticReferencePoses[flowStep.practiceId]??staticReferencePoses['qi-shi'];frames.push({timestampMs:Math.round(index*segment),phaseId:flowStep.practiceId,keypoints:target})});
 const last=flow.steps[flow.steps.length-1];frames.push({timestampMs:durationMs,phaseId:last.practiceId,keypoints:staticReferencePoses[last.practiceId]??staticReferencePoses['qi-shi']});
 return frames;
}

export function shortFlowStepAt(flow:ShortFlowDefinition,elapsedMs:number,durationMs=4000){
 const index=Math.min(flow.steps.length-1,Math.floor(Math.max(0,Math.min(durationMs-1,elapsedMs))/(durationMs/flow.steps.length)));
 return flow.steps[index];
}

export function interpolatePractice2Reference(elapsedMs:number,frames:readonly Practice2ReferenceFrame[]=pushReferenceFrames):Practice2ReferenceFrame{
 const duration=frames[frames.length-1]?.timestampMs??practice2Movement.durationMs,time=Math.max(0,Math.min(duration,elapsedMs));
 const nextIndex=frames.findIndex(frame=>frame.timestampMs>=time),next=nextIndex<0?frames[frames.length-1]:frames[nextIndex],previous=nextIndex<=0?frames[0]:frames[nextIndex-1];
 const ratio=Math.max(0,Math.min(1,(time-previous.timestampMs)/Math.max(1,next.timestampMs-previous.timestampMs))),before=new Map(previous.keypoints.map(item=>[item.name,item]));
 return{timestampMs:time,phaseId:ratio<.5?previous.phaseId:next.phaseId,keypoints:next.keypoints.map(point=>{const start=before.get(point.name)??point;return{...point,x:start.x+(point.x-start.x)*ratio,y:start.y+(point.y-start.y)*ratio}})};
}
