export interface ArticleFigureChart {
  type: 'bar';
  title: string;
  labels: string[];
  values: number[];
  unit: string;
}

export interface ArticleFigure {
  headline: string;
  stat_value: string;
  stat_label: string;
  source: string;
  source_url: string | null;
  chart: ArticleFigureChart | null;
}

export interface ArticleAiInsights {
  summary: string[];
  choices: string[];
  figure: ArticleFigure;
  generated_at: string;
}

export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  category?: string;
  published_date: string;
  reading_time: number;
  is_published: boolean;
  key_takeaways?: string[];
  key_statistics?: string[];
  ai_insights?: ArticleAiInsights | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  role?: 'user' | 'writer' | 'admin';
  streak: number;
  total_notes: number;
  last_note_date?: string;
  created_at: string;
  updated_at: string;
}

export interface UserNote {
  id: string;
  user_id: string;
  article_id: string;
  content: string;
  created_at: string;
}