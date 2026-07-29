import {ImageSourcePropType} from 'react-native';
import {ShenId} from '../types';

export const shenBackgrounds:Record<ShenId,ImageSourcePropType>={
 hun:require('../assets/shen/images/shen-river-hun.jpg'),
 shen:require('../assets/shen/images/shen-river-shen.jpg'),
 yi:require('../assets/shen/images/shen-river-yi.jpg'),
 po:require('../assets/shen/images/shen-river-po.jpg'),
 zhi:require('../assets/shen/images/shen-river-zhi.jpg'),
};
export const shenMusic:Record<ShenId,number>={
 hun:require('../assets/shen/music/shen-music-hun.mp4'),
 shen:require('../assets/shen/music/shen-music-shen.mp4'),
 yi:require('../assets/shen/music/shen-music-yi.mp4'),
 po:require('../assets/shen/music/shen-music-po.mp4'),
 zhi:require('../assets/shen/music/shen-music-zhi.mp4'),
};
