
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "course_library": {
                  Row: {
                    "course_id": string,"item_id": string,"position": number,"section": Database["public"]['Enums']["library_section"]
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"item_id": string,"position": number,"section": Database["public"]['Enums']["library_section"]
                  }
                  Update: {
                    "course_id"?: string,"item_id"?: string,"position"?: number,"section"?: Database["public"]['Enums']["library_section"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_library_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_library_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    }
                  ]
                },"course_modules": {
                  Row: {
                    "id": string,"is_hidden": boolean,"module_id": string,"opens_on": string | null,"position": number,"title_override": string | null,"unit_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"is_hidden"?: boolean,"module_id": string,"opens_on"?: string | null,"position": number,"title_override"?: string | null,"unit_id": string
                  }
                  Update: {
                    "id"?: string,"is_hidden"?: boolean,"module_id"?: string,"opens_on"?: string | null,"position"?: number,"title_override"?: string | null,"unit_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_modules_module_id_fkey"
      columns: ["module_id"]
isOneToOne: false
      referencedRelation: "modules"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_modules_unit_id_fkey"
      columns: ["unit_id"]
isOneToOne: false
      referencedRelation: "course_units"
      referencedColumns: ["id"]
    }
                  ]
                },"course_units": {
                  Row: {
                    "course_id": string,"id": string,"position": number,"slug": string,"summary": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"id"?: string,"position": number,"slug": string,"summary"?: string | null,"title": string
                  }
                  Update: {
                    "course_id"?: string,"id"?: string,"position"?: number,"slug"?: string,"summary"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_units_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    }
                  ]
                },"courses": {
                  Row: {
                    "created_at": string,"id": string,"kind": Database["public"]['Enums']["course_kind"],"slug": string,"source_course_id": string | null,"summary": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["course_kind"],"slug": string,"source_course_id"?: string | null,"summary"?: string | null,"title": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["course_kind"],"slug"?: string,"source_course_id"?: string | null,"summary"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "courses_source_course_id_fkey"
      columns: ["source_course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    }
                  ]
                },"item_skills": {
                  Row: {
                    "basis": Database["public"]['Enums']["tag_basis"],"item_id": string,"skill_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "basis": Database["public"]['Enums']["tag_basis"],"item_id": string,"skill_id": string
                  }
                  Update: {
                    "basis"?: Database["public"]['Enums']["tag_basis"],"item_id"?: string,"skill_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "item_skills_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "item_skills_skill_id_fkey"
      columns: ["skill_id"]
isOneToOne: false
      referencedRelation: "skills"
      referencedColumns: ["id"]
    }
                  ]
                },"item_topics": {
                  Row: {
                    "basis": Database["public"]['Enums']["tag_basis"],"item_id": string,"topic_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "basis": Database["public"]['Enums']["tag_basis"],"item_id": string,"topic_id": string
                  }
                  Update: {
                    "basis"?: Database["public"]['Enums']["tag_basis"],"item_id"?: string,"topic_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "item_topics_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "item_topics_topic_id_fkey"
      columns: ["topic_id"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["id"]
    }
                  ]
                },"items": {
                  Row: {
                    "audience": Database["public"]['Enums']["item_audience"],"body_md": string | null,"created_at": string,"default_release": Database["public"]['Enums']["release_rule"],"derived_from": string | null,"duration_seconds": number | null,"id": string,"kind": Database["public"]['Enums']["item_kind"],"origin": Database["public"]['Enums']["item_origin"],"owner_id": string,"rights": NonNullable<Json>,"slug": string,"source": string,"status": Database["public"]['Enums']["item_status"],"stored_at": string | null,"summary": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "audience"?: Database["public"]['Enums']["item_audience"],"body_md"?: string | null,"created_at"?: string,"default_release"?: Database["public"]['Enums']["release_rule"],"derived_from"?: string | null,"duration_seconds"?: number | null,"id"?: string,"kind": Database["public"]['Enums']["item_kind"],"origin": Database["public"]['Enums']["item_origin"],"owner_id": string,"rights"?: NonNullable<Json>,"slug": string,"source": string,"status"?: Database["public"]['Enums']["item_status"],"stored_at"?: string | null,"summary"?: string | null,"title": string
                  }
                  Update: {
                    "audience"?: Database["public"]['Enums']["item_audience"],"body_md"?: string | null,"created_at"?: string,"default_release"?: Database["public"]['Enums']["release_rule"],"derived_from"?: string | null,"duration_seconds"?: number | null,"id"?: string,"kind"?: Database["public"]['Enums']["item_kind"],"origin"?: Database["public"]['Enums']["item_origin"],"owner_id"?: string,"rights"?: NonNullable<Json>,"slug"?: string,"source"?: string,"status"?: Database["public"]['Enums']["item_status"],"stored_at"?: string | null,"summary"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "items_derived_from_fkey"
      columns: ["derived_from"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "items_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "owners"
      referencedColumns: ["id"]
    }
                  ]
                },"module_slots": {
                  Row: {
                    "id": string,"module_id": string,"position": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"module_id": string,"position": number
                  }
                  Update: {
                    "id"?: string,"module_id"?: string,"position"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "module_slots_module_id_fkey"
      columns: ["module_id"]
isOneToOne: false
      referencedRelation: "modules"
      referencedColumns: ["id"]
    }
                  ]
                },"modules": {
                  Row: {
                    "id": string,"slug": string,"summary": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"slug": string,"summary"?: string | null,"title": string
                  }
                  Update: {
                    "id"?: string,"slug"?: string,"summary"?: string | null,"title"?: string
                  }
                  Relationships: [
                    
                  ]
                },"owners": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"slug": string,"type": Database["public"]['Enums']["owner_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"slug": string,"type": Database["public"]['Enums']["owner_type"]
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"slug"?: string,"type"?: Database["public"]['Enums']["owner_type"]
                  }
                  Relationships: [
                    
                  ]
                },"skills": {
                  Row: {
                    "id": string,"name": string,"slug": string,"type": Database["public"]['Enums']["skill_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name": string,"slug": string,"type": Database["public"]['Enums']["skill_type"]
                  }
                  Update: {
                    "id"?: string,"name"?: string,"slug"?: string,"type"?: Database["public"]['Enums']["skill_type"]
                  }
                  Relationships: [
                    
                  ]
                },"slot_items": {
                  Row: {
                    "item_id": string,"position": number,"slot_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "item_id": string,"position"?: number,"slot_id": string
                  }
                  Update: {
                    "item_id"?: string,"position"?: number,"slot_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "slot_items_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "slot_items_slot_id_fkey"
      columns: ["slot_id"]
isOneToOne: false
      referencedRelation: "module_slots"
      referencedColumns: ["id"]
    }
                  ]
                },"topics": {
                  Row: {
                    "id": string,"name": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name": string,"slug": string
                  }
                  Update: {
                    "id"?: string,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"workbook_builds": {
                  Row: {
                    "addin_ref": string,"created_at": string,"id": string,"item_id": string,"open_url": string | null,"status": Database["public"]['Enums']["build_status"],"variant": Database["public"]['Enums']["build_variant"]
                  }
                  ComputedFields: never
                  Insert: {
                    "addin_ref": string,"created_at"?: string,"id"?: string,"item_id": string,"open_url"?: string | null,"status"?: Database["public"]['Enums']["build_status"],"variant": Database["public"]['Enums']["build_variant"]
                  }
                  Update: {
                    "addin_ref"?: string,"created_at"?: string,"id"?: string,"item_id"?: string,"open_url"?: string | null,"status"?: Database["public"]['Enums']["build_status"],"variant"?: Database["public"]['Enums']["build_variant"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "workbook_builds_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "create_section_from_template":
{ Args: { "p_template_slug": string,"p_title": string }; Returns: string
                           },
"move_course_module":
{ Args: { "p_course_module_id": string,"p_direction": number }; Returns: undefined
                           }
          }
          Enums: {
            "build_status": "current"|"retired","build_variant": "training"|"competition","course_kind": "template"|"section","item_audience": "student"|"instructor","item_kind": "video"|"read"|"workbook"|"guide"|"file","item_origin": "primitive"|"derived","item_status": "active"|"retired","library_section": "explainer"|"function_guide"|"practice"|"game","owner_type": "person"|"brand"|"not_established","release_rule": "immediate"|"after_due"|"after_unlock"|"after_run","skill_type": "function"|"technique","tag_basis": "declared"|"observed"|"claimed"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "build_status": ["current", "retired"],"build_variant": ["training", "competition"],"course_kind": ["template", "section"],"item_audience": ["student", "instructor"],"item_kind": ["video", "read", "workbook", "guide", "file"],"item_origin": ["primitive", "derived"],"item_status": ["active", "retired"],"library_section": ["explainer", "function_guide", "practice", "game"],"owner_type": ["person", "brand", "not_established"],"release_rule": ["immediate", "after_due", "after_unlock", "after_run"],"skill_type": ["function", "technique"],"tag_basis": ["declared", "observed", "claimed"]
          }
        }
} as const
