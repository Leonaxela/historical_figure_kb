<template>
  <svg width="20" height="12" viewBox="0 0 20 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="2" y1="6" x2="14" y2="6" :stroke="color" stroke-width="1.5"/>
    <path d="M12 2L17 6L12 10" :stroke="color" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</template>

<script setup>
defineProps({
  color: { type: String, default: '#c0c4cc' },
})
</script>
