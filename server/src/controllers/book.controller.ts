import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Book, { IBook } from '../models/Book';

/**
 * @desc    Obtener catálogo de libros con filtros (búsqueda, categoría, precio, ordenamiento)
 * @route   GET /api/books
 * @access  Public
 */
export const getBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, keyword, category, minPrice, maxPrice, sort } = req.query;

    const query: any = {};

    // 1. Búsqueda por coincidencia parcial insensible a mayúsculas en title o author
    const searchTerm = (search || keyword) as string;
    if (searchTerm && searchTerm.trim() !== '') {
      query.$or = [
        { title: { $regex: searchTerm.trim(), $options: 'i' } },
        { author: { $regex: searchTerm.trim(), $options: 'i' } }
      ];
    }

    // 2. Filtro por categoría exacta (si no es 'ALL' ni 'all')
    if (category && category !== 'ALL' && category !== 'all') {
      query.category = { $regex: new RegExp(`^${(category as string).trim()}$`, 'i') };
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
    let sortOptions: any = { createdAt: -1 }; // Por defecto 'newest'
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

/**
 * @desc    Obtener un libro por ID (sin digitalFile)
 * @route   GET /api/books/:id
 * @access  Public
 */
export const getBookById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({
        success: false,
        message: 'Libro no encontrado.'
      });
      return;
    }

    const book = await Book.findById(id);
    if (!book) {
      res.status(404).json({
        success: false,
        message: 'Libro no encontrado.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear un nuevo libro electrónico
 * @route   POST /api/books
 * @access  Private/Admin
 */
export const createBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, author, category, description, price, stock, coverImage, digitalFile } = req.body;

    // Validación de campos obligatorios
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
      res.status(400).json({
        success: false,
        message:
          'Todos los campos son obligatorios: title, author, category, description, price, stock, coverImage, digitalFile.'
      });
      return;
    }

    if (Number(price) < 0 || Number(stock) < 0) {
      res.status(400).json({
        success: false,
        message: 'El precio y el stock deben ser números mayores o iguales a 0.'
      });
      return;
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

    res.status(201).json({
      success: true,
      data: newBook
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar libro y recalcular availability
 * @route   PUT /api/books/:id
 * @access  Private/Admin
 */
export const updateBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({
        success: false,
        message: 'Libro no encontrado.'
      });
      return;
    }

    const updates = { ...req.body };

    // Recalcular disponibilidad si se actualiza el stock
    if (updates.stock !== undefined) {
      const numericStock = Number(updates.stock);
      if (numericStock < 0) {
        res.status(400).json({
          success: false,
          message: 'El stock no puede ser negativo.'
        });
        return;
      }
      updates.stock = numericStock;
      updates.availability = numericStock > 0;
    }

    if (updates.price !== undefined) {
      const numericPrice = Number(updates.price);
      if (numericPrice < 0) {
        res.status(400).json({
          success: false,
          message: 'El precio no puede ser negativo.'
        });
        return;
      }
      updates.price = numericPrice;
    }

    const updatedBook = await Book.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!updatedBook) {
      res.status(404).json({
        success: false,
        message: 'Libro no encontrado.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedBook
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar un libro
 * @route   DELETE /api/books/:id
 * @access  Private/Admin
 */
export const deleteBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({
        success: false,
        message: 'Libro no encontrado.'
      });
      return;
    }

    const deletedBook = await Book.findByIdAndDelete(id);
    if (!deletedBook) {
      res.status(404).json({
        success: false,
        message: 'Libro no encontrado.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Libro eliminado exitosamente.'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};
