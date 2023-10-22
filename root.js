export default {
  data() {
    return {
      message: "Hello Vue!",
      count: 0,
    }
  },
  methods: {
    increment() {
      this.count++;
    },
  },
  template: /*html*/`
    <button @click="increment">counter is {{ count }}</button><br>
    {{ message }}
  `
}
