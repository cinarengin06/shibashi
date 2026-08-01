import type {ImageSourcePropType} from 'react-native';
import {bedroomPushPractice,getLivingPractice,livingPractices,livingReferencePoses,livingScenes,livingStepAt} from '../../../packages/living-learning';

export {bedroomPushPractice,getLivingPractice,livingPractices,livingReferencePoses,livingScenes,livingStepAt};
export type {LivingComparisonResult,LivingMovementStep,LivingPosePoint,LivingPracticeResult,LivingScene,LivingSceneId} from '../../../packages/living-learning';

export const livingSceneImages:Record<string,ImageSourcePropType>={
 bedroom:require('../assets/living-learning/yeni-gun.png'),
 lake:require('../assets/living-learning/golde-yolculuk.png'),
 curtains:require('../assets/living-learning/curtains-opening.png'),
 garden:require('../assets/living-learning/garden-rainbow.png'),
 pottery:require('../assets/living-learning/pottery-cloud-hands.png'),
 gate:require('../assets/living-learning/garden-gate.png'),
};

export const livingSceneMusic:Record<string,number>={
 bedroom:require('../assets/shen/music/shen-music-po.mp4'),
 lake:require('../assets/shen/music/shen-music-zhi.mp4'),
 curtains:require('../assets/shen/music/shen-music-hun.mp4'),
 garden:require('../assets/shen/music/shen-music-shen.mp4'),
 pottery:require('../assets/shen/music/shen-music-yi.mp4'),
 gate:require('../assets/shen/music/shen-music-po.mp4'),
};

export function normalizeLivingSceneId(id?:string){
 if(id&&livingScenes.some(scene=>scene.id===id))return id;
 if(id==='story-6')return'lake';
 return'bedroom';
}
