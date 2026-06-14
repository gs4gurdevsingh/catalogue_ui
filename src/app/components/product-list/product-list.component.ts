import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { SettingsService } from '../../services/settings.service';
import { Product, Category } from '../../models/product.model';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  loading = false;
  error = '';
  visibleRateSetting = 'All';
  showAdvancedFilters = false;

  
  // Search and filter controls
  searchControl = new FormControl('');
  selectedCategory = new FormControl('');
  minPriceControl = new FormControl('');
  maxPriceControl = new FormControl('');
  sortByControl = new FormControl('createdAt');
  sortOrderControl = new FormControl('desc');
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 12;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private settingsService: SettingsService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    this.loadSettings();
    
    // Setup search with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadProducts();
      });

    // Setup other filter changes
    this.selectedCategory.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.loadProducts();
    });
  }

  loadSettings(): void {
    this.settingsService.getSettings().subscribe({
      next: (response) => {
        if (response.success && response.data && response.data['VisibleRate']) {
          this.visibleRateSetting = response.data['VisibleRate'];
        }
      },
      error: (err) => console.error('Error loading settings in list:', err)
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.data;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.error = '';

    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchControl.value || undefined,
      category: this.selectedCategory.value || undefined,
      minPrice: this.minPriceControl.value ? Number(this.minPriceControl.value) : undefined,
      maxPrice: this.maxPriceControl.value ? Number(this.maxPriceControl.value) : undefined,
      sortBy: this.sortByControl.value || 'createdAt',
      sortOrder: this.sortOrderControl.value || 'desc'
    };

    this.productService.getProducts(
      params.page,
      params.limit,
      params.search,
      params.category,
      params.minPrice,
      params.maxPrice,
      params.sortBy,
      params.sortOrder
    ).subscribe({
      next: (response) => {
        this.products = response.data;
        if (response.pagination) {
          this.currentPage = response.pagination.currentPage;
          this.totalPages = response.pagination.totalPages;
          this.totalItems = response.pagination.totalItems;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.error = 'Error loading products. Please try again.';
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadProducts();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  toggleSortOrder(): void {
    const currentOrder = this.sortOrderControl.value;
    this.sortOrderControl.setValue(currentOrder === 'asc' ? 'desc' : 'asc');
    this.onFilterChange();
  }

  shareProductWhatsApp(product: Product, event: Event): void {
    event.stopPropagation();
    const productUrl = `${window.location.origin}/#/products/${product._id}`;
    const text = `Check out this product: ${product.name} - ${productUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.selectedCategory.setValue('');
    this.minPriceControl.setValue('');
    this.maxPriceControl.setValue('');
    this.sortByControl.setValue('createdAt');
    this.sortOrderControl.setValue('desc');
    this.currentPage = 1;
    this.loadProducts();
  }

  getCategoryName(category: any): string {
    return typeof category === 'object' ? category.name : 'Unknown';
  }

  getProductImage(product: Product): string {
    return product.images && product.images.length > 0 
      ? product.images[0] 
      : 'assets/placeholder-image.jpg';
  }
}
