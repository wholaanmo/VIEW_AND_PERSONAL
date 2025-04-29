<template>
  <router-view></router-view>
</template>

<script setup>
import { provide } from 'vue'

// Provide a value for 'key' (e.g., a config object, API client, etc.)
provide('key', {
  someValue: "Hello, this is provided!"
})
</script>

<style>
.vue-notification {
  padding: 15px;
  margin: 10px;
  font-size: 14px;
  color: white;
  background: #44A4FC;
  border-left: 5px solid #187FE7;
  
  &.warn {
    background: #ffb648;
    border-left-color: #f48a06;
  }
  
  &.error {
    background: #E54D42;
    border-left-color: #B82E24;
  }
  
  &.success {
    background: #68CD86;
    border-left-color: #42A85F;
  }
}
</style>
