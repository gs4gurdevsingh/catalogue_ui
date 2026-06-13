export interface Product {
  _id?: string;
  name: string;
  description: string;
  productRate: number;
  dealerRate: number;
  wholesaleRate: number;
  images: string[];
  youtubeLinks: string[];
  category: Category | string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  formattedProductRate?: string;
  formattedDealerRate?: string;
  formattedWholesaleRate?: string;
}

export interface Category {
  _id?: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductResponse {
  success: boolean;
  data: Product[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface CategoryResponse {
  success: boolean;
  data: Category[];
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  errors?: any[];
}
