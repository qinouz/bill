<template>
  <view class="tabbar">
    <view
      v-for="item in tabs"
      :key="item.pagePath"
      class="tabbar-item"
      :class="{ active: currentPath === item.pagePath }"
      @tap="switchTab(item.pagePath)"
    >
      <text class="tabbar-icon">{{ item.icon }}</text>
      <text class="tabbar-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const tabs = [
  { pagePath: '/pages/index/index', text: '明细', icon: '📋' },
  { pagePath: '/pages/bills/bills', text: '记账', icon: '✏️' },
  { pagePath: '/pages/statistic/statistic', text: '统计', icon: '📊' },
  { pagePath: '/pages/mine/mine', text: '我的', icon: '👤' },
]

const currentPath = ref('/pages/index/index')

function updatePath() {
  const pages = getCurrentPages()
  if (pages.length > 0) {
    currentPath.value = '/' + pages[pages.length - 1].route
  }
}

onShow(() => {
  updatePath()
})

function switchTab(path: string) {
  if (currentPath.value === path) return
  uni.switchTab({ url: path })
}
</script>

<style scoped>
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background-color: #ffffff;
  border-top: 1rpx solid #e5e5e5;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 999;
}

.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12rpx 0 8rpx;
}

.tabbar-icon {
  font-size: 40rpx;
  margin-bottom: 4rpx;
}

.tabbar-text {
  font-size: 22rpx;
  color: #999999;
}

.tabbar-item.active .tabbar-text {
  color: #1296db;
}
</style>
