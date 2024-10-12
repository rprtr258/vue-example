<script lang="ts">
	export let counters: number[];
  $: show = counters.length === 6 && counters.every((x) => x === 6);
</script>

{#if show}
  <img src="https://cdn.7tv.app/emote/62d00fd46b04542d826c8f7b/4x" alt="xdd666">
{:else}
  <p class="read-the-docs">SOSI ZHOPU LOX</p>
{/if}
