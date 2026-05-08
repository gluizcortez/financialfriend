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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          entity_id: string
          entity_type: string
          household_id: string
          id: string
          name: string
          size_bytes: number
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          entity_id: string
          entity_type: string
          household_id: string
          id?: string
          name: string
          size_bytes: number
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          entity_id?: string
          entity_type?: string
          household_id?: string
          id?: string
          name?: string
          size_bytes?: number
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_entries: {
        Row: {
          bill_id: string | null
          category_id: string | null
          created_at: string
          custom_fields: Json
          due_date: string
          household_id: string
          id: string
          monthly_record_id: string
          name: string
          notes: string
          paid_date: string | null
          status: string
          updated_at: string
          value_cents: number
        }
        Insert: {
          bill_id?: string | null
          category_id?: string | null
          created_at?: string
          custom_fields?: Json
          due_date: string
          household_id: string
          id?: string
          monthly_record_id: string
          name: string
          notes?: string
          paid_date?: string | null
          status?: string
          updated_at?: string
          value_cents?: number
        }
        Update: {
          bill_id?: string | null
          category_id?: string | null
          created_at?: string
          custom_fields?: Json
          due_date?: string
          household_id?: string
          id?: string
          monthly_record_id?: string
          name?: string
          notes?: string
          paid_date?: string | null
          status?: string
          updated_at?: string
          value_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "bill_entries_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_entries_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_entries_monthly_record_id_fkey"
            columns: ["monthly_record_id"]
            isOneToOne: false
            referencedRelation: "monthly_bill_records"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          category_id: string | null
          created_at: string
          custom_fields: Json
          due_day: number
          household_id: string
          id: string
          is_recurring: boolean
          name: string
          notes: string
          updated_at: string
          value_cents: number
          workspace_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          custom_fields?: Json
          due_day: number
          household_id: string
          id?: string
          is_recurring?: boolean
          name: string
          notes?: string
          updated_at?: string
          value_cents?: number
          workspace_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          custom_fields?: Json
          due_day?: number
          household_id?: string
          id?: string
          is_recurring?: boolean
          name?: string
          notes?: string
          updated_at?: string
          value_cents?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          budget_cents: number | null
          color: string
          created_at: string
          household_id: string
          icon: string | null
          id: string
          is_default: boolean
          name: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          budget_cents?: number | null
          color: string
          created_at?: string
          household_id: string
          icon?: string | null
          id?: string
          is_default?: boolean
          name: string
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          budget_cents?: number | null
          color?: string
          created_at?: string
          household_id?: string
          icon?: string | null
          id?: string
          is_default?: boolean
          name?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          applies_to: string
          created_at: string
          household_id: string
          id: string
          name: string
          options: Json | null
          type: string
        }
        Insert: {
          applies_to: string
          created_at?: string
          household_id: string
          id?: string
          name: string
          options?: Json | null
          type: string
        }
        Update: {
          applies_to?: string
          created_at?: string
          household_id?: string
          id?: string
          name?: string
          options?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_fields_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      fgts_records: {
        Row: {
          balance_cents: number
          created_at: string
          date: string
          household_id: string
          id: string
          month_key: string
          notes: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          balance_cents?: number
          created_at?: string
          date: string
          household_id: string
          id?: string
          month_key: string
          notes?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          balance_cents?: number
          created_at?: string
          date?: string
          household_id?: string
          id?: string
          month_key?: string
          notes?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fgts_records_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fgts_records_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_contributions: {
        Row: {
          actual_amount_cents: number
          created_at: string
          date: string
          goal_id: string
          household_id: string
          id: string
          notes: string
          period_key: string
          target_amount_cents: number
          updated_at: string
        }
        Insert: {
          actual_amount_cents?: number
          created_at?: string
          date: string
          goal_id: string
          household_id: string
          id?: string
          notes?: string
          period_key: string
          target_amount_cents?: number
          updated_at?: string
        }
        Update: {
          actual_amount_cents?: number
          created_at?: string
          date?: string
          goal_id?: string
          household_id?: string
          id?: string
          notes?: string
          period_key?: string
          target_amount_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_contributions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_linked_investments: {
        Row: {
          goal_id: string
          investment_id: string
        }
        Insert: {
          goal_id: string
          investment_id: string
        }
        Update: {
          goal_id?: string
          investment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_linked_investments_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_linked_investments_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_linked_workspaces: {
        Row: {
          goal_id: string
          workspace_id: string
        }
        Insert: {
          goal_id: string
          workspace_id: string
        }
        Update: {
          goal_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_linked_workspaces_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_linked_workspaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          custom_period_days: number | null
          description: string
          end_date: string | null
          goal_type: string
          household_id: string
          id: string
          is_active: boolean
          name: string
          periodicity: string
          start_date: string
          target_amount_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_period_days?: number | null
          description?: string
          end_date?: string | null
          goal_type: string
          household_id: string
          id?: string
          is_active?: boolean
          name: string
          periodicity: string
          start_date: string
          target_amount_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_period_days?: number | null
          description?: string
          end_date?: string | null
          goal_type?: string
          household_id?: string
          id?: string
          is_active?: boolean
          name?: string
          periodicity?: string
          start_date?: string
          target_amount_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          household_id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          household_id: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          household_id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "households_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      income_entries: {
        Row: {
          amount_cents: number
          category: string
          created_at: string
          date: string
          household_id: string
          id: string
          is_recurring: boolean
          month_key: string
          name: string
          notes: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount_cents?: number
          category: string
          created_at?: string
          date: string
          household_id: string
          id?: string
          is_recurring?: boolean
          month_key: string
          name: string
          notes?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount_cents?: number
          category?: string
          created_at?: string
          date?: string
          household_id?: string
          id?: string
          is_recurring?: boolean
          month_key?: string
          name?: string
          notes?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_entries_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_transactions: {
        Row: {
          amount_cents: number
          created_at: string
          date: string
          household_id: string
          id: string
          investment_id: string
          month_key: string
          notes: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          date: string
          household_id: string
          id?: string
          investment_id: string
          month_key: string
          notes?: string
          type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          date?: string
          household_id?: string
          id?: string
          investment_id?: string
          month_key?: string
          notes?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_transactions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          created_at: string
          current_balance_cents: number
          household_id: string
          id: string
          is_active: boolean
          name: string
          notes: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          current_balance_cents?: number
          household_id: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string
          type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          current_balance_cents?: number
          household_id?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_bill_records: {
        Row: {
          created_at: string
          household_id: string
          id: string
          month_key: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          month_key: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          month_key?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_bill_records_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_bill_records_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      net_worth_tab_fgts_workspaces: {
        Row: {
          tab_id: string
          workspace_id: string
        }
        Insert: {
          tab_id: string
          workspace_id: string
        }
        Update: {
          tab_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "net_worth_tab_fgts_workspaces_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "net_worth_tabs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "net_worth_tab_fgts_workspaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      net_worth_tab_investment_workspaces: {
        Row: {
          tab_id: string
          workspace_id: string
        }
        Insert: {
          tab_id: string
          workspace_id: string
        }
        Update: {
          tab_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "net_worth_tab_investment_workspaces_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "net_worth_tabs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "net_worth_tab_investment_workspaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      net_worth_tabs: {
        Row: {
          created_at: string
          household_id: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "net_worth_tabs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      release_notes: {
        Row: {
          content: string
          id: string
          is_latest: boolean
          published_at: string
          title: string
          version: string
        }
        Insert: {
          content: string
          id?: string
          is_latest?: boolean
          published_at?: string
          title: string
          version: string
        }
        Update: {
          content?: string
          id?: string
          is_latest?: boolean
          published_at?: string
          title?: string
          version?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          color: string
          created_at: string
          household_id: string
          icon: string | null
          id: string
          name: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          color: string
          created_at?: string
          household_id: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          household_id?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_household_member: { Args: { hid: string }; Returns: boolean }
      is_household_owner: { Args: { hid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
