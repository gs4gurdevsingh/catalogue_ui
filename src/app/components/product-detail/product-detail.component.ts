import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { SettingsService } from '../../services/settings.service';
import { Product } from '../../models/product.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  loading = false;
  error = '';
  currentImageIndex = 0;
  visibleRateSetting = 'All';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private settingsService: SettingsService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadProduct();
    this.loadSettings();
  }

  loadSettings(): void {
    this.settingsService.getSettings().subscribe({
      next: (response) => {
        if (response.success && response.data && response.data['VisibleRate']) {
          this.visibleRateSetting = response.data['VisibleRate'];
        }
      },
      error: (err) => console.error('Error loading settings in detail:', err)
    });
  }

  loadProduct(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (!productId) {
      this.router.navigate(['/products']);
      return;
    }

    this.loading = true;
    this.error = '';

    this.productService.getProduct(productId).subscribe({
      next: (response) => {
        this.product = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.error = 'Error loading product. Please try again.';
        this.loading = false;
      }
    });
  }

  getCategoryName(category: any): string {
    return typeof category === 'object' ? category.name : 'Unknown';
  }

  getProductImage(index: number = 0): string {
    if (!this.product || !this.product.images || this.product.images.length === 0) {
      return 'assets/placeholder-image.jpg';
    }
    return this.product.images[index] || this.product.images[0];
  }

  nextImage(): void {
    if (this.product && this.product.images && this.product.images.length > 1) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.product.images.length;
    }
  }

  previousImage(): void {
    if (this.product && this.product.images && this.product.images.length > 1) {
      this.currentImageIndex = this.currentImageIndex === 0 
        ? this.product.images.length - 1 
        : this.currentImageIndex - 1;
    }
  }

  getEmbedUrl(youtubeUrl: string): string {
    // Convert YouTube URL to embed URL
    const videoId = youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : youtubeUrl;
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  getProductUrl(): string {
    return window.location.href;
  }

  shareOnWhatsApp(): void {
    if (!this.product) return;
    const text = `Check out this product: ${this.product.name} - ${this.getProductUrl()}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.location.href = whatsappUrl;
  }

  shareOnFacebook(): void {
    if (!this.product) return;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.getProductUrl())}`;
    window.open(url, '_blank');
  }

  shareOnTwitter(): void {
    if (!this.product) return;
    const text = `Check out this product: ${this.product.name}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(this.getProductUrl())}`;
    window.open(url, '_blank');
  }

  copyLinkToClipboard(): void {
    navigator.clipboard.writeText(this.getProductUrl()).then(() => {
      this.snackBar.open('Product link copied to clipboard!', 'Close', { duration: 3000 });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      this.snackBar.open('Failed to copy link', 'Close', { duration: 3000 });
    });
  }
}
