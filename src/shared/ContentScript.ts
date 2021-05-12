export interface Participant {
  isYou: boolean;
  id: string;
  name: string;
  active: boolean;
  available: boolean;
  isTalking: boolean;
  isPinned: boolean;
  videoElements: Array<HTMLVideoElement>;
}

export interface ContentScript {
  getParticipants(): Promise<Readonly<Array<Participant>>>;
  settingsChanged(): Promise<void>;
}
