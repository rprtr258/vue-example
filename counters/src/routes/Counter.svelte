<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let value = 0;

	const dispatch = createEventDispatcher();
</script>

<span style="display: inline-grid;">
  <button on:click={() => value++}>count is: {value}</button>
  <button on:click={() => dispatch("delete")}>delete</button>
</span>
