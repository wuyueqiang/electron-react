import request from './requst';

// API 基础地址
const BASE_URL = 'http://192.169.2.72:8890'; // 这里替换为实际的API地址

// 接口返回类型定义
// interface TokenResponse {
//     token: string;
//     wsUrl: string;
// }

interface TokenParams {
    roomName: string;
    identity: string;
}

/**
 * 获取用户 Token
 * @param params 请求参数
 * @returns Promise<TokenResponse>
 */
export async function getUserToken(params: TokenParams): Promise<any> {
    return request.post<any>(`${BASE_URL}/getToken`, params);
}

export default {
    getUserToken,
};
