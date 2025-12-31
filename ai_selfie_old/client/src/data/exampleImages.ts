// Re-export everything from shared exampleImages
// This file exists for backwards compatibility with existing imports

export {
  type ExampleImage,
  KNOWN_BACKGROUNDS,
  KNOWN_STYLES,
  exampleImages,
  filterExampleImages,
  getRandomPromptFromFiltered,
} from "../../../shared/exampleImages";
