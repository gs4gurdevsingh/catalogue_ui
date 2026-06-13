import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { SettingsService } from '../../services/settings.service';
import { Product, Category } from '../../models/product.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  featuredProducts: Product[] = [];
  categories: Category[] = [];
  loading = false;
  visibleRateSetting = 'All';

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private settingsService: SettingsService
  ) { }

  ngOnInit(): void {
    this.loadFeaturedProducts();
    this.loadCategories();
    this.loadSettings();
  }

  loadSettings(): void {
    this.settingsService.getSettings().subscribe({
      next: (response) => {
        if (response.success && response.data && response.data['VisibleRate']) {
          this.visibleRateSetting = response.data['VisibleRate'];
        }
      },
      error: (err) => console.error('Error loading settings on home:', err)
    });
  }

  loadFeaturedProducts(): void {
    this.loading = true;
    this.productService.getProducts(1, 6).subscribe({
      next: (response) => {
        this.featuredProducts = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading featured products:', error);
        this.loading = false;
      }
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

  getProductImage(product: Product): string {
    return product.images && product.images.length > 0 
      ? product.images[0] 
      : 'assets/placeholder-image.jpg';
  }
}
