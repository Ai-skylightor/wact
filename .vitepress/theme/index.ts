import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import './custom.css'

// 📌 客户端脚本：修复 delimiters: [[ ]] 导致的 VitePress 主题组件文本
// VitePress 内置组件（搜索框、导航栏、侧边栏等）使用 {{ }} 模板语法，
// 当我们把插值分隔符改成 [[ ]] 后，这些组件的文本渲染会变成原始 {{ }} 模板代码。
// 这个脚本在页面加载后自动修复这些文本。
import './fix-delimiters.js'

export default {
  extends: DefaultTheme,
  Layout,
}
