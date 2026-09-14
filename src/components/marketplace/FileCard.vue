<script setup lang="ts">
/**
 * The delivered artefact — the mockup's `.file-card`. Square brass tile with the
 * file's type, the filename, and one meta line of size · upload age · AV verdict.
 *
 * The AV verdict gates the download: `clean` gets the marine link, `pending`
 * gets an inert, explicitly disabled one, and `infected` gets no link at all —
 * a red warning takes its place. The URL is never rendered for an infected file.
 */
import { computed } from 'vue'
import { formatBytes, timeAgo } from '@/lib/utils'
import type { Attachment } from '@/types/entities'

const props = defineProps<{
  attachment: Attachment
  downloadUrl: string
}>()

const MIME_KINDS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'text/csv': 'CSV',
  'text/plain': 'TXT',
  'application/zip': 'ZIP',
}

/** Prefer the declared MIME type; fall back to the filename's own extension. */
const kind = computed(() => {
  const byMime = MIME_KINDS[props.attachment.mimeType.toLowerCase()]
  if (byMime) return byMime
  const match = /\.([a-z0-9]{1,4})$/i.exec(props.attachment.originalFilename)
  return match ? match[1]!.toUpperCase() : 'FILE'
})

const SCAN_TEXT: Record<Attachment['avScanStatus'], string> = {
  clean: 'scanned, clean',
  pending: 'scan in progress',
  infected: 'malware detected',
}

const meta = computed(() => {
  const a = props.attachment
  return `${formatBytes(a.sizeBytes)} · uploaded ${timeAgo(a.uploadedAt)} · ${SCAN_TEXT[a.avScanStatus]}`
})

const scan = computed(() => props.attachment.avScanStatus)
</script>

<template>
  <div class="sb-file">
    <span class="sb-file__icon" aria-hidden="true">{{ kind }}</span>

    <div class="sb-file__body">
      <div class="sb-file__name">{{ attachment.originalFilename }}</div>
      <div class="sb-file__meta">{{ meta }}</div>
    </div>

    <a v-if="scan === 'clean'" class="sb-file__download" :href="downloadUrl" download>Download</a>

    <span v-else-if="scan === 'pending'" class="sb-file__download is-disabled" aria-disabled="true">
      Download
    </span>

    <span v-else class="sb-file__warning">
      Blocked — this file failed the malware scan and cannot be downloaded.
    </span>
  </div>
</template>

<style scoped>
.sb-file {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  background: var(--paper);
  border: 1px solid var(--line);
}

.sb-file__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 13px;
  font-weight: 600;
  color: var(--brass);
  background: var(--brass-bg);
}

.sb-file__body {
  min-width: 0;
}

.sb-file__name {
  font-size: 15px;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.sb-file__meta {
  margin-top: 2px;
  font-size: 13px;
  color: var(--slate);
}

.sb-file__download {
  margin-left: auto;
  font-size: 14px;
  font-weight: 500;
  color: var(--marine);
  text-decoration: none;
  white-space: nowrap;
  transition: color var(--dur-fast) var(--ease-out-quart);
}

a.sb-file__download:hover {
  color: var(--marine-dark);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.sb-file__download.is-disabled {
  color: var(--slate);
  cursor: not-allowed;
}

.sb-file__warning {
  margin-left: auto;
  font-size: 13px;
  font-weight: 500;
  color: var(--red);
  text-align: right;
  max-width: 220px;
}

@media (max-width: 560px) {
  .sb-file {
    flex-wrap: wrap;
    padding: 18px 20px;
  }

  .sb-file__download,
  .sb-file__warning {
    flex-basis: 100%;
    margin-left: 0;
    max-width: none;
    text-align: left;
  }
}
</style>
