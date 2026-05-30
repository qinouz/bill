import { ref } from 'vue'

export function useVoiceRecord() {
  const isRecording = ref(false)
  const interimText = ref('')
  const recognizedText = ref('')
  let resultCallback: ((text: string) => void) | null = null
  let recordManager: any = null

  // 初始化 WechatSI 插件
  function initPlugin() {
    try {
      const plugin = (wx as any).requirePlugin('WechatSI')
      recordManager = plugin.getRecordRecognitionManager()

      recordManager.onRecognize = (res: any) => {
        interimText.value = res.result || ''
      }

      recordManager.onStop = (res: any) => {
        isRecording.value = false
        recognizedText.value = res.result || ''
        if (resultCallback && res.result) {
          resultCallback(res.result)
        }
      }

      recordManager.onError = (res: any) => {
        isRecording.value = false
        uni.showToast({
          title: '语音识别失败: ' + (res.msg || '未知错误'),
          icon: 'none'
        })
      }

      return true
    } catch (e) {
      console.error('WechatSI plugin init failed:', e)
      return false
    }
  }

  // 开始录音
  function startRecord() {
    if (!recordManager) {
      if (!initPlugin()) {
        uni.showToast({ title: '语音识别不可用', icon: 'none' })
        return
      }
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

  return {
    isRecording,
    interimText,
    recognizedText,
    startRecord,
    stopRecord,
    cancelRecord,
    onResult
  }
}
