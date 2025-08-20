interface RequestOptions extends RequestInit {
    timeout?: number;
}

interface ResponseData<T = any> {
    code: number;
    data: T;
    msg: string;
    fail: boolean;
    success: boolean;
}

class RequestError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'RequestError';
    }
}

/**
 * 基础请求方法
 * @param url 请求地址
 * @param options 请求配置
 * @returns Promise
 */
async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const {
        timeout = 10000, // 默认超时时间 10s
        headers = {},
        ...restOptions
    } = options;

    // 超时处理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...restOptions,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new RequestError(response.status, `HTTP error! status: ${response.status}`);
        }

        const data: ResponseData<T> = await response.json();
        
        // 这里可以根据后端的错误码规范进行统一处理
        if (data.code !== 200) {
            throw new Error(data.msg || '请求失败');
        }

        return data.data;
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error('请求超时');
            }
            throw error;
        }
        throw new Error('请求失败');
    }
}

/**
 * GET 请求
 * @param url 请求地址
 * @param params 请求参数
 * @param options 请求配置
 * @returns Promise
 */
export async function get<T = any>(
    url: string,
    params: Record<string, any> = {},
    options: Omit<RequestOptions, 'method' | 'body'> = {}
): Promise<T> {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    
    return request<T>(fullUrl, {
        ...options,
        method: 'GET',
    });
}

/**
 * POST 请求
 * @param url 请求地址
 * @param data 请求数据
 * @param options 请求配置
 * @returns Promise
 */
export async function post<T = any>(
    url: string,
    data: Record<string, any> = {},
    options: Omit<RequestOptions, 'method' | 'body'> = {}
): Promise<T> {
    return request<T>(url, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export default {
    get,
    post,
};
