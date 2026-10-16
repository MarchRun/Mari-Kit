<template>
  <div class="segmented-spinner" aria-hidden="true">
    <div class="segmented-spinner__ring segmented-spinner__ring--outer"></div>
    <div class="segmented-spinner__ring segmented-spinner__ring--middle"></div>
    <div class="segmented-spinner__ring segmented-spinner__ring--inner"></div>
    <div class="segmented-spinner__core"></div>
  </div>
</template>

<style scoped>
@keyframes spinner-clockwise {
  to {
    transform: rotate(360deg);
  }
}

@keyframes spinner-counterclockwise {
  to {
    transform: rotate(-360deg);
  }
}

@keyframes spinner-pulse {
  0%, 100% {
    opacity: 0.35;
    transform: scale(0.85);
  }

  50% {
    opacity: 0.85;
    transform: scale(1);
  }
}

.segmented-spinner {
  position: relative;
  width: 22rem;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
}

.segmented-spinner__ring {
  position: absolute;
  aspect-ratio: 1;
  border-radius: 50%;
  background: conic-gradient(
    transparent 0deg 35deg,
    rgb(255 255 255 / 85%) 35deg 115deg,
    transparent 115deg 175deg,
    rgb(255 255 255 / 55%) 175deg 255deg,
    transparent 255deg 315deg,
    rgb(255 255 255 / 30%) 315deg 350deg,
    transparent 350deg 360deg
  );
  mask: radial-gradient(
    circle,
    transparent 58%,
    black 59% 100%
  );
}

.segmented-spinner__ring--outer {
  width: 21rem;
  animation: spinner-clockwise 16s linear infinite;
}

.segmented-spinner__ring--middle {
  width: 15rem;
  animation: spinner-counterclockwise 11s linear infinite;
}

.segmented-spinner__ring--inner {
  width: 9rem;
  animation: spinner-clockwise 7s linear infinite;
}

.segmented-spinner__core {
  width: 2rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: white;
  box-shadow: 0 0 2.5rem rgb(255 255 255 / 55%);
  animation: spinner-pulse 3s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .segmented-spinner__ring,
  .segmented-spinner__core {
    animation: none;
  }
}
</style>