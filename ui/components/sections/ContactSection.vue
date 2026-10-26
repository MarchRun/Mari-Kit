<template>
    <section
      id="contact"
      aria-label="Contact"
      class="relative min-h-[100svh] overflow-visible bg-neutral-900 px-4 md:h-screen md:min-h-0 md:overflow-hidden"
    >
    <BackgroundPattern tone="light" />

    <div class="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 pb-24 pt-28 md:grid-cols-2 md:gap-16 md:pb-0 md:pt-36">
      <form class="space-y-8" @submit.prevent="handleSubmit">
        <h2 class="text-4xl font-bold">
          Send a Message
        </h2>

        <div>
          <label for="contact-name" class="mb-2 block text-sm text-neutral-400">
            Full Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autocomplete="name"
            required
            class="w-full border-b border-white bg-transparent py-2 transition focus:border-primary-500 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
        </div>

        <div>
          <label for="contact-email" class="mb-2 block text-sm text-neutral-400">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autocomplete="email"
            required
            class="w-full border-b border-white bg-transparent py-2 transition focus:border-primary-500 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
        </div>

        <div>
          <label for="contact-message" class="mb-2 block text-sm text-neutral-400">
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows="3"
            maxlength="2000"
            required
            class="w-full border-b border-white bg-transparent py-2 transition focus:border-primary-500 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          ></textarea>
        </div>

        <button
          type="submit"
          class="rounded-xl bg-white px-8 py-3 font-bold text-black transition hover:bg-neutral-200"
        >
          Contact Us
        </button>

        <p
          v-if="submissionStatus === 'unavailable'"
          role="status"
          aria-live="polite"
          class="text-sm leading-relaxed text-neutral-400"
        >
          Message delivery is not available yet. Please use GitHub to report bugs or suggest improvements.
        </p>
      </form>

      <div class="flex flex-col">
        <h2 class="text-4xl font-bold mb-8">Connect</h2>

        <a
          href="https://github.com/MarchRun/MariKit"
          target="_blank"
          rel="noopener noreferrer"
          class="mb-8 flex items-center gap-4 py-3 text-lg transition hover:text-primary-400"
        >
          <Github aria-hidden="true" class="h-6 w-6" />
          GitHub
        </a>

        <div>
          <hr class="border-white mb-6">
          <div class="flex justify-between items-center text-neutral-500 text-sm">
            <footer>
              <p>© 2026 MariKit. Open Source Project.</p>
              <div class="flex gap-4 mt-2">
                <a
                  href="https://github.com/MarchRun/MariKit/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:text-white"
                >
                  License
                </a>
                <NuxtLink to="/privacy" class="hover:text-white">Privacy Policy</NuxtLink>
              </div>
            </footer>

            <a
              href="#home"
              aria-label="Back to top"
              class="rounded-xl bg-white p-3 text-black transition hover:bg-neutral-200"
            >
              <ArrowUp aria-hidden="true" class="h-5 w-5" />
            </a>
          </div>
        </div>

        <div class="mt-6 hidden justify-center md:flex">
          <AtomAnimation />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowUp, Github } from 'lucide-vue-next'

type SubmissionStatus = 'idle' | 'unavailable'

const submissionStatus = ref<SubmissionStatus>('idle')

const handleSubmit = () => {
  submissionStatus.value = 'unavailable'
}
</script>
