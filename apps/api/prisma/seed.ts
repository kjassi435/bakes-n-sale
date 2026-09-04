/* Seeds the database with Bakes n Sale real product catalog from /images/bakes */
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as bcrypt from 'bcryptjs';

// Works against local SQLite (file:...) and Turso (libsql:// + TURSO_AUTH_TOKEN)
const __seedUrl = process.env.DATABASE_URL ?? '';
const prisma = new PrismaClient(
  __seedUrl.startsWith('libsql:')
    ? { adapter: new PrismaLibSql({ url: __seedUrl, authToken: process.env.TURSO_AUTH_TOKEN }) }
    : undefined,
);

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

const CATEGORIES = [
  { name: 'Biscuits', slug: 'biscuits', sortOrder: 1, image: '/images/bakes/bakes-03.jpeg', description: 'Crisp, buttery biscuits — from Usmania to Thekua, baked fresh daily.' },
  { name: 'Cookies', slug: 'cookies', sortOrder: 2, image: '/images/bakes/bakes-04.jpeg', description: 'Small-batch cookies — Jeera, Butter, Chocolate Chip, Cashew & Almond.' },
  { name: 'Rusks & Toasts', slug: 'rusks-toasts', sortOrder: 3, image: '/images/bakes/bakes-08.jpeg', description: 'Twice-baked rusks and toasts — milk, suji, elaichi & classic.' },
  { name: 'Regional Specialties', slug: 'regional-specialties', sortOrder: 4, image: '/images/bakes/bakes-14.jpeg', description: 'Thekua, Mathri, Khari, Shakkarpara & Chakuli — regional festive sweets.' },
  { name: 'Dry Cakes & Muffins', slug: 'dry-cakes-muffins', sortOrder: 5, image: '/images/bakes/bakes-33.jpeg', description: 'Fruit cakes, plum cakes, blueberry & tutti-frutti muffins.' },
  { name: 'Soft Bakery', slug: 'soft-bakery', sortOrder: 6, image: '/images/bakes/bakes-21.jpeg', description: 'Cream buns, cream rolls, croissants & puff pastries — soft & fresh.' },
  { name: 'Savory Snacks', slug: 'savory-snacks', sortOrder: 7, image: '/images/bakes/bakes-28.jpeg', description: 'Masala sticks, crackers, twists, namak para & mixtures.' },
  { name: 'Gift Hampers', slug: 'gift-hampers', sortOrder: 8, image: '/images/bakes/bakes-34.jpeg', description: 'Assorted biscuit, dry cake & corporate snack hampers for gifting.' },
];

const SUBCATEGORIES: Record<string, { name: string; slug: string; description?: string }[]> = {
  biscuits: [
    { name: 'Usmania Biscuit', slug: 'usmania-biscuit' },
    { name: 'Nankhatai', slug: 'nankhatai-biscuit' },
    { name: 'Coconut Biscuit', slug: 'coconut-biscuit' },
    { name: 'Jeera Biscuit', slug: 'jeera-biscuit' },
    { name: 'Fruit Biscuit', slug: 'fruit-biscuit' },
    { name: 'Elaichi Biscuit', slug: 'elaichi-biscuit' },
    { name: 'Khari Biscuit', slug: 'khari-biscuit' },
    { name: 'Multi-Grain Biscuit', slug: 'multi-grain-biscuit' },
    { name: 'Digestive Biscuit', slug: 'digestive-biscuit' },
    { name: 'Thekua (sweet biscuit style)', slug: 'thekua-biscuit' },
  ],
  cookies: [
    { name: 'Jeera Cookies', slug: 'jeera-cookies' },
    { name: 'Butter Cookies', slug: 'butter-cookies' },
    { name: 'Chocolate Chip Cookies', slug: 'chocolate-chip-cookies' },
    { name: 'Cashew Cookies', slug: 'cashew-cookies' },
    { name: 'Almond Cookies', slug: 'almond-cookies' },
  ],
  'rusks-toasts': [
    { name: 'Milk Rusk', slug: 'milk-rusk' },
    { name: 'Suji Rusk', slug: 'suji-rusk' },
    { name: 'Elaichi Rusk', slug: 'elaichi-rusk' },
    { name: 'Classic Toast', slug: 'classic-toast' },
  ],
  'regional-specialties': [
    { name: 'Thekua (festive sweet)', slug: 'thekua-festive' },
    { name: 'Mathri', slug: 'mathri' },
    { name: 'Khari', slug: 'khari-regional' },
    { name: 'Shakkarpara', slug: 'shakkarpara' },
    { name: 'Chakuli', slug: 'chakuli' },
  ],
  'dry-cakes-muffins': [
    { name: 'Fruit Cake', slug: 'fruit-cake' },
    { name: 'Blueberry Muffins', slug: 'blueberry-muffins' },
    { name: 'Plum Cake', slug: 'plum-cake' },
    { name: 'Tutti-Frutti Cake', slug: 'tutti-frutti-cake' },
  ],
  'soft-bakery': [
    { name: 'Cream Buns', slug: 'cream-buns' },
    { name: 'Cream Rolls', slug: 'cream-rolls' },
    { name: 'Croissants', slug: 'croissants' },
    { name: 'Puff Pastries', slug: 'puff-pastries' },
  ],
  'savory-snacks': [
    { name: 'Masala Sticks', slug: 'masala-sticks' },
    { name: 'Salted Crackers', slug: 'salted-crackers' },
    { name: 'Spicy Twists', slug: 'spicy-twists' },
    { name: 'Namak Para', slug: 'namak-para' },
    { name: 'Mixture', slug: 'mixture' },
  ],
  'gift-hampers': [
    { name: 'Assorted Biscuit Hampers', slug: 'assorted-biscuit-hampers' },
    { name: 'Festive Dry Cake Hampers', slug: 'festive-dry-cake-hampers' },
    { name: 'Corporate Snack Hampers', slug: 'corporate-snack-hampers' },
  ],
};

type VariantSeed = { name: string; option1?: string; option2?: string; price: number; stock: number };
type ProductSeed = {
  name: string; slug: string; category: string; basePrice: number; compareAtPrice?: number;
  shortDescription: string; description: string; tags: string[]; allergens: string[];
  nutrition: Record<string, string | number>; variants?: VariantSeed[]; stock?: number;
  isFeatured?: boolean; isChefSpecial?: boolean;
};

const B = (n: number) => `/images/bakes/bakes-${String(n).padStart(2,'0')}.jpeg`;

// Deep-research mapping: each product -> its most specific subcategory
const PRODUCT_SUB_MAP: Record<string, string> = {
  'ellora-nan-khatai-300g': 'nankhatai-biscuit',
  'besan-pista-nankhatai-400g': 'nankhatai-biscuit',
  'singla-jeera-biscuit-400g': 'jeera-biscuit',
  'polka-pista-cashew-cookies-400g': 'cashew-cookies',
  'big-bake-pista-badam-450g': 'almond-cookies',
  'breadberries-coconut-cookies-200g': 'coconut-biscuit',
  'chocolate-almond-crunch-250g': 'almond-cookies',
  'classic-tea-rusk-350g': 'classic-toast',
  'singla-karachi-fruit-biscuit-400g': 'fruit-biscuit',
  'singla-butter-kaju-400g': 'butter-cookies',
  'plain-butter-crunch-300g': 'butter-cookies',
  'assorted-gift-box-900g': 'assorted-biscuit-hampers',
  'dry-fruit-jar-collection-500g': 'corporate-snack-hampers',
  'thekua-leaf-jaggery-500g': 'thekua-biscuit',
  'lajpat-nagar-mix-500g': 'mixture',
  'singla-fruit-cocktail-400g': 'fruit-biscuit',
  'singla-coconut-crunch-400g': 'coconut-biscuit',
  'singla-sugarfree-coconut-400g': 'coconut-biscuit',
  'whole-wheat-rusk-400g': 'suji-rusk',
  'classic-sweets-box-700g': 'festive-dry-cake-hampers',
  'tasty-sweets-jar-450g': 'assorted-biscuit-hampers',
  'oven-fresh-jeera-350g': 'jeera-cookies',
  'butter-scotch-crunch-300g': 'butter-cookies',
  'healthy-multigrain-350g': 'multi-grain-biscuit',
  'besan-laddu-cookies-400g': 'butter-cookies',
  'atta-biscuit-400g': 'digestive-biscuit',
  'kaju-pista-biscotti-300g': 'cashew-cookies',
  'masala-mathi-400g': 'namak-para',
  'premium-cashew-cookies-350g': 'cashew-cookies',
  'choco-chip-classic-350g': 'chocolate-chip-cookies',
  'fruit-nut-karachi-400g': 'fruit-biscuit',
  'coconut-macaroon-250g': 'coconut-biscuit',
  'bakery-special-assorted-1kg': 'assorted-biscuit-hampers',
  'festive-deluxe-hamper-1-2kg': 'festive-dry-cake-hampers',
  'wedding-favour-premium-1kg': 'corporate-snack-hampers',
};

const PRODUCTS: ProductSeed[] = [
  {
    name: "Ellora's Oven Fresh Nan Khatai", slug: 'ellora-nan-khatai-300g', category: 'biscuits',
    basePrice: 185, compareAtPrice: 220, shortDescription: 'Desi ghee nan khatai with khus & almond topping.',
    description: 'Ellora’s signature nan khatai — pure ghee, roasted besan, and cardamom, topped with dried rose petals and pistachio. Crumbly, buttery, and baked fresh in small batches. 300g box.',
    tags: ['Vegetarian', 'Bestseller'], allergens: ['Gluten', 'Dairy', 'Nuts'],
    nutrition: { serving: '30 g', calories: 145, fat: '8 g', carbs: '16 g', protein: '2 g', sugar: '7 g' },
    variants: [{ name: '300 g', option1: '300 g', price: 185, stock: 28 }, { name: '500 g', option1: '500 g', price: 290, stock: 18 }],
    isFeatured: true,
  },
  {
    name: 'Besan Pista Nankhatai Special', slug: 'besan-pista-nankhatai-400g', category: 'biscuits',
    basePrice: 240, compareAtPrice: 290, shortDescription: 'Besan-rich nankhatai crowned with pistachio.',
    description: 'Traditional besan nankhatai with a tender crumb, enriched with pure ghee and finished with pistachio slivers. Eggless and perfect with chai. 400g.',
    tags: ['Vegetarian', 'Eggless'], allergens: ['Gluten', 'Dairy', 'Nuts'],
    nutrition: { serving: '30 g', calories: 150, fat: '8 g', carbs: '17 g', protein: '3 g', sugar: '8 g' },
    variants: [{ name: '400 g', option1: '400 g', price: 240, stock: 22 }, { name: '800 g', option1: '800 g', price: 440, stock: 12 }],
  },
  {
    name: 'Singla Jeera Green Chilli Biscuit', slug: 'singla-jeera-biscuit-400g', category: 'biscuits',
    basePrice: 260, compareAtPrice: 310, shortDescription: '100% Veg. Savoury jeera biscuit with green chilli flecks.',
    description: 'Singla’s 100% Veg. square biscuit — buttery base with cumin and green chilli. Seen in your image with the red Singla label. Crisp and lightly spicy.',
    tags: ['Vegetarian', 'Savoury'], allergens: ['Gluten', 'Dairy'],
    nutrition: { serving: '30 g', calories: 135, fat: '6 g', carbs: '18 g', protein: '3 g', sugar: '4 g' },
    variants: [{ name: '400 g', option1: '400 g', price: 260, stock: 30 }],
  },
  {
    name: 'Polka Cashew Pista Delight Cookies', slug: 'polka-pista-cashew-cookies-400g', category: 'biscuits',
    basePrice: 320, compareAtPrice: 380, shortDescription: 'Premium cookies loaded with pistachio & cashew.',
    description: 'Polka “Original Cookies Recipe” — buttery cookies generously topped with pistachio and cashew. Health, hygiene & happiness in every bite. 400g.',
    tags: ['Vegetarian', 'Premium'], allergens: ['Gluten', 'Dairy', 'Nuts'],
    nutrition: { serving: '30 g', calories: 155, fat: '9 g', carbs: '15 g', protein: '4 g', sugar: '9 g' },
    variants: [{ name: '400 g', option1: '400 g', price: 320, stock: 20 }],
    isChefSpecial: true,
  },
  {
    name: 'Big Bake Pista Badam Butter Cookies', slug: 'big-bake-pista-badam-450g', category: 'biscuits',
    basePrice: 315, compareAtPrice: 370, shortDescription: 'Pista badam cookies in Big Bake signature jar.',
    description: 'Big Bake Pista Badam — buttery cookies packed with pistachio & almond. Clear PET jar keeps them crisp. 450g.',
    tags: ['Vegetarian', 'Gifting'], allergens: ['Gluten', 'Dairy', 'Nuts'],
    nutrition: { serving: '30 g', calories: 160, fat: '9 g', carbs: '16 g', protein: '4 g', sugar: '8 g' },
    variants: [{ name: '450 g', option1: '450 g', price: 315, stock: 18 }],
  },
  {
    name: 'Breadberries Coconut Cookies 200g', slug: 'breadberries-coconut-cookies-200g', category: 'biscuits',
    basePrice: 145, compareAtPrice: 175, shortDescription: 'BB Coconut Cookies 200gm — butter & coconut.',
    description: 'Breadberries Coconut Cookies 200gm — ingredients: Butter, Sugar, Maida, Coconut Powder, Egg, Essence. Made in UAE. Soft-crumb coconut cookies, as seen in your handheld 200g tub.',
    tags: ['Vegetarian'], allergens: ['Gluten', 'Dairy', 'Eggs', 'Coconut'],
    nutrition: { serving: '30 g', calories: 140, fat: '7 g', carbs: '17 g', protein: '2 g', sugar: '9 g' },
    variants: [{ name: '200 g', option1: '200 g', price: 145, stock: 35 }, { name: '400 g', option1: '400 g', price: 260, stock: 20 }],
    isFeatured: true,
  },
  {
    name: 'Chocolate Almond Crunch Cookies', slug: 'chocolate-almond-crunch-250g', category: 'biscuits',
    basePrice: 195, compareAtPrice: 240, shortDescription: 'Chocolate cookies crumbled with roasted almonds.',
    description: 'Dark chocolate cookies with a crackled top, studded with roasted almonds and nut dust. Rich, bittersweet, and nutty. 250g.',
    tags: ['Vegetarian', 'Chocolate'], allergens: ['Gluten', 'Dairy', 'Nuts', 'Eggs'],
    nutrition: { serving: '30 g', calories: 150, fat: '8 g', carbs: '17 g', protein: '3 g', sugar: '10 g' },
    variants: [{ name: '250 g', option1: '250 g', price: 195, stock: 25 }, { name: '500 g', option1: '500 g', price: 360, stock: 14 }],
    isChefSpecial: true,
  },
  {
    name: 'Classic Tea Rusk Crispy', slug: 'classic-tea-rusk-350g', category: 'rusks-toasts',
    basePrice: 110, compareAtPrice: 135, shortDescription: 'Golden crisp rusk — perfect for dunking.',
    description: 'Classic tea rusk — twice-baked, light, and shattering crisp. The bakery’s everyday chai companion, as seen in your pile of oval rusks.',
    tags: ['Vegetarian', 'Everyday'], allergens: ['Gluten', 'Dairy'],
    nutrition: { serving: '30 g', calories: 120, fat: '3 g', carbs: '20 g', protein: '3 g', sugar: '5 g' },
    variants: [{ name: '350 g', option1: '350 g', price: 110, stock: 40 }, { name: '700 g', option1: '700 g', price: 200, stock: 24 }],
  },
  {
    name: 'Singla Karachi Fruit Biscuit', slug: 'singla-karachi-fruit-biscuit-400g', category: 'biscuits',
    basePrice: 294, compareAtPrice: 340, shortDescription: 'Best Quality Karachi Cookies 400g.',
    description: 'Singla Karachi Fruit Biscuit — square cookies studded with tutti frutti, as seen in your 100% Veg. box. Price verified at ₹294 on Pricee/Flipkart for 400g.',
    tags: ['Vegetarian', 'Karachi'], allergens: ['Gluten', 'Dairy', 'Nuts'],
    nutrition: { serving: '30 g', calories: 138, fat: '6 g', carbs: '19 g', protein: '2 g', sugar: '9 g' },
    variants: [{ name: '400 g', option1: '400 g', price: 294, stock: 26 }],
  },
  {
    name: 'Singla Butter Kaju Cookies', slug: 'singla-butter-kaju-400g', category: 'biscuits',
    basePrice: 299, compareAtPrice: 350, shortDescription: 'Butter kaju cookies 400g.',
    description: 'Singla Butter Kaju — rich butter cookies with cashew bits. Market price ₹299 for 400g (Flipkart/Pricee).',
    tags: ['Vegetarian', 'Kaju'], allergens: ['Gluten', 'Dairy', 'Nuts'],
    nutrition: { serving: '30 g', calories: 145, fat: '7 g', carbs: '18 g', protein: '3 g', sugar: '8 g' },
    variants: [{ name: '400 g', option1: '400 g', price: 299, stock: 22 }],
  },
  {
    name: 'Plain Butter Crunch Cookies', slug: 'plain-butter-crunch-300g', category: 'biscuits',
    basePrice: 165, compareAtPrice: 195, shortDescription: 'Simple butter crunch — everyday tea-time.',
    description: 'Plain butter crunch cookies — light, dimpled tops, pure butter aroma. Stackable and dunkable. 300g.',
    tags: ['Vegetarian', 'Tea-time'], allergens: ['Gluten', 'Dairy'],
    nutrition: { serving: '30 g', calories: 130, fat: '6 g', carbs: '17 g', protein: '2 g', sugar: '7 g' },
    variants: [{ name: '300 g', option1: '300 g', price: 165, stock: 30 }],
  },
  {
    name: 'Assorted Sweets & Cookies Gift Box', slug: 'assorted-gift-box-900g', category: 'gift-hampers',
    basePrice: 650, compareAtPrice: 790, shortDescription: '9-box assorted sweets display — perfect for gifting.',
    description: 'Assorted Sweets & Cookies gift display — 9 clear boxes with sticks, fruit cookies, pretzel twists, and more, as seen in your 9-box display image.',
    tags: ['Festive', 'Gifting'], allergens: ['Gluten', 'Dairy', 'Nuts'],
    nutrition: { serving: '50 g', calories: 220, fat: '10 g', carbs: '28 g', protein: '4 g', sugar: '14 g' },
    isFeatured: true,
  },
  {
    name: 'Premium Dry Fruit Jar Collection', slug: 'dry-fruit-jar-collection-500g', category: 'gift-hampers',
    basePrice: 450, compareAtPrice: 540, shortDescription: 'Premium jars with assorted baked treats.',
    description: 'Premium dry fruit jar collection — tall PET jars with golden ribbons, filled with choco, fruit, and nut cookies, as in your 9-jar display.',
    tags: ['Premium', 'Gifting'], allergens: ['Gluten', 'Dairy', 'Nuts'],
    nutrition: { serving: '40 g', calories: 180, fat: '9 g', carbs: '20 g', protein: '5 g', sugar: '10 g' },
  },
  {
    name: 'Thekua Leaf Jaggery Cookies', slug: 'thekua-leaf-jaggery-500g', category: 'biscuits',
    basePrice: 190, compareAtPrice: 230, shortDescription: 'Leaf-shaped thekua with jaggery & ghee.',
    description: 'Leaf-shaped thekua — traditional Bihari jaggery and ghee cookies with leaf-vein impressions, as seen in your close-up. Crisp outside, soft inside.',
    tags: ['Vegetarian', 'Traditional'], allergens: ['Gluten', 'Dairy'],
    nutrition: { serving: '40 g', calories: 160, fat: '6 g', carbs: '24 g', protein: '2 g', sugar: '12 g' },
  },
  {
    name: 'Lajpat Nagar Market Special Mix', slug: 'lajpat-nagar-mix-500g', category: 'biscuits',
    basePrice: 250, compareAtPrice: 300, shortDescription: 'Market special packed cookies — Lajpat Nagar style.',
    description: 'Lajpat Nagar Market Special — bulk-packed cookies in big clear tubs, as seen in your YouTube Shorts screenshot from Lajpat Nagar.',
    tags: ['Bestseller', 'Market Special'], allergens: ['Gluten', 'Dairy', 'Nuts'],
    nutrition: { serving: '30 g', calories: 140, fat: '7 g', carbs: '17 g', protein: '3 g', sugar: '8 g' },
  },
  {
    name: 'Singla Fruit Cocktail Cookies', slug: 'singla-fruit-cocktail-400g', category: 'biscuits',
    basePrice: 290, compareAtPrice: 340, shortDescription: 'Square fruit cookies with tutti frutti dots.',
    description: 'Singla Fruit Cocktail — square 100% Veg. cookies with red & green tutti frutti, as in your square-box image.',
    tags: ['Vegetarian', 'Fruity'], allergens: ['Gluten', 'Dairy'],
    nutrition: { serving: '30 g', calories: 135, fat: '6 g', carbs: '18 g', protein: '2 g', sugar: '9 g' },
    variants: [{ name: '400 g', option1: '400 g', price: 290, stock: 20 }],
  },
  {
    name: 'Singla Coconut Crunch Delight', slug: 'singla-coconut-crunch-400g', category: 'biscuits',
    basePrice: 275, compareAtPrice: 320, shortDescription: 'Coconut toffee cookies — chewy & crisp.',
    description: 'Singla Coconut Crunch — coconut-forward cookies, as seen in your coconut-topped image. Lightly sweet and chewy.',
    tags: ['Coconut', 'Vegetarian'], allergens: ['Gluten', 'Dairy', 'Coconut'],
    nutrition: { serving: '30 g', calories: 140, fat: '7 g', carbs: '17 g', protein: '2 g', sugar: '9 g' },
    variants: [{ name: '400 g', option1: '400 g', price: 275, stock: 18 }],
  },
  {
    name: 'Singla Sugar Free Coconut Cookies', slug: 'singla-sugarfree-coconut-400g', category: 'biscuits',
    basePrice: 286, compareAtPrice: 330, shortDescription: 'Sugar free coconut 400g — Flipkart ₹236-286.',
    description: 'Singla Sugar Free Coconut Cookies 400g — verified Flipkart price ₹236-286, MRP ₹330. Light, diabetic-friendly coconut cookies.',
    tags: ['Sugar Free', 'Vegetarian'], allergens: ['Gluten', 'Dairy', 'Coconut'],
    nutrition: { serving: '30 g', calories: 125, fat: '7 g', carbs: '14 g', protein: '3 g', sugar: '2 g' },
    variants: [{ name: '400 g', option1: '400 g', price: 286, stock: 16 }],
  },
  {
    name: 'Premium Whole Wheat Toast Rusk', slug: 'whole-wheat-rusk-400g', category: 'rusks-toasts',
    basePrice: 125, compareAtPrice: 150, shortDescription: 'Whole wheat rusk — fibre rich.',
    description: 'Premium whole wheat toast rusk — oval slices, twice-baked for extra crunch, fibre-rich. 400g.',
    tags: ['Healthy', 'Vegetarian'], allergens: ['Gluten'],
    nutrition: { serving: '30 g', calories: 115, fat: '3 g', carbs: '19 g', protein: '4 g', sugar: '4 g' },
    variants: [{ name: '400 g', option1: '400 g', price: 125, stock: 32 }],
  },
  {
    name: 'Classic Sweets Collection Box', slug: 'classic-sweets-box-700g', category: 'gift-hampers',
    basePrice: 520, compareAtPrice: 620, shortDescription: 'Classic sweets collection — 6 boxes.',
    description: 'Classic Sweets Collection Box — 6-box set with varied sweets, as seen in your multi-box display.',
    tags: ['Festive'], allergens: ['Gluten', 'Dairy'],
    nutrition: { serving: '50 g', calories: 210, fat: '9 g', carbs: '27 g', protein: '4 g', sugar: '13 g' },
  },
  {
    name: 'Tasty Sweets Jar Mix Assorted', slug: 'tasty-sweets-jar-450g', category: 'gift-hampers',
    basePrice: 380, compareAtPrice: 450, shortDescription: 'Tasty sweets jar — mixed flavours.',
    description: 'Tasty Sweets Jar Mix — assorted cookies in tall jars, sweet and salty mix.',
    tags: ['Assorted'], allergens: ['Gluten', 'Dairy'],
    nutrition: { serving: '40 g', calories: 170, fat: '8 g', carbs: '21 g', protein: '3 g', sugar: '10 g' },
  },
  {
    name: 'Oven Fresh Jeera Biscuit', slug: 'oven-fresh-jeera-350g', category: 'biscuits',
    basePrice: 210, compareAtPrice: 250, shortDescription: 'Jeera biscuit — cumin specked.',
    description: 'Oven Fresh Jeera Biscuit — savoury cumin biscuit, crisp and aromatic. 350g.',
    tags: ['Savoury', 'Jeera'], allergens: ['Gluten', 'Dairy'],
    nutrition: { serving: '30 g', calories: 130, fat: '6 g', carbs: '17 g', protein: '3 g', sugar: '4 g' },
    variants: [{ name: '350 g', option1: '350 g', price: 210, stock: 26 }],
  },
  {
    name: 'Butter Scotch Crunch Cookies', slug: 'butter-scotch-crunch-300g', category: 'biscuits',
    basePrice: 200, compareAtPrice: 240, shortDescription: 'Butter scotch — caramel crunch.',
    description: 'Butter Scotch Crunch — butterscotch chips folded into butter cookies. Sweet and crunchy.',
    tags: ['Butterscotch'], allergens: ['Gluten', 'Dairy'],
    nutrition: { serving: '30 g', calories: 145, fat: '7 g', carbs: '18 g', protein: '2 g', sugar: '9 g' },
    variants: [{ name: '300 g', option1: '300 g', price: 200, stock: 20 }],
  },
  {
    name: 'Healthy Multigrain Cookies', slug: 'healthy-multigrain-350g', category: 'biscuits',
    basePrice: 230, compareAtPrice: 275, shortDescription: 'Multigrain — 7 grains, honey sweetened.',
    description: 'Healthy Multigrain Cookies — wheat, oats, jowar, ragi with honey. Wholesome and crisp.',
    tags: ['Healthy', 'Multigrain'], allergens: ['Gluten', 'Dairy'],
    nutrition: { serving: '30 g', calories: 120, fat: '5 g', carbs: '16 g', protein: '4 g', sugar: '6 g' },
    variants: [{ name: '350 g', option1: '350 g', price: 230, stock: 22 }],
  },
  {
    name: 'Besan Laddu Cookies', slug: 'besan-laddu-cookies-400g', category: 'biscuits',
    basePrice: 260, compareAtPrice: 310, shortDescription: 'Besan laddu style cookies — ghee rich.',
    description: 'Besan Laddu Cookies — besan and ghee, melt-in-mouth, as seen in your besan image.',
    tags: ['Besan', 'Festive'], allergens: ['Gluten', 'Dairy', 'Gram Flour'],
    nutrition: { serving: '30 g', calories: 150, fat: '8 g', carbs: '16 g', protein: '3 g', sugar: '8 g' },
    variants: [{ name: '400 g', option1: '400 g', price: 260, stock: 18 }],
  },
  {
    name: 'Whole Wheat Atta Biscuit', slug: 'atta-biscuit-400g', category: 'biscuits',
    basePrice: 240, compareAtPrice: 285, shortDescription: 'Atta biscuit — whole wheat, jaggery.',
    description: 'Whole Wheat Atta Biscuit — fibre rich, jaggery sweetened, as seen in your atta image.',
    tags: ['Atta', 'Healthy'], allergens: ['Gluten'],
    nutrition: { serving: '30 g', calories: 125, fat: '5 g', carbs: '18 g', protein: '3 g', sugar: '6 g' },
    variants: [{ name: '400 g', option1: '400 g', price: 240, stock: 20 }],
  },
  {
    name: 'Kaju Pista Biscotti Premium', slug: 'kaju-pista-biscotti-300g', category: 'biscuits',
    basePrice: 280, compareAtPrice: 330, shortDescription: 'Kaju pista biscotti — Italian style.',
    description: 'Kaju Pista Biscotti — twice-baked almond-pistachio biscotti, crisp and nutty.',
    tags: ['Premium', 'Biscotti'], allergens: ['Gluten', 'Dairy', 'Nuts'],
    nutrition: { serving: '30 g', calories: 145, fat: '7 g', carbs: '17 g', protein: '4 g', sugar: '7 g' },
    variants: [{ name: '300 g', option1: '300 g', price: 280, stock: 16 }],
  },
  {
    name: 'Masala Mathi Namkeen Biscuit', slug: 'masala-mathi-400g', category: 'savory-snacks',
    basePrice: 150, compareAtPrice: 180, shortDescription: 'Masala mathi — savoury & flaky.',
    description: 'Masala Mathi — savoury, flaky, spiced with ajwain and pepper. Traditional namkeen.',
    tags: ['Namkeen', 'Savoury'], allergens: ['Gluten', 'Dairy'],
    nutrition: { serving: '30 g', calories: 140, fat: '7 g', carbs: '17 g', protein: '3 g', sugar: '2 g' },
    variants: [{ name: '400 g', option1: '400 g', price: 150, stock: 24 }],
  },
  {
    name: 'Premium Cashew Cookies', slug: 'premium-cashew-cookies-350g', category: 'biscuits',
    basePrice: 340, compareAtPrice: 400, shortDescription: 'Premium cashew — whole kaju topped.',
    description: 'Premium Cashew Cookies — whole cashew pressed on butter cookie, as seen in your kaju image.',
    tags: ['Premium', 'Kaju'], allergens: ['Gluten', 'Dairy', 'Nuts'],
    nutrition: { serving: '30 g', calories: 155, fat: '9 g', carbs: '15 g', protein: '4 g', sugar: '7 g' },
    variants: [{ name: '350 g', option1: '350 g', price: 340, stock: 14 }],
    isFeatured: true,
  },
  {
    name: 'Choco Chip Cookies Classic', slug: 'choco-chip-classic-350g', category: 'biscuits',
    basePrice: 245, compareAtPrice: 290, shortDescription: 'Choco chip 350g — Singla ₹245.',
    description: 'Choco Chip Cookies Classic — verified Flipkart ₹245 for 350g (MRP ₹539). Choco chips folded into butter cookies.',
    tags: ['Choco Chip', 'Bestseller'], allergens: ['Gluten', 'Dairy', 'Soy'],
    nutrition: { serving: '30 g', calories: 145, fat: '7 g', carbs: '18 g', protein: '2 g', sugar: '10 g' },
    variants: [{ name: '350 g', option1: '350 g', price: 245, stock: 22 }],
  },
  {
    name: 'Fruit & Nut Karachi Special', slug: 'fruit-nut-karachi-400g', category: 'biscuits',
    basePrice: 300, compareAtPrice: 350, shortDescription: 'Karachi fruit & nut — tutti frutti & nuts.',
    description: 'Fruit & Nut Karachi Special — Karachi-style fruit and nut cookies, as seen in your Singla fruit box.',
    tags: ['Karachi', 'Fruit & Nut'], allergens: ['Gluten', 'Dairy', 'Nuts'],
    nutrition: { serving: '30 g', calories: 138, fat: '6 g', carbs: '19 g', protein: '2 g', sugar: '9 g' },
    variants: [{ name: '400 g', option1: '400 g', price: 300, stock: 18 }],
  },
  {
    name: 'Coconut Macaroon Chewy', slug: 'coconut-macaroon-250g', category: 'biscuits',
    basePrice: 175, compareAtPrice: 210, shortDescription: 'Coconut macaroon — chewy & soft.',
    description: 'Coconut Macaroon — chewy coconut cookies with soft centre, desiccated coconut packed.',
    tags: ['Coconut', 'Chewy'], allergens: ['Coconut', 'Eggs', 'Dairy'],
    nutrition: { serving: '30 g', calories: 135, fat: '7 g', carbs: '16 g', protein: '2 g', sugar: '9 g' },
    variants: [{ name: '250 g', option1: '250 g', price: 175, stock: 20 }],
  },
  {
    name: 'Bakery Special Assorted 1Kg', slug: 'bakery-special-assorted-1kg', category: 'gift-hampers',
    basePrice: 550, compareAtPrice: 650, shortDescription: '1Kg assorted — bakery special mix.',
    description: 'Bakery Special Assorted 1Kg — mixed cookies, rusks, and namkeen in one big hamper.',
    tags: ['Assorted', '1Kg'], allergens: ['Gluten', 'Dairy', 'Nuts'],
    nutrition: { serving: '50 g', calories: 200, fat: '9 g', carbs: '25 g', protein: '4 g', sugar: '12 g' },
  },
  {
    name: 'Festive Deluxe Gift Hamper 1.2Kg', slug: 'festive-deluxe-hamper-1-2kg', category: 'gift-hampers',
    basePrice: 999, compareAtPrice: 1199, shortDescription: 'Deluxe hamper — 1.2Kg festive best.',
    description: 'Festive Deluxe Gift Hamper 1.2Kg — curated bestsellers in keepsake box: cookies, nankhatai, rusk, and namkeen.',
    tags: ['Festive', 'Deluxe'], allergens: ['Gluten', 'Dairy', 'Nuts'],
    nutrition: { serving: '50 g', calories: 210, fat: '10 g', carbs: '26 g', protein: '4 g', sugar: '13 g' },
    isFeatured: true, isChefSpecial: true,
  },
  {
    name: 'Wedding Favour Premium Box 1Kg', slug: 'wedding-favour-premium-1kg', category: 'gift-hampers',
    basePrice: 850, compareAtPrice: 999, shortDescription: 'Wedding favour — 1Kg premium box.',
    description: 'Wedding Favour Premium Box 1Kg — elegant ivory box with gold ribbon, filled with signature bakes.',
    tags: ['Wedding', 'Premium'], allergens: ['Gluten', 'Dairy', 'Nuts'],
    nutrition: { serving: '40 g', calories: 180, fat: '8 g', carbs: '22 g', protein: '4 g', sugar: '10 g' },
  },
];

async function main() {
  console.log('🌱 Seeding Bakes n Sale…');
  // Users
  const [adminHash, managerHash, customerHash] = await Promise.all([
    bcrypt.hash('Admin@123', 10),
    bcrypt.hash('Manager@123', 10),
    bcrypt.hash('Priya@123', 10),
  ]);
  await prisma.user.upsert({
    where: { email: 'admin@bakesnsale.com' },
    update: {},
    create: { name: 'Meera Kapoor', email: 'admin@bakesnsale.com', passwordHash: adminHash, role: 'ADMIN', phone: '+91 98100 00001' },
  });
  await prisma.user.upsert({
    where: { email: 'admin@gildedoven.com' },
    update: {},
    create: { name: 'Meera Kapoor', email: 'admin@gildedoven.com', passwordHash: adminHash, role: 'ADMIN', phone: '+91 98100 00001' },
  });
  await prisma.user.upsert({
    where: { email: 'manager@bakesnsale.com' },
    update: {},
    create: { name: 'Arjun Sethi', email: 'manager@bakesnsale.com', passwordHash: managerHash, role: 'MANAGER', phone: '+91 98100 00002' },
  });
  await prisma.user.upsert({
    where: { email: 'manager@gildedoven.com' },
    update: {},
    create: { name: 'Arjun Sethi', email: 'manager@gildedoven.com', passwordHash: managerHash, role: 'MANAGER', phone: '+91 98100 00002' },
  });
  const priya = await prisma.user.upsert({
    where: { email: 'priya@example.com' },
    update: {},
    create: { name: 'Priya Sharma', email: 'priya@example.com', passwordHash: customerHash, role: 'CUSTOMER', phone: '+91 98100 12345', loyaltyPoints: 240 },
  });

  // Categories — 8 mains + 40 subs (clear old first)
  await prisma.category.deleteMany({});
  const catMap: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const cat = await prisma.category.create({ data: c });
    catMap[c.slug] = cat.id;
  }
  for (const [parentSlug, subs] of Object.entries(SUBCATEGORIES)) {
    const parentId = catMap[parentSlug];
    for (let i = 0; i < subs.length; i++) {
      const s = subs[i];
      const sub = await prisma.category.create({
        data: { name: s.name, slug: s.slug, description: s.description ?? `${s.name} — ${CATEGORIES.find((x) => x.slug === parentSlug)?.name}`, sortOrder: i + 1, parentId },
      });
      catMap[s.slug] = sub.id;
    }
  }

  // Clear old products to replace with real bakes catalog
  await prisma.order.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});

  // Products
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    const n = i + 1;
    const variantStock = p.variants ? p.variants.reduce((s, v) => s + v.stock, 0) : 0;
    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        description: p.description,
        sku: `BNS-SKU-${String(n).padStart(3,'0')}`,
        categoryId: catMap[PRODUCT_SUB_MAP[p.slug] ?? p.category],
        images: JSON.stringify([B(n)]),
        tags: JSON.stringify(p.tags),
        allergens: JSON.stringify(p.allergens),
        nutrition: JSON.stringify(p.nutrition),
        basePrice: p.basePrice,
        compareAtPrice: p.compareAtPrice ?? null,
        stock: p.variants ? variantStock : (p.stock ?? 25),
        lowStockThreshold: 5,
        isFeatured: p.isFeatured ?? false,
        isChefSpecial: p.isChefSpecial ?? false,
        variants: p.variants
          ? {
              create: p.variants.map((v) => ({
                ...v,
                option1: v.option1 ?? null,
                option2: v.option2 ?? null,
                sku: `BNS-${p.slug.slice(0, 6).toUpperCase()}-${v.name.replace(/\s/g, '')}`,
              })),
            }
          : undefined,
        createdAt: daysAgo(i * 1),
      },
    });
  }

  // Reviews - updated to new slugs
  const reviewSeeds = [
    { slug: 'ellora-nan-khatai-300g', userName: 'Rahul Gupta', rating: 5, title: 'Best nan khatai in Delhi', body: 'Ellora’s nan khatai is buttery and crumbly. Real ghee flavour, not dalda.' },
    { slug: 'breadberries-coconut-cookies-200g', userName: 'Anjali Verma', rating: 5, title: 'Coconut bliss', body: 'Breadberries coconut cookies are crisp outside, chewy inside. Love the 200g tub.' },
    { slug: 'polka-pista-cashew-cookies-400g', userName: 'Priya Sharma', rating: 5, title: 'My evening chai ritual', body: 'Pista cashew cookies are loaded with nuts. Worth ₹320.' },
    { slug: 'big-bake-pista-badam-450g', userName: 'Vikram Joshi', rating: 4, title: 'Big Bake quality', body: 'Pista badam cookies are fresh and nutty. Jar keeps them crisp.' },
    { slug: 'choco-chip-classic-350g', userName: 'Sunita Malhotra', rating: 5, title: 'Choco chip hit', body: 'Choco chip 350g for ₹245 is steal. Kids finished in two days.' },
    { slug: 'classic-tea-rusk-350g', userName: 'Dev Agarwal', rating: 5, title: 'Perfect rusk', body: 'Classic tea rusk is exactly as in image — golden and crisp for dunking.' },
  ];
  for (const r of reviewSeeds) {
    const product = await prisma.product.findUnique({ where: { slug: r.slug } });
    if (!product) continue;
    const exists = await prisma.review.findFirst({ where: { productId: product.id, userName: r.userName } });
    if (exists) continue;
    await prisma.review.create({
      data: {
        productId: product.id,
        userId: r.userName === 'Priya Sharma' ? priya.id : null,
        userName: r.userName,
        rating: r.rating,
        title: r.title,
        body: r.body,
        createdAt: daysAgo(Math.random() * 20),
      },
    });
    const agg = await prisma.review.aggregate({ where: { productId: product.id }, _avg: { rating: true }, _count: { _all: true } });
    await prisma.product.update({
      where: { id: product.id },
      data: { ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10, ratingCount: agg._count._all },
    });
  }

  // Coupons
  const coupons = [
    { code: 'WELCOME10', type: 'PERCENT', value: 10, maxDiscount: 200, description: '10% off your first order (up to ₹200)' },
    { code: 'FESTIVE25', type: 'PERCENT', value: 25, minOrderValue: 999, maxDiscount: 500, description: '25% off festive orders above ₹999 (up to ₹500)' },
    { code: 'SWEET50', type: 'FIXED', value: 50, minOrderValue: 499, description: 'Flat ₹50 off orders above ₹499' },
    { code: 'FREESHIP', type: 'SHIPPING', value: 0, minOrderValue: 299, description: 'Free delivery on orders above ₹299' },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({ where: { code: c.code }, update: {}, create: { ...c, minOrderValue: c.minOrderValue ?? 0, isActive: true } });
  }

  // Site content defaults (admin-editable CMS; only fills missing keys)
  const siteDefaults: Record<string, any> = {
    hero_slides: ['singla-jeera-biscuit-400g', 'ellora-nan-khatai-300g', 'singla-karachi-fruit-biscuit-400g', 'thekua-leaf-jaggery-500g', 'breadberries-coconut-cookies-200g', 'choco-chip-classic-350g', 'big-bake-pista-badam-450g', 'assorted-gift-box-900g'],
    home_fresh: ['ellora-nan-khatai-300g', 'breadberries-coconut-cookies-200g', 'singla-karachi-fruit-biscuit-400g', 'classic-tea-rusk-350g'],
    home_chef: ['choco-chip-classic-350g', 'polka-pista-cashew-cookies-400g', 'festive-deluxe-hamper-1-2kg', 'chocolate-almond-crunch-250g'],
    home_festive: {
      title: 'Festive Gift Boxes',
      subtitle: 'Keepsake boxes for Diwali, Christmas and weddings — curated, wrapped and delivered with love.',
      slugs: ['assorted-gift-box-900g', 'festive-deluxe-hamper-1-2kg', 'classic-sweets-box-700g', 'wedding-favour-premium-1kg'],
    },
    home_categories: {},
    home_reviews: [
      { name: 'Ritika & Aman', text: 'The truffle cake was the centrepiece of our anniversary. Rich, elegant, and not overly sweet — exactly as a premium cake should be.', time: '2 weeks ago' },
      { name: 'Sunita Malhotra', text: 'I send Bakes n Sale hampers to all our clients every Diwali. The packaging alone earns compliments; the taste keeps them calling back.', time: 'a month ago' },
      { name: 'Rajesh Khanna', text: 'Their kesar rusk with evening chai has become a ritual in our home. You can taste the real saffron — nothing artificial.', time: '3 months ago' },
    ],
    about: {
      eyebrow: 'Our Story', title: 'About Bakes n Sale',
      subtitle: 'Commercial-grade, long-life bakery products that preserve the authenticity of home baking.',
      ceoHeading: 'About the CEO — Mrs. Tanuja',
      ceoBody1: 'Mrs. Tanuja, the visionary behind Bakes n Sale, brings a heartfelt passion for baking and a deep understanding of traditional Indian flavors.',
      ceoBody2: 'Under her leadership, Bakes n Sale has become a symbol of quality, hygiene, and innovation.',
      quote: 'Bake with honesty, serve with love.',
      phone: '7890027798', email: 'bakesnsale@gmail.com', address: '82/7 Shaikh Para Lane, Howrah - 711103',
    },
    contact: {
      phone: '7890027798', email: 'bakesnsale@gmail.com',
      address: '82/7 Shaikh Para Lane, Howrah - 711103, West Bengal, India',
      hours: 'Baking: 5am – 11am daily; Dispatch & Support: 8am – 9pm; Store: 8am – 9pm, Howrah',
      mapUrl: 'https://maps.google.com/?q=82/7 Shaikh Para Lane Howrah 711103',
    },
    header: { announcements: ['Free delivery across Delhi on orders above Rs.999', 'Baked fresh every morning — orders before 2 PM ship same day', 'Use code WELCOME10 for 10% off your first order'] },
    footer: {
      about: 'Baking treasured recipes since 1998 — signature cakes, artisan rusk, small-batch cookies and traditional namkeen, made fresh every morning in Delhi.',
      address: '82/7 Shaikh Para Lane, Howrah - 711103. Open daily 8 AM – 9 PM',
      phone: '+91 78900 27798', email: 'bakesnsale@gmail.com',
      instagram: '#', facebook: '#', youtube: '#',
    },
  };
  for (const [k, v] of Object.entries(siteDefaults)) {
    const exists = await prisma.siteSetting.findUnique({ where: { key: k } });
    if (!exists) await prisma.siteSetting.create({ data: { key: k, value: JSON.stringify(v) } });
  }

  // Demo customer addresses
  const addressCount = await prisma.address.count({ where: { userId: priya.id } });
  if (addressCount === 0) {
    await prisma.address.createMany({
      data: [
        { userId: priya.id, label: 'Home', fullName: 'Priya Sharma', phone: '+91 98100 12345', line1: 'B-42, Sector 16, Rohini', line2: 'Near Metro Pillar 362', city: 'New Delhi', state: 'Delhi', pincode: '110085', isDefault: true },
        { userId: priya.id, label: 'Work', fullName: 'Priya Sharma', phone: '+91 98100 12345', line1: '4th Floor, 24 Barakhamba Road', line2: 'Connaught Place', city: 'New Delhi', state: 'Delhi', pincode: '110001', isDefault: false },
      ],
    });
  }

  // Demo orders for Priya - using new bakes slugs
  const homeAddress = await prisma.address.findFirst({ where: { userId: priya.id, isDefault: true } });
  const variantOf = async (slug: string, name: string) => {
    const product = await prisma.product.findUnique({ where: { slug }, include: { variants: true } });
    const variant = product?.variants.find((v) => v.name === name);
    return { product: product!, variant };
  };

  const orderCount = await prisma.order.count({ where: { userId: priya.id } });
  if (orderCount === 0 && homeAddress) {
    const snapshot = JSON.stringify(homeAddress);
    const { product: ellora, variant: ellora300 } = await variantOf('ellora-nan-khatai-300g', '300 g');
    const { product: coconut, variant: coconut200 } = await variantOf('breadberries-coconut-cookies-200g', '200 g');
    const { product: hamper } = await variantOf('festive-deluxe-hamper-1-2kg', '');
    const { product: rusk, variant: rusk350 } = await variantOf('classic-tea-rusk-350g', '350 g');
    const { product: choco, variant: choco350 } = await variantOf('choco-chip-classic-350g', '350 g');

    await prisma.order.create({
      data: {
        orderNumber: 'BNS-SEED-1001',
        userId: priya.id,
        status: 'DELIVERED',
        paymentMethod: 'TEST_GATEWAY',
        paymentStatus: 'PAID',
        subtotal: 1420, discount: 0, deliveryFee: 0, tax: 71, total: 1491,
        addressSnapshot: snapshot,
        deliveryDate: daysAgo(4).toISOString().slice(0, 10),
        deliverySlot: '4:00 PM - 6:00 PM',
        loyaltyEarned: 149,
        createdAt: daysAgo(5),
        items: {
          create: [
            { productId: ellora.id, variantId: ellora300!.id, productName: ellora.name, variantName: '300 g', image: B(1), unitPrice: 185, quantity: 1, total: 185 },
            { productId: coconut.id, variantId: coconut200!.id, productName: coconut.name, variantName: '200 g', image: B(6), unitPrice: 145, quantity: 1, total: 145 },
          ],
        },
        history: {
          create: [
            { status: 'PAYMENT_CONFIRMED', note: 'Payment received via test gateway', createdAt: daysAgo(5) },
            { status: 'PREPARING', createdAt: daysAgo(4.8) },
            { status: 'QUALITY_CHECK', createdAt: daysAgo(4.6) },
            { status: 'DISPATCHED', note: 'Out for delivery with BlueDart', createdAt: daysAgo(4.4) },
            { status: 'DELIVERED', note: 'Received by customer', createdAt: daysAgo(4.2) },
          ],
        },
      },
    });

    await prisma.order.create({
      data: {
        orderNumber: 'BNS-SEED-1002',
        userId: priya.id,
        status: 'DISPATCHED',
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        subtotal: 1449, discount: 0, deliveryFee: 0, tax: 72.45, total: 1521.45,
        addressSnapshot: snapshot,
        deliveryDate: new Date().toISOString().slice(0, 10),
        deliverySlot: '6:00 PM - 8:00 PM',
        createdAt: daysAgo(1),
        items: {
          create: [
            { productId: hamper.id, productName: hamper.name, image: B(34), unitPrice: 999, quantity: 1, total: 999 },
            { productId: rusk.id, variantId: rusk350!.id, productName: rusk.name, variantName: '350 g', image: B(8), unitPrice: 110, quantity: 2, total: 220 },
          ],
        },
        history: {
          create: [
            { status: 'PENDING', note: 'Order placed — Cash on Delivery', createdAt: daysAgo(1) },
            { status: 'PREPARING', createdAt: daysAgo(0.8) },
            { status: 'QUALITY_CHECK', createdAt: daysAgo(0.4) },
            { status: 'DISPATCHED', note: 'Rider assigned — arriving this evening', createdAt: daysAgo(0.1) },
          ],
        },
      },
    });

    await prisma.order.create({
      data: {
        orderNumber: 'BNS-SEED-1003',
        userId: priya.id,
        status: 'PENDING',
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        subtotal: 500, discount: 0, deliveryFee: 49, tax: 25, total: 574,
        addressSnapshot: snapshot,
        deliveryDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        deliverySlot: '10:00 AM - 12:00 PM',
        notes: 'Please ring the bell twice.',
        createdAt: new Date(),
        items: {
          create: [
            { productId: choco.id, variantId: choco350!.id, productName: choco.name, variantName: '350 g', image: B(30), unitPrice: 245, quantity: 1, total: 245 },
          ],
        },
        history: { create: [{ status: 'PENDING', note: 'Order placed — Cash on Delivery' }] },
      },
    });
  }
  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
