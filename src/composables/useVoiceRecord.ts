import { ref } from 'vue'

export function useVoiceRecord() {
  const isRecording = ref(false)
  let resultCallback: ((tempFilePath: string) => void) | null = null
  let errorCallback: ((errMsg: string) => void) | null = null
  let recorderManager: UniApp.RecorderManager | null = null
  let isInitialized = false
  let isCancelled = false  // 标记是否是取消操作
  let isStarting = false   // 标记录音是否正在启动中

  function getRecorder() {
    if (!recorderManager) {
      recorderManager = uni.getRecorderManager()
    }
    return recorderManager
  }

  function initRecorder() {
    if (isInitialized) return
    isInitialized = true

    const recorder = getRecorder()

    recorder.onStart(() => {
      isStarting = false
      // 如果在启动过程中被取消，立即停止
      if (isCancelled) {
        recorder.stop()
        return
      }
      isRecording.value = true
    })

    recorder.onStop((res) => {
      isRecording.value = false
      isStarting = false
      // 如果是取消操作，不触发 resultCallback
      if (isCancelled) {
        isCancelled = false
        return
      }
      if (res.tempFilePath) {
        if (resultCallback) {
          resultCallback(res.tempFilePath)
        }
      } else {
        uni.showToast({ title: '录音失败', icon: 'none' })
        if (errorCallback) errorCallback('录音失败')
      }
    })

    recorder.onError((res) => {
      isRecording.value = false
      isStarting = false
      isCancelled = false
      console.error('录音错误:', res)
      const errMsg = res.errMsg || '未知错误'
      uni.showToast({ title: '录音失败: ' + errMsg, icon: 'none' })
      if (errorCallback) errorCallback(errMsg)
    })
  }

  function startRecord() {
    initRecorder()
    isStarting = true
    isCancelled = false

    const recorder = getRecorder()
    recorder.start({
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3',
    })
  }

  function stopRecord() {
    const recorder = getRecorder()
    if (isRecording.value) {
      recorder.stop()
    }
  }

  function cancelRecord() {
    isCancelled = true  // 标记为取消
    isRecording.value = false
    // 如果还在启动中，不调用 stop，等 onStart 回调处理
    if (isStarting) {
      return
    }
    const recorder = getRecorder()
    try {
      recorder.stop()
    } catch (e) {
      // ignore
    }
  }

  function onResult(cb: (tempFilePath: string) => void) {
    resultCallback = cb
  }

  function onError(cb: (errMsg: string) => void) {
    errorCallback = cb
  }

  return {
    isRecording,
    startRecord,
    stopRecord,
    cancelRecord,
    onResult,
    onError,
  }
}
