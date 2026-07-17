import * as wardrobeService from './service.js';
import { createClothingItemSchema, updateClothingItemSchema } from './validation.js';

const normalizedBody = (body) => {
  const occasionTags = body.occasionTags ?? body['occasionTags[]'];
  return {
    ...body,
    ...(occasionTags !== undefined ? { occasionTags: Array.isArray(occasionTags) ? occasionTags : [occasionTags] } : {}),
  };
};

export const createClothingItem = async (req, res, next) => {
  try {
    // Validate text inputs
    const validatedData = createClothingItemSchema.parse(normalizedBody(req.body));

    // Image URL is attached by uploadToCloudinary middleware
    if (!req.cloudinaryUrl) {
      const error = new Error('Clothing image file is required');
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const item = await wardrobeService.createItem(req.user.id, {
      ...validatedData,
      imageUrl: req.cloudinaryUrl,
    });

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const updateClothingItem = async (req, res, next) => {
  try {
    const validatedData = updateClothingItemSchema.parse(normalizedBody(req.body));
    const updateData = { ...validatedData };

    // Update image if a new one is uploaded
    if (req.cloudinaryUrl) {
      updateData.imageUrl = req.cloudinaryUrl;
    }

    const item = await wardrobeService.updateItem(req.params.id, req.user.id, updateData);

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClothingItem = async (req, res, next) => {
  try {
    await wardrobeService.deleteItem(req.params.id, req.user.id);
    res.json({
      success: true,
      data: { message: 'Clothing item deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};

export const getClothingItem = async (req, res, next) => {
  try {
    const item = await wardrobeService.getItemById(req.params.id, req.user.id);
    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const getWardrobe = async (req, res, next) => {
  try {
    const filters = {
      category: req.query.category,
      color: req.query.color,
      brand: req.query.brand,
      season: req.query.season,
      laundryStatus: req.query.laundryStatus,
      isFavorite: req.query.isFavorite,
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await wardrobeService.getItems(req.user.id, filters);

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};
