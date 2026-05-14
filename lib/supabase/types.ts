export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      post_stats: {
        Row: {
          post_id: string
          view_count: number | null
          unique_visitors: number | null
          updated_at: string
        }
        Insert: {
          post_id: string
          view_count?: number | null
          unique_visitors?: number | null
          updated_at?: string
        }
        Update: {
          post_id?: string
          view_count?: number | null
          unique_visitors?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_stats_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          }
        ]
      }
      post_views: {
        Row: {
          id: string
          post_id: string
          session_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          session_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          session_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          }
        ]
      }
      writers: {
        Row: {
          id: string
          name: string
          bengali_name: string
          slug: string
          bio: string | null
          profile_image: string | null
          nationality: string | null
          birth_year: number | null
          death_year: number | null
          social_links: Json | null
          is_featured: boolean | null
          is_visible: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          bengali_name: string
          slug: string
          bio?: string | null
          profile_image?: string | null
          nationality?: string | null
          birth_year?: number | null
          death_year?: number | null
          social_links?: Json | null
          is_featured?: boolean | null
          is_visible?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          bengali_name?: string
          slug?: string
          bio?: string | null
          profile_image?: string | null
          nationality?: string | null
          birth_year?: number | null
          death_year?: number | null
          social_links?: Json | null
          is_featured?: boolean | null
          is_visible?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          approved: boolean
          body: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          body: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          approved?: boolean
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: string
          name_bn: string
          name_en: string | null
          slug: string | null
          description: string | null
          icon_url: string | null
          is_active: boolean
          parent_id: string | null
          is_main: boolean
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          name_bn: string
          name_en?: string | null
          slug?: string | null
          description?: string | null
          icon_url?: string | null
          is_active?: boolean
          parent_id?: string | null
          is_main?: boolean
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          name_bn?: string
          name_en?: string | null
          slug?: string | null
          description?: string | null
          icon_url?: string | null
          is_active?: boolean
          parent_id?: string | null
          is_main?: boolean
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      post_categories: {
        Row: {
          id: string
          post_id: string
          category_id: string
        }
        Insert: {
          id?: string
          post_id: string
          category_id: string
        }
        Update: {
          id?: string
          post_id?: string
          category_id?: string
        }
        Relationships: []
      }
      post_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          position: number | null
          post_id: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          position?: number | null
          post_id: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          position?: number | null
          post_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          id: string
          post_id: string
          tag: string
        }
        Insert: {
          id?: string
          post_id: string
          tag: string
        }
        Update: {
          id?: string
          post_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_translations: {
        Row: {
          body: string | null
          citations: Json | null
          excerpt: string | null
          footnotes: Json | null
          id: string
          lang: string
          post_id: string
          title: string
        }
        Insert: {
          body?: string | null
          citations?: Json | null
          excerpt?: string | null
          footnotes?: Json | null
          id?: string
          lang: string
          post_id: string
          title: string
        }
        Update: {
          body?: string | null
          citations?: Json | null
          excerpt?: string | null
          footnotes?: Json | null
          id?: string
          lang?: string
          post_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_translations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          category_bn: string | null
          category_en: string | null
          cover_url: string | null
          created_at: string
          id: string
          published_at: string | null
          reading_minutes: number | null
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          updated_at: string
          writer_id: string | null
          is_translation: boolean | null
          translator_id: string | null
        }
        Insert: {
          author_id: string
          category_bn?: string | null
          category_en?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          reading_minutes?: number | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
          writer_id?: string | null
          is_translation?: boolean | null
          translator_id?: string | null
        }
        Update: {
          author_id?: string
          category_bn?: string | null
          category_en?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          reading_minutes?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
          writer_id?: string | null
          is_translation?: boolean | null
          translator_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_writer_id_fkey"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "writers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_translator_id_fkey"
            columns: ["translator_id"]
            isOneToOne: false
            referencedRelation: "writers"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          display_name_bn: string | null
          id: string
          is_banned: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          display_name_bn?: string | null
          id: string
          is_banned?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          display_name_bn?: string | null
          id?: string
          is_banned?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_post_view: {
        Args: {
          p_post_id: string
          p_session_id: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user"
      post_status: "draft" | "published"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "user"],
      post_status: ["draft", "published"],
    },
  },
} as const
