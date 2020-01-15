<script>
export default {
  data() {
    return {
      username: "",
      password: ""
    };
  },
  methods: {
    signIn() {
      this.$emit('signin', { 
        username: this.username,
        password: this.password,
        captcha: this.captcha,
      });
    }
  },
  computed: {
    canSignIn() {
      return [
        this.captcha,
        this.username,
        this.password,
      ].every(v => v.length > 0);
    },
  },
  props: {
    captcha: {
      type: String,
      required: true,
    },
  },
};
</script>

<template lang="pug">
.container
  .tag Kobo Username
  input.input(type="text", placeholder="username", v-model="username")
  .tag Kobo Password
  input.input(type="password", placeholder="password", v-model="password")

  #grecaptcha-container.tag
  button.tag(@click="signIn", :disabled="!canSignIn") Sign Into Kobo.com
</template>

<style scoped>
.container {
  width: 300px;
  margin: 0 auto;
}

.tag {
  font-size: 14px;
  margin: 8px 0;
}

.input {
  width: 100%;
  line-height: 20px;
}
</style>
