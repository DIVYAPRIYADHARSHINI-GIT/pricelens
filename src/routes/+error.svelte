<script lang="ts">
	import { page } from '$app/state';
	import StateCard from '$lib/components/StateCard.svelte';
	import Icon from '$lib/components/Icon.svelte';
	const notFound = $derived(page.status === 404);
</script>

<div class="page">
	<h1 class="sr-only" data-testid="page-title">{notFound ? 'Page not found' : 'Something went wrong'}</h1>
	<StateCard
		icon={notFound ? 'search' : 'help'}
		tone="pink"
		title={notFound ? "Oops - this page wandered off" : 'Something went wrong'}
		message={notFound ? "We couldn't find that page. Let's get you back to bargain hunting." : (page.error?.message ?? 'Please try again.')}
		testid="error-page"
	>
		<a class="btn yellow" href="/"><Icon name="camera" size={18} /> Back to Scan</a>
	</StateCard>
</div>

<svelte:head><title>{notFound ? 'Not found' : 'Error'} - PriceLens</title></svelte:head>
