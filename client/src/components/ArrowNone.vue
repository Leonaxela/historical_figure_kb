<template>
  <svg width="20" height="12" viewBox="0 0 20 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="2" y1="6" x2="18" y2="6" :stroke="color" stroke-width="1.5"/>
  </svg>
</template>

<script setup>
defineProps({
  color: { type: String, default: '#c0c4cc' },
})
</script>
