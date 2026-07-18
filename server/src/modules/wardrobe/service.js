import prisma from '../../config/db.js';

/**
 * Creates a new clothing item entity for a user.
 * @param {String} userId - Owner ID
 * @param {Object} data - Form data fields
 * @returns {Object} created item
 */
export const createItem = async (userId, data) => {
  return await prisma.clothingItem.create({
    data: {
      ...data,
      userId,
    },
  });
};

/**
 * Updates a clothing item. Validates ownership first.
 * @param {String} itemId - Item ID
 * @param {String} userId - User ID requesting update
 * @param {Object} data - Update payload
 * @returns {Object} updated item
 */
export const updateItem = async (itemId, userId, data) => {
  // Ensure the item exists and belongs to the user
  const item = await prisma.clothingItem.findFirst({
    where: { id: itemId, userId },
  });

  if (!item) {
    const error = new Error('Clothing item not found or unauthorized');
    error.status = 404;
    error.code = 'RECORD_NOT_FOUND';
    throw error;
  }

  return await prisma.clothingItem.update({
    where: { id: itemId },
    data,
  });
};

/**
 * Deletes a clothing item. Validates ownership first.
 * @param {String} itemId - Item ID
 * @param {String} userId - User ID
 */
export const deleteItem = async (itemId, userId) => {
  const item = await prisma.clothingItem.findFirst({
    where: { id: itemId, userId },
  });

  if (!item) {
    const error = new Error('Clothing item not found or unauthorized');
    error.status = 404;
    error.code = 'RECORD_NOT_FOUND';
    throw error;
  }

  return await prisma.clothingItem.delete({
    where: { id: itemId },
  });
};

/**
 * Fetches a single clothing item with ownership check.
 * @param {String} itemId - Item ID
 * @param {String} userId - User ID
 */
export const getItemById = async (itemId, userId) => {
  const item = await prisma.clothingItem.findFirst({
    where: { id: itemId, userId },
  });

  if (!item) {
    const error = new Error('Clothing item not found or unauthorized');
    error.status = 404;
    error.code = 'RECORD_NOT_FOUND';
    throw error;
  }

  return item;
};

/**
 * Fetches paginated, filtered clothing items list.
 * @param {String} userId - User ID
 * @param {Object} filters - Query filter properties
 */
export const getItems = async (userId, filters = {}) => {
  const {
    category,
    color,
    brand,
    season,
    occasion,
    laundryStatus,
    isFavorite,
    search,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = filters;

  const parsedPage = Math.max(1, parseInt(page, 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (parsedPage - 1) * parsedLimit;

  // Build prisma filter clauses dynamically
  const where = {
    userId,
  };

  if (category) where.category = category;
  if (color) where.color = color;
  if (season) where.season = season;
  if (occasion) where.occasionTags = { has: occasion };
  if (laundryStatus) where.laundryStatus = laundryStatus;
  
  if (brand) {
    where.brand = {
      contains: brand,
      mode: 'insensitive',
    };
  }

  if (search) {
    where.OR = [
      { subcategory: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (isFavorite !== undefined) {
    where.isFavorite = isFavorite === 'true' || isFavorite === true;
  }

  const orderBy = {
    newest: { createdAt: 'desc' },
    oldest: { createdAt: 'asc' },
    'name-asc': { subcategory: 'asc' },
    'name-desc': { subcategory: 'desc' },
  }[sort];

  // Run total count and item fetch concurrently
  const [items, total] = await Promise.all([
    prisma.clothingItem.findMany({
      where,
      skip,
      take: parsedLimit,
      orderBy,
    }),
    prisma.clothingItem.count({ where }),
  ]);

  return {
    items,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};
export default { createItem, updateItem, deleteItem, getItemById, getItems };
