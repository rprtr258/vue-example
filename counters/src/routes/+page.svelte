<script lang="ts">
  import Counter from "./Counter.svelte";
  import Secret from "./Secret.svelte";

  let counters: number[] = [];

  function createCounterClick() {
    counters = [...counters, 0];
  }
</script>

<h1>VITE + ABOBUS</h1>
<button on:click={createCounterClick}>counters: {counters.length}</button>
<div class="card">
  {#each counters as counter, i}
    <Counter
      on:delete={() => {counters = [...counters.slice(0, i), ...counters.slice(i+1)]}}
      bind:value={counter}
    />
  {/each}
</div>
<Secret bind:counters={counters}/>