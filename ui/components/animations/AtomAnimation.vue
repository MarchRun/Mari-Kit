<template>
  <div class="atom-animation" aria-hidden="true">
    <div class="atom-animation__orbit atom-animation__orbit--first">
      <span class="atom-animation__particle"></span>
    </div>

    <div class="atom-animation__orbit atom-animation__orbit--second">
      <span class="atom-animation__particle"></span>
    </div>

    <div class="atom-animation__orbit atom-animation__orbit--third">
      <span class="atom-animation__particle"></span>
    </div>

    <div class="atom-animation__core"></div>
  </div>
</template>

<style scoped>
@keyframes atom-rotate {
  from {
    transform: rotate(var(--orbit-angle));
  }

  to {
    transform: rotate(calc(var(--orbit-angle) + 360deg));
  }
}

@keyframes atom-pulse {
  0%, 100% {
    opacity: 0.65;
    transform: scale(0.9);
  }

  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.atom-animation {
  position: relative;
  width: 19rem;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
}

.atom-animation__orbit {
  position: absolute;
  width: 18rem;
  height: 7rem;
  border: 1px solid rgb(255 255 255 / 45%);
  border-radius: 50%;
  animation: atom-rotate 12s linear infinite;
}

.atom-animation__orbit--first {
  --orbit-angle: 0deg;
}

.atom-animation__orbit--second {
  --orbit-angle: 60deg;
  animation-direction: reverse;
}

.atom-animation__orbit--third {
  --orbit-angle: 120deg;
}

.atom-animation__particle {
  position: absolute;
  top: 50%;
  right: -0.4rem;
  width: 0.8rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: white;
  box-shadow: 0 0 1.25rem rgb(255 255 255 / 80%);
  transform: translateY(-50%);
}

.atom-animation__core {
  width: 3.5rem;
  aspect-ratio: 1;
  border: 1px solid rgb(255 255 255 / 70%);
  border-radius: 50%;
  background: rgb(255 255 255 / 15%);
  box-shadow: 0 0 2.5rem rgb(255 255 255 / 30%);
  animation: atom-pulse 3s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .atom-animation__orbit,
  .atom-animation__core {
    animation: none;
  }
}
</style>