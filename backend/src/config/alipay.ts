import AlipaySdk from 'alipay-sdk';

export const ALIPAY_CONFIG = {
  appId: '9021000162699734',
  gateway: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
  notifyUrl: 'http://localhost:3000/api/payments/alipay/notify',
  returnUrl: 'http://localhost:5173/payment/success',
  charset: 'utf-8',
  version: '1.0',
  signType: 'RSA2' as const,
};

export const ALIPAY_KEYS = {
  privateKey: `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAjlfJlwNMapcapXo17RkQR00VmIKwMX0wdaXU/iDEkg3Am4bs
z6IEWJXWrp7N4Z4Mv/AOMHpb3TA12iUe0gOKCQJK5JDYolO1kNm3lw/sPt2V5W5+
b1U0tu3pt/7wVa85zIfYrM4hrIRGBS1XyInu8z64VWYZXwnjHGBT2svwqBpzgo7O
nnV4U+9wAjfmgVgU6l2l/v1sVvc5usC77AvNlWQd8eywEnVXrD8kiyWwTwifR1C8
ofoRaFbZWvbpfggZ5beTD0V/5KJOyfSjL96y1wkE7cAdCxtzQ8ftZauX3ovwfJmt
j4AvqNKG+75pc7dNK0CSe8JSa61ji+Xtw7F5SwIDAQABAoIBAE29BAvFcWaFP7hA
FlN27L0EDFdOiIt+o4idGMXxf2mEuTw3Y/3Brj3zF1wmvqoJd00b/aPcL2+NdNu+
iiaIaEqjReOud6Gvtel1/h4yRAPRYJv8zHBhSHjfVlV2lis1l4tsZZl6uklNtC//
o4GSUz3lcyawrAqLi81jjmhgGP61Hn1NPc3wheb1DRkAwcoJVU9L/YYxlDmJdvl7
0ZV0sBMSG0qbWXLHnQmjBHIQ/CHBiLO5TCOwfPcBM8R5gx45Uawb2Z3Wdb4jpx6B
/yfjPooGnc9UuGr7iHBfqgV3aBEW6jEGuzcayi/5Id6FfV6/blR3sdkQY68gU5Ai
4zirAYECgYEA6uiNIVPKEWknb0yAEEQYUiV9HBqvk+1ekobXUzeE5dF+YQnWDk3Z
PoJcD15yJjaB7qRw6u6kge6uqnhwGNy3dKLEQJdk0OMaIqHVaWe+Ec6Z7fV4prIg
JSqrrqnd02DHSu+/wJBspPWU2aEZh5iZKUdRM56W6l1Yusa7MO2UiG8CgYEAmx+W
Xj+yAxKkYhx/6dh2lO6GCkbXq3kP5RfaroD8DSGbeo400JZBHuBqtOUjW/URFhsi
pwlNUPAdSqcm+aiM11jTd5d2WB0osVkmrlMKCeDqZh570eag/P14+xA/4X999QdL
XJcCI0jnQzbi8AQcGegDAkcCdegUU0fssA0OcuUCgYEAwsGhWLM+QecbocQcHOBIB
bs9GdLqJMvU78jJtx29mkhw7gUYqm1Souezaa6VFydz3CYL1Eucqnj36S/HSGWd2
B6mdSLPm/vdjD7+T9CKHftbVZWBvTrLOeVBx6Lf3cNMF83j/cP/v1g4W6KcJvaWb
UnKgfCHELHpwZjIU811qxMCgYAu+roHgTLgS10NeaQjpjMDl9lwc1QN0nRF5ZuNDf
NH5s23qCnGojrGpyCp+FtlFis+jqlH/UE1KgM1ALqFEc7VyUkCBxUISoxwaZeVZA
C+TSewFbtaLobDF+Dz6E/wczQqaTMhr3ouRX4ElTLVjekUz3dZ0TeljcvaDQZZqxq
dIQKBgGGgia0QkKmjizKyZ6iotFD4pT7ZtEdAvswNMuUIv85M+rf4fqULL3kh1+Y
Ptr67V6pZxHQSodyAt7CUrukML25To0eUtnnfq6P9raMTXF+aInbN7izDhgVbHQQ
oFIOySxK5NLhrMj3H3OF24HSS83+RiluycsG6fXZK8WHATdzp
-----END RSA PRIVATE KEY-----`,
  alipayPublicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnfoq7hTzoTPn7yqdN5nH
9lOD12qiEK3CsdI2jU8ke8jAOpO9OvvQMGKjryWJoYLJkr28To60UN8TOFEygOGW
UTGHisVz8O3yzJkgX9TjGB1yZrrmbLqvDe5+EgwXsYnolNITAxwjwQvA9g4h6DBM
Qxw1GUsJ92vyC3aLn6/tJqAHqpSD6IVCAQ0eUyM7xMeGhUJiQXvT2Z4vw0P1PWQV
cfH3TjMe3JZ4dyosrmV0v2t3YHgaTx3CZ17q1Dy8HZ1thQi3Jxze2Wh3iwXLHJwL
E3oHnl+Wx+j4hbI5YtbqQ4kJxiHMCgBQaL+n2fMvD/1lrBb/5aqu634xVK6N0wid
uQIDAQAB
-----END PUBLIC KEY-----`
};

let alipaySdkInstance: any | null = null;

export const getAlipaySdk = (): any => {
  if (!alipaySdkInstance) {
    const AlipaySdkClass = (AlipaySdk as any).default || AlipaySdk;
    alipaySdkInstance = new AlipaySdkClass({
      appId: ALIPAY_CONFIG.appId,
      privateKey: ALIPAY_KEYS.privateKey,
      alipayPublicKey: ALIPAY_KEYS.alipayPublicKey,
      gateway: ALIPAY_CONFIG.gateway,
      charset: ALIPAY_CONFIG.charset,
      version: ALIPAY_CONFIG.version,
      signType: ALIPAY_CONFIG.signType,
      notifyUrl: ALIPAY_CONFIG.notifyUrl,
      returnUrl: ALIPAY_CONFIG.returnUrl,
    });
  }
  return alipaySdkInstance;
};

export const createMockAlipayQrCode = (orderId: string, amount: number) => {
  const alipayUrl = `https://qr.alipay.com/demo_${orderId}_${amount}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&ecc=M&margin=10&data=${encodeURIComponent(alipayUrl)}`;
};
