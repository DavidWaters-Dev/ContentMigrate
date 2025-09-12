<template>
  <UContainer class="py-6 space-y-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold">Dashboard</h1>
        <p class="text-sm text-gray-500">Review audits and start new ones</p>
      </div>
      <UModal
        title="Create New Audit"
        description="Enter a site root and optional name to begin."
      >
        <UButton color="primary" icon="i-heroicons-plus" label="New Audit" />
        <template #body>
          <div class="space-y-4">
            <UFormField label="Target URL" help="The site root to audit">
              <UInput
                v-model="createForm.target"
                placeholder="https://example.com"
                icon="i-lucide-globe"
              />
            </UFormField>
            <UFormField label="Name" help="Optional, suggested from URL">
              <UInput v-model="createForm.name" :placeholder="suggestedName" />
              <div class="mt-1">
                <UButton
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  icon="i-lucide-sparkles"
                  @click="createForm.name = suggestedName"
                  >Use suggested</UButton
                >
              </div>
            </UFormField>
          </div>
        </template>
        <template #footer="{ close }">
          <div class="flex flex-row w-full justify-end gap-2 pt-2">
            <UButton
              label="Cancel"
              color="neutral"
              variant="outline"
              @click="close"
            />
            <UButton
              color="primary"
              :loading="creating"
              :disabled="!isValidUrl(createForm.target)"
              @click="createAudit"
              >Create</UButton
            >
          </div>
        </template>
      </UModal>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-clipboard-document-list" />
            <span class="font-medium">Your Audits</span>
          </div>
          <div class="flex items-center gap-2">
            <UInput
              v-model="query"
              icon="i-heroicons-magnifying-glass"
              placeholder="Search audits..."
              size="sm"
            />
            <USelect
              v-model="status"
              :items="statusOptions"
              size="sm"
              class="w-20"
            />
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">Show archived</span>
              <USwitch v-model="showArchived" size="sm" />
            </div>
          </div>
        </div>
      </template>

      <div
        v-if="!loading && filteredAudits.length === 0"
        class="py-12 text-center"
      >
        <div
          class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100"
        >
          <UIcon name="i-heroicons-rectangle-group" class="text-gray-400" />
        </div>
        <p class="text-gray-600">No audits yet</p>
        <p class="text-sm text-gray-500">
          Get started by creating your first audit.
        </p>
        <div class="mt-4">
          <UModal
            title="Create New Audit"
            description="Enter a site root and optional name to begin."
          >
            <UButton
              color="primary"
              icon="i-heroicons-plus"
              label="New Audit"
            />
            <template #body>
              <div class="space-y-4">
                <UFormField label="Target URL" help="The site root to audit">
                  <UInput
                    v-model="createForm.target"
                    placeholder="https://example.com"
                    icon="i-lucide-globe"
                  />
                </UFormField>
                <UFormField label="Name" help="Optional, suggested from URL">
                  <UInput
                    v-model="createForm.name"
                    :placeholder="suggestedName"
                  />
                  <div class="mt-1">
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      icon="i-lucide-sparkles"
                      @click="createForm.name = suggestedName"
                      >Use suggested</UButton
                    >
                  </div>
                </UFormField>
              </div>
            </template>
            <template #footer="{ close }">
              <UButton
                label="Cancel"
                color="neutral"
                variant="outline"
                @click="close"
              />
              <UButton
                color="primary"
                :loading="creating"
                :disabled="!isValidUrl(createForm.target)"
                @click="createAudit"
                >Create</UButton
              >
            </template>
          </UModal>
        </div>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="audit in filteredAudits"
          :key="audit.id"
          class="flex items-center justify-between gap-4 py-4"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <UIcon
                :name="statusIcon(audit.status)"
                :class="statusClass(audit.status)"
              />
              <button
                class="truncate text-left font-medium hover:underline"
                @click="goToAudit(audit)"
              >
                {{ audit.name }}
              </button>
            </div>
            <p class="truncate text-sm text-gray-500">
              {{ audit.target }} • Updated {{ relativeTime(audit.updatedAt) }}
            </p>
          </div>
          <div class="hidden items-center gap-2 sm:flex">
            <UBadge
              :label="audit.status"
              :color="statusColor(audit.status)"
              variant="subtle"
            />
            <UBadge
              :label="`${audit.pages ?? 0} pages`"
              color="neutral"
              variant="soft"
            />
            <UBadge
              :label="`Score ${audit.score ?? 0}`"
              :color="scoreColor(audit.score || 0)"
              variant="soft"
            />
          </div>
          <div class="flex items-center gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-heroicons-arrow-top-right-on-square"
              @click="goToAudit(audit)"
              >Open</UButton
            >
            <UDropdownMenu :items="rowMenu(audit)">
              <UButton
                variant="ghost"
                color="neutral"
                icon="i-heroicons-ellipsis-vertical"
                aria-label="More"
              />
            </UDropdownMenu>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Modal instances embedded above per Nuxt UI pattern -->
    <UModal
      v-model:open="deleteOpen"
      title="Delete Audit"
      description="This action cannot be undone."
    >
      <template #body>
        <p class="text-sm text-gray-600">
          Are you sure you want to delete
          <span class="font-medium">{{ auditToDelete?.name }}</span
          >? This will permanently remove the audit and its pages.
        </p>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="outline"
            @click="deleteOpen = false"
          />
          <UButton
            label="Delete"
            color="error"
            :loading="deleting"
            @click="performDelete"
          />
        </div>
      </template>
    </UModal>
  </UContainer>
</template>

<script setup lang="ts">
  type AuditStatus =
    | "draft"
    | "crawling"
    | "crawled"
    | "analyzing"
    | "ready"
    | "archived";
  interface AuditItem {
    id: string;
    slug: string;
    name: string;
    target: string;
    status: AuditStatus;
    score?: number;
    pages?: number;
    updatedAt: string;
  }

  const router = useRouter();
  const audits = ref<AuditItem[]>([]);
  const loading = ref(false);

  async function loadAudits() {
    loading.value = true;
    try {
      const res = await $fetch<{ audits: any[] }>("/api/audits");
      audits.value = (res.audits || []).map((a) => ({
        id: a.id,
        slug: a.slug,
        name: a.name,
        target: a.target_url,
        status: a.status,
        score: a.summary?.healthScore ?? 0,
        pages: a.summary?.totals?.pages ?? 0,
        updatedAt: a.updated_at,
      }));
    } finally {
      loading.value = false;
    }
  }
  onMounted(() => {
    loadAudits();
  });

  const query = ref("");
  const status = ref<"all" | AuditStatus>("all");
  const showArchived = ref(false);
  const statusOptions = [
    { label: "All", value: "all" },
    { label: "Draft", value: "draft" },
    { label: "Crawling", value: "crawling" },
    { label: "Analyzing", value: "analyzing" },
    { label: "Ready", value: "ready" },
    { label: "Archived", value: "archived" },
  ];

  const filteredAudits = computed(() => {
    const q = query.value.toLowerCase();
    const s = status.value;
    return audits.value.filter((a) => {
      const matchQ =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.target.toLowerCase().includes(q);
      let matchS = true;
      if (s !== "all") matchS = a.status === s;
      else if (!showArchived.value) matchS = a.status !== "archived";
      return matchQ && matchS;
    });
  });

  function goToAudit(audit: AuditItem) {
    router.push(
      `/dashboard/audits/${encodeURIComponent(audit.slug || audit.id)}`
    );
  }

  function rowMenu(audit: AuditItem) {
    const base = [
      {
        label: "Open",
        icon: "i-heroicons-arrow-top-right-on-square",
        onSelect: () => goToAudit(audit),
      },
      {
        label: "Copy Link",
        icon: "i-heroicons-link",
        onSelect: () =>
          navigator?.clipboard?.writeText(
            `${location.origin}/dashboard/audits/${encodeURIComponent(audit.slug || audit.id)}`
          ),
      },
    ];
    const manage = [
      audit.status === "archived"
        ? {
            label: "Unarchive",
            icon: "i-heroicons-archive-box",
            onSelect: () => unarchiveAudit(audit),
          }
        : {
            label: "Archive",
            icon: "i-heroicons-archive-box",
            onSelect: () => archiveAudit(audit),
          },
      {
        label: "Delete…",
        icon: "i-heroicons-trash",
        onSelect: () => promptDelete(audit),
      },
    ];
    return [base, manage];
  }

  function statusIcon(s: AuditStatus) {
    switch (s) {
      case "crawling":
      case "analyzing":
        return "i-heroicons-arrow-path";
      case "ready":
        return "i-heroicons-check-circle";
      case "archived":
        return "i-heroicons-archive-box";
      default:
        return "i-heroicons-clock";
    }
  }
  function statusClass(s: AuditStatus) {
    return {
      "text-amber-500": s === "crawling" || s === "analyzing" || s === "draft",
      "text-emerald-600": s === "ready",
      "text-gray-500": s === "archived",
    };
  }
  function statusColor(s: AuditStatus) {
    switch (s) {
      case "crawling":
      case "analyzing":
      case "draft":
        return "warning";
      case "ready":
        return "success";
      case "archived":
        return "neutral";
    }
  }
  function scoreColor(score: number) {
    if (score >= 90) return "success";
    if (score >= 70) return "warning";
    return "error";
  }
  function relativeTime(iso: string) {
    const then = new Date(iso).getTime();
    const diff = Math.max(0, Date.now() - then);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  const creating = ref(false);
  const createOpen = ref(false);
  const createForm = reactive({ target: "", name: "" });
  const suggestedName = computed(() => {
    try {
      return new URL(createForm.target).hostname;
    } catch {
      return "New Audit";
    }
  });
  function isValidUrl(s: string) {
    try {
      const u = new URL(s);
      return !!(u.protocol && u.host);
    } catch {
      return false;
    }
  }
  async function createAudit() {
    if (!isValidUrl(createForm.target)) return;
    creating.value = true;
    try {
      const res = await $fetch<any>("/api/audits", {
        method: "POST",
        body: {
          target: createForm.target,
          name: createForm.name || suggestedName.value,
        },
      });
      createOpen.value = false;
      createForm.target = "";
      createForm.name = "";
      await loadAudits();
      router.push(`/dashboard/audits/${encodeURIComponent(res.slug)}`);
    } catch (e) {
      console.error(e);
    } finally {
      creating.value = false;
    }
  }

  // Archive / unarchive
  const updating = ref(false);
  async function archiveAudit(audit: AuditItem) {
    if (updating.value) return;
    updating.value = true;
    try {
      await $fetch(`/api/audits/${audit.id}`, {
        method: "PATCH",
        body: { status: "archived" },
      });
      await loadAudits();
    } catch (e) {
      console.error(e);
    } finally {
      updating.value = false;
    }
  }
  async function unarchiveAudit(audit: AuditItem) {
    if (updating.value) return;
    updating.value = true;
    try {
      await $fetch(`/api/audits/${audit.id}`, {
        method: "PATCH",
        body: { status: "ready" },
      });
      await loadAudits();
    } catch (e) {
      console.error(e);
    } finally {
      updating.value = false;
    }
  }

  // Delete flow
  const deleteOpen = ref(false);
  const deleting = ref(false);
  const auditToDelete = ref<AuditItem | null>(null);
  function promptDelete(audit: AuditItem) {
    auditToDelete.value = audit;
    deleteOpen.value = true;
  }
  async function performDelete() {
    if (!auditToDelete.value) return;
    deleting.value = true;
    try {
      await $fetch(`/api/audits/${auditToDelete.value.id}`, {
        method: "DELETE",
      });
      deleteOpen.value = false;
      auditToDelete.value = null;
      await loadAudits();
    } catch (e) {
      console.error(e);
    } finally {
      deleting.value = false;
    }
  }
</script>
