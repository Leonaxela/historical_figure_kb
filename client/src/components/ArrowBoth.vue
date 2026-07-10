<template>
  <svg width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="6" y1="6" x2="18" y2="6" :stroke="color" stroke-width="1.5"/>
    <path d="M8 2L4 6L8 10" :stroke="color" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 2L20 6L16 10" :stroke="color" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</template>

<script setup>
defineProps({
  color: { type: String, default: '#c0c4cc' },
})
</script>
