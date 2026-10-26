<template>
  <div class="relative min-h-screen overflow-hidden bg-white px-4 pb-16 pt-32 text-black">
    <BackgroundPattern tone="dark" />
    <article class="relative z-10 mx-auto max-w-3xl">
      <NuxtLink to="/#contact" class="mb-10 inline-flex min-h-11 items-center rounded-lg px-3 text-neutral-600 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
        Back to MariKit
      </NuxtLink>
      <header class="mb-10">
        <p class="mb-3 text-sm uppercase tracking-widest text-neutral-600">Privacy · Draft</p>
        <h1 class="mb-4 text-4xl font-bold md:text-5xl">Privacy Policy</h1>
        <p class="leading-relaxed text-neutral-600">MariKit processes supported files and text in your browser. Visiting the website still involves network requests to our hosting provider.</p>
      </header>
      <aside aria-label="Draft policy notice" class="mb-10 rounded-xl border border-neutral-300 bg-white p-5 leading-relaxed">
        This draft reflects the current application and the operator-confirmed Vercel Hobby deployment with Web Analytics disabled. Hosting log retention and deployed infrastructure behavior still require review. No effective date has been assigned.
      </aside>
      <div class="space-y-8 rounded-2xl bg-neutral-900 p-6 leading-relaxed text-neutral-300 md:p-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-white">
        <section aria-labelledby="local-processing">
          <h2 id="local-processing">Files, text, and results</h2>
          <p>PDF merging, splitting, and organizing; QR generation and scanning; password generation; and text or file hashing run locally in your browser. The current tools do not upload your selected files, entered text, passwords, camera frames, or generated results to an application server. Password generation and hashing use your browser’s Web Crypto capabilities.</p>
          <p class="mt-3">Inputs and results are held in the page’s memory while you use a tool. MariKit does not provide server-side storage or recovery for them. Closing or leaving a page is not a guarantee of secure erasure from your device or browser.</p>
        </section>
        <section aria-labelledby="camera-clipboard">
          <h2 id="camera-clipboard">Camera, clipboard, and downloads</h2>
          <p>Live QR scanning requests camera access through your browser. Frames are decoded locally, and scanning is stopped when the scanner is stopped or its page is left. You can revoke access in your browser settings.</p>
          <p class="mt-3">Paste actions use clipboard content you provide, and copy actions write the selected result to your clipboard. Your operating system, clipboard history, sync services, browser extensions, or other applications may retain or access copied data. Downloads are saved through your browser and may remain in your download history, device storage, or backups. You control their removal.</p>
        </section>
        <section aria-labelledby="hosting">
          <h2 id="hosting">Hosting on Vercel</h2>
          <p>MariKit is hosted on Vercel’s Hobby plan. Loading pages and application assets sends ordinary web requests to Vercel. Hosting and security infrastructure may process metadata such as IP addresses, requested URLs, timestamps, browser information, and request identifiers. This is separate from the tool contents processed locally.</p>
          <p class="mt-3">Available logs, access, processing locations, and retention depend on the deployed project and Vercel services and plan. Hosting log retention has not been independently confirmed, so this draft does not state a retention period for hosting metadata. Consult Vercel’s linked policies and documentation for provider information. Do not put confidential tool input into page URLs or query parameters.</p>
          <p class="mt-3">See <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel’s Privacy Policy</a> and <a href="https://vercel.com/docs/logs/runtime" target="_blank" rel="noopener noreferrer">runtime logging documentation</a> for provider information.</p>
        </section>
        <section aria-labelledby="storage-tracking">
          <h2 id="storage-tracking">Cookies, storage, and tracking</h2>
          <p>The current application code does not set cookies, save tool data to local or session storage, or integrate analytics or error tracking. Vercel Web Analytics is disabled, as confirmed by the operator, and the project’s Integrations page shows no installed integrations. Fonts are served with the application rather than requested from Google Fonts. These facts do not mean hosting logs are disabled or rule out infrastructure cookies; deployed behavior still needs review before this policy is finalized.</p>
        </section>
        <section aria-labelledby="contact-links">
          <h2 id="contact-links">Contact and external links</h2>
          <p>MariKit is operated by Marchel Karuna Kwee. For privacy questions or requests, email <a href="mailto:marchelk372@gmail.com">marchelk372@gmail.com</a>.</p>
          <p class="mt-3">If you email us, your email provider and Gmail process the message. The operator receives your email address, message, and any attachments to respond to your request. Do not include passwords or confidential tool inputs. The operator deletes privacy correspondence from the mailbox within 90 days after the request is resolved, unless longer retention is necessary for a legal obligation or dispute. This mailbox policy does not control copies held by your email provider or Gmail’s backup and deletion processes.</p>
          <p class="mt-3">Contact form delivery is not available. Submitting the current form displays an unavailable message and does not send the entered details.</p>
          <p class="mt-3">Following a link to GitHub, Vercel, or another website sends you to a service governed by its own privacy practices. Do not post private files, passwords, or personal information in public GitHub issues.</p>
        </section>
        <section aria-labelledby="choices-updates">
          <h2 id="choices-updates">Your choices and policy updates</h2>
          <p>You can stop using a tool, leave the page, revoke camera permission, clear clipboard history, and delete downloaded files using your device controls. For requests about hosting metadata, applicable privacy rights, or this policy, use the email address above. This draft must be reviewed when hosting settings, external services, or data-handling features change.</p>
        </section>
      </div>
    </article>
  </div>
</template>
