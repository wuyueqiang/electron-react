import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const ysLiveClientSlice = createSlice({
  name: 'ysLiveClient',
  initialState: null,
  reducers: {
    initYsLiveClient: (state, action: PayloadAction<any>) => {
      return action.payload;
    }
  }
});

export const { initYsLiveClient } = ysLiveClientSlice.actions;
export default ysLiveClientSlice.reducer;
