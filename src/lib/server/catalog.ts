// Built-in demo catalog (MockProvider data). 5 sample groups - floral summer dress,
// white sneakers, backpack, wireless earbuds, wrist watch - each with a main product
// (4-6 hand-written store listings) plus 4 similar styles and 3 cheaper alternatives
// (listings generated deterministically). Selling prices stay within ~Rs 299 - 2,999.
// Images are generated SVG tiles (src/lib/art.ts), never product photos.
import type { ArtSpec } from '../art.ts';
import { artUri } from '../art.ts';
import { deliveryText, hash, isoDate, retailRound, rng } from '../format.ts';
import { SAMPLE_ART } from '../samples.ts';
import { storeMeta } from '../stores.ts';
import type { Category, ColourOption, Listing, PricePoint, Product, Suggestion } from '../types.ts';
import type { ColourClass } from '../colour.ts';

export type GroupKey = 'dress' | 'sneakers' | 'backpack' | 'earbuds' | 'watch';

export interface Group {
	key: GroupKey;
	category: Category;
	label: string;
	/** Search words that map a text query to this group. */
	keywords: string[];
	/** Dominant-colour signature used by the demo image matcher (weight 0..1 per colour class). */
	colours: Partial<Record<ColourClass, number>>;
	stores: string[];
}

export const GROUPS: Group[] = [
	{
		key: 'dress',
		category: 'dress',
		label: 'Floral summer dress',
		keywords: ['dress', 'dresses', 'frock', 'gown', 'floral', 'summer', 'midi', 'maxi', 'sundress', 'skater', 'a-line', 'wrap'],
		colours: { pink: 1, red: 0.8, purple: 0.6, yellow: 0.55, orange: 0.45, green: 0.2 },
		stores: ['meesho', 'flipkart', 'amazon', 'myntra', 'ajio', 'nykaa']
	},
	{
		key: 'sneakers',
		category: 'shoes',
		label: 'White sneakers',
		keywords: ['sneaker', 'sneakers', 'shoe', 'shoes', 'trainer', 'trainers', 'footwear', 'canvas', 'running', 'walking', 'slip-on', 'court'],
		colours: { white: 1, grey: 0.6 },
		stores: ['meesho', 'flipkart', 'amazon', 'myntra', 'ajio', 'tatacliq']
	},
	{
		key: 'backpack',
		category: 'bag',
		label: 'Backpack',
		keywords: ['backpack', 'backpacks', 'bag', 'bags', 'rucksack', 'schoolbag', 'daypack', 'laptop bag', 'knapsack'],
		colours: { blue: 1, teal: 0.5, purple: 0.3, grey: 0.25 },
		stores: ['meesho', 'amazon', 'flipkart', 'myntra', 'ajio']
	},
	{
		key: 'earbuds',
		category: 'headphones',
		label: 'Wireless earbuds',
		keywords: ['earbuds', 'earbud', 'earphones', 'earphone', 'headphones', 'headphone', 'tws', 'buds', 'airpods', 'bluetooth', 'wireless', 'neckband', 'audio'],
		colours: { black: 1, grey: 0.45, white: 0.25 },
		stores: ['meesho', 'flipkart', 'amazon', 'tatacliq', 'croma']
	},
	{
		key: 'watch',
		category: 'watch',
		label: 'Wrist watch',
		keywords: ['watch', 'watches', 'wristwatch', 'analog', 'analogue', 'chronograph', 'smartwatch', 'timepiece', 'strap'],
		colours: { brown: 1, orange: 0.6, yellow: 0.35, grey: 0.15 },
		stores: ['meesho', 'flipkart', 'amazon', 'myntra', 'ajio', 'tatacliq']
	}
];

interface SeedListing {
	store: string;
	title: string;
	brand: string;
	price: number;
	mrp: number;
	rating: number;
	ratingCount: number;
	days: number;
}

interface Seed {
	id: string;
	group: GroupKey;
	name: string;
	brand: string;
	description: string;
	art: ArtSpec;
	colours?: ColourOption[];
	sizes?: string[];
	/** Hand-written listings (main products) ... */
	listings?: SeedListing[];
	/** ... or a base (lowest) price to generate 3-4 listings from. */
	base?: number;
	words?: string[];
	main?: boolean;
}

const DRESS_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'];
const sample = (key: string) => SAMPLE_ART.find((s) => s.key === key)!.art;

const SEEDS: Seed[] = [
	// ---------------------------------------------------------------- dress
	{
		id: 'floral-summer-dress',
		group: 'dress',
		main: true,
		name: 'Floral Print Fit & Flare Summer Dress',
		brand: 'Bloom & Co',
		description: 'Lightweight rayon midi dress with a flutter sleeve, smocked waist and an all-over floral print. Easy summer wear for day outings.',
		art: sample('dress'),
		colours: [
			{ name: 'Pink floral', hex: '#FF6B9D' },
			{ name: 'Blue floral', hex: '#4D96FF' },
			{ name: 'Yellow floral', hex: '#FFD60A' }
		],
		sizes: DRESS_SIZES,
		listings: [
			{ store: 'meesho', title: "Women's Floral Fit & Flare Midi Dress", brand: 'Petal Lane', price: 549, mrp: 1499, rating: 3.9, ratingCount: 2140, days: 6 },
			{ store: 'flipkart', title: 'Floral Print A-Line Summer Dress', brand: 'Bloom & Co', price: 799, mrp: 1999, rating: 4.1, ratingCount: 864, days: 3 },
			{ store: 'amazon', title: "Bloom & Co Women's Floral Summer Dress", brand: 'Bloom & Co', price: 849, mrp: 1999, rating: 4.2, ratingCount: 1320, days: 2 },
			{ store: 'myntra', title: 'Bloom & Co Floral Fit & Flare Dress', brand: 'Bloom & Co', price: 999, mrp: 1999, rating: 4.4, ratingCount: 540, days: 4 },
			{ store: 'ajio', title: 'SunKissed Floral Tiered Dress', brand: 'SunKissed', price: 1099, mrp: 2299, rating: 4.0, ratingCount: 212, days: 5 },
			{ store: 'nykaa', title: 'SunKissed Floral Wrap Midi Dress', brand: 'SunKissed', price: 1299, mrp: 2499, rating: 4.3, ratingCount: 96, days: 4 }
		]
	},
	{ id: 'polka-dot-wrap-dress', group: 'dress', name: 'Polka Dot Wrap Midi Dress', brand: 'Petal Lane', description: 'Wrap-style midi dress with tie waist and polka dots.', art: { category: 'dress', bg: '#E0F0FF', main: '#4D96FF', accent: '#FFFFFF' }, base: 999, sizes: DRESS_SIZES, colours: [{ name: 'Blue', hex: '#4D96FF' }, { name: 'Black', hex: '#222222' }], words: ['polka', 'dot', 'wrap', 'midi'] },
	{ id: 'sunflower-tiered-maxi', group: 'dress', name: 'Sunflower Tiered Maxi Dress', brand: 'SunKissed', description: 'Flowy three-tier maxi dress with a sunflower print.', art: { category: 'dress', bg: '#E5F6E7', main: '#FFD60A', accent: '#FF6B9D' }, base: 1499, sizes: DRESS_SIZES, words: ['sunflower', 'tiered', 'maxi'] },
	{ id: 'ditsy-floral-shirt-dress', group: 'dress', name: 'Ditsy Floral Shirt Dress', brand: 'Bloom & Co', description: 'Button-down shirt dress with a tiny floral print and belt.', art: { category: 'dress', bg: '#FFE0EC', main: '#6BCB77', accent: '#FFFFFF' }, base: 1199, sizes: DRESS_SIZES, words: ['ditsy', 'shirt', 'button'] },
	{ id: 'linen-strappy-sundress', group: 'dress', name: 'Linen Strappy Sundress', brand: 'SunKissed', description: 'Breathable linen-blend sundress with adjustable straps.', art: { category: 'dress', bg: '#FFF3B0', main: '#FF9E5E', accent: '#FFFFFF' }, base: 1799, sizes: DRESS_SIZES, words: ['linen', 'strappy', 'sundress'] },
	{ id: 'cotton-floral-aline', group: 'dress', name: 'Cotton Floral A-Line Dress', brand: 'DailyDrape', description: 'Everyday cotton A-line dress with a small floral print.', art: { category: 'dress', bg: '#FFF8E7', main: '#FF8FB1', accent: '#4D96FF' }, base: 349, sizes: DRESS_SIZES, words: ['cotton', 'a-line'] },
	{ id: 'rayon-skater-dress', group: 'dress', name: 'Rayon Floral Skater Dress', brand: 'DailyDrape', description: 'Short skater dress in soft rayon with a flared skirt.', art: { category: 'dress', bg: '#E0F0FF', main: '#B28DFF', accent: '#FFD60A' }, base: 399, sizes: DRESS_SIZES, words: ['rayon', 'skater'] },
	{ id: 'printed-summer-mini', group: 'dress', name: 'Printed Summer Mini Dress', brand: 'Petal Lane', description: 'Sleeveless printed mini dress for hot days.', art: { category: 'dress', bg: '#FFE8A3', main: '#FF6B6B', accent: '#FFFFFF' }, base: 449, sizes: DRESS_SIZES, words: ['mini', 'sleeveless'] },

	// ---------------------------------------------------------------- sneakers
	{
		id: 'white-sneakers',
		group: 'sneakers',
		main: true,
		name: 'Classic White Low-Top Sneakers',
		brand: 'StrideOn',
		description: 'Clean white low-top sneakers with a cushioned insole and a grippy rubber sole. Goes with everything.',
		art: sample('sneakers'),
		colours: [
			{ name: 'White', hex: '#FFFFFF' },
			{ name: 'White / grey', hex: '#D8D8D8' }
		],
		sizes: SHOE_SIZES,
		listings: [
			{ store: 'meesho', title: 'Men & Women White Casual Sneakers', brand: 'StepEasy', price: 649, mrp: 1499, rating: 3.8, ratingCount: 3410, days: 7 },
			{ store: 'flipkart', title: 'StrideOn Classic White Sneakers', brand: 'StrideOn', price: 899, mrp: 2499, rating: 4.1, ratingCount: 2210, days: 3 },
			{ store: 'amazon', title: 'StrideOn Unisex Low-Top White Sneakers', brand: 'StrideOn', price: 999, mrp: 2499, rating: 4.3, ratingCount: 4520, days: 1 },
			{ store: 'myntra', title: 'UrbanStep Minimal White Sneakers', brand: 'UrbanStep', price: 1199, mrp: 2799, rating: 4.4, ratingCount: 980, days: 4 },
			{ store: 'ajio', title: 'UrbanStep Lace-Up White Sneakers', brand: 'UrbanStep', price: 1299, mrp: 2799, rating: 4.2, ratingCount: 410, days: 5 },
			{ store: 'tatacliq', title: 'Kicks Lab Everyday White Sneakers', brand: 'Kicks Lab', price: 1399, mrp: 2999, rating: 4.5, ratingCount: 260, days: 3 }
		]
	},
	{ id: 'chunky-platform-sneakers', group: 'sneakers', name: 'Chunky White Platform Sneakers', brand: 'UrbanStep', description: 'Platform sole sneakers with a chunky retro look.', art: { category: 'shoes', bg: '#FFE0EC', main: '#FFFFFF', accent: '#FF6B9D' }, base: 1499, sizes: SHOE_SIZES, words: ['chunky', 'platform'] },
	{ id: 'green-court-sneakers', group: 'sneakers', name: 'White & Green Court Sneakers', brand: 'Kicks Lab', description: 'Tennis-inspired court sneakers with a green heel tab.', art: { category: 'shoes', bg: '#FFF3B0', main: '#FFFFFF', accent: '#6BCB77' }, base: 1299, sizes: SHOE_SIZES, words: ['green', 'court', 'tennis'] },
	{ id: 'leather-white-sneakers', group: 'sneakers', name: 'Premium Leather White Sneakers', brand: 'Kicks Lab', description: 'Genuine leather upper with a padded collar.', art: { category: 'shoes', bg: '#E5F6E7', main: '#F4F4F4', accent: '#8B5A2B' }, base: 2399, sizes: SHOE_SIZES, words: ['leather', 'premium'] },
	{ id: 'retro-runner-sneakers', group: 'sneakers', name: 'Retro Runner Sneakers', brand: 'StrideOn', description: 'Lightweight retro running silhouette with suede overlays.', art: { category: 'shoes', bg: '#E0F0FF', main: '#FFFFFF', accent: '#4D96FF' }, base: 1799, sizes: SHOE_SIZES, words: ['retro', 'runner', 'running'] },
	{ id: 'white-canvas-sneakers', group: 'sneakers', name: 'White Canvas Lace-Up Sneakers', brand: 'StepEasy', description: 'Basic canvas sneakers with a vulcanised sole.', art: { category: 'shoes', bg: '#FFE8A3', main: '#FFFFFF', accent: '#BBBBBB' }, base: 349, sizes: SHOE_SIZES, words: ['canvas', 'lace-up'] },
	{ id: 'white-slip-on-sneakers', group: 'sneakers', name: 'White Slip-On Sneakers', brand: 'StepEasy', description: 'No-lace slip-ons with an elastic gusset.', art: { category: 'shoes', bg: '#FF9EC0', main: '#FFFFFF', accent: '#DDDDDD' }, base: 449, sizes: SHOE_SIZES, words: ['slip-on', 'slipon', 'loafer'] },
	{ id: 'mesh-walking-shoes', group: 'sneakers', name: 'Lightweight Mesh Walking Shoes', brand: 'StrideOn', description: 'Breathable mesh walking shoes for daily use.', art: { category: 'shoes', bg: '#6BCB77', main: '#FFFFFF', accent: '#222222' }, base: 549, sizes: SHOE_SIZES, words: ['mesh', 'walking', 'sports'] },

	// ---------------------------------------------------------------- backpack
	{
		id: 'navy-laptop-backpack',
		group: 'backpack',
		main: true,
		name: 'Navy Laptop Backpack 30L',
		brand: 'TrekPak',
		description: '30-litre water-resistant backpack with a padded 15.6" laptop sleeve, bottle pocket and comfortable straps.',
		art: sample('backpack'),
		colours: [
			{ name: 'Navy', hex: '#1F4E9E' },
			{ name: 'Black', hex: '#222222' },
			{ name: 'Teal', hex: '#1A9E8F' }
		],
		listings: [
			{ store: 'meesho', title: 'Casual Laptop Backpack Navy 30L', brand: 'CampusGo', price: 499, mrp: 1299, rating: 3.9, ratingCount: 1870, days: 6 },
			{ store: 'flipkart', title: 'TrekPak 30L Laptop Backpack (Navy)', brand: 'TrekPak', price: 749, mrp: 1999, rating: 4.2, ratingCount: 5320, days: 2 },
			{ store: 'amazon', title: 'TrekPak Water-Resistant Laptop Backpack 30L', brand: 'TrekPak', price: 799, mrp: 1999, rating: 4.3, ratingCount: 8810, days: 1 },
			{ store: 'ajio', title: 'Daypack Co Everyday Backpack Navy', brand: 'Daypack Co', price: 999, mrp: 2199, rating: 4.1, ratingCount: 320, days: 5 },
			{ store: 'myntra', title: 'Daypack Co Unisex Laptop Backpack', brand: 'Daypack Co', price: 1099, mrp: 2199, rating: 4.4, ratingCount: 610, days: 4 }
		]
	},
	{ id: 'anti-theft-backpack', group: 'backpack', name: 'Anti-Theft Laptop Backpack with USB Port', brand: 'TrekPak', description: 'Hidden zips, USB charging port and a hard back panel.', art: { category: 'bag', bg: '#E0F0FF', main: '#333A44', accent: '#4D96FF' }, base: 1599, words: ['anti-theft', 'antitheft', 'usb'] },
	{ id: 'rolltop-backpack', group: 'backpack', name: 'Waterproof Roll-Top Backpack', brand: 'Daypack Co', description: 'Roll-top closure keeps rain out; fits a 15" laptop.', art: { category: 'bag', bg: '#FFF3B0', main: '#2E8B57', accent: '#FFFFFF' }, base: 1899, words: ['rolltop', 'roll-top', 'waterproof'] },
	{ id: 'canvas-rucksack', group: 'backpack', name: 'Vintage Canvas Rucksack', brand: 'Daypack Co', description: 'Washed canvas rucksack with leather-look straps.', art: { category: 'bag', bg: '#E5F6E7', main: '#8B6B4A', accent: '#E8C07A' }, base: 1299, words: ['vintage', 'canvas', 'rucksack'] },
	{ id: 'travel-backpack-40l', group: 'backpack', name: '40L Travel Backpack', brand: 'TrekPak', description: 'Cabin-size travel backpack that opens like a suitcase.', art: { category: 'bag', bg: '#FFE0EC', main: '#4D96FF', accent: '#FFD60A' }, base: 2199, words: ['travel', '40l', 'cabin'] },
	{ id: 'school-backpack-20l', group: 'backpack', name: 'Casual School Backpack 20L', brand: 'CampusGo', description: 'Light 20-litre backpack for school or college.', art: { category: 'bag', bg: '#FFE8A3', main: '#4D96FF', accent: '#FF6B9D' }, base: 299, words: ['school', 'college', '20l'] },
	{ id: 'mini-daypack', group: 'backpack', name: 'Mini Daypack 12L', brand: 'CampusGo', description: 'Small daypack for short trips and essentials.', art: { category: 'bag', bg: '#E0F0FF', main: '#FF6B9D', accent: '#FFFFFF' }, base: 349, words: ['mini', 'small', '12l'] },
	{ id: 'foldable-daypack', group: 'backpack', name: 'Foldable Travel Daypack', brand: 'Daypack Co', description: 'Packs into its own pocket; great as a spare bag.', art: { category: 'bag', bg: '#FFF8E7', main: '#1A9E8F', accent: '#FFD60A' }, base: 399, words: ['foldable', 'packable'] },

	// ---------------------------------------------------------------- earbuds
	{
		id: 'wireless-earbuds',
		group: 'earbuds',
		main: true,
		name: 'Wireless Earbuds with ENC, 40h Playback',
		brand: 'SoundPod',
		description: 'True wireless earbuds with environmental noise cancellation for calls, 40 hours total playback, USB-C fast charging and IPX4 sweat resistance.',
		art: sample('earbuds'),
		colours: [
			{ name: 'Midnight black', hex: '#1C1C1C' },
			{ name: 'Pearl white', hex: '#F2F2F2' },
			{ name: 'Ocean blue', hex: '#4D96FF' }
		],
		listings: [
			{ store: 'meesho', title: 'TWS Bluetooth 5.3 Earbuds with Case', brand: 'Tunely', price: 899, mrp: 2999, rating: 3.7, ratingCount: 4120, days: 7 },
			{ store: 'flipkart', title: 'SoundPod Buds 40 with ENC', brand: 'SoundPod', price: 1199, mrp: 3999, rating: 4.1, ratingCount: 12640, days: 2 },
			{ store: 'amazon', title: 'SoundPod Buds 40 True Wireless Earbuds', brand: 'SoundPod', price: 1299, mrp: 3999, rating: 4.2, ratingCount: 21800, days: 1 },
			{ store: 'tatacliq', title: 'BassBuds Air ENC Earbuds', brand: 'BassBuds', price: 1399, mrp: 3499, rating: 4.0, ratingCount: 520, days: 4 },
			{ store: 'croma', title: 'BassBuds Air Wireless Earbuds (Black)', brand: 'BassBuds', price: 1499, mrp: 3499, rating: 4.3, ratingCount: 1310, days: 2 }
		]
	},
	{ id: 'anc-earbuds-50h', group: 'earbuds', name: 'ANC Wireless Earbuds, 50h', brand: 'SoundPod', description: 'Active noise cancellation up to 35 dB with transparency mode.', art: { category: 'headphones', bg: '#E0F0FF', main: '#F2F2F2', accent: '#BBBBBB' }, base: 2399, words: ['anc', 'noise', 'cancelling', 'cancellation'] },
	{ id: 'gaming-earbuds', group: 'earbuds', name: 'Low-Latency Gaming Earbuds', brand: 'BassBuds', description: '45 ms game mode and RGB charging case.', art: { category: 'headphones', bg: '#E5F6E7', main: '#222222', accent: '#6BCB77' }, base: 1599, words: ['gaming', 'game', 'latency'] },
	{ id: 'open-ear-sports-earbuds', group: 'earbuds', name: 'Open-Ear Sports Earbuds', brand: 'Tunely', description: 'Ear-hook design that stays put during runs.', art: { category: 'headphones', bg: '#FFF3B0', main: '#FF6B9D', accent: '#333333' }, base: 2699, words: ['open-ear', 'sports', 'hook'] },
	{ id: 'wireless-neckband', group: 'earbuds', name: 'Wireless Neckband Earphones', brand: 'Tunely', description: 'Magnetic buds, 30h battery and a flexible neckband.', art: { category: 'headphones', bg: '#FFE0EC', main: '#4D96FF', accent: '#222222' }, base: 999, words: ['neckband', 'magnetic'] },
	{ id: 'basic-tws-earbuds', group: 'earbuds', name: 'Basic TWS Earbuds, 20h', brand: 'BassBuds', description: 'Simple true wireless earbuds with touch controls.', art: { category: 'headphones', bg: '#FFE8A3', main: '#2A2A2A', accent: '#555555' }, base: 499, words: ['basic', 'tws'] },
	{ id: 'mini-tws-earbuds', group: 'earbuds', name: 'Mini TWS Earbuds with Case', brand: 'Tunely', description: 'Compact buds in a pocket-size case.', art: { category: 'headphones', bg: '#E0F0FF', main: '#FFFFFF', accent: '#4D96FF' }, base: 649, words: ['mini', 'compact'] },
	{ id: 'wired-earphones-mic', group: 'earbuds', name: 'Wired Earphones with Mic', brand: 'SoundPod', description: '3.5 mm wired earphones with an in-line mic.', art: { category: 'headphones', bg: '#FFF8E7', main: '#111111', accent: '#FF6B9D' }, base: 299, words: ['wired', 'mic', '3.5mm'] },

	// ---------------------------------------------------------------- watch
	{
		id: 'brown-leather-watch',
		group: 'watch',
		main: true,
		name: 'Analog Wrist Watch, Brown Leather Strap',
		brand: 'Timecraft',
		description: 'Classic 40 mm analog watch with a gold-tone case, mineral glass, Japanese quartz movement and a genuine leather strap.',
		art: sample('watch'),
		colours: [
			{ name: 'Brown / gold', hex: '#8B5A2B' },
			{ name: 'Black / silver', hex: '#222222' },
			{ name: 'Tan / rose gold', hex: '#C68B59' }
		],
		listings: [
			{ store: 'meesho', title: 'Analog Leather Strap Watch for Men & Women', brand: 'Horizon', price: 699, mrp: 1999, rating: 3.8, ratingCount: 1540, days: 6 },
			{ store: 'flipkart', title: 'Timecraft Classic Analog Watch (Brown)', brand: 'Timecraft', price: 999, mrp: 2999, rating: 4.2, ratingCount: 3120, days: 3 },
			{ store: 'amazon', title: 'Timecraft Analog Gold Dial Leather Watch', brand: 'Timecraft', price: 1199, mrp: 2999, rating: 4.3, ratingCount: 5410, days: 1 },
			{ store: 'ajio', title: 'Horizon Leather Strap Analog Watch', brand: 'Horizon', price: 1399, mrp: 2799, rating: 4.1, ratingCount: 280, days: 5 },
			{ store: 'myntra', title: 'Timecraft Unisex Brown Leather Watch', brand: 'Timecraft', price: 1499, mrp: 2999, rating: 4.4, ratingCount: 760, days: 4 },
			{ store: 'tatacliq', title: 'Horizon Heritage Analog Watch', brand: 'Horizon', price: 1599, mrp: 3299, rating: 4.5, ratingCount: 190, days: 3 }
		]
	},
	{ id: 'steel-chronograph-watch', group: 'watch', name: 'Chronograph Watch, Steel Bracelet', brand: 'Horizon', description: 'Three-dial chronograph with a stainless steel bracelet.', art: { category: 'watch', bg: '#E0F0FF', main: '#9AA3AD', accent: '#4D96FF' }, base: 2499, words: ['chronograph', 'steel', 'bracelet', 'metal'] },
	{ id: 'rose-gold-mesh-watch', group: 'watch', name: 'Rose-Gold Mesh Strap Watch', brand: 'Timecraft', description: 'Slim case with a rose-gold milanese mesh strap.', art: { category: 'watch', bg: '#FFE0EC', main: '#D9A08B', accent: '#FFFFFF' }, base: 1799, words: ['rose', 'gold', 'mesh', 'milanese'] },
	{ id: 'amoled-smartwatch', group: 'watch', name: 'Fitness Smartwatch, AMOLED Display', brand: 'Pulse', description: 'Heart-rate, SpO2, 100+ sports modes and Bluetooth calling.', art: { category: 'watch', bg: '#FFF3B0', main: '#222222', accent: '#4D96FF' }, base: 2599, words: ['smartwatch', 'smart', 'fitness', 'amoled'] },
	{ id: 'canvas-field-watch', group: 'watch', name: 'Field Watch with Canvas Strap', brand: 'Horizon', description: 'Easy-read field dial with a canvas NATO strap.', art: { category: 'watch', bg: '#E5F6E7', main: '#556B2F', accent: '#E8C07A' }, base: 1299, words: ['field', 'nato', 'military'] },
	{ id: 'minimalist-analog-watch', group: 'watch', name: 'Minimalist Analog Watch', brand: 'Timecraft', description: 'Clean dial, no numbers, slim strap.', art: { category: 'watch', bg: '#FFF8E7', main: '#222222', accent: '#FFFFFF' }, base: 399, words: ['minimalist', 'minimal', 'slim'] },
	{ id: 'digital-sports-watch', group: 'watch', name: 'Digital Sports Watch', brand: 'Pulse', description: 'Stopwatch, alarm and backlight; water resistant.', art: { category: 'watch', bg: '#FFE8A3', main: '#4D96FF', accent: '#222222' }, base: 499, words: ['digital', 'sports'] },
	{ id: 'slim-leather-watch', group: 'watch', name: 'Slim Leather Strap Watch', brand: 'Horizon', description: 'Thin case with a soft tan leather strap.', art: { category: 'watch', bg: '#E0F0FF', main: '#C68B59', accent: '#F2D9A0' }, base: 599, words: ['slim', 'tan', 'thin'] }
];

const MAX_PRICE = 2999;

function genListings(seed: Seed, group: Group): Listing[] {
	const r = rng(hash(seed.id));
	const base = seed.base ?? 999;
	// Deterministic Fisher-Yates shuffle of the group's stores.
	const stores = [...group.stores];
	for (let i = stores.length - 1; i > 0; i--) {
		const j = Math.floor(r() * (i + 1));
		[stores[i], stores[j]] = [stores[j], stores[i]];
	}
	const n = 3 + Math.floor(r() * 2); // 3-4 listings
	return stores.slice(0, n).map((store, i) => {
		const mult = [1, 1.07, 1.14, 1.22][i];
		const price = Math.min(MAX_PRICE, i === 0 ? base : retailRound(base * mult));
		const mrp = retailRound(base * (1.7 + r() * 0.6));
		return {
			store,
			title: `${seed.brand} ${seed.name}`,
			brand: seed.brand,
			price,
			mrp,
			rating: Math.round((3.6 + r() * 1.0) * 10) / 10,
			ratingCount: 40 + Math.floor(r() * 3000),
			days: 1 + Math.floor(r() * 7)
		};
	}).map((l, i) => toListing(seed.id, i, l));
}

function toListing(productId: string, i: number, l: SeedListing): Listing {
	const meta = storeMeta(l.store);
	const free = l.price >= 499 || l.store === 'meesho';
	return {
		id: `${productId}-${l.store}-${i}`,
		store: l.store,
		storeName: meta.name,
		title: l.title,
		brand: l.brand,
		price: l.price,
		mrp: l.mrp,
		discountPct: l.mrp > l.price ? Math.round((1 - l.price / l.mrp) * 100) : 0,
		rating: l.rating,
		ratingCount: l.ratingCount,
		deliveryDays: l.days,
		deliveryText: `${free ? 'Free delivery' : '+₹40 delivery'} · ${deliveryText(l.days)}`,
		url: meta.search(l.title),
		inStock: true
	};
}

/** 13 weekly points ending today; deterministic per product, last point = current best price. */
export function priceHistory(id: string, best: number, today = new Date()): PricePoint[] {
	const r = rng(hash(`hist:${id}`));
	const pts: PricePoint[] = [];
	let p = best * (1.12 + r() * 0.15);
	for (let w = 12; w >= 0; w--) {
		const d = new Date(today);
		d.setUTCDate(d.getUTCDate() - w * 7);
		if (w === 0) p = best;
		pts.push({ date: isoDate(d), price: Math.round(p) });
		// random walk drifting down towards today's price (sale weeks dip lower)
		const target = best * (1 + w * 0.008);
		p = p + (target - p) * 0.35 + best * (r() - 0.5) * 0.12;
		if (r() < 0.12) p = best * (0.92 + r() * 0.05);
	}
	return pts;
}

export interface CatalogEntry {
	product: Product;
	group: Group;
	words: string[];
	main: boolean;
}

function build(): Map<string, CatalogEntry> {
	const map = new Map<string, CatalogEntry>();
	for (const s of SEEDS) {
		const group = GROUPS.find((g) => g.key === s.group)!;
		const listings = s.listings ? s.listings.map((l, i) => toListing(s.id, i, l)) : genListings(s, group);
		const product: Product = {
			id: s.id,
			name: s.name,
			brand: s.brand,
			category: group.category,
			description: s.description,
			images: [0, 1, 2, 3].map((variant) => artUri({ ...s.art, variant })),
			colours: s.colours ?? [],
			sizes: s.sizes ?? [],
			listings,
			priceHistory: [],
			source: 'demo'
		};
		map.set(s.id, { product, group, words: [...(s.words ?? []), ...s.name.toLowerCase().split(/[^a-z0-9-]+/)], main: Boolean(s.main) });
	}
	return map;
}

export const CATALOG = build();

export function bestOf(p: Product): number {
	return Math.min(...p.listings.map((l) => l.price));
}

/** Product with a fresh price history (dates relative to today). */
export function getProduct(id: string): Product | null {
	const e = CATALOG.get(id);
	if (!e) return null;
	return { ...e.product, priceHistory: priceHistory(id, bestOf(e.product)) };
}

export function mainProduct(group: GroupKey): Product {
	const e = [...CATALOG.values()].find((x) => x.main && x.group.key === group)!;
	return getProduct(e.product.id)!;
}

export function groupForCategory(category: Category | null | undefined): Group | null {
	return GROUPS.find((g) => g.category === category) ?? null;
}

function toSuggestion(p: Product): Suggestion {
	const best = [...p.listings].sort((a, b) => a.price - b.price)[0];
	return {
		id: p.id,
		name: p.name,
		brand: p.brand,
		category: p.category,
		image: p.images[0],
		price: best.price,
		mrp: best.mrp,
		rating: best.rating,
		store: best.store,
		storeName: best.storeName,
		url: best.url,
		hasDetail: true
	};
}

/** "Similar styles" (same group, priced at or above this product) and "Cheaper alternatives" (cheaper than its best price). */
export function suggestionsFor(id: string): { similar: Suggestion[]; cheaper: Suggestion[] } {
	const e = CATALOG.get(id);
	if (!e) return { similar: [], cheaper: [] };
	const best = bestOf(e.product);
	const siblings = [...CATALOG.values()].filter((x) => x.group.key === e.group.key && x.product.id !== id).map((x) => x.product);
	const similar = siblings
		.filter((p) => bestOf(p) >= best)
		.sort((a, b) => bestOf(a) - bestOf(b))
		.slice(0, 4)
		.map(toSuggestion);
	const cheaper = siblings
		.filter((p) => bestOf(p) < best)
		.sort((a, b) => bestOf(a) - bestOf(b))
		.slice(0, 4)
		.map(toSuggestion);
	return { similar, cheaper };
}
