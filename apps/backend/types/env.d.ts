declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      ENDPOINT: string;
      S3_ACCESS_KEY: string;
      S3_SECRET_KEY: string;
      BUCKET_NAME: string;
      CLOUDFLARE_URL: string;
      FRONTEND_URL?: string;
      FAL_KEY: string;
      CLERK_JWT_PUBLIC_KEY: string;
      SIGNING_SECRET: string;
      RAZORPAY_KEY_ID: string;
      RAZORPAY_KEY_SECRET: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

export {}; 