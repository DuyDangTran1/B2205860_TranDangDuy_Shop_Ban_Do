<script>
export default {
  props: {
    value: {
      type: Number,
      required: true,
    },
  },
  computed: {
    clipWidth() {
      const val = parseFloat(this.value) || 0;
      return (val / 5) * 90; // Trả về con số px chính xác
    },
  },
};
</script>

<template>
  <div class="star-wrapper">
    <div class="stars empty">
      <i v-for="i in 5" :key="'e' + i" class="fa-regular fa-star"></i>
    </div>

    <div class="stars-clip" :style="{ width: clipWidth + 'px' }">
      <div class="stars filled">
        <i v-for="i in 5" :key="'f' + i" class="fa-solid fa-star"></i>
      </div>
    </div>

    <span class="ms-2 rating-text">{{ value.toFixed(1) }}</span>
  </div>
</template>

<style scoped>
.star-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  font-size: 0.9rem;
  width: 90px;
}

.stars {
  display: flex;
}

.stars.empty {
  color: #ccc;
}

.stars-clip {
  position: absolute;
  top: 3px;
  left: 0;
  overflow: hidden;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.stars.filled {
  color: #ffc107;
  display: flex;
  width: 90px; /* Bắt buộc phải 90px để 5 sao vàng đứng im */
}

.stars i {
  width: 18px; /* Chiều rộng mỗi ngôi sao */
  text-align: center;
  flex-shrink: 0;
}

.rating-text {
  font-weight: bold;
  color: #533422;
  font-size: 0.85rem;
}
</style>
