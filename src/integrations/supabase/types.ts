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
      custom_orders: {
        Row: {
          created_at: string | null
          custom_dish_name: string
          estimated_price: number | null
          id: string
          order_reference: string | null
          quantity: number
          restaurant_id: string | null
          restaurant_name: string
          special_instructions: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number | null
          updated_at: string | null
          user_location: string
          user_name: string
          user_phone: string
        }
        Insert: {
          created_at?: string | null
          custom_dish_name: string
          estimated_price?: number | null
          id?: string
          order_reference?: string | null
          quantity?: number
          restaurant_id?: string | null
          restaurant_name: string
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount?: number | null
          updated_at?: string | null
          user_location: string
          user_name: string
          user_phone: string
        }
        Update: {
          created_at?: string | null
          custom_dish_name?: string
          estimated_price?: number | null
          id?: string
          order_reference?: string | null
          quantity?: number
          restaurant_id?: string | null
          restaurant_name?: string
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount?: number | null
          updated_at?: string | null
          user_location?: string
          user_name?: string
          user_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_fees: {
        Row: {
          created_at: string | null
          fee: number
          id: string
          town: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fee?: number
          id?: string
          town: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fee?: number
          id?: string
          town?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dishes: {
        Row: {
          category: Database["public"]["Enums"]["dish_category"]
          cook_time: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_popular: boolean | null
          is_spicy: boolean | null
          is_vegetarian: boolean | null
          name: string
          serves: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["dish_category"]
          cook_time?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_popular?: boolean | null
          is_spicy?: boolean | null
          is_vegetarian?: boolean | null
          name: string
          serves?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["dish_category"]
          cook_time?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_popular?: boolean | null
          is_spicy?: boolean | null
          is_vegetarian?: boolean | null
          name?: string
          serves?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string | null
          dish_id: string | null
          dish_name: string
          id: string
          order_reference: string | null
          price: number
          quantity: number
          restaurant_id: string | null
          restaurant_name: string
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          updated_at: string | null
          user_location: string
          user_name: string
          user_phone: string
        }
        Insert: {
          created_at?: string | null
          dish_id?: string | null
          dish_name: string
          id?: string
          order_reference?: string | null
          price: number
          quantity?: number
          restaurant_id?: string | null
          restaurant_name: string
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          updated_at?: string | null
          user_location: string
          user_name: string
          user_phone: string
        }
        Update: {
          created_at?: string | null
          dish_id?: string | null
          dish_name?: string
          id?: string
          order_reference?: string | null
          price?: number
          quantity?: number
          restaurant_id?: string | null
          restaurant_name?: string
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount?: number
          updated_at?: string | null
          user_location?: string
          user_name?: string
          user_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_menus: {
        Row: {
          availability: boolean | null
          created_at: string | null
          dish_id: string | null
          id: string
          price: number
          restaurant_id: string | null
        }
        Insert: {
          availability?: boolean | null
          created_at?: string | null
          dish_id?: string | null
          id?: string
          price: number
          restaurant_id?: string | null
        }
        Update: {
          availability?: boolean | null
          created_at?: string | null
          dish_id?: string | null
          id?: string
          price?: number
          restaurant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_menus_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_menus_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          auth_id: string | null
          contact_number: string
          created_at: string | null
          id: string
          image_url: string | null
          mtn_number: string | null
          name: string
          orange_number: string | null
          town: string
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          contact_number: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          mtn_number?: string | null
          name: string
          orange_number?: string | null
          town: string
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          contact_number?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          mtn_number?: string | null
          name?: string
          orange_number?: string | null
          town?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_towns: {
        Row: {
          created_at: string | null
          id: string
          town: string
          updated_at: string | null
          user_phone: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          town: string
          updated_at?: string | null
          user_phone: string
        }
        Update: {
          created_at?: string | null
          id?: string
          town?: string
          updated_at?: string | null
          user_phone?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_reference: {
        Args: { town_name: string }
        Returns: string
      }
    }
    Enums: {
      dish_category:
        | "Traditional"
        | "Soup"
        | "Rice"
        | "Grilled"
        | "Snacks"
        | "Drinks"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "delivered"
        | "cancelled"
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
    Enums: {
      dish_category: [
        "Traditional",
        "Soup",
        "Rice",
        "Grilled",
        "Snacks",
        "Drinks",
      ],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
