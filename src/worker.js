/**
 * Worker ES Module 格式
 * 导出一个包含 fetch 方法的对象作为 Worker 的处理程序。
 */
export default {
    /**
     * @param {Request} request 传入的请求对象
     * @param {any} env 环境变量（例如 KV, D1 等绑定）
     * @param {ExecutionContext} ctx 执行上下文
     */
    async fetch(request, env, ctx) {
        if (request.method === 'OPTIONS') {
            return handleOptionsRequest();
        }

        return handleRequest(request);
    }
};

// 原始逻辑保持不变，但不再需要 addEventListener
// 只需直接调用 handleRequest

async function handleRequest(request) {
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname + url.search;
    const headers = new Headers(request.headers);

    // 注意：请确保 API 域名 `x.ai` 是正确的。
    // 如果它应该是一个变量，请使用 env.YOUR_API_HOST
    const apiUrl = `https://api.x.ai${path}`;

    const authHeader = headers.get('Authorization');
    if (!authHeader) {
        // 返回 CORS 友好的 401 响应
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        };
        return new Response('Missing Authorization header', { status: 401, headers: corsHeaders });
    }

    const apiRequest = new Request(apiUrl, {
        method: method,
        headers: headers,
        // 根据请求方法判断是否需要读取 body
        body: (method !== 'GET' && method !== 'HEAD') ? await request.blob() : null,
    });

    const apiResponse = await fetch(apiRequest);

    // 复制响应，并添加 CORS 头部
    const response = new Response(apiResponse.body, apiResponse);
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
}

function handleOptionsRequest() {
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Max-Age', '86400'); // 缓存预检请求 24 小时
    return new Response(null, { headers });
}
