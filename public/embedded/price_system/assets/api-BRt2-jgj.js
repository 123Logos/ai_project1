(function (global) {
  const config = global.API_CONFIG || {};
  const baseUrl = (config.baseUrl == null ? '' : config.baseUrl).replace(/\/$/, '');
  const apiPathPrefix = String(config.apiPathPrefix || '').replace(/\/$/, '');
  const fallbackBaseUrls = Array.isArray(config.fallbackBaseUrls) ? config.fallbackBaseUrls : [];

  // ─── URL 构建 ──────────────────────────────────────────

  function buildUrl(path) {
    const normalized = path.startsWith('/') ? path : '/' + path;
    return apiPathPrefix ? baseUrl + apiPathPrefix + normalized : baseUrl + normalized;
  }

  // ─── 请求头 ────────────────────────────────────────────

  function buildHeaders(hasBody) {
    const headers = {};
    const token = localStorage.getItem('api_token');
    if (token) headers.Authorization = 'Bearer ' + token;
    if (hasBody) headers['Content-Type'] = 'application/json';
    return headers;
  }

  // ─── 错误格式化 ────────────────────────────────────────

  function formatError(data) {
    if (!data || typeof data !== 'object') return '请求失败';
    if (data.message) return String(data.message);
    if (data.detail) {
      const detail = data.detail;
      if (Array.isArray(detail)) {
        return detail
          .map(function (item) {
            return typeof item === 'string' ? item : item.msg || item.message || JSON.stringify(item);
          })
          .join('; ');
      }
      return String(detail);
    }
    return '请求失败';
  }

  // ─── 路径解析（自动补 /tl 前缀）────────────────────────

  const TL_PATHS = [
    '/get_smelters', '/add_smelter', '/update_smelter', '/delete_smelter',
    '/get_warehouses', '/add_warehouse', '/update_warehouse', '/delete_warehouse',
    '/upload_freight', '/get_freight_list', '/update_freight', '/delete_freight',
    '/get_categories', '/delete_category', '/get_category_mapping', '/update_category_mapping',
    '/get_tax_rates', '/upsert_tax_rates', '/delete_tax_rate',
    '/upload_price_table', '/confirm_price_table',
    '/get_comparison', '/get_purchase_suggestion',
  ];

  function resolvePath(rawPath) {
    const trimmed = (rawPath || '').trim();
    if (!trimmed) return '/';
    const path = trimmed.startsWith('/') ? trimmed : '/' + trimmed;

    if (
      path.startsWith('/tl/') ||
      path.startsWith('/t1/') ||
      path.startsWith('/auth/') ||
      path.startsWith('/api/')
    ) {
      return path;
    }
    if (TL_PATHS.includes(path)) {
      return '/tl' + path;
    }
    return path;
  }

  // ─── 通用请求 ──────────────────────────────────────────

  async function request(method, path, body) {
    const resolved = resolvePath(path);
    const url = buildUrl(resolved);
    const isForm = typeof FormData < 'u' && body instanceof FormData;
    const hasBody = body != null && !isForm && method !== 'GET' && method !== 'DELETE';

    const fetchOptions = {
      method,
      headers: buildHeaders(!!hasBody),
    };
    if (body != null && method !== 'GET' && method !== 'DELETE') {
      fetchOptions.body = hasBody ? JSON.stringify(body) : body;
    }

    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (err) {
      if (!fallbackBaseUrls.length) throw err;
      let lastError = err;
      for (const fallback of fallbackBaseUrls) {
        try {
          response = await fetch(fallback.replace(/\/$/, '') + resolved, fetchOptions);
          break;
        } catch (e) {
          lastError = e;
        }
      }
      if (!response) throw lastError;
    }

    const text = await response.text();

    if (text && /^\s*</.test(text)) {
      throw Error(
        '接口返回了 HTML 而非 JSON。可不改 Nginx：在项目根建 .env.production 设置 VITE_TL_ORIGIN 为 TL 的完整地址（须 HTTPS 且允许本站 CORS），重新 npm run build；或让站点根 /tl 反代到 TL 接口。'
      );
    }

    let data = null;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      if (!response.ok) throw Error(text.slice(0, 200) || response.statusText);
      return text;
    }

    if (!response.ok) throw Error(formatError(data) + ' (' + method + ' ' + resolved + ')');
    return data;
  }

  // ─── Blob 下载 ─────────────────────────────────────────

  async function getBlob(path) {
    const resolved = resolvePath(path);
    const url = buildUrl(resolved);
    const headers = buildHeaders(false);

    let response;
    try {
      response = await fetch(url, { method: 'GET', headers });
    } catch (err) {
      if (!fallbackBaseUrls.length) throw err;
      let lastError = err;
      for (const fallback of fallbackBaseUrls) {
        try {
          response = await fetch(fallback.replace(/\/$/, '') + resolved, { method: 'GET', headers });
          break;
        } catch (e) {
          lastError = e;
        }
      }
      if (!response) throw lastError;
    }

    if (!response.ok) {
      const text = await response.text();
      let data = {};
      try { data = JSON.parse(text); } catch {}
      throw Error((formatError(data) || text.slice(0, 200) || response.statusText) + ' (GET ' + resolved + ')');
    }

    return response.blob();
  }

  // ─── Blob 请求 ─────────────────────────────────────────

  async function requestBlob(method, path, body) {
    const resolved = resolvePath(path);
    const url = buildUrl(resolved);
    const isForm = typeof FormData < 'u' && body instanceof FormData;
    const hasBody = body != null && !isForm && method !== 'GET' && method !== 'DELETE';

    const fetchOptions = {
      method,
      headers: buildHeaders(!!hasBody),
    };
    if (body != null && method !== 'GET' && method !== 'DELETE') {
      fetchOptions.body = hasBody ? JSON.stringify(body) : body;
    }

    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (err) {
      if (!fallbackBaseUrls.length) throw err;
      let lastError = err;
      for (const fallback of fallbackBaseUrls) {
        try {
          response = await fetch(fallback.replace(/\/$/, '') + resolved, fetchOptions);
          break;
        } catch (e) {
          lastError = e;
        }
      }
      if (!response) throw lastError;
    }

    if (!response.ok) {
      const text = await response.text();
      let data = {};
      try { data = JSON.parse(text); } catch {}
      throw Error((formatError(data) || text.slice(0, 200) || response.statusText) + ' (' + method + ' ' + resolved + ')');
    }

    return response.blob();
  }

  // ─── 数据解包 ──────────────────────────────────────────

  function unwrapData(response) {
    if (typeof response !== 'object' || !response) return response;
    if ('data' in response) return response.data;
    return response;
  }

  function unwrapList(response) {
    const data = unwrapData(response);
    if (data == null) return [];
    if (Array.isArray(data)) return data;
    if (typeof data !== 'object') return [];

    if (Array.isArray(data.list)) return data.list;
    if (Array.isArray(data.items)) return data.items;

    const LIST_KEYS = ['records', 'rows', 'warehouses', 'categories', 'smelters', 'factories', 'rates', 'results', 'mapping'];
    for (const key of LIST_KEYS) {
      if (Array.isArray(data[key])) return data[key];
    }

    return Array.isArray(data.data) ? data.data : [];
  }

  // ─── 图片上传 ──────────────────────────────────────────

  async function uploadQuoteImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    return request('POST', '/tl/upload_price_table', formData);
  }

  // ─── 导出 ──────────────────────────────────────────────

  global.Api = {
    API_BASE: baseUrl,
    API_PATH_PREFIX: apiPathPrefix,
    request,
    requestBlob,
    unwrapData,
    unwrapList,
    getBlob,
    uploadQuoteImage,
  };
})(typeof window < 'u' ? window : void 0);
