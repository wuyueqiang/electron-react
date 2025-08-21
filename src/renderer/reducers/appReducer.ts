import { createSlice } from '@reduxjs/toolkit';

// 定义初始状态
interface AppState {
  version: string;
}

const initialState: AppState = {
  version: '1.0.0',
};

// 创建 slice
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // 添加你的 reducers
    setVersion: (state, action) => {
      state.version = action.payload;
    },
  },
});

// 导出 actions
export const { setVersion } = appSlice.actions;

// 导出 reducer
export default appSlice.reducer;