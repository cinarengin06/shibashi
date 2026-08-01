import type{Practice2MetricId}from'./types';

export const staticMetricWeights:Partial<Record<Practice2MetricId,number>>={alignment:.15,weightDistribution:.15,kneeAngles:.20,torsoBalance:.15,armPosition:.15,shoulderHipLevel:.10,stability:.10};
export const dynamicMetricWeights:Partial<Record<Practice2MetricId,number>>={timing:.16,movementPath:.16,armSync:.12,fluidity:.12,torsoRotation:.08,weightTransfer:.10,kneeAngle:.08,range:.08,startMatch:.05,endMatch:.05};
export const practice2VisibilityThreshold=.42;
export const practice2MinimumLandmarks=10;
