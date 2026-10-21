const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8721/api'

interface RequestOptions {
  url: string
  data?: any
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
}

interface ApiError extends Error {
  statusCode: number
}

class SessionInvalidatedError extends Error {}

function buildUrl(path: string) {
  const base = BASE_URL.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return base + normalizedPath
}

function getErrorMessage(err: any, fallback: string) {
  return err?.errMsg || err?.message || fallback
}

function parseBody(data: any) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data || '{}')
    } catch {
      return {}
    }
  }
  return data || {}
}

function responseError(res: any, fallback: string): ApiError | null {
  const body = parseBody(res.data)
  const statusCode = Number(res.statusCode) || 0
  const bodyCode = body.code === undefined || body.code === null
    ? Number.NaN
    : Number(body.code)

  if (statusCode >= 200 && statusCode < 300 && bodyCode === 0) {
    return null
  }

  const error = new Error(
    typeof body.message === 'string' ? body.message : fallback,
  ) as ApiError
  error.statusCode = statusCode === 401 || bodyCode === 401
    ? 401
    : statusCode || (Number.isFinite(bodyCode) ? bodyCode : 0)
  return error
}

function isUnauthorized(error: unknown): error is ApiError {
  return error instanceof Error && Number((error as ApiError).statusCode) === 401
}

function isAuthEndpoint(path: string) {
  return path.replace(/^\/+/, '').startsWith('auth/')
}

let authRecoveryPromise: Promise<string> | null = null
let wechatLoginPromise: Promise<{ token: string }> | null = null
let lastRecoveryToastAt = 0
let authSessionVersion = 0

export function clearAuthSession() {
  authSessionVersion += 1
  authRecoveryPromise = null
  wechatLoginPromise = null
  uni.removeStorageSync('token')
  uni.removeStorageSync('userInfo')
}

function handleUnauthorized() {
  clearAuthSession()
  uni.showToast({ title: '登录已过期，请重新进入小程序', icon: 'none' })
  uni.reLaunch({ url: '/pages/index/index' })
}

function postAuth<T>(path: string, data: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: buildUrl(path),
      method: 'POST',
      data,
      header: { 'Content-Type': 'application/json' },
      success: (res: any) => {
        const error = responseError(res, '认证请求失败')
        if (error) {
          reject(error)
          return
        }
        resolve(parseBody(res.data).data as T)
      },
      fail: (err) => reject(new Error(getErrorMessage(err, '网络请求失败'))),
    })
  })
}

export function loginWithWechat(): Promise<{ token: string }> {
  if (wechatLoginPromise) return wechatLoginPromise

  const sessionVersion = authSessionVersion
  let trackedPromise: Promise<{ token: string }>
  const loginPromise = new Promise<{ token: string }>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (result: any) => {
        if (!result.code) {
          reject(new Error('微信登录未获取到 code'))
          return
        }

        postAuth<{ token: string }>('/auth/login', { code: result.code })
          .then((data) => {
            if (!data?.token) {
              throw new Error('登录响应缺少 token')
            }
            if (sessionVersion !== authSessionVersion) {
              throw new SessionInvalidatedError('登录状态已退出')
            }
            uni.setStorageSync('token', data.token)
            resolve(data)
          })
          .catch(reject)
      },
      fail: (err) => reject(new Error(getErrorMessage(err, '微信登录失败'))),
    })
  })

  trackedPromise = loginPromise.finally(() => {
    if (wechatLoginPromise === trackedPromise) {
      wechatLoginPromise = null
    }
  })
  wechatLoginPromise = trackedPromise
  return trackedPromise
}

function recoverAuthentication(
  failedToken = '',
  expectedSessionVersion = authSessionVersion,
): Promise<string> {
  if (expectedSessionVersion !== authSessionVersion) {
    return Promise.reject(new SessionInvalidatedError('登录状态已退出'))
  }

  const currentToken = String(uni.getStorageSync('token') || '')
  if (currentToken && currentToken !== failedToken) {
    return Promise.resolve(currentToken)
  }
  if (authRecoveryPromise) return authRecoveryPromise

  const sessionVersion = authSessionVersion
  const tokenToRefresh = currentToken
  const recovery = (async () => {
    if (tokenToRefresh) {
      try {
        const data = await postAuth<{ token: string }>('/auth/refresh', {
          token: tokenToRefresh,
        })
        if (!data?.token) throw new Error('刷新响应缺少 token')
        if (sessionVersion !== authSessionVersion) {
          throw new SessionInvalidatedError('登录状态已退出')
        }
        uni.setStorageSync('token', data.token)
        return data.token
      } catch (error) {
        if (error instanceof SessionInvalidatedError) throw error
        if (!isUnauthorized(error)) throw error
      }
    }

    const data = await loginWithWechat()
    if (sessionVersion !== authSessionVersion) {
      throw new SessionInvalidatedError('登录状态已退出')
    }
    return data.token
  })()

  let trackedPromise: Promise<string>
  trackedPromise = recovery.finally(() => {
    if (authRecoveryPromise === trackedPromise) {
      authRecoveryPromise = null
    }
  })
  authRecoveryPromise = trackedPromise
  return trackedPromise
}

export function restoreSessionToken(): Promise<string> {
  return recoverAuthentication(String(uni.getStorageSync('token') || ''))
}

async function waitForAuthRecovery() {
  const pending = authRecoveryPromise
  if (pending) await pending
}

function showRecoveryFailure() {
  const now = Date.now()
  if (now - lastRecoveryToastAt < 2500) return
  lastRecoveryToastAt = now
  uni.showToast({ title: '登录状态续期失败，请稍后重试', icon: 'none' })
}

function isSessionInvalidated(error: unknown) {
  return error instanceof SessionInvalidatedError
}

function showRequestError(error: Error, fallback: string) {
  uni.showToast({ title: error.message || fallback, icon: 'none' })
}

function sendRequest<T = any>(options: RequestOptions, retried = false): Promise<T> {
  const sessionVersion = authSessionVersion
  const token = String(uni.getStorageSync('token') || '')

  return new Promise((resolve, reject) => {
    uni.request({
      url: buildUrl(options.url),
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res: any) => {
        const body = parseBody(res.data)
        const error = responseError(res, `请求失败(${Number(res.statusCode) || 0})`)

        if (error) {
          if (isUnauthorized(error)) {
            if (isAuthEndpoint(options.url)) {
              reject(error)
              return
            }
            if (retried) {
              handleUnauthorized()
              reject(error)
              return
            }

            recoverAuthentication(token, sessionVersion).then(
              () => {
                sendRequest<T>(options, true).then(resolve, reject)
              },
              (recoveryError) => {
                if (!isSessionInvalidated(recoveryError)) showRecoveryFailure()
                reject(recoveryError)
              },
            )
            return
          }

          showRequestError(error, '请求失败')
          reject(error)
          return
        }

        resolve(body.data)
      },
      fail: (err) => {
        const error = new Error(getErrorMessage(err, '网络请求失败'))
        showRequestError(error, '网络请求失败')
        reject(error)
      },
    })
  })
}

export async function request<T = any>(options: RequestOptions): Promise<T> {
  if (!isAuthEndpoint(options.url)) {
    try {
      await waitForAuthRecovery()
    } catch (error) {
      if (!isSessionInvalidated(error)) showRecoveryFailure()
      throw error
    }
  }
  return sendRequest<T>(options)
}

function sendUpload<T = any>(filePath: string, url: string, retried = false): Promise<T> {
  const sessionVersion = authSessionVersion
  const token = String(uni.getStorageSync('token') || '')

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: buildUrl(url),
      filePath,
      name: 'file',
      header: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res: any) => {
        const body = parseBody(res.data)
        const error = responseError(res, `上传失败(${Number(res.statusCode) || 0})`)

        if (error) {
          if (isUnauthorized(error)) {
            if (retried) {
              handleUnauthorized()
              reject(error)
              return
            }

            recoverAuthentication(token, sessionVersion).then(
              () => {
                sendUpload<T>(filePath, url, true).then(resolve, reject)
              },
              (recoveryError) => {
                if (!isSessionInvalidated(recoveryError)) showRecoveryFailure()
                reject(recoveryError)
              },
            )
            return
          }

          showRequestError(error, '上传失败')
          reject(error)
          return
        }

        resolve(body.data)
      },
      fail: (err) => {
        const error = new Error(getErrorMessage(err, '上传失败，请检查网络或域名配置'))
        showRequestError(error, '上传失败')
        reject(error)
      },
    })
  })
}

export async function uploadFile<T = any>(filePath: string, url: string): Promise<T> {
  try {
    await waitForAuthRecovery()
  } catch (error) {
    if (!isSessionInvalidated(error)) showRecoveryFailure()
    throw error
  }
  return sendUpload<T>(filePath, url)
}
