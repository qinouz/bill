<template>
  <view class="page">
    <!-- 收支切换 -->
    <view class="type-tabs">
      <view
        class="tab"
        :class="{ active: currentType === 'expense' }"
        @tap="currentType = 'expense'"
      >
        <text>支出分类</text>
      </view>
      <view
        class="tab"
        :class="{ active: currentType === 'income' }"
        @tap="currentType = 'income'"
      >
        <text>收入分类</text>
      </view>
    </view>

    <!-- 分类列表 -->
    <view class="category-list">
      <view v-for="cat in filteredCategories" :key="cat._id" class="category-item">
        <text class="cat-icon">{{ cat.icon }}</text>
        <text class="cat-name">{{ cat.name }}</text>
        <text v-if="cat.isDefault" class="cat-tag">默认</text>
      </view>
      <view v-if="filteredCategories.length === 0" class="empty">
        <text>暂无分类</text>
      </view>
    </view>

    <!-- 新增分类 -->
    <view class="add-area">
      <view class="add-form">
        <input
          v-model="newName"
          class="add-input"
          placeholder="分类名称"
          placeholder-class="input-placeholder"
        />
        <input
          v-model="newIcon"
          class="add-input icon-input"
          placeholder="图标(emoji)"
          placeholder-class="input-placeholder"
          :maxlength="2"
        />
        <button class="btn-add" @tap="handleAdd">添加</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useBillStore } from '@/store/bill'
import { saveCategory } from '@/api/category'
import { useUserStore } from '@/store/user'

const billStore = useBillStore()
const userStore = useUserStore()

const currentType = ref<'income' | 'expense'>('expense')
const newName = ref('')
const newIcon = ref('')

const filteredCategories = computed(() => {
  return billStore.categories.filter((c) => c.type === currentType.value)
})

async function handleAdd() {
  if (!newName.value.trim()) {
    uni.showToast({ title: '请输入分类名称', icon: 'none' })
    return
  }
  if (!newIcon.value.trim()) {
    uni.showToast({ title: '请输入图标', icon: 'none' })
    return
  }
  if (!userStore.userInfo) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  try {
    await saveCategory({
      userId: userStore.userInfo.userId,
      name: newName.value.trim(),
      icon: newIcon.value.trim(),
      type: currentType.value,
      sort: filteredCategories.value.length + 1,
    })
    uni.showToast({ title: '添加成功', icon: 'success' })
    newName.value = ''
    newIcon.value = ''
    billStore.loadCategories()
  } catch {}
}

onShow(() => {
  billStore.loadCategories()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.type-tabs {
  display: flex;
  background-color: #fff;
  margin-bottom: 20rpx;
}

.tab {
  flex: 1;
  padding: 28rpx;
  text-align: center;
  font-size: 28rpx;
  color: #666;
  border-bottom: 4rpx solid transparent;
}

.tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
  font-weight: 500;
}

.category-list {
  padding: 0 30rpx;
}

.category-item {
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 28rpx;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}

.cat-icon {
  font-size: 44rpx;
  margin-right: 20rpx;
}

.cat-name {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.cat-tag {
  font-size: 20rpx;
  color: #999;
  background-color: #f5f5f5;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.empty {
  text-align: center;
  padding: 60rpx 0;
  color: #999;
  font-size: 28rpx;
}

.add-area {
  padding: 30rpx;
  margin-top: 20rpx;
}

.add-form {
  background-color: #fff;
  padding: 24rpx;
  border-radius: 12rpx;
}

.add-input {
  font-size: 28rpx;
  padding: 20rpx;
  border: 2rpx solid #eee;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
}

.icon-input {
  width: 200rpx;
}

.input-placeholder {
  color: #ccc;
}

.btn-add {
  background-color: #667eea;
  color: #fff;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
}
</style>
