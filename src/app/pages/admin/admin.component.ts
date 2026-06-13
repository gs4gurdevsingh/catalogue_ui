import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { SettingsService } from '../../services/settings.service';
import { UploadService } from '../../services/upload.service';
import { Product, Category } from '../../models/product.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  adminCategories: Category[] = [];
  loading = false;
  loadingCategories = false;
  activeTab: 'products' | 'categories' | 'settings' = 'products';
  
  // Settings
  visibleRateSetting = 'All';
  settingsSaving = false;

  // Modals
  showProductModal = false;
  isEditing = false;
  productForm!: FormGroup;
  submittingProduct = false;

  showCategoryModal = false;
  isEditingCategory = false;
  categoryForm!: FormGroup;
  submittingCategory = false;

  // Upload and Previews
  uploadedImages: string[] = [];
  uploadingFile = false;
  pastedImageUrl = '';

  uploadedCategoryImage = '';
  pastedCategoryImageUrl = '';
  uploadingCategoryImage = false;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private settingsService: SettingsService,
    private uploadService: UploadService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadProducts();
    this.loadCategories();
    this.loadAdminCategories();
    this.loadSettings();
  }

  initForm(): void {
    this.productForm = this.fb.group({
      id: [''],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(1000)]],
      productRate: [0, [Validators.required, Validators.min(0)]],
      dealerRate: [0, [Validators.required, Validators.min(0)]],
      wholesaleRate: [0, [Validators.required, Validators.min(0)]],
      images: [''],
      youtubeLinks: [''],
      category: ['', Validators.required],
      isActive: [true]
    });

    this.categoryForm = this.fb.group({
      id: [''],
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
      image: [''],
      isActive: [true]
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getAdminProducts().subscribe({
      next: (response) => {
        this.products = response.data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading products for admin:', err);
        this.snackBar.open('Error loading products', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.data;
      },
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  loadSettings(): void {
    this.settingsService.getSettings().subscribe({
      next: (response) => {
        if (response.success && response.data && response.data['VisibleRate']) {
          this.visibleRateSetting = response.data['VisibleRate'];
        }
      },
      error: (err) => console.error('Error loading settings:', err)
    });
  }

  saveSettings(): void {
    this.settingsSaving = true;
    this.settingsService.updateSetting('VisibleRate', this.visibleRateSetting).subscribe({
      next: (response) => {
        this.settingsSaving = false;
        this.snackBar.open('Visibility settings updated successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error saving settings:', err);
        this.snackBar.open('Error saving settings', 'Close', { duration: 3000 });
        this.settingsSaving = false;
      }
    });
  }

  openAddModal(): void {
    this.isEditing = false;
    this.uploadedImages = [];
    this.pastedImageUrl = '';
    this.productForm.reset({
      id: '',
      name: '',
      description: '',
      productRate: 0,
      dealerRate: 0,
      wholesaleRate: 0,
      images: '',
      youtubeLinks: '',
      category: '',
      isActive: true
    });
    this.showProductModal = true;
  }

  openEditModal(product: Product): void {
    this.isEditing = true;
    this.uploadedImages = product.images || [];
    this.pastedImageUrl = '';
    
    // Map array values to comma separated strings
    const imagesStr = this.uploadedImages.join(', ');
    const youtubeStr = product.youtubeLinks ? product.youtubeLinks.join(', ') : '';
    const categoryId = typeof product.category === 'object' ? product.category._id : product.category;

    this.productForm.patchValue({
      id: product._id,
      name: product.name,
      description: product.description,
      productRate: product.productRate,
      dealerRate: product.dealerRate,
      wholesaleRate: product.wholesaleRate,
      images: imagesStr,
      youtubeLinks: youtubeStr,
      category: categoryId,
      isActive: product.isActive
    });
    this.showProductModal = true;
  }

  closeModal(): void {
    this.showProductModal = false;
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadingFile = true;
      this.uploadService.uploadImage(file).subscribe({
        next: (res) => {
          this.uploadedImages.push(res.url);
          this.syncImagesToForm();
          this.uploadingFile = false;
          this.snackBar.open('Image uploaded successfully', 'Close', { duration: 2000 });
        },
        error: (err) => {
          console.error('Error uploading image:', err);
          this.snackBar.open(err.error?.message || 'Error uploading image', 'Close', { duration: 3000 });
          this.uploadingFile = false;
        }
      });
    }
  }

  addImageUrl(): void {
    const url = this.pastedImageUrl.trim();
    if (url.length > 0) {
      this.uploadedImages.push(url);
      this.syncImagesToForm();
      this.pastedImageUrl = '';
      this.snackBar.open('Image URL added', 'Close', { duration: 2000 });
    }
  }

  removeImage(index: number): void {
    this.uploadedImages.splice(index, 1);
    this.syncImagesToForm();
  }

  syncImagesToForm(): void {
    this.productForm.patchValue({
      images: this.uploadedImages.join(', ')
    });
  }

  submitProductForm(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.submittingProduct = true;
    const formVal = this.productForm.value;

    const youtubeArray = formVal.youtubeLinks 
      ? formVal.youtubeLinks.split(',').map((x: string) => x.trim()).filter((x: string) => x.length > 0)
      : [];

    const productPayload: Product = {
      name: formVal.name,
      description: formVal.description,
      productRate: formVal.productRate,
      dealerRate: formVal.dealerRate,
      wholesaleRate: formVal.wholesaleRate,
      images: this.uploadedImages,
      youtubeLinks: youtubeArray,
      category: formVal.category,
      isActive: formVal.isActive
    };

    if (this.isEditing) {
      this.productService.updateProduct(formVal.id, productPayload).subscribe({
        next: () => {
          this.submittingProduct = false;
          this.showProductModal = false;
          this.loadProducts();
          this.snackBar.open('Product updated successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error updating product:', err);
          this.snackBar.open(err.error?.message || 'Error updating product', 'Close', { duration: 3000 });
          this.submittingProduct = false;
        }
      });
    } else {
      this.productService.createProduct(productPayload).subscribe({
        next: () => {
          this.submittingProduct = false;
          this.showProductModal = false;
          this.loadProducts();
          this.snackBar.open('Product created successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error creating product:', err);
          this.snackBar.open(err.error?.message || 'Error creating product', 'Close', { duration: 3000 });
          this.submittingProduct = false;
        }
      });
    }
  }

  toggleProductStatus(product: Product): void {
    if (!product._id) return;
    
    // Toggle state
    const newStatus = !product.isActive;
    const categoryId = typeof product.category === 'object' ? product.category._id : product.category;

    const productPayload: Product = {
      name: product.name,
      description: product.description,
      productRate: product.productRate,
      dealerRate: product.dealerRate,
      wholesaleRate: product.wholesaleRate,
      images: product.images,
      youtubeLinks: product.youtubeLinks,
      category: categoryId || '',
      isActive: newStatus
    };

    this.productService.updateProduct(product._id, productPayload).subscribe({
      next: () => {
        product.isActive = newStatus;
        this.snackBar.open(`Product ${newStatus ? 'activated' : 'deactivated'} successfully`, 'Close', { duration: 2000 });
      },
      error: (err) => {
        console.error('Error toggling product status:', err);
        this.snackBar.open('Error toggling product status', 'Close', { duration: 3000 });
      }
    });
  }

  deleteProduct(productId: string | undefined): void {
    if (!productId || !confirm('Are you sure you want to delete this product?')) return;

    this.productService.deleteProduct(productId).subscribe({
      next: () => {
        this.loadProducts();
        this.snackBar.open('Product deleted successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error deleting product:', err);
        this.snackBar.open('Error deleting product', 'Close', { duration: 3000 });
      }
    });
  }

  getCategoryName(category: any): string {
    return typeof category === 'object' ? category.name : 'Unknown';
  }

  getProductImage(product: Product): string {
    return product.images && product.images.length > 0 
      ? product.images[0] 
      : 'assets/placeholder-image.jpg';
  }

  loadAdminCategories(): void {
    this.loadingCategories = true;
    this.categoryService.getAdminCategories().subscribe({
      next: (response) => {
        this.adminCategories = response.data;
        this.loadingCategories = false;
      },
      error: (err) => {
        console.error('Error loading admin categories:', err);
        this.snackBar.open('Error loading categories', 'Close', { duration: 3000 });
        this.loadingCategories = false;
      }
    });
  }

  openCategoryAddModal(): void {
    this.isEditingCategory = false;
    this.uploadedCategoryImage = '';
    this.pastedCategoryImageUrl = '';
    this.categoryForm.reset({
      id: '',
      name: '',
      description: '',
      image: '',
      isActive: true
    });
    this.showCategoryModal = true;
  }

  openCategoryEditModal(category: Category): void {
    this.isEditingCategory = true;
    this.uploadedCategoryImage = category.image || '';
    this.pastedCategoryImageUrl = '';
    this.categoryForm.patchValue({
      id: category._id,
      name: category.name,
      description: category.description,
      image: category.image || '',
      isActive: category.isActive
    });
    this.showCategoryModal = true;
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
  }

  onCategoryImageSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadingCategoryImage = true;
      this.uploadService.uploadImage(file).subscribe({
        next: (res) => {
          this.uploadedCategoryImage = res.url;
          this.categoryForm.patchValue({ image: res.url });
          this.uploadingCategoryImage = false;
          this.snackBar.open('Category image uploaded successfully', 'Close', { duration: 2000 });
        },
        error: (err) => {
          console.error('Error uploading category image:', err);
          this.snackBar.open(err.error?.message || 'Error uploading image', 'Close', { duration: 3000 });
          this.uploadingCategoryImage = false;
        }
      });
    }
  }

  addCategoryImageUrl(): void {
    const url = this.pastedCategoryImageUrl.trim();
    if (url.length > 0) {
      this.uploadedCategoryImage = url;
      this.categoryForm.patchValue({ image: url });
      this.pastedCategoryImageUrl = '';
      this.snackBar.open('Category image URL added', 'Close', { duration: 2000 });
    }
  }

  removeCategoryImage(): void {
    this.uploadedCategoryImage = '';
    this.categoryForm.patchValue({ image: '' });
  }

  submitCategoryForm(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.submittingCategory = true;
    const formVal = this.categoryForm.value;

    const categoryPayload: Category = {
      name: formVal.name,
      description: formVal.description,
      image: this.uploadedCategoryImage,
      isActive: formVal.isActive
    };

    if (this.isEditingCategory) {
      this.categoryService.updateCategory(formVal.id, categoryPayload).subscribe({
        next: () => {
          this.submittingCategory = false;
          this.showCategoryModal = false;
          this.loadAdminCategories();
          this.loadCategories(); // Reload dropdown active categories list
          this.snackBar.open('Category updated successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error updating category:', err);
          this.snackBar.open(err.error?.message || 'Error updating category', 'Close', { duration: 3000 });
          this.submittingCategory = false;
        }
      });
    } else {
      this.categoryService.createCategory(categoryPayload).subscribe({
        next: () => {
          this.submittingCategory = false;
          this.showCategoryModal = false;
          this.loadAdminCategories();
          this.loadCategories(); // Reload dropdown active categories list
          this.snackBar.open('Category created successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error creating category:', err);
          this.snackBar.open(err.error?.message || 'Error creating category', 'Close', { duration: 3000 });
          this.submittingCategory = false;
        }
      });
    }
  }

  toggleCategoryStatus(category: Category): void {
    if (!category._id) return;

    const newStatus = !category.isActive;
    const categoryPayload: Category = {
      name: category.name,
      description: category.description,
      image: category.image,
      isActive: newStatus
    };

    this.categoryService.updateCategory(category._id, categoryPayload).subscribe({
      next: () => {
        category.isActive = newStatus;
        this.loadCategories(); // Reload dropdown active categories list
        this.snackBar.open(`Category ${newStatus ? 'activated' : 'deactivated'} successfully`, 'Close', { duration: 2000 });
      },
      error: (err) => {
        console.error('Error toggling category status:', err);
        this.snackBar.open('Error toggling category status', 'Close', { duration: 3000 });
      }
    });
  }

  deleteCategory(categoryId: string | undefined): void {
    if (!categoryId || !confirm('Are you sure you want to delete this category? (This will soft-delete the category)')) return;

    this.categoryService.deleteCategory(categoryId).subscribe({
      next: () => {
        this.loadAdminCategories();
        this.loadCategories(); // Reload dropdown active categories list
        this.snackBar.open('Category deleted successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error deleting category:', err);
        this.snackBar.open('Error deleting category', 'Close', { duration: 3000 });
      }
    });
  }
}
