#!/usr/bin/env node
/**
 * Seed database with dummy data. Skips each section if data already exists.
 * Prints user credentials (email / password) for seed users at the end.
 */
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { eq, count } from "drizzle-orm";
import {
  db,
  users,
  credentials,
  socialProfiles,
  categories,
  products,
  carts,
  cartItems,
  orders,
  orderLines,
  reviews,
} from "../db/index.js";

const SEED_PASSWORD = "SeedPass123!";
const SALT_ROUNDS = 10;

// ─── Realistic seed data ───────────────────────────────────────────────────

const SEED_USERS: Array<{
  email: string;
  name: string;
  role: "customer" | "admin";
  company?: string;
  bio?: string;
}> = [
  { email: "admin@example.com", name: "Sarah Mitchell", role: "admin" },
  { email: "alice@example.com", name: "Alice Johnson", role: "customer" },
  { email: "bob@example.com", name: "Robert Williams", role: "customer" },
  { email: "carol@example.com", name: "Carol Martinez", role: "customer" },
  { email: "dave@example.com", name: "David Kim", role: "customer" },
  { email: "eve@example.com", name: "Eva Thompson", role: "customer" },
  { email: "frank@example.com", name: "Frank O'Brien", role: "customer" },
  { email: "grace@example.com", name: "Grace Lee", role: "customer" },
];

const CATEGORIES: Array<{
  name: string;
  slug: string;
  description: string;
  tags: string[];
}> = [
  {
    name: "Electronics",
    slug: "electronics",
    description: "Smartphones, laptops, tablets, and gadgets.",
    tags: ["tech", "gadgets", "digital"],
  },
  {
    name: "Headphones & Audio",
    slug: "headphones-audio",
    description: "Wireless headphones, earbuds, speakers, and audio equipment.",
    tags: ["audio", "music", "wireless"],
  },
  {
    name: "Laptops & Computers",
    slug: "laptops-computers",
    description: "Laptops, desktops, monitors, and computer accessories.",
    tags: ["computers", "work", "gaming"],
  },
  {
    name: "Smart Home",
    slug: "smart-home",
    description: "Smart speakers, lights, thermostats, and home automation.",
    tags: ["iot", "automation", "home"],
  },
  {
    name: "Men's Clothing",
    slug: "mens-clothing",
    description: "Shirts, pants, jackets, and casual wear for men.",
    tags: ["fashion", "apparel", "mens"],
  },
  {
    name: "Women's Clothing",
    slug: "womens-clothing",
    description: "Dresses, tops, jeans, and fashion for women.",
    tags: ["fashion", "apparel", "womens"],
  },
  {
    name: "Shoes & Footwear",
    slug: "shoes-footwear",
    description: "Sneakers, boots, sandals, and formal shoes.",
    tags: ["footwear", "style"],
  },
  {
    name: "Home & Kitchen",
    slug: "home-kitchen",
    description: "Cookware, appliances, kitchen tools, and home essentials.",
    tags: ["kitchen", "cooking", "home"],
  },
  {
    name: "Furniture",
    slug: "furniture",
    description: "Sofas, chairs, tables, beds, and home furniture.",
    tags: ["furniture", "decor", "living"],
  },
  {
    name: "Sports & Outdoors",
    slug: "sports-outdoors",
    description: "Fitness equipment, camping gear, and outdoor activities.",
    tags: ["fitness", "outdoor", "camping"],
  },
  {
    name: "Books & Media",
    slug: "books-media",
    description: "Books, e-readers, audiobooks, and digital media.",
    tags: ["books", "reading", "media"],
  },
  {
    name: "Toys & Games",
    slug: "toys-games",
    description: "Board games, toys, puzzles, and family entertainment.",
    tags: ["toys", "games", "kids"],
  },
  {
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    description: "Skincare, makeup, hair care, and grooming products.",
    tags: ["beauty", "skincare", "grooming"],
  },
  {
    name: "Health & Wellness",
    slug: "health-wellness",
    description:
      "Vitamins, supplements, fitness trackers, and wellness products.",
    tags: ["health", "wellness", "fitness"],
  },
  {
    name: "Baby & Kids",
    slug: "baby-kids",
    description: "Baby gear, clothing, toys, and nursery essentials.",
    tags: ["baby", "kids", "nursery"],
  },
  {
    name: "Pet Supplies",
    slug: "pet-supplies",
    description: "Food, toys, beds, and accessories for pets.",
    tags: ["pets", "dog", "cat"],
  },
  {
    name: "Office Supplies",
    slug: "office-supplies",
    description: "Stationery, organizers, and office equipment.",
    tags: ["office", "stationery", "work"],
  },
  {
    name: "Garden & Outdoor",
    slug: "garden-outdoor",
    description: "Plants, gardening tools, and outdoor furniture.",
    tags: ["garden", "plants", "outdoor"],
  },
  {
    name: "Automotive",
    slug: "automotive",
    description: "Car accessories, tools, and maintenance products.",
    tags: ["cars", "automotive", "tools"],
  },
  {
    name: "Jewelry & Watches",
    slug: "jewelry-watches",
    description: "Rings, necklaces, bracelets, and timepieces.",
    tags: ["jewelry", "watches", "accessories"],
  },
];

const PRODUCTS: Array<{
  title: string;
  summary: string;
  description: string;
  price: number;
  picture: string;
  tags: string[];
}> = [
  {
    title: "Sony WH-1000XM5 Wireless Headphones",
    summary: "Industry-leading noise cancellation.",
    description:
      "Premium over-ear headphones with adaptive noise cancellation, 30-hour battery, and multipoint connection.",
    price: 349.99,
    picture: "https://picsum.photos/200/200?seed=sony",
    tags: ["headphones", "wireless", "noise-cancelling"],
  },
  {
    title: 'Apple MacBook Pro 14" M3',
    summary: "Powerful laptop for professionals.",
    description:
      "14-inch MacBook Pro with M3 chip, 16GB RAM, 512GB SSD. Perfect for creative work and development.",
    price: 1999.99,
    picture: "https://picsum.photos/200/200?seed=macbook",
    tags: ["laptop", "apple", "professional"],
  },
  {
    title: "Apple AirPods Pro (2nd Gen)",
    summary: "Active noise cancellation earbuds.",
    description:
      "Wireless earbuds with personalized spatial audio, adaptive EQ, and MagSafe charging case.",
    price: 249.99,
    picture: "https://picsum.photos/200/200?seed=airpods",
    tags: ["earbuds", "wireless", "apple"],
  },
  {
    title: 'Samsung 65" QLED 4K Smart TV',
    summary: "Crystal-clear 4K entertainment.",
    description:
      "65-inch QLED 4K UHD Smart TV with Quantum HDR, Alexa built-in, and gaming mode.",
    price: 1299.99,
    picture: "https://picsum.photos/200/200?seed=samsung-tv",
    tags: ["tv", "4k", "smart"],
  },
  {
    title: "Dyson V15 Detect Cordless Vacuum",
    summary: "Laser-reveals microscopic dust.",
    description:
      "Cordless vacuum with laser dust detection, HEPA filtration, and 60-minute runtime.",
    price: 649.99,
    picture: "https://picsum.photos/200/200?seed=dyson",
    tags: ["vacuum", "cordless", "home"],
  },
  {
    title: "Nintendo Switch OLED",
    summary: "Handheld gaming with vibrant display.",
    description:
      "Nintendo Switch OLED model with 7-inch screen, 64GB storage, and enhanced audio.",
    price: 349.99,
    picture: "https://picsum.photos/200/200?seed=switch",
    tags: ["gaming", "console", "portable"],
  },
  {
    title: "Kindle Paperwhite",
    summary: "Glare-free reading experience.",
    description:
      "6.8-inch e-reader with 300 ppi display, adjustable warm light, and weeks of battery life.",
    price: 139.99,
    picture: "https://picsum.photos/200/200?seed=kindle",
    tags: ["ereader", "books", "amazon"],
  },
  {
    title: "Instant Pot Duo 7-in-1",
    summary: "Pressure cooker, slow cooker, and more.",
    description:
      "7-in-1 multi-cooker: pressure cooker, slow cooker, rice cooker, steamer, sauté, yogurt maker.",
    price: 89.99,
    picture: "https://picsum.photos/200/200?seed=instantpot",
    tags: ["kitchen", "cooking", "pressure-cooker"],
  },
  {
    title: "Levi's 501 Original Jeans",
    summary: "Classic straight-fit jeans.",
    description:
      "Iconic 501 Original jeans in medium wash. Made from durable cotton with button fly.",
    price: 69.99,
    picture: "https://picsum.photos/200/200?seed=levis",
    tags: ["jeans", "denim", "casual"],
  },
  {
    title: "Nike Air Max 90",
    summary: "Classic sneaker silhouette.",
    description:
      "Legendary Air Max 90 with visible Air cushioning and durable rubber outsole.",
    price: 130.0,
    picture: "https://picsum.photos/200/200?seed=nike",
    tags: ["sneakers", "nike", "athletic"],
  },
  {
    title: "Adidas Ultraboost 22",
    summary: "Responsive running shoes.",
    description:
      "Boost midsole for energy return. Primeknit upper for adaptive fit.",
    price: 189.99,
    picture: "https://picsum.photos/200/200?seed=adidas",
    tags: ["running", "shoes", "adidas"],
  },
  {
    title: "KitchenAid Artisan Stand Mixer",
    summary: "5-quart mixer for bakers.",
    description:
      "Professional kitchen mixer with 10 speeds, tilt-head design, and multiple attachments.",
    price: 429.99,
    picture: "https://picsum.photos/200/200?seed=kitchenaid",
    tags: ["kitchen", "mixer", "baking"],
  },
  {
    title: "Yeti Rambler 26 oz Tumbler",
    summary: "Double-wall vacuum insulation.",
    description:
      "Stainless steel tumbler keeps drinks cold for 24 hours or hot for 12 hours.",
    price: 39.99,
    picture: "https://picsum.photos/200/200?seed=yeti",
    tags: ["tumbler", "insulated", "outdoor"],
  },
  {
    title: "Amazon Echo Dot (5th Gen)",
    summary: "Smart speaker with Alexa.",
    description:
      "Compact smart speaker with improved sound, temperature sensor, and Alexa built-in.",
    price: 49.99,
    picture: "https://picsum.photos/200/200?seed=echodot",
    tags: ["smart", "alexa", "speaker"],
  },
  {
    title: "Philips Hue Starter Kit",
    summary: "Smart lighting for your home.",
    description:
      "3 smart bulbs and bridge. Control via app or voice. 16 million colors.",
    price: 199.99,
    picture: "https://picsum.photos/200/200?seed=hue",
    tags: ["smart", "lighting", "home"],
  },
  {
    title: "Lululemon Align High-Rise Leggings",
    summary: "Buttery-soft yoga leggings.",
    description:
      "Nulu fabric, high-rise, 25-inch inseam. Perfect for yoga and everyday wear.",
    price: 98.0,
    picture: "https://picsum.photos/200/200?seed=lululemon",
    tags: ["leggings", "yoga", "activewear"],
  },
  {
    title: "Patagonia Better Sweater Jacket",
    summary: "Fleece sweater for outdoor use.",
    description:
      "Recycled polyester fleece. Full-zip, regular fit. Ideal for layering.",
    price: 139.0,
    picture: "https://picsum.photos/200/200?seed=patagonia",
    tags: ["jacket", "fleece", "outdoor"],
  },
  {
    title: "Allbirds Wool Runners",
    summary: "Comfortable everyday sneakers.",
    description:
      "Merino wool upper, SweetFoam sole. Eco-friendly and machine washable.",
    price: 115.0,
    picture: "https://picsum.photos/200/200?seed=allbirds",
    tags: ["sneakers", "sustainable", "comfort"],
  },
  {
    title: "Vitamix 5200 Blender",
    summary: "Professional-grade blender.",
    description:
      "64-ounce container, variable speed, self-cleaning. Ideal for smoothies and soups.",
    price: 449.99,
    picture: "https://picsum.photos/200/200?seed=vitamix",
    tags: ["blender", "kitchen", "smoothie"],
  },
  {
    title: 'Lodge Cast Iron Skillet 12"',
    summary: "Pre-seasoned cast iron.",
    description:
      "12-inch cast iron skillet. Oven-safe, pre-seasoned, made in USA.",
    price: 34.99,
    picture: "https://picsum.photos/200/200?seed=lodge",
    tags: ["skillet", "cast-iron", "cooking"],
  },
  {
    title: "Bose SoundLink Revolve+",
    summary: "Portable Bluetooth speaker.",
    description:
      "360-degree sound, 17-hour battery, water-resistant. Portable party speaker.",
    price: 329.99,
    picture: "https://picsum.photos/200/200?seed=bose",
    tags: ["speaker", "bluetooth", "portable"],
  },
  {
    title: "Logitech MX Master 3S",
    summary: "Ergonomic wireless mouse.",
    description:
      "Ultra-fast scrolling, silent clicks, 70-day battery. For productivity.",
    price: 99.99,
    picture: "https://picsum.photos/200/200?seed=logitech",
    tags: ["mouse", "wireless", "productivity"],
  },
  {
    title: 'Apple iPad Air 10.9"',
    summary: "Powerful tablet for all tasks.",
    description:
      "M1 chip, 64GB storage, 10.9-inch Liquid Retina display. Perfect for work and play.",
    price: 599.99,
    picture: "https://picsum.photos/200/200?seed=ipad",
    tags: ["tablet", "apple", "portable"],
  },
  {
    title: "Fitbit Charge 6",
    summary: "Advanced fitness tracker.",
    description:
      "Heart rate, sleep tracking, GPS, built-in Google apps. 7-day battery.",
    price: 159.95,
    picture: "https://picsum.photos/200/200?seed=fitbit",
    tags: ["fitness", "tracker", "wearable"],
  },
  {
    title: "CeraVe Moisturizing Cream",
    summary: "Hydrating face and body cream.",
    description:
      "Ceramides and hyaluronic acid. Fragrance-free, suitable for dry skin.",
    price: 18.99,
    picture: "https://picsum.photos/200/200?seed=cerave",
    tags: ["skincare", "moisturizer", "ceramides"],
  },
  {
    title: "Theragun Pro",
    summary: "Professional-grade massage gun.",
    description:
      "Quiet percussive therapy. 5 speeds, 4 attachments. Built-in OLED screen.",
    price: 399.99,
    picture: "https://picsum.photos/200/200?seed=theragun",
    tags: ["massage", "recovery", "fitness"],
  },
  {
    title: "Catan Board Game",
    summary: "Classic strategy board game.",
    description: "3-4 players. Trade, build, settle. 30-60 minute playtime.",
    price: 44.99,
    picture: "https://picsum.photos/200/200?seed=catan",
    tags: ["board-game", "strategy", "family"],
  },
  {
    title: "LEGO Technic Porsche 911",
    summary: "1:8 scale model kit.",
    description:
      "1580 pieces. Working steering, gearbox, and engine. Ages 16+.",
    price: 299.99,
    picture: "https://picsum.photos/200/200?seed=lego",
    tags: ["lego", "technic", "model"],
  },
  {
    title: "Stasher Reusable Silicone Bag",
    summary: "Eco-friendly food storage.",
    description:
      "Platinum silicone, dishwasher-safe. Replace single-use plastic bags.",
    price: 24.99,
    picture: "https://picsum.photos/200/200?seed=stasher",
    tags: ["reusable", "silicone", "kitchen"],
  },
  {
    title: "Osprey Farpoint 40 Travel Backpack",
    summary: "Carry-on travel backpack.",
    description:
      "40L capacity, laptop sleeve, lockable zippers. Ideal for one-bag travel.",
    price: 180.0,
    picture: "https://picsum.photos/200/200?seed=osprey",
    tags: ["backpack", "travel", "carry-on"],
  },
  {
    title: "Garmin Fenix 7",
    summary: "GPS multisport watch.",
    description:
      "Solar charging, GPS, maps, health metrics. For runners and outdoor enthusiasts.",
    price: 699.99,
    picture: "https://picsum.photos/200/200?seed=garmin",
    tags: ["watch", "gps", "fitness"],
  },
  {
    title: "Casper Original Pillow",
    summary: "Supportive memory foam pillow.",
    description: "Adaptive foam, breathable cover. Machine washable.",
    price: 65.0,
    picture: "https://picsum.photos/200/200?seed=casper",
    tags: ["pillow", "sleep", "bedding"],
  },
  {
    title: "Blue Yeti USB Microphone",
    summary: "Professional USB condenser mic.",
    description:
      "4 pickup patterns, plug-and-play. For streaming, podcasting, and voice.",
    price: 129.99,
    picture: "https://picsum.photos/200/200?seed=yeti-mic",
    tags: ["microphone", "usb", "streaming"],
  },
  {
    title: "Anker PowerCore 20000",
    summary: "High-capacity portable charger.",
    description:
      "20000mAh, 3 ports. Charges phones and tablets multiple times.",
    price: 49.99,
    picture: "https://picsum.photos/200/200?seed=anker",
    tags: ["charger", "portable", "battery"],
  },
  {
    title: "Hydro Flask 32 oz Wide Mouth",
    summary: "Insulated water bottle.",
    description:
      "Stainless steel, double-wall vacuum. Keeps hot 12 hours, cold 24 hours.",
    price: 44.95,
    picture: "https://picsum.photos/200/200?seed=hydroflask",
    tags: ["water-bottle", "insulated", "outdoor"],
  },
  {
    title: "Ruggable Washable Rug",
    summary: "Machine-washable area rug.",
    description: "Two-piece system: cover and pad. Wash in standard machine.",
    price: 189.0,
    picture: "https://picsum.photos/200/200?seed=ruggable",
    tags: ["rug", "washable", "home"],
  },
  {
    title: "Breville Barista Express",
    summary: "Semi-automatic espresso machine.",
    description: "Built-in grinder, 15-bar pump. Steam wand for milk.",
    price: 699.95,
    picture: "https://picsum.photos/200/200?seed=breville",
    tags: ["espresso", "coffee", "machine"],
  },
  {
    title: "Peloton Bike",
    summary: "Connected indoor cycling.",
    description: "22-inch HD touchscreen, live classes, adjustable resistance.",
    price: 1445.0,
    picture: "https://picsum.photos/200/200?seed=peloton",
    tags: ["fitness", "bike", "cycling"],
  },
  {
    title: "Ring Video Doorbell",
    summary: "Smart video doorbell.",
    description: "1080p HD, two-way talk, motion alerts. Works with Alexa.",
    price: 99.99,
    picture: "https://picsum.photos/200/200?seed=ring",
    tags: ["doorbell", "smart", "security"],
  },
  {
    title: "Ninja Foodi 8-in-1",
    summary: "Pressure cooker and air fryer.",
    description:
      "Pressure cook, air fry, roast, bake, dehydrate. 6.5-quart capacity.",
    price: 199.99,
    picture: "https://picsum.photos/200/200?seed=ninja",
    tags: ["air-fryer", "pressure-cooker", "kitchen"],
  },
  {
    title: "Samsung Galaxy S24",
    summary: "Latest flagship smartphone.",
    description: "6.2-inch display, 128GB storage, AI features. 5G capable.",
    price: 799.99,
    picture: "https://picsum.photos/200/200?seed=galaxy",
    tags: ["smartphone", "samsung", "android"],
  },
  {
    title: "Apple Watch Series 9",
    summary: "Advanced health and fitness.",
    description: "Double-tap, S9 chip, health metrics. GPS + Cellular.",
    price: 429.99,
    picture: "https://picsum.photos/200/200?seed=applewatch",
    tags: ["watch", "apple", "wearable"],
  },
  {
    title: "Dell UltraSharp U2723QE Monitor",
    summary: "27-inch 4K IPS monitor.",
    description: "4K UHD, USB-C hub, 60Hz. Ideal for design and productivity.",
    price: 549.99,
    picture: "https://picsum.photos/200/200?seed=dell",
    tags: ["monitor", "4k", "display"],
  },
  {
    title: "Razer DeathAdder V3",
    summary: "Ergonomic gaming mouse.",
    description: "25K DPI, 90-hour battery. Lightweight for FPS gaming.",
    price: 69.99,
    picture: "https://picsum.photos/200/200?seed=razer",
    tags: ["mouse", "gaming", "razer"],
  },
  {
    title: "Samsung 980 Pro SSD 1TB",
    summary: "NVMe Gen4 SSD.",
    description:
      "1TB PCIe 4.0, 7000 MB/s read. For gaming and content creation.",
    price: 119.99,
    picture: "https://picsum.photos/200/200?seed=ssd",
    tags: ["ssd", "storage", "nvme"],
  },
  {
    title: "Keychron K2 Pro",
    summary: "Wireless mechanical keyboard.",
    description:
      "Compact 75% layout, Bluetooth, hot-swappable. Mac/Windows compatible.",
    price: 99.99,
    picture: "https://picsum.photos/200/200?seed=keychron",
    tags: ["keyboard", "mechanical", "wireless"],
  },
  {
    title: "Sonos One Speaker",
    summary: "Smart speaker with Alexa.",
    description: "Compact smart speaker. Rich sound, voice control.",
    price: 219.99,
    picture: "https://picsum.photos/200/200?seed=sonos",
    tags: ["speaker", "smart", "sonos"],
  },
  {
    title: "Tile Pro Tracker",
    summary: "Bluetooth item tracker.",
    description: "Replaceable battery, 400 ft range. Find keys, wallet, bag.",
    price: 34.99,
    picture: "https://picsum.photos/200/200?seed=tile",
    tags: ["tracker", "bluetooth", "find"],
  },
  {
    title: "Eufy RoboVac 30C",
    summary: "Smart robot vacuum.",
    description: "WiFi connected, app control. 1500Pa suction.",
    price: 249.99,
    picture: "https://picsum.photos/200/200?seed=eufy",
    tags: ["robot-vacuum", "smart", "cleaning"],
  },
  {
    title: "Lululemon Scuba Oversized Hoodie",
    summary: "Cozy everyday hoodie.",
    description: "Fleece-lined, oversized fit. Full zip.",
    price: 118.0,
    picture: "https://picsum.photos/200/200?seed=scuba",
    tags: ["hoodie", "lululemon", "casual"],
  },
  {
    title: "Carhartt Work Jacket",
    summary: "Durable work jacket.",
    description: "Rugged duck canvas. Full zip, multiple pockets.",
    price: 89.99,
    picture: "https://picsum.photos/200/200?seed=carhartt",
    tags: ["jacket", "work", "durable"],
  },
  {
    title: "Vans Old Skool",
    summary: "Classic skate sneakers.",
    description: "Canvas and suede upper. Iconic side stripe.",
    price: 75.0,
    picture: "https://picsum.photos/200/200?seed=vans",
    tags: ["sneakers", "vans", "casual"],
  },
  {
    title: "Converse Chuck Taylor All Star",
    summary: "Timeless canvas sneaker.",
    description: "Classic high-top. Canvas upper, rubber sole.",
    price: 65.0,
    picture: "https://picsum.photos/200/200?seed=converse",
    tags: ["sneakers", "converse", "classic"],
  },
  {
    title: "Bose QuietComfort Earbuds II",
    summary: "Premium noise-cancelling earbuds.",
    description:
      "CustomTune technology, 6-hour battery. Wireless charging case.",
    price: 299.99,
    picture: "https://picsum.photos/200/200?seed=bose-eb",
    tags: ["earbuds", "bose", "noise-cancelling"],
  },
  {
    title: "JBL Flip 6 Portable Speaker",
    summary: "Waterproof Bluetooth speaker.",
    description:
      "IP67 waterproof, 12-hour battery. PartyBoost for stereo pairing.",
    price: 129.95,
    picture: "https://picsum.photos/200/200?seed=jbl",
    tags: ["speaker", "portable", "bluetooth"],
  },
  {
    title: "Stanley Classic Thermos",
    summary: "24 oz insulated bottle.",
    description: "Double-wall vacuum. Hammertone green. Lifetime warranty.",
    price: 45.0,
    picture: "https://picsum.photos/200/200?seed=stanley",
    tags: ["thermos", "insulated", "outdoor"],
  },
  {
    title: "OXO Good Grips Pop Container",
    summary: "Airtight food storage.",
    description:
      "Stackable, airtight seal. BPA-free. For flour, sugar, cereal.",
    price: 24.99,
    picture: "https://picsum.photos/200/200?seed=oxo",
    tags: ["storage", "kitchen", "food"],
  },
  {
    title: "YETI Hopper M30 Soft Cooler",
    summary: "Portable soft cooler.",
    description: "30 oz capacity, MagShield closure. ColdCell insulation.",
    price: 299.99,
    picture: "https://picsum.photos/200/200?seed=yeti-cooler",
    tags: ["cooler", "yeti", "outdoor"],
  },
  {
    title: "Cuisinart Coffee Maker",
    summary: "12-cup programmable brewer.",
    description: "Programmable, brew pause, charcoal filter. Stainless steel.",
    price: 79.99,
    picture: "https://picsum.photos/200/200?seed=cuisinart",
    tags: ["coffee", "maker", "kitchen"],
  },
  {
    title: "Keurig K-Elite",
    summary: "Single-serve coffee maker.",
    description:
      "K-Cup compatible, iced coffee option, strong brew. 75 oz reservoir.",
    price: 149.99,
    picture: "https://picsum.photos/200/200?seed=keurig",
    tags: ["coffee", "keurig", "single-serve"],
  },
  {
    title: "Lodge Dutch Oven 6qt",
    summary: "Enameled cast iron.",
    description: "6-quart capacity. Oven-safe to 500°F. Great for braising.",
    price: 79.99,
    picture: "https://picsum.photos/200/200?seed=lodge-dutch",
    tags: ["dutch-oven", "cast-iron", "cooking"],
  },
  {
    title: "Wusthof Classic Chef's Knife",
    summary: "8-inch professional knife.",
    description: "High-carbon steel, full tang. Precision forged.",
    price: 169.99,
    picture: "https://picsum.photos/200/200?seed=wusthof",
    tags: ["knife", "kitchen", "professional"],
  },
  {
    title: "OXO Good Grips Can Opener",
    summary: "Smooth-edge can opener.",
    description: "Leaves smooth edges, no sharp lids. Easy to use.",
    price: 19.99,
    picture: "https://picsum.photos/200/200?seed=oxo-can",
    tags: ["can-opener", "kitchen", "oxo"],
  },
  {
    title: "Ninja Blender Pro",
    summary: "1000W professional blender.",
    description: "72 oz pitcher, 4 blending programs. Auto-iQ technology.",
    price: 99.99,
    picture: "https://picsum.photos/200/200?seed=ninja-blender",
    tags: ["blender", "ninja", "kitchen"],
  },
  {
    title: "Crock-Pot 6-Quart Slow Cooker",
    summary: "Set-and-forget cooking.",
    description: "6-quart capacity, programmable. 3 settings.",
    price: 49.99,
    picture: "https://picsum.photos/200/200?seed=crockpot",
    tags: ["slow-cooker", "cooking", "kitchen"],
  },
  {
    title: "Pyrex Glass Mixing Bowl Set",
    summary: "4-piece nesting bowls.",
    description: "1.5, 2.5, 4, 8 quart. Microwave and dishwasher safe.",
    price: 29.99,
    picture: "https://picsum.photos/200/200?seed=pyrex",
    tags: ["mixing-bowls", "glass", "kitchen"],
  },
  {
    title: "Ooni Koda 2 Pizza Oven",
    summary: "Portable gas pizza oven.",
    description: "Reaches 950°F in 15 minutes. Cook pizza in 60 seconds.",
    price: 599.99,
    picture: "https://picsum.photos/200/200?seed=ooni",
    tags: ["pizza-oven", "outdoor", "cooking"],
  },
  {
    title: "Weber Spirit II E-310 Gas Grill",
    summary: "3-burner gas grill.",
    description: "529 sq in cooking area. GS4 grilling system.",
    price: 549.99,
    picture: "https://picsum.photos/200/200?seed=weber",
    tags: ["grill", "gas", "outdoor"],
  },
  {
    title: "Coleman Sundome 4-Person Tent",
    summary: "Easy setup camping tent.",
    description: "4-person capacity, weathertec system. 9x7 ft floor.",
    price: 89.99,
    picture: "https://picsum.photos/200/200?seed=coleman",
    tags: ["tent", "camping", "outdoor"],
  },
  {
    title: "REI Co-op Trail 40 Pack",
    summary: "Versatile hiking backpack.",
    description:
      "40L capacity, hydration compatible. Comfortable for day hikes.",
    price: 119.0,
    picture: "https://picsum.photos/200/200?seed=rei",
    tags: ["backpack", "hiking", "outdoor"],
  },
  {
    title: "Nalgene 32oz Wide Mouth",
    summary: "BPA-free water bottle.",
    description: "Durable Tritan plastic. 32 oz capacity.",
    price: 14.99,
    picture: "https://picsum.photos/200/200?seed=nalgene",
    tags: ["water-bottle", "outdoor", "camping"],
  },
  {
    title: "Cascade Mountain Tech Trekking Poles",
    summary: "Adjustable aluminum poles.",
    description: "Cork grips, quick locks. 2-pack.",
    price: 39.99,
    picture: "https://picsum.photos/200/200?seed=trekking",
    tags: ["trekking-poles", "hiking", "outdoor"],
  },
  {
    title: "Black Diamond Headlamp",
    summary: "400-lumen rechargeable.",
    description: "USB rechargeable, 4 modes. Water-resistant.",
    price: 49.95,
    picture: "https://picsum.photos/200/200?seed=headlamp",
    tags: ["headlamp", "outdoor", "camping"],
  },
  {
    title: "Cascade Mountain Tech Camp Chair",
    summary: "Portable camping chair.",
    description: "Compact, 250 lb capacity. Carry bag included.",
    price: 34.99,
    picture: "https://picsum.photos/200/200?seed=camp-chair",
    tags: ["chair", "camping", "outdoor"],
  },
  {
    title: "The Ordinary Niacinamide 10%",
    summary: "Oil control serum.",
    description: "10% niacinamide, zinc. Reduces pore appearance.",
    price: 5.9,
    picture: "https://picsum.photos/200/200?seed=ordinary",
    tags: ["skincare", "serum", "niacinamide"],
  },
  {
    title: "CeraVe Hydrating Cleanser",
    summary: "Gentle facial cleanser.",
    description: "Ceramides, hyaluronic acid. Non-foaming, fragrance-free.",
    price: 14.99,
    picture: "https://picsum.photos/200/200?seed=cerave-cleanser",
    tags: ["cleanser", "skincare", "ceramides"],
  },
  {
    title: "La Roche-Posay Anthelios SPF 50",
    summary: "Lightweight sunscreen.",
    description: "SPF 50, broad spectrum. Oil-free, non-comedogenic.",
    price: 36.99,
    picture: "https://picsum.photos/200/200?seed=lrp",
    tags: ["sunscreen", "spf", "skincare"],
  },
  {
    title: "Paula's Choice BHA 2%",
    summary: "Exfoliating liquid.",
    description: "2% salicylic acid. Unclogs pores, smooths texture.",
    price: 29.99,
    picture: "https://picsum.photos/200/200?seed=pc",
    tags: ["exfoliant", "bha", "skincare"],
  },
  {
    title: "Neutrogena Hydro Boost Gel",
    summary: "Hydrating gel moisturizer.",
    description: "Hyaluronic acid. Oil-free, fragrance-free.",
    price: 18.99,
    picture: "https://picsum.photos/200/200?seed=neutrogena",
    tags: ["moisturizer", "hydrating", "skincare"],
  },
  {
    title: "Monopoly Board Game",
    summary: "Classic property trading game.",
    description: "4-8 players. Buy, sell, trade. Family favorite.",
    price: 24.99,
    picture: "https://picsum.photos/200/200?seed=monopoly",
    tags: ["board-game", "strategy", "family"],
  },
  {
    title: "Uno Card Game",
    summary: "Fast-paced matching game.",
    description: "2-10 players. Match colors and numbers. Easy to learn.",
    price: 8.99,
    picture: "https://picsum.photos/200/200?seed=uno",
    tags: ["card-game", "family", "party"],
  },
  {
    title: "Jenga Classic",
    summary: "Stacking tower game.",
    description: "54 wooden blocks. Remove blocks without toppling.",
    price: 14.99,
    picture: "https://picsum.photos/200/200?seed=jenga",
    tags: ["game", "family", "party"],
  },
  {
    title: "Cards Against Humanity",
    summary: "Party game for horrible people.",
    description: "500+ cards. Fill-in-the-blank humor. Ages 17+.",
    price: 25.0,
    picture: "https://picsum.photos/200/200?seed=cah",
    tags: ["party-game", "humor", "adults"],
  },
  {
    title: "Ticket to Ride",
    summary: "Cross-country train adventure.",
    description: "2-5 players. Build routes across the USA.",
    price: 49.99,
    picture: "https://picsum.photos/200/200?seed=ttr",
    tags: ["board-game", "strategy", "family"],
  },
  {
    title: "Pandemic Board Game",
    summary: "Cooperative strategy game.",
    description: "2-4 players. Work together to stop disease outbreaks.",
    price: 39.99,
    picture: "https://picsum.photos/200/200?seed=pandemic",
    tags: ["board-game", "cooperative", "strategy"],
  },
  {
    title: "Azul Board Game",
    summary: "Abstract tile-placement game.",
    description: "2-4 players. Beautiful tile drafting. 30-45 min.",
    price: 34.99,
    picture: "https://picsum.photos/200/200?seed=azul",
    tags: ["board-game", "abstract", "strategy"],
  },
  {
    title: "Splendor Board Game",
    summary: "Gem-collecting strategy.",
    description: "2-4 players. Collect gems, buy cards. 30 min.",
    price: 39.99,
    picture: "https://picsum.photos/200/200?seed=splendor",
    tags: ["board-game", "strategy", "family"],
  },
  {
    title: "Wingspan Board Game",
    summary: "Bird-collecting engine builder.",
    description: "1-5 players. Build bird habitats. 40-70 min.",
    price: 59.99,
    picture: "https://picsum.photos/200/200?seed=wingspan",
    tags: ["board-game", "strategy", "nature"],
  },
  {
    title: "Apple Mac Mini M2",
    summary: "Compact desktop computer.",
    description: "M2 chip, 8GB RAM, 256GB SSD. Ultra compact.",
    price: 599.99,
    picture: "https://picsum.photos/200/200?seed=macmini",
    tags: ["computer", "apple", "desktop"],
  },
  {
    title: "Google Pixel 8",
    summary: "AI-powered smartphone.",
    description: "6.2-inch display, 128GB. Titan M2 security.",
    price: 699.99,
    picture: "https://picsum.photos/200/200?seed=pixel",
    tags: ["smartphone", "google", "android"],
  },
  {
    title: "Microsoft Surface Laptop 5",
    summary: "Premium Windows laptop.",
    description: "13.5-inch PixelSense, 8GB RAM, 256GB SSD.",
    price: 999.99,
    picture: "https://picsum.photos/200/200?seed=surface",
    tags: ["laptop", "microsoft", "windows"],
  },
  {
    title: 'Samsung 27" Odyssey G5 Monitor',
    summary: "1440p gaming monitor.",
    description: "27-inch, 165Hz, 1ms. Curved for immersion.",
    price: 299.99,
    picture: "https://picsum.photos/200/200?seed=odyssey",
    tags: ["monitor", "gaming", "gaming"],
  },
  {
    title: "SteelSeries Arctis 7+",
    summary: "Wireless gaming headset.",
    description: "2.4GHz wireless, 30-hour battery. Surround sound.",
    price: 149.99,
    picture: "https://picsum.photos/200/200?seed=arctis",
    tags: ["headset", "gaming", "wireless"],
  },
  {
    title: "PlayStation 5",
    summary: "Next-gen gaming console.",
    description: "4K UHD, ray tracing, SSD. DualSense controller.",
    price: 499.99,
    picture: "https://picsum.photos/200/200?seed=ps5",
    tags: ["console", "gaming", "playstation"],
  },
  {
    title: "Xbox Series X",
    summary: "Xbox next-gen console.",
    description: "1TB storage, 4K gaming, Quick Resume.",
    price: 499.99,
    picture: "https://picsum.photos/200/200?seed=xbox",
    tags: ["console", "gaming", "xbox"],
  },
  {
    title: "Apple TV 4K",
    summary: "Streaming and smart home hub.",
    description: "4K HDR, Dolby Atmos. A15 Bionic chip.",
    price: 129.99,
    picture: "https://picsum.photos/200/200?seed=appletv",
    tags: ["streaming", "apple", "4k"],
  },
  {
    title: "Roku Streaming Stick 4K",
    summary: "Affordable 4K streaming.",
    description: "4K HDR, Dolby Vision. Voice remote.",
    price: 49.99,
    picture: "https://picsum.photos/200/200?seed=roku",
    tags: ["streaming", "roku", "4k"],
  },
  {
    title: "Fire TV Stick 4K Max",
    summary: "Amazon streaming device.",
    description: "4K Ultra HD, Wi-Fi 6, Alexa.",
    price: 59.99,
    picture: "https://picsum.photos/200/200?seed=firetv",
    tags: ["streaming", "amazon", "alexa"],
  },
  {
    title: "Samsung Galaxy Buds2 Pro",
    summary: "Premium wireless earbuds.",
    description: "360 audio, ANC, IPX7. 29-hour total battery.",
    price: 229.99,
    picture: "https://picsum.photos/200/200?seed=galaxybuds",
    tags: ["earbuds", "samsung", "wireless"],
  },
  {
    title: "Jabra Elite 85t",
    summary: "True wireless with ANC.",
    description: "12mm speakers, adjustable ANC. 25-hour battery.",
    price: 229.99,
    picture: "https://picsum.photos/200/200?seed=jabra",
    tags: ["earbuds", "jabra", "noise-cancelling"],
  },
  {
    title: "Sennheiser HD 660S",
    summary: "Open-back audiophile headphones.",
    description: "38mm transducers, 150 ohm. Natural sound.",
    price: 499.99,
    picture: "https://picsum.photos/200/200?seed=sennheiser",
    tags: ["headphones", "audiophile", "open-back"],
  },
  {
    title: "Anker Soundcore Life Q35",
    summary: "Budget ANC headphones.",
    description: "LDAC, 40-hour battery. Comfortable over-ear.",
    price: 129.99,
    picture: "https://picsum.photos/200/200?seed=soundcore",
    tags: ["headphones", "anker", "budget"],
  },
  {
    title: "Samsung T7 Portable SSD 1TB",
    summary: "Fast portable storage.",
    description: "1TB, 1050 MB/s. USB 3.2. Pocket-sized.",
    price: 109.99,
    picture: "https://picsum.photos/200/200?seed=t7",
    tags: ["ssd", "portable", "storage"],
  },
  {
    title: "SanDisk Extreme Pro SD Card",
    summary: "170MB/s for 4K video.",
    description: "256GB, UHS-I, V30. For cameras and drones.",
    price: 79.99,
    picture: "https://picsum.photos/200/200?seed=sandisk",
    tags: ["sd-card", "storage", "camera"],
  },
  {
    title: "Elgato Stream Deck",
    summary: "15-key stream control.",
    description: "Customizable keys. Integrates with OBS, Twitch.",
    price: 149.99,
    picture: "https://picsum.photos/200/200?seed=streamdeck",
    tags: ["streaming", "elgato", "content-creation"],
  },
  {
    title: "Rode NT-USB Microphone",
    summary: "Studio-quality USB mic.",
    description: "Cardioid condenser. Plug-and-play for podcasting.",
    price: 99.0,
    picture: "https://picsum.photos/200/200?seed=rode",
    tags: ["microphone", "usb", "podcasting"],
  },
  {
    title: "Elgato Key Light",
    summary: "Professional LED panel.",
    description: "2800 lumens, adjustable. WiFi control.",
    price: 199.99,
    picture: "https://picsum.photos/200/200?seed=keylight",
    tags: ["lighting", "streaming", "elgato"],
  },
  {
    title: "Nest Learning Thermostat",
    summary: "Programs itself.",
    description: "3rd gen. Learns your schedule. Energy saving.",
    price: 249.99,
    picture: "https://picsum.photos/200/200?seed=nest",
    tags: ["smart", "thermostat", "home"],
  },
  {
    title: "Wyze Cam v3",
    summary: "Affordable indoor/outdoor cam.",
    description: "1080p, color night vision, IP65. Starlight sensor.",
    price: 35.99,
    picture: "https://picsum.photos/200/200?seed=wyze",
    tags: ["camera", "security", "smart"],
  },
  {
    title: "iRobot Roomba i3+",
    summary: "Self-emptying robot vacuum.",
    description: "Clean Base. 10x power-lifting suction.",
    price: 449.99,
    picture: "https://picsum.photos/200/200?seed=roomba",
    tags: ["robot-vacuum", "irobot", "self-emptying"],
  },
  {
    title: "Shark IQ Robot Vacuum",
    summary: "Self-empty base.",
    description: "45-day capacity. App control, voice.",
    price: 399.99,
    picture: "https://picsum.photos/200/200?seed=shark",
    tags: ["robot-vacuum", "shark", "smart"],
  },
  {
    title: "Dyson Purifier Cool",
    summary: "Air purifier and fan.",
    description: "HEPA H13, captures 99.97% particles. Oscillating.",
    price: 549.99,
    picture: "https://picsum.photos/200/200?seed=dyson-purifier",
    tags: ["air-purifier", "dyson", "fan"],
  },
  {
    title: "Levoit Core 300",
    summary: "Quiet air purifier.",
    description: "True HEPA, 3-stage. For rooms up to 219 sq ft.",
    price: 99.99,
    picture: "https://picsum.photos/200/200?seed=levoit",
    tags: ["air-purifier", "hepa", "quiet"],
  },
  {
    title: "Bissell CrossWave",
    summary: "Vacuum and mop in one.",
    description: "Wet-dry vac. Cleans hard floors and area rugs.",
    price: 299.99,
    picture: "https://picsum.photos/200/200?seed=crosswave",
    tags: ["vacuum", "mop", "hard-floors"],
  },
  {
    title: "Shark Navigator Lift-Away",
    summary: "Corded upright vacuum.",
    description: "Lift-away pod. HEPA filter. Swivel steering.",
    price: 199.99,
    picture: "https://picsum.photos/200/200?seed=shark-nav",
    tags: ["vacuum", "upright", "corded"],
  },
  {
    title: "Miele Complete C3",
    summary: "German-engineered canister.",
    description: "6-stage filtration. Quiet, powerful.",
    price: 699.99,
    picture: "https://picsum.photos/200/200?seed=miele",
    tags: ["vacuum", "canister", "premium"],
  },
  {
    title: "Ninja Creami",
    summary: "Ice cream maker.",
    description: "Turns frozen pints into ice cream. 7 one-touch programs.",
    price: 199.99,
    picture: "https://picsum.photos/200/200?seed=creami",
    tags: ["ice-cream", "kitchen", "ninja"],
  },
];

const REVIEW_COMMENTS = [
  "Excellent product! Exactly what I was looking for.",
  "Great quality and fast shipping. Very happy with this purchase.",
  "Works perfectly. Would definitely buy again.",
  "Solid build quality. Worth every penny.",
  "Arrived quickly and well-packaged. No complaints.",
  "Exactly as described. Highly recommend.",
  "Good value for money. Does exactly what it says.",
  "Super impressed with the quality.",
  "Love it! Use it every day.",
  "Best purchase I've made this year.",
  "Exceeded my expectations. Five stars.",
  "Perfect for my needs. Great product.",
  "Fast delivery, great product. Will order again.",
  "Really impressed. Better than expected.",
  "Top quality. Highly recommended.",
  "Works great. No issues.",
  "Excellent build quality. Very satisfied.",
  "Great product at a fair price.",
  "Exactly what I needed. Very pleased.",
  "Outstanding quality. Worth the investment.",
  "Fantastic! Highly recommend.",
  "Good product, fast shipping.",
  "Very satisfied with this purchase.",
  "Great addition to my collection.",
  "Perfect for everyday use.",
  "Quality is top-notch. Love it.",
  "Couldn't be happier with this.",
  "Solid product. Does the job well.",
  "Very good product. Recommended.",
  "Great experience overall.",
  "Impressed with the quality and design.",
  "Works exactly as advertised.",
  "Excellent customer service too.",
];

const BATCH = 200;

/* ───────────────────────────────────────────── */

function rand<T>(arr: readonly T[]): T {
  if (!arr.length) throw new Error("rand() empty array");
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function batchInsert(table: any, rows: any[]) {
  for (let i = 0; i < rows.length; i += BATCH) {
    await db.insert(table).values(rows.slice(i, i + BATCH));
  }
}

/* ───────────────────────────────────────────── */
/* CATEGORY MAPPING */

function getCategorySlug(tags: string[]): string {
    const t = new Set(tags);
  
    if (t.has("headphones") || t.has("earbuds") || t.has("speaker"))
      return "headphones-audio";
  
    if (t.has("laptop") || t.has("computer") || t.has("monitor") || t.has("keyboard") || t.has("mouse"))
      return "laptops-computers";
  
    if (t.has("smart") || t.has("alexa") || t.has("thermostat") || t.has("doorbell"))
      return "smart-home";
  
    if (t.has("sneakers") || t.has("shoes"))
      return "shoes-footwear";
  
    if (t.has("kitchen") || t.has("coffee") || t.has("blender") || t.has("cooking"))
      return "home-kitchen";
  
    if (t.has("fitness") || t.has("cycling") || t.has("running"))
      return "sports-outdoors";
  
    if (t.has("board-game") || t.has("card-game") || t.has("game"))
      return "toys-games";
  
    if (t.has("skincare") || t.has("serum") || t.has("cleanser") || t.has("moisturizer"))
      return "beauty-personal-care";
  
    if (t.has("backpack") || t.has("camping") || t.has("hiking"))
      return "sports-outdoors";
  
    if (t.has("jacket") || t.has("jeans") || t.has("hoodie"))
      return "mens-clothing";
  
    return "electronics";
  }

/* ───────────────────────────────────────────── */
/* USERS */

async function seedUsers() {
  const existing = (await db.select({ n: count() }).from(users))[0]?.n ?? 0;
  if (existing > 0) return;

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);
  const now = new Date();

  const userRows = [];
  const credRows = [];

  for (const u of SEED_USERS) {
    const id = randomUUID();

    userRows.push({
      id,
      slug: `${u.email.split("@")[0]}-${id.slice(0, 8)}`,
      email: u.email,
      role: u.role,
      name: u.name,
      locale: "en",
      createdAt: now,
      updatedAt: now,
      emailValidated: now,
    });

    credRows.push({
      providerId: "email_password",
      providerKey: u.email,
      userId: id,
      hasher: "bcrypt",
      passwordHash,
      passwordSalt: "",
    });
  }

  await batchInsert(users, userRows);
  await batchInsert(credentials, credRows);

  console.log("✓ users seeded");
}

/* ───────────────────────────────────────────── */
/* CATEGORIES */

async function seedCategories() {
  const existing = (await db.select({ n: count() }).from(categories))[0]?.n ?? 0;
  if (existing > 0) return;

  const now = new Date();

  const rows = CATEGORIES.map((c) => ({
    id: randomUUID(),
    parentCategoryId: null,
    slug: c.slug,
    name: c.name,
    description: c.description,
    tags: c.tags,
    createdAt: now,
    updatedAt: now,
  }));

  await batchInsert(categories, rows);

  console.log("✓ categories seeded");
}

/* ───────────────────────────────────────────── */
/* PRODUCTS */

async function seedProducts() {
  const existing = (await db.select({ n: count() }).from(products))[0]?.n ?? 0;
  if (existing > 0) return;

  const now = new Date();

  const categoryRows = await db.select().from(categories);
  const catMap = new Map(categoryRows.map((c) => [c.slug, c.id]));

  const rows = PRODUCTS.map((p) => {
    const slug = getCategorySlug(p.tags);
    const categoryId = catMap.get(slug);

    return {
      id: randomUUID(),
      categoryId,
      title: p.title,
      picture: p.picture,
      summary: p.summary,
      description: p.description,
      price: p.price,
      discountType: "none",
      discountValue: 0,
      tags: p.tags,
      createdAt: now,
      updatedAt: now,
    };
  });

  await batchInsert(products, rows);

  console.log("✓ products seeded");
}

/* ───────────────────────────────────────────── */
/* COMMERCE */

async function seedCommerce() {
  const userIds = (await db.select({ id: users.id }).from(users)).map(
    (u) => u.id
  );

  const productRows = await db
    .select({ id: products.id, price: products.price })
    .from(products);

  const productIds = productRows.map((p) => p.id);
  const priceMap = new Map(productRows.map((p) => [p.id, p.price]));

  const now = new Date();

  const cartRows = [];
  const cartItemRows = [];
  const orderRows = [];
  const orderLineRows = [];

  const cartStatus = ["active", "purchased"] as const;
  const orderStatus = ["pending", "delivered", "cancelled"] as const;

  for (let i = 0; i < 400; i++) {
    const userId = rand(userIds);
    const cartId = randomUUID();

    cartRows.push({
      id: cartId,
      createdBy: userId,
      status: rand(cartStatus),
      createdAt: now,
      updatedAt: now,
    });

    const shuffledProducts = [...productIds].sort(() => 0.5 - Math.random());
    const items = randInt(1, 5);

    for (let j = 0; j < items; j++) {
      const productId = shuffledProducts[j];
      const price = priceMap.get(productId!)!;

      cartItemRows.push({
        cartId,
        productId,
        price,
        quantity: randInt(1, 4),
        createdAt: now,
      });
    }

    if (Math.random() > 0.5) {
      const orderId = randomUUID();

      orderRows.push({
        id: orderId,
        userId,
        status: rand(orderStatus),
        createdAt: now,
        updatedAt: now,
      });

      const items = randInt(1, 4);

      for (let j = 0; j < items; j++) {
        const productId = rand(productIds);
        const price = priceMap.get(productId)!;
        const quantity = randInt(1, 3);

        orderLineRows.push({
          id: randomUUID(),
          orderId,
          productId,
          price: price * quantity,
          quantity: randInt(1, 3),
        });
      }
    }
  }

  await batchInsert(carts, cartRows);
  await batchInsert(cartItems, cartItemRows);
  await batchInsert(orders, orderRows);
  await batchInsert(orderLines, orderLineRows);

  console.log("✓ commerce seeded");

  return orderLineRows;
}

/* ───────────────────────────────────────────── */
/* REVIEWS */

async function seedReviews(orderLineRows: any[]) {
  const now = new Date();

  const userIds = (await db.select({ id: users.id }).from(users)).map(
    (u) => u.id
  );

  const rows = [];
  const seen = new Set<string>();

  for (const line of orderLineRows) {
    if (Math.random() > 0.4) continue;

    const userId = rand(userIds);
    const key = `${userId}:${line.productId}`;

    if (seen.has(key)) continue;

    seen.add(key);

    rows.push({
      id: randomUUID(),
      userId,
      productId: line.productId,
      rating: randInt(3, 5),
      comment: rand(REVIEW_COMMENTS),
      createdAt: now,
    });
  }

  await batchInsert(reviews, rows);

  console.log("✓ reviews seeded");
}

/* ───────────────────────────────────────────── */
/* RUN */

export async function runSeed() {
  console.time("seed");

  await seedUsers();
  await seedCategories();
  await seedProducts();

  const orderLines = await seedCommerce();

  await seedReviews(orderLines);

  console.timeEnd("seed");
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  runSeed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}