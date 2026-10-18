import {forwardRef,useImperativeHandle,useRef,useState} from 'react';
import {StyleSheet,View} from 'react-native';
import {WebView,WebViewMessageEvent} from 'react-native-webview';

export type PoseLandmark={x:number;y:number;z:number;visibility:number};
export type PoseAnalysis={landmarks:PoseLandmark[];confidence:number;imageWidth:number;imageHeight:number};
export type MediaPipePoseBridgeRef={analyze:(base64:string)=>Promise<PoseAnalysis>;ready:boolean};

const html=String.raw`<!doctype html>
<html><body><script type="module">
import {FilesetResolver,PoseLandmarker} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/+esm";
let landmarker;
const send=(value)=>window.ReactNativeWebView.postMessage(JSON.stringify(value));
try {
  const vision=await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm");
  landmarker=await PoseLandmarker.createFromOptions(vision,{
    baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",delegate:"GPU"},
    runningMode:"IMAGE",numPoses:1,minPoseDetectionConfidence:.65,minPosePresenceConfidence:.65,minTrackingConfidence:.65
  });
  send({type:"ready"});
} catch(error) { send({type:"error",message:String(error)}); }
document.addEventListener("message",event=>void analyze(event.data));
window.addEventListener("message",event=>void analyze(event.data));
async function analyze(raw){
  let request;
  try { request=JSON.parse(raw); } catch { return; }
  if(request.type!=="analyze"||!landmarker)return;
  const image=new Image();
  image.onload=()=>{
    try {
      const result=landmarker.detect(image);
      const landmarks=result.landmarks?.[0]||[];
      send({type:"result",id:request.id,landmarks,imageWidth:image.naturalWidth,imageHeight:image.naturalHeight});
    } catch(error) { send({type:"result-error",id:request.id,message:String(error)}); }
  };
  image.onerror=()=>send({type:"result-error",id:request.id,message:"Görüntü okunamadı"});
  image.src="data:image/jpeg;base64,"+request.base64;
}
</script></body></html>`;

export const MediaPipePoseBridge=forwardRef<MediaPipePoseBridgeRef>(function MediaPipePoseBridge(_,ref){
 const webRef=useRef<WebView>(null);
 const pending=useRef(new Map<string,{resolve:(value:PoseAnalysis)=>void;reject:(error:Error)=>void;timeout:ReturnType<typeof setTimeout>}>());
 const[ready,setReady]=useState(false);
 const[loadError,setLoadError]=useState('');
 useImperativeHandle(ref,()=>({
  ready,
  analyze:(base64:string)=>new Promise((resolve,reject)=>{
   if(loadError){reject(new Error(loadError));return}
   if(!ready){reject(new Error('MediaPipe modeli henüz hazır değil'));return}
   const id=`pose-${Date.now()}-${Math.random()}`;
   const timeout=setTimeout(()=>{
    pending.current.delete(id);
    reject(new Error('Poz analizi zaman aşımına uğradı'));
   },12000);
   pending.current.set(id,{resolve,reject,timeout});
   webRef.current?.postMessage(JSON.stringify({type:'analyze',id,base64}));
  }),
 }),[ready,loadError]);
 const onMessage=(event:WebViewMessageEvent)=>{
  const message=JSON.parse(event.nativeEvent.data) as {type:string;id?:string;landmarks?:PoseLandmark[];imageWidth?:number;imageHeight?:number;message?:string};
  if(message.type==='ready'){setLoadError('');setReady(true);return}
  if(message.type==='error'){setLoadError(message.message||'MediaPipe modeli yüklenemedi');return}
  if(!message.id)return;
  const request=pending.current.get(message.id);
  if(!request)return;
  pending.current.delete(message.id);
  clearTimeout(request.timeout);
  if(message.type==='result'&&message.landmarks?.length){
   const confidence=message.landmarks.reduce((sum,item)=>sum+(item.visibility??0),0)/message.landmarks.length;
   request.resolve({landmarks:message.landmarks,confidence,imageWidth:message.imageWidth??1,imageHeight:message.imageHeight??1});
  }else request.reject(new Error(message.message||'Poz algılanamadı'));
 };
 return <View pointerEvents="none" style={styles.hidden}><WebView ref={webRef} source={{html}} javaScriptEnabled onMessage={onMessage} originWhitelist={['*']}/></View>;
});

const styles=StyleSheet.create({hidden:{position:'absolute',width:1,height:1,opacity:.01,left:-10,top:-10}});
