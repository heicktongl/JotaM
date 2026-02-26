export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    created_at: string;
                    email: string;
                    name: string;
                    avatar_url: string | null;
                    role: 'consumer' | 'seller' | 'delivery' | 'admin';
                    phone: string | null;
                };
                Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>;
                Update: Partial<Database['public']['Tables']['users']['Insert']>;
            };
            user_addresses: {
                Row: {
                    id: string;
                    user_id: string;
                    label: string;
                    street: string;
                    neighborhood: string;
                    city: string;
                    zip_code: string | null;
                    is_default: boolean;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['user_addresses']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['user_addresses']['Insert']>;
            };
            categories: {
                Row: {
                    id: string;
                    name: string;
                    icon: string | null;
                    type: 'product' | 'service';
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['categories']['Insert']>;
            };
            sellers: {
                Row: {
                    id: string;
                    user_id: string;
                    store_name: string;
                    username: string;
                    bio: string | null;
                    avatar_url: string | null;
                    cover_url: string | null;
                    theme_color: string | null;
                    whatsapp: string | null;
                    instagram: string | null;
                    is_verified: boolean;
                    pinned_product_id: string | null;
                    views: number;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['sellers']['Row'], 'id' | 'created_at' | 'views'>;
                Update: Partial<Database['public']['Tables']['sellers']['Insert']>;
            };
            products: {
                Row: {
                    id: string;
                    seller_id: string;
                    category_id: string | null;
                    name: string;
                    description: string | null;
                    price: number;
                    image_url: string | null;
                    stock: number;
                    is_active: boolean;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['products']['Insert']>;
            };
            services: {
                Row: {
                    id: string;
                    provider_id: string;
                    category_id: string | null;
                    name: string;
                    description: string | null;
                    price: number;
                    duration_minutes: number;
                    image_url: string | null;
                    is_active: boolean;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['services']['Insert']>;
            };
            service_providers: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    bio: string | null;
                    avatar_url: string | null;
                    rating: number;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['service_providers']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['service_providers']['Insert']>;
            };
            service_availability: {
                Row: {
                    id: string;
                    provider_id: string;
                    day_of_week: number; // 0=Dom ... 6=Sab
                    start_time: string; // HH:MM
                    end_time: string;   // HH:MM
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['service_availability']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['service_availability']['Insert']>;
            };
            reviews: {
                Row: {
                    id: string;
                    user_id: string;
                    target_id: string; // product_id ou service_id
                    target_type: 'product' | 'service';
                    rating: number;
                    comment: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
            };
            followers: {
                Row: {
                    id: string;
                    follower_id: string;
                    seller_id: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['followers']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['followers']['Insert']>;
            };
            neighborhoods: {
                Row: {
                    id: string;
                    name: string;
                    city: string;
                    is_active: boolean;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['neighborhoods']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['neighborhoods']['Insert']>;
            };
            delivery_profiles: {
                Row: {
                    id: string;
                    user_id: string;
                    vehicle_type: string;
                    rating: number;
                    daily_goal: number;
                    is_online: boolean;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['delivery_profiles']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['delivery_profiles']['Insert']>;
            };
            earnings: {
                Row: {
                    id: string;
                    delivery_profile_id: string;
                    amount: number;
                    date: string; // ISO date
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['earnings']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['earnings']['Insert']>;
            };
            deliveries: {
                Row: {
                    id: string;
                    order_id: string;
                    delivery_profile_id: string;
                    status: 'collecting' | 'on_the_way' | 'delivered' | 'cancelled';
                    started_at: string | null;
                    delivered_at: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['deliveries']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['deliveries']['Insert']>;
            };
            delivery_areas: {
                Row: {
                    id: string;
                    delivery_profile_id: string;
                    area_type: 'city' | 'condo' | 'neighborhoods';
                    neighborhood_ids: string[] | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['delivery_areas']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['delivery_areas']['Insert']>;
            };
            orders: {
                Row: {
                    id: string;
                    consumer_id: string;
                    seller_id: string;
                    delivery_profile_id: string | null;
                    status: 'pending' | 'confirmed' | 'preparing' | 'collecting' | 'on_the_way' | 'delivered' | 'cancelled';
                    total: number;
                    address_id: string | null;
                    payment_method: 'pix' | 'card' | 'cash';
                    notes: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['orders']['Insert']>;
            };
            order_items: {
                Row: {
                    id: string;
                    order_id: string;
                    product_id: string | null;
                    service_id: string | null;
                    quantity: number;
                    unit_price: number;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
            };
            payments: {
                Row: {
                    id: string;
                    order_id: string;
                    method: 'pix' | 'card' | 'cash';
                    status: 'pending' | 'paid' | 'failed' | 'refunded';
                    amount: number;
                    pix_code: string | null;
                    paid_at: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['payments']['Insert']>;
            };
            appointments: {
                Row: {
                    id: string;
                    consumer_id: string;
                    provider_id: string;
                    service_id: string;
                    scheduled_at: string;
                    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
                    notes: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['appointments']['Insert']>;
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
    };
}
