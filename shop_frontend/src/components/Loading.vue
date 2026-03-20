<template>
  <div v-if="isLoading" class="loading-overlay">
    <div class="spinner-border text-brown" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>
</template>

<script>
export default {
  props: ["isLoading"],
};
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.text-brown {
  color: #533422;
}

.spinner-border {
  width: 3.5rem;
  height: 3.5rem;
  border-width: 0.25em;
}
</style>
