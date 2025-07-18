/**
 * Chrome扩展存储工具
 */

export interface StorageArea {
  get(keys?: string | string[] | Record<string, any>): Promise<Record<string, any>>
  set(items: Record<string, any>): Promise<void>
  remove(keys: string | string[]): Promise<void>
  clear(): Promise<void>
}

/**
 * 包装Chrome存储API为Promise
 */
class ChromeStorage implements StorageArea {
  constructor(private area: chrome.storage.StorageArea) {}

  async get(keys?: string | string[] | Record<string, any>): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      this.area.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(result)
        }
      })
    })
  }

  async set(items: Record<string, any>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.area.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve()
        }
      })
    })
  }

  async remove(keys: string | string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.area.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve()
        }
      })
    })
  }

  async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.area.clear(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve()
        }
      })
    })
  }
}

/**
 * 存储适配器
 */
export const storage = {
  local: new ChromeStorage(chrome.storage.local),
  sync: new ChromeStorage(chrome.storage.sync)
}

/**
 * 类型安全的存储工具
 */
export class TypedStorage<T> {
  constructor(
    private key: string,
    private defaultValue: T,
    private area: StorageArea = storage.local
  ) {}

  /**
   * 获取值
   */
  async get(): Promise<T> {
    try {
      const result = await this.area.get(this.key)
      return result[this.key] ?? this.defaultValue
    } catch (error) {
      console.error(`获取存储值失败 (${this.key}):`, error)
      return this.defaultValue
    }
  }

  /**
   * 设置值
   */
  async set(value: T): Promise<void> {
    try {
      await this.area.set({ [this.key]: value })
    } catch (error) {
      console.error(`设置存储值失败 (${this.key}):`, error)
      throw error
    }
  }

  /**
   * 删除值
   */
  async remove(): Promise<void> {
    try {
      await this.area.remove(this.key)
    } catch (error) {
      console.error(`删除存储值失败 (${this.key}):`, error)
      throw error
    }
  }

  /**
   * 更新值
   */
  async update(updater: (current: T) => T): Promise<void> {
    const current = await this.get()
    const updated = updater(current)
    await this.set(updated)
  }
}

/**
 * 监听存储变化
 */
export function onStorageChanged(
  callback: (changes: Record<string, chrome.storage.StorageChange>) => void
): () => void {
  chrome.storage.onChanged.addListener(callback)
  
  return () => {
    chrome.storage.onChanged.removeListener(callback)
  }
}

/**
 * 获取存储使用情况
 */
export async function getStorageUsage(): Promise<{
  bytesInUse: number
  quotaBytes: number
  percentUsed: number
}> {
  try {
    const [localUsage, localQuota] = await Promise.all([
      new Promise<number>((resolve) => {
        chrome.storage.local.getBytesInUse(null, resolve)
      }),
      new Promise<number>((resolve) => {
        chrome.storage.local.getBytesInUse(null, (bytes) => {
          // Chrome local storage quota is typically 5MB
          resolve(5 * 1024 * 1024)
        })
      })
    ])

    return {
      bytesInUse: localUsage,
      quotaBytes: localQuota,
      percentUsed: (localUsage / localQuota) * 100
    }
  } catch (error) {
    console.error('获取存储使用情况失败:', error)
    return {
      bytesInUse: 0,
      quotaBytes: 5 * 1024 * 1024,
      percentUsed: 0
    }
  }
} 