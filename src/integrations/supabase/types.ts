export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          reward_points: number
          target_value: number
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          reward_points?: number
          target_value?: number
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          reward_points?: number
          target_value?: number
          title?: string
        }
        Relationships: []
      }
      home_banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          order_index: number
          show_frequency: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          order_index?: number
          show_frequency?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          order_index?: number
          show_frequency?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      live_locations: {
        Row: {
          id: string
          is_broadcasting: boolean
          latitude: number
          longitude: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          is_broadcasting?: boolean
          latitude: number
          longitude: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          is_broadcasting?: boolean
          latitude?: number
          longitude?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      market_banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean
          price: number
          stock_quantity: number | null
          subcategory: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean
          price?: number
          stock_quantity?: number | null
          subcategory?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean
          price?: number
          stock_quantity?: number | null
          subcategory?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          achievements_notifications: boolean | null
          comments_notifications: boolean
          created_at: string
          id: string
          likes_notifications: boolean
          system_notifications: boolean
          updated_at: string
          user_id: string
          winners_notifications: boolean
        }
        Insert: {
          achievements_notifications?: boolean | null
          comments_notifications?: boolean
          created_at?: string
          id?: string
          likes_notifications?: boolean
          system_notifications?: boolean
          updated_at?: string
          user_id: string
          winners_notifications?: boolean
        }
        Update: {
          achievements_notifications?: boolean | null
          comments_notifications?: boolean
          created_at?: string
          id?: string
          likes_notifications?: boolean
          system_notifications?: boolean
          updated_at?: string
          user_id?: string
          winners_notifications?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fk_notification_settings_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_stars: number
          created_at: string | null
          id: string
          processed_at: string | null
          status: string
          subscription_id: string | null
          telegram_invoice_payload: string
          telegram_payment_charge_id: string
          user_id: string
        }
        Insert: {
          amount_stars: number
          created_at?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          subscription_id?: string | null
          telegram_invoice_payload: string
          telegram_payment_charge_id: string
          user_id: string
        }
        Update: {
          amount_stars?: number
          created_at?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          subscription_id?: string | null
          telegram_invoice_payload?: string
          telegram_payment_charge_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      points_history: {
        Row: {
          created_at: string
          description: string
          id: string
          operation_type: string
          points_change: number
          reference_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          operation_type: string
          points_change: number
          reference_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          operation_type?: string
          points_change?: number
          reference_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          media_urls: string[] | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string
          id: string
          likes_count: number | null
          media_urls: string[] | null
          route_id: string | null
          spot_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          likes_count?: number | null
          media_urls?: string[] | null
          route_id?: string | null
          spot_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          likes_count?: number | null
          media_urls?: string[] | null
          route_id?: string | null
          spot_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          first_name: string | null
          id: string
          is_premium: boolean | null
          last_name: string | null
          premium_expires_at: string | null
          sport_category: string | null
          telegram_id: string | null
          telegram_photo_url: string | null
          telegram_username: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_premium?: boolean | null
          last_name?: string | null
          premium_expires_at?: string | null
          sport_category?: string | null
          telegram_id?: string | null
          telegram_photo_url?: string | null
          telegram_username?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_premium?: boolean | null
          last_name?: string | null
          premium_expires_at?: string | null
          sport_category?: string | null
          telegram_id?: string | null
          telegram_photo_url?: string | null
          telegram_username?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      purchase_requests: {
        Row: {
          admin_comment: string | null
          created_at: string
          delivery_address: string
          delivery_name: string
          delivery_phone: string
          id: string
          item_id: string
          processed_at: string | null
          quantity: number
          status: string
          total_cost: number
          user_id: string
        }
        Insert: {
          admin_comment?: string | null
          created_at?: string
          delivery_address: string
          delivery_name: string
          delivery_phone: string
          id?: string
          item_id: string
          processed_at?: string | null
          quantity?: number
          status?: string
          total_cost: number
          user_id: string
        }
        Update: {
          admin_comment?: string | null
          created_at?: string
          delivery_address?: string
          delivery_name?: string
          delivery_phone?: string
          id?: string
          item_id?: string
          processed_at?: string | null
          quantity?: number
          status?: string
          total_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "market_items"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer_image_url: string | null
          answer_text: string | null
          answered_at: string | null
          created_at: string
          id: string
          is_answered: boolean
          question_text: string
          target_username: string
          updated_at: string
        }
        Insert: {
          answer_image_url?: string | null
          answer_text?: string | null
          answered_at?: string | null
          created_at?: string
          id?: string
          is_answered?: boolean
          question_text: string
          target_username: string
          updated_at?: string
        }
        Update: {
          answer_image_url?: string | null
          answer_text?: string | null
          answered_at?: string | null
          created_at?: string
          id?: string
          is_answered?: boolean
          question_text?: string
          target_username?: string
          updated_at?: string
        }
        Relationships: []
      }
      route_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          media_urls: string[] | null
          route_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          route_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          route_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_comments_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      route_likes: {
        Row: {
          created_at: string
          id: string
          route_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          route_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          route_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_likes_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          average_speed: number | null
          comments_count: number | null
          created_at: string
          description: string | null
          distance: number | null
          duration_minutes: number | null
          end_latitude: number | null
          end_longitude: number | null
          id: string
          likes_count: number | null
          media_urls: string[] | null
          name: string
          route_points: Json | null
          start_latitude: number | null
          start_longitude: number | null
          user_id: string | null
        }
        Insert: {
          average_speed?: number | null
          comments_count?: number | null
          created_at?: string
          description?: string | null
          distance?: number | null
          duration_minutes?: number | null
          end_latitude?: number | null
          end_longitude?: number | null
          id?: string
          likes_count?: number | null
          media_urls?: string[] | null
          name: string
          route_points?: Json | null
          start_latitude?: number | null
          start_longitude?: number | null
          user_id?: string | null
        }
        Update: {
          average_speed?: number | null
          comments_count?: number | null
          created_at?: string
          description?: string | null
          distance?: number | null
          duration_minutes?: number | null
          end_latitude?: number | null
          end_longitude?: number | null
          id?: string
          likes_count?: number | null
          media_urls?: string[] | null
          name?: string
          route_points?: Json | null
          start_latitude?: number | null
          start_longitude?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "spot_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          media_urls: string[] | null
          spot_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          spot_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          spot_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_comments_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_likes: {
        Row: {
          created_at: string
          id: string
          spot_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          spot_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          spot_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_likes_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
        ]
      }
      spots: {
        Row: {
          comments_count: number | null
          created_at: string
          description: string | null
          id: string
          latitude: number
          likes_count: number | null
          longitude: number
          media_urls: string[] | null
          name: string
          user_id: string | null
        }
        Insert: {
          comments_count?: number | null
          created_at?: string
          description?: string | null
          id?: string
          latitude: number
          likes_count?: number | null
          longitude: number
          media_urls?: string[] | null
          name: string
          user_id?: string | null
        }
        Update: {
          comments_count?: number | null
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number
          likes_count?: number | null
          longitude?: number
          media_urls?: string[] | null
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_stars: number
          created_at: string | null
          expires_at: string
          id: string
          starts_at: string
          status: string
          subscription_type: string
          telegram_invoice_payload: string | null
          telegram_payment_charge_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_stars?: number
          created_at?: string | null
          expires_at: string
          id?: string
          starts_at?: string
          status?: string
          subscription_type?: string
          telegram_invoice_payload?: string | null
          telegram_payment_charge_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_stars?: number
          created_at?: string | null
          expires_at?: string
          id?: string
          starts_at?: string
          status?: string
          subscription_type?: string
          telegram_invoice_payload?: string | null
          telegram_payment_charge_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          reward_points: number
          telegram_channel_url: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          reward_points?: number
          telegram_channel_url: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          reward_points?: number
          telegram_channel_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_videos: {
        Row: {
          created_at: string
          id: string
          is_winner: boolean | null
          thumbnail_url: string | null
          title: string
          tournament_id: string
          updated_at: string
          user_id: string
          video_url: string
          views: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_winner?: boolean | null
          thumbnail_url?: string | null
          title: string
          tournament_id: string
          updated_at?: string
          user_id: string
          video_url: string
          views?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_winner?: boolean | null
          thumbnail_url?: string | null
          title?: string
          tournament_id?: string
          updated_at?: string
          user_id?: string
          video_url?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_videos_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          participants_count: number | null
          prize_amount: number
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          participants_count?: number | null
          prize_amount?: number
          start_date?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          participants_count?: number | null
          prize_amount?: number
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          completed_at: string | null
          created_at: string
          current_progress: number
          id: string
          is_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          is_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          is_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_market_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          product_url: string
          target_audience: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price: number
          product_url: string
          target_audience: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          product_url?: string
          target_audience?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string
          id: string
          total_points: number | null
          updated_at: string
          user_id: string
          wins_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          total_points?: number | null
          updated_at?: string
          user_id: string
          wins_count?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          total_points?: number | null
          updated_at?: string
          user_id?: string
          wins_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_purchases: {
        Row: {
          created_at: string
          id: string
          item_id: string
          quantity: number
          status: string
          total_cost: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          quantity?: number
          status?: string
          total_cost: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          quantity?: number
          status?: string
          total_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "market_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_saved_routes: {
        Row: {
          created_at: string
          id: string
          route_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          route_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          route_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_routes_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_saved_routes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_saved_spots: {
        Row: {
          created_at: string
          id: string
          spot_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          spot_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          spot_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_spots_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_saved_spots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tasks: {
        Row: {
          completed_at: string
          id: string
          points_awarded: number
          task_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          points_awarded?: number
          task_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          points_awarded?: number
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      video_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "video_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number
          parent_comment_id: string | null
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "video_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_likes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_ratings_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          average_rating: number | null
          category: string
          comments_count: number | null
          created_at: string
          description: string | null
          id: string
          is_winner: boolean | null
          likes_count: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string
          views: number | null
          winner_date: string | null
        }
        Insert: {
          average_rating?: number | null
          category?: string
          comments_count?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_winner?: boolean | null
          likes_count?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url: string
          views?: number | null
          winner_date?: string | null
        }
        Update: {
          average_rating?: number | null
          category?: string
          comments_count?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_winner?: boolean | null
          likes_count?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string
          views?: number | null
          winner_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          admin_comment: string | null
          amount_points: number
          amount_usdt: number | null
          created_at: string
          id: string
          processed_at: string | null
          status: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          admin_comment?: string | null
          amount_points: number
          amount_usdt?: number | null
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          admin_comment?: string | null
          amount_points?: number
          amount_usdt?: number | null
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_points_for_action: {
        Args: {
          p_user_id: string
          p_action_type: string
          p_points: number
          p_description?: string
          p_reference_id?: string
        }
        Returns: undefined
      }
      check_active_subscription: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      complete_task: {
        Args: { p_task_id: string }
        Returns: Json
      }
      create_points_history: {
        Args: {
          p_user_id: string
          p_points_change: number
          p_operation_type: string
          p_description: string
          p_reference_id?: string
        }
        Returns: undefined
      }
      create_subscription_after_payment: {
        Args: {
          p_user_id: string
          p_telegram_charge_id: string
          p_invoice_payload: string
          p_amount_stars: number
        }
        Returns: Json
      }
      decrement_likes_count: {
        Args: { video_id: string }
        Returns: undefined
      }
      increment_likes_count: {
        Args: { video_id: string }
        Returns: undefined
      }
      is_current_user_premium: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      purchase_item: {
        Args: { p_item_id: string; p_quantity?: number }
        Returns: Json
      }
      update_achievement_progress: {
        Args: {
          p_user_id: string
          p_category: string
          p_new_value?: number
          p_increment?: number
        }
        Returns: undefined
      }
      update_user_points: {
        Args:
          | { p_user_id: string; p_points_change: number }
          | {
              p_user_id: string
              p_points_change: number
              p_description?: string
            }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
