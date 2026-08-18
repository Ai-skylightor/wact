<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  lang: { type: String, default: 'zh' }
})
const isEn = computed(() => props.lang === 'en')

// i18n
const i18n = computed(() => {
  if (isEn.value) return {
    composerHint: 'Share your thoughts...',
    types: [
      { v: 'suggestion', l: '💡 Suggestion' },
      { v: 'bug', l: '🐛 Bug' },
      { v: 'question', l: '❓ Question' },
      { v: 'praise', l: '👍 Praise' },
    ],
    placeholder: 'Describe your suggestion or the issue you encountered...',
    submitting: 'Submitting...',
    submit: 'Submit',
    loginPrompt: 'Please log in to the platform to submit feedback.',
    loginLink: '→ Go to Login',
    feedbackCount: (n) => `${n} feedback`,
    filters: [
      { v: '', l: 'All' },
      { v: 'open', l: 'Open' },
      { v: 'resolved', l: 'Replied' },
      { v: 'closed', l: 'Closed' },
    ],
    loading: 'Loading...',
    empty: 'No feedback yet. Be the first!',
    replyPh: 'Write a reply...',
    replyBtn: 'Reply',
    typeLabels: { suggestion: 'Suggestion', bug: 'Bug', question: 'Question', praise: 'Praise' },
    statusLabels: { open: 'Open', resolved: 'Replied', closed: 'Closed' },
  }
  return {
    composerHint: '分享你的想法...',
    types: [
      { v: 'suggestion', l: '💡 建议' },
      { v: 'bug', l: '🐛 问题' },
      { v: 'question', l: '❓ 提问' },
      { v: 'praise', l: '👍 表扬' },
    ],
    placeholder: '详细描述你的建议或遇到的问题...',
    submitting: '提交中...',
    submit: '提交反馈',
    loginPrompt: '请先登录平台后再提交反馈',
    loginLink: '→ 去登录',
    feedbackCount: (n) => `${n} 条反馈`,
    filters: [
      { v: '', l: '全部' },
      { v: 'open', l: '待处理' },
      { v: 'resolved', l: '已回复' },
      { v: 'closed', l: '已关闭' },
    ],
    loading: '加载中...',
    empty: '还没有反馈，来提第一条吧',
    replyPh: '写下你的回复...',
    replyBtn: '回复',
    typeLabels: { suggestion: '建议', bug: '问题', question: '提问', praise: '表扬' },
    statusLabels: { open: '待处理', resolved: '已回复', closed: '已关闭' },
  }
})

const loggedIn = ref(false)
const currentUserId = ref('')
const submitting = ref(false)
const formContent = ref('')
const formType = ref('suggestion')
const feedbacks = ref([])
const loading = ref(false)
const filterStatus = ref('')
const replyTexts = ref({})
const replySubmitting = ref({})

function getToken() {
  try { return localStorage.getItem('platform_access_token') || '' } catch (e) { return '' }
}
function checkLogin() {
  loggedIn.value = !!getToken()
  try {
    const raw = localStorage.getItem('platform_user')
    if (raw) { const u = JSON.parse(raw); currentUserId.value = u.id || '' }
  } catch (e) { currentUserId.value = '' }
}
async function apiCall(url, options) {
  const token = getToken()
  const headers = { Accept: 'application/json', ...(options?.headers || {}) }
  if (token) headers['Authorization'] = 'Bearer ' + token
  return fetch(url, { ...options, headers })
}
function formatTime(iso) {
  // 后端已输出格式化本地时间字符串（如 2026-07-23 14:49），直接展示
  return iso || ''
}

async function loadList() {
  loading.value = true
  try {
    let url = '/api/doc-feedback?page=1&page_size=50'
    if (filterStatus.value) url += '&status=' + filterStatus.value
    const resp = await apiCall(url)
    const data = await resp.json()
    if (data.success && data.data) {
      feedbacks.value = data.data.list || []
      for (const fb of feedbacks.value) {
        if (fb.status !== 'open') {
          try {
            const dr = await apiCall('/api/doc-feedback/' + fb.id)
            const dd = await dr.json()
            if (dd.success) fb.replies = dd.data.replies || []
          } catch (e) { fb.replies = [] }
        } else { fb.replies = [] }
      }
    }
  } catch (e) { /* silent */ } finally { loading.value = false }
}

async function submit() {
  if (!formContent.value.trim()) return
  submitting.value = true
  try {
    const resp = await apiCall('/api/doc-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pagePath: isEn.value ? '/feedback' : '/zh/feedback',
        pageTitle: isEn.value ? 'Feedback' : '系统使用反馈',
        content: formContent.value.trim(),
        feedbackType: formType.value,
      }),
    })
    const data = await resp.json()
    if (data.success) {
      formContent.value = ''
      formType.value = 'suggestion'
      await loadList()
    }
  } catch (e) { /* silent */ } finally { submitting.value = false }
}

async function submitReply(fbId) {
  const text = (replyTexts.value[fbId] || '').trim()
  if (!text) return
  replySubmitting.value[fbId] = true
  try {
    const resp = await apiCall('/api/doc-feedback/' + fbId + '/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    })
    const data = await resp.json()
    if (data.success) {
      replyTexts.value[fbId] = ''
      await loadList()
    }
  } catch (e) { /* silent */ } finally { replySubmitting.value[fbId] = false }
}

function typeLabel(t) { return i18n.value.typeLabels[t] || t }
function statusLabel(s) { return i18n.value.statusLabels[s] || s }

onMounted(() => { checkLogin(); loadList() })
</script>

<template>
  <div class="fb-container">
    <!-- Composer -->
    <div v-if="loggedIn" class="fb-composer">
      <div class="fb-composer-header">
        <span class="fb-composer-avatar">✏️</span>
        <span class="fb-composer-hint">{{ i18n.composerHint }}</span>
      </div>
      <div class="fb-composer-types">
        <button
          v-for="t in i18n.types"
          :key="t.v"
          :class="['fb-type-btn', { active: formType === t.v }]"
          @click="formType = t.v"
        >{{ t.l }}</button>
      </div>
      <textarea
        v-model="formContent"
        :placeholder="i18n.placeholder"
        rows="3"
        class="fb-composer-input"
      />
      <div class="fb-composer-footer">
        <button
          class="fb-btn-primary"
          :disabled="submitting || !formContent.trim()"
          @click="submit"
        >{{ submitting ? i18n.submitting : i18n.submit }}</button>
      </div>
    </div>

    <!-- Not logged in -->
    <div v-else class="fb-login-prompt">
      <div class="fb-login-icon">🔐</div>
      <p>{{ i18n.loginPrompt }}</p>
      <a href="/static/login.html" class="fb-login-link">{{ i18n.loginLink }}</a>
    </div>

    <!-- Toolbar -->
    <div class="fb-toolbar">
      <div class="fb-stats">
        <strong>{{ feedbacks.length }}</strong> {{ isEn ? 'feedback' : '条反馈' }}
      </div>
      <div class="fb-filters">
        <button
          v-for="f in i18n.filters"
          :key="f.v"
          :class="['fb-filter-btn', { active: filterStatus === f.v }]"
          @click="filterStatus = f.v; loadList()"
        >{{ f.l }}</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="fb-empty">{{ i18n.loading }}</div>

    <!-- Empty -->
    <div v-else-if="feedbacks.length === 0" class="fb-empty">
      <div class="fb-empty-icon">💭</div>
      <p>{{ i18n.empty }}</p>
    </div>

    <!-- List -->
    <div v-else class="fb-list">
      <div v-for="fb in feedbacks" :key="fb.id" class="fb-card">
        <div class="fb-card-top">
          <span :class="['fb-type-pill', 'fb-type-' + fb.feedbackType]">{{ typeLabel(fb.feedbackType) }}</span>
          <span :class="['fb-status-badge', 'fb-status-' + fb.status]">{{ statusLabel(fb.status) }}</span>
          <span class="fb-card-meta">{{ fb.userName }} · {{ formatTime(fb.createdAt) }}</span>
        </div>
        <div class="fb-card-body">{{ fb.content }}</div>

        <div v-if="fb.replies && fb.replies.length > 0" class="fb-reply-thread">
          <div v-for="reply in fb.replies" :key="reply.id" class="fb-reply">
            <div class="fb-reply-head">
              <span class="fb-reply-author">{{ reply.userName }}</span>
              <span class="fb-reply-time">{{ formatTime(reply.createdAt) }}</span>
            </div>
            <div class="fb-reply-body">{{ reply.content }}</div>
          </div>
        </div>

        <div v-if="loggedIn && currentUserId !== fb.userId" class="fb-reply-box">
          <input
            v-model="replyTexts[fb.id]"
            :placeholder="i18n.replyPh"
            class="fb-reply-input"
            @keyup.enter="submitReply(fb.id)"
          />
          <button
            class="fb-reply-btn"
            :disabled="replySubmitting[fb.id] || !(replyTexts[fb.id] || '').trim()"
            @click="submitReply(fb.id)"
          >{{ replySubmitting[fb.id] ? '...' : i18n.replyBtn }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fb-container { max-width: 720px; margin: 0 auto; }

/* Composer */
.fb-composer {
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  background: var(--vp-c-bg, #fff);
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.fb-composer-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.fb-composer-avatar { font-size: 20px; }
.fb-composer-hint { font-size: 14px; color: #a1a1aa; }
.fb-composer-types { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.fb-type-btn {
  padding: 5px 14px;
  border: 1px solid #e4e4e7;
  border-radius: 9999px;
  background: var(--vp-c-bg, #fff);
  color: #52525b;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  line-height: 1.4;
}
.fb-type-btn:hover { border-color: #d4d4d8; background: #f4f4f5; }
.fb-type-btn.active { background: #18181b; color: #fff; border-color: #18181b; font-weight: 500; }
.fb-composer-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  outline: none;
  background: var(--vp-c-bg, #fff);
  color: #18181b;
  font-family: inherit;
  line-height: 1.5;
}
.fb-composer-input:focus { border-color: #18181b; }
.fb-composer-footer { text-align: right; margin-top: 10px; }

/* Login prompt */
.fb-login-prompt {
  text-align: center;
  padding: 40px 20px;
  margin-bottom: 24px;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  background: var(--vp-c-bg, #fff);
}
.fb-login-icon { font-size: 32px; margin-bottom: 12px; }
.fb-login-prompt p { margin: 0 0 10px; color: #71717a; font-size: 14px; }
.fb-login-link { color: #2563eb; text-decoration: none; font-weight: 600; font-size: 14px; }

/* Toolbar */
.fb-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.fb-stats { font-size: 13px; color: #71717a; }
.fb-stats strong { color: #18181b; font-weight: 600; }
.fb-filters { display: flex; gap: 6px; }
.fb-filter-btn {
  padding: 4px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #71717a;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.fb-filter-btn:hover { background: #f4f4f5; }
.fb-filter-btn.active { background: #18181b; color: #fff; font-weight: 500; }

/* Empty */
.fb-empty { text-align: center; padding: 60px 20px; color: #a1a1aa; }
.fb-empty-icon { font-size: 36px; margin-bottom: 12px; }
.fb-empty p { margin: 0; font-size: 14px; }

/* Card list */
.fb-list { display: flex; flex-direction: column; gap: 12px; }
.fb-card {
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  background: var(--vp-c-bg, #fff);
  padding: 16px 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.fb-card:hover { border-color: #d4d4d8; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }

.fb-card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.fb-card-meta { font-size: 12px; color: #a1a1aa; margin-left: auto; }

.fb-type-pill {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 9999px;
  border: 1px solid currentColor;
  background: transparent;
  line-height: 1.5;
}
.fb-type-suggestion { color: #2563eb; }
.fb-type-bug { color: #dc2626; }
.fb-type-question { color: #7c3aed; }
.fb-type-praise { color: #16a34a; }

.fb-status-badge { font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 6px; }
.fb-status-open { background: #fef3c7; color: #92400e; }
.fb-status-resolved { background: #dbeafe; color: #1e40af; }
.fb-status-closed { background: #f4f4f5; color: #52525b; }

.fb-card-body { font-size: 14px; color: #18181b; line-height: 1.6; white-space: pre-wrap; }

.fb-reply-thread { margin-top: 14px; padding-left: 16px; border-left: 2px solid #f4f4f5; }
.fb-reply { padding: 10px 0; }
.fb-reply + .fb-reply { border-top: 1px solid #f4f4f5; }
.fb-reply-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.fb-reply-author { font-weight: 600; font-size: 13px; color: #18181b; }
.fb-reply-time { font-size: 11px; color: #a1a1aa; }
.fb-reply-body { font-size: 14px; line-height: 1.6; color: #3f3f46; white-space: pre-wrap; }

.fb-reply-box { display: flex; gap: 8px; margin-top: 12px; }
.fb-reply-input {
  flex: 1;
  padding: 7px 12px;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  background: var(--vp-c-bg, #fff);
  color: #18181b;
  font-family: inherit;
}
.fb-reply-input:focus { border-color: #18181b; }
.fb-reply-input::placeholder { color: #a1a1aa; }
.fb-reply-btn {
  padding: 7px 18px;
  border: none;
  border-radius: 8px;
  background: #18181b;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: opacity 0.15s;
  white-space: nowrap;
}
.fb-reply-btn:hover:not(:disabled) { opacity: 0.85; }
.fb-reply-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.fb-btn-primary {
  padding: 8px 28px;
  border: none;
  border-radius: 8px;
  background: #18181b;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.15s;
}
.fb-btn-primary:hover:not(:disabled) { opacity: 0.85; }
.fb-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
