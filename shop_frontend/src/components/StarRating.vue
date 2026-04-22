<script>
export default {
  props: {
    value: {
      type: Number,
      required: true,
    },
  },
  computed: {
    // Tính toán chiều rộng của lớp sao vàng dựa trên số điểm
    clipWidth() {
      const val = parseFloat(this.value) || 0;
      // Mỗi ngôi sao rộng 16px, 5 sao là 80px.
      return (val / 5) * 80;
    },
  },
};
</script>

<template>
  <div class="star-rating-container">
    <div class="star-wrapper">
      <div class="stars empty">
        <i v-for="i in 5" :key="'e' + i" class="fa-solid fa-star"></i>
      </div>

      <div class="stars-clip" :style="{ width: clipWidth + 'px' }">
        <div class="stars filled">
          <i v-for="i in 5" :key="'f' + i" class="fa-solid fa-star"></i>
        </div>
      </div>
    </div>

    <span class="rating-number">{{ value.toFixed(1) }}</span>
  </div>
</template>

<style scoped>
.star-rating-container {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.star-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 80px;
  height: 16px;
}

.stars {
  display: flex;
  white-space: nowrap;
}

.stars i {
  font-size: 14px;
  width: 16px;
  text-align: center;
}

.stars.empty {
  color: #dbdbdb;
}

.stars.filled {
  color: #ffc107;
  width: 80px;
}

.stars-clip {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  height: 100%;
  pointer-events: none;
}

.rating-number {
  margin-left: 8px;
  font-weight: bold;
  color: #ffc107;
  font-size: 0.9rem;
}
</style>
