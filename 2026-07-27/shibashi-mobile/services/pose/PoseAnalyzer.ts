import {PoseFeedback} from '../../types';
export interface PoseAnalyzer{startAnalysis():Promise<void>;stopAnalysis():void;processFrame(frame?:unknown):Promise<void>;getPostureScore():number;getBalanceScore():number;getFlowScore():number;getCorrections():string[]}
export class MockPoseAnalyzer implements PoseAnalyzer{
 private active=false;private tick=0;
 async startAnalysis(){this.active=true} stopAnalysis(){this.active=false}
 async processFrame(){if(this.active)this.tick++}
 private score(offset:number){return Math.min(96,74+((this.tick*7+offset)%21))}
 getPostureScore(){return this.score(3)} getBalanceScore(){return this.score(8)} getFlowScore(){return this.score(13)}
 getCorrections(){return this.tick%2===0?['Omuzlarını biraz daha serbest bırak.']:['Ağırlığını iki ayağa eşit dağıt.']}
 snapshot():PoseFeedback{return{postureScore:this.getPostureScore(),balanceScore:this.getBalanceScore(),flowScore:this.getFlowScore(),corrections:this.getCorrections()}}
}
