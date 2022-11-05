<template>
  <div />
</template>

<script>
export default {
  // async asyncData ({ $axios, route, store }) {
  // await $axios({
  //   method: 'DELETE',
  //   url: `${getBaseUrl(store.state)}/v2/${route.params.name}/manifests/${route.params.digest}`,
  //   withCredentials: true,
  // });

  // return {
  //   name: route.params.name,
  //   digest: route.params.digest,
  //   url: store.state.url,
  // };
  // },
  mounted () {
    window.location = `/${this.name}/tags?delete=success`
  },
}
</script>
