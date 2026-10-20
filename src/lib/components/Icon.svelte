<script lang="ts" module>
	// Custom stroke icons (24x24 grid). Decorative by default (aria-hidden).
	export const ICONS = {
		camera: 'M3 8.5A2.5 2.5 0 0 1 5.5 6H8l1.6-2.2h4.8L16 6h2.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z M12 16.6a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6z',
		upload: 'M12 15V4 M7.5 8.5 12 4l4.5 4.5 M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15',
		search: 'M10.5 17.5a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M15.5 15.5 21 21',
		tag: 'M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1l8 8a1.5 1.5 0 0 1 0 2.1l-6 6a1.5 1.5 0 0 1-2.1 0z M8.2 9.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6z',
		heart: 'M12 20.5s-8-4.9-8-11A4.5 4.5 0 0 1 12 6.6a4.5 4.5 0 0 1 8 2.9c0 6.1-8 11-8 11z',
		bell: 'M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2H4.5z M10 20.5a2 2 0 0 0 4 0',
		settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7.5 7.5 0 0 1-2 1.2L14.8 21h-4l-.3-2.1a7.5 7.5 0 0 1-2-1.2l-1.9.7-2-3.4 1.6-1.2a7.6 7.6 0 0 1 0-2.4L4.6 10.2l2-3.4 1.9.7a7.5 7.5 0 0 1 2-1.2L10.8 3h4l.3 2.3a7.5 7.5 0 0 1 2 1.2l1.9-.7 2 3.4-1.6 1.2a7.6 7.6 0 0 1 0 2.4z',
		list: 'M8 6h12 M8 12h12 M8 18h12 M4 6h.01 M4 12h.01 M4 18h.01',
		check: 'M4.5 12.5 9.5 17.5 19.5 6.5',
		close: 'M6 6l12 12 M18 6 6 18',
		edit: 'M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4',
		share: 'M17.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M6.5 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M17.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M8.7 13.2l6.6 3.6 M15.3 7.2 8.7 10.8',
		copy: 'M9 9h10.5v11.5H9z M15 9V4.5H4.5V15H9',
		link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
		whatsapp: 'M4 20l1.2-4A8 8 0 1 1 8.4 19z M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .8a4.6 4.6 0 0 1-2.2-2.2l.8-1-1-2z',
		external: 'M14 4h6v6 M20 4l-9 9 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
		star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z',
		truck: 'M2.5 6.5h11v9h-11z M13.5 9.5h4l3 3.2v2.8h-7 M6.5 18.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z M17 18.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z',
		trash: 'M4.5 6.5h15 M9.5 6.5V4h5v2.5 M6.5 6.5l1 13.5h9l1-13.5 M10 10.5v6 M14 10.5v6',
		refresh: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3 M19.5 4v4h-4',
		filter: 'M3.5 5h17l-6.5 8v6l-4 1.5V13z',
		sort: 'M7 4v16 M3.5 7.5 7 4l3.5 3.5 M17 20V4 M13.5 16.5 17 20l3.5-3.5',
		moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
		sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
		wallet: 'M3.5 7.5A2 2 0 0 1 5.5 5.5h12v3 M3.5 7.5v10a2 2 0 0 0 2 2h14v-11h-14a2 2 0 0 1-2-2z M16 14h.01',
		store: 'M4 9.5 5.5 4h13L20 9.5 M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0 M5 11v9h14v-9 M10 20v-5h4v5',
		history: 'M3.5 12a8.5 8.5 0 1 0 2.5-6 M3.5 4v4h4 M12 7.5V12l3 2',
		download: 'M12 4v11 M7.5 10.5 12 15l4.5-4.5 M4 17.5v1A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-1',
		wifiOff: 'M3 3l18 18 M8.5 16.5a5 5 0 0 1 7 0 M5 12.8a10 10 0 0 1 4-2.3 M19 12.8a10 10 0 0 0-3.3-2.1 M2 9a15 15 0 0 1 4.5-2.8 M22 9a15 15 0 0 0-9.5-3.9 M12 20h.01',
		blur: 'M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z M9 14.5a3 3 0 0 0 3 3',
		file: 'M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20z M14 3.5V8h4 M9.5 13l5 5 M14.5 13l-5 5',
		lock: 'M6 10.5h12v10H6z M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3',
		sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
		chevronLeft: 'M15 5l-7 7 7 7',
		chevronRight: 'M9 5l7 7-7 7',
		image: 'M4 5h16v14H4z M4 16l4.5-4.5 4 4 2.5-2.5L20 18 M15.5 9.5h.01',
		chart: 'M4 4v16h16 M7.5 15l3.5-4 3 2.5 5-6.5',
		eyeOff: 'M3 3l18 18 M10.6 6.1A9.5 9.5 0 0 1 21 12a14 14 0 0 1-2.4 3.2 M6.4 6.5A14 14 0 0 0 3 12s3.5 6.5 9 6.5a8.5 8.5 0 0 0 4.4-1.2 M9.9 9.9a3 3 0 0 0 4.2 4.2',
		help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.3-2.5 3.8 M12 17h.01',
		home: 'M3.5 11 12 4l8.5 7 M5.5 9.5V20h13V9.5'
	} as const;
	export type IconName = keyof typeof ICONS;
</script>

<script lang="ts">
	let { name, size = 22, stroke = 2.5, label = '', class: cls = '' }: { name: IconName; size?: number; stroke?: number; label?: string; class?: string } = $props();
</script>

<svg
	class="icon {cls}"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	role={label ? 'img' : undefined}
	aria-label={label || undefined}
	aria-hidden={label ? undefined : 'true'}
	focusable="false"><path d={ICONS[name]} /></svg
>

<style>
	.icon {
		flex: none;
		display: inline-block;
		vertical-align: middle;
	}
</style>
