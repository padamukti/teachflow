import {handleWordwall} from '../../shared/wordwall.mjs';
// Native Netlify per-IP rate limiting, not an in-memory serverless counter.
export const config = {path:'/api/wordwall',rateLimit:{windowLimit:30,windowSize:60,aggregateBy:['ip','domain']}};
export default (request) => handleWordwall(request);
