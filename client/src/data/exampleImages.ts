// Example images data structure with gender, style, and prompts
export interface ExampleImage {
  id: number;
  url: string;
  badge: string | null;
  gender: "man" | "woman" | "both"; // Which gender this image is for
  styles: string[]; // Which styles this image represents (formal, casual, elegant, professional)
  backgrounds: string[]; // Which backgrounds this image works with (office, neutral, studio)
  prompt: string; // Specific prompt for this image style
}

export const exampleImages: ExampleImage[] = [
  {
    id: 1,
    url: "https://gxwtcdplfkjfidwyrunk.supabase.co/storage/v1/object/public/example-images/image.webp",
    badge: "premium",
    gender: "both",
    styles: ["formal", "professional"],
    backgrounds: ["office", "studio"],
    prompt: "Create a professional business portrait with formal attire, corporate setting, confident pose, high-quality studio lighting",
  },
  {
    id: 2,
    url: "https://gxwtcdplfkjfidwyrunk.supabase.co/storage/v1/object/public/example-images/image_1.webp",
    badge: "new",
    gender: "both",
    styles: ["casual", "elegant"],
    backgrounds: ["neutral", "studio"],
    prompt: "Create a casual yet elegant portrait with modern clothing, natural expression, soft lighting, contemporary style",
  },
  {
    id: 3,
    url: "https://gxwtcdplfkjfidwyrunk.supabase.co/storage/v1/object/public/example-images/image_10.webp",
    badge: null,
    gender: "man",
    styles: ["professional", "formal"],
    backgrounds: ["office", "studio"],
    prompt: "Create a professional male portrait with business suit, strong presence, executive style, professional lighting",
  },
  {
    id: 4,
    url: "https://gxwtcdplfkjfidwyrunk.supabase.co/storage/v1/object/public/example-images/image_100.jpg",
    badge: "popular",
    gender: "woman",
    styles: ["elegant", "formal"],
    backgrounds: ["studio", "neutral"],
    prompt: "Create an elegant female portrait with sophisticated styling, graceful pose, refined lighting, high-fashion aesthetic",
  },
  {
    id: 5,
    url: "https://gxwtcdplfkjfidwyrunk.supabase.co/storage/v1/object/public/example-images/image_101.jpg",
    badge: null,
    gender: "both",
    styles: ["casual"],
    backgrounds: ["neutral", "studio"],
    prompt: "Create a casual portrait with relaxed clothing, friendly expression, natural lighting, approachable style",
  },
  {
    id: 6,
    url: "https://gxwtcdplfkjfidwyrunk.supabase.co/storage/v1/object/public/example-images/image_102.jpg",
    badge: "premium",
    gender: "both",
    styles: ["professional", "elegant"],
    backgrounds: ["studio", "office"],
    prompt: "Create a premium professional portrait with refined styling, confident pose, premium lighting, executive presence",
  },
];

// Helper function to filter images by gender and style
export function filterExampleImages(
  images: ExampleImage[],
  gender: "man" | "woman",
  selectedStyles: string[],
  selectedBackgrounds: string[]
): ExampleImage[] {
  return images.filter((img) => {
    // Filter by gender (must match or be "both")
    if (img.gender !== "both" && img.gender !== gender) {
      return false;
    }

    // Filter by style (if styles are selected, image must match at least one)
    if (selectedStyles.length > 0) {
      const hasMatchingStyle = img.styles.some((style) =>
        selectedStyles.includes(style)
      );
      if (!hasMatchingStyle) {
        return false;
      }
    }

    // Filter by background (if backgrounds are selected, image should work with at least one)
    if (selectedBackgrounds.length > 0) {
      const hasMatchingBackground = img.backgrounds.some((bg) =>
        selectedBackgrounds.includes(bg)
      );
      if (!hasMatchingBackground) {
        return false;
      }
    }

    return true;
  });
}

