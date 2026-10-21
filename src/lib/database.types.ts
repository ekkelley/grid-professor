
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "case_request_files": {
                  Row: {
                    "created_at": string,"file_name": string,"file_path": string,"id": string,"kind": Database["public"]['Enums']["case_request_file_kind"],"note": string | null,"request_id": string,"size_bytes": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"file_name": string,"file_path": string,"id"?: string,"kind"?: Database["public"]['Enums']["case_request_file_kind"],"note"?: string | null,"request_id": string,"size_bytes": number
                  }
                  Update: {
                    "created_at"?: string,"file_name"?: string,"file_path"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["case_request_file_kind"],"note"?: string | null,"request_id"?: string,"size_bytes"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "case_request_files_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "case_requests"
      referencedColumns: ["id"]
    }
                  ]
                },"case_requests": {
                  Row: {
                    "admin_notes": string | null,"brief_md": string,"created_at": string,"id": string,"params": NonNullable<Json>,"requester_id": string,"status": Database["public"]['Enums']["case_request_status"],"submitted_at": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_notes"?: string | null,"brief_md"?: string,"created_at"?: string,"id"?: string,"params"?: NonNullable<Json>,"requester_id": string,"status"?: Database["public"]['Enums']["case_request_status"],"submitted_at"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "admin_notes"?: string | null,"brief_md"?: string,"created_at"?: string,"id"?: string,"params"?: NonNullable<Json>,"requester_id"?: string,"status"?: Database["public"]['Enums']["case_request_status"],"submitted_at"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "case_requests_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                },"course_join_codes": {
                  Row: {
                    "code": string,"course_id": string,"created_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"course_id": string,"created_at"?: string
                  }
                  Update: {
                    "code"?: string,"course_id"?: string,"created_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_join_codes_course_id_fkey"
      columns: ["course_id"]
isOneToOne: true
      referencedRelation: "courses"
      referencedColumns: ["id"]
    }
                  ]
                },"course_library": {
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
                },"course_members": {
                  Row: {
                    "course_id": string,"joined_at": string,"role": Database["public"]['Enums']["course_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"joined_at"?: string,"role"?: Database["public"]['Enums']["course_role"],"user_id": string
                  }
                  Update: {
                    "course_id"?: string,"joined_at"?: string,"role"?: Database["public"]['Enums']["course_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_members_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                },"course_modules": {
                  Row: {
                    "id": string,"is_hidden": boolean,"module_id": string | null,"note": string | null,"opens_on": string | null,"position": number,"title_override": string | null,"unit_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"is_hidden"?: boolean,"module_id"?: string | null,"note"?: string | null,"opens_on"?: string | null,"position": number,"title_override"?: string | null,"unit_id": string
                  }
                  Update: {
                    "id"?: string,"is_hidden"?: boolean,"module_id"?: string | null,"note"?: string | null,"opens_on"?: string | null,"position"?: number,"title_override"?: string | null,"unit_id"?: string
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
                    "audience": Database["public"]['Enums']["item_audience"],"body_md": string | null,"created_at": string,"default_release": Database["public"]['Enums']["release_rule"],"delivery_note": string | null,"derived_from": string | null,"duration_seconds": number | null,"id": string,"kind": Database["public"]['Enums']["item_kind"],"origin": Database["public"]['Enums']["item_origin"],"owner_id": string,"rights": NonNullable<Json>,"slug": string,"source": string,"status": Database["public"]['Enums']["item_status"],"stored_at": string | null,"summary": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "audience"?: Database["public"]['Enums']["item_audience"],"body_md"?: string | null,"created_at"?: string,"default_release"?: Database["public"]['Enums']["release_rule"],"delivery_note"?: string | null,"derived_from"?: string | null,"duration_seconds"?: number | null,"id"?: string,"kind": Database["public"]['Enums']["item_kind"],"origin": Database["public"]['Enums']["item_origin"],"owner_id": string,"rights"?: NonNullable<Json>,"slug": string,"source": string,"status"?: Database["public"]['Enums']["item_status"],"stored_at"?: string | null,"summary"?: string | null,"title": string
                  }
                  Update: {
                    "audience"?: Database["public"]['Enums']["item_audience"],"body_md"?: string | null,"created_at"?: string,"default_release"?: Database["public"]['Enums']["release_rule"],"delivery_note"?: string | null,"derived_from"?: string | null,"duration_seconds"?: number | null,"id"?: string,"kind"?: Database["public"]['Enums']["item_kind"],"origin"?: Database["public"]['Enums']["item_origin"],"owner_id"?: string,"rights"?: NonNullable<Json>,"slug"?: string,"source"?: string,"status"?: Database["public"]['Enums']["item_status"],"stored_at"?: string | null,"summary"?: string | null,"title"?: string
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
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string,"role": Database["public"]['Enums']["user_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"role"?: Database["public"]['Enums']["user_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"role"?: Database["public"]['Enums']["user_role"],"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"role_grants": {
                  Row: {
                    "email": string,"note": string | null,"role": Database["public"]['Enums']["user_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "email": string,"note"?: string | null,"role": Database["public"]['Enums']["user_role"]
                  }
                  Update: {
                    "email"?: string,"note"?: string | null,"role"?: Database["public"]['Enums']["user_role"]
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
                },"video_progress": {
                  Row: {
                    "best_session_percent": number,"duration_seconds": number,"first_watched_at": string,"intervals": NonNullable<Json>,"item_id": string,"last_watched_at": string,"percent": number,"user_id": string,"watched_seconds": number
                  }
                  ComputedFields: never
                  Insert: {
                    "best_session_percent": number,"duration_seconds": number,"first_watched_at"?: string,"intervals": NonNullable<Json>,"item_id": string,"last_watched_at"?: string,"percent": number,"user_id": string,"watched_seconds": number
                  }
                  Update: {
                    "best_session_percent"?: number,"duration_seconds"?: number,"first_watched_at"?: string,"intervals"?: NonNullable<Json>,"item_id"?: string,"last_watched_at"?: string,"percent"?: number,"user_id"?: string,"watched_seconds"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "video_progress_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    }
                  ]
                },"video_watch_events": {
                  Row: {
                    "duration_seconds": number,"id": string,"intervals": NonNullable<Json>,"item_id": string,"recorded_at": string,"session_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "duration_seconds": number,"id"?: string,"intervals": NonNullable<Json>,"item_id": string,"recorded_at"?: string,"session_id": string,"user_id": string
                  }
                  Update: {
                    "duration_seconds"?: number,"id"?: string,"intervals"?: NonNullable<Json>,"item_id"?: string,"recorded_at"?: string,"session_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "video_watch_events_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    }
                  ]
                },"workbook_builds": {
                  Row: {
                    "addin_ref": string,"created_at": string,"file_attached_at": string | null,"file_name": string | null,"file_path": string | null,"id": string,"item_id": string,"open_url": string | null,"status": Database["public"]['Enums']["build_status"],"variant": Database["public"]['Enums']["build_variant"]
                  }
                  ComputedFields: never
                  Insert: {
                    "addin_ref": string,"created_at"?: string,"file_attached_at"?: string | null,"file_name"?: string | null,"file_path"?: string | null,"id"?: string,"item_id": string,"open_url"?: string | null,"status"?: Database["public"]['Enums']["build_status"],"variant": Database["public"]['Enums']["build_variant"]
                  }
                  Update: {
                    "addin_ref"?: string,"created_at"?: string,"file_attached_at"?: string | null,"file_name"?: string | null,"file_path"?: string | null,"id"?: string,"item_id"?: string,"open_url"?: string | null,"status"?: Database["public"]['Enums']["build_status"],"variant"?: Database["public"]['Enums']["build_variant"]
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
                },"workbook_members": {
                  Row: {
                    "member_id": string,"position": number,"sequence_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "member_id": string,"position": number,"sequence_id": string
                  }
                  Update: {
                    "member_id"?: string,"position"?: number,"sequence_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workbook_members_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workbook_members_sequence_id_fkey"
      columns: ["sequence_id"]
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
"delete_empty_course_unit":
{ Args: { "p_unit_id": string }; Returns: undefined
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_course_instructor":
{ Args: { "p_course_id": string }; Returns: boolean
                           },
"move_course_module":
{ Args: { "p_course_module_id": string,"p_direction": number }; Returns: undefined
                           },
"move_course_module_across_units":
{ Args: { "p_course_module_id": string,"p_direction": number }; Returns: undefined
                           },
"move_course_unit":
{ Args: { "p_direction": number,"p_unit_id": string }; Returns: undefined
                           },
"new_join_code":
{ Args: Record<PropertyKey, never>; Returns: string
                           }
          }
          Enums: {
            "build_status": "current"|"retired","build_variant": "training"|"competition"|"single","case_request_file_kind": "data"|"map"|"example_case"|"other","case_request_status": "draft"|"submitted"|"in_progress"|"delivered"|"declined","course_kind": "template"|"section","course_role": "student"|"instructor","item_audience": "student"|"instructor","item_kind": "video"|"read"|"workbook"|"guide"|"file","item_origin": "primitive"|"derived","item_status": "active"|"retired","library_section": "explainer"|"function_guide"|"practice"|"game","owner_type": "person"|"brand"|"not_established","release_rule": "immediate"|"after_due"|"after_unlock"|"after_run","skill_type": "function"|"technique","tag_basis": "declared"|"observed"|"claimed","user_role": "student"|"instructor"|"admin"
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
            "build_status": ["current", "retired"],"build_variant": ["training", "competition", "single"],"case_request_file_kind": ["data", "map", "example_case", "other"],"case_request_status": ["draft", "submitted", "in_progress", "delivered", "declined"],"course_kind": ["template", "section"],"course_role": ["student", "instructor"],"item_audience": ["student", "instructor"],"item_kind": ["video", "read", "workbook", "guide", "file"],"item_origin": ["primitive", "derived"],"item_status": ["active", "retired"],"library_section": ["explainer", "function_guide", "practice", "game"],"owner_type": ["person", "brand", "not_established"],"release_rule": ["immediate", "after_due", "after_unlock", "after_run"],"skill_type": ["function", "technique"],"tag_basis": ["declared", "observed", "claimed"],"user_role": ["student", "instructor", "admin"]
          }
        }
} as const
