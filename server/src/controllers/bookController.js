const mongoose = require('mongoose');
const Book = require('../models/Book');

// @desc    Obtener catálogo con búsqueda, filtros y paginación
// @route   GET /api/books
// @access  Public
const getBooks = async (req, res, next) => {
  try {
    const { search, keyword, category, minPrice, maxPrice, sort } = req.query;

    const query = {};

    // 1. Búsqueda por coincidencia parcial insensible a mayúsculas en title o author
    const searchTerm = search || keyword;
    if (searchTerm && searchTerm.trim() !== '') {
      query.$or = [
        { title: { $regex: searchTerm.trim(), $options: 'i' } },
        { author: { $regex: searchTerm.trim(), $options: 'i' } }
      ];
    }

    // 2. Filtro por categoría exacta (si no es 'ALL' ni 'all')
    if (category && category !== 'ALL' && category !== 'all') {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    // 3. Filtro por rango de precio (minPrice, maxPrice)
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== '') {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        query.price.$lte = Number(maxPrice);
      }
    }

    // 4. Ordenamiento
    let sortOptions = { createdAt: -1 }; // Por defecto 'newest'
    if (sort === 'price_asc') {
      sortOptions = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOptions = { price: -1 };
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    }

    const [books, availableCategories] = await Promise.all([
      Book.find(query).sort(sortOptions),
      Book.distinct('category')
    ]);

    res.status(200).json({
      success: true,
      count: books.length,
      categories: availableCategories,
      data: books
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener lista de categorías únicas disponibles
// @route   GET /api/books/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Book.distinct('category');
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener un libro por ID (sin digitalFile)
// @route   GET /api/books/:id
// @access  Public
const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Libro no encontrado.'
      });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Libro no encontrado.'
      });
    }

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear un libro
// @route   POST /api/books
// @access  Private/Admin
const createBook = async (req, res, next) => {
  try {
    const { title, author, category, description, price, stock, coverImage, digitalFile } = req.body;

    if (
      !title ||
      !author ||
      !category ||
      !description ||
      price === undefined ||
      stock === undefined ||
      !coverImage ||
      !digitalFile
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Todos los campos son obligatorios: title, author, category, description, price, stock, coverImage, digitalFile.'
      });
    }

    if (Number(price) < 0 || Number(stock) < 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio y el stock deben ser números mayores o iguales a 0.'
      });
    }

    const newBook = await Book.create({
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      description: description.trim(),
      price: Number(price),
      stock: Number(stock),
      coverImage: coverImage.trim(),
      digitalFile: digitalFile.trim(),
      availability: Number(stock) > 0
    });

    try {
      const { getIO } = require('../socket/socket');
      getIO().emit('catalog-updated', { action: 'create', bookId: newBook._id.toString() });
    } catch (e) {}

    res.status(201).json({
      success: true,
      data: newBook
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar libro y stock
// @route   PUT /api/books/:id
// @access  Private/Admin
const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Libro no encontrado.'
      });
    }

    const updates = { ...req.body };

    if (updates.stock !== undefined) {
      const numericStock = Number(updates.stock);
      if (numericStock < 0) {
        return res.status(400).json({
          success: false,
          message: 'El stock no puede ser negativo.'
        });
      }
      updates.stock = numericStock;
      updates.availability = numericStock > 0;
    }

    if (updates.price !== undefined) {
      const numericPrice = Number(updates.price);
      if (numericPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'El precio no puede ser negativo.'
        });
      }
      updates.price = numericPrice;
    }

    const updatedBook = await Book.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!updatedBook) {
      return res.status(404).json({
        success: false,
        message: 'Libro no encontrado.'
      });
    }

    try {
      const { getIO } = require('../socket/socket');
      getIO().emit('catalog-updated', { action: 'update', bookId: updatedBook._id.toString() });
    } catch (e) {}

    res.status(200).json({
      success: true,
      data: updatedBook
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar libro
// @route   DELETE /api/books/:id
// @access  Private/Admin
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Libro no encontrado.'
      });
    }

    const deletedBook = await Book.findByIdAndDelete(id);
    if (!deletedBook) {
      return res.status(404).json({
        success: false,
        message: 'Libro no encontrado.'
      });
    }

    try {
      const { getIO } = require('../socket/socket');
      getIO().emit('catalog-updated', { action: 'delete', bookId: id });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Libro eliminado exitosamente.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBooks,
  getCategories,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};
