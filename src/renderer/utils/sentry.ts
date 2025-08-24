
import * as Sentry from '@sentry/browser';
import { SENTRY_DSN, npm_env, VERSION } from '../config';

export const sentryInit = () => {
    Sentry.init({
        dsn: SENTRY_DSN,
        environment: npm_env,        // 环境
        debug: true,                 // debug开关
        sampleRate: 1.0,             // 采样率
        logErrors: true,             // 
        release: 'live_teacher@' + VERSION,    // 版本追踪
        beforeSend: function(event, hint){
            return event;
        }
    });
}

export const sentryCaptureMessage = (message: string) => {
    Sentry.captureMessage(message);
}



