<template>
  <header class="fixed left-0 right-0 top-6 z-50 flex w-full justify-center px-4">
    <nav
      aria-label="Primary navigation"
      class="flex w-full max-w-6xl items-center justify-between rounded-full border border-white bg-black px-8 py-4 text-white shadow-lg"
    >
      <NuxtLink to="/#home" class="text-xl font-bold tracking-tight" @click="closeMenu">
        MariKit
      </NuxtLink>

      <div class="hidden items-center gap-8 text-sm font-medium md:flex">
        <NuxtLink
          v-for="item in navigationItems"
          :key="item.id"
          :to="item.href"
          class="border-b pb-1 transition"
          :class="getLinkClass(item.id)"
          :aria-current="activeSection === item.id ? 'location' : undefined"
        >
          {{ item.label }}
        </NuxtLink>
      </div>

      <button
        type="button"
        class="ml-auto flex h-11 w-11 items-center justify-center rounded-lg md:hidden"
        aria-controls="mobile-navigation"
        :aria-expanded="isOpen"
        :aria-label="isOpen ? 'Close navigation menu' : 'Open navigation menu'"
        @click="toggleMenu"
      >
        <svg
          v-if="!isOpen"
          class="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>

        <svg
          v-else
          class="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </nav>

    <nav
      v-if="isOpen"
      id="mobile-navigation"
      aria-label="Mobile navigation"
      class="absolute left-4 right-4 top-20 rounded-2xl border border-white bg-black p-6 text-white shadow-xl md:hidden"
    >
      <div class="flex flex-col gap-4 text-center font-medium">
        <NuxtLink
          v-for="item in navigationItems"
          :key="item.id"
          :to="item.href"
          class="rounded-lg px-4 py-2 transition"
          :class="getMobileLinkClass(item.id)"
          :aria-current="activeSection === item.id ? 'location' : undefined"
          @click="closeMenu"
        >
          {{ item.label }}
        </NuxtLink>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
type SectionId = 'home' | 'tools' | 'contact'

const navigationItems: Array<{
  id: SectionId
  label: string
  href: string
}> = [
  { id: 'home', label: 'Home', href: '/#home' },
  { id: 'tools', label: 'Tools', href: '/#tools' },
  { id: 'contact', label: 'Contact', href: '/#contact' }
]

const isOpen = ref(false)
const activeSection = ref<SectionId | null>(null)

let sectionObserver: IntersectionObserver | undefined

const route = useRoute()

const observeSections = async () => {
  sectionObserver?.disconnect()
  activeSection.value = null

  if (route.path !== '/') {
    return
  }

  await nextTick()

  sectionObserver = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id as SectionId
        }
      }
    },
    {
      rootMargin: '-35% 0px -55%',
      threshold: 0
    }
  )

  for (const item of navigationItems) {
    const section = document.getElementById(item.id)

    if (section) {
      sectionObserver.observe(section)
    }
  }
}

const closeMenu = () => {
  isOpen.value = false
}

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const getLinkClass = (sectionId: SectionId) => {
  return activeSection.value === sectionId
    ? 'border-white text-white'
    : 'border-transparent text-neutral-400 hover:text-white'
}

const getMobileLinkClass = (sectionId: SectionId) => {
  return activeSection.value === sectionId
    ? 'bg-white text-black'
    : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

const handleResize = () => {
  if (window.matchMedia('(min-width: 768px)').matches) {
    closeMenu()
  }
}

watch(
  () => route.fullPath,
  () => {
    closeMenu()
  }
)

watch(
  () => route.path,
  () => {
    observeSections()
  }
)

onMounted(() => {
  observeSections()
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  sectionObserver?.disconnect()
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleResize)
})
</script>