export interface PrismRole {
  id: string;
  name: 'teacher' | 'student' | 'friend' | 'parent-mentor' | 'observer';
  capabilities: Array<'speak' | 'react' | 'draw' | 'spawn_prop' | 'moderate' | 'award_hint'>;
}

export interface PrismProject {
  id: string;
  title: string;
  description?: string;
  objectives: string[];
  artifacts: string[];
  rubric?: Record<string, unknown>;
  badges?: string[];
}

export interface PrismClubDefinition {
  id: string;
  name: string;
  purpose: string;
  channels: Array<'text' | 'emoji' | 'scene' | 'audio'>;
  schedule: {
    meets: string;
  };
  roles: PrismRole[];
  projects: PrismProject[];
}

export interface LabSessionTimeline {
  open_at: string;
  start_at: string;
  end_at: string;
}

export interface LabSessionDefinition {
  id: string;
  title: string;
  club_id: string;
  objectives: string[];
  roles: PrismRole[];
  timeline: LabSessionTimeline;
  rules: string[];
  rubric: Record<string, unknown>;
  scene?: {
    map: string;
    props?: string[];
  };
}
