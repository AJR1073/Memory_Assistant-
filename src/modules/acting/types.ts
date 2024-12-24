export interface Script {
  id: string;
  title: string;
  author?: string;
  characters: Character[];
  scenes: Scene[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Character {
  id: string;
  name: string;
  description?: string;
  lines: Line[];
}

export interface Scene {
  id: string;
  name: string;
  description?: string;
  order: number;
}

export interface Line {
  id: string;
  characterId: string;
  sceneId: string;
  text: string;
  order: number;
  notes?: string;
}

export interface Practice {
  id: string;
  scriptId: string;
  characterId: string;
  sceneId: string;
  userId: string;
  accuracy: number;
  timestamp: Date;
}
