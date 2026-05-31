import { ref } from 'vue'

export function useVoiceRecord() {
  const isRecording = ref(false)
  let resultCallback: ((tempFilePath: string) => void) | null = null
  let errorCallback: ((errMsg: string) => void) | null = null
  let recorderManager: UniApp.RecorderManager | null = null
  let isInitialized = false

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

    recorder.onStop((res) => {
      isRecording.value = false
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
      console.error('录音错误:', res)
      const errMsg = res.errMsg || '未知错误'
      uni.showToast({ title: '录音失败: ' + errMsg, icon: 'none' })
      if (errorCallback) errorCallback(errMsg)
    })
  }

  function startRecord() {
    initRecorder()
    isRecording.value = true

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
    isRecording.value = false
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
