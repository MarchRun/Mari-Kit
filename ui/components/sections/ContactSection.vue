<template>
  <section id="contact" class="h-screen box-border overflow-hidden px-4 bg-neutral-900 relative">
    <BackgroundPattern tone="light" />

    <div class="max-w-6xl w-full mx-auto pt-36 grid grid-cols-1 md:grid-cols-2 gap-16 z-10 relative">
      <form class="space-y-8">
        <h2 class="text-4xl font-bold">Send a Message</h2>
        
        <div>
          <label class="block text-sm mb-2 text-neutral-400">Full Name</label>
          <input type="text" class="w-full bg-transparent border-b border-white py-2 focus:outline-none focus:border-primary-500 transition">
        </div>

        <div>
          <label class="block text-sm mb-2 text-neutral-400">E-mail</label>
          <input type="email" class="w-full bg-transparent border-b border-white py-2 focus:outline-none focus:border-primary-500 transition">
        </div>

        <div>
          <label class="block text-sm mb-2 text-neutral-400">Message</label>
          <textarea rows="3" class="w-full bg-transparent border-b border-white py-2 focus:outline-none focus:border-primary-500 transition"></textarea>
        </div>

        <button type="submit" class="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-neutral-200 transition">
          Contact Us
        </button>
      </form>

      <div class="flex flex-col">
        <h2 class="text-4xl font-bold mb-8">Connect</h2>

        <a href="#" class="flex items-center gap-4 text-lg hover:text-primary-400 transition mb-8">
          <Github class="w-6 h-6" />
          GitHub
        </a>

        <div>
          <hr class="border-white mb-6">
          <div class="flex justify-between items-center text-neutral-500 text-sm">
            <footer>
              <p>© 2026 MariKit. Open Source Project.</p>
              <div class="flex gap-4 mt-2">
                <a href="#" class="hover:text-white">License</a>
                <a href="#" class="hover:text-white">Privacy Policy</a>
              </div>
            </footer>

            <a href="#home" class="p-3 bg-white text-black rounded-xl hover:bg-neutral-200 transition">
              <ArrowUp class="w-5 h-5" />
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
import { Github, ArrowUp } from 'lucide-vue-next';
</script>
