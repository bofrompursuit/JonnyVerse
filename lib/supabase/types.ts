export interface Database {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Tables: {
      tracks: {
        Row: {
          id: string;
          title: string;
          artist: string;
          album: string | null;
          bpm: number | null;
          musical_key: string | null;
          genre: string | null;
          duration: string | null;
          cover_art_url: string;
          thumbnail_url: string;
          audio_url: string | null;
          engine_dj_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          artist: string;
          album?: string | null;
          bpm?: number | null;
          musical_key?: string | null;
          genre?: string | null;
          duration?: string | null;
          cover_art_url?: string;
          thumbnail_url?: string;
          audio_url?: string | null;
          engine_dj_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tracks"]["Insert"]>;
        Relationships: [];
      };
    };
  };
}
