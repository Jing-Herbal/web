/* aura — shared product data for index.html and science.html.
   Doses: 01-Products/Aura/formulation.md (CMO spec RC2026057 V0D7). Change there first.
   Prices: set on the site 2026-09-28 at Tommy's instruction; see README (Prices). */
const PRICE = { single: 69, sub: 69, freeShipOver: 70, sticks: 30 }; // subscription discount: TBC

// Shopify checkout (Option A: this site plus Shopify's hosted checkout). Fill these in from
// Shopify admin once the store exists. While domain is empty, Checkout shows the draft notice.
//   domain:   the checkout address, e.g. 'shop.jingherbal.com' (or 'jing.myshopify.com')
//   variants: the variant ID for each plan, from Products > aura > the variant's URL
//   handle:   the product's URL handle, used by tools/check-price.py
//   sellingPlan: the subscription plan ID, once Shopify Subscriptions is set up
//   open:     false switches off Add to cart and Checkout site-wide (not on sale yet)
const SHOP = { domain: 'zymt0d-az.myshopify.com', handle: 'aura', variants: { single: '56071784792232', sub: '' }, sellingPlan: '', open: false };

// Herb descriptions: claims register rows 14-19 (accepted 2026-09-28).
const FORMULA = [
  { name: 'Tremella', zh: '銀耳', latin: 'Tremella fuciformis', mg: 2000, form: 'Whole milled fruiting body', c: '#4A2418', img: 'img/ing-tremella.jpg',
    text: 'Prized in the tradition for its water-holding polysaccharides. The heart of the blend, and 40% of every stick by weight.' },
  { name: 'Longan', zh: '龍眼', latin: 'Dimocarpus longan', mg: 1500, form: 'Whole milled fruit', c: '#6E3523', img: 'img/ing-longan.jpg',
    text: 'Prized in the tradition for its dried flesh, darkened and sweetened by its own sugars.' },
  { name: 'Goji', zh: '枸杞', latin: 'Lycium barbarum', mg: 500, form: 'Powder', c: '#8A4530', img: 'img/ing-goji.jpg',
    text: 'Prized in the tradition as the scarlet berry of the classical tonics, coloured by its own carotenoids.' },
  { name: 'Acerola', zh: '', latin: 'Malpighia emarginata', mg: 431.25, form: 'Juice powder', c: '#A3512F', claim: true, img: 'img/ing-acerola.jpg',
    text: 'A West Indian cherry, naturally a good source of vitamin C. 60 mg per stick, 133% of the recommended dietary intake.' },
  { name: 'Schisandra', zh: '五味子', latin: 'Schisandra chinensis', mg: 150, form: 'Powder', c: '#B55C37', img: 'img/ing-schisandra.jpg',
    text: 'Prized in the tradition as the five-flavour berry, its bitterness from its own lignans.' },
  { name: 'Astragalus', zh: '黃芪', latin: 'Astragalus membranaceus', mg: 11.4, form: 'Whole milled root', c: '#C46840', img: 'img/ing-astragalus.jpg',
    text: 'Traditionally used in tonics. A root that holds its own flavonoids and polysaccharides.' },
  { name: 'Excipients', zh: '', latin: 'Maltodextrin · silicon dioxide', mg: null, form: 'Carrier and flow agent', c: '#d9d5c8', excipient: true,
    text: 'Maltodextrin carries the powder; silicon dioxide keeps it flowing. Named, because they are in the stick too. Together they make up the balance to 5 g.' },
];

// Science page dossiers. Traditional use wording only (02-Research/evidence-standard.md);
// no botanical is linked to any effect on skin or the body. "inIt" names natural constituents
// in the claims register's accepted wording (rows 14-19): named, not quantified, never called
// "active". Register row 16 TBC applies: naming a biologically active substance may need a
// declared amount. See decisions.md, 2026-09-29.
const DOSSIER = {
  Tremella: { grade: 'D', what: 'A fungus, the fruiting body milled whole.', inIt: 'Polysaccharides.',
    noClaim: 'We make no claim for tremella. It is here for its place in the tradition.' },
  Longan: { grade: 'D', what: 'A fruit, milled whole. Dried longan is a pantry staple across southern China.', inIt: 'Its own natural sugars.',
    noClaim: 'We make no claim for longan. It is here for its place in the tradition.' },
  Goji: { grade: 'D', what: 'A berry, powdered.', inIt: 'Carotenoids, including zeaxanthin.',
    noClaim: 'We make no claim for goji. It is here for its place in the tradition.' },
  Acerola: { grade: 'A', what: 'A small cherry-like fruit, specified as a juice powder.', inIt: 'Vitamin C: 60 mg per stick.',
    noClaim: 'The claim belongs to the vitamin C it delivers, not to acerola itself.' },
  Schisandra: { grade: 'D', what: 'A berry, powdered.', inIt: 'Lignans known as schisandrins.',
    noClaim: 'We make no claim for schisandra. It is here for its place in the tradition.' },
  Astragalus: { grade: 'D', what: 'A root, milled whole.', inIt: 'Flavonoids and polysaccharides.',
    noClaim: 'We make no claim for astragalus. It is included at the level permitted for foods, for its place in the tradition.' },
};

window.AURA_DATA = { PRICE, SHOP, FORMULA, DOSSIER };
