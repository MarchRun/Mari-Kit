<template>
  <div
    class="background-pattern"
    :class="`background-pattern--${tone}`"
    aria-hidden="true"
  ></div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  tone?: 'light' | 'dark'
}>(), {
  tone: 'light'
})
</script>

<style scoped>
@keyframes pattern-blink {
  0%, 100% {
    opacity: 0.1;
  }

  50% {
    opacity: 0.3;
  }
}

.background-pattern {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image: radial-gradient(var(--pattern-color) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: pattern-blink 4s ease-in-out infinite;
}

.background-pattern--light {
  --pattern-color: white;
}

.background-pattern--dark {
  --pattern-color: black;
}

@media (prefers-reduced-motion: reduce) {
  .background-pattern {
    animation: none;
    opacity: 0.2;
  }
}
</style>