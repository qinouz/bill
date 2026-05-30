import { ref } from 'vue'

declare const wx: any

export function useVoiceRecord() {
  const isRecording = ref(false)
  const interimText = ref('')
  const recognizedText = ref('')
  let resultCallback: ((text: string) => void) | null = null
  let errorCallback: ((errMsg: string) => void) | null = null
  let recordManager: any = null
  let isInitialized = false

  // 初始化 WechatSI 插件
  function initPlugin() {
    if (isInitialized) return true

    try {
      const plugin = wx.requirePlugin('WechatSI')
      recordManager = plugin.getRecordRecognitionManager()

      recordManager.onRecognize = (res: any) => {
        interimText.value = res.result || ''
      }

      recordManager.onStop = (res: any) => {
        isRecording.value = false
        recognizedText.value = res.result || ''
        if (resultCallback && res.result) {
          resultCallback(res.result)
        } else if (!res.result) {
          uni.showToast({ title: '未识别到内容', icon: 'none' })
          if (errorCallback) {
            errorCallback('未识别到内容')
          }
        }
      }

      recordManager.onError = (res: any) => {
        isRecording.value = false
        console.error('录音错误:', res)
        const errMsg = res.msg || '未知错误'
        uni.showToast({ title: '语音识别失败: ' + errMsg, icon: 'none' })
        if (errorCallback) {
          errorCallback(errMsg)
        }
      }

      isInitialized = true
      return true
    } catch (e) {
      console.error('WechatSI plugin init failed:', e)
      return false
    }
  }

  // 开始录音
  function startRecord() {
    if (!initPlugin()) {
      uni.showToast({ title: '语音识别不可用', icon: 'none' })
      return
    }

    isRecording.value = true
    interimText.value = ''
    recognizedText.value = ''

    try {
      recordManager.start({ lang: 'zh_CN' })
    } catch (e) {
      isRecording.value = false
      uni.showToast({ title: '启动录音失败', icon: 'none' })
    }
  }

  // 停止录音
  function stopRecord() {
    if (recordManager && isRecording.value) {
      recordManager.stop()
    }
  }

  // 取消录音
  function cancelRecord() {
    isRecording.value = false
    if (recordManager) {
      try {
        recordManager.stop()
      } catch (e) {
        // ignore
      }
    }
  }

  // 设置结果回调
  function onResult(cb: (text: string) => void) {
    resultCallback = cb
  }

  // 设置错误回调
  function onError(cb: (errMsg: string) => void) {
    errorCallback = cb
  }

  return {
    isRecording,
    interimText,
    recognizedText,
    startRecord,
    stopRecord,
    cancelRecord,
    onResult,
    onError,
  }
}
