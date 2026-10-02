import Pptx from "pptxgenjs";

// pptxgenjs ships CJS-style typings next to an ESM build. Under NodeNext, TypeScript
// types the default import as the module object, but at runtime it is the class.
export const PptxGenJS = Pptx as unknown as typeof Pptx.default;

export type Pres = InstanceType<typeof PptxGenJS>;
export type Slide = ReturnType<Pres["addSlide"]>;
export type TextRun = Exclude<Parameters<Slide["addText"]>[0], string>[number];
