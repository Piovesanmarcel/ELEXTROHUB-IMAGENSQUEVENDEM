import { TextElement, ImagePosition } from './ShowcaseEditorPanel';

export interface DraftShowcase {
  id: string;
  layoutName: string;
  originalCanvas: HTMLCanvasElement;
  preview: string;
  textElements: TextElement[];
  imagePositions: ImagePosition[];
  saved: boolean;
}
