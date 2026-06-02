<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useUserStore } from './store/user'

onLaunch(() => {
  // 自动登录
  const userStore = useUserStore()
  userStore.autoLogin()
})
</script>

<style>
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica,
    'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

view,
text {
  box-sizing: border-box;
}
</style>
