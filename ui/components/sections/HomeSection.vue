<template>
  <section id="home" class="min-h-screen flex items-center justify-center p-4 bg-neutral-900 relative overflow-hidden">
    <BackgroundPattern tone="light" />
    <div class="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10 pt-20">
      <div class="text-center md:text-left">
        <h1 class="text-7xl font-bold mb-6">MariKit</h1>
        <p class="text-neutral-400 text-lg mb-8 max-w-md mx-auto md:mx-0">
          Your professional, privacy-focused toolkit for daily tasks. Fast, secure, and ready for offline use.
        </p>
        <div class="flex gap-4 justify-center md:justify-start">
          <NuxtLink to="/#tools" class="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-neutral-200 transition">
            Access Tools
          </NuxtLink>
          <button
            type="button"
            class="rounded-xl border border-white px-8 py-3 font-bold text-white transition hover:bg-neutral-800"
          >
            Download
          </button>
        </div>
      </div>
      <div class="hidden md:flex justify-end">
        <div class="hidden items-center justify-center md:flex">
          <SegmentedSpinner />
        </div>
      </div>
    </div>
  </section>
</template>