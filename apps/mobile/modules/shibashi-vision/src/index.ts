import {requireOptionalNativeModule} from 'expo-modules-core';

export type AppleVisionJoint3D={
 name:string;
 x:number;
 y:number;
 z:number;
 imageX:number;
 imageY:number;
 confidence:number;
};

export type AppleVisionBodyPose3D={
 source:'apple-vision-3d';
 jointCount:number;
 bodyHeightMeters:number;
 heightEstimation:'measured'|'reference';
 joints:AppleVisionJoint3D[];
};

type NativeVisionModule={
 isAvailable:()=>boolean;
 analyzeBase64:(base64:string)=>Promise<AppleVisionBodyPose3D>;
};

const nativeModule=requireOptionalNativeModule<NativeVisionModule>('ShibashiVision');

export function isAppleVision3DAvailable(){
 return nativeModule?.isAvailable()??false;
}

export async function analyzeWithAppleVision3D(base64:string){
 if(!nativeModule||!nativeModule.isAvailable())return null;
 return nativeModule.analyzeBase64(base64);
}
