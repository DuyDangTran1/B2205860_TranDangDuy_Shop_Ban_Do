<template>
  <div class="container-fluid">
    <div class="text-center">
      <router-link class="router-link" :to="{ name: 'Home' }">
        <i class="fas fa-home"></i>
        <p class="fs-4 mt-2">Bạn đi lạc rồi. Quay lại trang chủ thôi!</p>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.router-link {
  text-decoration: none;
}

i {
  margin-top: 120px;
  font-size: 12rem;
}
</style>
