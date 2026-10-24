import {requireOptionalNativeModule} from 'expo-modules-core';

export type PreviewFrame={base64:string;width:number;height:number;uri?:string};

type NativePreviewModule={captureFrame:(save:boolean)=>Promise<PreviewFrame>};

const previewModule=requireOptionalNativeModule<NativePreviewModule>('ShibashiPreview');

export function isPreviewFrameAvailable(){return Boolean(previewModule)}

export function capturePreviewFrame(save=false){
 if(!previewModule)throw new Error('Kamera önizleme modülü bulunamadı');
 return previewModule.captureFrame(save);
}
