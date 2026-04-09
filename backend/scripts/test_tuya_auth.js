import crypto from 'crypto';
import axios from 'axios';

const CLIENT_ID = 'xqc4wj8xqpmxqpyk4ptq';
const CLIENT_SECRET = '6aea5b3e86e14780a573706b969a3575';
const BASE_URL = 'https://openapi.tuyacn.com';

function hmacSign(str, secret) {
  return crypto.createHmac('sha256', secret).update(str).digest('hex').toUpperCase();
}

async function testToken() {
  const t = Date.now().toString();
  const strToSign = CLIENT_ID + t;
  const sign = hmacSign(strToSign, CLIENT_SECRET);

  console.log('--- Debug Tuya Auth ---');
  console.log('Timestamp:', t);
  console.log('ID:', CLIENT_ID);
  console.log('StringToSign:', strToSign);
  console.log('Secret:', CLIENT_SECRET.substring(0, 4) + '...');
  console.log('Sign:', sign);

  try {
    const resp = await axios.get(`${BASE_URL}/v1.0/token?grant_type=1`, {
      headers: {
        client_id: CLIENT_ID,
        sign,
        t,
        sign_method: 'HMAC-SHA256',
      }
    });
    console.log('Response:', JSON.stringify(resp.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.log('Error Response:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.log('Error:', err.message);
    }
  }
}

testToken();
