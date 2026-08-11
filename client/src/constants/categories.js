export const CATEGORY_MAP = {
  TOPS: [
    'T-shirt', 'Graphic Tee', 'Shirt', 'Button-down', 'Flannel Shirt', 'Sweater', 'Turtleneck',
    'Blouse', 'Tank Top', 'Camisole', 'Crop Top', 'Hoodie', 'Sweatshirt', 'Polo', 'Cardigan',
    'Henley', 'Bodysuit', 'Off-shoulder Top', 'Corset Top',
  ],
  BOTTOMS: [
    'Skinny Jeans', 'Straight-leg Jeans', 'Wide-leg Jeans', 'Boot-cut Jeans', 'Flare Jeans',
    'Mom Jeans', 'Bootleg Jeans', 'Trousers', 'Cargo Pants', 'Chinos', 'Culottes', 'Palazzo Pants',
    'Joggers', 'Sweatpants', 'Leggings', 'Bermuda Shorts', 'Denim Shorts', 'Cargo Shorts',
    'Bike Shorts', 'A-line Skirt', 'Pencil Skirt', 'Pleated Skirt', 'Mini Skirt', 'Maxi Skirt',
  ],
  OUTERWEAR: [
    'Denim Jacket', 'Bomber Jacket', 'Leather Jacket', 'Puffer Jacket', 'Coat', 'Trench Coat',
    'Overcoat', 'Parka', 'Blazer', 'Vest', 'Gilet', 'Windbreaker', 'Cape', 'Poncho',
  ],
  FOOTWEAR: [
    'Low-top Sneakers', 'High-top Sneakers', 'Running Shoes', 'Ankle Boots', 'Chelsea Boots',
    'Combat Boots', 'Knee-high Boots', 'Chukka Boots', 'Ballet Flats', 'Loafers', 'Mules',
    'Stiletto Heels', 'Block Heels', 'Wedge Heels', 'Platform Heels', 'Espadrilles', 'Sandals',
    'Slide Sandals', 'Flip-flops', 'Slippers', 'Oxfords', 'Derby Shoes', 'Boat Shoes',
  ],
  ACCESSORIES: [
    'Tote Bag', 'Crossbody Bag', 'Backpack', 'Clutch', 'Baseball Cap', 'Beanie', 'Sun Hat',
    'Scarf', 'Belt', 'Sunglasses', 'Gloves', 'Necklace', 'Earrings', 'Bracelet', 'Ring', 'Watch',
    'Tie', 'Hair Accessory',
  ],
  UNDERWEAR: ['Socks', 'Ankle Socks', 'Underwear', 'Bra', 'Undershirt', 'Shapewear', 'Activewear Set'],
  OTHER: ['Dress', 'Maxi Dress', 'Midi Dress', 'Sundress', 'Wrap Dress', 'Suit', 'Jumpsuit', 'Romper', 'Other'],
};

export const COLORS = [
  { value: 'BLACK', label: 'Black', hex: '#000000' },
  { value: 'WHITE', label: 'White', hex: '#FFFFFF', border: true },
  { value: 'GREY', label: 'Grey', hex: '#808080' },
  { value: 'BEIGE', label: 'Beige', hex: '#F5F5DC' },
  { value: 'BROWN', label: 'Brown', hex: '#A52A2A' },
  { value: 'NAVY', label: 'Navy', hex: '#000080' },
  { value: 'BLUE', label: 'Blue', hex: '#3B82F6' },
  { value: 'GREEN', label: 'Green', hex: '#10B981' },
  { value: 'RED', label: 'Red', hex: '#EF4444' },
  { value: 'YELLOW', label: 'Yellow', hex: '#F59E0B' },
  { value: 'PINK', label: 'Pink', hex: '#EC4899' },
  { value: 'PURPLE', label: 'Purple', hex: '#8B5CF6' },
  { value: 'ORANGE', label: 'Orange', hex: '#F97316' },
  { value: 'MULTICOLOR', label: 'Multicolor', gradient: 'linear-gradient(45deg, #EF4444, #3B82F6, #10B981, #F59E0B)' }
];

export const FABRICS = [
  { value: 'COTTON', label: 'Cotton' },
  { value: 'DENIM', label: 'Denim' },
  { value: 'LINEN', label: 'Linen' },
  { value: 'WOOL', label: 'Wool' },
  { value: 'SILK', label: 'Silk' },
  { value: 'LEATHER', label: 'Leather' },
  { value: 'SYNTHETIC', label: 'Synthetic' },
  { value: 'KNIT', label: 'Knit' },
  { value: 'VELVET', label: 'Velvet' },
  { value: 'OTHER', label: 'Other' }
];

export const PATTERNS = [
  { value: 'SOLID', label: 'Solid' },
  { value: 'STRIPED', label: 'Striped' },
  { value: 'CHECKED', label: 'Checked' },
  { value: 'FLORAL', label: 'Floral' },
  { value: 'PLAID', label: 'Plaid' },
  { value: 'GRAPHIC', label: 'Graphic/Printed' },
  { value: 'ANIMAL', label: 'Animal Print' },
  { value: 'DOTS', label: 'Polka Dots' },
  { value: 'CAMOUFLAGE', label: 'Camouflage' },
  { value: 'COLORBLOCK', label: 'Colorblock' },
  { value: 'GEOMETRIC', label: 'Geometric' },
  { value: 'TEXTURED', label: 'Textured/Knit' },
  { value: 'TIE_DYE', label: 'Tie-dye' },
  { value: 'OMBRE', label: 'Ombre/Gradient' },
  { value: 'METALLIC', label: 'Metallic' },
  { value: 'OTHER', label: 'Other' }
];

export const SEASONS = [
  { value: 'SPRING', label: 'Spring' },
  { value: 'SUMMER', label: 'Summer' },
  { value: 'AUTUMN', label: 'Autumn' },
  { value: 'WINTER', label: 'Winter' },
  { value: 'ALL_SEASON', label: 'All Season' }
];

export const OCCASIONS = [
  { value: 'CASUAL', label: 'Casual' },
  { value: 'FORMAL', label: 'Formal' },
  { value: 'BUSINESS', label: 'Business/Work' },
  { value: 'SPORT', label: 'Sport/Athletic' },
  { value: 'PARTY', label: 'Party/Night Out' },
  { value: 'LOUNGE', label: 'Lounge' }
];

export const LAUNDRY_STATUSES = [
  { value: 'AVAILABLE', label: 'Available (Clean)', colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-250/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' },
  { value: 'DIRTY', label: 'Dirty', colorClass: 'text-amber-600 bg-amber-50 border-amber-250/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' },
];

export const CATEGORY_LABELS = {
  TOPS: 'Topwear',
  BOTTOMS: 'Bottoms',
  OUTERWEAR: 'Outerwear',
  FOOTWEAR: 'Footwear',
  ACCESSORIES: 'Accessories',
  UNDERWEAR: 'Underwear',
  OTHER: 'Other/Dresses'
};

export const getSubcategoriesForGender = (category, gender) => {
  const list = CATEGORY_MAP[category] || [];
  if (!gender || typeof gender !== 'string') return list;

  const g = gender.toLowerCase();
  if (g === 'man') {
    // Exclude feminine items for men's style profile
    const exclusions = new Set([
      // Tops
      'Blouse', 'Camisole', 'Crop Top', 'Bodysuit', 'Off-shoulder Top', 'Corset Top',
      // Bottoms
      'A-line Skirt', 'Pencil Skirt', 'Pleated Skirt', 'Mini Skirt', 'Maxi Skirt', 'Culottes', 'Palazzo Pants',
      // Footwear
      'Ballet Flats', 'Stiletto Heels', 'Block Heels', 'Wedge Heels', 'Platform Heels', 'Mules',
      // Other
      'Dress', 'Maxi Dress', 'Midi Dress', 'Sundress', 'Wrap Dress', 'Romper'
    ]);
    return list.filter(item => !exclusions.has(item));
  }
  return list;
};
