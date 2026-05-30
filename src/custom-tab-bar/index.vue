<template>
  <view class="tabbar">
    <view
      v-for="(item, index) in tabs"
      :key="index"
      class="tabbar-item"
      :class="{ active: current === index }"
      @tap="switchTab(index)"
    >
      <view class="tabbar-icon">{{ item.icon }}</view>
      <view class="tabbar-text">{{ item.text }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const tabs = [
  { icon: '📋', text: '明细', path: '/pages/index/index' },
  { icon: '➕', text: '记账', path: '/pages/bills/bills' },
  { icon: '📊', text: '统计', path: '/pages/statistic/statistic' },
  { icon: '👤', text: '我的', path: '/pages/mine/mine' },
]

const current = ref(0)

const switchTab = (index: number) => {
  if (current.value === index) return
  current.value = index
  uni.switchTab({ url: tabs[index].path })
}

const setSelected = (index: number) => {
  current.value = index
}

defineExpose({ setSelected })
</script>

<style scoped>
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 110rpx;
  background-color: #fff;
  border-top: 1rpx solid #eee;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 999;
  padding-bottom: env(safe-area-inset-bottom);
}

.tabbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  color: #999;
}

.tabbar-item.active {
  color: #1296db;
}

.tabbar-icon {
  font-size: 40rpx;
  margin-bottom: 4rpx;
}

.tabbar-text {
  font-size: 22rpx;
}
</style>
