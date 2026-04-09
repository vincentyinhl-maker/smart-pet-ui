import crypto from 'crypto';
import axios from 'axios';

const CLIENT_ID = 'xqc4wj8xqpmxqpyk4ptq';
const CLIENT_SECRET = '6aea5b3e86e14780a573706b969a3575';

const REGIONS = [
  { name: 'China', url: 'https://openapi.tuyacn.com' },
  { name: 'Western America', url: 'https://openapi.tuyaus.com' },
  { name: 'Eastern America', url: 'https://openapi-ueaz.tuyaus.com' },
  { name: 'Central Europe', url: 'https://openapi.tuyaeu.com' },
  { name: 'Western Europe', url: 'https://openapi-weaz.tuyaeu.com' },
  { name: 'India', url: 'https://openapi.tuyain.com' }
];

function hmacSign(str, secret) {
  return crypto.createHmac('sha256', secret).update(str).digest('hex').toUpperCase();
}

async function testAllRegions() {
  console.log('--- Testing Tuya Regions ---');
  for (const region of REGIONS) {
    const t = Date.now().toString();
    const strToSign = CLIENT_ID + t;
    const sign = hmacSign(strToSign, CLIENT_SECRET);

    try {
      const resp = await axios.get(`${region.url}/v1.0/token?grant_type=1`, {
        headers: {
          client_id: CLIENT_ID,
          sign,
          t,
          sign_method: 'HMAC-SHA256',
        },
        timeout: 5000
      });
      console.log(`[${region.name}] Result:`, resp.data.success ? 'SUCCESS' : 'FAILED: ' + resp.data.msg);
      if (resp.data.success) {
        console.log(`>>> Found active region: ${region.url}`);
        return;
      }
    } catch (err) {
      console.log(`[${region.name}] Request Error:`, err.message);
    }
  }
}

testAllRegions();
