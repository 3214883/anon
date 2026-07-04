declare module 'alipay-sdk' {
  interface AlipaySdkConfig {
    appId: string;
    privateKey: string;
    alipayPublicKey?: string;
    gateway?: string;
    timeout?: number;
    charset?: string;
    version?: string;
    signType?: string;
    notifyUrl?: string;
    returnUrl?: string;
  }

  interface AlipayExecuteOptions {
    bizContent?: Record<string, any>;
    notify_url?: string;
    return_url?: string;
    [key: string]: any;
  }

  export default class AlipaySdk {
    constructor(config: AlipaySdkConfig);
    exec(method: string, options?: AlipayExecuteOptions): Promise<any>;
    pageExecute(options: { method: string; [key: string]: any }): Promise<string>;
    sdkExecute(options: { method: string; [key: string]: any }): Promise<string>;
    checkNotifySign(params: Record<string, any>): boolean;
  }
}
