import { ref } from 'vue'

export function useVoiceRecord() {
  const isRecording = ref(false)
  const isStarting = ref(false)
  let resultCallback: ((tempFilePath: string) => void) | null = null
  let errorCallback: ((errMsg: string) => void) | null = null
  let recorderManager: UniApp.RecorderManager | null = null
  let isInitialized = false
  let isCancelled = false
  let shouldStopAfterStart = false

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
      isStarting.value = false

      if (isCancelled) {
        recorder.stop()
        return
      }

      isRecording.value = true

      if (shouldStopAfterStart) {
        shouldStopAfterStart = false
        recorder.stop()
      }
    })

    recorder.onStop((res) => {
      isRecording.value = false
      isStarting.value = false
      shouldStopAfterStart = false

      if (isCancelled) {
        isCancelled = false
        return
      }

      if (res.tempFilePath) {
        resultCallback?.(res.tempFilePath)
        return
      }

      const errMsg = '录音失败'
      uni.showToast({ title: errMsg, icon: 'none' })
      errorCallback?.(errMsg)
    })

    recorder.onError((res) => {
      isRecording.value = false
      isStarting.value = false
      isCancelled = false
      shouldStopAfterStart = false

      const errMsg = res.errMsg || '未知错误'
      console.error('录音错误:', res)
      uni.showToast({ title: '录音失败: ' + errMsg, icon: 'none' })
      errorCallback?.(errMsg)
    })
  }

  function startRecord() {
    if (isRecording.value || isStarting.value) return

    initRecorder()
    isStarting.value = true
    isCancelled = false
    shouldStopAfterStart = false

    getRecorder().start({
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3',
    })
  }

  function stopRecord() {
    if (isStarting.value) {
      shouldStopAfterStart = true
      return
    }

    if (isRecording.value) {
      getRecorder().stop()
    }
  }

  function cancelRecord() {
    isCancelled = true
    shouldStopAfterStart = false
    isRecording.value = false

    if (isStarting.value) return

    try {
      getRecorder().stop()
    } catch {
      isCancelled = false
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
    isStarting,
    startRecord,
    stopRecord,
    cancelRecord,
    onResult,
    onError,
  }
}
