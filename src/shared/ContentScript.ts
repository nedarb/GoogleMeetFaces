export interface Participant {
  isYou: boolean;
  id: string;
  name: string;
  active: boolean;
  available: boolean;
  isTalking: boolean;
  isPinned: boolean;
  videoElements: Array<HTMLVideoElement>;
  /**
   * Image URL if no video is present
   */
  imageUrl?: string;
}

export interface ContentScript {
  getParticipants(): Promise<Readonly<Array<Participant>>>;
  settingsChanged(): Promise<void>;
}
