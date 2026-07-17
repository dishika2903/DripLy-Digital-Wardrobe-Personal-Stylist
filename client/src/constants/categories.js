export const CATEGORY_MAP = {
  TOPS: ['T-shirt', 'Shirt', 'Sweater', 'Blouse', 'Tank Top', 'Hoodie', 'Polo', 'Cardigan'],
  BOTTOMS: ['Jeans', 'Trousers', 'Shorts', 'Skirt', 'Sweatpants', 'Leggings', 'Chinos'],
  OUTERWEAR: ['Jacket', 'Coat', 'Blazer', 'Trench Coat', 'Vest', 'Windbreaker'],
  FOOTWEAR: ['Sneakers', 'Boots', 'Flats', 'Heels', 'Loafers', 'Sandals', 'Slippers'],
  ACCESSORIES: ['Bag', 'Hat', 'Scarf', 'Belt', 'Sunglasses', 'Gloves', 'Jewelry', 'Watch'],
  UNDERWEAR: ['Socks', 'Underwear', 'Undershirt', 'Activewear'],
  OTHER: ['Dress', 'Suit', 'Jumpsuit', 'Other']
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
  { value: 'WASHING', label: 'Washing', colorClass: 'text-blue-600 bg-blue-50 border-blue-250/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30' },
  { value: 'IRONING', label: 'Ironing', colorClass: 'text-purple-600 bg-purple-50 border-purple-250/50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30' },
  { value: 'UNAVAILABLE', label: 'Unavailable', colorClass: 'text-rose-600 bg-rose-50 border-rose-250/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30' }
];
