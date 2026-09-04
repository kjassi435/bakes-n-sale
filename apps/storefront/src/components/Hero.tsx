'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CircularGallery, GalleryItem } from './CircularGallery';
import BubbleBackground from './BubbleBackground';

const GALLERY_ITEMS: GalleryItem[] = [
  // 4 new hero images from /images/hero — your high-quality lifestyle shots
  {
    common: 'Singla Jeera Biscuit',
    binomial: '100% Veg · 400g',
    productSlug: 'singla-jeera-biscuit-400g',
    photo: { url: '/images/hero/hero-01.png', text: 'Singla Jeera Biscuit — 100% Veg, wooden pedestal', by: 'Bakes n Sale' },
  },
  {
    common: "Ellora's Nan Khatai",
    binomial: 'Oven Fresh · Handcrafted',
    productSlug: 'ellora-nan-khatai-300g',
    photo: { url: '/images/hero/hero-02.png', text: "Ellora's Nan Khatai — ghee cardamom with chai", by: 'Bakes n Sale' },
  },
  {
    common: 'Karachi Fruit Biscuit',
    binomial: 'Tutti Frutti · 400g',
    productSlug: 'singla-karachi-fruit-biscuit-400g',
    photo: { url: '/images/hero/hero-03.png', text: 'Karachi Fruit Biscuit — handpicked with chai', by: 'Bakes n Sale' },
  },
  {
    common: 'Leaf Thekua',
    binomial: 'Jaggery · Traditional',
    productSlug: 'thekua-leaf-jaggery-500g',
    photo: { url: '/images/hero/hero-04.png', text: 'Leaf Thekua — jaggery & ghee, chai time', by: 'Bakes n Sale' },
  },
  // 4 placeholders from bakes — will auto-replace when you add hero-05.png to hero-08.png
  {
    common: 'Breadberries Coconut Cookies',
    binomial: 'BB Coconut · 200g',
    productSlug: 'breadberries-coconut-cookies-200g',
    photo: { url: '/images/bakes/bakes-06.jpeg', text: 'Breadberries Coconut Cookies 200gm — placeholder', by: 'Bakes n Sale' },
  },
  {
    common: 'Choco Chip Classic',
    binomial: '350g · Bestseller',
    productSlug: 'choco-chip-classic-350g',
    photo: { url: '/images/bakes/bakes-30.jpeg', text: 'Choco Chip Cookies Classic 350g — placeholder', by: 'Bakes n Sale' },
  },
  {
    common: 'Big Bake Pista Badam',
    binomial: '450g · Butter',
    productSlug: 'big-bake-pista-badam-450g',
    photo: { url: '/images/bakes/bakes-05.jpeg', text: 'Big Bake Pista Badam Butter Cookies — placeholder', by: 'Bakes n Sale' },
  },
  {
    common: 'Assorted Gift Box',
    binomial: '9 Varieties · 900g',
    productSlug: 'assorted-gift-box-900g',
    photo: { url: '/images/bakes/bakes-12.jpeg', text: 'Assorted Sweets & Cookies Gift Box — placeholder', by: 'Bakes n Sale' },
  },
];

export default function Hero({ items }: { items?: GalleryItem[] }) {
  const gallery = items && items.length ? items : GALLERY_ITEMS;
  return (
    <section className="relative overflow-hidden">
      <BubbleBackground
        interactive
        className="w-full"
        colors={{
          first: "57,15,16",    // deep wood #390f10
          second: "176,141,87", // gold #b08d57
          third: "212,165,116", // goldlight #d4a574
          fourth: "253,232,208", // blush #fde8d0
          fifth: "212,184,150", // taupe #d4b896
          sixth: "139,58,26",   // mocha wood #8b3a1a
        }}
      >
        <div className="container-x relative z-10 px-4 pt-16 pb-8 text-center sm:pt-20 sm:pb-12">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="eyebrow"
          >
            Artisan Bakery & Patisserie · Delhi
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-5 max-w-3xl mx-auto font-display text-5xl leading-[1.05] font-semibold tracking-tight text-espresso sm:text-6xl lg:text-7xl"
          >
            Baked to be
            <span className="relative mx-3 inline-block text-gold">
              treasured
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 9" fill="none">
                <path d="M2 7C60 2 140 2 198 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-xl mx-auto text-base leading-relaxed text-mocha sm:text-lg"
          >
            Signature cakes, saffron rusk, small-batch cookies and heirloom namkeen — crafted fresh every
            morning from the finest ingredients, and delivered warm to your door.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex flex-col gap-4 sm:flex-row justify-center"
          >
            <Link href="/shop" className="btn-gold">
              Shop the Collection
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
            <Link href="/shop?category=festive-gift-boxes" className="btn-outline">
              Festive Gifting
            </Link>
          </motion.div>
        </div>

        {/* Circular Gallery - Drag / Swipe to rotate - kept crisp above bubbles */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative z-10 h-[520px] sm:h-[620px] w-full flex items-center justify-center overflow-hidden"
        >
          <CircularGallery
            items={gallery}
            autoRotateSpeed={0.14}
            className="w-full h-full"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="relative z-10 text-center text-xs tracking-widest text-mocha/70 -mt-6 pb-4"
        >
          Click a card to view product · Drag or swipe to explore
        </motion.p>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="container-x relative z-10 py-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-xs font-semibold tracking-wider text-mocha uppercase"
        >
          <span>✦ Baked Fresh Daily</span>
          <span>✦ 100% Vegetarian Kitchen</span>
          <span>✦ Same-Day Delhi Delivery</span>
          <span>✦ FSSAI Certified</span>
        </motion.div>
      </BubbleBackground>
    </section>
  );
}
