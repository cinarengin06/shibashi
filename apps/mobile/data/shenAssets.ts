import {ImageSourcePropType} from 'react-native';
import {ShenId} from '../types';

export const shenBackgrounds:Record<ShenId,ImageSourcePropType>={
 hun:require('../assets/shen/home-web/hun.webp'),
 shen:require('../assets/shen/home-web/shen.webp'),
 yi:require('../assets/shen/home-web/yi.webp'),
 po:require('../assets/shen/home-web/po.webp'),
 zhi:require('../assets/shen/home-web/zhi.webp'),
};
export const shenMusic:Record<ShenId,number>={
 hun:require('../assets/shen/music/shen-music-hun.mp4'),
 shen:require('../assets/shen/music/shen-music-shen.mp4'),
 yi:require('../assets/shen/music/shen-music-yi.mp4'),
 po:require('../assets/shen/music/shen-music-po.mp4'),
 zhi:require('../assets/shen/music/shen-music-zhi.mp4'),
};
