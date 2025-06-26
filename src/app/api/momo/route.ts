import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

type Data = {
  payUrl?: string;
  deeplink?: string;
  response?: any;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST method allowed' });
  }

  const partnerCode = 'MOMO';
  const accessKey = 'F8BBA842ECF85';
  const secretkey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';

  const requestId = partnerCode + new Date().getTime();
  const orderId = requestId;
  const orderInfo = 'pay with MoMo';
  const redirectUrl = 'https://momo.vn/return';
  const ipnUrl = 'https://callback.url/notify';
  const amount = '50000';
  const requestType = 'captureWallet';
  const extraData = '';

  const rawSignature = 
    `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

  const signature = crypto
    .createHmac('sha256', secretkey)
    .update(rawSignature)
    .digest('hex');

  const requestBody = {
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: 'en',
  };

  try {
    const momoRes = await fetch('https://test-payment.momo.vn/v2/gateway/api/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await momoRes.json();

    return res.status(200).json({
      payUrl: data.payUrl,
      deeplink: data.deeplink,
      response: data,
    });
  } catch (error) {
    console.error('MoMo API error:', error);
    return res.status(500).json({ message: 'Failed to connect to MoMo' });
  }
}
