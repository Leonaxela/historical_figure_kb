<template>
  <div class="ebook-section">
    <div class="section-divider"></div>
    <div class="section-header">
      <h2 class="section-title">🕮 电子书架</h2>
      <span class="book-count" v-if="books.length">共 {{ books.length }} 本</span>
    </div>
    <div class="bookshelf">
      <div class="book-item" v-for="book in books" :key="book.filename" @click="openBook(book)">
        <div class="book-cover">
          <img v-if="book.coverFileName" :src="`/ebook-cover/${book.coverFileName}`" :alt="book.title" loading="lazy" />
          <div v-else class="cover-placeholder">
            <span class="placeholder-icon">📖</span>
            <span class="placeholder-title">{{ book.title.slice(0, 12) }}</span>
          </div>
          <div class="book-spine"></div>
        </div>
        <div class="book-info">
          <p class="book-title" :title="book.title">{{ book.title }}</p>
          <p class="book-author" v-if="book.author">{{ book.author }}</p>
        </div>
      </div>
      <div class="empty-hint" v-if="!books.length">📭 书架上还没有书</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ebookApi } from '../api/index.js'

const props = defineProps({ ebooks: { type: Array, default: () => [] } })
const books = ref([])
const router = useRouter()

function openBook(book) {
  router.push('/admin/reader/' + encodeURIComponent(book.filename))
}

watch(() => props.ebooks, (val) => {
  books.value = val || []
}, { immediate: true, deep: true })
</script>

<style scoped>
.ebook-section { margin-top: 40px; }
.section-divider { height: 1px; background: #e4e7ed; margin-bottom: 24px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.section-title { font-size: 20px; font-weight: 600; color: #303133; letter-spacing: 2px; }
.book-count { font-size: 13px; color: #909399; }

.bookshelf {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 28px 18px;
  padding: 28px 20px;
  background: linear-gradient(180deg, #f7f0e6 0%, #efe4d4 100%);
  border-radius: 16px;
  border: 1px solid rgba(180,150,100,0.2);
  position: relative;
  min-height: 200px;
}
.bookshelf::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 8px;
  background: linear-gradient(180deg, transparent 0%, rgba(160,120,60,0.08) 40%, rgba(160,120,60,0.12) 100%);
  border-radius: 0 0 16px 16px;
  pointer-events: none;
}

.book-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
}
.book-item:hover { transform: translateY(-6px); }

.book-cover {
  width: 120px;
  height: 170px;
  border-radius: 4px 8px 8px 4px;
  overflow: hidden;
  box-shadow:
    0 4px 12px rgba(0,0,0,0.12),
    0 1px 3px rgba(0,0,0,0.06),
    inset 0 0 0 1px rgba(255,255,255,0.1);
  position: relative;
  background: #fff;
  flex-shrink: 0;
}
.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.book-spine {
  position: absolute;
  top: 0; left: 0;
  width: 6px; height: 100%;
  background: linear-gradient(90deg, rgba(0,0,0,0.10), rgba(0,0,0,0.02));
  border-radius: 4px 0 0 4px;
  pointer-events: none;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #f0e8dd, #e8ddd0);
  gap: 8px;
}
.placeholder-icon { font-size: 36px; }
.placeholder-title {
  font-size: 12px;
  color: #8a7a6a;
  text-align: center;
  padding: 0 8px;
  line-height: 1.4;
  word-break: break-all;
}

.book-info {
  margin-top: 10px;
  text-align: center;
  width: 120px;
}
.book-title {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.book-author {
  font-size: 11px;
  color: #909399;
  margin: 2px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-hint {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 0;
  font-size: 15px;
  color: #b0a090;
  letter-spacing: 2px;
}
</style>
