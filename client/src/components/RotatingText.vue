<script setup>
import { AnimatePresence, Motion } from 'motion-v'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  texts: { type: Array, default: () => [] },
  transition: { type: Object, default: () => ({ type: 'spring', damping: 25, stiffness: 300 }) },
  initial: { type: Object, default: () => ({ y: '100%', opacity: 0 }) },
  animate: { type: Object, default: () => ({ y: 0, opacity: 1 }) },
  exit: { type: Object, default: () => ({ y: '-120%', opacity: 0 }) },
  animatePresenceMode: { type: String, default: 'wait' },
  animatePresenceInitial: { type: Boolean, default: false },
  rotationInterval: { type: Number, default: 2000 },
  staggerDuration: { type: Number, default: 0 },
  staggerFrom: { type: [String, Number], default: 'first' },
  loop: { type: Boolean, default: true },
  auto: { type: Boolean, default: true },
  splitBy: { type: String, default: 'characters' },
  onNext: { type: Function, default: undefined },
  mainClassName: { type: String, default: '' },
  splitLevelClassName: { type: String, default: '' },
  elementLevelClassName: { type: String, default: '' },
})

const cn = (...classes) => classes.filter(Boolean).join(' ')

const currentTextIndex = ref(0)
let intervalId = null

const splitIntoCharacters = (text) => {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })
    return [...segmenter.segment(text)].map(({ segment }) => segment)
  }
  return [...text]
}

const elements = computed(() => {
  const currentText = props.texts[currentTextIndex.value]
  switch (props.splitBy) {
    case 'characters': {
      const words = currentText.split(' ')
      return words.map((word, i) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== words.length - 1,
      }))
    }
    case 'words': {
      const words = currentText.split(' ')
      return words.map((word, i) => ({
        characters: [word],
        needsSpace: i !== words.length - 1,
      }))
    }
    case 'lines': {
      const lines = currentText.split('\n')
      return lines.map((line, i) => ({
        characters: [line],
        needsSpace: i !== lines.length - 1,
      }))
    }
    default: {
      const parts = currentText.split(props.splitBy)
      return parts.map((part, i) => ({
        characters: [part],
        needsSpace: i !== (parts.length - 1),
      }))
    }
  }
})

const getStaggerDelay = (index, totalChars) => {
  const { staggerDuration, staggerFrom } = props
  switch (staggerFrom) {
    case 'first': return index * staggerDuration
    case 'last': return (totalChars - 1 - index) * staggerDuration
    case 'center': {
      const center = Math.floor(totalChars / 2)
      return Math.abs(center - index) * staggerDuration
    }
    case 'random': {
      const randomIndex = Math.floor(Math.random() * totalChars)
      return Math.abs(randomIndex - index) * staggerDuration
    }
    default: return Math.abs(staggerFrom - index) * staggerDuration
  }
}

const handleIndexChange = (newIndex) => {
  currentTextIndex.value = newIndex
  props.onNext?.(newIndex)
}

const next = () => {
  const isAtEnd = currentTextIndex.value === props.texts.length - 1
  const nextIndex = isAtEnd ? (props.loop ? 0 : currentTextIndex.value) : currentTextIndex.value + 1
  if (nextIndex !== currentTextIndex.value) handleIndexChange(nextIndex)
}

const previous = () => {
  const isAtStart = currentTextIndex.value === 0
  const prevIndex = isAtStart ? (props.loop ? props.texts.length - 1 : currentTextIndex.value) : currentTextIndex.value - 1
  if (prevIndex !== currentTextIndex.value) handleIndexChange(prevIndex)
}

const jumpTo = (index) => {
  const validIndex = Math.max(0, Math.min(index, props.texts.length - 1))
  if (validIndex !== currentTextIndex.value) handleIndexChange(validIndex)
}

const reset = () => { if (currentTextIndex.value !== 0) handleIndexChange(0) }
const cleanupInterval = () => { if (intervalId) { clearInterval(intervalId); intervalId = null } }
const startInterval = () => { if (props.auto) intervalId = setInterval(next, props.rotationInterval) }

defineExpose({ next, previous, jumpTo, reset })

watch(() => props, () => { cleanupInterval(); startInterval() }, { deep: true })
onMounted(startInterval)
onUnmounted(cleanupInterval)
</script>

<template>
  <Motion
    tag="span"
    :class="cn('flex flex-wrap whitespace-pre-wrap relative', mainClassName)"
    v-bind="$attrs"
    :transition="transition"
    layout
  >
    <span class="sr-only">{{ texts[currentTextIndex] }}</span>
    <AnimatePresence :mode="animatePresenceMode" :initial="animatePresenceInitial">
      <Motion
        :key="currentTextIndex"
        tag="span"
        :class="cn(splitBy === 'lines' ? 'flex flex-col w-full' : 'flex flex-wrap whitespace-pre-wrap relative')"
        aria-hidden="true"
        layout
      >
        <span
          v-for="(wordObj, wordIndex) in elements"
          :key="wordIndex"
          :class="cn('inline-flex', splitLevelClassName)"
        >
          <Motion
            v-for="(char, charIndex) in wordObj.characters"
            :key="charIndex"
            tag="span"
            :initial="initial"
            :animate="animate"
            :exit="exit"
            :transition="{
              ...transition,
              delay: getStaggerDelay(
                elements.slice(0, wordIndex).reduce((sum, word) => sum + word.characters.length, 0) + charIndex,
                elements.reduce((sum, word) => sum + word.characters.length, 0)
              )
            }"
            :class="cn('inline-block', elementLevelClassName)"
          >
            {{ char }}
          </Motion>
          <span v-if="wordObj.needsSpace" class="whitespace-pre">&nbsp;</span>
        </span>
      </Motion>
    </AnimatePresence>
  </Motion>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
