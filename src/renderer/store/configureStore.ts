import { configureStore as configureRTKStore } from '@reduxjs/toolkit';
import appReducer from '../reducers/appReducer';

const configureStore = (preloadedState = {}) => {
  return configureRTKStore({
    reducer: {
      app: appReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) => {
      // 使用默认中间件
      const middlewares = getDefaultMiddleware();
      
      // 开发环境下添加 logger
      if (process.env.NODE_ENV !== 'production') {
        try {
          // 动态导入 redux-logger，避免类型问题
          const { createLogger } = require('redux-logger');
          return middlewares.concat(createLogger({ collapsed: true }));
        } catch (e) {
          console.warn('redux-logger not available:', e);
        }
      }
      
      return middlewares;
    },
  });
};

export default configureStore;