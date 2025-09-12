<template>
  <div class="flex items-center gap-2">
    <span class="font-semibold">{{ label }}:</span>
    <UBadge :color="color">{{ score }}</UBadge>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps<{ label: string; score: number }>();
  const color = computed(() => {
    if (props.score > 80) return "success";
    if (props.score > 60) return "warning";
    return "error";
  });
</script>
